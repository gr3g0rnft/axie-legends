// =============================================
// CATÁLOGO DE HABILIDADES POR AXIE (Q / W / E / R)
// Estilo League of Legends con 3 niveles por habilidad.
//
// Cada habilidad tiene:
//   - tipo: 'target' | 'area' | 'pasiva' | 'ultimate'
//   - icono, color, nombre, tecla
//   - niveles: { 1: {...}, 2: {...}, 3: {...} }
//     Cada nivel define: mana, cooldown, dano, rango, radio, etc.
//
// REGLAS DE SUBIDA (12 niveles de Axie):
//   Niveles 1, 2, 3    → Q, W o E (libre)
//   Nivel 4            → SOLO R (obligatorio)
//   Niveles 5, 6, 7    → Q, W o E
//   Nivel 8            → SOLO R (obligatorio)
//   Niveles 9, 10, 11  → Q, W o E
//   Nivel 12           → SOLO R (obligatorio)
//
// Los valores son provisionales. Se ajustarán cuando llegue el PvP.
// =============================================

export const HABILIDADES_POR_AXIE = {
    bing: {
        q: {
            tecla: 'Q',
            nombre: 'Plasma Blast',
            descripcion: 'Dispara un proyectil de plasma hacia el enemigo objetivo.',
            icono: 'assets/habilidades/bing_q_plasma_blast.jpg',
            color: '#0ff',
            tipo: 'target',
            niveles: {
                1: { mana: 30, cooldown: 5.0, rango: 6.0, dano: 55 },
                2: { mana: 35, cooldown: 4.5, rango: 6.5, dano: 85 },
                3: { mana: 40, cooldown: 4.0, rango: 7.0, dano: 120 }
            }
        },
        w: {
            tecla: 'W',
            nombre: 'Thruster Dash',
            descripcion: 'Salta hacia la zona apuntada y hace daño en área al aterrizar.',
            icono: 'assets/habilidades/bing_w_thruster_dash.jpg',
            color: '#ff6600',
            tipo: 'area',
            niveles: {
                1: { mana: 25, cooldown: 10.0, rango: 4.0, radio: 2.0, dano: 40 },
                2: { mana: 30, cooldown: 9.0,  rango: 4.0, radio: 2.3, dano: 65 },
                3: { mana: 35, cooldown: 8.0,  rango: 4.0, radio: 2.6, dano: 95 }
            }
        },
        e: {
            tecla: 'E',
            nombre: 'Overclock',
            descripcion: 'Activa un sobrecargador que aumenta la velocidad de ataque y el daño.',
            icono: 'assets/habilidades/bing_e_overclock.jpg',
            color: '#7cc8ff',
            tipo: 'pasiva',
            niveles: {
                1: { bonus: { atkSpeed: 0.10, dano: 0.05 } },
                2: { bonus: { atkSpeed: 0.18, dano: 0.10 } },
                3: { bonus: { atkSpeed: 0.28, dano: 0.16 } }
            }
        },
        r: {
            tecla: 'R',
            nombre: 'Inferno Cannon',
            descripcion: 'Canaliza un cañón infernal que dispara 8 ráfagas en cono durante 2 segundos.',
            icono: 'assets/habilidades/bing_r_inferno_cannon.jpg',
            color: '#ff4400',
            tipo: 'ultimate',
            subtipo: 'channel',
            niveles: {
                1: { mana: 100, cooldown: 80.0, rango: 7.0, angulo: 60, duracion: 2.0, rafagas: 8, danoPorRafaga: 15 },
                2: { mana: 100, cooldown: 70.0, rango: 8.0, angulo: 60, duracion: 2.0, rafagas: 8, danoPorRafaga: 25 },
                3: { mana: 100, cooldown: 60.0, rango: 9.0, angulo: 60, duracion: 2.0, rafagas: 8, danoPorRafaga: 40 }
            }
        }
    },
    kotaro: {
        q: {
            tecla: 'Q',
            nombre: 'Flash Slash',
            descripcion: 'Se lanza contra el objetivo provocando un corte rápido.',
            icono: 'assets/habilidades/kotaro_q_flash_slash.jpg',
            color: '#88ccff',
            tipo: 'target',
            niveles: {
                1: { mana: 35, cooldown: 8.0, rango: 2.2, dano: 60 },
                2: { mana: 40, cooldown: 7.0, rango: 2.5, dano: 90 },
                3: { mana: 45, cooldown: 6.0, rango: 2.8, dano: 130 }
            }
        },
        w: {
            tecla: 'W',
            nombre: 'Blade Guard',
            descripcion: 'Despliega una guardia de cuchillas que aturde a enemigos cercanos.',
            icono: 'assets/habilidades/kotaro_w_blade_guard.jpg',
            color: '#ffcc88',
            tipo: 'area',
            niveles: {
                1: { mana: 25, cooldown: 14.0, rango: 2.5, radio: 1.6, dano: 30, efecto: 'stun' },
                2: { mana: 30, cooldown: 12.0, rango: 2.8, radio: 1.8, dano: 50, efecto: 'stun' },
                3: { mana: 35, cooldown: 10.0, rango: 3.0, radio: 2.0, dano: 75, efecto: 'stun' }
            }
        },
        e: {
            tecla: 'E',
            nombre: 'Dance Thousand',
            descripcion: 'Bailar de mil espadas aumenta daño y probabilidad de crítico.',
            icono: 'assets/habilidades/kotaro_e_dance.jpg',
            color: '#ff88cc',
            tipo: 'pasiva',
            niveles: {
                1: { bonus: { dano: 0.08, critChance: 0.10 } },
                2: { bonus: { dano: 0.14, critChance: 0.18 } },
                3: { bonus: { dano: 0.22, critChance: 0.28 } }
            }
        },
        r: {
            tecla: 'R',
            nombre: 'Demon Execution',
            descripcion: 'Ejecución demoníaca: golpe mortal de largo alcance.',
            icono: 'assets/habilidades/kotaro_r_demon_execution.jpg',
            color: '#ff4444',
            tipo: 'ultimate',
            subtipo: 'target',
            niveles: {
                1: { mana: 80, cooldown: 80.0, rango: 3.0, dano: 200 },
                2: { mana: 90, cooldown: 70.0, rango: 3.5, dano: 300 },
                3: { mana: 100, cooldown: 60.0, rango: 4.0, dano: 420 }
            }
        }
    }
};

