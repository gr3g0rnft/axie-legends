// =============================================
// CATÁLOGO DE HABILIDADES POR AXIE (Q / W / E / R)
// =============================================

export const HABILIDADES_POR_AXIE = {
    bing: {
        q: {
            tecla: 'Q',
            nombre: 'Plasma Blast',
            icono: 'assets/habilidades/bing_q_plasma_blast.jpg',
            color: '#0ff',
            tipo: 'area',
            mana: 30,
            cooldown: 5.0,
            radio: 8.0,
            dano: 55,
            efecto: 'projectile'
        },
        w: {
            tecla: 'W',
            nombre: 'Thruster Dash',
            icono: 'assets/habilidades/bing_w_thruster_dash.jpg',
            color: '#ff6600',
            tipo: 'utilidad',
            mana: 25,
            cooldown: 10.0,
            alcance: 12.0,
            efecto: 'dash_back'
        },
        e: {
            tecla: 'E',
            nombre: 'Overclock',
            icono: 'assets/habilidades/bing_e_overclock.jpg',
            color: '#7cc8ff',
            tipo: 'utilidad',
            mana: 40,
            cooldown: 0,
            efecto: 'atk_speed_stack'
        },
        r: {
            tecla: 'R',
            nombre: 'Inferno Cannon',
            icono: 'assets/habilidades/bing_r_inferno_cannon.jpg',
            color: '#ff4400',
            tipo: 'area',
            mana: 100,
            cooldown: 80.0,
            radio: 10.0,
            dano: 120,
            efecto: 'dot'
        }
    },
    kotaro: {
        q: {
            tecla: 'Q',
            nombre: 'Flash Slash',
            icono: 'assets/habilidades/kotaro_q_flash_slash.jpg',
            color: '#88ccff',
            tipo: 'area',
            mana: 35,
            cooldown: 8.0,
            radio: 5.5,
            dano: 60,
            efecto: 'deep_cut'
        },
        w: {
            tecla: 'W',
            nombre: 'Blade Guard',
            icono: 'assets/habilidades/kotaro_w_blade_guard.jpg',
            color: '#ffcc88',
            tipo: 'utilidad',
            mana: 25,
            cooldown: 14.0,
            alcance: 4.0,
            efecto: 'stun_counter'
        },
        e: {
            tecla: 'E',
            nombre: 'Dance Thousand',
            icono: 'assets/habilidades/kotaro_e_dance.jpg',
            color: '#ff88cc',
            tipo: 'area',
            mana: 50,
            cooldown: 20.0,
            radio: 7.0,
            dano: 35,
            efecto: 'bleed_stack'
        },
        r: {
            tecla: 'R',
            nombre: 'Demon Execution',
            icono: 'assets/habilidades/kotaro_r_demon_execution.jpg',
            color: '#ff4444',
            tipo: 'utilidad',
            mana: 80,
            cooldown: 80.0,
            alcance: 12.0,
            efecto: 'execute_reset'
        }
    }
};

export const ORDEN_HABILIDADES = ['q','w','e','r'];

let axieActual = 'bing';

export function setAxieActual(id){
    axieActual = id;
}

export function getHabilidades(){
    const set = HABILIDADES_POR_AXIE[axieActual] || HABILIDADES_POR_AXIE.bing;
    return ORDEN_HABILIDADES.map(k => {
        const h = set[k];
        return h ? Object.assign({id:k}, h) : null;
    }).filter(Boolean);
}

export function getHabilidad(id){
    const set = HABILIDADES_POR_AXIE[axieActual] || HABILIDADES_POR_AXIE.bing;
    const h = set[id];
    return h ? Object.assign({id}, h) : null;
}

export function getHabilidadesSet(){ return HABILIDADES_POR_AXIE[axieActual] || HABILIDADES_POR_AXIE.bing; }
