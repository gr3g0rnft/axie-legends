// ============================================================
// SISTEMA DE IDIOMAS — Axie Legends
// ============================================================
// Uso:
//   import { t, setIdioma, getIdioma } from '../config/idiomas.js';
//   t('menu.play')      → devuelve el texto traducido
//   setIdioma('es')     → cambia el idioma a español
//   getIdioma()         → devuelve el idioma actual
// ============================================================

const TRADUCCIONES = {
    en: {
        // Menú principal
        'menu.subtitle':    'Let the battle begin!',
        'menu.play':        '▶ PLAY',
        'menu.guide':       '📖 GUIDE',
        'menu.options':     '⚙️ OPTIONS',
        'menu.patch':       '📜 PATCH',
        'menu.lang_es':     '🇪🇸 ES',
        'menu.lang_en':     '🇬🇧 EN',

        // Modal de selección de Axie
        'axie.select_title':    'SELECT YOUR AXIE',
        'axie.subtitle':      'Duel 1 vs 1',
        'axie.start_match':   '⚔️ START MATCH',
        'axie.stats_hp':      'HP',
        'axie.stats_atk':     'ATK',
        'axie.stats_def':     'DEF',
        'axie.stats_spd':     'SPD',
        'axie.stats_range':   'RANGE',
        'axie.stats_as':      'AS',
        'axie.stats_mana':    'MANA',
        'axie.axie_core':     'AXIE CORE',
        'axie.locked':        'LOCKED',
        'axie.play_button':     'PLAY',

        // Modos (para ML.4)
        'modes.select_title':   'SELECT GAME MODE',
        'modes.1v1_title':      '1 vs 1 (Player vs IA)',
        'modes.1v1_desc':       'Player vs AI',
        'modes.ia_title':       '1 vs 1 (IA training MODE)',
        'modes.ia_desc':        'Training mode',
        'modes.pvp_title':      '1 vs 1 (PVP)',
        'modes.pvp_desc':       'Coming Soon',
        'modes.5v5_title':      '5 vs 5 (PVP)',
        'modes.5v5_desc':       'Coming Soon',
        'modes.locked':         '🔒 LOCKED',
        'modes.play':           '▶ PLAY',
        'modes.train':          '▶ TRAIN',

        // HUD del juego
        'hud.level':            'Lv.',
        'hud.potions':          'POTIONS',
        'hud.items':            'ITEMS',
        'hud.camera_locked':    '🔒 Camera: Locked',
        'hud.camera_semi':      '🎥 Camera: Semi-free',
        'hud.camera_free':      '🆓 Camera: Free',
        'axiecore.type':        'Type',
        'axiecore.mouth':       'Mouth',
        'axiecore.ears':        'Ears',
        'axiecore.back':        'Back',
        'axiecore.tail':        'Tail',
        'axiecore.total':       'TOTAL',
        'marker.attack':        'Attack Damage',
        'marker.phys_def':      'Physical Defense',
        'marker.mag_def':       'Magic Defense',
        'marker.atk_speed':     'Atk Speed',
        'marker.range':         'Range',
        'marker.health':        'Health',
        'marker.gold':          'Gold',
        'marker.deaths':        'Deaths',
        'marker.towers':        'Towers standing',
        'marker.kills':         'Kills',

        // Menú de pausa
        'pause.title':      'PAUSE',
        'pause.audio':      'AUDIO',
        'pause.music':      'Music',
        'pause.sfx':        'SFX',
        'pause.master':     'Master',
        'pause.mute_music': '🔇 Music',
        'pause.mute_sfx':   '🔇 SFX',
        'pause.mute_all':   '🔇 All',
        'pause.unmute_music': '🔊 Music',
        'pause.unmute_sfx':   '🔊 SFX',
        'pause.unmute_all':   '🔊 All',
        'pause.back':       '🚪 Back to Home',
        'pause.resume':     '↩️ Resume',
        'pause.exit_ai':    '🚪 Exit to Menu',

        // Axie Core tooltip
        'axiecore.slot':            'Slot',
        'axiecore.current_bonus':   'Current bonus',
        'axiecore.as_type':         'As Type',
        'axiecore.as_part':         'As part (Mouth, Ears, etc.)',

        // Razas del Axie Core
        'race.bestia':      'Beast',
        'race.acuatico':    'Aquatic',
        'race.planta':      'Plant',
        'race.reptil':      'Reptile',
        'race.pajaro':      'Bird',
        'race.bicho':       'Bug',
        'race.mech':        'Mech',
        'race.amanecer':    'Dawn',
        'race.anochecer':   'Dusk',

        // Descripciones de las razas
        'race.desc.bestia':    'Increases critical hit chance (double damage).',
        'race.desc.acuatico':  'Increases the Axie movement speed.',
        'race.desc.planta':    'Increases max health and regeneration.',
        'race.desc.reptil':    'Increases physical defense (reduces damage).',
        'race.desc.pajaro':    'Increases attack speed (attacks faster).',
        'race.desc.bicho':     'Increases base attack damage.',
        'race.desc.mech':      'Increases the Axie max mana.',
        'race.desc.amanecer':  'Increases magic damage of abilities.',
        'race.desc.anochecer': 'Grants lifesteal (heal on damage).',

        // Tooltip de habilidad
        'ability.level':    'Current level',
        'ability.mana':     'Mana',
        'ability.cooldown': 'Cooldown',
        'ability.damage':   'Damage',
        'ability.range':    'Range',
        'ability.bonus':    'Bonus',
        'ability.next':     'Next level',

        // Target de estructuras
        'target.ally_tower':  'Ally Tower',
        'target.enemy_tower': 'Enemy Tower',
        'target.ally_nexus':  'Ally Nexus',
        'target.enemy_nexus': 'Enemy Nexus',
        'target.minion':      'Minion',
        'target.enemy_axie':  'Enemy Axie',
        'target.shop':        'Shop',

        // Tienda
        'shop.title':         'SHOP',
        'shop.potions_tab':   'Potions',
        'shop.items_tab':     'Items',
        'shop.hp_potion':     'HP Potion',
        'shop.mp_potion':     'MP Potion',
        'shop.hp_desc':       '+50 HP (click on HUD)',
        'shop.mp_desc':       '+50 MP (click on HUD)',
        'shop.buy':           'Buy',
        'shop.max':           'Max',
        'shop.no_gold':       'No gold',
        'shop.have':          'You have',

        // Items de la tienda
        'shop.item.hp.name':        'HP Potion',
        'shop.item.hp.desc':        '+50 HP (click on HUD)',
        'shop.item.mp.name':        'MP Potion',
        'shop.item.mp.desc':        '+50 MP (click on HUD)',
        'shop.item.botas.name':     'Boots',
        'shop.item.botas.desc':     '+10% movement speed',
        'shop.item.espada.name':    'Sword',
        'shop.item.espada.desc':    '+15% damage',
        'shop.item.arco.name':      'Bow',
        'shop.item.arco.desc':      '+12% attack speed',
        'shop.item.baculo.name':    'Staff',
        'shop.item.baculo.desc':    '+0.5 range',
        'shop.item.daga.name':      'Dagger',
        'shop.item.daga.desc':      '+10% speed, +8% damage',
        'shop.item.escudo.name':    'Shield',
        'shop.item.escudo.desc':    '+20 physical defense',
        'shop.item.pendientes.name':'Earrings',
        'shop.item.pendientes.desc':'+20 magic resist',

        // Descripciones de habilidades (Bing)
        'hab.bing.q.desc': 'Fires a plasma projectile at the target enemy.',
        'hab.bing.w.desc': 'Dashes to the target area, dealing area damage on impact.',
        'hab.bing.e.desc': 'Activates an overclocker that increases attack speed and damage.',
        'hab.bing.r.desc': 'Channels an infernal cannon firing 8 cone bursts over 2 seconds.',
        // Descripciones de habilidades (Kotaro)
        'hab.kotaro.q.desc': 'Dashes to the target, dealing a fast slash.',
        'hab.kotaro.w.desc': 'Deploys a blade guard that stuns nearby enemies.',
        'hab.kotaro.e.desc': 'Dancing with a thousand swords increases damage and crit chance.',
        'hab.kotaro.r.desc': 'Demon execution: deadly long-range strike.',

        // Victoria / Derrota
        'end.victory':        '🏆 YOU WIN 🏆',
        'end.defeat':         '💀 DEFEAT 💀',
        'end.victory_desc':   'You destroyed the Enemy Nexus!',
        'end.home':           '🏠 Back to Home',
    },
    es: {
        // Menú principal
        'menu.subtitle':    '¡Que comience la batalla!',
        'menu.play':        '▶ JUGAR',
        'menu.guide':       '📖 GUÍA',
        'menu.options':     '⚙️ OPCIONES',
        'menu.patch':       '📜 PARCHE',
        'menu.lang_es':     '🇪🇸 ES',
        'menu.lang_en':     '🇬🇧 EN',

        // Modal de selección de Axie
        'axie.select_title':    'ELIGE TU AXIE',
        'axie.subtitle':      'Duelo 1 vs 1',
        'axie.start_match':   '⚔️ COMENZAR PARTIDA',
        'axie.stats_hp':      'VIDA',
        'axie.stats_atk':     'ATAQUE',
        'axie.stats_def':     'DEFENSA',
        'axie.stats_spd':     'VELOCIDAD',
        'axie.stats_range':   'RANGO',
        'axie.stats_as':      'V.ATAQUE',
        'axie.stats_mana':    'MANÁ',
        'axie.axie_core':     'AXIE CORE',
        'axie.locked':        'BLOQUEADO',
        'axie.play_button':     'JUGAR',

        // Modos (para ML.4)
        'modes.select_title':   'SELECCIÓN DE JUEGO',
        'modes.1v1_title':      '1 vs 1 (Jugador vs IA)',
        'modes.1v1_desc':       'Jugador vs IA',
        'modes.ia_title':       '1 vs 1 (Modo Entrenamiento IA)',
        'modes.ia_desc':        'Modo entrenamiento',
        'modes.pvp_title':      '1 vs 1 (PVP)',
        'modes.pvp_desc':       'Próximamente',
        'modes.5v5_title':      '5 vs 5 (PVP)',
        'modes.5v5_desc':       'Próximamente',
        'modes.locked':         '🔒 BLOQUEADO',
        'modes.play':           '▶ JUGAR',
        'modes.train':          '▶ ENTRENAR',

        // HUD del juego
        'hud.level':            'Nv.',
        'hud.potions':          'POCIONES',
        'hud.items':            'OBJETOS',
        'hud.camera_locked':    '🔒 Cámara: Bloqueada',
        'hud.camera_semi':      '🎥 Cámara: Semi-libre',
        'hud.camera_free':      '🆓 Cámara: Libre',
        'axiecore.type':        'Tipo',
        'axiecore.mouth':       'Boca',
        'axiecore.ears':        'Orejas',
        'axiecore.back':        'Espalda',
        'axiecore.tail':        'Cola',
        'axiecore.total':       'TOTAL',
        'marker.attack':        'Daño de ataque',
        'marker.phys_def':      'Defensa física',
        'marker.mag_def':       'Defensa mágica',
        'marker.atk_speed':     'Vel. ataque',
        'marker.range':         'Rango',
        'marker.health':        'Vida',
        'marker.gold':          'Oro',
        'marker.deaths':        'Muertes',
        'marker.towers':        'Torres en pie',
        'marker.kills':         'Asesinatos',

        // Menú de pausa
        'pause.title':      'PAUSA',
        'pause.audio':      'AUDIO',
        'pause.music':      'Música',
        'pause.sfx':        'EFX',
        'pause.master':     'Master',
        'pause.mute_music': '🔇 Música',
        'pause.mute_sfx':   '🔇 Efectos',
        'pause.mute_all':   '🔇 Todo',
        'pause.unmute_music': '🔊 Música',
        'pause.unmute_sfx':   '🔊 Efectos',
        'pause.unmute_all':   '🔊 Todo',
        'pause.back':       '🚪 Volver al Inicio',
        'pause.resume':     '↩️ Reanudar',
        'pause.exit_ai':    '🚪 Salir al Menú',

        // Axie Core tooltip
        'axiecore.slot':            'Casilla',
        'axiecore.current_bonus':   'Bonus actual',
        'axiecore.as_type':         'Como Tipo',
        'axiecore.as_part':         'Como parte (Boca, Orejas, etc.)',

        // Razas del Axie Core
        'race.bestia':      'Bestia',
        'race.acuatico':    'Acuático',
        'race.planta':      'Planta',
        'race.reptil':      'Reptil',
        'race.pajaro':      'Pájaro',
        'race.bicho':       'Bicho',
        'race.mech':        'Mech',
        'race.amanecer':    'Amanecer',
        'race.anochecer':   'Anochecer',

        // Descripciones de las razas
        'race.desc.bestia':    'Aumenta la probabilidad de golpe crítico (doble daño).',
        'race.desc.acuatico':  'Aumenta la velocidad de movimiento del Axie.',
        'race.desc.planta':    'Aumenta la vida máxima y la regeneración.',
        'race.desc.reptil':    'Aumenta la defensa física (reduce daño).',
        'race.desc.pajaro':    'Aumenta la velocidad de ataque.',
        'race.desc.bicho':     'Aumenta el daño base de los ataques.',
        'race.desc.mech':      'Aumenta el maná máximo del Axie.',
        'race.desc.amanecer':  'Aumenta el daño mágico de las habilidades.',
        'race.desc.anochecer': 'Otorga vampirismo (recupera vida al dañar).',

        // Tooltip de habilidad
        'ability.level':    'Nivel actual',
        'ability.mana':     'Maná',
        'ability.cooldown': 'Cooldown',
        'ability.damage':   'Daño',
        'ability.range':    'Rango',
        'ability.bonus':    'Bonus',
        'ability.next':     'Siguiente nivel',

        // Target de estructuras
        'target.ally_tower':  'Torre Aliada',
        'target.enemy_tower': 'Torre Enemiga',
        'target.ally_nexus':  'Nexo Aliado',
        'target.enemy_nexus': 'Nexo Enemigo',
        'target.minion':      'Minion',
        'target.enemy_axie':  'Axie Enemigo',
        'target.shop':        'Tienda',

        // Tienda
        'shop.title':         'TIENDA',
        'shop.potions_tab':   'Pociones',
        'shop.items_tab':     'Items',
        'shop.hp_potion':     'Poción de HP',
        'shop.mp_potion':     'Poción de MP',
        'shop.hp_desc':       '+50 HP (click en HUD)',
        'shop.mp_desc':       '+50 MP (click en HUD)',
        'shop.buy':           'Comprar',
        'shop.max':           'Máximo',
        'shop.no_gold':       'Sin oro',
        'shop.have':          'Tienes',

        // Items de la tienda
        'shop.item.hp.name':        'Poción de HP',
        'shop.item.hp.desc':        '+50 HP (click en HUD)',
        'shop.item.mp.name':        'Poción de MP',
        'shop.item.mp.desc':        '+50 MP (click en HUD)',
        'shop.item.botas.name':     'Botas',
        'shop.item.botas.desc':     '+10% velocidad',
        'shop.item.espada.name':    'Espada',
        'shop.item.espada.desc':    '+15% daño',
        'shop.item.arco.name':      'Arco',
        'shop.item.arco.desc':      '+12% vel. ataque',
        'shop.item.baculo.name':    'Báculo',
        'shop.item.baculo.desc':    '+0.5 rango',
        'shop.item.daga.name':      'Daga',
        'shop.item.daga.desc':      '+10% vel, +8% daño',
        'shop.item.escudo.name':    'Escudo',
        'shop.item.escudo.desc':    '+20 defensa física',
        'shop.item.pendientes.name':'Pendientes',
        'shop.item.pendientes.desc':'+20 defensa mágica',

        // Descripciones de habilidades (Bing)
        'hab.bing.q.desc': 'Dispara un proyectil de plasma hacia el enemigo objetivo.',
        'hab.bing.w.desc': 'Salta hacia la zona apuntada y hace daño en área al aterrizar.',
        'hab.bing.e.desc': 'Activa un sobrecargador que aumenta la velocidad de ataque y el daño.',
        'hab.bing.r.desc': 'Canaliza un cañón infernal que dispara 8 ráfagas en cono durante 2 segundos.',
        // Descripciones de habilidades (Kotaro)
        'hab.kotaro.q.desc': 'Se lanza contra el objetivo provocando un corte rápido.',
        'hab.kotaro.w.desc': 'Despliega una guardia de cuchillas que aturde a enemigos cercanos.',
        'hab.kotaro.e.desc': 'Bailar de mil espadas aumenta daño y probabilidad de crítico.',
        'hab.kotaro.r.desc': 'Ejecución demoníaca: golpe mortal de largo alcance.',

        // Victoria / Derrota
        'end.victory':        '🏆 GANASTE 🏆',
        'end.defeat':         '💀 DERROTA 💀',
        'end.victory_desc':   '¡Has destruido el Nexo Enemigo!',
        'end.home':           '🏠 Ir a Inicio',
    }
};

// Idioma actual (INGLÉS por defecto)
let idiomaActual = 'en';

// Devuelve el idioma actual
export function getIdioma() {
    return idiomaActual;
}

// Cambia el idioma
export function setIdioma(nuevoIdioma) {
    if (nuevoIdioma !== 'en' && nuevoIdioma !== 'es') {
        console.warn('⚠️ Idioma no soportado:', nuevoIdioma);
        return;
    }
    idiomaActual = nuevoIdioma;
    console.log('🌐 Idioma cambiado a:', idiomaActual);
}

// Traduce una clave al idioma actual
export function t(clave) {
    const traduccion = TRADUCCIONES[idiomaActual];
    if (!traduccion) return clave;
    const texto = traduccion[clave];
    if (texto === undefined) {
        console.warn('⚠️ Clave de idioma no encontrada:', clave);
        return clave;
    }
    return texto;
}

// Devuelve todas las traducciones (por si se necesitan)
export function getTraducciones() {
    return TRADUCCIONES;
}
