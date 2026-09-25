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
    bestia:     { nombre: 'Bestia',     emoji: '🐺', color: '#d4a76a', bonus: 'critico',    raza: 0.02, parte: 0.01, descripcion: 'Aumenta la probabilidad de golpe crítico (doble daño).' },
    acuatico:   { nombre: 'Acuático',   emoji: '💧', color: '#44aaff', bonus: 'velocidad',  raza: 0.04, parte: 0.02, descripcion: 'Aumenta la velocidad de movimiento del Axie.' },
    planta:     { nombre: 'Planta',     emoji: '🌿', color: '#44cc66', bonus: 'vida',       raza: 0.08, parte: 0.04, descripcion: 'Aumenta la vida máxima y la regeneración de vida.' },
    reptil:     { nombre: 'Reptil',     emoji: '🦎', color: '#88aa44', bonus: 'defensa',    raza: 0.06, parte: 0.03, descripcion: 'Aumenta la defensa física (reduce daño de minions y Axies).' },
    pajaro:     { nombre: 'Pájaro',     emoji: '🐦', color: '#ffaa44', bonus: 'velAtaque',  raza: 0.06, parte: 0.03, descripcion: 'Aumenta la velocidad de ataque (ataca más rápido).' },
    bicho:      { nombre: 'Bicho',      emoji: '🐛', color: '#bb8844', bonus: 'dano',       raza: 0.05, parte: 0.025, descripcion: 'Aumenta el daño base de los ataques.' },
    mech:       { nombre: 'Mech',       emoji: '🤖', color: '#88aacc', bonus: 'mana',       raza: 0.10, parte: 0.05, descripcion: 'Aumenta el maná máximo del Axie.' },
    amanecer:   { nombre: 'Amanecer',   emoji: '☀️', color: '#ffcc44', bonus: 'danoMagico', raza: 0.06, parte: 0.03, descripcion: 'Aumenta el daño mágico de las habilidades.' },
    anochecer:  { nombre: 'Anochecer',  emoji: '🌙', color: '#8866cc', bonus: 'vampirismo', raza: 0.05, parte: 0.025, descripcion: 'Otorga vampirismo (recupera vida al hacer daño).' }
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

// Descripciones de los tipos de bonus (para tooltips del TOTAL)
export const DESCRIPCIONES_BONUS = {
    critico:    'Probabilidad de hacer el doble de daño con un ataque básico.',
    velocidad:  'Velocidad de movimiento del Axie por el carril.',
    vida:       'Vida máxima del Axie (más resistente).',
    defensa:    'Reduce el daño físico recibido de minions y Axies.',
    velAtaque:  'Velocidad de ataque (más rápido = más golpes por segundo).',
    dano:       'Daño base de los ataques básicos.',
    mana:       'Maná máximo (permite usar más habilidades).',
    danoMagico: 'Daño adicional en las habilidades mágicas.',
    vampirismo: 'Recupera vida al hacer daño con ataques o habilidades.'
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