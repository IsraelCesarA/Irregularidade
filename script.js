// Inicialização do Mapa Leaflet
const mapa = L.map('mapa').setView([-3.73748, -38.5846], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap', maxZoom: 19
}).addTo(mapa);

// Variáveis Globais de Controle
let veiculos = { A: [], B: [] };
let numerosVeiculo = { A: 'A', B: 'B' };
let marcadoresVeiculo = { A: null, B: null };
let trajectories = { A: [], B: [] };
let velocidadeAnimacao = 1;
let tempoAtual = 0; 
let duracaoTotal = 0;
let intervaloAnimacao;
let animacaoEmAndamento = false;
let animacaoPausada = false;

let offsetA = 0;
let offsetB = 0;

// Objeto para armazenar as referências do DOM (Iniciados após carregamento da árvore HTML)
let el = {};

document.addEventListener("DOMContentLoaded", () => {
    el = {
        inicioProgA: document.getElementById('inicioProgramadoA'), 
        fimProgA: document.getElementById('fimProgramadoA'),
        inicioProgB: document.getElementById('inicioProgramadoB'), 
        fimProgB: document.getElementById('fimProgramadoB'),
        tituloA: document.getElementById('tituloA'), 
        tituloB: document.getElementById('tituloB'),
        numVeicA: document.getElementById('numVeicA'), 
        numVeicB: document.getElementById('numVeicB'),
        velA: document.getElementById('velA'), 
        horaA: document.getElementById('horaA'),
        velB: document.getElementById('velB'), 
        horaB: document.getElementById('horaB'),
        alerta: document.getElementById('alertaAnalise'), 
        btnAnimacao: document.getElementById('btnAnimacao'),
        arquivoA: document.getElementById('arquivoA'),
        arquivoB: document.getElementById('arquivoB')
    };

    // Mapeamento de Eventos (Substituindo os triggers inline do antigo HTML)
    el.arquivoA.addEventListener('change', (e) => carregarArquivo(e, 'A'));
    el.arquivoB.addEventListener('change', (e) => carregarArquivo(e, 'B'));
    el.btnAnimacao.addEventListener('click', alternarAnimacao);

    document.querySelectorAll('.btn-vel').forEach(botao => {
        botao.addEventListener('click', function() {
            const fator = parseInt(this.getAttribute('data-vel'));
            definirVelocidade(fator, this);
        });
    });
});

// Extrai numerais do nome do arquivo
function extrairNumeroVeiculo(nomeArquivo) {
    const semExtensao = nomeArquivo.replace('.json', '').replace('.csv', '');
    const match = semExtensao.match(/\d+/);
    return match ? match[0] : semExtensao;
}

function horarioParaMinutos(horario) {
    if (!horario) return null;
    const [h, m] = horario.split(':').map(Number);
    return h * 60 + m;
}

function definirVelocidade(fator, botao) {
    velocidadeAnimacao = fator;
    document.querySelectorAll('.btn-vel').forEach(b => b.classList.remove('ativo'));
    botao.classList.add('ativo');
    if (intervaloAnimacao && !animacaoPausada) { 
        clearInterval(intervaloAnimacao); 
        iniciarLoopAnimacao(); 
    }
}

// Interpolação baseada no Tempo Físico Relativo
function getPosicaoNoTempo(dados, tempo) {
    if (dados.length === 0) return null;
    if (tempo <= dados[0].tempoRelativoMinutos) return dados[0]; 
    if (tempo >= dados[dados.length - 1].tempoRelativoMinutos) return dados[dados.length - 1];

    let pAnt = dados[0], pProx = dados[dados.length - 1];
    
    for (let i = 0; i < dados.length - 1; i++) {
        if (tempo >= dados[i].tempoRelativoMinutos && tempo <= dados[i+1].tempoRelativoMinutos) {
            pAnt = dados[i]; pProx = dados[i+1]; break;
        }
    }

    const intervalo = pProx.tempoRelativoMinutos - pAnt.tempoRelativoMinutos;
    if (intervalo === 0) return pAnt;

    const fracao = (tempo - pAnt.tempoRelativoMinutos) / intervalo;
    let horarioStr = "--:--:--";
    
    if (pAnt.timestamp && pProx.timestamp) {
        const ts = pAnt.timestamp + (pProx.timestamp - pAnt.timestamp) * fracao;
        const date = new Date(ts * 1000);
        horarioStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    }

    return {
        latitude: pAnt.latitude + (pProx.latitude - pAnt.latitude) * fracao,
        longitude: pAnt.longitude + (pProx.longitude - pAnt.longitude) * fracao,
        velocidade: Math.round(pAnt.velocidade + (pProx.velocidade - pAnt.velocidade) * fracao),
        horario: horarioStr
    };
}