export const ORDEN_HABILIDADES = ['q','w','e','r'];

// Nivel máximo por tipo de habilidad
export const NIVEL_MAX_HABILIDAD = 3;

// Nivel de Axie en el que se desbloquea cada subida
// (índice = nivel de Axie, valor = qué se puede subir)
export const REGLAS_SUBIDA_POR_NIVEL = {
    1:  ['q', 'w', 'e'],
    2:  ['q', 'w', 'e'],
    3:  ['q', 'w', 'e'],
    4:  ['r'],
    5:  ['q', 'w', 'e'],
    6:  ['q', 'w', 'e'],
    7:  ['q', 'w', 'e'],
    8:  ['r'],
    9:  ['q', 'w', 'e'],
    10: ['q', 'w', 'e'],
    11: ['q', 'w', 'e'],
    12: ['r']
};

let axieActual = 'bing';

export function setAxieActual(id){
    axieActual = id;
}

export function getHabilidadesSet(){
    return HABILIDADES_POR_AXIE[axieActual] || HABILIDADES_POR_AXIE.bing;
}

// Devuelve la lista de habilidades del Axie actual, con id incluido.
// OJO: ahora los valores (mana, cooldown, dano, rango, radio) NO están
// directamente en la habilidad, sino dentro de `niveles[nivel]`. Para
// obtener los valores de un nivel concreto, usar `getHabilidadEnNivel`.
export function getHabilidades(){
    const set = getHabilidadesSet();
    return ORDEN_HABILIDADES.map(k => {
        const h = set[k];
        return h ? Object.assign({id:k}, h) : null;
    }).filter(Boolean);
}

// Devuelve una habilidad por id, con los datos base (sin nivel concreto).
export function getHabilidad(id){
    const set = getHabilidadesSet();
    const h = set[id];
    return h ? Object.assign({id}, h) : null;
}

// NUEVA: devuelve una habilidad con los valores de un nivel concreto.
// Ejemplo: getHabilidadEnNivel('q', 2) → { id:'q', nombre:'...',
//   mana:35, cooldown:4.5, rango:6.5, dano:85, ... }
export function getHabilidadEnNivel(id, nivel) {
    const hab = getHabilidad(id);
    if (!hab || !hab.niveles) return null;
    const n = Math.max(1, Math.min(NIVEL_MAX_HABILIDAD, nivel));
    const datosNivel = hab.niveles[n];
    if (!datosNivel) return null;
    // Copia la habilidad y le añade los valores del nivel
    return Object.assign({}, hab, datosNivel, { nivel: n });
}
