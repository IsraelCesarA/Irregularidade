const map = L.map('map').setView([-3.7678, -38.5365], 13);
const layerGroup = L.layerGroup().addTo(map);
let sondaMarker = null;
let isSondaActive = false;
let fixedSondaMarker = null;
let fixedSondaCircle = null;

// CORREÇÃO DEFINITIVA DO ERRO 403:
// Usando ArcGIS/Esri World Street Map (Visual similar ao Google e sem bloqueio)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri — Source: Esri, DeLorme, NAVTEQ'
}).addTo(map);

async function fetchPosto(numero) {
    // CORRIGIDO: Adicionadas crases na URL da API
    const API_URL = `http://gistapis.etufor.ce.gov.br:8081/api/postoControle/${numero}`;
    try {
        const resp = await fetch(API_URL);
        if (!resp.ok) throw new Error("Erro API");
        return await resp.json();
    } catch (e) {
        // Simulação caso a API bloqueie o acesso (CORS/403)
        return {
            latitude: -3.7317 + (numero % 10) * 0.003,
            longitude: -38.5267 + (numero % 10) * 0.003,
            // CORRIGIDO: Adicionadas crases
            nome: `Posto ${numero} (MODO SIMULADO)`,
            raio: 150
        };
    }
}

function desenharRaios(lat, lng, nome, rApi, rEntrada, rSaida, tipo) {
    layerGroup.eachLayer(l => { if(l.options.tipo === tipo) layerGroup.removeLayer(l); });
    const color = (tipo === 'gist') ? 'blue' : 'green';
    
    L.circleMarker([lat, lng], { color: color, radius: 8, tipo: tipo })
        .addTo(layerGroup)
        // CORRIGIDO: Adicionadas crases e interpolação correta
        .bindPopup(`<b>${nome}</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);

    if (rApi > 0) {
        L.circle([lat, lng], { radius: rApi, color: 'blue', weight: 1, dashArray: '5,5', fill: false, tipo: tipo }).addTo(layerGroup);
    }
    L.circle([lat, lng], { radius: rEntrada, color: 'red', weight: 2, fillOpacity: 0.1, tipo: tipo }).addTo(layerGroup);
    L.circle([lat, lng], { radius: rSaida, color: 'orange', weight: 2, fillOpacity: 0.05, tipo: tipo }).addTo(layerGroup);

    document.getElementById('nomePosto').innerText = nome;
    // CORRIGIDO: Adicionadas crases
    document.getElementById('coordPosto').innerText = `Lat: ${lat.toFixed(6)} | Lng: ${lng.toFixed(6)}`;
    // CORRIGIDO: Adicionadas crases
    document.getElementById('raioPosto').innerText = `API: ${rApi}m | Ent: ${rEntrada}m | Sai: ${rSaida}m`;
    
    map.setView([lat, lng], 16);
}

map.on('click', (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const rE = parseInt(document.getElementById('raioEntrada').value) || 100;
    const rS = parseInt(document.getElementById('raioSaida').value) || 200;
    document.getElementById('latInput').value = lat.toFixed(6);
    document.getElementById('lngInput').value = lng.toFixed(6);
    desenharRaios(lat, lng, "Ponto Selecionado", 0, rE, rS, 'manual');
});

document.getElementById('btnBuscarPosto').addEventListener('click', async () => {
    const num = document.getElementById('postoInput').value;
    const rE = parseInt(document.getElementById('raioEntrada').value);
    const rS = parseInt(document.getElementById('raioSaida').value);
    if(!num) return alert("Digite o número do posto");
    const data = await fetchPosto(num);
    desenharRaios(data.latitude, data.longitude, data.nome, data.raio || 0, rE, rS, 'gist');
});

document.getElementById('btnUsarLatLng').addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('latInput').value);
    const lng = parseFloat(document.getElementById('lngInput').value);
    const rE = parseInt(document.getElementById('raioEntrada').value);
    const rS = parseInt(document.getElementById('raioSaida').value);
    if(isNaN(lat) || isNaN(lng)) return alert("Coordenadas inválidas");
    desenharRaios(lat, lng, "Ponto Manual", 0, rE, rS, 'manual');
});

function initializeSonda() {
    const icon = L.divIcon({ className: '', html: '', iconSize: [12,12], iconAnchor: [6,6] });
    sondaMarker = L.marker([0,0], { icon: icon, interactive: false }).addTo(map);
    sondaMarker.setOpacity(0);
}

document.getElementById('toggleSonda').addEventListener('click', () => {
    isSondaActive = !isSondaActive;
    if(!isSondaActive) {
        sondaMarker.setOpacity(0);
        document.getElementById('sondaLat').innerText = "Desativada";
        document.getElementById('sondaLng').innerText = "Desativada";
    }
});

map.on('mousemove', (e) => {
    if(!isSondaActive) return;
    sondaMarker.setLatLng(e.latlng).setOpacity(1);
    document.getElementById('sondaLat').innerText = e.latlng.lat.toFixed(6);
    document.getElementById('sondaLng').innerText = e.latlng.lng.toFixed(6);
});

map.on('contextmenu', (e) => {
    if(fixedSondaMarker) map.removeLayer(fixedSondaMarker);
    if(fixedSondaCircle) map.removeLayer(fixedSondaCircle);
    const raio = parseInt(document.getElementById('raioSonda').value);
    fixedSondaMarker = L.circleMarker(e.latlng, { radius: 5, color: 'purple' }).addTo(map);
    fixedSondaCircle = L.circle(e.latlng, { radius: raio, color: 'purple', weight: 1, fillOpacity: 0.1 }).addTo(map);
});

initializeSonda();