// Processamento de JSON ou de arquivo CSV com JSON embutido
function carregarArquivo(event, idVeiculo) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;
    
    const numero = extrairNumeroVeiculo(arquivo.name);
    numerosVeiculo[idVeiculo] = numero;
    if (idVeiculo === 'A') { 
        el.tituloA.textContent = `VEÍCULO ${numero}`; 
        el.numVeicA.textContent = `${numero} 🟥`; 
    } else { 
        el.tituloB.textContent = `VEÍCULO ${numero}`; 
        el.numVeicB.textContent = `${numero} 🟦`; 
    }

    const leitor = new FileReader();
    leitor.onload = function(e) {
        try {
            const texto = e.target.result;
            let arrayDados = null;
            
            if (texto.includes('Latitude') && texto.includes('[')) {
                const linhas = texto.split('\n');
                for (let linha of linhas) {
                    if (linha.trim().startsWith('[')) {
                        arrayDados = JSON.parse(linha);
                        break;
                    }
                }
            } else {
                arrayDados = JSON.parse(texto);
            }

            let dadosExtraidos = [];

            if (Array.isArray(arrayDados)) {
                arrayDados.forEach(item => {
                    const gps = item.avlHeader?.gps?.[0];
                    if (gps) {
                        dadosExtraidos.push({
                            latitude: gps.latitude / 360000,
                            longitude: gps.longitude / 360000,
                            velocidade: gps.velocidade || 0,
                            timestamp: item.timestamp
                        });
                    }
                });

                dadosExtraidos.sort((a, b) => a.timestamp - b.timestamp);

                if (dadosExtraidos.length > 0) {
                    const tempoInicial = dadosExtraidos[0].timestamp;
                    dadosExtraidos.forEach(p => {
                        p.tempoRelativoMinutos = (p.timestamp - tempoInicial) / 60;
                        const date = new Date(p.timestamp * 1000);
                        p.horario = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                    });
                }
            }

            veiculos[idVeiculo] = dadosExtraidos;
            document.getElementById(`status${idVeiculo}`).textContent = `✅ ${dadosExtraidos.length} pontos carregados | ${numero}`;
            
            if (dadosExtraidos.length > 0 && dadosExtraidos[0].timestamp) {
                const elInicio = idVeiculo === 'A' ? el.inicioProgA : el.inicioProgB;
                const elFim = idVeiculo === 'A' ? el.fimProgA : el.fimProgB;
                elInicio.value = dadosExtraidos[0].horario.substring(0, 5);
                elFim.value = dadosExtraidos[dadosExtraidos.length - 1].horario.substring(0, 5);
            }

        } catch (erro) { alert('Erro ao processar arquivo: ' + erro.message); }
    };
    leitor.readAsText(arquivo);
}

