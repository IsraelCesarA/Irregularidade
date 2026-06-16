* { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box; 
    font-family: Arial, sans-serif; 
}

#mapa { 
    width: 100%; 
    height: 550px; 
    border-radius: 8px; 
    box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
}

.cabecalho { 
    background: #0047AB; 
    color: white; 
    padding: 1rem; 
    text-align: center; 
}

nav ul { 
    list-style: none; 
    display: flex; 
    justify-content: center; 
    gap: 2rem; 
    margin-top: 1rem; 
}

nav a { 
    color: white; 
    text-decoration: none; 
    font-weight: bold; 
}

nav a:hover { 
    text-decoration: underline; 
}

.secao { 
    padding: 2rem 5%; 
    max-width: 1200px; 
    margin: 0 auto; 
}

.controles { 
    margin: 15px 0; 
    padding: 15px; 
    background: #f0f4f8; 
    border-radius: 8px; 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 15px; 
}

.card-veiculo { 
    padding: 10px; 
    border-radius: 6px; 
    color: white; 
    font-weight: bold; 
    text-align: center; 
}

.card-a { background: #d32f2f; }
.card-b { background: #1976d2; }

.horarios-programados { 
    background: #e8f5e9; 
    padding: 15px; 
    border-radius: 8px; 
    margin: 15px 0; 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 20px; 
    border: 2px solid #2e7d32; 
}

.bloco-veiculo { 
    display: flex; 
    flex-direction: column; 
    gap: 10px; 
}

.titulo-bloco { 
    font-weight: bold; 
    text-align: center; 
    padding: 5px; 
    border-radius: 4px; 
    color: white; 
}

.titulo-a { background: #d32f2f; }
.titulo-b { background: #1976d2; }

.campo-horario { 
    display: flex; 
    flex-direction: column; 
    gap: 5px; 
}

.campo-horario label { 
    font-weight: bold; 
    color: #2e7d32; 
}

.campo-horario input { 
    padding: 8px; 
    border: 1px solid #ccc; 
    border-radius: 4px; 
    font-size: 1em; 
}

.resultado-horario { 
    margin-top: 5px; 
    font-weight: bold; 
    padding: 4px 8px; 
    border-radius: 4px; 
    font-size: 0.9em; 
}

.adiantado { background: #c8e6c9; color: #2e7d32; }
.atrasado { background: #ffcdd2; color: #c62828; }
.no-prazo { background: #fff9c4; color: #f57f17; }

.controle-velocidade { 
    background: #e8f0fe; 
    padding: 10px; 
    border-radius: 6px; 
    margin: 10px 0; 
    text-align: center; 
}

.btn-vel { 
    padding: 5px 10px; 
    margin: 0 3px; 
    border: none; 
    border-radius: 4px; 
    cursor: pointer; 
    font-weight: bold; 
}

.btn-vel.ativo { 
    background: #0047AB; 
    color: white; 
}

.painel-dados { 
    display: grid; 
    grid-template-columns: 1fr auto 1fr; 
    gap: 10px; 
    margin: 15px 0; 
    padding: 12px; 
    background: #f8f9fa; 
    border-radius: 8px; 
    box-shadow: 0 -2px 6px rgba(0,0,0,0.05); 
}

.dados-a { 
    background: #ffebee; 
    border-left: 4px solid #d32f2f; 
    padding: 10px; 
    border-radius: 4px; 
}

.dados-b { 
    background: #e3f2fd; 
    border-left: 4px solid #1976d2; 
    padding: 10px; 
    border-radius: 4px; 
}

.separador { 
    display: flex; 
    align-items: center; 
    font-weight: bold; 
    color: #666; 
}

.dado-linha { 
    margin: 4px 0; 
    font-size: 0.95em; 
}

.valor-dado { 
    font-weight: bold; 
    font-size: 1.1em; 
}

.alerta { 
    background: #fff3cd; 
    color: #856404; 
    padding: 10px; 
    border-radius: 6px; 
    margin: 10px 0; 
    font-weight: bold; 
    display: none; 
}

.alerta.ok { background: #e8f5e9; color: #2e7d32; }

.icone-veiculo { 
    width: 35px; 
    height: 35px; 
    border-radius: 50%; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    color: white; 
    font-weight: bold; 
    font-size: 11px; 
    box-shadow: 0 0 4px rgba(0,0,0,0.5); 
    text-align: center; 
    line-height: 1.1; 
}

.icone-a { background: #d32f2f; }
.icone-b { background: #1976d2; }

.rodape { 
    background: #222; 
    color: white; 
    text-align: center; 
    padding: 1.5rem; 
    margin-top: 2rem; 
}

#btnAnimacao { 
    padding: 10px 20px; 
    background:#2e7d32; 
    color:white; 
    border:none; 
    border-radius:4px; 
    cursor:pointer; 
    font-size:1.1em; 
    width:100%; 
    margin-top:10px; 
    font-weight: bold; 
    transition: background 0.3s; 
}

#btnAnimacao.pausado { background: #f57f17; }
