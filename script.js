// Inicialização do Mapa
const map = L.map('map').setView([-3.7678, -38.5365], 13);
const layerGroup = L.layerGroup().addTo(map);
let sondaMarker = null;
let isSondaActive = false;
let fixedSondaMarker = null;
let fixedSondaCircle = null;

// ✅ CORREÇÃO DEFINITIVA DO ERRO 403 — ArcGIS/Esri (sem bloqueio)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri — Source: Esri, DeLorme, NAVTEQ',
    maxZoom: 19
}).addTo(map);

// Busca dados da API com fallback de simulação
async function fetchPosto(numero) {
    const API_URL = `http://gistapis.etufor.ce.gov.br:8081/api/postoControle/${numero}`;
    try {
        const resp = await fetch(API_URL);
        if (!resp.ok) throw new Error(`Erro na API: ${resp.status}`);
        return await resp.json();
    } catch (e) {
        console.warn('API indisponível — usando dados simulados:', e.message);
        // Fallback automático
        return {
            latitude: -3.7317 + (numero % 10) * 0.003,
            longitude: -38.5267 + (numero % 10) * 0.003,
            nome: `Posto ${numero} (MODO SIMULADO)`,
            raio: 150
        };
    }
}

function desenharRaios(lat, lng, nome, rApi, rEntrada, rSaida, tipo) {
    // Limpa camadas do mesmo tipo
    layerGroup.eachLayer(l => {
        if (l.options.tipo === tipo) layerGroup.removeLayer(l);
    });

    const cor = tipo === 'gist' ? 'blue' : 'green';

    // Marcador central
    L.circleMarker([lat, lng], { color: cor, radius: 8, tipo: tipo })
        .addTo(layerGroup)
        .bindPopup(`<b>${nome}</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);

    // Círculos de raio
    if (rApi > 0) {
        L.circle([lat, lng], { radius: rApi, color: 'blue', weight: 1, dashArray: '5,5', fill: false, tipo: tipo }).addTo(layerGroup);
    }
    L.circle([lat, lng], { radius: rEntrada, color: 'red', weight: 2, fillOpacity: 0.1, tipo: tipo }).addTo(layerGroup);
    L.circle([lat, lng], { radius: rSaida, color: 'orange', weight: 2, fillOpacity: 0.05, tipo: tipo }).addTo(layerGroup);

    // Atualiza painel
    document.getElementById('nomePosto').innerText = nome;
    document.getElementById('coordPosto').innerText = `Lat: ${lat.toFixed(6)} | Lng: ${lng.toFixed(6)}`;
    document.getElementById('raioPosto').innerText = `API: ${rApi}m | Ent: ${rEntrada}m | Saí: ${rSaida}m`;

    map.setView([lat, lng], 16);
}

// Clique no mapa → ponto manual
map.on('click', (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const rE = parseInt(document.getElementById('raioEntrada').value) || 100;
    const rS = parseInt(document.getElementById('raioSaida').value) || 200;

    document.getElementById('latInput').value = lat.toFixed(6);
    document.getElementById('lngInput').value = lng.toFixed(6);
    desenharRaios(lat, lng, "Ponto Selecionado", 0, rE, rS, 'manual');
});

// Buscar posto por número
document.getElementById('btnBuscarPosto').addEventListener('click', async () => {
    const num = document.getElementById('postoInput').value;
    const rE = parseInt(document.getElementById('raioEntrada').value) || 100;
    const rS = parseInt(document.getElementById('raioSaida').value) || 200;

    if (!num) return alert("Digite o número do posto");

    const data = await fetchPosto(num);
    desenharRaios(data.latitude, data.longitude, data.nome, data.raio || 0, rE, rS, 'gist');
});

// Usar coordenadas digitadas
document.getElementById('btnUsarLatLng').addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('latInput').value);
    const lng = parseFloat(document.getElementById('lngInput').value);
    const rE = parseInt(document.getElementById('raioEntrada').value) || 100;
    const rS = parseInt(document.getElementById('raioSaida').value) || 200;

    if (isNaN(lat) || isNaN(lng)) return alert("Coordenadas inválidas");
    desenharRaios(lat, lng, "Ponto Manual", 0, rE, rS, 'manual');
});

// Sonda (rastreamento do mouse)
function initializeSonda() {
    const icon = L.divIcon({
        className: '',
        html: '<span class="sonda-marker"></span>',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
    sondaMarker = L.marker([0, 0], { icon: icon, interactive: false }).addTo(map);
    sondaMarker.setOpacity(0);
}

document.getElementById('toggleSonda').addEventListener('click', () => {
    isSondaActive = !isSondaActive;
    if (!isSondaActive) {
        sondaMarker.setOpacity(0);
        document.getElementById('sondaLat').innerText = "Desativada";
        document.getElementById('sondaLng').innerText = "Desativada";
    } else {
        sondaMarker.setOpacity(1);
    }
});

map.on('mousemove', (e) => {
    if (!isSondaActive) return;
    sondaMarker.setLatLng(e.latlng);
    document.getElementById('sondaLat').innerText = e.latlng.lat.toFixed(6);
    document.getElementById('sondaLng').innerText = e.latlng.lng.toFixed(6);
});

// Marcação fixa com botão direito
map.on('contextmenu', (e) => {
    if (fixedSondaMarker) map.removeLayer(fixedSondaMarker);
    if (fixedSondaCircle) map.removeLayer(fixedSondaCircle);

    const raio = parseInt(document.getElementById('raioSonda').value) || 100;
    fixedSondaMarker = L.circleMarker(e.latlng, { radius: 5, color: 'purple' }).addTo(map);
    fixedSondaCircle = L.circle(e.latlng, { radius: raio, color: 'purple', weight: 1, fillOpacity: 0.1 }).addTo(map);
});

initializeSonda();