function alternarAnimacao() {
    if (!animacaoEmAndamento) {
        if (veiculos.A.length === 0 || veiculos.B.length === 0) { alert('Carregue os DOIS arquivos!'); return; }
        if (!el.inicioProgA.value || !el.fimProgA.value || !el.inicioProgB.value || !el.fimProgB.value) {
            alert('Os tempos não foram processados. Preencha ou carregue novamente.'); return;
        }

        const minA = horarioParaMinutos(el.inicioProgA.value);
        const minB = horarioParaMinutos(el.inicioProgB.value);
        const tempoInicialGlobal = Math.min(minA, minB);

        offsetA = minA - tempoInicialGlobal;
        offsetB = minB - tempoInicialGlobal;
        
        const duracaoA = veiculos.A[veiculos.A.length - 1].tempoRelativoMinutos;
        const duracaoB = veiculos.B[veiculos.B.length - 1].tempoRelativoMinutos;
        duracaoTotal = Math.max(duracaoA + offsetA, duracaoB + offsetB);

        if (marcadoresVeiculo.A) mapa.removeLayer(marcadoresVeiculo.A);
        if (marcadoresVeiculo.B) mapa.removeLayer(marcadoresVeiculo.B);
        trajectories.A.forEach(l => mapa.removeLayer(l)); trajectories.A = [];
        trajectories.B.forEach(l => mapa.removeLayer(l)); trajectories.B = [];
        tempoAtual = 0; el.alerta.style.display = 'none';

        const posInicialA = getPosicaoNoTempo(veiculos.A, 0);
        const posInicialB = getPosicaoNoTempo(veiculos.B, 0);

        marcadoresVeiculo.A = L.marker([posInicialA.latitude, posInicialA.longitude], {
            icon: L.divIcon({ className: 'icone-veiculo icone-a', html: numerosVeiculo.A, iconSize: [35,35] })
        }).addTo(mapa);
        marcadoresVeiculo.B = L.marker([posInicialB.latitude, posInicialB.longitude], {
            icon: L.divIcon({ className: 'icone-veiculo icone-b', html: numerosVeiculo.B, iconSize: [35,35] })
        }).addTo(mapa);

        animacaoEmAndamento = true; animacaoPausada = false;
        el.btnAnimacao.textContent = '⏸️ PAUSAR ANIMAÇÃO';
        el.btnAnimacao.classList.add('pausado');
        iniciarLoopAnimacao();
    } else {
        if (!animacaoPausada) {
            clearInterval(intervaloAnimacao);
            animacaoPausada = true;
            el.btnAnimacao.textContent = '▶️ CONTINUAR ANIMAÇÃO';
        } else {
            animacaoPausada = false;
            el.btnAnimacao.textContent = '⏸️ PAUSAR ANIMAÇÃO';
            iniciarLoopAnimacao();
        }
    }
}

function iniciarLoopAnimacao() {
    const taxaDeAtualizacaoMs = 250; 
    
    let posAnteriorA = getPosicaoNoTempo(veiculos.A, tempoAtual - offsetA);
    let posAnteriorB = getPosicaoNoTempo(veiculos.B, tempoAtual - offsetB);

    intervaloAnimacao = setInterval(() => {
        if (tempoAtual >= duracaoTotal) {
            clearInterval(intervaloAnimacao);
            animacaoEmAndamento = false; animacaoPausada = false;
            el.btnAnimacao.textContent = '🚀 INICIAR COMPARAÇÃO';
            el.btnAnimacao.classList.remove('pausado');
            return;
        }

        tempoAtual += (taxaDeAtualizacaoMs / 60000) * velocidadeAnimacao; 

        const tempoA = tempoAtual - offsetA;
        const tempoB = tempoAtual - offsetB;

        const posAtualA = getPosicaoNoTempo(veiculos.A, tempoA);
        const posAtualB = getPosicaoNoTempo(veiculos.B, tempoB);

        marcadoresVeiculo.A.setLatLng([posAtualA.latitude, posAtualA.longitude]);
        marcadoresVeiculo.B.setLatLng([posAtualB.latitude, posAtualB.longitude]);

        if (tempoA > 0 && posAnteriorA && posAtualA.latitude !== posAnteriorA.latitude) {
            trajectories.A.push(L.polyline([[posAnteriorA.latitude, posAnteriorA.longitude], [posAtualA.latitude, posAtualA.longitude]], {color:'#d32f2f', weight:3}).addTo(mapa));
        }
        if (tempoB > 0 && posAnteriorB && posAtualB.latitude !== posAnteriorB.latitude) {
            trajectories.B.push(L.polyline([[posAnteriorB.latitude, posAnteriorB.longitude], [posAtualB.latitude, posAtualB.longitude]], {color:'#1976d2', weight:3, dashArray:'5,5'}).addTo(mapa));
        }

        posAnteriorA = posAtualA; posAnteriorB = posAtualB;

        el.velA.textContent = tempoA >= 0 ? posAtualA.velocidade : 0;
        el.horaA.textContent = tempoA >= 0 ? posAtualA.horario : "Aguardando Partida...";

        el.velB.textContent = tempoB >= 0 ? posAtualB.velocidade : 0;
        el.horaB.textContent = tempoB >= 0 ? posAtualB.horario : "Aguardando Partida...";

        mapa.panTo([(posAtualA.latitude + posAtualB.latitude)/2, (posAtualA.longitude + posAtualB.longitude)/2]);

    }, taxaDeAtualizacaoMs);
}