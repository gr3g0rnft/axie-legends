// =============================================
// AXIE CORE — Sistema de 5 casillas de pasivas
// estilo Axie Classic
//
// Cada Axie tiene 5 partes corporales. Cada parte aporta un
// bonus pasivo según su raza. Los bonus se suman.
//
// Ejemplo: un Axie con 5 partes Bestia tiene +6% crítico.
// =============================================

// Las 9 razas y sus bonus característicos.
export const RAZAS = {
    bestia:     { nombre: 'Bestia',     emoji: '🐺', color: '#d4a76a', bonus: 'critico',    raza: 0.02, parte: 0.01 },
    acuatico:   { nombre: 'Acuático',   emoji: '💧', color: '#44aaff', bonus: 'velocidad',  raza: 0.04, parte: 0.02 },
    planta:     { nombre: 'Planta',     emoji: '🌿', color: '#44cc66', bonus: 'vida',       raza: 0.08, parte: 0.04 },
    reptil:     { nombre: 'Reptil',     emoji: '🦎', color: '#88aa44', bonus: 'defensa',    raza: 0.06, parte: 0.03 },
    pajaro:     { nombre: 'Pájaro',     emoji: '🐦', color: '#ffaa44', bonus: 'velAtaque',  raza: 0.06, parte: 0.03 },
    bicho:      { nombre: 'Bicho',      emoji: '🐛', color: '#bb8844', bonus: 'dano',       raza: 0.05, parte: 0.025 },
    mech:       { nombre: 'Mech',       emoji: '🤖', color: '#88aacc', bonus: 'mana',       raza: 0.10, parte: 0.05 },
    amanecer:   { nombre: 'Amanecer',   emoji: '☀️', color: '#ffcc44', bonus: 'danoMagico', raza: 0.06, parte: 0.03 },
    anochecer:  { nombre: 'Anochecer',  emoji: '🌙', color: '#8866cc', bonus: 'vampirismo', raza: 0.05, parte: 0.025 }
};

// Las 5 casillas de cada Axie.
export const CASILLAS = ['tipo', 'boca', 'orejas', 'espalda', 'cola'];

// Partes de cada Axie por id.
export const PARTES_POR_AXIE = {
    bing: {
        tipo:    'mech',
        boca:    'bestia',
        orejas:  'mech',
        espalda: 'bestia',
        cola:    'acuatico'
    },
    kotaro: {
        tipo:    'bestia',
        boca:    'bestia',
        orejas:  'bestia',
        espalda: 'bestia',
        cola:    'bestia'
    }
};

// Calcula los bonus totales de un Axie a partir de sus 5 partes.
export function calcularBonusAxie(axieId) {
    const partes = PARTES_POR_AXIE[axieId];
    if (!partes) return {};

    const bonusTotal = {};
    const razas = Object.keys(RAZAS);

    for (const razaId of razas) {
        const b = RAZAS[razaId].bonus;
        if (!bonusTotal[b]) bonusTotal[b] = 0;
    }

    for (const casilla of CASILLAS) {
        const razaDeEstaParte = partes[casilla];
        if (!razaDeEstaParte) continue;
        const raza = RAZAS[razaDeEstaParte];
        if (!raza) continue;

        const esTipo = (casilla === 'tipo');
        const valor = esTipo ? raza.raza : raza.parte;
        bonusTotal[raza.bonus] = (bonusTotal[raza.bonus] || 0) + valor;
    }

    return bonusTotal;
}

// Devuelve la lista de razas con sus datos para el HUD.
export function getRazasInfo() {
    return RAZAS;
}

// Devuelve las partes de un Axie concreto.
export function getPartesAxie(axieId) {
    return PARTES_POR_AXIE[axieId] || null;
}