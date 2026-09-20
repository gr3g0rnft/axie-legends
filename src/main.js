import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MenuScreen } from './ui/MenuScreen.js';
import { getAxieById, getAllAxies, getPerfilCombate } from './config/axies.js';
import { getHabilidades, getHabilidad, setAxieActual } from './config/habilidades.js';
import { audio } from './audio/AudioManager.js';
import { initCombatSystem } from './systems/combat-controller.js';

// Inicializar sistema de combate (targeting LoL)
initCombatSystem();

function getAssetUrl(path) {
    const base = import.meta.env.BASE_URL || '/';
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const cleanBase = base.endsWith('/') ? base : base + '/';
    return cleanBase + cleanPath;
}

// 🔧 CORRECCIÓN 1: GLTFLoader compartido
const sharedGLTFLoader = new GLTFLoader();

const CONFIG = {
    gravedad: -20,
    velocidadSalto: 7,
    shadowMapSize: 256,
    pixelRatio: 1.2,
    updateInterval: 1,
    minionLimitZ: 26,
    camaraAngulo: 87,
    camaraDistancia: 20,
    camaraAltura: 16,
    // ===== EDITOR DE MAPA =====
    editorGridSize: 0.5,
    editorSnapEnabled: true,
    editorShowGrid: true,
    SPAWN_DELAY: 15,
    towerRange: 5,
    towerDamage: 20,
    towerFireRate: 1.5,
    projectileSpeed: 8,
    towerHealth: 500,
    nexusHealth: 1000,
    meleeSpacing: 1.1,
    mageSpacing: 0.9,
    meleeSpeed: 1.1,
    mageSpeed: 1.0,
    axieSpeed: 1.5,
    smoothSpeed: 2.5,
    cameraSmoothSpeed: 3.0,
    attackRange: 4.0,
    attackDamage: 15,
    attackSpeed: 0.7,
    agroRange: 12.0,
    reevaluationTime: 2.0,
    chaseTime: 3.0,
    playerMaxHealth: 200,
    playerMaxMana: 200,
    enemyMaxHealth: 200,
    RESPAWN_TIME: 3.0,
    AXIE_SPAWN_DELAY: 5.0,
    firstWaveGhostDuration: 28,
    SHOP_INTERACTION_DISTANCE: 6.0,
    SHOP_AUTO_OPEN_DISTANCE: 2.5,
    SHOP_POTION_LIMIT: 10,
    AXIE_SPAWN_TIME: 3.0,
    MINION_SPAWN_TIME: 15.0,
    SHOP_AUTO_OPEN_COOLDOWN: 1.5,
    // === CARRIL ===
    // El carril mide LANE_TARGET_WIDTH = 10 de ancho (=> +-5 desde el centro).
    // Antes los minions quedaban encerrados en +-2.0 (pasillo demasiado estrecho)
    // y los topes Z no coincidian con la posicion real de las torres
    // (torres aliadas en Z=-18 y Z=-6 / enemigas en Z=18 y Z=6; nexos en +-21).
    MINION_LANE_LIMIT_X: 4.0,        // ancho real util del carril (de 10 total)
    MINION_LANE_LIMIT_Z: 26.0,       // tope absoluto del carril (igual que
                                     // minionLimitZ: antes 25 y 26 no coincidian)
    // Los minions no se acercan mas alla del ultimo nexus (Z=+-21)
    MINION_MAX_Z_ALLY: -25.0,        // negativos = lado aliado
    MINION_MAX_Z_ENEMY: 25.0,        // positivos = lado enemigo
    AXIE_RETREAT_SAFE_DISTANCE: 1.5,
    AXIE_POTION_USE_THRESHOLD: 0.50,
    AXIE_POTION_BUY_THRESHOLD: 300,
    AXIE_MAX_POTIONS: 10,
    AXIE_POTION_HEAL: 80,
    AXIE_POTION_COST: 50,
    AXIE_RETREAT_MIN_TIME: 1.5,
    AXIE_RETREAT_COOLDOWN: 3.0,
    SPAWN_STAGGER_DELAY: 1.0,

    // Huecos laterales por tipo, en orden de preferencia: el primero
    // es el centro y el resto se abren hacia los extremos. El reparto
    // es por orden de llegada (ver reclamarSlot), no por indice fijo.
    MINION_SLOTS_MELEE: [0, -1.0, 1.0, -2.0, 2.0],
    MINION_SLOTS_MAGE: [0, -1.2, 1.2],

    // Separacion en profundidad entre la linea de melee y la de mage.
    // El mage se queda esta distancia por detras del melee mas
    // adelantado de su bando. Se baja de 2.2 a 1.5 para maxima agresion.
    MINION_MAGE_Z_OFFSET: 1.5,
    AXIE_SHOP_DAMAGE_MEMORY: 3.0,
    AXIE_SHOP_HP_MIN: 0.60,
    AXIE_SHOP_CANCEL_HP: 0.50,
    AXIE_SHOP_CANCEL_DAMAGE_MEMORY: 2.0,
    AXIE_SHOP_ENEMY_NEARBY_RADIUS: 6.0,
    MINION_AGGRO_TO_AXIE: 7.0,
    AXIE_AGGRO_TO_PLAYER: 10.0,
    MINION_AGGRO_RANGE: 10.0,
    MINION_AGGRO_RANGE_EXTENDED: 15.0,
    MAX_ITEM_SLOTS: 6,
    POTION_USE_COOLDOWN: 1.5,
    // Distancia al objetivo a la que el minion abre su slot lateral.
    // Se aumenta a 5.0 para que se desplieguen mucho antes de chocar.
    DEPLOY_TRIGGER_DIST: 5.0,
    MINION_TOWER_ATTACK_RANGE: 25,
    AXIES_BASE_PATH: `${import.meta.env.BASE_URL}assets/axies/`,
    MINION_GLB_MAGE_ENEMY: `${import.meta.env.BASE_URL}assets/minions/mage2_bone.glb`,
    MINION_GLB_MELEE_ENEMY: null,
    MAGE_GLB_WALK:   `${import.meta.env.BASE_URL}assets/minions/mage2_walk.glb`,
    MAGE_GLB_IDLE:   `${import.meta.env.BASE_URL}assets/minions/mage2_idle.glb`,
    MAGE_GLB_ATTACK: `${import.meta.env.BASE_URL}assets/minions/mage2_attack.glb`,
    MAGE_GLB_STAFF:  `${import.meta.env.BASE_URL}assets/weapons_minions/mage2_staff.glb`,
    // --- Combate de minions ---
    MINION_ATTACK_ANIM_TIME: 0.45,   // duracion visual del golpe (s)
    MINION_MELEE_LUNGE: 0.35,        // cuanto se lanza el melee hacia delante al golpear
    MINION_HIT_FLASH_TIME: 0.12,     // destello rojo al recibir dano
    MINION_ATTACK_RANGE_MELEE: 1.5,
    MINION_ATTACK_RANGE_MAGE: 4.0,
    TERRAIN_GLB_LANE: `${import.meta.env.BASE_URL}assets/terrain/carril_1.glb`,
    TOWER_GLB_ALLY: `${import.meta.env.BASE_URL}assets/tower/tower1.glb`,
    TOWER_GLB_ENEMY: `${import.meta.env.BASE_URL}assets/tower/tower2.glb`,
    TOWER_GLB_HEIGHT: 2.8,
    TOWER_GLB_SCALE_ALLY: 1.0,
    TOWER_GLB_SCALE_ENEMY: 1.3,
    TOWER_GLB_ROTATION_Y_ENEMY: Math.PI,
    TOWER_GLB_ROTATION_Y_ALLY: 0,
    NEXUS_GLB_ALLY: `${import.meta.env.BASE_URL}assets/nexus/nexus1.glb`,
    NEXUS_GLB_ENEMY: `${import.meta.env.BASE_URL}assets/nexus/nexus2.glb`,
    NEXUS_GLB_HEIGHT: 2.3,
    // Misma escala para ambos: con 1.0 el azul salia mas grande que el
    // rojo (0.85) y a simple vista desentonaban.
    NEXUS_GLB_SCALE_ALLY: 0.85,
    NEXUS_GLB_SCALE_ENEMY: 0.85,
    NEXUS_GLB_ROTATION_Y_ALLY: 0,
    NEXUS_GLB_ROTATION_Y_ENEMY: Math.PI,
    SHOP_GLB_ALLY: `${import.meta.env.BASE_URL}assets/shop/shop1.glb`,
    SHOP_GLB_ENEMY: `${import.meta.env.BASE_URL}assets/shop/shop2.glb`,
    SHOP_GLB_HEIGHT: 1.3,
    SHOP_GLB_SCALE_ALLY: 1.0,
    SHOP_GLB_SCALE_ENEMY: 1.0,
    SHOP_GLB_ROTATION_Y_ALLY: 0,
    SHOP_GLB_ROTATION_Y_ENEMY: 0,
    // --- Escala de los minions ---
    // El Axie mide 1.90 de alto. Los minions apuntan al 58% (~1.10),
    // que es la proporcion de LoL: el minion llega al pecho del campeon.
    // El modelo del melee esta construido a escala 1.0 = 1.10 de alto,
    // asi que esta constante es un multiplicador fino, no una altura.
    MINION_SCALE: 0.85,
    // Alto del modelo de minion a escala 1.0. Lo usa la barra de vida
    // para colocarse por encima de la cabeza.
    MINION_HEIGHT: 1.10,
    // Altura de la barra de vida sobre la cabeza del Axie del jugador.
    // El Axie mide ~1.9 de alto.
    AXIE_HEALTH_BAR_HEIGHT: 2.15,
    MINION_COLLISION_DISTANCE: 0.70,

    // --- Disparo de la torre ---
    // Cuanto se eleva el proyectil a mitad de camino. Con 0 el disparo va
    // recto y pegado al suelo; con 0.6 describe el arco clasico de LoL.
    TOWER_SHOT_ARC_HEIGHT: 0.6,

    // --- Minion grande (super minion) ---
    // Multiplicadores sobre un minion normal. Se limita el numero vivo
    // para no cargar memoria ni el bucle de colisiones.
    // 1.5 sobre el melee (1.125) da 1.69 de alto = 89% del Axie (1.90).
    // Medido con el arnes: impone presencia sin tapar al campeon.
    BIG_MINION_SCALE: 1.25,       // tamano visual
    BIG_MINION_HP_MULT: 3.0,      // resistencia sobre el melee base (100)
    BIG_MINION_DMG_MULT: 2.5,     // dano sobre el melee base (10)
    BIG_MINION_SPEED_MULT: 0.85,  // un poco mas lento: se le ve llegar
    BIG_MINION_MAX_ALIVE: 2,      // tope duro por bando
};

function getAxieModelPath(axieData) {
    if (!axieData) return CONFIG.AXIES_BASE_PATH + 'bing.glb';
    if (axieData.modelo && axieData.modelo.startsWith('/')) {
        if (axieData.modelo.includes('/axie-3d-assets/')) {
            const fileName = axieData.modelo.split('/').pop();
            return CONFIG.AXIES_BASE_PATH + fileName;
        }
        return axieData.modelo;
    }
    if (axieData.modelo) return CONFIG.AXIES_BASE_PATH + axieData.modelo;
    if (axieData.id) return CONFIG.AXIES_BASE_PATH + axieData.id + '.glb';
    return CONFIG.AXIES_BASE_PATH + 'bing.glb';
}

// ============================================================
// ARMAS DE LOS AXIES
// ------------------------------------------------------------
// Cada Axie tiene su GLB en config/axies.js (campo `arma`). El arma se cuelga
// del anclaje dedicado del rig, Weapon_R_JNT. Se comprobo que 6 de los 7 GLB
// tienen el pivote en la empuñadura, asi que encajan solos. Hay que compensar
// la escala interna del rig (Bing_Rig = 0.01) o el arma queda invisible.
// ============================================================
function findWeaponBone(root) {
    const huesos = [];
    root.traverse((n) => { if (n.isBone) huesos.push(n); });
    for (const clave of ['weapon_r_jnt', 'weapon_r', 'hand_r_jnt', 'hand_r']) {
        const hit = huesos.find(b => b.name.toLowerCase().includes(clave));
        if (hit) return hit;
    }
    return null;
}

function attachAxieWeapon(axieModel, axieData, esEnemigo = false) {
    if (!axieModel || !axieData) return;
    const armaPath = axieData.arma || null;
    if (!armaPath) return;

    sharedGLTFLoader.load(armaPath, (gltf) => {
        // bing-cannon es el unico GLB con malla ARTICULADA (SkinnedMesh con un
        // hueso, Cannon_JNT). Clonarla deja el clon apuntando al esqueleto
        // original y el canon no se renderiza. Los otros seis son mallas planas
        // y si toleran el clon.
        let tieneSkin = false;
        gltf.scene.traverse((n) => { if (n.isSkinnedMesh) tieneSkin = true; });
        const arma = tieneSkin ? gltf.scene : gltf.scene.clone(true);
        arma.traverse((n) => { if (n.isMesh) { n.castShadow = false; n.receiveShadow = false; } });

        // El arma se cuelga del hueso Weapon_R_JNT. Se comprobo que 6 de los 7
        // GLB traen el pivote en la empuñadura (Z al 100% del bbox), asi que
        // cuelgan solos en su sitio sin inventar posiciones a mano. La unica
        // trampa es la escala: el rig del Axie viene escalado (Bing_Rig = 0.01)
        // y el hueso la hereda, asi que hay que compensarla o el arma queda
        // 100x mas pequena e invisible.
        const hueso = findWeaponBone(axieModel);
        if (!hueso) {
            console.warn('Anclaje de arma no encontrado en ' + axieData.nombre + '; el Axie sale sin arma');
            return;
        }

        const wb = new THREE.Box3().setFromObject(arma);
        const ws = wb.getSize(new THREE.Vector3());
        const wMax = Math.max(ws.x, ws.y, ws.z) || 1;
        const altura = new THREE.Box3().setFromObject(axieModel).getSize(new THREE.Vector3()).y || 2;

        const escalaHueso = new THREE.Vector3();
        hueso.getWorldScale(escalaHueso);
        const factorPadre = escalaHueso.x || 1;
        // Factor por Axie desde el catalogo (config/axies.js) para poder
        // calibrar el tamano de cada arma sin tocar el motor.
        const perfil = getPerfilCombate(axieData.id);
        arma.scale.setScalar(((altura * perfil.factor) / wMax) / factorPadre);

        hueso.add(arma);
        // Desplazamiento por arma desde el catalogo: despega el arma del
        // cuerpo cuando el hueso la deja pegada o metida en el sombrero.
        // Se expresa en las unidades LOCALES del hueso (el arma ya lleva su
        // escala aplicada antes de anadirse como hija).
        const sep = perfil.separacion || [0, 0, 0];
        arma.position.set(sep[0] || 0, sep[1] || 0, sep[2] || 0);

        // El hueso hereda la rotacion del brazo, que va extendido, y eso deja el
        // eje Y local apuntando al suelo (medido: (+0.77, -0.64, -0.01)). El arma
        // salia clavada hacia las piernas. Se cancela el giro heredado para
        // devolverla a su orientacion natural (Z al frente en estos GLB).
        const rotHueso = new THREE.Quaternion();
        hueso.getWorldQuaternion(rotHueso);
        if (perfil.cancelarHueso) {
            // Caso Bing: su clip de combate trae el hueso del arma MAL animado
            // (medido en el GLB: Cannon.Idle [-0.497, 0.501, ...], Cannon.Walk
            // [-0.732, 0.015, ...]). No hay un angulo fijo que sirva para los
            // tres clips, asi que el arma NO hereda el hueso: se queda con la
            // orientacion natural que trae el GLB, que es la unica estable.
            arma.quaternion.identity();
        } else {
            // Resto de Axies: copiar (no invertir) la rotacion del hueso hace
            // que el arma siga el giro natural del brazo y apunte adonde mira
            // el personaje. Invertirla la dejaba clavada en una orientacion
            // fija del mundo: le funcionaba a Kotaro de casualidad, pero a
            // Bing le ponia el canon mirando a la espalda.
            arma.quaternion.copy(rotHueso);
        }
        if (perfil.giroArma) {
            arma.rotateY(THREE.MathUtils.degToRad(perfil.giroArma));
        }
        // El Axie enemigo se gira 180 grados para mirar hacia el jugador
        // (enemyAxieModel.rotation.y = PI). El arma cuelga del hueso, asi que
        // hereda ese giro: la misma calibracion que deja el arma bien en el
        // jugador la deja mirando al reves en el enemigo. Se deshace el giro
        // para que el arma del enemigo quede en la misma orientacion relativa
        // al cuerpo que la del jugador.
        if (esEnemigo) {
            arma.rotateY(Math.PI);
        }

        console.log('Arma de ' + axieData.nombre + ' en ' + hueso.name + ' (escala ' + arma.scale.x.toFixed(3) + ')' + (esEnemigo ? ' [enemigo]' : ''));
    }, undefined, (err) => {
        console.warn('No se pudo cargar el arma de ' + axieData.nombre + ': ' + (err && err.message ? err.message : err));
    });
}

// Reparto lateral por ORDEN DE LLEGADA.
//
// Cada minion llega a la zona de formacion y reclama el hueco libre mas
// cercano al centro de su tipo. El que llega antes coge antes:
//
//   llega 1.o      -> centro
//   llegan 2.o,3.o -> se abren a izquierda y derecha
//   llegan 4.o,5.o -> se meten junto al centro
//
// Antes el slot era fijo por indice, asi que el abanico nacia ya abierto
// en el nexo. Con la reclamacion el abanico crece desde el centro hacia
// fuera, que es lo que se ve natural.
function reclamarSlot(minion) {
    if (!minion || minion.slotReclamado) return;
    const esMelee = (minion.tipo === 'melee' || minion.esBig);
    const slots = esMelee ? CONFIG.MINION_SLOTS_MELEE : CONFIG.MINION_SLOTS_MAGE;
    // El slot base es por bando: el enemigo recorre el carril espejado.
    const signo = minion.isEnemy ? -1 : 1;
    const bando = minion.isEnemy ? enemigos : aliados;
    // Huecos ya cogidos por companeros vivos del mismo tipo.
    const cogidos = new Set();
    for (const otro of bando) {
        if (otro === minion || otro.isDead || !otro.slotReclamado) continue;
        if ((otro.tipo === 'melee' || otro.esBig) !== esMelee) continue;
        cogidos.add(otro.slotBase);
    }
    // Se recorre la lista de preferencia en orden: centro, lados, extremos.
    let elegido = slots[0];
    for (const s of slots) {
        if (!cogidos.has(s)) { elegido = s; break; }
    }
    minion.slotBase = elegido;
    minion.mySlotX = signo * elegido;
    minion.slotReclamado = true;
}

function clampMinionToLane(minion) {
    if (!minion || !minion.group) return;
    const limX = CONFIG.MINION_LANE_LIMIT_X;
    const limZ = CONFIG.MINION_LANE_LIMIT_Z;
    // Ancho del carril (evita que se salgan por los lados)
    if (minion.group.position.x > limX) minion.group.position.x = limX;
    else if (minion.group.position.x < -limX) minion.group.position.x = -limX;
    // Limite absoluto en Z (nunca salir del carril entero)
    if (minion.group.position.z > limZ) minion.group.position.z = limZ;
    else if (minion.group.position.z < -limZ) minion.group.position.z = -limZ;
    // Avance maximo por bando: los enemigos no pasan del nexo aliado (Z=-21)
    // y los aliados no pasan del nexo enemigo (Z=+21).
    //
    // OJO: el tope tiene que quedar POR DETRAS de la formacion de spawn.
    // Los mage nacen en Z=+-24.1 (nexo 21 + 2 filas de melee de 1.3 + 0.5),
    // asi que un tope de 22.5 los empujaba hacia dentro nada mas nacer: los
    // mage enemigos se quedaban apilados contra los melee, atrapados junto
    // al nexo. Ahora el tope es solo una red de seguridad por si algo los
    // empuja hacia fuera; la formacion cabe entera.
    const MAX_Z_ALLY = -25.5;
    const MAX_Z_ENEMY = 25.5;
    if (minion.isEnemy) {
        if (minion.group.position.z > MAX_Z_ENEMY) minion.group.position.z = MAX_Z_ENEMY;
    } else {
        if (minion.group.position.z < MAX_Z_ALLY) minion.group.position.z = MAX_Z_ALLY;
    }
}

const ECONOMY = {
    PLAYER_STARTING_GOLD: 100,
    REWARD_MINION_KILL: 12,
    REWARD_MAGE_KILL: 18,
    REWARD_TOWER_KILL: 60,
    REWARD_ENEMY_AXIE_KILL: 80,
    REWARD_NEXUS_KILL: 0,
    REWARD_WAVE_SURVIVED: 35,
    REWARD_FIRST_BLOOD: 25,
    STREAK_BONUS_PER_KILL: 3,
    STREAK_MAX_BONUS: 30,
    GOLD_POPUP_LIFETIME: 1.2,
    PENALTY_PLAYER_DEATH: 0,
};

// Z de la torre de tier 2 de cada bando. Hasta pasarla, los minions van
// en fila india y no abren el abanico. Constantes de MODULO: las usa
// Minion.update, no solo spawnWave.
const TORRE_2_ALIADA_Z = -6;
const TORRE_2_ENEMIGA_Z = 5.98;

const PLAYER_SHOP_CATALOG = {
    potions: {
        hp: { id: 'hp', emoji: '🧪', name: 'Poción de HP', desc: '+50 HP (click en HUD)', color: '#ff6644', cost: 25, max: 10,
            apply: () => { playerHealth = Math.min(playerMaxHealth, playerHealth + 50); updatePlayerHUD(); } },
        mp: { id: 'mp', emoji: '💧', name: 'Poción de MP', desc: '+50 MP (click en HUD)', color: '#44aaff', cost: 20, max: 10,
            apply: () => { playerMana = Math.min(playerMaxMana, playerMana + 50); updatePlayerHUD(); } }
    },
    items: {
        botas:  { id: 'botas',  emoji: '👢', name: 'Botas',  desc: '+10% velocidad',      color: '#88ff88', cost: 80,  apply: () => { playerSpeed *= 1.10; } },
        espada: { id: 'espada', emoji: '⚔️', name: 'Espada', desc: '+15% daño',           color: '#ff8844', cost: 100, apply: () => { attackDamage = Math.round(attackDamage * 1.15); } },
        arco:   { id: 'arco',   emoji: '🏹', name: 'Arco',   desc: '+12% vel. ataque',    color: '#ffaa44', cost: 90,  apply: () => { attackSpeed = Math.max(0.2, attackSpeed * 0.88); } },
        baculo: { id: 'baculo', emoji: '🔮', name: 'Báculo', desc: '+0.5 rango',          color: '#aa88ff', cost: 110, apply: () => { attackRange += 0.5; } },
        daga:   { id: 'daga',   emoji: '🗡️', name: 'Daga',   desc: '+10% vel, +8% daño', color: '#ff4488', cost: 95,  apply: () => { playerSpeed *= 1.10; attackDamage = Math.round(attackDamage * 1.08); } },
        escudo:   { id: 'escudo',   emoji: '🛡️', name: 'Escudo',   desc: '+20 defensa fisica', color: '#aabbdd', cost: 105, apply: () => { playerArmor += 20; updatePlayerHUD(); } },
        pendientes: { id: 'pendientes', emoji: '📿', name: 'Pendientes', desc: '+20 defensa magica', color: '#cc88ff', cost: 105, apply: () => { playerMagicResist += 20; updatePlayerHUD(); } }
    }
};

let playerGold = 0;
let playerKillStreak = 0;
let playerFirstBlood = false;
let playerItemSlots = [null, null, null, null, null, null];
let playerDeathCount = 0;
const PLAYER_DEATH_PENALTIES = [3, 6, 9];

if (!document.getElementById('gold-popup-styles')) {
    const style = document.createElement('style');
    style.id = 'gold-popup-styles';
    style.textContent = `
        @keyframes goldPopupFloat {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            20% { opacity: 1; transform: translate(-50%, -70%) scale(1.2); }
            100% { opacity: 0; transform: translate(-50%, -150%) scale(1); }
        }
    `;
    document.head.appendChild(style);
}

let GROUND_Y = -0.35;
let LANE_TOP_Y = -0.35;
let groundReady = false;

function suavizarYEntidades(delta) {
    if (!groundReady) return;
    const factor = Math.min(1, 6 * delta);
    const allEntities = [...aliados, ...enemigos, ...towers, nexusAliado, nexusEnemigo, shopAliada, shopEnemiga].filter(e => e && e.group && !e.isDead);
    for (const entity of allEntities) {
        const diff = GROUND_Y - entity.group.position.y;
        if (Math.abs(diff) > 0.001) entity.group.position.y += diff * factor;
        else entity.group.position.y = GROUND_Y;
    }
    if (playerModel && !isPlayerDead && smoothPlayerPos && playerSpawned) {
        smoothPlayerPos.y = GROUND_Y;
        playerModel.position.y = GROUND_Y;
    }
}

let playerHealth = CONFIG.playerMaxHealth;
let playerHealthSprite = null;   // barra 3D sobre la cabeza del Axie
let playerMaxHealth = CONFIG.playerMaxHealth;
let playerMana = CONFIG.playerMaxMana;
let playerMaxMana = CONFIG.playerMaxMana;
let isPlayerDead = false;
let playerRespawnTimer = 0;
let playerAttackTarget = null;
let playerSpawned = false;
let gameTime = 0;
let isFirstWave = true;
let firstWaveTimer = 0;
let gameFinished = false;
let victoryScreen = null;
let defeatScreen = null;
let gamePaused = false;
let pauseMenu = null;
let selectedAxieId = 'bing';
let axieLoaded = false;
let currentAxieName = 'Bing';
let potionHPCount = 0;
let potionMPCount = 0;
let potionUseCooldown = 0;
let isAutoWalkingToShop = false;
let autoWalkShopTarget = null;

const factionFocusTarget = {
    ally: { target: null, count: 0, timestamp: 0 },
    enemy: { target: null, count: 0, timestamp: 0 }
};
const FOCUS_FIRE_MAX = 4;

function registerFactionAttack(faction, target) {
    const focus = factionFocusTarget[faction];
    if (!target) return;
    if (focus.target === target) focus.count++;
    else { focus.target = target; focus.count = 1; }
    focus.timestamp = gameTime;
}

function getFactionFocusCount(faction, target) {
    const focus = factionFocusTarget[faction];
    if (focus.target !== target) return 0;
    if (gameTime - focus.timestamp > 3.0) { focus.count = 0; return 0; }
    return focus.count;
}

let isAITrainingMode = false;
let aiTrainingMatches = 0;
let aiTrainingStartTime = 0;
let aiTrainingAutoRestartTimer = 0;
let aiTrainingIsRestarting = false;
let playerAITarget = null;
let playerAITargetTimer = 0;

let dynamicCameraTarget = null;
let dynamicCameraTimer = 0;
let dynamicCameraMode = 'player';
let dynamicCameraSmoothPos = new THREE.Vector3(0, 0, 0);
let dynamicCameraSmoothTarget = new THREE.Vector3(0, 0, 0);
let dynamicCameraInitialized = false;
let dynamicCameraLastSwitch = 0;
const DYNAMIC_CAMERA_PLAYER_DURATION = [10, 18];
const DYNAMIC_CAMERA_ENEMY_DURATION = [10, 18];
const DYNAMIC_CAMERA_IDLE_DURATION = [4, 8];
const DYNAMIC_CAMERA_MIN_HOLD = 8;

let playerAIGold = 0;
let playerAIItems = {};
let playerAIBonuses = { speedMultiplier: 1.0, damageMultiplier: 1.0, attackSpeedMultiplier: 1.0, rangeBonus: 0, critChance: 0 };
let playerAIShopCooldown = 0;
let playerAIShopUses = 0;
const PLAYER_AI_SHOP_COOLDOWN = 8.0;
const PLAYER_AI_SHOP_MAX_USES = 3;
let playerAIIsShopping = false;
let playerAIShopInteractionTimer = 0;

const PLAYER_GOLD_PER_MINION_KILL = 15;
const PLAYER_GOLD_PER_ENEMY_AXIE_KILL = 50;
const PLAYER_GOLD_PER_TOWER_KILL = 80;
const PLAYER_GOLD_PER_NEXUS_KILL = 150;
const PLAYER_GOLD_PASSIVE_PER_WAVE = 25;

let enemyAxieLastDamageTime = -999;
let enemyAxieRetreatTimer = 0;
let enemyAxieIsRetreating = false;
let enemyAxieRetreatCooldown = 0;
const ENEMY_AXIE_RETREAT_DURATION = 2.5;
const ENEMY_AXIE_DAMAGE_MEMORY = 2.0;
const ENEMY_AXIE_RETREAT_TOWER_RANGE = 6.5;

let playerAILastDamageTime = -999;
let playerAIRetreatTimer = 0;
let playerAIIsRetreating = false;
let playerAIRetreatCooldown = 0;
const PLAYER_AI_RETREAT_DURATION = 2.5;
const PLAYER_AI_DAMAGE_MEMORY = 2.0;
const PLAYER_AI_RETREAT_TOWER_RANGE = 6.5;

const factionBrain = {
    ally: { weights: { aggression: 1.0, caution: 1.0, focusPlayer: 1.0, focusMinions: 1.0, focusStructure: 1.0, groupBehavior: 1.0 }, stats: { wavesWon: 0, wavesLost: 0, totalKills: 0, totalDeaths: 0 } },
    enemy: { weights: { aggression: 1.0, caution: 1.0, focusPlayer: 1.0, focusMinions: 1.0, focusStructure: 1.0, groupBehavior: 1.0 }, stats: { wavesWon: 0, wavesLost: 0, totalKills: 0, totalDeaths: 0 } }
};

const enemyAxieBrain = {
    weights: { aggression: 1.0, caution: 1.0, focusPlayer: 1.0, focusMinions: 1.0, focusStructure: 1.0, kiting: 1.0, retreatHP: 0.3, shopPriority: 1.0 },
    stats: {
        kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0,
        timesRetreated: 0, timesKilledPlayer: 0, timesKilledByPlayer: 0, timesKilledByTower: 0,
        timesUsedShop: 0, itemsPurchased: 0, goldEarned: 0,
        _shopLogged: false, _retreatLogged: false, _lastTargetType: null, _forcedPlayerTarget: null,
    }
};

const ENEMY_AXIE_ITEM_CATALOG = {
    botas: { emoji: '👢', name: 'Botas', cost: 30, maxStack: 2, apply: (b) => { b.speedMultiplier += 0.15; }, desc: '+15% velocidad' },
    espada: { emoji: '⚔️', name: 'Espada', cost: 40, maxStack: 3, apply: (b) => { b.damageMultiplier += 0.20; }, desc: '+20% daño' },
    arco: { emoji: '🏹', name: 'Arco', cost: 35, maxStack: 2, apply: (b) => { b.attackSpeedMultiplier += 0.15; }, desc: '+15% vel. ataque' },
    baculo: { emoji: '🔮', name: 'Báculo', cost: 45, maxStack: 2, apply: (b) => { b.rangeBonus += 0.5; b.damageMultiplier += 0.05; }, desc: '+0.5 rango, +5% daño' },
    daga: { emoji: '🗡️', name: 'Daga', cost: 35, maxStack: 2, apply: (b) => { b.critChance += 0.15; }, desc: '+15% crítico' }
};

let enemyAxiePotionCount = 0;
let enemyAxiePotionCooldown = 0;
const ENEMY_AXIE_POTION_COOLDOWN = 1.5;

let playerAIPotionCount = 0;
let playerAIPotionCooldown = 0;
const PLAYER_AI_POTION_COOLDOWN = 1.5;

const spawnQueue = [];
let spawnQueueTimer = 0;

// ===== EDITOR DE MAPA CENITAL =====
let editorMode = false;
let editorCamera = null;
let editorPerspectiveCamera = null;
let editorGridHelper = null;
let editorSelection = null;
let editorDragOffset = new THREE.Vector3();
let editorDragging = false;
let editorHover = null;
let editorChanges = {};
let editorOriginalPositions = {};
let editorCameraMode = 'ortho'; // 'ortho' | 'perspective'
let editorTool = 'select'; // 'select' | 'move' | 'rotate' | 'duplicate' | 'mirrorX' | 'mirrorZ' | 'delete'
let editorUI = null;
let editorSavedCamera = null; // Guarda posición de cámara del juego al entrar al editor
let editorPrevPaused = false; // Estado previo de pausa

// ===== EDITOR DE MAPA CENITAL: FUNCIONES GLOBALES =====
function snapToGrid(val) {
    const grid = CONFIG.editorGridSize || 0.5;
    return Math.round(val / grid) * grid;
}

function setPosEditor(label, x, z) {
    const objetivos = [
        ['Nexo azul', nexusAliado], ['Nexo rojo', nexusEnemigo],
        ['Tienda azul', shopAliada], ['Tienda roja', shopEnemiga],
        ['Jugador', playerModel ? { group: playerModel } : null],
        ['Axie rival', enemyAxieModel ? { group: enemyAxieModel } : null],
    ];
    towers.forEach(tw => {
        if (!tw || !tw.group) return;
        objetivos.push(['Torre ' + (tw.isEnemy ? 'roja' : 'azul') + ' T' + (tw.tier || 1), tw]);
    });
    for (const [nombre, obj] of objetivos) {
        if (nombre === label && obj && obj.group) {
            obj.group.position.x = x;
            obj.group.position.z = z;
            if (obj.position) { obj.position.x = x; obj.position.z = z; }
            return { ok: true, label, x, z };
        }
    }
    return { ok: false, error: 'objeto no encontrado: ' + label };
}

function getEditorActors() {
    const out = [];
    const push = (label, side, obj, x, z) => {
        if (!obj || !obj.group) return;
        out.push({ label, side, x, z, group: obj.group });
    };
    if (nexusAliado) push('Nexo azul', 'ally', nexusAliado, nexusAliado.group.position.x, nexusAliado.group.position.z);
    if (nexusEnemigo) push('Nexo rojo', 'enemy', nexusEnemigo, nexusEnemigo.group.position.x, nexusEnemigo.group.position.z);
    if (shopAliada) push('Tienda azul', 'ally', shopAliada, shopAliada.group.position.x, shopAliada.group.position.z);
    if (shopEnemiga) push('Tienda roja', 'enemy', shopEnemiga, shopEnemiga.group.position.x, shopEnemiga.group.position.z);
    towers.forEach(tw => {
        if (!tw || !tw.group) return;
        push('Torre ' + (tw.isEnemy ? 'roja' : 'azul') + ' T' + (tw.tier || 1), tw.isEnemy ? 'enemy' : 'ally', tw, tw.group.position.x, tw.group.position.z);
    });
    if (playerModel) push('Jugador', 'ally', { group: playerModel }, playerModel.position.x, playerModel.position.z);
    if (enemyAxieModel) push('Axie rival', 'enemy', { group: enemyAxieModel }, enemyAxieModel.position.x, enemyAxieModel.position.z);
    return out;
}

let editorSelectionBox = null;

function updateEditorSelectionUI() {
    if (editorSelectionBox) { scene.remove(editorSelectionBox); editorSelectionBox.dispose(); editorSelectionBox = null; }
    if (!editorSelection) return;
    const actor = getEditorActors().find(a => a.label === editorSelection);
    if (!actor) return;
    const box = new THREE.Box3().setFromObject(actor.group);
    const size = box.getSize(new THREE.Vector3());
    const helper = new THREE.Box3Helper(box, 0xffcc00);
    helper.material.depthTest = false;
    scene.add(helper);
    editorSelectionBox = helper;
    const info = document.getElementById('editor-selection-info');
    if (info) info.textContent = `Seleccionado: ${editorSelection} (x=${actor.x.toFixed(2)}, z=${actor.z.toFixed(2)})`;
}

function createEditorUI() {
    if (editorUI) editorUI.remove();
    editorUI = document.createElement('div');
    editorUI.id = 'editor-ui';
    editorUI.style.cssText = `
        position: fixed; top: 10px; right: 10px; z-index: 10000;
        background: rgba(10,10,20,0.98); border: 2px solid #4466aa;
        border-radius: 12px; padding: 16px; color: #e8e8f8;
        font-family: 'Segoe UI', sans-serif; font-size: 14px;
        min-width: 280px; max-width: 320px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    `;
    editorUI.innerHTML = `
        <div style="font-weight:bold;color:#88aaff;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;font-size:16px;">
            <span>🗺️ EDITOR MAPA CENITAL</span>
            <button id="editor-close" style="background:none;border:none;color:#888;cursor:pointer;font-size:20px;line-height:1;">✕</button>
        </div>
        <div style="margin-bottom:10px;">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px;">
                <input type="checkbox" id="editor-grid-toggle" ${CONFIG.editorShowGrid ? 'checked' : ''} style="width:16px;height:16px;">
                <span>Mostrar Grid (${CONFIG.editorGridSize}u)</span>
            </label>
        </div>
        <div style="margin-bottom:10px;">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px;">
                <input type="checkbox" id="editor-snap-toggle" ${CONFIG.editorSnapEnabled ? 'checked' : ''} style="width:16px;height:16px;">
                <span>Snap a Grid</span>
            </label>
        </div>
        <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #334466;">
            <div style="font-size:12px;color:#888;margin-bottom:8px;">CÁMARA</div>
            <button id="editor-camera-btn" class="editor-btn" style="width:100%;padding:10px;font-size:13px;">📷 Cámara: 0° (Ortogonal)</button>
        </div>
        <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #334466;">
            <div style="font-size:12px;color:#888;margin-bottom:8px;">HERRAMIENTAS</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                <button class="editor-btn editor-tool-btn" data-tool="select" style="padding:8px;">🖱️ Seleccionar</button>
                <button class="editor-btn editor-tool-btn" data-tool="move" style="padding:8px;">✋ Mover</button>
                <button class="editor-btn editor-tool-btn" data-tool="rotate" style="padding:8px;">🔄 Rotar 90°</button>
                <button class="editor-btn editor-tool-btn" data-tool="mirrorX" style="padding:8px;">↔️ Espejo X</button>
                <button class="editor-btn editor-tool-btn" data-tool="mirrorZ" style="padding:8px;">↕️ Espejo Z</button>
                <button class="editor-btn editor-tool-btn" data-tool="delete" style="padding:8px;">🗑️ Eliminar</button>
            </div>
        </div>
        <div id="editor-selection-info" style="font-size:12px;color:#ffcc44;margin-bottom:10px;padding:8px;background:rgba(255,204,68,0.1);border-radius:4px;text-align:center;">Seleccionado: —</div>
        <div style="margin-bottom:12px;">
            <button id="editor-export-btn" class="editor-btn" style="width:100%;padding:10px;background:#2a5a2a;border-color:#4a8a4a;font-size:13px;">📋 Exportar JSON</button>
        </div>
        <div style="font-size:11px;color:#668;line-height:1.6;background:rgba(100,100,136,0.1);padding:10px;border-radius:6px;">
            <b>Controles:</b><br>
            E / Esc - Toggle editor<br>
            C - Cambiar cámara 0°↔60°<br>
            1-7 - Herramientas<br>
            Click - Seleccionar<br>
            Arrastre - Mover (con snap)<br>
            Shift + Arrastre - Lock 1 eje
        </div>
    `;
    document.body.appendChild(editorUI);

    editorUI.querySelector('#editor-close').onclick = () => toggleEditorMode();
    editorUI.querySelector('#editor-grid-toggle').onchange = (e) => {
        CONFIG.editorShowGrid = e.target.checked;
        if (editorGridHelper) editorGridHelper.visible = CONFIG.editorShowGrid;
    };
    editorUI.querySelector('#editor-snap-toggle').onchange = (e) => {
        CONFIG.editorSnapEnabled = e.target.checked;
    };
    editorUI.querySelector('#editor-camera-btn').onclick = () => toggleEditorCamera();
    editorUI.querySelector('#editor-export-btn').onclick = () => exportEditorChanges();
    editorUI.querySelectorAll('.editor-tool-btn').forEach(btn => {
        btn.onclick = () => setEditorTool(btn.dataset.tool);
    });
    updateEditorUICameraBtn();
    updateEditorUIToolBtns();
}

function updateEditorUICameraBtn() {
    const btn = document.getElementById('editor-camera-btn');
    if (!btn) return;
    if (editorCameraMode === 'ortho') {
        btn.textContent = '📷 Cámara: 0° (Ortogonal)';
        btn.style.background = '#2e4a8a';
    } else {
        btn.textContent = '📷 Cámara: 60° (Perspectiva LoL)';
        btn.style.background = '#5a2a7a';
    }
}

function updateEditorUIToolBtns() {
    document.querySelectorAll('.editor-tool-btn').forEach(btn => {
        if (btn.dataset.tool === editorTool) {
            btn.style.background = '#2a5a2a';
            btn.style.borderColor = '#4a8a4a';
        } else {
            btn.style.background = '#2e4a8a';
            btn.style.borderColor = '#4466aa';
        }
    });
}

function setEditorTool(tool) {
    editorTool = tool;
    updateEditorUIToolBtns();
    return { ok: true, tool: editorTool };
}

function toggleEditorCamera() {
    editorCameraMode = editorCameraMode === 'ortho' ? 'perspective' : 'ortho';
    updateEditorUICameraBtn();
    return { ok: true, cameraMode: editorCameraMode };
}

function exitEditorIfActive() {
    if (editorMode) toggleEditorMode();
}

function toggleEditorMode() {
    if (editorMode) disableEditorMode(); else enableEditorMode();
    return { ok: true, editorMode };
}

function enableEditorMode() {
    editorMode = true;
    editorPrevPaused = gamePaused;
    // No pausar juego, solo activar overlay editor
    editorCameraMode = 'ortho';
    editorTool = 'select';

    // Guardar estado actual de la cámara del juego
    editorSavedCamera = {
        position: camera.position.clone(),
        target: cameraSmoothTarget ? cameraSmoothTarget.clone() : new THREE.Vector3(),
        smoothPos: cameraSmoothPos ? cameraSmoothPos.clone() : new THREE.Vector3(),
    };

    const w = window.__debug.widths;
    const aspect = window.innerWidth / window.innerHeight;
    const size = Math.max(w.laneReal, w.laneLargo) * 0.6;
    editorCamera = new THREE.OrthographicCamera(-size * aspect, size * aspect, size, -size, 0.1, 400);
    editorCamera.position.set(0, 80, 0);
    editorCamera.lookAt(0, 0, 0);
    editorCamera.up.set(0, 0, -1);

    editorPerspectiveCamera = new THREE.PerspectiveCamera(60, aspect, 0.1, 400);
    editorPerspectiveCamera.position.set(0, 35, 22);
    editorPerspectiveCamera.lookAt(0,0,0);

    editorGridHelper = new THREE.GridHelper(
        Math.max(w.laneReal, w.laneLargo) * 1.2,
        Math.ceil(Math.max(w.laneReal, w.laneLargo) / (CONFIG.editorGridSize || 0.5)),
        0x4488ff, 0x224488
    );
    editorGridHelper.position.y = GROUND_Y + 0.02;
    editorGridHelper.visible = CONFIG.editorShowGrid;
    scene.add(editorGridHelper);

    editorOriginalPositions = {};
    getEditorActors().forEach(a => { editorOriginalPositions[a.label] = { x: a.x, z: a.z }; });

    createEditorUI();
    addEditorListeners();

    if (goldDiv) goldDiv.style.display = 'none';
    if (waveDiv) waveDiv.style.display = 'none';
    if (timerDiv) timerDiv.style.display = 'none';
    if (fpsDiv) fpsDiv.style.display = 'none';
    if (targetUI) targetUI.style.display = 'none';

    console.log('🗺️ Editor de mapa activado (E para salir)');
    return { ok: true };
}

function disableEditorMode() {
    editorMode = false;
    if (editorGridHelper) { scene.remove(editorGridHelper); editorGridHelper.dispose(); editorGridHelper = null; }
    if (editorSelectionBox) { scene.remove(editorSelectionBox); editorSelectionBox.dispose(); editorSelectionBox = null; }
    if (editorUI) { editorUI.remove(); editorUI = null; }
    removeEditorListeners();

    // Restaurar estado de pausa (si se había pausado antes)
    if (editorPrevPaused !== undefined) gamePaused = editorPrevPaused;
    editorPrevPaused = false;

    // Restaurar cámara del juego
    if (editorSavedCamera) {
        camera.position.copy(editorSavedCamera.position);
        if (cameraSmoothPos) cameraSmoothPos.copy(editorSavedCamera.smoothPos);
        if (cameraSmoothTarget) cameraSmoothTarget.copy(editorSavedCamera.target);
        editorSavedCamera = null;
    }

    if (goldDiv) goldDiv.style.display = 'block';
    if (waveDiv) waveDiv.style.display = 'block';
    if (timerDiv) timerDiv.style.display = 'block';
    if (fpsDiv) fpsDiv.style.display = 'block';
    editorSelection = null;
    editorDragging = false;
    editorHover = null;
    console.log('🗺️ Editor de mapa desactivado');
    return { ok: true };
}

function addEditorListeners() {
    window.__editorKeydown = (e) => {
        if (!editorMode) return;
        const toolKeys = { '1': 'select', '2': 'move', '3': 'rotate', '4': 'mirrorX', '5': 'mirrorZ', '6': 'delete' };
        if (toolKeys[e.key]) { setEditorTool(toolKeys[e.key]); return; }
        if (e.key === 'c' || e.key === 'C') { toggleEditorCamera(); return; }
        if (e.key === 'Delete' || e.key === 'Backspace') { if (editorSelection) deleteEditorSelection(); return; }
        if (e.key === 'Escape') { toggleEditorMode(); return; }
    };
    window.addEventListener('keydown', window.__editorKeydown);

    const canvas = renderer.domElement;

    window.__editorMousedown = (e) => {
        if (!editorMode) return;
        if (e.button !== 0) return;
        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const cam = editorCameraMode === 'ortho' ? editorCamera : editorPerspectiveCamera;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cam);
        const selectable = getEditorActors().map(a => a.group);
        const intersects = raycaster.intersectObjects(selectable, true);
        if (intersects.length > 0) {
            let parent = intersects[0].object;
            while (parent.parent && parent !== scene) parent = parent.parent;
            const actor = getEditorActors().find(a => a.group === parent);
            if (actor) {
                editorSelection = actor.label;
                editorHover = null;
                if (editorTool === 'move') {
                    editorDragging = true;
                    const point = intersects[0].point;
                    editorDragOffset.x = actor.x - point.x;
                    editorDragOffset.z = actor.z - point.z;
                    canvas.style.cursor = 'grabbing';
                } else if (editorTool === 'rotate') { rotateEditorSelection(); }
                else if (editorTool === 'mirrorX') { mirrorEditorSelectionX(); }
                else if (editorTool === 'mirrorZ') { mirrorEditorSelectionZ(); }
                else if (editorTool === 'delete') { deleteEditorSelection(); }
            }
        } else {
            editorSelection = null;
        }
        updateEditorSelectionUI();
    };

    canvas.addEventListener('mousedown', window.__editorMousedown);

    window.__editorMousemove = (e) => {
        if (!editorMode || !editorDragging) return;
        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const cam = editorCameraMode === 'ortho' ? editorCamera : editorPerspectiveCamera;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cam);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -GROUND_Y);
        const point = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, point);
        if (point) {
            let newX = point.x + editorDragOffset.x;
            let newZ = point.z + editorDragOffset.z;
            if (CONFIG.editorSnapEnabled) { newX = snapToGrid(newX); newZ = snapToGrid(newZ); }
            if (e.shiftKey && editorSelection) {
                const actor = getEditorActors().find(a => a.label === editorSelection);
                if (actor) {
                    if (Math.abs(newX - actor.x) > Math.abs(newZ - actor.z)) newZ = actor.z;
                    else newX = actor.x;
                }
            }
            setPosEditor(editorSelection, newX, newZ);
            editorChanges[editorSelection] = { x: newX, z: newZ };
            updateEditorSelectionUI();
        }
    };

    // Pan de cámara con bordes + zoom con rueda
    window.__editorWheel = (e) => {
        if (!editorMode) return;
        e.preventDefault();
        const cam = editorCameraMode === 'ortho' ? editorCamera : editorPerspectiveCamera;
        if (editorCameraMode === 'ortho') {
            // Zoom ortográfico: cambiar tamaño
            const delta = -e.deltaY * 0.01;
            const aspect = window.innerWidth / window.innerHeight;
            const currentSize = cam.top;
            const newSize = Math.max(2, Math.min(50, currentSize + delta));
            const scale = newSize / currentSize;
            cam.left *= scale;
            cam.right *= scale;
            cam.top = newSize;
            cam.bottom = -newSize;
            cam.updateProjectionMatrix();
        } else {
            // Zoom perspectiva: mover cámara
            const dir = new THREE.Vector3();
            cam.getWorldDirection(dir);
            const amount = -e.deltaY * 0.01;
            cam.position.addScaledVector(dir, amount * 5);
        }
    };
    canvas.addEventListener('wheel', window.__editorWheel, { passive: false });

    window.__editorMouseup = () => {
        if (editorDragging) { editorDragging = false; canvas.style.cursor = 'grab'; }
    };
    canvas.addEventListener('mouseup', window.__editorMouseup);
    window.addEventListener('mousemove', window.__editorMousemove);

    // Pan de cámara con bordes
    let edgePanInterval = null;
    let edgePanDir = { x: 0, z: 0 };
    const EDGE_THRESHOLD = 40;
    const PAN_SPEED = 0.3;
    window.__editorEdgeMove = (e) => {
        if (!editorMode) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const w = rect.width;
        const h = rect.height;
        edgePanDir.x = 0;
        edgePanDir.z = 0;
        if (x < EDGE_THRESHOLD) edgePanDir.x = -1;
        else if (x > w - EDGE_THRESHOLD) edgePanDir.x = 1;
        if (y < EDGE_THRESHOLD) edgePanDir.z = -1;
        else if (y > h - EDGE_THRESHOLD) edgePanDir.z = 1;
        if (edgePanDir.x !== 0 || edgePanDir.z !== 0) {
            if (!edgePanInterval) {
                edgePanInterval = setInterval(() => {
                    if (editorCameraMode === 'ortho' && editorCamera) {
                        editorCamera.position.x += edgePanDir.x * PAN_SPEED;
                        editorCamera.position.z += edgePanDir.z * PAN_SPEED;
                        editorCamera.lookAt(0,0,0);
                    } else if (editorPerspectiveCamera) {
                        editorPerspectiveCamera.position.x += edgePanDir.x * PAN_SPEED;
                        editorPerspectiveCamera.position.z += edgePanDir.z * PAN_SPEED;
                        editorPerspectiveCamera.lookAt(0,0,0);
                    }
                }, 16);
            }
        } else if (edgePanInterval) {
            clearInterval(edgePanInterval);
            edgePanInterval = null;
        }
    };
    window.addEventListener('mousemove', window.__editorEdgeMove);
}

function removeEditorListeners() {
    if (window.__editorKeydown) window.removeEventListener('keydown', window.__editorKeydown);
    const canvas = renderer ? renderer.domElement : null;
    if (canvas) {
        if (window.__editorMousedown) canvas.removeEventListener('mousedown', window.__editorMousedown);
    }
    if (window.__editorMousemove) window.removeEventListener('mousemove', window.__editorMousemove);
    if (window.__editorMouseup) window.removeEventListener('mouseup', window.__editorMouseup);
    window.__editorKeydown = null;
    window.__editorMousedown = null;
    window.__editorMousemove = null;
    window.__editorMouseup = null;
}

function rotateEditorSelection() {
    if (!editorSelection) return { ok: false };
    const actor = getEditorActors().find(a => a.label === editorSelection);
    if (!actor || !actor.group) return { ok: false };
    actor.group.rotation.y += Math.PI / 2;
    return { ok: true };
}

function mirrorEditorSelectionX() {
    if (!editorSelection) return { ok: false };
    const actor = getEditorActors().find(a => a.label === editorSelection);
    if (!actor) return { ok: false };
    const newX = -actor.x;
    setPosEditor(editorSelection, newX, actor.z);
    editorChanges[editorSelection] = { x: newX, z: actor.z };
    updateEditorSelectionUI();
    return { ok: true };
}

function mirrorEditorSelectionZ() {
    if (!editorSelection) return { ok: false };
    const actor = getEditorActors().find(a => a.label === editorSelection);
    if (!actor) return { ok: false };
    const newZ = -actor.z;
    setPosEditor(editorSelection, actor.x, newZ);
    editorChanges[editorSelection] = { x: actor.x, z: newZ };
    updateEditorSelectionUI();
    return { ok: true };
}

function deleteEditorSelection() {
    if (!editorSelection) return { ok: false };
    const actor = getEditorActors().find(a => a.label === editorSelection);
    if (!actor || !actor.group) return { ok: false };
    actor.group.visible = false;
    editorChanges[editorSelection] = { deleted: true, x: actor.x, z: actor.z };
    editorSelection = null;
    updateEditorSelectionUI();
    return { ok: true };
}

function exportEditorChanges() {
    const json = JSON.stringify(editorChanges, null, 2);
    navigator.clipboard.writeText(json).then(() => {
        const btn = document.getElementById('editor-export-btn');
        if (btn) { const t = btn.textContent; btn.textContent = '✅ Copiado!'; setTimeout(() => { btn.textContent = t; }, 1500); }
    }).catch(() => { console.log('📋 Cambios:', json); });
    console.log('📋 Editor JSON:', json);
    return { ok: true, changes: editorChanges, json };
}

// Botón flotante clickeable para abrir el editor cenital
function createEditorButton() {
    if (document.getElementById('btn-editor-cenital')) return;
    const btn = document.createElement('button');
    btn.id = 'btn-editor-cenital';
    btn.innerHTML = '🗺️ Mapa cenital';
    btn.style.cssText = `position:fixed;top:14px;right:14px;z-index:9999;padding:8px 14px;background:linear-gradient(135deg,#2e4a8a,#1a2a5a);color:#cce;border:1px solid #4466aa;border-radius:8px;font-family:'Segoe UI',Arial;font-size:12px;font-weight:bold;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.5);`;
    btn.onmouseenter = () => { btn.style.background = 'linear-gradient(135deg,#3e5a9a,#2a3a6a)'; };
    btn.onmouseleave = () => { btn.style.background = 'linear-gradient(135deg,#2e4a8a,#1a2a5a)'; };
    btn.onclick = () => {
        if (typeof gameStarted !== 'undefined' && !gameStarted) return;
        toggleEditorMode();
    };
    document.body.appendChild(btn);
}


function clampWeights(weights) {
    for (const key in weights) {
        if (key === 'retreatHP') weights[key] = Math.max(0.1, Math.min(0.6, weights[key]));
        else weights[key] = Math.max(0.3, Math.min(2.5, weights[key]));
    }
}

function saveBrains() {
    try {
        localStorage.setItem('axie_factionBrain', JSON.stringify(factionBrain));
        localStorage.setItem('axie_enemyAxieBrain', JSON.stringify(enemyAxieBrain));
    } catch (e) {}
}

function loadBrains() {
    try {
        const fb = localStorage.getItem('axie_factionBrain');
        const eb = localStorage.getItem('axie_enemyAxieBrain');
        if (fb) {
            const p = JSON.parse(fb);
            Object.assign(factionBrain.ally.weights, p.ally?.weights || {});
            Object.assign(factionBrain.enemy.weights, p.enemy?.weights || {});
            Object.assign(factionBrain.ally.stats, p.ally?.stats || {});
            Object.assign(factionBrain.enemy.stats, p.enemy?.stats || {});
        }
        if (eb) {
            const p = JSON.parse(eb);
            Object.assign(enemyAxieBrain.weights, p.weights || {});
            Object.assign(enemyAxieBrain.stats, p.stats || {});
        }
        if (factionBrain.ally.weights.aggression < 1.2) applyFactoryBoost();
        console.log('🧠 Brains cargados');
    } catch (e) {}
}

function applyFactoryBoost() {
    const ally = factionBrain.ally.weights;
    const enemy = factionBrain.enemy.weights;
    ally.aggression = Math.max(ally.aggression, 1.3);
    ally.focusStructure = Math.max(ally.focusStructure, 1.3);
    enemy.aggression = Math.max(enemy.aggression, 1.3);
    enemy.focusStructure = Math.max(enemy.focusStructure, 1.3);
    clampWeights(ally);
    clampWeights(enemy);
}

window.resetBrains = function() {
    localStorage.removeItem('axie_factionBrain');
    localStorage.removeItem('axie_enemyAxieBrain');
    localStorage.removeItem('axie_ai_training_stats');
    console.log('🧠 Brains reseteados');
};

window.showBrains = function() {
    console.log('🧠 ALIADA:', factionBrain.ally.weights);
    console.log('🧠 ENEMIGA:', factionBrain.enemy.weights);
    console.log('🤖 AXIE ENEMIGO:', enemyAxieBrain.weights);
    console.log('💰 Oro jugador:', playerGold, playerItemSlots);
    console.log('💰 Jugador-IA:', playerAIGold, playerAIItems);
    console.log('💰 Axie Enemigo:', enemyAxieGold, enemyAxieItems);
};

function givePlayerGold(baseAmount, reason = '') {
    if (isAITrainingMode) return;
    const streakBonus = Math.min(playerKillStreak * ECONOMY.STREAK_BONUS_PER_KILL, ECONOMY.STREAK_MAX_BONUS);
    const total = baseAmount + streakBonus;
    playerGold += total;
    if (reason) console.log(`💰 +${total} oro (${reason})${streakBonus > 0 ? ` [racha +${streakBonus}]` : ''} | Total: ${playerGold}`);
    updatePlayerGoldHUD();
}

function spendPlayerGold(amount) {
    if (playerGold < amount) return false;
    playerGold -= amount;
    updatePlayerGoldHUD();
    return true;
}

function resetPlayerEconomy() {
    playerGold = ECONOMY.PLAYER_STARTING_GOLD;
    playerKillStreak = 0;
    playerFirstBlood = false;
    playerItemSlots = [null, null, null, null, null, null];
    potionHPCount = 0;
    potionMPCount = 0;
    potionUseCooldown = 0;
    updatePlayerGoldHUD();
}

function updatePlayerGoldHUD() {
    const el = document.getElementById('player-gold-display');
    if (!el) return;
    if (isAITrainingMode) {
        el.textContent = `🦊 💰 ${playerAIGold}  |  🤖 💰 ${enemyAxieGold}`;
    } else {
        el.textContent = `💰 ${playerGold}`;
    }
}

function showGoldPopup(amount, sx, sy, color = '#ffcc44') {
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed; left: ${sx}px; top: ${sy}px;
        color: ${color}; font-family: 'Courier New', monospace;
        font-size: 20px; font-weight: bold;
        text-shadow: 0 0 10px ${color}, 2px 2px 0 #000;
        pointer-events: none; z-index: 9999;
        transform: translate(-50%, -50%);
        animation: goldPopupFloat ${ECONOMY.GOLD_POPUP_LIFETIME}s ease-out forwards;
    `;
    popup.textContent = `+${amount} 💰`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), ECONOMY.GOLD_POPUP_LIFETIME * 1000);
}

function showGoldPopupAt3D(amount, worldPos, color = '#ffcc44') {
    if (!worldPos) return;
    try {
        const v = worldPos.clone();
        v.project(camera);
        const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
        if (sx < 0 || sx > window.innerWidth || sy < 0 || sy > window.innerHeight) return;
        showGoldPopup(amount, sx, sy, color);
    } catch (e) {}
}

const healthBarCache = new Map();
function getHealthBarTexture(segments, visibleSegments, isEnemy) {
    const key = `${segments}-${visibleSegments}-${isEnemy}`;
    if (healthBarCache.has(key)) return healthBarCache.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 20;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 128, 20);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(0, 0, 128, 20);
    const sw = 124 / segments;
    // Verde intenso para todo el mundo, aliado y enemigo: el usuario quiere
    // leer la vida de un vistazo sin distinguir bandos por color. El par
    // oscuro/brillante da el degradado por segmentos.
    const colors = isEnemy ? ['#12b01c', '#52ff4a'] : ['#12b01c', '#52ff4a'];
    for (let i = 0; i < visibleSegments; i++) {
        ctx.fillStyle = i % 2 === 0 ? colors[0] : colors[1];
        ctx.fillRect(2 + i * sw, 2, sw - 1, 16);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    healthBarCache.set(key, tex);
    return tex;
}

function createHealthBar(segments = 10, isEnemy = false) {
    const texture = getHealthBarTexture(segments, segments, isEnemy);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.2, 0.2, 1);
    sprite.renderOrder = 999;
    return { sprite, spriteMat };
}

function updateHealthBarSprite(spriteMat, segments, visibleSegments, isEnemy) {
    spriteMat.map = getHealthBarTexture(segments, visibleSegments, isEnemy);
    spriteMat.needsUpdate = true;
}

// --- Barra de vida del Axie del jugador ------------------------------------
// El jugador no tenia barra sobre la cabeza: solo el HUD de abajo, que queda
// fuera de la vista mientras se mira el carril. Se cuelga del propio
// playerModel como hijo, asi sigue al Axie sin tocar el bucle de movimiento.
const PLAYER_HEALTH_SEGMENTS = 10;
let playerHealthBarMat = null;

function attachPlayerHealthBar() {
    if (!playerModel) return;
    if (playerHealthSprite && playerHealthSprite.parent) playerHealthSprite.parent.remove(playerHealthSprite);
    const hb = createHealthBar(PLAYER_HEALTH_SEGMENTS, false);
    // El sprite es hijo del modelo, que va escalado: la altura en mundo
    // hay que dividirla por esa escala.
    const escala = playerModel.scale ? playerModel.scale.x : 1.2;
    hb.sprite.position.set(0, CONFIG.AXIE_HEALTH_BAR_HEIGHT / escala, 0);
    hb.sprite.scale.set(1.4, 0.22, 1);
    playerModel.add(hb.sprite);
    playerHealthSprite = hb.sprite;
    playerHealthBarMat = hb.spriteMat;
    updatePlayerHealthBarSprite();
}

function updatePlayerHealthBarSprite() {
    if (!playerHealthBarMat) return;
    const pct = Math.max(0, Math.min(1, playerHealth / playerMaxHealth));
    const vis = Math.max(0, Math.min(PLAYER_HEALTH_SEGMENTS, Math.ceil(pct * PLAYER_HEALTH_SEGMENTS)));
    updateHealthBarSprite(playerHealthBarMat, PLAYER_HEALTH_SEGMENTS, vis, false);
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);
scene.fog = new THREE.Fog(0x0a0a1a, 35, 55);

// Alejar un poco la vista: la camara es ORTOGRAFICA, asi que "alejar"
// es bajar el zoom, no mover la distancia. zoom < 1 = se ve mas mundo.
// 0.88 da ~13% mas de campo visible sin perder la accion de vista.
// OJO: el resize (mas abajo) reconstruye el frustum pero respeta este zoom.
const frustumSize = 8.0;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(-frustumSize * aspect / 2, frustumSize * aspect / 2, frustumSize / 2, -frustumSize / 2, 0.1, 100);
camera.zoom = 0.88;

// Angulo de camara efectivo. Empieza en el valor del catalogo, pero se puede
// cambiar en vivo con las teclas 1/2/3/4 para comparar perspectivas sin
// editar el archivo ni recargar (ver ajustarAnguloCamara mas abajo).
let camaraAnguloActual = CONFIG.camaraAngulo;
const CAMERA_OFFSET = new THREE.Vector3(0, CONFIG.camaraAltura, 0);

// Recalcula el offset de la camara a partir del angulo actual. Se llama al
// arrancar y cada vez que se cambia el angulo en vivo.
function recalcularOffsetCamara() {
    const rad = camaraAnguloActual * Math.PI / 180;
    CAMERA_OFFSET.set(
        Math.sin(rad) * CONFIG.camaraDistancia,
        CONFIG.camaraAltura,
        Math.cos(rad) * CONFIG.camaraDistancia
    );
}
recalcularOffsetCamara();

// Cambia el angulo en vivo. 0 = mirando el carril de frente (las torres se
// alinean en vertical); 60 = el valor original, con el carril muy de lado.
function ajustarAnguloCamara(grados) {
    camaraAnguloActual = grados;
    recalcularOffsetCamara();
    if (groundReady && playerModel) {
        CAMERA_FIXED_Y = GROUND_Y + CAMERA_OFFSET.y;
        cameraSmoothPos.set(
            playerModel.position.x + CAMERA_OFFSET.x,
            CAMERA_FIXED_Y,
            playerModel.position.z + CAMERA_OFFSET.z
        );
        camera.position.copy(cameraSmoothPos);
        camera.lookAt(cameraSmoothTarget);
        camera.updateProjectionMatrix();
    }
    console.log('🎥 Angulo de camara: ' + grados + ' grados'
        + (grados === 0 ? ' (carril de frente)' : grados >= 45 ? ' (original, carril de lado)' : ' (intermedio)'));
}
window.__anguloCamara = () => camaraAnguloActual;

const cameraSmoothPos = new THREE.Vector3(0, 0, 0);
const cameraSmoothTarget = new THREE.Vector3(0, 0, 0);
let CAMERA_FIXED_Y = 0;
let CAMERA_FIXED_TARGET_Y = 0;
let camaraInicializada = false;

function inicializarCamaraFija() {
    if (!groundReady) return;
    CAMERA_FIXED_Y = GROUND_Y + CAMERA_OFFSET.y;
    CAMERA_FIXED_TARGET_Y = GROUND_Y;
    const px = playerModel ? playerModel.position.x : 0;
    const pz = playerModel ? playerModel.position.z : 0;
    cameraSmoothPos.set(px + CAMERA_OFFSET.x, CAMERA_FIXED_Y, pz + CAMERA_OFFSET.z);
    cameraSmoothTarget.set(px, CAMERA_FIXED_TARGET_Y, pz);
    camera.position.copy(cameraSmoothPos);
    camera.lookAt(cameraSmoothTarget);
    camera.updateProjectionMatrix();
    camaraInicializada = true;
}

function updateCameraPosition() {
    if (!playerModel || !camaraInicializada) return;
    const targetX = playerModel.position.x;
    const targetZ = playerModel.position.z;
    const sf = 1 - Math.exp(-CONFIG.cameraSmoothSpeed * 0.016);
    cameraSmoothPos.x = THREE.MathUtils.lerp(cameraSmoothPos.x, targetX + CAMERA_OFFSET.x, sf);
    cameraSmoothPos.z = THREE.MathUtils.lerp(cameraSmoothPos.z, targetZ + CAMERA_OFFSET.z, sf);
    cameraSmoothPos.y = CAMERA_FIXED_Y;
    cameraSmoothTarget.x = THREE.MathUtils.lerp(cameraSmoothTarget.x, targetX, sf);
    cameraSmoothTarget.z = THREE.MathUtils.lerp(cameraSmoothTarget.z, targetZ, sf);
    cameraSmoothTarget.y = CAMERA_FIXED_TARGET_Y;
    camera.position.copy(cameraSmoothPos);
    camera.lookAt(cameraSmoothTarget);
    camera.position.y = CAMERA_FIXED_Y;
    camera.updateMatrixWorld(true);
}

function chooseNewDynamicCameraTarget() {
    const otherMode = dynamicCameraMode === 'player' ? 'enemy' : 'player';
    let chosenMode = 'player';
    if (otherMode === 'enemy' && enemyAxieModel && !enemyAxieIsDead) chosenMode = 'enemy';
    else if (otherMode === 'player' && playerModel && !isPlayerDead) chosenMode = 'player';
    else if (playerModel && !isPlayerDead) chosenMode = 'player';
    else if (enemyAxieModel && !enemyAxieIsDead) chosenMode = 'enemy';
    else chosenMode = 'idle';
    dynamicCameraMode = chosenMode;
    dynamicCameraLastSwitch = gameTime;
    if (chosenMode === 'player') {
        const r = DYNAMIC_CAMERA_PLAYER_DURATION;
        dynamicCameraTimer = r[0] + Math.random() * (r[1] - r[0]);
        dynamicCameraTarget = playerModel.position.clone();
    } else if (chosenMode === 'enemy') {
        const r = DYNAMIC_CAMERA_ENEMY_DURATION;
        dynamicCameraTimer = r[0] + Math.random() * (r[1] - r[0]);
        dynamicCameraTarget = enemyAxieModel.position.clone();
    } else {
        const r = DYNAMIC_CAMERA_IDLE_DURATION;
        dynamicCameraTimer = r[0] + Math.random() * (r[1] - r[0]);
        dynamicCameraTarget = new THREE.Vector3(0, GROUND_Y, 0);
    }
}

function updateDynamicCamera(delta) {
    if (!isAITrainingMode || !camaraInicializada) return;
    dynamicCameraTimer -= delta;
    const currentUnavailable = 
        (dynamicCameraMode === 'player' && (!playerModel || isPlayerDead)) ||
        (dynamicCameraMode === 'enemy' && (!enemyAxieModel || enemyAxieIsDead));
    const minHoldElapsed = (gameTime - dynamicCameraLastSwitch) >= DYNAMIC_CAMERA_MIN_HOLD;
    if (dynamicCameraTimer <= 0 || currentUnavailable) {
        if (minHoldElapsed || currentUnavailable) chooseNewDynamicCameraTarget();
        else dynamicCameraTimer = DYNAMIC_CAMERA_MIN_HOLD - (gameTime - dynamicCameraLastSwitch);
    }
    if (dynamicCameraMode === 'player' && playerModel && !isPlayerDead) {
        dynamicCameraTarget.copy(playerModel.position);
    } else if (dynamicCameraMode === 'enemy' && enemyAxieModel && !enemyAxieIsDead) {
        dynamicCameraTarget.copy(enemyAxieModel.position);
    }
    const sf = 1 - Math.exp(-0.9 * delta);
    cameraSmoothPos.x += (dynamicCameraTarget.x + CAMERA_OFFSET.x - cameraSmoothPos.x) * sf;
    cameraSmoothPos.z += (dynamicCameraTarget.z + CAMERA_OFFSET.z - cameraSmoothPos.z) * sf;
    cameraSmoothPos.y = CAMERA_FIXED_Y;
    cameraSmoothTarget.x += (dynamicCameraTarget.x - cameraSmoothTarget.x) * sf;
    cameraSmoothTarget.z += (dynamicCameraTarget.z - cameraSmoothTarget.z) * sf;
    cameraSmoothTarget.y = CAMERA_FIXED_TARGET_Y;
    camera.position.copy(cameraSmoothPos);
    camera.lookAt(cameraSmoothTarget);
    camera.position.y = CAMERA_FIXED_Y;
    camera.updateMatrixWorld(true);
}

function resetDynamicCamera() {
    dynamicCameraTarget = null;
    dynamicCameraTimer = 0;
    dynamicCameraMode = 'player';
    dynamicCameraInitialized = false;
    dynamicCameraLastSwitch = 0;
}

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.pixelRatio));
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.style.display = 'none';
document.body.prepend(renderer.domElement);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
const roomEnv = new RoomEnvironment();
const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
scene.environment = envTexture;

scene.add(new THREE.AmbientLight(0x303048, 0.7));
const mainLight = new THREE.DirectionalLight(0xffeedd, 1.4);
mainLight.position.set(15, 25, 10);
scene.add(mainLight);
const fillLight = new THREE.DirectionalLight(0x4488ff, 0.2);
fillLight.position.set(-10, 10, -10);
scene.add(fillLight);

const laneLoader = sharedGLTFLoader;
const LANE_PATH = CONFIG.TERRAIN_GLB_LANE;
const LANE_TARGET_WIDTH = 10;
const LANE_TARGET_LENGTH = 52;
const LANE_OVERLAP = 1.0;
const LANE_TARGET_LENGTH_EACH = LANE_TARGET_LENGTH / 2 + LANE_OVERLAP / 2;

let lanesCargados = 0;
const lanesData = [];

function cargarLanePart(index) {
    laneLoader.load(LANE_PATH, (gltf) => {
        const laneModel = gltf.scene;
        const bbox = new THREE.Box3().setFromObject(laneModel);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        bbox.getSize(size);
        bbox.getCenter(center);
        lanesData.push({ index, model: laneModel, size, center });
        lanesCargados++;
        if (lanesCargados >= 2) procesarLanes();
    }, undefined, (err) => console.error(`❌ Carril ${index + 1}:`, err));
}

function procesarLanes() {
    const dims = [
        { axis: 'x', value: lanesData[0].size.x },
        { axis: 'y', value: lanesData[0].size.y },
        { axis: 'z', value: lanesData[0].size.z },
    ].sort((a, b) => b.value - a.value);

    const largoAxis = dims[0].axis;
    const anchoAxis = dims[1].axis;
    const altoAxis = dims[2].axis;
    const scaleLargo = LANE_TARGET_LENGTH_EACH / dims[0].value;
    const scaleAncho = LANE_TARGET_WIDTH / dims[1].value;
    const scaleAlto = (scaleLargo + scaleAncho) / 4;
    const scaleMap = { x: 1, y: 1, z: 1 };
    scaleMap[largoAxis] = scaleLargo;
    scaleMap[anchoAxis] = scaleAncho;
    scaleMap[altoAxis] = scaleAlto;
    const rotacionY = (largoAxis === 'x') ? Math.PI / 2 : 0;
    const rotacionX = (largoAxis === 'y') ? -Math.PI / 2 : 0;
    let maxTopY = -Infinity;

    lanesData.forEach((data, idx) => {
        const m = data.model;
        m.scale.set(scaleMap.x, scaleMap.y, scaleMap.z);
        if (rotacionY) m.rotation.y = rotacionY;
        if (rotacionX) m.rotation.x = rotacionX;
        const bbox = new THREE.Box3().setFromObject(m);
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        const halfLength = LANE_TARGET_LENGTH_EACH / 2;
        const targetCenterZ = (idx === 0) ? -(halfLength - LANE_OVERLAP / 2) : (halfLength - LANE_OVERLAP / 2);
        m.position.x -= center.x;
        m.position.z += targetCenterZ - center.z;
        m.position.y = -0.44 - bbox.min.y;
        m.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = false;
                node.receiveShadow = false;
                if (node.material) {
                    const mats = Array.isArray(node.material) ? node.material : [node.material];
                    mats.forEach(mat => {
                        if ('roughness' in mat) mat.roughness = 0.95;
                        if ('metalness' in mat) mat.metalness = 0.0;
                        if ('envMapIntensity' in mat) mat.envMapIntensity = 0.5;
                        mat.needsUpdate = true;
                    });
                }
            }
        });
        scene.add(m);
        const bboxFinal = new THREE.Box3().setFromObject(m);
        if (bboxFinal.max.y > maxTopY) maxTopY = bboxFinal.max.y;
    });

    LANE_TOP_Y = maxTopY;
    GROUND_Y = maxTopY - 0.12;
    groundReady = true;
    console.log(`✅ GROUND_Y = ${GROUND_Y.toFixed(3)}`);

    // Nexo, tienda y torres comparten el MISMO eje lateral por bando:
    // aliado en x=-2.5, enemigo en x=+2.5. Antes el nexo aliado estaba en
    // x=+2.0 y el enemigo en x=-1.2: al lateral contrario de sus propias
    // torres. Con la camara casi de perfil (87 grados) ese cruce se nota
    // y cada nexo parecia descolgado hacia el bando equivocado.
    //
    // La tienda va al LADO CONTRARIO del nexo, para que no se solapen ni
    // se tapen desde la camara (que mira casi de perfil): el nexo aliado
    // esta a la izquierda (x=-2.5), asi que su tienda va a la derecha
    // (x=+3.5); el nexo enemigo esta a la derecha (+2.5) y su tienda a la
    // izquierda (-3.5). Ademas va 3 unidades por detras en Z (z=+-24
    // contra +-21): con 1 sola unidad el nexo la tapaba entera. La tienda
    // mide 1.30 de ancho, asi que en +-2.5 ocupa +-1.85 a +-3.15: bien
    // dentro del asfalto. En +-3.5 (+-2.85 a +-4.15) caia sobre el arcen,
    // la franja oscura del borde, y se veia fuera del carril.
    if (!nexusAliado) nexusAliado = new Nexus(-1.45, -23.00, false);
    if (!nexusEnemigo) nexusEnemigo = new Nexus(1.57, 22.94, true);
    if (!shopAliada) shopAliada = new Shop(2.05, -23.03, false);
    if (!shopEnemiga) shopEnemiga = new Shop(-2.05, 22.78, true);
    if (towers.length === 0) {
        createTower(-2.5, -18, false, 1);
        createTower(-2.5, -6, false, 2);
        createTower(3.13, 17.62, true, 1);
        createTower(3.11, 5.98, true, 2);
    }
    inicializarCamaraFija();
}

let nexusAliado = null;
let nexusEnemigo = null;
let shopAliada = null;
let shopEnemiga = null;

cargarLanePart(0);
cargarLanePart(1);

class Nexus {
    constructor(x, z, isEnemy = false) {
        this.isEnemy = isEnemy;
        this.maxHealth = CONFIG.nexusHealth;
        this.health = this.maxHealth;
        this.isDead = false;
        this.segments = 10;
        this.type = 'nexus';
        this.explosionParticles = [];
        this.isExploding = false;
        const color = isEnemy ? 0x882222 : 0x224488;
        const emissiveColor = isEnemy ? 0xff4444 : 0x4488ff;
        const targetHeight = isEnemy ? CONFIG.NEXUS_GLB_HEIGHT * CONFIG.NEXUS_GLB_SCALE_ENEMY : CONFIG.NEXUS_GLB_HEIGHT * CONFIG.NEXUS_GLB_SCALE_ALLY;
        this.group = new THREE.Group();
        this.group.userData.targetRef = this;
        const useGLB = isEnemy ? !!CONFIG.NEXUS_GLB_ENEMY : !!CONFIG.NEXUS_GLB_ALLY;
        if (useGLB) this.loadNexusGLB(isEnemy);
        else this.buildProceduralNexus(isEnemy, color, emissiveColor);
        const hb = createHealthBar(this.segments, this.isEnemy);
        hb.sprite.position.y = targetHeight + 0.5;
        this.group.add(hb.sprite);
        this.spriteMat = hb.spriteMat;
        this.group.position.set(x, GROUND_Y, z);
        scene.add(this.group);
        this.position = new THREE.Vector3(x, 0, z);
    }

    loadNexusGLB(isEnemy) {
        const loader = sharedGLTFLoader;
        const path = isEnemy ? CONFIG.NEXUS_GLB_ENEMY : CONFIG.NEXUS_GLB_ALLY;
        const rY = isEnemy ? CONFIG.NEXUS_GLB_ROTATION_Y_ENEMY : CONFIG.NEXUS_GLB_ROTATION_Y_ALLY;
        const eq = isEnemy ? CONFIG.NEXUS_GLB_SCALE_ENEMY : CONFIG.NEXUS_GLB_SCALE_ALLY;
        loader.load(path, (gltf) => {
            const model = gltf.scene;
            const bbox = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const curH = size.y > 0.0001 ? size.y : 1;
            const sf = (CONFIG.NEXUS_GLB_HEIGHT / curH) * eq;
            model.scale.setScalar(sf);
            const bbox2 = new THREE.Box3().setFromObject(model);
            model.position.y = -bbox2.min.y;
            model.position.x = -(bbox2.min.x + bbox2.max.x) / 2;
            model.position.z = -(bbox2.min.z + bbox2.max.z) / 2;
            model.traverse((n) => { if (n.isMesh) { n.castShadow = false; n.receiveShadow = false; n.userData.targetRef = this; } });
            model.rotation.y = rY;
            this.group.add(model);
        }, undefined, () => this.buildProceduralNexus(isEnemy, isEnemy ? 0x882222 : 0x224488, isEnemy ? 0xff4444 : 0x4488ff));
    }

    buildProceduralNexus(isEnemy, color, emissiveColor) {
        const baseGeo = new THREE.CylinderGeometry(1.8, 2.1, 0.35, 24);
        const baseMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.5 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.userData.targetRef = this;
        this.group.add(base);
        const nexusGeo = new THREE.SphereGeometry(0.9, 24, 24);
        const nexusMat = new THREE.MeshStandardMaterial({ color: emissiveColor, emissive: emissiveColor, emissiveIntensity: 0.8, transparent: true, opacity: 0.85 });
        const nexusMesh = new THREE.Mesh(nexusGeo, nexusMat);
        nexusMesh.position.y = 1.0;
        nexusMesh.userData.targetRef = this;
        this.group.add(nexusMesh);
    }

    updateHealthBar() {
        const hp = this.health / this.maxHealth;
        const vis = Math.max(0, Math.min(this.segments, Math.ceil(hp * this.segments)));
        updateHealthBarSprite(this.spriteMat, this.segments, vis, this.isEnemy);
    }

    takeDamage(damage) {
        if (this.isDead) return;
        this.health -= damage;
        this.updateHealthBar();
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            this.startExplosion();
            // Sonido de explosión del nexo
            audio.play('explosion', { volume: 0.8 });
            console.log(`💀 NEXO ${this.isEnemy ? 'ENEMIGO' : 'ALIADO'} DESTRUIDO!`);
            if (this.isEnemy) showVictoryScreen();
            else showDefeatScreen();
        }
    }

    startExplosion() {
        if (this.isExploding) return;
        this.isExploding = true;
        this.group.visible = false;
        const pos = this.group.position.clone();
        pos.y = 1.0;
        for (let i = 0; i < 50; i++) {
            const geo = new THREE.SphereGeometry(0.2, 6, 6);
            const mat = new THREE.MeshBasicMaterial({ color: [0xff4444, 0xff8800, 0xffff00][Math.floor(Math.random() * 3)], transparent: true, opacity: 0.8 });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos);
            p.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 8);
            p.userData.life = 1.5 + Math.random() * 1.5;
            p.userData.maxLife = p.userData.life;
            scene.add(p);
            this.explosionParticles.push(p);
        }
    }

    updateExplosion(delta) {
        if (!this.isExploding) return;
        for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
            const p = this.explosionParticles[i];
            p.userData.life -= delta;
            if (p.userData.life <= 0) { scene.remove(p); this.explosionParticles.splice(i, 1); continue; }
            const ratio = p.userData.life / p.userData.maxLife;
            p.position.x += p.userData.vel.x * delta;
            p.position.y += p.userData.vel.y * delta;
            p.position.z += p.userData.vel.z * delta;
            p.userData.vel.y -= 2 * delta;
            p.material.opacity = ratio * 0.8;
        }
    }

    die() { this.takeDamage(this.health); }
}

let shopUI = null;
let shopOpen = false;
let shopActiveTab = 'potions';
let shopAutoOpenCooldown = 0;

class Shop {
    constructor(x, z, isEnemy = false) {
        this.isEnemy = isEnemy;
        this.x = x;
        this.z = z;
        this.group = new THREE.Group();
        this.group.position.set(x, GROUND_Y, z);
        this.type = 'shop';
        this.isEnemyShop = isEnemy;
        this.group.rotation.y = isEnemy ? Math.PI : 0;
        const useGLB = isEnemy ? !!CONFIG.SHOP_GLB_ENEMY : !!CONFIG.SHOP_GLB_ALLY;
        if (useGLB) this.loadShopGLB(isEnemy);
        else this.buildProceduralShop(isEnemy);
        scene.add(this.group);
    }

    loadShopGLB(isEnemy) {
        const loader = sharedGLTFLoader;
        const path = isEnemy ? CONFIG.SHOP_GLB_ENEMY : CONFIG.SHOP_GLB_ALLY;
        const rY = isEnemy ? CONFIG.SHOP_GLB_ROTATION_Y_ENEMY : CONFIG.SHOP_GLB_ROTATION_Y_ALLY;
        const eq = isEnemy ? CONFIG.SHOP_GLB_SCALE_ENEMY : CONFIG.SHOP_GLB_SCALE_ALLY;
        loader.load(path, (gltf) => {
            const model = gltf.scene;
            const bbox = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const curH = size.y > 0.0001 ? size.y : 1;
            const sf = (CONFIG.SHOP_GLB_HEIGHT / curH) * eq;
            model.scale.setScalar(sf);
            const bbox2 = new THREE.Box3().setFromObject(model);
            model.position.y = -bbox2.min.y;
            model.position.x = -(bbox2.min.x + bbox2.max.x) / 2;
            model.position.z = -(bbox2.min.z + bbox2.max.z) / 2;
            model.traverse((n) => { if (n.isMesh) { n.castShadow = false; n.receiveShadow = false; n.userData.shopRef = this; } });
            model.rotation.y = rY;
            this.group.add(model);
        }, undefined, () => this.buildProceduralShop(isEnemy));
    }

    buildProceduralShop(isEnemy) {
        const baseGeo = new THREE.CylinderGeometry(1.0, 1.3, 0.25, 20);
        const baseMat = new THREE.MeshStandardMaterial({ color: isEnemy ? 0x882222 : 0x224488, roughness: 0.3, metalness: 0.5 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.userData.shopRef = this;
        this.group.add(base);
    }

    update() {}
}

function createShopUI() {
    if (shopUI) shopUI.remove();
    shopUI = document.createElement('div');
    shopUI.id = 'shop-ui';
    shopUI.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 600px; max-height: 70vh; background: rgba(0,0,0,0.95);
        border: 3px solid rgba(255,200,50,0.6); border-radius: 16px;
        z-index: 2000; color: #fff; display: none; flex-direction: column;
    `;
    const header = document.createElement('div');
    header.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:15px 20px;background:rgba(255,200,50,0.1);border-bottom:2px solid rgba(255,200,50,0.3);border-radius:13px 13px 0 0;`;
    header.innerHTML = `<div style="font-size:24px;font-weight:bold;color:#ffcc44;letter-spacing:3px;">🏪 TIENDA</div>`;
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `background:rgba(255,68,68,0.2);border:2px solid rgba(255,68,68,0.6);color:#ff4444;font-size:20px;font-weight:bold;width:36px;height:36px;border-radius:8px;cursor:pointer;`;
    closeBtn.onclick = () => closeShop();
    header.appendChild(closeBtn);
    shopUI.appendChild(header);

    const tabs = document.createElement('div');
    tabs.style.cssText = `display:flex;gap:5px;padding:10px 20px;background:rgba(0,0,0,0.5);`;
    const potionsTab = document.createElement('button');
    potionsTab.textContent = '🧪 Pociones';
    potionsTab.dataset.tab = 'potions';
    potionsTab.className = 'shop-tab active';
    potionsTab.style.cssText = `flex:1;padding:12px;background:rgba(68,255,136,0.2);border:2px solid rgba(68,255,136,0.6);color:#44ff88;font-size:16px;font-weight:bold;border-radius:8px;cursor:pointer;`;
    potionsTab.onclick = () => switchTab('potions');
    tabs.appendChild(potionsTab);
    const itemsTab = document.createElement('button');
    itemsTab.textContent = '⚔️ Items';
    itemsTab.dataset.tab = 'items';
    itemsTab.className = 'shop-tab';
    itemsTab.style.cssText = `flex:1;padding:12px;background:rgba(136,170,255,0.1);border:2px solid rgba(136,170,255,0.3);color:#88aaff;font-size:16px;font-weight:bold;border-radius:8px;cursor:pointer;`;
    itemsTab.onclick = () => switchTab('items');
    tabs.appendChild(itemsTab);
    shopUI.appendChild(tabs);

    const content = document.createElement('div');
    content.id = 'shop-content';
    content.style.cssText = `flex:1;padding:20px;overflow-y:auto;min-height:300px;`;
    shopUI.appendChild(content);
    document.body.appendChild(shopUI);
}

function switchTab(tab) {
    shopActiveTab = tab;
    const tabs = document.querySelectorAll('.shop-tab');
    tabs.forEach(t => {
        if (t.dataset.tab === tab) {
            t.style.background = 'rgba(68,255,136,0.3)';
            t.style.borderColor = 'rgba(68,255,136,0.8)';
            t.style.color = '#44ff88';
        } else {
            t.style.background = 'rgba(136,170,255,0.1)';
            t.style.borderColor = 'rgba(136,170,255,0.3)';
            t.style.color = '#88aaff';
        }
    });
    renderShopContent();
}

function renderShopContent() {
    const content = document.getElementById('shop-content');
    if (!content) return;
    content.innerHTML = '';
    if (shopActiveTab === 'potions') renderPotions(content);
    else renderItems(content);
}

function renderPotions(container) {
    const potions = Object.values(PLAYER_SHOP_CATALOG.potions);
    potions.forEach(p => {
        const count = p.id === 'hp' ? potionHPCount : potionMPCount;
        const atMax = count >= p.max;
        const canAfford = playerGold >= p.cost;
        const item = createShopItem(
            p.emoji, 
            p.name, 
            p.desc, 
            p.color, 
            `💰 ${p.cost}  ·  Tienes: ${count}/${p.max}`, 
            !atMax && canAfford, 
            atMax ? 'Máximo (10)' : (canAfford ? 'Comprar' : 'Sin oro'), 
            () => buyPotion(p.id)
        );
        container.appendChild(item);
    });
}

function renderItems(container) {
    const items = Object.values(PLAYER_SHOP_CATALOG.items);
    const hasEmptySlot = playerItemSlots.some(s => s === null);
    const slotsUsed = playerItemSlots.filter(s => s !== null).length;
    items.forEach(itemData => {
        const canAfford = playerGold >= itemData.cost;
        const canBuy = hasEmptySlot && canAfford;
        const desc = `${itemData.desc}`;
        const statusText = !hasEmptySlot ? `Slots: ${slotsUsed}/6` : (canAfford ? 'Comprar' : 'Sin oro');
        const item = createShopItem(
            itemData.emoji, 
            itemData.name, 
            desc, 
            itemData.color, 
            `💰 ${itemData.cost}  ·  Slots: ${slotsUsed}/6`, 
            canBuy, 
            statusText, 
            () => buyItem(itemData.id)
        );
        container.appendChild(item);
    });
}

function createShopItem(emoji, name, desc, color, priceText, enabled, buttonText, onBuy) {
    const item = document.createElement('div');
    item.style.cssText = `display:flex;align-items:center;gap:15px;padding:12px 15px;margin-bottom:10px;background:rgba(255,255,255,${enabled ? '0.05' : '0.02'});border:1px solid rgba(255,255,255,${enabled ? '0.1' : '0.05'});border-radius:10px;opacity:${enabled ? '1' : '0.5'};`;
    if (enabled) {
        item.onmouseenter = () => { item.style.background = 'rgba(255,255,255,0.1)'; item.style.borderColor = color; };
        item.onmouseleave = () => { item.style.background = 'rgba(255,255,255,0.05)'; item.style.borderColor = 'rgba(255,255,255,0.1)'; };
    }
    const icon = document.createElement('div');
    icon.textContent = emoji;
    icon.style.cssText = `font-size:36px;width:50px;text-align:center;`;
    item.appendChild(icon);
    const info = document.createElement('div');
    info.style.cssText = 'flex:1;';
    info.innerHTML = `<div style="font-size:16px;font-weight:bold;color:${color};margin-bottom:3px;">${name}</div><div style="font-size:12px;color:#aaa;margin-bottom:3px;">${desc}</div><div style="font-size:12px;color:#ffcc44;font-weight:bold;">${priceText}</div>`;
    item.appendChild(info);
    const buyBtn = document.createElement('button');
    buyBtn.textContent = buttonText;
    buyBtn.disabled = !enabled;
    buyBtn.style.cssText = `padding:10px 20px;background:${enabled ? `linear-gradient(135deg, ${color}, ${color}88)` : 'rgba(255,255,255,0.1)'};border:none;color:${enabled ? '#000' : '#666'};font-size:14px;font-weight:bold;border-radius:8px;cursor:${enabled ? 'pointer' : 'not-allowed'};min-width:100px;`;
    if (enabled) {
        buyBtn.onmouseenter = () => { buyBtn.style.transform = 'scale(1.05)'; };
        buyBtn.onmouseleave = () => { buyBtn.style.transform = 'scale(1)'; };
        buyBtn.onclick = onBuy;
    }
    item.appendChild(buyBtn);
    return item;
}

function openShop() {
    if (shopOpen) return;
    if (!shopUI) createShopUI();
    shopOpen = true;
    shopUI.style.display = 'flex';
    switchTab('potions');
    // Ya no se pausa el juego al abrir la tienda
    gamePaused = false;
    isMovingToTarget = false;
    targetPosition = null;
    isAutoMovingToTarget = false;
    window.currentTarget = null;
    if (targetUI) targetUI.style.display = 'none';
    isMouseDownRight = false;
    isMouseDownLeft = false;
    isDragging = false;
    // Sonido de tienda
    audio.play('shop', { volume: 0.4 });
    console.log('🏪 Tienda abierta (juego pausado)');
}

function closeShop() {
    if (shopUI) shopUI.style.display = 'none';
    shopOpen = false;
    gamePaused = false;
    lastTime = performance.now();
    isMouseDownRight = false;
    isMouseDownLeft = false;
    isDragging = false;
    shopAutoOpenCooldown = CONFIG.SHOP_AUTO_OPEN_COOLDOWN;
    console.log('🏪 Tienda cerrada (juego reanudado)');
}

function buyPotion(type) {
    const potion = PLAYER_SHOP_CATALOG.potions[type];
    if (!potion) return;
    const currentCount = type === 'hp' ? potionHPCount : potionMPCount;
    if (currentCount >= potion.max) return;
    if (!spendPlayerGold(potion.cost)) { console.log(`⛔ Sin oro`); return; }
    if (type === 'hp') potionHPCount++;
    else if (type === 'mp') potionMPCount++;
    console.log(`🛒 ${potion.name} (${potion.cost} oro) | Tienes: ${type === 'hp' ? potionHPCount : potionMPCount}/${potion.max}`);
    updatePotionHUD();
    renderShopContent();
    renderer.render(scene, camera);
}

function buyItem(itemId) {
    const itemData = PLAYER_SHOP_CATALOG.items[itemId];
    if (!itemData) return;
    const emptySlotIndex = playerItemSlots.findIndex(s => s === null);
    if (emptySlotIndex === -1) {
        console.log('⛔ Inventario lleno (6/6 items)');
        return;
    }
    if (!spendPlayerGold(itemData.cost)) { console.log(`⛔ Sin oro`); return; }
    itemData.apply();
    playerItemSlots[emptySlotIndex] = { id: itemId, emoji: itemData.emoji, name: itemData.name, color: itemData.color };
    console.log(`🛒 ${itemData.name} comprado → slot ${emptySlotIndex + 1}/6`);
    updateItemHUD();
    renderShopContent();
    renderer.render(scene, camera);
}

function updateItemHUD() {
    for (let i = 0; i < itemSlots.length; i++) {
        const slot = itemSlots[i];
        const item = playerItemSlots[i];
        if (item) {
            slot.textContent = item.emoji;
            slot.style.fontSize = '18px';
            slot.style.background = `${item.color}22`;
            slot.style.borderColor = item.color;
            slot.title = item.name;
            slot.dataset.itemName = item.id;
        } else {
            slot.textContent = '';
            slot.style.fontSize = '13px';
            slot.style.background = 'rgba(255,255,255,0.05)';
            slot.style.borderColor = 'rgba(255,255,255,0.15)';
            slot.title = '';
            delete slot.dataset.itemName;
        }
    }
}

function getShopFromClick(event) {
    if (!renderer) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const selectables = [];
    [shopAliada, shopEnemiga].forEach(shop => { if (shop) shop.group.traverse(c => { if (c.isMesh) selectables.push(c); }); });
    const intersects = raycaster.intersectObjects(selectables);
    if (intersects.length > 0) {
        let parent = intersects[0].object;
        while (parent) {
            if (parent.userData && parent.userData.shopRef) return parent.userData.shopRef;
            parent = parent.parent;
        }
    }
    return null;
}

class TowerProjectile {
    constructor(startPos, target, isEnemy = false, damage = 20) {
        this.target = target; this.damage = damage; this.isEnemy = isEnemy;
        this.speed = CONFIG.projectileSpeed; this.active = true; this.targetRef = target;
        const color = isEnemy ? 0xff4444 : 0x4488ff;
        const geo = new THREE.SphereGeometry(0.12, 8, 8);
        const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8 });
        this.mesh = new THREE.Mesh(geo, mat);
        // TAREA B: el disparo nace EN LO ALTO de la torre.
        // Antes: this.mesh.position.copy(startPos) seguido de .y = 0.3,
        // que machacaba la altura del firePoint y hacia que la torre
        // disparase desde los pies. Aqui se respeta el origen real.
        this.mesh.position.copy(startPos);
        this.startY = startPos.y;
        // El objetivo vuela a la altura del pecho de un minion, no a ras de suelo.
        this.targetY = GROUND_Y + 0.45;
        this.arcHeight = CONFIG.TOWER_SHOT_ARC_HEIGHT;
        this.travelled = 0;
        this.totalDist = this.mesh.position.distanceTo(
            new THREE.Vector3(target.group.position.x, this.targetY, target.group.position.z)
        );
        scene.add(this.mesh);
    }

    update(delta) {
        if (!this.active) return;
        if (!this.targetRef || !this.targetRef.group || this.targetRef.isDead) { this.active = false; scene.remove(this.mesh); return; }
        // Objetivo a la altura del pecho, no a 0.3 (que era el bug del suelo).
        const tp = new THREE.Vector3(this.targetRef.group.position.x, this.targetY, this.targetRef.group.position.z);
        const dx = tp.x - this.mesh.position.x;
        const dz = tp.z - this.mesh.position.z;
        const flatDist = Math.sqrt(dx * dx + dz * dz);
        if (flatDist > 0.0001) {
            const step = this.speed * delta;
            this.mesh.position.x += (dx / flatDist) * step;
            this.mesh.position.z += (dz / flatDist) * step;
            this.travelled += step;
        }
        // Arco balistico: sube al salir y baja al llegar.
        // t=0 al nacer (y=startY) y t=1 al impactar (y=targetY).
        const t = this.totalDist > 0.001 ? Math.min(1, this.travelled / this.totalDist) : 1;
        const baseY = this.startY + (this.targetY - this.startY) * t;
        this.mesh.position.y = baseY + Math.sin(t * Math.PI) * this.arcHeight;
        if (this.mesh.position.distanceTo(this.targetRef.group.position) < 0.8) this.hit();
        if (Math.abs(this.mesh.position.x) > 20 || Math.abs(this.mesh.position.z) > 30) { this.active = false; scene.remove(this.mesh); }
    }

    hit() {
        if (!this.active) return;
        this.active = false;
        if (!this.targetRef.isDead) {
            let targetDied = false;
            let reward = 0;
            const deathPosition = this.mesh.position.clone();
            if (this.targetRef.type === 'player') {
                playerTakeDamage(this.damage, DMG_MAGIC);
                if (isAITrainingMode) playerAILastDamageTime = gameTime;
            } else if (this.targetRef.type === 'enemy_axie' && enemyAxie) {
                const prev = enemyAxie.health;
                enemyAxieTakeDamage(this.damage);
                enemyAxieLastDamageTime = gameTime;
                if (prev > 0 && enemyAxieIsDead) {
                    targetDied = true;
                    reward = Math.round(ECONOMY.REWARD_ENEMY_AXIE_KILL * 0.5);
                    if (enemyAxieModel) deathPosition.copy(enemyAxieModel.position);
                }
            } else {
                this.targetRef.health -= this.damage;
                if (this.targetRef.updateHealthBar) this.targetRef.updateHealthBar();
                if (this.targetRef.flashHit) this.targetRef.flashHit();
                if (this.targetRef.health <= 0) {
                    targetDied = true;
                    if (this.targetRef.type === 'tower') { reward = ECONOMY.REWARD_TOWER_KILL; if (this.targetRef.position) deathPosition.copy(this.targetRef.position); }
                    else if (this.targetRef.type === 'minion') {
                        const isMage = this.targetRef.tipo === 'mage';
                        reward = Math.round((isMage ? ECONOMY.REWARD_MAGE_KILL : ECONOMY.REWARD_MINION_KILL) * 0.5);
                        if (this.targetRef.group) deathPosition.copy(this.targetRef.group.position);
                    }
                    if (this.targetRef.die) this.targetRef.die('tower');
                }
            }
            if (targetDied && !this.isEnemy && !isAITrainingMode && reward > 0) {
                givePlayerGold(reward, `🗼 Torre aliada (asistencia)`);
                deathPosition.y = GROUND_Y + 1.2;
                showGoldPopupAt3D(reward, deathPosition, '#88ddff');
            }
        }
        scene.remove(this.mesh);
    }
}

// ============================================================
// ATAQUE BASICO DEL AXIE
// ------------------------------------------------------------
// Bing (canon) dispara un proyectil bala desde el canon.
// Kotaro (katana) da un golpe melee sin proyectil.
// Los dos reproducen el clip de ataque del GLB, que esta hecho para
// ir con el arma, para que la animacion y el disparo coincidan.
// ============================================================
function dispararAtaqueJugador(target, origen, dmg) {
    // 1) Clip de ataque (Cannon.Attack / Sword.Attack), si el GLB lo trae
    if (animAttack) {
        animAttack.reset();
        animAttack.setEffectiveWeight(1);
        animAttack.setLoop(THREE.LoopOnce, 1);
        animAttack.clampWhenFinished = true;
        if (animWalk) animWalk.stop();
        if (animIdle) animIdle.stop();
        animAttack.fadeIn(0.05).play();
        attackAnimTimer = 0.55;
        currentAnim = 'attack';
    }

    if (currentAttackTipo === 'melee') {
        // Golpe fisico: dano inmediato, sin proyectil
        aplicarDanoMeleeJugador(target, dmg);
        return;
    }

    // Disparo a distancia: el proyectil nace del arma, no del centro del cuerpo.
    // El aspecto lo decide el arma: canon -> bala, baston -> orbe, hacha magica -> rayo.
    const punto = puntoDeDisparo(origen);
    const proj = new PlayerProjectile(punto, target, dmg, proyectilDelPerfil());
    playerProjectiles.push(proj);
    // Sonido de disparo
    audio.play('shoot', { volume: 0.6 });
}

// Traduce el arma del Axie (segun el catalogo) al aspecto del proyectil.
// OJO: no basta con mirar clipArma. Tripp lo tiene en null porque su GLB no
// trae clips Axe.Idle/Axe.Walk, pero SI empuna un hacha (ataca con
// Axe.Attack). Con clipArma=null caia en 'default' y lanzaba un proyectil
// 'orb' sin material asignado: el rayo violeta no se veia. Se deduce el
// arma del prefijo de 'ataque' como respaldo.
function proyectilDelPerfil() {
    const perfil = getPerfilCombate(selectedAxieId);
    const arma = perfil.clipArma
        || (perfil.ataque ? String(perfil.ataque).split('.')[0] : null);
    switch (arma) {
        case 'Cannon': return 'bala';
        case 'Staff':  return 'orbe';
        case 'Axe':    return 'rayo';
        default:       return 'bala';
    }
}

// Devuelve el punto de salida del canon: mano derecha del Axie si se puede
// localizar el hueso, si no el origen elevado a la altura del pecho.
function puntoDeDisparo(origen) {
    const p = origen.clone();
    if (playerModel) {
        const hueso = (() => {
            let hit = null;
            playerModel.traverse((n) => {
                if (!hit && n.isBone && n.name.toLowerCase().includes('weapon_r')) hit = n;
            });
            return hit;
        })();
        if (hueso) {
            const wp = new THREE.Vector3();
            hueso.getWorldPosition(wp);
            p.copy(wp);
            return p;
        }
    }
    p.y = 0.9;
    return p;
}

// Dano melee directo al objetivo (Kotaro con la katana)
function aplicarDanoMeleeJugador(target, dmg) {
    if (!target || target.isDead) return;
    const wasEnemyAxie = target.type === 'enemy_axie';
    const wasTower = target.type === 'tower';
    const wasNexus = target.type === 'nexus';
    const wasMinion = target.type === 'minion';

    if (wasEnemyAxie && enemyAxie) {
        const prev = enemyAxie.health;
        enemyAxieTakeDamage(dmg);
        if (prev > 0 && enemyAxieIsDead) {
            givePlayerGold(ECONOMY.REWARD_ENEMY_AXIE_KILL, '🤖 Axie enemigo eliminado');
        }
        return;
    }
    if (target.ref && target.ref.health !== undefined) {
        target.ref.health -= dmg;
        if (target.ref.updateHealthBar) target.ref.updateHealthBar();
        if (target.ref.flashHit) target.ref.flashHit();
        if (target.ref.health <= 0 && target.ref.die) {
            target.ref.die('player');
            if (wasMinion) givePlayerGold(ECONOMY.REWARD_MINION_KILL, '👾 Minion eliminado');
            else if (wasTower) givePlayerGold(ECONOMY.REWARD_TOWER_KILL, '🗼 Torre destruida');
            else if (wasNexus) givePlayerGold(ECONOMY.REWARD_NEXUS_KILL, '💎 Nexo destruido');
        }
    }
}

class PlayerProjectile {
    constructor(startPos, target, damage = 15, tipo = 'orb') {
        this.target = target; this.damage = damage; this.speed = CONFIG.projectileSpeed;
        this.active = true; this.targetRef = target;
        this.tipo = tipo;

        if (tipo === 'bala') {
            // Bala de canon: esfera caliente con estela, sale del canon de Bing.
            const color = 0xffaa33;
            const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.2 });
            this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), mat);
            const halo = new THREE.Mesh(
                new THREE.SphereGeometry(0.20, 10, 10),
                new THREE.MeshBasicMaterial({ color: 0xffdd88, transparent: true, opacity: 0.35 })
            );
            this.mesh.add(halo);
        } else if (tipo === 'rayo') {
            // Rayo magico (Pomodoro con el baston, Tripp con el hacha): núcleo
            // violeta alargado en la direccion del disparo, con un halo suelto.
            // Se alarga en el eje Z porque el proyectil avanza hacia el objetivo.
            const color = 0xbb66ff;
            const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.6 });
            this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), mat);
            this.mesh.scale.set(0.75, 0.75, 1.9);
            const halo = new THREE.Mesh(
                new THREE.SphereGeometry(0.26, 10, 10),
                new THREE.MeshBasicMaterial({ color: 0xddaaff, transparent: true, opacity: 0.30 })
            );
            halo.scale.set(0.7, 0.7, 1.6);
            this.mesh.add(halo);
        } else if (tipo === 'orbe') {
            // Orbe del baston (Pomodoro): mas pequeno y verde, sin halo caliente.
            const color = 0x66ffcc;
            const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6 });
            this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), mat);
            const halo = new THREE.Mesh(
                new THREE.SphereGeometry(0.22, 10, 10),
                new THREE.MeshBasicMaterial({ color: 0xaaffee, transparent: true, opacity: 0.28 })
            );
            this.mesh.add(halo);
        } else {
            // Orbe magico (por defecto, el del jugador sin arma de fuego).
            const color = 0x44ff88;
            const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.0 });
            this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), mat);
        }

        this.mesh.position.copy(startPos);
        scene.add(this.mesh);
        this.startPos = startPos.clone();
        this.endPos = target.group.position.clone(); this.endPos.y = startPos.y;
        this.progress = 0;
    }

    update(delta) {
        if (!this.active) return;
        if (!this.targetRef || !this.targetRef.group || this.targetRef.isDead) { this.active = false; scene.remove(this.mesh); return; }
        this.endPos.copy(this.targetRef.group.position); this.endPos.y = this.startPos.y;
        this.progress += delta * this.speed;
        if (this.progress >= 1) { this.hit(); return; }
        const cur = new THREE.Vector3().lerpVectors(this.startPos, this.endPos, this.progress);
        this.mesh.position.copy(cur);
    }

    hit() {
        if (!this.active) return;
        this.active = false;
        if (this.targetRef.isDead) { scene.remove(this.mesh); return; }
        const wasEnemyAxie = this.targetRef.type === 'enemy_axie';
        const wasTower = this.targetRef.type === 'tower';
        const wasNexus = this.targetRef.type === 'nexus';
        const wasMinion = this.targetRef.type === 'minion';
        let targetDied = false;
        let reward = 0;
        let rewardReason = '';
        const deathPosition = this.mesh.position.clone();
        // Sonido de impacto
        audio.play('hit', { volume: 0.5 });
        if (wasEnemyAxie && enemyAxie) {
            const prev = enemyAxie.health;
            enemyAxieTakeDamage(this.damage);
            if (prev > 0 && enemyAxieIsDead) {
                targetDied = true;
                reward = ECONOMY.REWARD_ENEMY_AXIE_KILL;
                rewardReason = '🤖 Axie enemigo eliminado';
                if (enemyAxieModel) deathPosition.copy(enemyAxieModel.position);
            }
        } else if (this.targetRef.isEnemy === true) {
            this.targetRef.health -= this.damage;
            if (this.targetRef.updateHealthBar) this.targetRef.updateHealthBar();
            if (this.targetRef.flashHit) this.targetRef.flashHit();
            if (window.currentTarget === this.targetRef) window.showTarget(this.targetRef);
            if (this.targetRef.health <= 0) {
                targetDied = true;
                if (wasTower) { reward = ECONOMY.REWARD_TOWER_KILL; rewardReason = '🗼 Torre destruida'; if (this.targetRef.position) deathPosition.copy(this.targetRef.position); }
                else if (wasNexus) { reward = ECONOMY.REWARD_NEXUS_KILL; rewardReason = '💎 Nexo destruido'; }
                else if (wasMinion) {
                    const isMage = this.targetRef.tipo === 'mage';
                    reward = isMage ? ECONOMY.REWARD_MAGE_KILL : ECONOMY.REWARD_MINION_KILL;
                    rewardReason = isMage ? '🧙 Mago eliminado' : '⚔️ Minion eliminado';
                    if (this.targetRef.group) deathPosition.copy(this.targetRef.group.position);
                }
                if (this.targetRef.die) this.targetRef.die('player');
                if (window.currentTarget === this.targetRef) { window.currentTarget = null; targetUI.style.display = 'none'; }
            }
        }
        if (targetDied && !isAITrainingMode) {
            if (!playerFirstBlood && wasMinion) {
                playerFirstBlood = true;
                reward += ECONOMY.REWARD_FIRST_BLOOD;
                rewardReason += ' + 🩸 ¡Primera sangre!';
            }
            playerKillStreak++;
            givePlayerGold(reward, rewardReason);
            deathPosition.y = GROUND_Y + 1.2;
            showGoldPopupAt3D(reward, deathPosition, '#ffcc44');
        }
        if (targetDied && isAITrainingMode) {
            let aiReward = 0;
            if (wasTower) aiReward = PLAYER_GOLD_PER_TOWER_KILL;
            else if (wasNexus) aiReward = PLAYER_GOLD_PER_NEXUS_KILL;
            else if (wasMinion) { aiReward = (this.targetRef.tipo === 'mage') ? 18 : PLAYER_GOLD_PER_MINION_KILL; }
            else if (wasEnemyAxie) aiReward = PLAYER_GOLD_PER_ENEMY_AXIE_KILL;
            playerAIGold += aiReward;
        }
        playerAttackTarget = this.targetRef;
        setTimeout(() => { playerAttackTarget = null; }, 2000);
        scene.remove(this.mesh);
    }
}

class AxieTower {
    constructor(x, z, isEnemy = false, tier = 1) {
        this.isEnemy = isEnemy;
        this.tier = tier;
        this.maxHealth = CONFIG.towerHealth + (tier === 2 ? 200 : 0);
        this.health = this.maxHealth;
        this.isDead = false;
        this.range = CONFIG.towerRange + (tier === 2 ? 1 : 0);
        this.damage = CONFIG.towerDamage + (tier === 2 ? 10 : 0);
        this.fireRate = CONFIG.towerFireRate - (tier === 2 ? 0.3 : 0);
        this.cooldown = 0;
        this.target = null;
        this.segments = 10;
        this.type = 'tower';
        this.group = new THREE.Group();
        this.group.userData.targetRef = this;
        const tH = isEnemy ? CONFIG.TOWER_GLB_HEIGHT * CONFIG.TOWER_GLB_SCALE_ENEMY : CONFIG.TOWER_GLB_HEIGHT * CONFIG.TOWER_GLB_SCALE_ALLY;
        this.firePoint = new THREE.Object3D();
        this.firePoint.position.y = tH * 0.85;
        this.group.add(this.firePoint);
        const hb = createHealthBar(this.segments, this.isEnemy);
        hb.sprite.position.y = tH + 0.4;
        this.group.add(hb.sprite);
        this.spriteMat = hb.spriteMat;
        this.group.position.set(x, GROUND_Y, z);
        scene.add(this.group);
        this.position = new THREE.Vector3(x, 0, z);
        this.projectiles = [];
        this.loadTowerGLB(tier);
    }

    loadTowerGLB(tier) {
        const loader = sharedGLTFLoader;
        const path = this.isEnemy ? CONFIG.TOWER_GLB_ENEMY : CONFIG.TOWER_GLB_ALLY;
        const rY = this.isEnemy ? CONFIG.TOWER_GLB_ROTATION_Y_ENEMY : CONFIG.TOWER_GLB_ROTATION_Y_ALLY;
        const eq = this.isEnemy ? CONFIG.TOWER_GLB_SCALE_ENEMY : CONFIG.TOWER_GLB_SCALE_ALLY;
        loader.load(path, (gltf) => {
            const model = gltf.scene;
            const bbox = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const curH = size.y > 0.0001 ? size.y : 1;
            const sf = (CONFIG.TOWER_GLB_HEIGHT / curH) * eq;
            model.scale.setScalar(sf);
            const bbox2 = new THREE.Box3().setFromObject(model);
            model.position.y = -bbox2.min.y;
            model.position.x = -(bbox2.min.x + bbox2.max.x) / 2;
            model.position.z = -(bbox2.min.z + bbox2.max.z) / 2;
            model.traverse((n) => { if (n.isMesh) { n.castShadow = false; n.receiveShadow = false; n.userData.targetRef = this; } });
            model.rotation.y = rY;
            this.group.add(model);
        }, undefined, () => this.buildProceduralTower());
    }

    buildProceduralTower() {
        const baseGeo = new THREE.CylinderGeometry(0.55, 0.7, 0.25, 12);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.8, metalness: 0.2 });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = 0.125;
        baseMesh.userData.targetRef = this;
        this.group.add(baseMesh);
    }

    updateHealthBar() {
        const hp = this.health / this.maxHealth;
        const vis = Math.max(0, Math.min(this.segments, Math.ceil(hp * this.segments)));
        updateHealthBarSprite(this.spriteMat, this.segments, vis, this.isEnemy);
    }

    takeDamage(damage) {
        if (this.isDead) return;
        this.health -= damage;
        this.updateHealthBar();
        if (this.health <= 0) {
            this.health = 0; this.isDead = true; this.group.visible = false;
            for (const p of this.projectiles) { p.active = false; scene.remove(p.mesh); }
            this.projectiles = [];
            // Sonido de explosión de torre
            audio.play('explosion', { volume: 0.7 });
            // TAREA C: contabilizar la torre caida para desbloquear el
            // minion grande del bando contrario.
            if (this.isEnemy) towersEnemyLost.ally++;
            else towersEnemyLost.enemy++;
        }
    }

    die() { this.takeDamage(this.health); }

    update(delta, enemies) {
        if (this.isDead) return;
        this.cooldown -= delta;
        let closestEnemy = null;
        let closestDist = this.range + 1;
        const targets = this.isEnemy ? enemies.aliados : enemies.enemigos;
        for (const enemy of targets) {
            if (enemy.isDead) continue;
            const dist = this.position.distanceTo(enemy.group.position);
            if (dist < closestDist && dist <= this.range) { closestDist = dist; closestEnemy = enemy; }
        }
        if (this.isEnemy && !closestEnemy && playerModel && !isPlayerDead && playerSpawned) {
            const dist = this.position.distanceTo(playerModel.position);
            if (dist <= this.range) { closestEnemy = { group: playerModel, isDead: false, type: 'player' }; closestDist = dist; }
        }
        if (!this.isEnemy && !closestEnemy && enemyAxieModel && !enemyAxieIsDead) {
            const dist = this.position.distanceTo(enemyAxieModel.position);
            if (dist <= this.range) { closestEnemy = { group: enemyAxieModel, isDead: enemyAxieIsDead, type: 'enemy_axie' }; closestDist = dist; }
        }
        this.target = closestEnemy;
        if (this.target && closestDist <= this.range && this.cooldown <= 0) {
            this.fire();
            this.cooldown = this.fireRate;
        }
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(delta);
            if (!p.active) this.projectiles.splice(i, 1);
        }
    }

    fire() {
        if (!this.target || this.isDead) return;
        const startPos = new THREE.Vector3();
        this.firePoint.getWorldPosition(startPos);
        const proj = new TowerProjectile(startPos, this.target, this.isEnemy, this.damage);
        this.projectiles.push(proj);
    }
}

const towers = [];
// TAREA C: torres perdidas por bando. Cuando un bando pierde sus 2 torres,
// el bando contrario empieza a mandar 1 minion grande por oleada.
const towersEnemyLost = { ally: 0, enemy: 0 };
const TOWERS_TO_UNLOCK_BIG = 2;
function createTower(x, z, isEnemy = false, tier = 1) {
    const tower = new AxieTower(x, z, isEnemy, tier);
    towers.push(tower);
    return tower;
}

const timerDiv = document.createElement('div');
timerDiv.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);color:#44ff88;font-family:monospace;font-size:28px;font-weight:bold;background:rgba(0,0,0,0.8);padding:8px 24px;border-radius:12px;z-index:100;pointer-events:none;border:2px solid rgba(68,255,136,0.3);display:none;`;
timerDiv.textContent = '00:00';
document.body.appendChild(timerDiv);

const fpsDiv = document.createElement('div');
fpsDiv.style.cssText = `position:fixed;top:20px;right:20px;color:#88aaff;font-family:monospace;font-size:18px;font-weight:bold;background:rgba(0,0,0,0.7);padding:6px 14px;border-radius:8px;z-index:100;pointer-events:none;display:none;`;
fpsDiv.textContent = 'FPS: 0';
document.body.appendChild(fpsDiv);

const waveDiv = document.createElement('div');
waveDiv.style.cssText = `position:fixed;top:80px;left:50%;transform:translateX(-50%);color:#ffaa44;font-family:monospace;font-size:16px;font-weight:bold;background:rgba(0,0,0,0.7);padding:4px 16px;border-radius:8px;z-index:100;pointer-events:none;display:none;`;
waveDiv.textContent = '⏳ 15s';
document.body.appendChild(waveDiv);

const goldDiv = document.createElement('div');
goldDiv.id = 'player-gold-display';
goldDiv.style.cssText = `position:fixed;top:20px;left:20px;color:#ffcc44;font-family:'Courier New',monospace;font-size:20px;font-weight:bold;background:rgba(0,0,0,0.8);padding:8px 18px;border-radius:12px;z-index:100;pointer-events:none;border:2px solid rgba(255,200,50,0.4);text-shadow:0 0 15px rgba(255,200,50,0.5);letter-spacing:1px;display:none;`;
goldDiv.textContent = '💰 0';
document.body.appendChild(goldDiv);

const enemyAxieDebugHUD = document.createElement('div');
enemyAxieDebugHUD.style.cssText = `position:fixed;top:120px;right:20px;color:#ffcc44;font-family:monospace;font-size:12px;background:rgba(0,0,0,0.75);padding:8px 12px;border-radius:8px;z-index:100;pointer-events:none;border:1px solid rgba(255,200,68,0.3);display:none;min-width:200px;line-height:1.5;`;
document.body.appendChild(enemyAxieDebugHUD);

function updateEnemyAxieDebugHUD() {
    if (!enemyAxieSpawned || gameFinished || !isAITrainingMode) {
        enemyAxieDebugHUD.style.display = 'none';
        return;
    }
    enemyAxieDebugHUD.style.display = 'block';
    const itemsE = Object.keys(enemyAxieItems).length > 0 ? Object.entries(enemyAxieItems).map(([id, c]) => `${ENEMY_AXIE_ITEM_CATALOG[id]?.emoji || '?'}×${c}`).join(' ') : '—';
    const itemsP = Object.keys(playerAIItems).length > 0 ? Object.entries(playerAIItems).map(([id, c]) => `${ENEMY_AXIE_ITEM_CATALOG[id]?.emoji || '?'}×${c}`).join(' ') : '—';
    const hpPctE = Math.round((enemyAxie.health / enemyAxieMaxHealth) * 100);
    const hpPctP = Math.round((playerHealth / playerMaxHealth) * 100);
    enemyAxieDebugHUD.innerHTML = `
        <div style="color:#ff6644;font-weight:bold;margin-bottom:4px;">🤖 IA vs IA</div>
        <div style="color:#88ddff;">🦊 Jugador-IA</div>
        <div>  💰 ${playerAIGold} | ❤️ ${hpPctP}%</div>
        <div>  🧪 Pociones: ${playerAIPotionCount}/${CONFIG.AXIE_MAX_POTIONS}</div>
        <div>  🛒 ${itemsP}</div>
        <div style="color:#ff4444;margin-top:4px;">🤖 Axie Enemigo</div>
        <div>  💰 ${enemyAxieGold} | ❤️ ${hpPctE}%</div>
        <div>  🧪 Pociones: ${enemyAxiePotionCount}/${CONFIG.AXIE_MAX_POTIONS}</div>
        <div>  🛒 ${itemsE}</div>
        <div style="color:#aaa;margin-top:4px;font-size:10px;">Cámara: ${dynamicCameraMode}</div>
    `;
}

function updateDynamicHUDForCamera() {
    if (!isAITrainingMode) return;
    if (!hudWrapper || !playerHUD) return;

    const nameEl = playerHUD.querySelector('div[style*="font-weight:bold"]');
    const healthBar = document.getElementById('player-hud-health-bar');
    const healthText = document.getElementById('player-hud-health-text');
    const manaBar = document.getElementById('player-hud-mana-bar');
    const manaText = document.getElementById('player-hud-mana-text');
    const potionHPEl = document.getElementById('potion-hp-count');
    const potionMPEl = document.getElementById('potion-mp-count');

    const mode = dynamicCameraMode;

    itemSlots.forEach((slot) => {
        slot.textContent = '';
        slot.style.background = 'rgba(255,255,255,0.05)';
        slot.style.borderColor = 'rgba(255,255,255,0.15)';
        slot.style.color = '';
        delete slot.dataset.itemName;
    });

    if (mode === 'player') {
        if (nameEl) { nameEl.textContent = `🦊 ${currentAxieName} (IA)`; nameEl.style.color = '#44ff88'; }
        if (healthBar) {
            const pct = Math.max(0, (playerHealth / playerMaxHealth) * 100);
            healthBar.style.width = `${pct}%`;
            healthBar.style.background = 'linear-gradient(90deg,#ff2244,#ff6644)';
        }
        if (healthText) healthText.textContent = `${Math.floor(playerHealth)}/${playerMaxHealth}`;
        if (manaBar) manaBar.style.width = `${Math.max(0, (playerMana / playerMaxMana) * 100)}%`;
        if (manaText) manaText.textContent = `${Math.floor(playerMana)}/${playerMaxMana}`;
        if (potionHPEl) potionHPEl.textContent = `${potionHPCount}`;
        if (potionMPEl) potionMPEl.textContent = `${potionMPCount}`;

        for (let i = 0; i < itemSlots.length && i < 6; i++) {
            const item = playerItemSlots[i];
            if (!item) continue;
            const slot = itemSlots[i];
            slot.textContent = item.emoji;
            slot.style.fontSize = '18px';
            slot.style.background = `${item.color}22`;
            slot.style.borderColor = item.color;
            slot.title = item.name;
            slot.dataset.itemName = item.id;
        }
    } else if (mode === 'enemy') {
        if (nameEl) { nameEl.textContent = `🤖 ${enemyAxie ? enemyAxie.nombre : 'Axie'} (IA)`; nameEl.style.color = '#ff6644'; }
        if (healthBar) {
            const pct = enemyAxie ? Math.max(0, (enemyAxie.health / enemyAxieMaxHealth) * 100) : 0;
            healthBar.style.width = `${pct}%`;
            healthBar.style.background = 'linear-gradient(90deg,#ff2244,#ff6644)';
        }
        if (healthText) healthText.textContent = enemyAxie ? `${Math.floor(enemyAxie.health)}/${enemyAxieMaxHealth}` : '0/200';
        if (manaBar) manaBar.style.width = '100%';
        if (manaText) manaText.textContent = `${enemyAxieMaxHealth}/${enemyAxieMaxHealth}`;
        if (potionHPEl) potionHPEl.textContent = `${enemyAxiePotionCount}`;
        if (potionMPEl) potionMPEl.textContent = `0`;

        let slotIdx = 0;
        for (const [itemId, count] of Object.entries(enemyAxieItems)) {
            if (slotIdx >= itemSlots.length) break;
            const item = ENEMY_AXIE_ITEM_CATALOG[itemId];
            if (!item) continue;
            const slot = itemSlots[slotIdx];
            slot.textContent = count > 1 ? `${item.emoji}${count}` : item.emoji;
            slot.style.fontSize = '16px';
            slot.style.background = 'rgba(255,102,102,0.15)';
            slot.style.borderColor = '#ff6644';
            slot.dataset.itemName = itemId;
            slotIdx++;
        }
    }
}

class Minion {
    constructor(x, z, isEnemy = false, tipo = 'melee', formationIndex = 0, typeIndex = null) {
        this.isEnemy = isEnemy;
        this.tipo = tipo;
        this.formationIndex = formationIndex;
        // Posicion del minion DENTRO de su tipo (0..n-1). El slot lateral
        // sale de aqui, no del indice global de la oleada: con 3 melee en
        // vez de 5, el primer mage tenia indice global 3 y su slot salia
        // negativo, descuadrando la linea de atras.
        this.typeIndex = (typeIndex === null || typeIndex === undefined) ? formationIndex : typeIndex;
        this.minionType = tipo;

        // TAREA D: el minion grande ('big') es un melee potenciado.
        // Se calcula todo desde el melee base para que si ajustas el melee,
        // el grande siga escalando de forma coherente.
        const esBig = tipo === 'big';
        this.esBig = esBig;
        const MELEE_HP = 100;
        const MELEE_DMG = 10;
        const MELEE_SEG = 6;
        const MELEE_SEG_HP = 17;

        this.maxHealth = tipo === 'mage' ? 60
            : (esBig ? MELEE_HP * CONFIG.BIG_MINION_HP_MULT : MELEE_HP);
        this.health = this.maxHealth;
        this.speed = tipo === 'melee' ? CONFIG.meleeSpeed
            : (esBig ? CONFIG.meleeSpeed * CONFIG.BIG_MINION_SPEED_MULT : CONFIG.mageSpeed);
        this.direction = isEnemy ? -1 : 1;
        this.attackDamage = tipo === 'mage' ? 15
            : (esBig ? MELEE_DMG * CONFIG.BIG_MINION_DMG_MULT : MELEE_DMG);
        this.attackRange = tipo === 'mage' ? 4.0 : 1.5;
        this.attackCooldown = 0;
        this.attackSpeed = tipo === 'mage' ? 1.5 : 1.0;
        this.state = 'move';
        this.target = null;
        this.isDead = false;
        // El grande lleva mas segmentos de barra para que se lea su tanqueidad.
        this.segments = tipo === 'mage' ? 3 : (esBig ? 10 : MELEE_SEG);
        this.hpPerSegment = tipo === 'mage' ? 20
            : (esBig ? (this.maxHealth / 10) : MELEE_SEG_HP);
        this.currentVisibleSegments = this.segments;
        this.type = 'minion';
        this.reevaluationTimer = 0;
        this.isGhost = false;
        this.ghostTimer = CONFIG.firstWaveGhostDuration;
        this.memory = {
            kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0,
            lastKilledType: null, lastKilledBy: null, survivedWaves: 0,
            weights: { ...factionBrain[isEnemy ? 'enemy' : 'ally'].weights },
        };
        this.mixer = null;
        this.glbModel = null;

        // --- Estado de combate visible ---
        this.attackAnimTimer = 0;   // temporizador de la animacion de golpe
        this.attackLungeT = 0;      // temporizador del lanzon del melee
        this.hitFlashTimer = 0;     // temporizador del destello rojo al recibir dano
        this._currentAction = null;

        // El hueco lateral NO se fija aqui: se reclama al llegar a la zona
        // de formacion, por orden de llegada (ver reclamarSlot). Asi el
        // abanico crece desde el centro hacia fuera en vez de nacer abierto
        // en el nexo. Hasta que reclame, avanza por el centro.
        this.combatOffsetX = 0;
        this.combatOffsetZ = 0;
        if (tipo === 'mage') {
            // El mage si lleva su distancia de combate desde el principio:
            // es lo que lo mantiene en la linea de atras.
            this.combatOffsetZ = isEnemy ? -CONFIG.MINION_MAGE_Z_OFFSET : CONFIG.MINION_MAGE_Z_OFFSET;
        }
        this.slotBase = 0;
        // El slot es un desplazamiento lateral relativo al bando: el
        // enemigo avanza hacia Z- (rotado 180 grados), asi que su lado del
        // mundo es el contrario. Sin espejar, los dos bandos se apinaban
        // en la misma mitad del carril y el reparto se veia torcido.
        this.mySlotX = isEnemy ? -this.combatOffsetX : this.combatOffsetX;
        this.formationSet = false;
        // Reparto por orden de llegada: el minion reclama su hueco
        // lateral cuando alcanza la zona de formacion, no al nacer.
        // Asi el 1o coge el centro, el 2o y 3o se abren, y el 4o y
        // 5o se meten junto al centro, en vez de nacer ya abiertos.
        this.slotReclamado = false;
        this.deployProgress = 0;

        this.group = new THREE.Group();
        this.group.userData.targetRef = this;

        // SIN GLB: mage y melee usan SIEMPRE el modelo procedural propio.
        // El mage se distingue por color, capucha, baculo y orbe; el melee por
        // casco, escudo y espada. Asi los dos bandos se ven igual de bien.
        this.buildProceduralModel(isEnemy);
        {
            // La barra de vida escala con el minion para no quedar descolgada
            const texture = getHealthBarTexture(this.segments, this.segments, this.isEnemy);
            const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(0.7, 0.15, 1);
            sprite.renderOrder = 999;
            this.group.add(sprite);
            this.spriteMat = spriteMat;
            this.healthBarSprite = sprite;
        }

        // Escala global del minion. El modelo esta construido a escala 1.0 =
        // 1.10 de alto, y el Axie mide 1.90: queda al 58%, proporcion de LoL.
        // TAREA D: el minion grande multiplica esa escala.
        const s = CONFIG.MINION_SCALE * (esBig ? CONFIG.BIG_MINION_SCALE : 1);
        this.group.scale.setScalar(s);
        // La barra va POR ENCIMA de la cabeza del minion, no sobre el
        // pecho. El modelo mide MINION_HEIGHT en escala 1.0 y el grupo va
        // escalado por s, asi que la altura local es altura_mundo / s.
        if (this.healthBarSprite) {
            const alturaMundo = CONFIG.MINION_HEIGHT * (esBig ? CONFIG.BIG_MINION_SCALE : 1) + 0.35;
            this.healthBarSprite.position.y = alturaMundo / s;
        }

        this.group.rotation.y = isEnemy ? Math.PI : 0;
        this.group.position.set(x, GROUND_Y - 0.5, z);
        scene.add(this.group);
        this.mesh = this.group;
    }

    // [DESACTIVADO] Los minions ya NO usan GLB: mage y melee van con modelo
    // procedural propio. Este metodo queda sin uso a proposito, no se llama.
    loadMinionGLB(tipo) {
        const loader = sharedGLTFLoader;
        const isMage = tipo === 'mage';
        const targetHeight = isMage ? 0.65 : 1.10;

        loader.load(CONFIG.MINION_GLB_MAGE_ENEMY, (gltf) => {
            while (this.group.children.length > 0) this.group.remove(this.group.children[0]);
            const model = gltf.scene;
            const bbox = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const curH = size.y > 0.0001 ? size.y : 1;
            const sf = targetHeight / curH;
            model.scale.setScalar(sf);

            const bbox2 = new THREE.Box3().setFromObject(model);
            model.position.y = -bbox2.min.y;
            model.position.x = -(bbox2.min.x + bbox2.max.x) / 2;
            model.position.z = -(bbox2.min.z + bbox2.max.z) / 2;

            model.traverse((n) => {
                if (n.isMesh) { n.castShadow = false; n.receiveShadow = false; n.userData.targetRef = this; }
            });
            model.rotation.y = 0;
            this.group.add(model);
            this.glbModel = model;

            if (isMage) {
                this.loadMageStaff(model);
            }

            this.mixer = new THREE.AnimationMixer(model);
            this.actions = {};
            // --- Animaciones del mage: walk + idle + attack ---
            // walk/idle vienen en archivos GLB separados (así los exportaste).
            // attack tambien existe (mage2_attack.glb) y antes NO se usaba.
            const clipSources = [
                ['walk',   CONFIG.MAGE_GLB_WALK],
                ['idle',   CONFIG.MAGE_GLB_IDLE],
                ['attack', CONFIG.MAGE_GLB_ATTACK],
            ];
            clipSources.forEach(([name, path]) => {
                if (!path) return;
                sharedGLTFLoader.load(path, (clipGltf) => {
                    if (!clipGltf.animations || !clipGltf.animations.length) return;
                    if (!this.mixer) return; // el minion ya murio/limpio
                    const action = this.mixer.clipAction(clipGltf.animations[0]);
                    if (name === 'attack') {
                        action.setLoop(THREE.LoopOnce);
                        action.clampWhenFinished = true;
                    } else {
                        action.setLoop(THREE.LoopRepeat);
                    }
                    this.actions[name] = action;
                    // Estado inicial: andando
                    if (name === 'walk') action.play();
                }, undefined, () => { /* sin ese clip: no pasa nada */ });
            });
            this._currentAction = 'walk';

            const texture = getHealthBarTexture(this.segments, this.segments, this.isEnemy);
            const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(0.7, 0.15, 1);
            sprite.position.y = targetHeight + 0.55;
            sprite.renderOrder = 999;
            this.group.add(sprite);
            this.spriteMat = spriteMat;
        }, undefined, (err) => {
            this.buildProceduralModel(this.isEnemy);
            const texture = getHealthBarTexture(this.segments, this.segments, this.isEnemy);
            const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(0.7, 0.15, 1);
            sprite.position.y = 0.65;
            sprite.renderOrder = 999;
            this.group.add(sprite);
            this.spriteMat = spriteMat;
        });
    }

    loadMageStaff(mageModel) {
        const loader = sharedGLTFLoader;
        loader.load(CONFIG.MAGE_GLB_STAFF, (gltf) => {
            const staff = gltf.scene;

            const staffScale = 0.8;
            staff.scale.setScalar(staffScale);

            let handBone = null;
            const possibleNames = [
                'hand_R', 'RightHand', 'mixamorig:RightHand',
                'Hand_R', 'right_hand', 'weapon_r', 'Weapon_R'
            ];

            mageModel.traverse((node) => {
                if (node.isBone && possibleNames.some(name => node.name.includes(name))) {
                    handBone = node;
                }
            });

            if (handBone) {
                handBone.add(staff);
                staff.position.set(0, 0, 0);
                staff.rotation.set(0, 0, 0);
                console.log(`🧙 Staff adjuntado a hueso: ${handBone.name}`);
                this.staff = staff;
                this.staffBone = handBone;
            } else {
                console.warn('⚠️ Hueso mano derecha no encontrado, adjuntando al modelo raíz');
                mageModel.add(staff);
                staff.position.set(0.3, 0.4, 0.1);
                staff.rotation.set(-Math.PI / 2, 0, 0);
                this.staff = staff;
            }

            staff.traverse((n) => {
                if (n.isMesh) {
                    n.castShadow = false;
                    n.receiveShadow = false;
                    n.userData.targetRef = this;
                }
            });
        }, undefined, (err) => {
            console.warn('⚠️ No se pudo cargar mage2_staff.glb:', err.message);
        });
    }

    // =========================================
    // MODELO PROCEDURAL DE LOS MINIONS (unico modelo: no hay GLB)
    //   - melee: armadura, casco con visor, escudo y ESPADA
    //   - mage:  tunica, capucha, orbe brillante y BACULO
    // Se mantiene el pivote en el origen (pies a y=0) porque el gesto de
    // ataque empuja el cuerpo hacia delante en Z desde aqui.
    // =========================================
    buildProceduralModel(isEnemy) {
        if (this.tipo === 'mage') return this.buildMageModel(isEnemy);
        // TAREA D: el grande reutiliza el cuerpo del melee para que la
        // silueta sea reconocible, y se marca aparte con la corona.
        const modelo = this.buildMeleeModel(isEnemy);
        if (this.tipo === 'big') this.buildBigMinionCrest(isEnemy);
        return modelo;
    }

    // TAREA D: marca visual del minion grande sobre el cuerpo del melee.
    // Corona + aro luminoso. Se anade al cuerpo (bodyRoot) si existe, para
    // que herede la animacion de andar; si no, al grupo raiz.
    buildBigMinionCrest(isEnemy) {
        const colorCrest = isEnemy ? 0xffcc33 : 0xffe066;
        const colorAura  = isEnemy ? 0xff5533 : 0x55ccff;
        const matCrest = new THREE.MeshStandardMaterial({
            color: colorCrest, metalness: 0.9, roughness: 0.25,
            emissive: colorCrest, emissiveIntensity: 0.55
        });
        const matAura = new THREE.MeshBasicMaterial({
            color: colorAura, transparent: true, opacity: 0.35, side: THREE.DoubleSide
        });
        const parent = this.bodyRoot || this.group;

        // Corona de 5 puntas sobre la cabeza (la cabeza del melee esta a 0.975)
        const corona = new THREE.Group();
        corona.position.y = 1.05;
        for (let i = 0; i < 5; i++) {
            const punta = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.11, 5), matCrest);
            const ang = (i / 5) * Math.PI * 2;
            punta.position.set(Math.cos(ang) * 0.075, 0, Math.sin(ang) * 0.075);
            corona.add(punta);
        }
        parent.add(corona);
        this.coronaRoot = corona;

        // Aro luminoso a los pies: se ve de lejos y lee el bando.
        const aro = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.46, 20), matAura);
        aro.rotation.x = -Math.PI / 2;
        aro.position.y = 0.02;
        parent.add(aro);
        this.auraRing = aro;
        this.auraMat = matAura;
    }
    
    // =========================================
    // MODELO PROCEDURAL DEL MELEE
    // Humanoide completo a escala 1.0 = 1.10 de alto, proporcion ~1:6.5.
    // Antes: 0.85 de alto, cabezon, sin brazos y sin cuello. Se veia como
    // un juguete al lado del Axie (1.90).
    // Pivote en el origen (pies a y=0): el gesto empuja el cuerpo en Z.
    // El eje del brazo baja en Y para que el tajo barra de verdad el frente.
    // =========================================
    buildMeleeModel(isEnemy) {
        const colorMain  = isEnemy ? 0xd93a3a : 0x3a7bd9;
        const colorDark  = isEnemy ? 0x7a1a1a : 0x1a3f7a;
        const colorMetal = 0x9aa4b0;
        const colorGlow  = isEnemy ? 0xff5533 : 0x55ccff;

        const matMain  = new THREE.MeshStandardMaterial({ color: colorMain,  metalness: 0.35, roughness: 0.55 });
        const matDark  = new THREE.MeshStandardMaterial({ color: colorDark,  metalness: 0.4,  roughness: 0.6 });
        const matMetal = new THREE.MeshStandardMaterial({ color: colorMetal, metalness: 0.85, roughness: 0.3 });
        const matGlow  = new THREE.MeshStandardMaterial({ color: colorGlow, emissive: colorGlow, emissiveIntensity: 0.9, roughness: 0.4 });

        // this.bodyRoot agrupa todo el cuerpo para poder empujarlo al atacar
        const bodyRoot = new THREE.Group();
        this.bodyRoot = bodyRoot;
        this.group.add(bodyRoot);

        const tag = (obj) => {
            obj.traverse((n) => { if (n.isMesh) { n.userData.targetRef = this; n.castShadow = false; n.receiveShadow = false; } });
            return obj;
        };

        // --- Piernas (0.00 -> 0.46) ---
        for (const sx of [-1, 1]) {
            const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.062, 0.26, 6), matDark);
            thigh.position.set(sx * 0.095, 0.33, 0);
            bodyRoot.add(tag(thigh));
            const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.052, 0.23, 6), matMain);
            shin.position.set(sx * 0.095, 0.115, 0);
            bodyRoot.add(tag(shin));
            // Bota
            const boot = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.075, 0.17), matDark);
            boot.position.set(sx * 0.095, 0.038, 0.025);
            bodyRoot.add(tag(boot));
        }

        // --- Cadera + torso (0.46 -> 0.84) ---
        const hips = new THREE.Mesh(new THREE.BoxGeometry(0.245, 0.10, 0.17), matDark);
        hips.position.y = 0.485;
        bodyRoot.add(tag(hips));

        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.15, 0.30, 8), matMain);
        torso.position.y = 0.685;
        bodyRoot.add(tag(torso));

        // Peto
        const chest = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.075), matDark);
        chest.position.set(0, 0.715, 0.135);
        bodyRoot.add(tag(chest));

        // Nucleo brillante (lectura de bando a distancia)
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), matGlow);
        core.position.set(0, 0.715, 0.183);
        bodyRoot.add(tag(core));

        // --- Cuello (0.84 -> 0.90) — antes no existia: la cabeza flotaba ---
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.072, 0.085, 8), matDark);
        neck.position.y = 0.875;
        bodyRoot.add(tag(neck));

        // --- Cabeza + casco (0.90 -> 1.07) ---
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.098, 10, 10), matMain);
        head.position.y = 0.975;
        bodyRoot.add(tag(head));

        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.111, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), matMetal);
        helmet.position.y = 0.985;
        bodyRoot.add(tag(helmet));

        // Visor
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.032, 0.04), matGlow);
        visor.position.set(0, 0.978, 0.09);
        bodyRoot.add(tag(visor));

        // Cresta del casco (es lo mas alto: 1.10)
        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.10, 0.14), matDark);
        crest.position.set(0, 1.075, -0.012);
        bodyRoot.add(tag(crest));

        // --- Hombreras ---
        for (const sx of [-1, 1]) {
            const pad = new THREE.Mesh(new THREE.SphereGeometry(0.098, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), matMetal);
            pad.position.set(sx * 0.215, 0.815, 0);
            pad.rotation.z = sx * 0.35;
            bodyRoot.add(tag(pad));
        }

        // --- Brazo IZQUIERDO: sujeto, con escudo ---
        const armL = new THREE.Group();
        armL.position.set(-0.205, 0.795, 0);
        bodyRoot.add(armL);

        const upperL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.19, 6), matMain);
        upperL.position.y = -0.095;
        armL.add(tag(upperL));

        const foreL = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.045, 0.17, 6), matDark);
        foreL.position.y = -0.27;
        armL.add(tag(foreL));

        const handL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), matDark);
        handL.position.y = -0.375;
        armL.add(tag(handL));

        // Escudo redondo en el antebrazo
        const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.038, 10), matDark);
        shield.rotation.z = Math.PI / 2;
        shield.position.set(-0.052, -0.25, 0.07);
        armL.add(tag(shield));
        const shieldBoss = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 8), matMetal);
        shieldBoss.position.set(-0.075, -0.25, 0.07);
        armL.add(tag(shieldBoss));
        const shieldRim = new THREE.Mesh(new THREE.TorusGeometry(0.195, 0.017, 6, 14), matMetal);
        shieldRim.rotation.y = Math.PI / 2;
        shieldRim.position.set(-0.052, -0.25, 0.07);
        armL.add(tag(shieldRim));

        // --- Brazo DERECHO: pivote del arma ---
        // El pivote del hombro va en y=0.795 y el arma al final del antebrazo,
        // asi el tajo baja en Y y barre el frente de verdad.
        const armRoot = new THREE.Group();
        armRoot.position.set(0.205, 0.795, 0);
        bodyRoot.add(armRoot);
        this.armRoot = armRoot;

        const upperR = new THREE.Mesh(new THREE.CylinderGeometry(0.057, 0.052, 0.21, 6), matMain);
        upperR.position.y = -0.105;
        armRoot.add(tag(upperR));

        const foreR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.047, 0.19, 6), matDark);
        foreR.position.y = -0.30;
        armRoot.add(tag(foreR));

        const handR = new THREE.Mesh(new THREE.SphereGeometry(0.054, 8, 8), matDark);
        handR.position.y = -0.425;
        armRoot.add(tag(handR));

        // --- Espada, empunada al final del brazo ---
        const swordRoot = new THREE.Group();
        swordRoot.position.set(0, -0.44, 0.015);
        armRoot.add(swordRoot);
        this.swordRoot = swordRoot;

        const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.115, 6), matDark);
        grip.position.y = 0.035;
        swordRoot.add(tag(grip));
        const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.031, 8, 8), matMetal);
        pommel.position.y = -0.03;
        swordRoot.add(tag(pommel));
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.028, 0.042), matMetal);
        guard.position.y = 0.105;
        swordRoot.add(tag(guard));
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.52, 0.022), matMetal);
        blade.position.y = 0.385;
        swordRoot.add(tag(blade));
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.051, 0.10, 4), matMetal);
        tip.position.y = 0.695;
        tip.rotation.y = Math.PI / 4;
        swordRoot.add(tag(tip));

        // Reposo: el arma apunta al frente y algo hacia abajo
        swordRoot.rotation.x = -0.35;
    }

    // =========================================
    // MODELO PROCEDURAL DEL MAGE
    // Tunica + capucha + orbe brillante + baculo. Sustituye al GLB mage2.
    // Escala 1.0 = 1.10 de alto (58% del Axie), igual que el melee, para que
    // la oleada se lea pareja. Antes media 0.82: un cucurucho diminuto.
    // =========================================
    buildMageModel(isEnemy) {
        const colorRobe  = isEnemy ? 0x8e3fbf : 0x3f7fbf;
        const colorDark  = isEnemy ? 0x4a1f6b : 0x1f4a6b;
        const colorTrim  = isEnemy ? 0xd966ff : 0x66ddff;
        const colorWood  = 0x6b4a2f;

        const matRobe = new THREE.MeshStandardMaterial({ color: colorRobe, metalness: 0.1, roughness: 0.8 });
        const matDark = new THREE.MeshStandardMaterial({ color: colorDark, metalness: 0.15, roughness: 0.75 });
        const matTrim = new THREE.MeshStandardMaterial({ color: colorTrim, emissive: colorTrim, emissiveIntensity: 0.7, roughness: 0.4 });
        const matWood = new THREE.MeshStandardMaterial({ color: colorWood, metalness: 0.2, roughness: 0.8 });
        // El orbe se guarda para poder hacerlo brillar al atacar
        const matOrb  = new THREE.MeshStandardMaterial({ color: colorTrim, emissive: colorTrim, emissiveIntensity: 0.9, roughness: 0.25 });
        this.orbMat = matOrb;

        const bodyRoot = new THREE.Group();
        this.bodyRoot = bodyRoot;
        this.group.add(bodyRoot);

        const tag = (obj) => {
            obj.traverse((n) => { if (n.isMesh) { n.userData.targetRef = this; n.castShadow = false; n.receiveShadow = false; } });
            return obj;
        };

        // --- Tunica: cuerpo entero, de los pies al cuello (0.00 -> 0.85) ---
        const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.335, 0.80, 10), matRobe);
        robe.position.y = 0.42;
        bodyRoot.add(tag(robe));

        // Dobladillo oscuro del borde
        const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.342, 0.352, 0.09, 10), matDark);
        hem.position.y = 0.055;
        bodyRoot.add(tag(hem));

        // Aberturas de la tunica (dos pliegues verticales)
        for (const sx of [-1, 1]) {
            const slit = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.62, 0.03), matDark);
            slit.position.set(sx * 0.20, 0.42, 0.10);
            slit.rotation.z = sx * 0.13;
            bodyRoot.add(tag(slit));
        }

        // --- Cinturon luminoso (lectura de bando a distancia) ---
        const belt = new THREE.Mesh(new THREE.TorusGeometry(0.203, 0.026, 6, 14), matTrim);
        belt.rotation.x = Math.PI / 2;
        belt.position.y = 0.615;
        bodyRoot.add(tag(belt));

        // --- Cuello / hombros (0.85 -> 0.92) ---
        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.152, 0.10, 10), matDark);
        collar.position.y = 0.885;
        bodyRoot.add(tag(collar));

        // --- Cabeza encapuchada (0.92 -> 1.07) ---
        // Es un cono bajo que se hunde en el cuello: asi no queda hueco.
        const hood = new THREE.Mesh(new THREE.ConeGeometry(0.152, 0.29, 10), matDark);
        hood.position.y = 1.01;
        bodyRoot.add(tag(hood));

        // Hueco oscuro de la cara
        const face = new THREE.Mesh(new THREE.SphereGeometry(0.088, 8, 8), matDark);
        face.position.set(0, 1.005, 0.055);
        bodyRoot.add(tag(face));

        // Dos ojos brillantes
        for (const sx of [-1, 1]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.029, 6, 6), matTrim);
            eye.position.set(sx * 0.048, 1.015, 0.108);
            bodyRoot.add(tag(eye));
        }

        // Punta de la capucha caida hacia atras
        const hoodTip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.20, 8), matDark);
        hoodTip.position.set(0, 1.10, -0.075);
        hoodTip.rotation.x = 0.72;
        bodyRoot.add(tag(hoodTip));

        // Hombreras de la tunica
        for (const sx of [-1, 1]) {
            const pad = new THREE.Mesh(new THREE.SphereGeometry(0.105, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), matRobe);
            pad.position.set(sx * 0.205, 0.875, 0);
            pad.rotation.z = sx * 0.4;
            bodyRoot.add(tag(pad));
        }

        // --- Brazo IZQUIERDO: suelto, con la manga ancha del mago ---
        const armL = new THREE.Group();
        armL.position.set(-0.195, 0.85, 0);
        armL.rotation.z = 0.22;
        bodyRoot.add(armL);

        const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.088, 0.30, 8), matRobe);
        sleeveL.position.y = -0.15;
        armL.add(tag(sleeveL));

        const cuffL = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.045, 8), matDark);
        cuffL.position.y = -0.30;
        armL.add(tag(cuffL));

        const handL = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), matDark);
        handL.position.y = -0.35;
        armL.add(tag(handL));

        // --- Brazo DERECHO: pivote del baculo ---
        const armRoot = new THREE.Group();
        armRoot.position.set(0.195, 0.85, 0);
        bodyRoot.add(armRoot);
        this.armRoot = armRoot;

        const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.057, 0.09, 0.32, 8), matRobe);
        sleeveR.position.y = -0.16;
        armRoot.add(tag(sleeveR));

        const cuffR = new THREE.Mesh(new THREE.CylinderGeometry(0.094, 0.094, 0.048, 8), matDark);
        cuffR.position.y = -0.32;
        armRoot.add(tag(cuffR));

        const handR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), matDark);
        handR.position.y = -0.375;
        armRoot.add(tag(handR));

        // --- Baculo ---
        const staffRoot = new THREE.Group();
        staffRoot.position.set(0, -0.385, 0.02);
        armRoot.add(staffRoot);
        this.staffRoot = staffRoot;

        // El asta sube desde la mano y baja hasta casi el suelo
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.027, 0.95, 6), matWood);
        shaft.position.y = 0.26;
        staffRoot.add(tag(shaft));

        // Aro de la punta
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.019, 6, 14), matTrim);
        ring.position.y = 0.78;
        staffRoot.add(tag(ring));

        // El orbe flotando dentro del aro
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.063, 10, 10), matOrb);
        orb.position.y = 0.78;
        staffRoot.add(tag(orb));
        this.orb = orb;

        // Reposo: baculo ligeramente inclinado hacia delante
        staffRoot.rotation.x = -0.15;
    }

    adjustWeightsOnKill(targetType) {
        const w = this.memory.weights;
        if (targetType === 'player') { w.aggression += 0.2; w.focusPlayer += 0.25; }
        else if (targetType === 'minion') {
            w.focusMinions += 0.12;
            if (this.memory.kills >= 3) { w.focusStructure += 0.15; w.focusMinions -= 0.05; }
        } 
        else if (targetType === 'tower' || targetType === 'nexus') { 
            w.focusStructure += 0.25; 
            w.aggression += 0.1;
            w.focusMinions -= 0.08; 
        }
        clampWeights(w);
    }

    adjustWeightsOnDeath(killedBy) {
        const w = this.memory.weights;
        w.caution += 0.15;
        if (killedBy === 'player') { w.focusPlayer -= 0.2; w.caution += 0.15; }
        else if (killedBy === 'tower') { w.caution += 0.25; w.focusStructure -= 0.2; }
        else if (killedBy === 'minion') { w.focusMinions -= 0.15; w.groupBehavior += 0.2; }
        clampWeights(w);
    }

    updateHealthBar() {
        const cur = Math.ceil(this.health / this.hpPerSegment);
        const vis = Math.max(0, Math.min(this.segments, cur));
        if (vis !== this.currentVisibleSegments) {
            this.currentVisibleSegments = vis;
            const tex = getHealthBarTexture(this.segments, vis, this.isEnemy);
            if (this.spriteMat) { this.spriteMat.map = tex; this.spriteMat.needsUpdate = true; }
        }
    }

    // =========================================
    // ATAQUE VISIBLE
    // Ya no hay GLB de minion: los dos tipos usan gesto procedural propio.
    //   - melee: lanzon del cuerpo + tajo de espada
    //   - mage:  eleva el baculo y lanza una descarga
    // =========================================
    triggerAttackAnim() {
        this.attackAnimTimer = CONFIG.MINION_ATTACK_ANIM_TIME;

        // Rama de animaciones GLB: solo aplica si algun dia se vuelven a usar GLB
        if (this.actions && this.actions.attack) {
            if (this._currentAction !== 'attack') {
                const prev = this.actions[this._currentAction];
                if (prev && prev !== this.actions.attack) prev.fadeOut(0.08);
                const atk = this.actions.attack;
                atk.reset();
                atk.setEffectiveWeight(1);
                atk.fadeIn(0.06).play();
                this._currentAction = 'attack';
            }
            return;
        }

        // Gesto procedural (todos los minions actuales)
        this.attackLungeT = CONFIG.MINION_ATTACK_ANIM_TIME;
    }

    // Aplica el gesto visual del golpe. Se llama desde update().
    updateAttackVisual(delta) {
        // Solo relevante si algun dia se vuelven a usar animaciones GLB
        if (this.attackAnimTimer > 0) {
            this.attackAnimTimer -= delta;
            if (this.attackAnimTimer <= 0 && this._currentAction === 'attack') {
                if (this.actions) {
                    if (this.actions.attack) this.actions.attack.fadeOut(0.1);
                    if (this.actions.walk) {
                        this.actions.walk.reset();
                        this.actions.walk.setEffectiveWeight(1);
                        this.actions.walk.fadeIn(0.1).play();
                    }
                }
                this._currentAction = 'walk';
            }
        }

        // ---------------------------------------------------------
        // Gesto de ataque procedural (melee y mage)
        // t va de 1 -> 0. phase va de 0 -> 1.
        // Ya no hay GLB de minion, asi que este es el UNICO gesto.
        // ---------------------------------------------------------
        if (this.attackLungeT > 0) {
            this.attackLungeT -= delta;
            const t = Math.max(0, this.attackLungeT) / CONFIG.MINION_ATTACK_ANIM_TIME; // 1 -> 0
            const phase = 1 - t; // 0 -> 1
            const swing = Math.sin(phase * Math.PI); // 0 -> 1 -> 0, pico a mitad

            if (this.tipo === 'mage') {
                // --- GESTO DEL MAGE: eleva el baculo y lo baja al lanzar ---
                if (this.bodyRoot) {
                    // Se yergue un poco al conjurar
                    this.bodyRoot.position.z = swing * 0.10;
                    this.bodyRoot.rotation.x = -swing * 0.12;
                }
                if (this.armRoot) {
                    // El brazo se adelanta al frente (medido: no baja el orbe)
                    this.armRoot.rotation.x = -0.15 * swing;
                }
                if (this.staffRoot) {
                    // El baculo se extiende hacia el objetivo al soltar la descarga
                    this.staffRoot.rotation.x = -0.15 + 0.50 * swing;
                }
                // El orbe brilla mas en el momento del golpe
                if (this.orbMat) {
                    this.orbMat.emissiveIntensity = 0.9 + 1.8 * swing;
                }
                if (this.attackLungeT <= 0) {
                    if (this.bodyRoot) { this.bodyRoot.position.z = 0; this.bodyRoot.rotation.x = 0; }
                    if (this.armRoot) this.armRoot.rotation.x = 0;
                    if (this.staffRoot) this.staffRoot.rotation.x = -0.15;
                    if (this.orbMat) this.orbMat.emissiveIntensity = 0.9;
                }
                return;
            }

            // --- GESTO DEL MELEE: lanzon del cuerpo + tajo de espada ---
            const lunge = swing * CONFIG.MINION_MELEE_LUNGE;

            if (this.bodyRoot) {
                this.bodyRoot.position.z = lunge * 0.7;
                this.bodyRoot.rotation.x = lunge * 0.35;
            }
            if (this.procBody && this.procHead) {
                // Compatibilidad: modelos viejos de dos esferas
                this.procBody.position.z = lunge * 0.6;
                this.procHead.position.z = lunge * 0.6;
            }

            // --- Tajo de espada ---
            if (this.armRoot && this.swordRoot) {
                // Brazo: sube y baja
                this.armRoot.rotation.x = -1.15 * swing;
                // Espada: rota en abanico (de atras-arriba a adelante-abajo)
                this.swordRoot.rotation.x = -0.35 - 1.55 * Math.sin(phase * Math.PI * 1.15);
            }

            if (this.attackLungeT <= 0) {
                // Reposo: dejarlo TODO exactamente donde estaba
                if (this.bodyRoot) {
                    this.bodyRoot.position.z = 0;
                    this.bodyRoot.rotation.x = 0;
                }
                if (this.procBody && this.procHead) {
                    this.procBody.position.z = 0;
                    this.procHead.position.z = 0;
                }
                if (this.armRoot) this.armRoot.rotation.x = 0;
                if (this.swordRoot) this.swordRoot.rotation.x = -0.35;
            }
        }
    }

    // Destello rojo al recibir dano (feedback visual del impacto)
    flashHit() {
        this.hitFlashTimer = CONFIG.MINION_HIT_FLASH_TIME;
        this.applyHitFlash(true);
    }

    applyHitFlash(on) {
        if (this.glbModel) {
            this.glbModel.traverse((n) => {
                if (!n.isMesh || !n.material) return;
                const mats = Array.isArray(n.material) ? n.material : [n.material];
                mats.forEach((mat) => {
                    if (!mat.emissive) return;
                    if (on) {
                        if (mat.userData._origEmissive === undefined) {
                            mat.userData._origEmissive = mat.emissive.getHex();
                        }
                        mat.emissive.setHex(0xff2222);
                        mat.emissiveIntensity = 1.0;
                    } else if (mat.userData._origEmissive !== undefined) {
                        mat.emissive.setHex(mat.userData._origEmissive);
                        mat.emissiveIntensity = 1.0;
                    }
                    mat.needsUpdate = true;
                });
            });
        } else {
            this.group.traverse((n) => {
                if (!n.isMesh || !n.material) return;
                const mats = Array.isArray(n.material) ? n.material : [n.material];
                mats.forEach((mat) => {
                    if (!mat.emissive) return;
                    if (on) {
                        if (mat.userData._origEmissive === undefined) {
                            mat.userData._origEmissive = mat.emissive.getHex();
                        }
                        mat.emissive.setHex(0xff2222);
                        mat.emissiveIntensity = 1.0;
                    } else if (mat.userData._origEmissive !== undefined) {
                        mat.emissive.setHex(mat.userData._origEmissive);
                    }
                    mat.needsUpdate = true;
                });
            });
        }
    }

    updateHitFlash(delta) {
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= delta;
            if (this.hitFlashTimer <= 0) {
                this.hitFlashTimer = 0;
                this.applyHitFlash(false);
            }
        }
    }

    update(delta, aliados, enemigos, towers, playerModel) {
        if (this.isDead || gameFinished) return;
        if (this.mixer) this.mixer.update(delta);
        this.updateAttackVisual(delta);
        this.updateHitFlash(delta);
        this.reevaluationTimer += delta;

        if (isFirstWave && this.ghostTimer > 0) {
            this.ghostTimer -= delta;
            let nz = this.group.position.z + this.direction * this.speed * delta;
            nz = Math.max(-CONFIG.minionLimitZ, Math.min(CONFIG.minionLimitZ, nz));
            this.group.position.z = nz;
            this.state = 'move';
            clampMinionToLane(this);
            this.updateHealthBar();
            return;
        }

        this.attackCooldown -= delta;

        const w = this.memory.weights;
        const enemyMinions = this.isEnemy ? aliados : enemigos;
        const enemyAxie = this.isEnemy ? playerModel : enemyAxieModel;
        const enemyAxieIsDeadFlag = this.isEnemy ? isPlayerDead : enemyAxieIsDead;
        const myAllies = this.isEnemy ? enemigos : aliados;

        const AGGRO_RANGE = CONFIG.MINION_AGGRO_RANGE;
        const AGGRO_RANGE_EXTENDED = CONFIG.MINION_AGGRO_RANGE_EXTENDED;

        const enemiesAttackingAllies = new Set();
        for (const ally of myAllies) {
            if (ally.isDead) continue;
            if (ally.target && !ally.target.isDead) {
                const attacker = ally.target;
                if (attacker.group) enemiesAttackingAllies.add(attacker);
            }
        }

        const enemyTowers = this.isEnemy
            ? towers.filter(t => !t.isDead && !t.isEnemy)
            : towers.filter(t => !t.isDead && t.isEnemy);

        // ============================================================
        // PRIORIDADES DE OBJETIVO SEGUN LOL (orden estricto)
        // 1. Campeon enemigo atacando a un aliado (prioridad MAXIMA)
        // 2. Minion enemigo atacando a un campeon aliado
        // 3. Minion enemigo atacando a un minion aliado
        // 4. Torreta enemiga atacando a un minion aliado
        // 5. Minion enemigo mas cercano
        // 6. Campeon enemigo mas cercano
        // 7. Estructuras (torres/nexo) - solo si no hay amenazas
        // ============================================================

        // PRIORIDAD 1: Campeon enemigo (Axie) ATACANDO a un aliado
        let priority1Target = null;
        let priority1Dist = Infinity;
        if (enemyAxie && !enemyAxieIsDeadFlag) {
            const axieDx = Math.abs(enemyAxie.position.x - this.group.position.x);
            const axieDist = this.group.position.distanceTo(enemyAxie.position);
            // Verificar si el Axie enemigo tiene target que es un aliado
            if (axieDist < AGGRO_RANGE_EXTENDED * 2 && axieDx < 8.0) {
                if (enemyAxie.target && !enemyAxie.target.isDead) {
                    const targetIsAlly = this.isEnemy 
                        ? aliados.includes(enemyAxie.target) 
                        : enemigos.includes(enemyAxie.target);
                    if (targetIsAlly) {
                        priority1Target = {
                            group: enemyAxie,
                            isDead: false,
                            type: this.isEnemy ? 'player' : 'enemy_axie',
                            health: 999999,
                            _isAxie: true
                        };
                    }
                }
            }
        }

        // PRIORIDAD 2: Minion enemigo ATACANDO a un campeon aliado
        let priority2Target = null;
        let priority2Dist = Infinity;
        if (!priority1Target) {
            for (const em of enemyMinions) {
                if (em.isDead) continue;
                if (!enemiesAttackingAllies.has(em)) continue;
                // Verificar si el target es un campeon (Axie)
                const isAttackingChampion = em.target && !em.target.isDead && 
                    (em.target.type === 'player' || em.target.type === 'enemy_axie' || em.target._isAxie);
                if (!isAttackingChampion) continue;
                const dist = this.group.position.distanceTo(em.group.position);
                if (dist < AGGRO_RANGE_EXTENDED && dist < priority2Dist) {
                    priority2Dist = dist;
                    priority2Target = em;
                }
            }
        }

        // PRIORIDAD 3: Minion enemigo ATACANDO a un minion aliado
        let priority3Target = null;
        let priority3Dist = Infinity;
        if (!priority1Target && !priority2Target) {
            for (const em of enemyMinions) {
                if (em.isDead) continue;
                if (!enemiesAttackingAllies.has(em)) continue;
                // Si no es campeon, es minion aliado
                const isAttackingMinion = em.target && !em.target.isDead && em.target.type === 'minion';
                if (!isAttackingMinion) continue;
                const dist = this.group.position.distanceTo(em.group.position);
                if (dist < AGGRO_RANGE_EXTENDED && dist < priority3Dist) {
                    priority3Dist = dist;
                    priority3Target = em;
                }
            }
        }

        // PRIORIDAD 4: Torreta enemiga ATACANDO a un minion aliado
        let priority4Target = null;
        let priority4Dist = Infinity;
        if (!priority1Target && !priority2Target && !priority3Target) {
            for (const tower of enemyTowers) {
                if (!tower.target || tower.target.isDead) continue;
                // Verificar si la torre ataca a un minion aliado
                const isAttackingAllyMinion = tower.target.type === 'minion' && 
                    (this.isEnemy ? aliados.includes(tower.target) : enemigos.includes(tower.target));
                if (!isAttackingAllyMinion) continue;
                const dist = this.group.position.distanceTo(tower.position);
                if (dist < CONFIG.MINION_TOWER_ATTACK_RANGE) {
                    priority4Target = tower;
                    priority4Dist = dist;
                    break;
                }
            }
        }

        // PRIORIDAD 5: Minion enemigo mas cercano en el carril
        let priority5Target = null;
        let priority5Dist = Infinity;
        if (!priority1Target && !priority2Target && !priority3Target && !priority4Target) {
            for (const em of enemyMinions) {
                if (em.isDead) continue;
                const dx = Math.abs(em.group.position.x - this.group.position.x);
                if (dx > 4.0) continue;
                const dist = this.group.position.distanceTo(em.group.position);
                if (dist > AGGRO_RANGE) continue;
                const dz = em.group.position.z - this.group.position.z;
                const isAhead = this.isEnemy ? dz < 0 : dz > 0;
                if (!isAhead && Math.abs(dz) > 3.0) continue;
                if (dist < priority5Dist) { priority5Dist = dist; priority5Target = em; }
            }
        }

        // PRIORIDAD 6: Campeon enemigo mas cercano (Axie)
        let priority6Target = null;
        if (!priority1Target && !priority2Target && !priority3Target && !priority4Target && !priority5Target) {
            if (enemyAxie && !enemyAxieIsDeadFlag) {
                const axieDx = Math.abs(enemyAxie.position.x - this.group.position.x);
                const axieDist = this.group.position.distanceTo(enemyAxie.position);
                if (axieDist < CONFIG.MINION_AGGRO_TO_AXIE && axieDx < 3.5) {
                    priority6Target = {
                        group: enemyAxie,
                        isDead: false,
                        type: this.isEnemy ? 'player' : 'enemy_axie',
                        health: 999999,
                        _isAxie: true
                    };
                }
            }
        }

        // PRIORIDAD 7: Estructuras (torres y nexo) - SOLO si no hay amenazas
        let priority7Target = null;
        let priority7Dist = Infinity;
        if (!priority1Target && !priority2Target && !priority3Target && !priority4Target && !priority5Target && !priority6Target) {
            // Torres
            for (const tower of enemyTowers) {
                const dist = this.group.position.distanceTo(tower.position);
                if (dist > CONFIG.MINION_TOWER_ATTACK_RANGE) continue;
                const isAhead = this.isEnemy ? tower.position.z < this.group.position.z : tower.position.z > this.group.position.z;
                if (!isAhead && dist > 8) continue;
                let score = dist;
                if (isAhead) score -= 30;
                const tHP = tower.health / tower.maxHealth;
                if (tHP < 0.5) score -= 10;
                if (tHP < 0.3) score -= 20;
                if (score < priority7Dist) { priority7Dist = score; priority7Target = tower; }
            }
            // Nexo (solo si no hay torres vivas)
            if (!priority7Target) {
                const hasLivingTowers = enemyTowers.length > 0;
                if (!hasLivingTowers) {
                    const enemyNexus = this.isEnemy ? nexusAliado : nexusEnemigo;
                    if (enemyNexus && !enemyNexus.isDead) {
                        const dist = this.group.position.distanceTo(enemyNexus.position);
                        if (dist < 40) priority7Target = enemyNexus;
                    }
                }
            }
        }

        const finalTarget = priority1Target || priority2Target || priority3Target || priority4Target || priority5Target || priority6Target || priority7Target;
        const DEPLOY_TRIGGER_DIST = CONFIG.DEPLOY_TRIGGER_DIST;

        if (finalTarget) {
            this.target = finalTarget;
            const targetPos = finalTarget.group ? finalTarget.group.position : finalTarget.position;
            const dx = targetPos.x - this.group.position.x;
            const dz = targetPos.z - this.group.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            this.group.rotation.y = Math.atan2(dx, dz);

            const esEstructura = finalTarget.type === 'tower' || finalTarget.type === 'nexus';
            let attackRange = this.attackRange;
            if (esEstructura) attackRange += 2.0;

            // Las torres estan desplazadas del eje del carril (azules en
            // x -2.5, rojas en x 3.11). Si la X del minion convergiera a la
            // de la torre, la tropa entera acabaria pegada a ese borde, que
            // es justo lo que se veia: todos clavados en 3.11 al atacar.
            // Contra estructuras se ataca DESDE EL CARRIL: la referencia
            // lateral es el eje (0) y solo se avanza en profundidad.
            // Las torres estan desplazadas del eje (azules -2.5, rojas
            // 3.11) y se atacan desde el carril, no desde su borde.
            // Contra minions tampoco se converge a la x del objetivo:
            // el que persigue a un enemigo que esta a un lado arrastra
            // a toda la tropa a ese lado (los mages solos contra mages
            // acababan apinados en un borde). Se avanza por el eje y el
            // hueco lateral lo da el slot.
            const refX = 0;

            const distToAttack = Math.max(0, dist - attackRange);
            // El abanico NO se abre hasta que el minion haya pasado las
            // torres de su lado O haya entrado en rango de combate:
            // hasta ahi va en fila india y no se rompe la linea.
            const pasoLasTorres = this.isEnemy
                ? this.group.position.z < TORRE_2_ENEMIGA_Z
                : this.group.position.z > TORRE_2_ALIADA_Z;
            const enRangoCombate = distToAttack < DEPLOY_TRIGGER_DIST;
            const deployTarget =
                ((pasoLasTorres || enRangoCombate) && distToAttack < DEPLOY_TRIGGER_DIST) ? 1 : 0;
        // Despliegue lateral progresivo rápido.
        this.deployProgress += (deployTarget - this.deployProgress) * Math.min(1, 2.5 * delta);
            if (this.deployProgress < 0.01) this.deployProgress = 0;
            if (this.deployProgress > 0.99) this.deployProgress = 1;

            if (dist <= attackRange) {
                this.state = 'attack';
                // Animación/gesto de ataque (se refresca cada tick, el temporizador la corta)
                this.triggerAttackAnim();
                if (this.attackCooldown <= 0) {
                    registerFactionAttack(this.isEnemy ? 'enemy' : 'ally', finalTarget);
                    if (finalTarget._isAxie || finalTarget.type === 'player' || finalTarget.type === 'enemy_axie') {
                        if (finalTarget.type === 'player') playerTakeDamage(this.attackDamage, DMG_PHYSICAL);
                        else if (finalTarget.type === 'enemy_axie' && typeof enemyAxieTakeDamage === 'function') enemyAxieTakeDamage(this.attackDamage);
                        this.attackCooldown = this.attackSpeed;
                    } else if (finalTarget.type === 'tower' || finalTarget.type === 'nexus') {
                        if (finalTarget.takeDamage) finalTarget.takeDamage(this.attackDamage);
                        this.attackCooldown = this.attackSpeed;
                    } else {
                        finalTarget.health -= this.attackDamage;
                        this.attackCooldown = this.attackSpeed;
                        if (finalTarget.updateHealthBar) finalTarget.updateHealthBar();
                        // Feedback visual: el minion golpeado destella en rojo
                        if (finalTarget.flashHit) finalTarget.flashHit();
                        if (finalTarget.health <= 0) {
                            this.memory.kills++;
                            this.adjustWeightsOnKill(finalTarget.type || 'minion');
                            factionBrain[this.isEnemy ? 'enemy' : 'ally'].stats.totalKills++;
                            if (finalTarget.die) finalTarget.die('minion');
                            this.target = null;
                            this.state = 'move';
                        }
                    }
                }
                const desiredX = refX + this.mySlotX * this.deployProgress;
                const smoothFactor = 2.0 * this.deployProgress;
                this.group.position.x += (desiredX - this.group.position.x) * Math.min(1, smoothFactor * delta);
            } else {
                this.state = 'move';
                const norm = dist > 0.1 ? dist : 1;
                // Avanza en profundidad hacia el objetivo. La X tambien
                // converge a el, pero con suavizado en vez de a velocidad
                // completa: asi cuando el target muere y salta a otro del
                // extremo contrario no hay tiron lateral.
                // El mage no pasa por delante del melee de su bando: se
                // queda detras del melee mas adelantado, a la distancia de
                // combate. Medir la distancia al enemigo no bastaba (el
                // melee tambien acaba a rango de golpe, asi que quedaban
                // casi a la par), y cuando el melee moria el mage se veia
                // solo y saltaba de golpe hacia delante. Con el frente del
                // melee como tope, ni se adelanta ni da el salto.
                let advance = 1;
                const targetIsStructure = finalTarget.type === 'tower' || finalTarget.type === 'nexus';
                // Los mages (combatOffsetZ !== 0) SIEMPRE avanzan si tienen objetivo.
                // Eliminamos cualquier restricción de avance para que sean agresivos.
                advance = 1;
                this.group.position.z += (dz / norm) * this.speed * delta * advance;
                // La X va hacia el objetivo, pero el hueco lateral se abre
                // PROPORCIONALMENTE al despliegue: de lejos todos convergen
                // al eje (refX) y la fila india se mantiene; al pasar las
                // torres se abren a su slot. Antes se usaba mySlotX directo,
                // asi que los mages se abrian desde lejos y, al quedar solos
                // contra otros mages sin melee que los frenara, acababan
                // todos apinados a un lado del carril.
                const desiredX = refX + this.mySlotX * this.deployProgress;
                const lateralSmooth = 1.8;
                this.group.position.x += (desiredX - this.group.position.x) * Math.min(1, lateralSmooth * delta);
            }
        } else {
            this.target = null;
            this.state = 'move';
            let nz = this.group.position.z + this.direction * this.speed * delta;
            nz = Math.max(-CONFIG.minionLimitZ, Math.min(CONFIG.minionLimitZ, nz));
            this.group.position.z = nz;
            // Sin objetivo (saliendo del nexo) van TODOS por el centro:
            // salen en fila india, uno detras de otro, no abiertos en
            // abanico desde el nexo. El hueco lateral ya lo tienen
            // reservado (reclamarSlot al nacer), y se abren a el solo al
            // alcanzar la zona de formacion (ver el avance con
            // deployProgress).
            this.group.position.x += (0 - this.group.position.x) * Math.min(1, 2 * delta);
            this.group.rotation.y = this.isEnemy ? Math.PI : 0;
            this.deployProgress += (0 - this.deployProgress) * Math.min(1, 1.4 * delta);
        }

        clampMinionToLane(this);
        this.updateHealthBar();
    }

    die(killedBy = 'unknown') {
        if (this.isDead) return;
        this.isDead = true;
        this.state = 'dead';
        this.group.visible = false;
        // Sonido de muerte de minion
        audio.play('hit', { volume: 0.4 });
        if (factionFocusTarget.ally.target === this) { factionFocusTarget.ally.target = null; factionFocusTarget.ally.count = 0; }
        if (factionFocusTarget.enemy.target === this) { factionFocusTarget.enemy.target = null; factionFocusTarget.enemy.count = 0; }
        this.memory.deaths++;
        this.adjustWeightsOnDeath(killedBy);
        factionBrain[this.isEnemy ? 'enemy' : 'ally'].stats.totalDeaths++;
    }
}

const aliados = [];
const enemigos = [];
let waveNumber = 1;
let waveCooldown = 0;
const WAVE_DELAY = 1.5;
let gameStarted = false;
let startTimer = CONFIG.SPAWN_DELAY;

function getWaveComposition() {
    if (waveNumber === 1) return { melee: 5, mage: 3 };
    return { melee: 3, mage: 2 };
}

// TAREA C+D: decide si esta oleada debe incluir un minion grande.
// Condicion: al bando contrario le han tirado sus 2 torres.
// Tope duro: nunca mas de BIG_MINION_MAX_ALIVE vivos por bando.
function shouldSpawnBigMinion(team) {
    // team es el bando que lo RECIBE ('ally' o 'enemy').
    // Sale cuando el bando RIVAL ha perdido sus 2 torres.
    const rivalLost = team === 'ally' ? towersEnemyLost.enemy : towersEnemyLost.ally;
    if (rivalLost < TOWERS_TO_UNLOCK_BIG) return false;
    const alive = (team === 'ally' ? aliados : enemigos)
        .filter(m => !m.isDead && m.tipo === 'big').length;
    const queued = spawnQueue.filter(q => q.team === team && q.tipo === 'big').length;
    return (alive + queued) < CONFIG.BIG_MINION_MAX_ALIVE;
}

function evaluateWaveOutcome() {
    factionFocusTarget.ally.target = null;
    factionFocusTarget.ally.count = 0;
    factionFocusTarget.enemy.target = null;
    factionFocusTarget.enemy.count = 0;
    const aa = aliados.filter(m => !m.isDead).length;
    const ae = enemigos.filter(m => !m.isDead).length;
    const aW = factionBrain.ally.weights;
    const eW = factionBrain.enemy.weights;
    if (aa > ae) {
        factionBrain.ally.stats.wavesWon++;
        factionBrain.enemy.stats.wavesLost++;
        aW.aggression = Math.min(2.5, aW.aggression + 0.1);
        eW.caution = Math.min(2.5, eW.caution + 0.15);
    } else if (ae > aa) {
        factionBrain.enemy.stats.wavesWon++;
        factionBrain.ally.stats.wavesLost++;
        eW.aggression = Math.min(2.5, eW.aggression + 0.1);
        aW.caution = Math.min(2.5, aW.caution + 0.15);
    }
    clampWeights(aW);
    clampWeights(eW);
    if (enemyAxieSpawned && !enemyAxieIsDead) enemyAxieGold += 25;
    if (isAITrainingMode && playerModel && !isPlayerDead) playerAIGold += PLAYER_GOLD_PASSIVE_PER_WAVE;
    if (!isAITrainingMode && aliados.filter(m => !m.isDead).length > 0) {
        givePlayerGold(ECONOMY.REWARD_WAVE_SURVIVED, `Oleada ${waveNumber - 1} sobrevivida`);
    }
}

function spawnWave() {
    if (gameFinished) return;
    if (waveNumber > 1) evaluateWaveOutcome();

    for (let i = aliados.length - 1; i >= 0; i--) {
        if (aliados[i].isDead) { if (aliados[i].group.parent) scene.remove(aliados[i].group); aliados.splice(i, 1); }
    }
    for (let i = enemigos.length - 1; i >= 0; i--) {
        if (enemigos[i].isDead) { if (enemigos[i].group.parent) scene.remove(enemigos[i].group); enemigos.splice(i, 1); }
    }

    const comp = getWaveComposition();
    waveDiv.textContent = `⚔️ OLEADA ${waveNumber}`;

    // 🎯 NUEVO: spawn junto al nexo con formación tipo LoL
    //
    // Los minions nacen DELANTE de su nexo (hacia el centro del carril),
    // no detras. El signo estaba invertido: los aliados salian en
    // -21 - filas*1.3, o sea hacia -24, que es donde esta la tienda azul,
    // y aparecian encima de ella en vez de salir al carril. Los enemigos
    // tenian el mismo error espejado. Ahora nacen hacia el centro y
    // caminan en su 'direction' (aliado +1, enemigo -1) hacia el frente.
    // Deben coincidir con la z del nexo en createScene (arriba). Si se
    // mueve el nexo, hay que mover esto: antes estaban en +-21 mientras
    // el nexo ya habia ido a +-23, y los minions salian descolgados.
    const NEXUS_Z_ALLY = -23.00;
    const NEXUS_Z_ENEMY = 22.94;
    const LANE_X = 0;
    // Los minions salen en FILA INDIA, uno detras de otro, no en rejilla.
    // Antes se encolaban en 2 filas de 3, asi que salian de 3 en 3: tres
    // melee, luego otros dos, luego los mages. Con una sola fila el orden
    // de salida es el de formacion: melee 1..5 y despues mage 1..3.
    // Margen desde el nexo hasta la primera fila. Sin el, la fila 0 de
    // melee nacia en la misma z que el nexo y sus 3 minions aparecian
    // medio dentro, sobresaliendo por detras: se veian como si hubieran
    // quedado rezagados. Medido en el carril: los melee no deben pisar
    // la caja del nexo.
    const NEXUS_SPAWN_MARGIN = 3.0;


    // El indice de formacion es POR BANDO, no global. Con un contador unico,
    // los aliados se quedaban con los indices bajos y los enemigos arrancaban
    // en el indice N: con delay = index * SPAWN_STAGGER_DELAY salian N segundos
    // tarde (desfase de ~8s medido), en vez de formarse en paralelo.
    let queueIndexAlly = 0;
    let queueIndexEnemy = 0;

    // ALIADOS melee: fila india desde el nexo, uno detras de otro.
    for (let i = 0; i < comp.melee; i++) {
        const z = NEXUS_Z_ALLY + NEXUS_SPAWN_MARGIN;
        spawnQueue.push({
            team: 'ally', tipo: 'melee',
            index: queueIndexAlly,
            delay: queueIndexAlly * CONFIG.SPAWN_STAGGER_DELAY,
            x: LANE_X, z,
            formationCol: i
        });
        queueIndexAlly++;
    }

    // ALIADOS mage: siguen la fila india, detras de los melee.
    for (let i = 0; i < comp.mage; i++) {
        const z = NEXUS_Z_ALLY + NEXUS_SPAWN_MARGIN;
        spawnQueue.push({
            team: 'ally', tipo: 'mage',
            index: queueIndexAlly,
            delay: queueIndexAlly * CONFIG.SPAWN_STAGGER_DELAY,
            x: LANE_X, z,
            formationCol: i
        });
        queueIndexAlly++;
    }

    // ENEMIGOS melee: fila india desde su nexo.
    for (let i = 0; i < comp.melee; i++) {
        const z = NEXUS_Z_ENEMY - NEXUS_SPAWN_MARGIN;
        spawnQueue.push({
            team: 'enemy', tipo: 'melee',
            index: queueIndexEnemy,
            delay: queueIndexEnemy * CONFIG.SPAWN_STAGGER_DELAY,
            x: LANE_X, z,
            formationCol: i
        });
        queueIndexEnemy++;
    }

    // ENEMIGOS mage: detras de sus melee, en la misma fila india.
    for (let i = 0; i < comp.mage; i++) {
        const z = NEXUS_Z_ENEMY - NEXUS_SPAWN_MARGIN;
        spawnQueue.push({
            team: 'enemy', tipo: 'mage',
            index: queueIndexEnemy,
            delay: queueIndexEnemy * CONFIG.SPAWN_STAGGER_DELAY,
            x: LANE_X, z,
            formationCol: i
        });
        queueIndexEnemy++;
    }

    // TAREA C+D: minion grande. Uno por bando y oleada, solo si al rival
    // le han tirado las 2 torres, y con tope duro de 2 vivos por bando.
    let bigAlly = false, bigEnemy = false;
    if (shouldSpawnBigMinion('ally')) {
        spawnQueue.push({
            team: 'ally', tipo: 'big',
            index: queueIndexAlly,
            delay: queueIndexAlly * CONFIG.SPAWN_STAGGER_DELAY,
            x: LANE_X, z: NEXUS_Z_ALLY + 0.6,
            formationRow: 0, formationCol: 0
        });
        queueIndexAlly++;
        bigAlly = true;
    }
    if (shouldSpawnBigMinion('enemy')) {
        spawnQueue.push({
            team: 'enemy', tipo: 'big',
            index: queueIndexEnemy,
            delay: queueIndexEnemy * CONFIG.SPAWN_STAGGER_DELAY,
            x: LANE_X, z: NEXUS_Z_ENEMY - 0.6,
            formationRow: 0, formationCol: 0
        });
        queueIndexEnemy++;
        bigEnemy = true;
    }

    console.log(`🌊 [t=${gameTime.toFixed(2)}s] Oleada ${waveNumber}: ${comp.melee} melee + ${comp.mage} mage por equipo (formación desde nexos)`);
    if (bigAlly || bigEnemy) {
        console.log(`   ⭐ MINION GRANDE: aliado=${bigAlly ? 'SI' : 'no'} enemigo=${bigEnemy ? 'SI' : 'no'} (torres rivales caidas: aliado=${towersEnemyLost.enemy}, enemigo=${towersEnemyLost.ally})`);
    }
    // Sonido de nueva oleada
    audio.play('wave', { volume: 0.4 });

    waveNumber++;
    waveCooldown = 0;
}

function processSpawnQueue(delta) {
    if (spawnQueue.length === 0) return;
    spawnQueueTimer += delta;
    for (let i = spawnQueue.length - 1; i >= 0; i--) {
        const item = spawnQueue[i];
        if (spawnQueueTimer >= item.delay) {
            if (item.team === 'ally') {
                const m = new Minion(item.x, item.z, false, item.tipo, item.index, item.formationCol);
                reclamarSlot(m);
                clampMinionToLane(m);
                if (isFirstWave) { m.isGhost = true; m.ghostTimer = CONFIG.firstWaveGhostDuration; }
                aliados.push(m);
            } else {
                const m = new Minion(item.x, item.z, true, item.tipo, item.index, item.formationCol);
                reclamarSlot(m);
                clampMinionToLane(m);
                if (isFirstWave) { m.isGhost = true; m.ghostTimer = CONFIG.firstWaveGhostDuration; }
                enemigos.push(m);
            }
            console.log(`👾 [t=${gameTime.toFixed(2)}s] Spawn: ${item.team} ${item.tipo} #${item.index + 1} en (${item.x.toFixed(1)}, ${item.z.toFixed(1)})`);
            spawnQueue.splice(i, 1);
        }
    }
    if (spawnQueue.length === 0) spawnQueueTimer = 0;
}

let playerModel = null;
let mixer = null;
let animIdle = null;
let animWalk = null;
let animAttack = null;         // clip Attack con arma (Cannon.Attack / Sword.Attack)
let currentAttackTipo = 'bala'; // 'bala' para Axies de fuego, 'melee' para katana
let attackAnimTimer = 0;       // temporizador del gesto de ataque del Axie
let currentAnim = 'idle';
let targetPosition = null;
let isMovingToTarget = false;
let playerSpeed = CONFIG.axieSpeed;
const playerSpawnPosition = new THREE.Vector3(0, 0, -20);
let smoothPlayerPos = new THREE.Vector3(0, 0, -20);
let smoothTargetPos = new THREE.Vector3(0, 0, -20);
let attackCooldown = 0;
let playerProjectiles = [];
let isAttacking = false;
let attackRange = CONFIG.attackRange;
let attackDamage = CONFIG.attackDamage;
let attackSpeed = CONFIG.attackSpeed;
// --- Defensas del jugador (items de tienda) ---
// Se aplican como reduccion porcentual: mitiga/(mitiga+100).
// 0 -> 0% | 20 -> 16.7% | 40 -> 28.6% | 60 -> 37.5%
let playerArmor = 0;        // defensa fisica (minions melee, Axie enemigo)
let playerMagicResist = 0;  // defensa magica (proyectiles de los magos)

// Tipos de dano. Solo hay dos fuentes claramente distinguibles:
// los proyectiles de los magos son dano magico; el resto es fisico.
const DMG_PHYSICAL = 'physical';
const DMG_MAGIC = 'magic';

// Mitigacion por defensa: mitiga / (mitiga + 100).
// Escala suave: nunca llega a 100%, y el primer punto comprado ya se nota.
function mitigarDano(damage, tipo = DMG_PHYSICAL) {
    const defensa = (tipo === DMG_MAGIC) ? playerMagicResist : playerArmor;
    if (defensa <= 0) return damage;
    const factor = 1 - (defensa / (defensa + 100));
    return Math.max(1, damage * factor);
}
let isAutoMovingToTarget = false;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getGroundIntersection(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const ip = new THREE.Vector3();
    const intersectPoint = raycaster.ray.intersectPlane(plane, ip);
    if (intersectPoint) {
        intersectPoint.x = Math.max(-17, Math.min(17, intersectPoint.x));
        intersectPoint.z = Math.max(-26, Math.min(26, intersectPoint.z));
        intersectPoint.y = GROUND_Y;
        return intersectPoint;
    }
    return null;
}

renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

function loadSelectedAxie(axieId) {
    return new Promise((resolve) => {
        const axieData = getAxieById(axieId);
        if (!axieData) { loadDefaultAxie().then(resolve); return; }
        const loader = sharedGLTFLoader;
        const modelPath = getAxieModelPath(axieData);
        console.log(`🦊 Cargando Axie: ${axieData.nombre} desde ${modelPath}`);
        loader.load(modelPath, (gltf) => {
            if (playerModel) { scene.remove(playerModel); if (mixer) { mixer.stopAllAction(); mixer = null; } }
            playerModel = gltf.scene;
            const escala = axieData.escala || 1.2;
            playerModel.scale.set(escala, escala, escala);
            playerModel.position.copy(playerSpawnPosition);
            playerModel.position.y = GROUND_Y;
            smoothPlayerPos.copy(playerSpawnPosition);
            smoothPlayerPos.y = GROUND_Y;
            playerModel.traverse((n) => { if (n.isMesh) { n.castShadow = false; n.receiveShadow = false; } });
            scene.add(playerModel);
            attachPlayerHealthBar();
            mixer = new THREE.AnimationMixer(playerModel);
            // Los GLB traen DOS juegos de clips: genericos (Idle, Walk) y con arma
            // (Cannon.Idle, Sword.Walk...). Un 'includes' a secas hacia que los
            // clips con arma sobrescribieran a los genericos por orden de lista, y
            // el Axie acababa con la pose de transporte (canon hacia atras).
            // Se elige a proposito: si lleva arma, se usan los clips de arma.
            // El prefijo (Cannon, Sword, Hammer, Staff, Axe) sale del perfil del
            // Axie. Tripp no trae Axe.Idle/Axe.Walk, y con prefijo null conserva
            // los genericos. Si no, el Axie se quedaria sin reposo ni caminata.
            const perfilJugador = getPerfilCombate(axieData.id);
            const prefijo = perfilJugador.clipArma ? perfilJugador.clipArma.toLowerCase() + '.' : null;
            const elegirClip = (deseado) => {
                let generico = null, conArma = null;
                gltf.animations.forEach(clip => {
                    const name = clip.name.toLowerCase();
                    if (!name.includes(deseado)) return;
                    const esDeArma = prefijo ? name.startsWith(prefijo) : false;
                    if (esDeArma) { if (!conArma) conArma = clip; }
                    else if (name === deseado) { generico = clip; }
                });
                return conArma || generico;
            };
            const clipIdle = elegirClip('idle');
            const clipWalk = elegirClip('walk');
            if (clipIdle) animIdle = mixer.clipAction(clipIdle);
            if (clipWalk) animWalk = mixer.clipAction(clipWalk);
            const clipAttack = elegirClip('attack');
            if (clipAttack) animAttack = mixer.clipAction(clipAttack);
            // Bing dispara con el canon (a distancia); Kotaro pega con la katana (melee).
            // Tipo de ataque desde el catalogo: 'rango' lanza proyectil (Bing,
            // Pomodoro, Tripp) y 'melee' da golpe fisico (Kotaro, Kibo, Paladill, Xia).
            currentAttackTipo = (perfilJugador.tipo === 'melee') ? 'melee' : 'bala';
            if (animIdle) animIdle.play();
            attachAxieWeapon(playerModel, axieData);
            axieLoaded = true;
            currentAxieName = axieData.nombre;
            resolve();
        }, undefined, (err) => {
            console.error(`❌ Error cargando ${modelPath}:`, err);
            loadDefaultAxie().then(resolve);
        });
    });
}

function loadDefaultAxie() {
    return new Promise((resolve) => {
        const loader = sharedGLTFLoader;
        const defaultPath = CONFIG.AXIES_BASE_PATH + 'bing.glb';
        console.log(`🦊 Cargando Axie por defecto: ${defaultPath}`);
        loader.load(defaultPath, (gltf) => {
            if (playerModel) { scene.remove(playerModel); if (mixer) { mixer.stopAllAction(); mixer = null; } }
            playerModel = gltf.scene;
            playerModel.scale.set(1.2, 1.2, 1.2);
            playerModel.position.copy(playerSpawnPosition);
            playerModel.position.y = GROUND_Y;
            smoothPlayerPos.copy(playerSpawnPosition);
            smoothPlayerPos.y = GROUND_Y;
            scene.add(playerModel);
            attachPlayerHealthBar();
            mixer = new THREE.AnimationMixer(playerModel);
            const clipIdle = gltf.animations.find(c => c.name.toLowerCase() === 'idle') || gltf.animations[0];
            const clipWalk = gltf.animations.find(c => c.name.toLowerCase() === 'walk');
            if (clipIdle) animIdle = mixer.clipAction(clipIdle);
            if (clipWalk) animWalk = mixer.clipAction(clipWalk);
            if (animIdle) animIdle.play();
            axieLoaded = true;
            currentAxieName = 'Bing';
            resolve();
        }, undefined, (err) => {
            console.error(`❌ Error cargando Axie por defecto (${defaultPath}):`, err);
            console.warn('⚠️ Usando cubo rojo como fallback');
            const fb = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 1), new THREE.MeshStandardMaterial({ color: 0xff4444 }));
            fb.position.copy(playerSpawnPosition);
            fb.position.y = GROUND_Y;
            scene.add(fb);
            playerModel = fb;
            attachPlayerHealthBar();
            smoothPlayerPos.copy(playerSpawnPosition);
            axieLoaded = true;
            currentAxieName = 'Bing';
            resolve();
        });
    });
}

let playerHUD = null;
let hudWrapper = null;
let potionHUD = null;
let itemHUD = null;
let abilityHUD = null;      // panel de teclas Q/W/E/R
let itemSlots = [];

function createPlayerHUD() {
    if (playerHUD) playerHUD.remove();
    if (hudWrapper) hudWrapper.remove();
    hudWrapper = document.createElement('div');
    hudWrapper.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-25%);display:flex;align-items:stretch;gap:10px;z-index:1000;pointer-events:none;`;
    document.body.appendChild(hudWrapper);

    playerHUD = document.createElement('div');
    playerHUD.style.cssText = `width:400px;background:rgba(0,0,0,0.9);border:2px solid rgba(255,255,255,0.3);border-radius:12px;padding:15px;color:#fff;box-sizing:border-box;`;
    playerHUD.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="font-size:20px;">⚔️</div>
            <div style="font-weight:bold;font-size:18px;color:#44ff88;">${currentAxieName}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="color:#ff6644;">❤️</span>
            <div style="flex:1;height:18px;background:rgba(255,255,255,0.15);border-radius:4px;overflow:hidden;">
                <div id="player-hud-health-bar" style="width:100%;height:100%;background:linear-gradient(90deg,#ff2244,#ff6644);"></div>
            </div>
            <span id="player-hud-health-text" style="font-size:14px;font-weight:bold;">200/200</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="color:#44aaff;">💧</span>
            <div style="flex:1;height:18px;background:rgba(255,255,255,0.15);border-radius:4px;overflow:hidden;">
                <div id="player-hud-mana-bar" style="width:100%;height:100%;background:linear-gradient(90deg,#2266ff,#44aaff);"></div>
            </div>
            <span id="player-hud-mana-text" style="font-size:14px;font-weight:bold;">200/200</span>
        </div>
    `;
    hudWrapper.appendChild(playerHUD);
    
    // Esperar al render para medir el alto y crear el resto
    requestAnimationFrame(() => {
        const h = playerHUD.offsetHeight || 100;
        createPotionHUD(h);
        createItemHUD(h);
        createAbilityHUD(h);
    });
}

function createPotionHUD(h) {
    if (potionHUD) potionHUD.remove();
    potionHUD = document.createElement('div');
    potionHUD.style.cssText = `width:60px;height:${h}px;background:rgba(0,0,0,0.9);border:2px solid rgba(255,255,255,0.3);border-radius:12px;padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;pointer-events:auto;`;
    
    const title = document.createElement('div');
    title.textContent = 'POTIONS';
    title.style.cssText = `font-size:9px;color:#ffcc44;font-weight:bold;margin-bottom:2px;letter-spacing:1px;`;
    potionHUD.appendChild(title);

    const hpBox = document.createElement('div');
    hpBox.id = 'potion-hp-box';
    hpBox.style.cssText = `width:34px;height:34px;background:rgba(255,255,255,0.05);border:2px solid rgba(255,255,255,0.15);border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;position:relative;`;
    hpBox.innerHTML = `<div style="font-size:14px;">🧪</div><div id="potion-hp-count" style="position:absolute;bottom:1px;right:3px;font-size:10px;color:#ff6644;font-weight:bold;">0</div>`;
    hpBox.onclick = () => usePotion('hp');
    potionHUD.appendChild(hpBox);
    
    const mpBox = document.createElement('div');
    mpBox.id = 'potion-mp-box';
    mpBox.style.cssText = `width:34px;height:34px;background:rgba(255,255,255,0.05);border:2px solid rgba(255,255,255,0.15);border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;position:relative;`;
    mpBox.innerHTML = `<div style="font-size:14px;">💧</div><div id="potion-mp-count" style="position:absolute;bottom:1px;right:3px;font-size:10px;color:#44aaff;font-weight:bold;">0</div>`;
    mpBox.onclick = () => usePotion('mp');
    potionHUD.appendChild(mpBox);
    
    hudWrapper.appendChild(potionHUD);
}

function createAbilityHUD(h) {
    if (abilityHUD) abilityHUD.remove();
    habilidadCajas = {};
    abilityHUD = document.createElement('div');
    // Solo las habilidades se desplazan a la izquierda para no solaparse con las demás barras.
    abilityHUD.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-145%);z-index:1001;background:rgba(0,0,0,0.9);border:2px solid rgba(255,255,255,0.3);border-radius:14px;padding:12px;display:flex;flex-direction:row;gap:10px;box-sizing:border-box;pointer-events:auto;align-items:center;`;
    for (const hab of getHabilidades()) {
        const box = document.createElement('div');
        box.style.cssText = `width:80px;height:80px;background:rgba(0,0,0,0.6);border:2px solid ${hab.color};border-radius:10px;display:flex;align-items:center;justify-content:center;user-select:none;overflow:hidden;position:relative;`;
        if (hab.icono) {
            const img = document.createElement('img');
            img.src = getAssetUrl(hab.icono);
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
            img.onerror = () => { img.remove(); pintarTecla(box, hab); };
            box.appendChild(img);
        } else {
            pintarTecla(box, hab);
        }
        const key = document.createElement('div');
        key.textContent = hab.tecla;
        key.style.cssText = 'position:absolute;top:4px;left:6px;font-size:12px;font-weight:bold;color:#fff;background:rgba(0,0,0,0.7);padding:2px 6px;border-radius:4px;z-index:3;';
        box.appendChild(key);

        const cd = document.createElement('div');
        cd.id = 'ability-cd-' + hab.id;
        cd.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:#fff;text-shadow:0 0 5px #000;z-index:4;';
        box.appendChild(cd);

        habilidadCajas[hab.id] = box;
        abilityHUD.appendChild(box);
    }
    document.body.appendChild(abilityHUD);
}

// Dibuja la tecla y el nombre dentro de un hueco sin icono.
function pintarTecla(box, hab) {
    box.innerHTML = `<div style="text-align:center;color:#fff;">
        <div style="font-size:18px;font-weight:bold;color:${hab.color};">${hab.tecla}</div>
        <div style="font-size:9px;opacity:0.8;">${hab.nombre}</div>
    </div>`;
}

// Refresca recargas y estado de maná de TODAS las habilidades del panel.
function updateAbilityHUD() {
    for (const hab of getHabilidades()) {
        const box = habilidadCajas[hab.id];
        if (!box) continue;
        const cd = document.getElementById('ability-cd-' + hab.id);
        const restante = cooldownsHabilidad[hab.id] || 0;
        const sinMana = hab.mana > 0 && playerMana < hab.mana;
        if (restante > 0) {
            if (cd) cd.textContent = restante.toFixed(1) + 's';
            box.style.opacity = '0.55';
        } else if (sinMana) {
            if (cd) cd.textContent = 'MP';
            box.style.opacity = '0.55';
        } else {
            if (cd) cd.textContent = '';
            box.style.opacity = '1';
        }
    }
}

function createItemHUD(h) {
    if (itemHUD) itemHUD.remove();
    itemHUD = document.createElement('div');
    itemHUD.style.cssText = `width:130px;height:${h}px;background:rgba(0,0,0,0.9);border:2px solid rgba(255,255,255,0.3);border-radius:12px;padding:6px;display:flex;flex-direction:column;align-items:center;box-sizing:border-box;`;
    const title = document.createElement('div');
    title.textContent = 'ITEMS';
    title.style.cssText = `font-size:10px;color:#ffcc44;font-weight:bold;margin-bottom:3px;letter-spacing:2px;`;
    itemHUD.appendChild(title);
    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(3,1fr);gap:4px;`;
    itemSlots = [];
    for (let i = 0; i < 6; i++) {
        const slot = document.createElement('div');
        slot.dataset.slotIndex = i;
        slot.style.cssText = `width:30px;height:30px;background:rgba(255,255,255,0.05);border:2px solid rgba(255,255,255,0.15);border-radius:6px;display:flex;justify-content:center;align-items:center;font-size:13px;pointer-events:auto;`;
        itemSlots.push(slot);
        grid.appendChild(slot);
    }
    itemHUD.appendChild(grid);
    hudWrapper.appendChild(itemHUD);
}

function updatePlayerHUD() {
    updatePlayerHealthBarSprite();   // barra 3D sobre la cabeza del Axie
    if (!playerHUD) return;
    if (isAITrainingMode) { updateDynamicHUDForCamera(); return; }

    const hpPct = Math.max(0, (playerHealth / playerMaxHealth) * 100);
    const mpPct = Math.max(0, (playerMana / playerMaxMana) * 100);

    const hpBar = document.getElementById('player-hud-health-bar');
    const hpText = document.getElementById('player-hud-health-text');
    const mpBar = document.getElementById('player-hud-mana-bar');
    const mpText = document.getElementById('player-hud-mana-text');

    if (hpBar) hpBar.style.width = `${hpPct}%`;
    if (hpText) hpText.textContent = `${Math.floor(playerHealth)}/${playerMaxHealth}`;
    if (mpBar) mpBar.style.width = `${mpPct}%`;
    if (mpText) mpText.textContent = `${Math.floor(playerMana)}/${playerMaxMana}`;
}

function updatePotionHUD() {
    const hpCount = document.getElementById('potion-hp-count');
    const mpCount = document.getElementById('potion-mp-count');
    if (hpCount) hpCount.textContent = `${potionHPCount}`;
    if (mpCount) mpCount.textContent = `${potionMPCount}`;
}

function usePotion(type) {
    if (gamePaused) return;
    if (isAITrainingMode) return;
    if (!playerSpawned || isPlayerDead) return;
    
    if (potionUseCooldown > 0) {
        console.log(`⏳ Cooldown poción: ${potionUseCooldown.toFixed(1)}s`);
        return;
    }
    
    if (type === 'hp') {
        if (potionHPCount <= 0) { console.log('⛔ Sin pociones HP'); return; }
        if (playerHealth >= playerMaxHealth) { console.log('⛔ HP lleno'); return; }
        potionHPCount--;
        playerHealth = Math.min(playerMaxHealth, playerHealth + 50);
        potionUseCooldown = CONFIG.POTION_USE_COOLDOWN;
        console.log(`💊 Poción HP usada (+50) | HP: ${Math.floor(playerHealth)}/${playerMaxHealth} | Quedan: ${potionHPCount}`);
        flashPotionHUD('hp');
    } else if (type === 'mp') {
        if (potionMPCount <= 0) { console.log('⛔ Sin pociones MP'); return; }
        if (playerMana >= playerMaxMana) { console.log('⛔ MP lleno'); return; }
        potionMPCount--;
        playerMana = Math.min(playerMaxMana, playerMana + 50);
        potionUseCooldown = CONFIG.POTION_USE_COOLDOWN;
        console.log(`💧 Poción MP usada (+50) | MP: ${Math.floor(playerMana)}/${playerMaxMana} | Quedan: ${potionMPCount}`);
        flashPotionHUD('mp');
    }
    // Sonido de poción
    audio.play('potion', { volume: 0.5 });
    updatePlayerHUD();
    updatePotionHUD();
}

function flashPotionHUD(type) {
    const box = document.getElementById(type === 'hp' ? 'potion-hp-box' : 'potion-mp-box');
    if (!box) return;
    const originalBg = box.style.background;
    box.style.background = 'rgba(68,255,136,0.6)';
    box.style.transform = 'scale(1.15)';
    setTimeout(() => {
        box.style.background = originalBg;
        box.style.transform = 'scale(1)';
    }, 200);
}

function getPlayerRespawnTime() {
    const idx = Math.min(playerDeathCount, PLAYER_DEATH_PENALTIES.length - 1);
    const time = PLAYER_DEATH_PENALTIES[idx];
    playerDeathCount++;
    console.log(`🔄 Respawn: ${time}s (muerte #${playerDeathCount})`);
    return time;
}

function playerTakeDamage(damage, tipo = DMG_PHYSICAL) {
    if (isPlayerDead) return;
    if (!playerSpawned) return;
    playerHealth -= mitigarDano(damage, tipo);
    if (playerHealth < 0) playerHealth = 0;
    updatePlayerHUD();
    if (playerHealth <= 0) {
        playerHealth = 0;
        isPlayerDead = true;
        playerRespawnTimer = getPlayerRespawnTime();
        if (playerModel) playerModel.visible = false;
        playerKillStreak = 0;
        playerAIIsRetreating = false;
        playerAIRetreatTimer = 0;
        playerAIRetreatCooldown = 0;
        playerAILastDamageTime = -999;
        if (ECONOMY.PENALTY_PLAYER_DEATH > 0 && !isAITrainingMode) {
            playerGold = Math.max(0, playerGold - ECONOMY.PENALTY_PLAYER_DEATH);
            updatePlayerGoldHUD();
        }
    }
}

let enemyAxieGold = 0;
let enemyAxieItems = {};
let enemyAxieBonuses = { speedMultiplier: 1.0, damageMultiplier: 1.0, attackSpeedMultiplier: 1.0, rangeBonus: 0, critChance: 0 };
let enemyAxieShopCooldown = 0;
let enemyAxieShopUses = 0;
const ENEMY_AXIE_SHOP_COOLDOWN = 8.0;
const ENEMY_AXIE_SHOP_MAX_USES = 3;
let enemyAxieIsShopping = false;
let enemyAxieShopInteractionTimer = 0;

function enemyAxieTakeDamage(damage) {
    if (enemyAxieIsDead || !enemyAxie) return;
    enemyAxie.health -= damage;
    if (enemyAxie.health < 0) enemyAxie.health = 0;
    updateEnemyHealthBar();
    if (window.currentTarget && window.currentTarget.type === 'enemy_axie') {
        window.currentTarget.health = enemyAxie.health;
        window.showTarget(window.currentTarget);
    }
    if (enemyAxie.health <= 0) {
        enemyAxie.health = 0;
        enemyAxieIsDead = true;
        enemyAxieRespawnTimer = CONFIG.RESPAWN_TIME;
        if (enemyAxieModel) enemyAxieModel.visible = false;
        enemyAxieShopUses = 0;
        enemyAxieShopCooldown = 0;
        enemyAxieIsShopping = false;
        enemyAxieIsRetreating = false;
        enemyAxieRetreatTimer = 0;
        enemyAxieRetreatCooldown = 0;
        enemyAxieLastDamageTime = -999;
        enemyAxieBrain.stats._forcedPlayerTarget = null;
        enemyAxieBrain.stats.deaths++;
        enemyAxieBrain.weights.caution += 0.2;
        clampWeights(enemyAxieBrain.weights);
    }
}

function showDefeatScreen() {
    if (gameFinished) return;
    gameFinished = true;
    if (isAITrainingMode) { handleAITrainingMatchEnd('defeat'); return; }
    // Sonido de derrota
    audio.play('defeat', { volume: 0.8 });
    if (defeatScreen) defeatScreen.remove();
    defeatScreen = document.createElement('div');
    defeatScreen.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:1000;`;
    defeatScreen.innerHTML = `
        <div style="font-size:80px;color:#ff2244;font-family:'Arial Black';">💀 DERROTA 💀</div>
        <button style="margin-top:40px;padding:16px 48px;font-size:24px;background:linear-gradient(135deg,#ff4444,#cc2222);color:#fff;border:none;border-radius:12px;cursor:pointer;" onclick="window.location.reload()">🏠 Ir a Inicio</button>
    `;
    document.body.appendChild(defeatScreen);
}

let enemyAxie = null;
let enemyAxieModel = null;
let enemyAxieMixer = null;
let enemyAxieAnimIdle = null;
let enemyAxieAnimWalk = null;
let enemyAxieAnimAttack = null;   // clip de ataque con arma del Axie enemigo
let enemyAxieAttackTimer = 0;     // temporizador del gesto de ataque
let enemyAxieCurrentAnim = 'idle';
// Histeresis de objetivo: el Axie enemigo guarda a quien persigue y lo
// mantiene un tiempo minimo. Sin esto, cuando un minion aliado se cruza
// con la torre que estaba atacando, el objetivo saltaba de torre a minion
// y de vuelta cada frame, y el Axie se quedaba oscilando en el borde.
let enemyAxieLockedTarget = null;   // { type, ref } del objetivo retenido
let enemyAxieLockTimer = 0;         // segundos que quedan de retencion
const ENEMY_AXIE_TARGET_LOCK = 0.8; // duracion de la retencion
let enemyAxieAttackCooldown = 0;
let enemyAxieHealth = CONFIG.enemyMaxHealth;
let enemyAxieMaxHealth = CONFIG.enemyMaxHealth;
let enemyAxieIsDead = false;
let enemyAxieRespawnTimer = 0;
let enemyAxieSpawned = false;
const ENEMY_AXIE_ATTACK_RANGE = 2.5;
const ENEMY_AXIE_ATTACK_DAMAGE = 10;
const ENEMY_AXIE_ATTACK_SPEED = 0.8;
const ENEMY_AXIE_SPEED = 1.2;
const ENEMY_AXIE_SPAWN_POS = new THREE.Vector3(0, 0, 22);

let enemyHealthBarMat = null;
const ENEMY_HEALTH_SEGMENTS = 10;

function makeEnemyAxieRef() {
    return {
        group: enemyAxieModel,
        isDead: enemyAxieIsDead,
        health: enemyAxie ? enemyAxie.health : 0,
        maxHealth: enemyAxieMaxHealth,
        type: 'enemy_axie',
        isEnemy: true,
        updateHealthBar: updateEnemyHealthBar,
        takeDamage: enemyAxieTakeDamage,
        die: function () {
            enemyAxieIsDead = true;
            enemyAxieRespawnTimer = CONFIG.RESPAWN_TIME;
            if (enemyAxieModel) enemyAxieModel.visible = false;
        }
    };
}

function spawnEnemyAxie() {
    if (enemyAxieSpawned || gameFinished) return;
    console.log(`🤖 [t=${gameTime.toFixed(2)}s] Spawneando Axie enemigo...`);
    const allAxies = getAllAxies();
    const available = allAxies.filter(a => a.id !== selectedAxieId);
    const randomAxie = available[Math.floor(Math.random() * available.length)];
    enemyAxie = { id: randomAxie.id, nombre: randomAxie.nombre, data: randomAxie, health: enemyAxieHealth, maxHealth: enemyAxieMaxHealth, isDead: false };
    
    enemyAxieGold = 0;
    enemyAxieItems = {};
    enemyAxieBonuses = { speedMultiplier: 1.0, damageMultiplier: 1.0, attackSpeedMultiplier: 1.0, rangeBonus: 0, critChance: 0 };
    enemyAxieShopCooldown = 0;
    enemyAxieShopUses = 0;
    enemyAxieIsShopping = false;
    enemyAxieIsRetreating = false;
    enemyAxieRetreatTimer = 0;
    enemyAxieRetreatCooldown = 0;
    enemyAxieLastDamageTime = -999;
    enemyAxieBrain.stats._forcedPlayerTarget = null;
    enemyAxieBrain.stats._lastTargetType = null;
    enemyAxiePotionCount = 0;
    enemyAxiePotionCooldown = 0;
    
    const loader = sharedGLTFLoader;
    const modelPath = getAxieModelPath(randomAxie);
    console.log(`🤖 Cargando Axie enemigo: ${randomAxie.nombre} desde ${modelPath}`);
    loader.load(modelPath, (gltf) => {
        enemyAxieModel = gltf.scene;
        enemyAxieModel.position.set(ENEMY_AXIE_SPAWN_POS.x, GROUND_Y - 0.5, ENEMY_AXIE_SPAWN_POS.z);
        const escala = randomAxie.escala || 1.2;
        enemyAxieModel.scale.set(escala, escala, escala);
        enemyAxieModel.rotation.y = Math.PI;
        enemyAxieModel.traverse((n) => { if (n.isMesh) { n.castShadow = false; n.receiveShadow = false; } });
        scene.add(enemyAxieModel);
        enemyAxieMixer = new THREE.AnimationMixer(enemyAxieModel);
        // Mismo criterio que el jugador: si el Axie lleva arma, se usan los clips
        // con arma (Cannon.Idle, Sword.Walk...) en vez de los genericos.
        const perfilEnemigo = getPerfilCombate(randomAxie.id);
        const prefijoE = perfilEnemigo.clipArma ? perfilEnemigo.clipArma.toLowerCase() + '.' : null;
        const elegirClipE = (deseado) => {
            let generico = null, conArma = null;
            gltf.animations.forEach(clip => {
                const name = clip.name.toLowerCase();
                if (!name.includes(deseado)) return;
                const esDeArma = prefijoE ? name.startsWith(prefijoE) : false;
                if (esDeArma) { if (!conArma) conArma = clip; }
                else if (name === deseado) { generico = clip; }
            });
            return conArma || generico;
        };
        const clipIdleE = elegirClipE('idle');
        const clipWalkE = elegirClipE('walk');
        // El clip de ataque se busca por NOMBRE EXACTO del catalogo (Cannon.Attack,
        // Sword.Attack...). Tripp no trae Idle/Walk con arma pero si Axe.Attack.
        const clipAttackE = gltf.animations.find(c => c.name === perfilEnemigo.ataque) || elegirClipE('attack');
        if (clipIdleE) enemyAxieAnimIdle = enemyAxieMixer.clipAction(clipIdleE);
        if (clipWalkE) enemyAxieAnimWalk = enemyAxieMixer.clipAction(clipWalkE);
        if (clipAttackE) enemyAxieAnimAttack = enemyAxieMixer.clipAction(clipAttackE);
        if (enemyAxieAnimIdle) { enemyAxieAnimIdle.play(); enemyAxieCurrentAnim = 'idle'; }
        attachAxieWeapon(enemyAxieModel, randomAxie, true);
        const hb = createHealthBar(ENEMY_HEALTH_SEGMENTS, true);
        hb.sprite.position.set(0, 1.8, 0);
        enemyAxieModel.add(hb.sprite);
        enemyHealthBarMat = hb.spriteMat;
        enemyAxieSpawned = true;
    }, undefined, (err) => {
        console.error(`❌ Error cargando Axie enemigo:`, err);
        crearEnemyAxieFallback(randomAxie);
    });
}

function crearEnemyAxieFallback(axieData) {
    const group = new THREE.Group();
    group.position.set(ENEMY_AXIE_SPAWN_POS.x, GROUND_Y - 0.5, ENEMY_AXIE_SPAWN_POS.z);
    const color = new THREE.Color(axieData.color || '#ff4444');
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
    body.position.y = 0.6;
    group.add(body);
    scene.add(group);
    enemyAxieModel = group;
    enemyAxieSpawned = true;
    const hb = createHealthBar(ENEMY_HEALTH_SEGMENTS, true);
    hb.sprite.position.set(0, 1.8, 0);
    group.add(hb.sprite);
    enemyHealthBarMat = hb.spriteMat;
}

function updateEnemyHealthBar() {
    if (!enemyHealthBarMat || !enemyAxie) return;
    const hp = Math.max(0, enemyAxie.health / enemyAxieMaxHealth);
    const vis = Math.max(0, Math.min(ENEMY_HEALTH_SEGMENTS, Math.ceil(hp * ENEMY_HEALTH_SEGMENTS)));
    updateHealthBarSprite(enemyHealthBarMat, ENEMY_HEALTH_SEGMENTS, vis, true);
}

function buyEnemyAxieItems() {
    if (enemyAxieGold >= CONFIG.AXIE_POTION_BUY_THRESHOLD && enemyAxiePotionCount < CONFIG.AXIE_MAX_POTIONS) {
        const cantidad = Math.min(
            Math.floor(enemyAxieGold / CONFIG.AXIE_POTION_COST),
            CONFIG.AXIE_MAX_POTIONS - enemyAxiePotionCount
        );
        if (cantidad > 0) {
            const costo = cantidad * CONFIG.AXIE_POTION_COST;
            enemyAxieGold -= costo;
            enemyAxiePotionCount += cantidad;
            console.log(`🧪 Axie enemigo compró ${cantidad} pociones (total: ${enemyAxiePotionCount}/${CONFIG.AXIE_MAX_POTIONS}) | Oro: ${enemyAxieGold}`);
            return;
        }
    }
    
    const hpPct = enemyAxie.health / enemyAxieMaxHealth;
    const enemiesAlive = aliados.filter(m => !m.isDead).length;
    const allyTowersAlive = towers.filter(t => !t.isDead && !t.isEnemy).length;
    const priorities = [];
    if (hpPct < 0.5) priorities.push('botas', 'espada');
    if (allyTowersAlive > 0) priorities.push('espada', 'daga');
    if (enemiesAlive > 3) priorities.push('arco', 'baculo');
    priorities.push('espada', 'botas', 'arco', 'daga', 'baculo');
    for (const itemId of priorities) {
        const item = ENEMY_AXIE_ITEM_CATALOG[itemId];
        if (!item) continue;
        const stack = enemyAxieItems[itemId] || 0;
        if (stack >= item.maxStack) continue;
        if (enemyAxieGold < item.cost) continue;
        enemyAxieGold -= item.cost;
        enemyAxieItems[itemId] = stack + 1;
        item.apply(enemyAxieBonuses);
        console.log(`🛒 Axie enemigo compró ${item.emoji} ${item.name} (${enemyAxieGold} oro restante)`);
        break;
    }
}

function buyPlayerAIItems() {
    if (playerAIGold >= CONFIG.AXIE_POTION_BUY_THRESHOLD && playerAIPotionCount < CONFIG.AXIE_MAX_POTIONS) {
        const cantidad = Math.min(
            Math.floor(playerAIGold / CONFIG.AXIE_POTION_COST),
            CONFIG.AXIE_MAX_POTIONS - playerAIPotionCount
        );
        if (cantidad > 0) {
            const costo = cantidad * CONFIG.AXIE_POTION_COST;
            playerAIGold -= costo;
            playerAIPotionCount += cantidad;
            console.log(`🧪 Jugador-IA compró ${cantidad} pociones (total: ${playerAIPotionCount}/${CONFIG.AXIE_MAX_POTIONS}) | Oro: ${playerAIGold}`);
            return;
        }
    }
    
    const hpPct = playerHealth / playerMaxHealth;
    const enemiesAlive = enemigos.filter(m => !m.isDead).length;
    const enemyTowersAlive = towers.filter(t => !t.isDead && t.isEnemy).length;
    const priorities = [];
    if (hpPct < 0.5) priorities.push('botas', 'espada');
    if (enemyTowersAlive > 0) priorities.push('espada', 'daga');
    if (enemiesAlive > 3) priorities.push('arco', 'baculo');
    priorities.push('espada', 'botas', 'arco', 'daga', 'baculo');
    for (const itemId of priorities) {
        const item = ENEMY_AXIE_ITEM_CATALOG[itemId];
        if (!item) continue;
        const stack = playerAIItems[itemId] || 0;
        if (stack >= item.maxStack) continue;
        if (playerAIGold < item.cost) continue;
        playerAIGold -= item.cost;
        playerAIItems[itemId] = stack + 1;
        item.apply(playerAIBonuses);
        console.log(`🛒 Jugador-IA compró ${item.emoji} ${item.name} (${playerAIGold} oro restante)`);
        break;
    }
}

function findBestEnemyTarget() {
    if (!enemyAxieModel || enemyAxieIsDead) return null;
    const enemyPos = enemyAxieModel.position;
    const w = enemyAxieBrain.weights;
    const hpPct = enemyAxie.health / enemyAxieMaxHealth;
    
    const timeSinceDamageShop = gameTime - enemyAxieLastDamageTime;
    const underAttack = timeSinceDamageShop < CONFIG.AXIE_SHOP_DAMAGE_MEMORY;
    const lowHP = hpPct < CONFIG.AXIE_SHOP_HP_MIN;
    
    const canUseShop = shopEnemiga && enemyAxieShopCooldown <= 0 && enemyAxieShopUses < ENEMY_AXIE_SHOP_MAX_USES;
    const hasItemsToBuy = Object.entries(ENEMY_AXIE_ITEM_CATALOG).some(([id, item]) => {
        const stack = enemyAxieItems[id] || 0;
        return stack < item.maxStack && enemyAxieGold >= item.cost;
    });
    const hasGoldForPotions = enemyAxieGold >= CONFIG.AXIE_POTION_BUY_THRESHOLD && enemyAxiePotionCount < CONFIG.AXIE_MAX_POTIONS;
    const hasMinGold = enemyAxieGold >= 30;
    
    if (hasMinGold && !underAttack && !lowHP && (hasItemsToBuy || hasGoldForPotions) && canUseShop) {
        const dts = enemyPos.distanceTo(shopEnemiga.group.position);
        if (dts < 40) {
            const shopPos = shopEnemiga.group.position.clone();
            shopPos.x = Math.max(-17, Math.min(17, shopPos.x));
            shopPos.z = Math.max(-26, Math.min(26, shopPos.z));
            return { position: shopPos, type: 'shop', isDead: false, dist: dts, isShopRun: true };
        }
    }

    const candidates = [];
    const enemiesAlive = aliados.filter(m => !m.isDead).length;
    const myAlliesAlive = enemigos.filter(m => !m.isDead).length;
    const aliveAllyTowers = towers.filter(t => !t.isDead && !t.isEnemy);
    const myTowers = towers.filter(t => !t.isDead && t.isEnemy);
    const hasAdvantage = myAlliesAlive > enemiesAlive;

    for (const minion of aliados) {
        if (minion.isDead) continue;
        if (Math.abs(minion.group.position.x) > 3.0) continue;
        const dist = enemyPos.distanceTo(minion.group.position);
        if (dist > 20) continue;
        const isAhead = minion.group.position.z < enemyPos.z + 2;
        if (!isAhead) continue;
        let score = 200 - dist * 3;
        if (minion.health / minion.maxHealth < 0.3) score += 40;
        if (minion.tipo === 'mage') score += 15;
        candidates.push({ position: minion.group.position, type: 'minion', health: minion.health, isDead: minion.isDead, ref: minion, dist, score, reason: '🗡️ Limpiar carril' });
    }

    if (playerModel && !isPlayerDead && playerSpawned) {
        const dist = enemyPos.distanceTo(playerModel.position);
        const playerAggroRange = CONFIG.AXIE_AGGRO_TO_PLAYER + (w.focusPlayer - 1.0) * 3.0;
        if (dist < playerAggroRange && Math.abs(playerModel.position.x - enemyPos.x) < 3.5) {
            let score = 250 - dist * 5;
            if (playerHealth / playerMaxHealth < 0.3) score += 100;
            if (playerHealth / playerMaxHealth < 0.15) score += 150;
            candidates.push({ position: playerModel.position, type: 'player', health: playerHealth, isDead: isPlayerDead, ref: { group: playerModel, type: 'player' }, dist, score, takeDamage: playerTakeDamage, reason: '⚔️ Jugador' });
        }
    }

    const minionsInLane = aliados.filter(m => !m.isDead && Math.abs(m.group.position.x) < 3.0).length;
    if (minionsInLane === 0) {
        for (const tower of aliveAllyTowers) {
            const dist = enemyPos.distanceTo(tower.position);
            if (dist >= 25) continue;
            let score = 80 + (25 - dist) * 2 * w.focusStructure;
            if (enemiesAlive === 0) score += 150;
            else if (hasAdvantage) score += 60;
            const tHP = tower.health / tower.maxHealth;
            if (tHP < 0.3) score += 60;
            if (tHP < 0.1) score += 100;
            if (hpPct < 0.4 && dist < 7) score -= 100;
            candidates.push({ position: tower.position, type: 'tower', health: tower.health, isDead: tower.isDead, ref: tower, dist, score, reason: '🗼 Torre' });
        }
    }

    for (const myTower of myTowers) {
        for (const enemy of aliados) {
            if (enemy.isDead) continue;
            if (enemy.group.position.distanceTo(myTower.position) < 5.5) {
                const d = enemyPos.distanceTo(enemy.group.position);
                if (d < 16) candidates.push({ position: enemy.group.position, type: 'defend', isDead: enemy.isDead, ref: enemy, dist: d, score: 250, reason: '🛡️ Defensa' });
            }
        }
        if (playerModel && !isPlayerDead && playerSpawned && playerModel.position.distanceTo(myTower.position) < 6.5) {
            const d = enemyPos.distanceTo(playerModel.position);
            if (d < 16) candidates.push({ position: playerModel.position, type: 'defend_player', isDead: isPlayerDead, ref: { group: playerModel, type: 'player' }, dist: d, score: 260 });
        }
    }

    if (nexusAliado && !nexusAliado.isDead && aliveAllyTowers.length === 0 && minionsInLane === 0) {
        const dist = enemyPos.distanceTo(nexusAliado.position);
        if (dist < 30) {
            let score = 120 + (30 - dist) * 2 * w.focusStructure;
            if (enemiesAlive === 0) score += 100;
            candidates.push({ position: nexusAliado.position, type: 'nexus', health: nexusAliado.health, isDead: nexusAliado.isDead, ref: nexusAliado, dist, score, reason: '💎 Nexo' });
        }
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
}

// Reproduce el clip de ataque del Axie enemigo y lanza su proyectil si es de
// rango. El enemigo ataca con el mismo criterio que el jugador (rango/melee),
// para que los dos bandos se vean igual.
function reproducirAtaqueEnemigo(target) {
    if (enemyAxieAnimAttack) {
        enemyAxieAnimAttack.reset();
        enemyAxieAnimAttack.setEffectiveWeight(1);
        enemyAxieAnimAttack.setLoop(THREE.LoopOnce, 1);
        enemyAxieAnimAttack.clampWhenFinished = true;
        if (enemyAxieAnimWalk) enemyAxieAnimWalk.stop();
        if (enemyAxieAnimIdle) enemyAxieAnimIdle.stop();
        enemyAxieAnimAttack.fadeIn(0.05).play();
        enemyAxieAttackTimer = 0.55;
        enemyAxieCurrentAnim = 'attack';
    }
}

function enemyAxieAttack(target) {
    if (!target || target.isDead || enemyAxieIsDead) return;
    // Gesto de ataque: mismo clip con arma que el jugador.
    reproducirAtaqueEnemigo(target);
    if (target.type === 'tower' || target.type === 'nexus') {
        enemyAxieBrain.weights.focusStructure = Math.min(2.5, enemyAxieBrain.weights.focusStructure + 0.03);
    }
    if (target.type === 'player' || target.type === 'defend_player') {
        enemyAxieBrain.weights.focusPlayer = Math.min(2.5, enemyAxieBrain.weights.focusPlayer + 0.05);
    }
    const isCrit = Math.random() < enemyAxieBonuses.critChance;
    const fd = Math.round(ENEMY_AXIE_ATTACK_DAMAGE * enemyAxieBonuses.damageMultiplier * (isCrit ? 2 : 1));
    if (target.type === 'player' || target.type === 'defend_player') {
        playerTakeDamage(fd, DMG_PHYSICAL);
        if (isPlayerDead) enemyAxieGold += 50;
        return;
    }
    if (target.ref && target.ref.health !== undefined) {
        target.ref.health -= fd;
        if (target.ref.updateHealthBar) target.ref.updateHealthBar();
        if (target.ref.flashHit) target.ref.flashHit();
        if (target.ref.health <= 0 && target.ref.die) {
            target.ref.die('enemy_axie');
            if (target.type === 'minion') enemyAxieGold += 15;
            else if (target.type === 'tower') enemyAxieGold += 80;
            else if (target.type === 'nexus') enemyAxieGold += 150;
        }
    }
}

function updateEnemyAxie(delta) {
    if (!enemyAxieSpawned || !enemyAxieModel || gameFinished) return;
    if (enemyAxieIsDead) {
        enemyAxieRespawnTimer -= delta;
        if (enemyAxieRespawnTimer <= 0) {
            enemyAxieIsDead = false;
            enemyAxie.health = enemyAxieMaxHealth;
            if (enemyAxieModel) {
                enemyAxieModel.position.set(ENEMY_AXIE_SPAWN_POS.x, GROUND_Y - 0.5, ENEMY_AXIE_SPAWN_POS.z);
                enemyAxieModel.visible = true;
                enemyAxieModel.rotation.y = Math.PI;
            }
            updateEnemyHealthBar();
        }
        return;
    }
    
    if (enemyAxiePotionCooldown > 0) enemyAxiePotionCooldown -= delta;
    const hpPctNow = enemyAxie.health / enemyAxieMaxHealth;
    if (hpPctNow < CONFIG.AXIE_POTION_USE_THRESHOLD && enemyAxiePotionCount > 0 && enemyAxiePotionCooldown <= 0) {
        enemyAxiePotionCount--;
        enemyAxiePotionCooldown = ENEMY_AXIE_POTION_COOLDOWN;
        enemyAxie.health = Math.min(enemyAxieMaxHealth, enemyAxie.health + CONFIG.AXIE_POTION_HEAL);
        updateEnemyHealthBar();
        console.log(`💊 Axie enemigo usó poción (+${CONFIG.AXIE_POTION_HEAL} HP) | HP: ${Math.floor(enemyAxie.health)}/${enemyAxieMaxHealth} | Pociones: ${enemyAxiePotionCount}`);
    }
    
    if (enemyAxieShopCooldown > 0) {
        enemyAxieShopCooldown -= delta;
        if (enemyAxieShopCooldown < 0) enemyAxieShopCooldown = 0;
    }
    const diffY = GROUND_Y - enemyAxieModel.position.y;
    if (Math.abs(diffY) > 0.001) enemyAxieModel.position.y += diffY * Math.min(1, 6 * delta);
    else enemyAxieModel.position.y = GROUND_Y;
    
    if (enemyAxieRetreatCooldown > 0) enemyAxieRetreatCooldown -= delta;
    if (enemyAxieRetreatTimer > 0) enemyAxieRetreatTimer -= delta;

    const timeSinceDamage = gameTime - enemyAxieLastDamageTime;
    const hasRecentDamage = timeSinceDamage < ENEMY_AXIE_DAMAGE_MEMORY;
    const nearShootingTower = towers.some(t => 
        !t.isDead && !t.isEnemy && 
        enemyAxieModel.position.distanceTo(t.position) < (t.range + 0.5)
    );
    
    if (hasRecentDamage && nearShootingTower && !enemyAxieIsRetreating && enemyAxieRetreatCooldown <= 0) {
        enemyAxieIsRetreating = true;
        enemyAxieRetreatTimer = CONFIG.AXIE_RETREAT_MIN_TIME;
        console.log('🚨 Axie enemigo retrocede fuera del rango de torre');
    }
    
    if (enemyAxieIsRetreating) {
        const mustKeepRetreating = enemyAxieRetreatTimer > 0;
        const shootingTowers = towers.filter(t => !t.isDead && !t.isEnemy);
        let nearestTower = null;
        let nearestTowerDist = Infinity;
        for (const t of shootingTowers) {
            const d = enemyAxieModel.position.distanceTo(t.position);
            if (d < nearestTowerDist) { nearestTowerDist = d; nearestTower = t; }
        }
        
        if (nearestTower) {
            const safeDist = nearestTower.range + CONFIG.AXIE_RETREAT_SAFE_DISTANCE;
            const dx = enemyAxieModel.position.x - nearestTower.position.x;
            const dz = enemyAxieModel.position.z - nearestTower.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist < safeDist || mustKeepRetreating) {
                const targetX = nearestTower.position.x + (dx / (dist || 1)) * safeDist;
                const targetZ = nearestTower.position.z + (dz / (dist || 1)) * safeDist;
                const rdx = targetX - enemyAxieModel.position.x;
                const rdz = targetZ - enemyAxieModel.position.z;
                const rdist = Math.sqrt(rdx * rdx + rdz * rdz);
                
                if (rdist > 0.15) {
                    const ms = ENEMY_AXIE_SPEED * 1.3 * enemyAxieBonuses.speedMultiplier * delta;
                    enemyAxieModel.position.x += (rdx / rdist) * ms;
                    enemyAxieModel.position.z += (rdz / rdist) * ms;
                    enemyAxieModel.rotation.y = Math.atan2(rdx, rdz);
                    if (enemyAxieCurrentAnim !== 'walk' && enemyAxieAnimWalk) {
                        if (enemyAxieAnimIdle) enemyAxieAnimIdle.stop();
                        enemyAxieAnimWalk.play();
                        enemyAxieCurrentAnim = 'walk';
                    }
                } else if (!mustKeepRetreating) {
                    enemyAxieIsRetreating = false;
                    enemyAxieRetreatCooldown = CONFIG.AXIE_RETREAT_COOLDOWN;
                    console.log('✅ Axie enemigo fuera del rango de torre');
                }
            } else if (!mustKeepRetreating) {
                enemyAxieIsRetreating = false;
                enemyAxieRetreatCooldown = CONFIG.AXIE_RETREAT_COOLDOWN;
                console.log('✅ Axie enemigo fuera del rango de torre');
            }
        } else if (!mustKeepRetreating) {
            enemyAxieIsRetreating = false;
            enemyAxieRetreatCooldown = CONFIG.AXIE_RETREAT_COOLDOWN;
        }
        
        enemyAxieModel.position.x = Math.max(-17, Math.min(17, enemyAxieModel.position.x));
        enemyAxieModel.position.z = Math.max(-26, Math.min(26, enemyAxieModel.position.z));
        updateEnemyHealthBar();
        if (enemyAxieMixer) enemyAxieMixer.update(delta);
        return;
    }
    
    enemyAxieAttackCooldown -= delta * enemyAxieBonuses.attackSpeedMultiplier;

    if (playerModel && !isPlayerDead && playerSpawned) {
        const distToPlayer = enemyAxieModel.position.distanceTo(playerModel.position);
        const playerPhysRange = ENEMY_AXIE_ATTACK_RANGE + enemyAxieBonuses.rangeBonus;
        if (distToPlayer < playerPhysRange) {
            enemyAxieModel.rotation.y = Math.atan2(
                playerModel.position.x - enemyAxieModel.position.x,
                playerModel.position.z - enemyAxieModel.position.z
            );
            if (enemyAxieAttackCooldown <= 0) {
                enemyAxieAttack({ type: 'player', isDead: false, ref: { group: playerModel, type: 'player' } });
                enemyAxieAttackCooldown = ENEMY_AXIE_ATTACK_SPEED;
            }
            if (enemyAxieCurrentAnim !== 'idle' && enemyAxieAnimIdle) {
                if (enemyAxieAnimWalk) enemyAxieAnimWalk.stop();
                enemyAxieAnimIdle.play();
                enemyAxieCurrentAnim = 'idle';
            }
            updateEnemyHealthBar();
            if (enemyAxieMixer) enemyAxieMixer.update(delta);
            return;
        }
    }

    // Histeresis: si hay un objetivo retenido y sigue vivo, se mantiene hasta
    // que expire su temporizador. Evita el vaiven torre <-> minion.
    enemyAxieLockTimer -= delta;
    let bestTarget = findBestEnemyTarget();
    const lockVivo = enemyAxieLockedTarget && enemyAxieLockedTarget.ref
        && !enemyAxieLockedTarget.ref.isDead
        && !(enemyAxieLockedTarget.ref.health !== undefined && enemyAxieLockedTarget.ref.health <= 0);
    if (lockVivo && enemyAxieLockTimer > 0 && bestTarget) {
        // Mantener el objetivo retenido, conservando los datos frescos de posicion
        const ref = enemyAxieLockedTarget.ref;
        const posRef = ref.group ? ref.group.position : (ref.position || enemyAxieLockedTarget.pos);
        if (posRef && enemyAxieLockedTarget.type === bestTarget.type
            && Math.abs((posRef.x || 0) - bestTarget.position.x) < 0.01) {
            bestTarget = Object.assign({}, bestTarget, { position: posRef, ref });
        }
    }
    if (bestTarget) {
        // Renovar el candado cuando cambia de objetivo (o caduca).
        if (!lockVivo || enemyAxieLockTimer <= 0) {
            enemyAxieLockedTarget = { type: bestTarget.type, ref: bestTarget.ref, pos: bestTarget.position };
            enemyAxieLockTimer = ENEMY_AXIE_TARGET_LOCK;
        }
        const dynamicRange = ENEMY_AXIE_ATTACK_RANGE + enemyAxieBonuses.rangeBonus;
        const distToTarget = enemyAxieModel.position.distanceTo(bestTarget.position);
        
        if (bestTarget.isShopRun) {
            const nearbyEnemyMinion = aliados.find(m => !m.isDead && enemyAxieModel.position.distanceTo(m.group.position) < CONFIG.AXIE_SHOP_ENEMY_NEARBY_RADIUS);
            const nearbyPlayer = playerModel && !isPlayerDead && playerSpawned && enemyAxieModel.position.distanceTo(playerModel.position) < CONFIG.AXIE_SHOP_ENEMY_NEARBY_RADIUS;
            
            if (nearbyEnemyMinion || nearbyPlayer) {
                enemyAxieShopCooldown = 5.0;
                enemyAxieIsShopping = false;
                console.log('⚔️ Axie enemigo cancela tienda (enemigo cercano)');
            } else {
                const timeSinceDamageInShop = gameTime - enemyAxieLastDamageTime;
                const underAttackInShop = timeSinceDamageInShop < CONFIG.AXIE_SHOP_CANCEL_DAMAGE_MEMORY;
                const hpPctInShop = enemyAxie.health / enemyAxieMaxHealth;
                
                if (underAttackInShop || hpPctInShop < CONFIG.AXIE_SHOP_CANCEL_HP) {
                    enemyAxieShopCooldown = 5.0;
                    enemyAxieIsShopping = false;
                    console.log('⚠️ Axie enemigo cancela ida a tienda (bajo ataque o HP bajo)');
                } else {
                    const dx = bestTarget.position.x - enemyAxieModel.position.x;
                    const dz = bestTarget.position.z - enemyAxieModel.position.z;
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    const shopReachDist = 2.0;
                    if (dist > shopReachDist) {
                        const ms = ENEMY_AXIE_SPEED * 1.15 * enemyAxieBonuses.speedMultiplier * delta;
                        enemyAxieModel.position.x += (dx / dist) * ms;
                        enemyAxieModel.position.z += (dz / dist) * ms;
                        enemyAxieModel.rotation.y = Math.atan2(dx, dz);
                        if (enemyAxieCurrentAnim !== 'walk' && enemyAxieAnimWalk) {
                            if (enemyAxieAnimIdle) enemyAxieAnimIdle.stop();
                            enemyAxieAnimWalk.play();
                            enemyAxieCurrentAnim = 'walk';
                        }
                    } else {
                        if (!enemyAxieIsShopping) {
                            const canBuySomething = Object.entries(ENEMY_AXIE_ITEM_CATALOG).some(([id, item]) => {
                                const stack = enemyAxieItems[id] || 0;
                                return stack < item.maxStack && enemyAxieGold >= item.cost;
                            }) || (enemyAxieGold >= CONFIG.AXIE_POTION_BUY_THRESHOLD && enemyAxiePotionCount < CONFIG.AXIE_MAX_POTIONS);
                            
                            if (canBuySomething) {
                                enemyAxieIsShopping = true;
                                enemyAxieShopUses++;
                                enemyAxieShopCooldown = ENEMY_AXIE_SHOP_COOLDOWN;
                                buyEnemyAxieItems();
                                console.log('🛒 Axie enemigo compró items');
                                enemyAxieShopInteractionTimer = 1.0;
                            } else {
                                enemyAxieShopCooldown = 5.0;
                                enemyAxieShopInteractionTimer = 0;
                                enemyAxieIsShopping = false;
                                console.log('⚠️ Axie enemigo no puede comprar, volviendo al combate');
                            }
                        }
                    }
                    if (enemyAxieShopInteractionTimer > 0) {
                        enemyAxieShopInteractionTimer -= delta;
                        if (enemyAxieShopInteractionTimer <= 0) enemyAxieIsShopping = false;
                    }
                }
            }
        } else if (distToTarget <= dynamicRange) {
            enemyAxieModel.rotation.y = Math.atan2(bestTarget.position.x - enemyAxieModel.position.x, bestTarget.position.z - enemyAxieModel.position.z);
            if (enemyAxieAttackCooldown <= 0) {
                enemyAxieAttack(bestTarget);
                enemyAxieAttackCooldown = ENEMY_AXIE_ATTACK_SPEED;
            }
            if (enemyAxieCurrentAnim !== 'idle' && enemyAxieAnimIdle) {
                if (enemyAxieAnimWalk) enemyAxieAnimWalk.stop();
                enemyAxieAnimIdle.play();
                enemyAxieCurrentAnim = 'idle';
            }
        } else {
            const dx = bestTarget.position.x - enemyAxieModel.position.x;
            const dz = bestTarget.position.z - enemyAxieModel.position.z;
            const td = Math.sqrt(dx * dx + dz * dz);
            if (td > 0.5) {
                const speedBoost = (bestTarget.type === 'player' || bestTarget.type === 'defend_player') ? 1.3 : 1.0;
                const ms = ENEMY_AXIE_SPEED * enemyAxieBonuses.speedMultiplier * speedBoost * delta;
                enemyAxieModel.position.x += (dx / td) * ms;
                enemyAxieModel.position.z += (dz / td) * ms;
                enemyAxieModel.rotation.y = Math.atan2(dx, dz);
                if (enemyAxieCurrentAnim !== 'walk' && enemyAxieAnimWalk) {
                    if (enemyAxieAnimIdle) enemyAxieAnimIdle.stop();
                    enemyAxieAnimWalk.play();
                    enemyAxieCurrentAnim = 'walk';
                }
            }
        }
    } else {
        const ms = ENEMY_AXIE_SPEED * enemyAxieBonuses.speedMultiplier * delta * 0.8;
        enemyAxieModel.position.z -= ms;
        if (enemyAxieModel.position.z < -26) enemyAxieModel.position.z = -26;
    }
    enemyAxieModel.position.x = Math.max(-17, Math.min(17, enemyAxieModel.position.x));
    updateEnemyHealthBar();
    if (enemyAxieMixer) enemyAxieMixer.update(delta);
}

function resetEnemyAxie() {
    if (enemyAxieModel) { scene.remove(enemyAxieModel); enemyAxieModel = null; }
    enemyAxie = null;
    // Soltar el objetivo retenido: apuntaba al Axie/modelo que se acaba de borrar.
    enemyAxieLockedTarget = null;
    enemyAxieLockTimer = 0;
    enemyAxieMixer = null;
    enemyAxieAnimIdle = null;
    enemyAxieAnimWalk = null;
    enemyAxieSpawned = false;
    enemyAxieIsDead = false;
    enemyAxieHealth = enemyAxieMaxHealth;
    enemyAxieRespawnTimer = 0;
    enemyHealthBarMat = null;
    enemyAxieShopUses = 0;
    enemyAxieShopCooldown = 0;
    enemyAxieIsShopping = false;
    enemyAxieShopInteractionTimer = 0;
    enemyAxieIsRetreating = false;
    enemyAxieRetreatTimer = 0;
    enemyAxieRetreatCooldown = 0;
    enemyAxieLastDamageTime = -999;
    enemyAxieGold = 0;
    enemyAxieItems = {};
    enemyAxieBonuses = { speedMultiplier: 1.0, damageMultiplier: 1.0, attackSpeedMultiplier: 1.0, rangeBonus: 0, critChance: 0 };
    enemyAxieBrain.stats._forcedPlayerTarget = null;
    enemyAxieBrain.stats._lastTargetType = null;
    enemyAxiePotionCount = 0;
    enemyAxiePotionCooldown = 0;
}

// ============================================================
// TAREA A: colision con estructuras (tienda, nexo, torres)
// ============================================================
// Antes: resolveMinionCollisions() solo comprobaba minion contra minion.
// La tienda, el nexo y las torres no estaban en ninguna lista de colision,
// asi que los minions (y los Axies) las atravesaban como si no existieran.
//
// Ahora: cada entidad movil se empuja fuera del radio de cada estructura.
// El empuje es posicional (no fisica real): la saca por el borde del
// circulo en direccion radial. Es barato y suficiente para que las
// estructuras tengan cuerpo.

// Radio horizontal de cada estructura en unidades del mundo.
const STRUCTURE_RADII = {
    shop:  { ally: 1.45, enemy: 1.45 },
    nexus: { ally: 2.05, enemy: 1.85 },
    tower: { ally: 1.05, enemy: 1.25 },
};

// Radio del cuerpo de una entidad movil (minion o Axie).
const ENTITY_BODY_RADIUS = 0.42;

// Lista de estructuras vivas con su radio. Se reconstruye por frame a
// proposito: si una torre muere, deja de empujar al instante sin cache.
function getStructureColliders() {
    const list = [];
    for (const t of towers) {
        if (!t || t.isDead || !t.group) continue;
        const base = t.isEnemy ? STRUCTURE_RADII.tower.enemy : STRUCTURE_RADII.tower.ally;
        const tierBonus = t.tier === 2 ? 0.12 : 0;
        list.push({ ref: t, pos: t.group.position, radius: base + tierBonus });
    }
    if (nexusAliado && !nexusAliado.isDead && nexusAliado.group) {
        list.push({ ref: nexusAliado, pos: nexusAliado.group.position, radius: STRUCTURE_RADII.nexus.ally });
    }
    if (nexusEnemigo && !nexusEnemigo.isDead && nexusEnemigo.group) {
        list.push({ ref: nexusEnemigo, pos: nexusEnemigo.group.position, radius: STRUCTURE_RADII.nexus.enemy });
    }
    if (shopAliada && shopAliada.group) {
        list.push({ ref: shopAliada, pos: shopAliada.group.position, radius: STRUCTURE_RADII.shop.ally });
    }
    if (shopEnemiga && shopEnemiga.group) {
        list.push({ ref: shopEnemiga, pos: shopEnemiga.group.position, radius: STRUCTURE_RADII.shop.enemy });
    }
    return list;
}

// Saca una entidad del radio de una estructura si ha entrado.
// Devuelve true si hubo que empujarla.
function pushOutOfStructure(entity, collider) {
    const dx = entity.group.position.x - collider.pos.x;
    const dz = entity.group.position.z - collider.pos.z;
    const minDist = collider.radius + ENTITY_BODY_RADIUS;
    const dSq = dx * dx + dz * dz;

    if (dSq >= minDist * minDist) return false;

    let nx, nz;
    if (dSq < 0.0001) {
        // Justo en el centro: empuja en el eje del carril mirando al bando,
        // asi nunca lo expulsa por detras del nexo.
        nx = 0;
        nz = entity.isEnemy ? 1 : -1;
    } else {
        const d = Math.sqrt(dSq);
        nx = dx / d;
        nz = dz / d;
    }

    entity.group.position.x = collider.pos.x + nx * minDist;
    entity.group.position.z = collider.pos.z + nz * minDist;
    return true;
}

// Aplica la colision de estructuras a una lista de entidades moviles.
// Se llama despues de mover y antes de clampMinionToLane, para que el
// clamp del carril sea siempre la ultima palabra.
function applyStructureCollisions(entities) {
    const colliders = getStructureColliders();
    if (colliders.length === 0) return 0;
    let pushed = 0;
    for (const e of entities) {
        if (!e || !e.group || e.isDead) continue;
        if (e.type === 'tower' || e.type === 'nexus' || e.type === 'shop') continue;
        for (const c of colliders) {
            if (c.ref === e) continue;
            if (pushOutOfStructure(e, c)) pushed++;
        }
    }
    return pushed;
}

function resolveMinionCollisions(delta) {
    const all = aliados.concat(enemigos);
    const minDist = CONFIG.MINION_COLLISION_DISTANCE;
    
    for (let i = 0; i < all.length; i++) {
        const a = all[i];
        if (a.isDead || !a.group.visible) continue;
        for (let j = i + 1; j < all.length; j++) {
            const b = all[j];
            if (b.isDead || !b.group.visible) continue;
            const dx = b.group.position.x - a.group.position.x;
            const dz = b.group.position.z - a.group.position.z;
            const dSq = dx * dx + dz * dz;
            if (dSq < minDist * minDist && dSq > 0.0001) {
                const dist = Math.sqrt(dSq);
                const overlap = (minDist - dist) * 0.04;
                const nx = dx / dist, nz = dz / dist;
                a.group.position.x -= nx * overlap;
                a.group.position.z -= nz * overlap;
                b.group.position.x += nx * overlap;
                b.group.position.z += nz * overlap;
            }
        }
    }
    
    for (const m of all) {
        if (m.isDead || !m.group.visible) continue;
        clampMinionToLane(m);
    }
}

function findBestPlayerAITarget() {
    if (!playerModel || isPlayerDead) return null;
    const playerPos = playerModel.position;
    const candidates = [];
    const hpPct = playerHealth / playerMaxHealth;
    const enemiesAlive = enemigos.filter(m => !m.isDead).length;
    const aliveEnemyTowers = towers.filter(t => !t.isDead && t.isEnemy);
    const myTowers = towers.filter(t => !t.isDead && !t.isEnemy);
    const hasAdvantage = aliados.filter(m => !m.isDead).length > enemiesAlive;

    for (const minion of enemigos) {
        if (minion.isDead) continue;
        if (Math.abs(minion.group.position.x) > 3.0) continue;
        const dist = playerPos.distanceTo(minion.group.position);
        if (dist > 20) continue;
        const isAhead = minion.group.position.z > playerPos.z - 2;
        if (!isAhead) continue;
        let score = 200 - dist * 3;
        if (minion.health / minion.maxHealth < 0.3) score += 40;
        if (minion.tipo === 'mage') score += 15;
        candidates.push({ position: minion.group.position, type: 'minion', isDead: minion.isDead, ref: minion, dist, score, reason: '🗡️ Limpiar carril' });
    }

    if (enemyAxieModel && !enemyAxieIsDead) {
        const dist = playerPos.distanceTo(enemyAxieModel.position);
        const axieAggroRange = CONFIG.AXIE_AGGRO_TO_PLAYER;
        if (dist < axieAggroRange && Math.abs(enemyAxieModel.position.x - playerPos.x) < 3.5) {
            let score = 250 - dist * 5;
            const eHP = enemyAxie ? enemyAxie.health / enemyAxieMaxHealth : 1;
            if (eHP < 0.3) score += 100;
            if (eHP < 0.15) score += 150;
            candidates.push({ position: enemyAxieModel.position, type: 'enemy_axie', isDead: enemyAxieIsDead, ref: makeEnemyAxieRef(), dist, score, reason: '⚔️ Axie enemigo' });
        }
    }

    const minionsInLane = enemigos.filter(m => !m.isDead && Math.abs(m.group.position.x) < 3.0).length;
    if (minionsInLane === 0) {
        for (const tower of aliveEnemyTowers) {
            const dist = playerPos.distanceTo(tower.position);
            if (dist >= 25) continue;
            let score = 80 + (25 - dist) * 2;
            if (enemiesAlive === 0) score += 150;
            else if (hasAdvantage) score += 60;
            const tHP = tower.health / tower.maxHealth;
            if (tHP < 0.3) score += 60;
            if (hpPct < 0.4 && dist < 7) score -= 100;
            candidates.push({ position: tower.position, type: 'tower', isDead: tower.isDead, ref: tower, dist, score, reason: '🗼 Torre' });
        }
    }

    for (const myTower of myTowers) {
        for (const enemy of enemigos) {
            if (enemy.isDead) continue;
            if (enemy.group.position.distanceTo(myTower.position) < 5.5) {
                const d = playerPos.distanceTo(enemy.group.position);
                if (d < 16) candidates.push({ position: enemy.group.position, type: 'defend', isDead: enemy.isDead, ref: enemy, dist: d, score: 250, reason: '🛡️ Defensa' });
            }
        }
        if (enemyAxieModel && !enemyAxieIsDead && enemyAxieModel.position.distanceTo(myTower.position) < 6.5) {
            const d = playerPos.distanceTo(enemyAxieModel.position);
            if (d < 16) candidates.push({ position: enemyAxieModel.position, type: 'defend_axie', isDead: enemyAxieIsDead, ref: makeEnemyAxieRef(), dist: d, score: 260, reason: '🛡️ Defensa Axie' });
        }
    }

    if (nexusEnemigo && !nexusEnemigo.isDead && aliveEnemyTowers.length === 0 && minionsInLane === 0) {
        const dist = playerPos.distanceTo(nexusEnemigo.position);
        if (dist < 30) {
            let score = 120 + (30 - dist) * 2;
            if (enemiesAlive === 0) score += 100;
            candidates.push({ position: nexusEnemigo.position, type: 'nexus', isDead: nexusEnemigo.isDead, ref: nexusEnemigo, dist, score, reason: '💎 Nexo' });
        }
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].ref;
}

function updatePlayerAsAI(delta) {
    if (!isAITrainingMode || !playerModel || isPlayerDead || gameFinished) return;
    if (!playerSpawned) return;
    
    if (playerAIPotionCooldown > 0) playerAIPotionCooldown -= delta;
    const hpPctAI = playerHealth / playerMaxHealth;
    if (hpPctAI < CONFIG.AXIE_POTION_USE_THRESHOLD && playerAIPotionCount > 0 && playerAIPotionCooldown <= 0) {
        playerAIPotionCount--;
        playerAIPotionCooldown = PLAYER_AI_POTION_COOLDOWN;
        playerHealth = Math.min(playerMaxHealth, playerHealth + CONFIG.AXIE_POTION_HEAL);
        updatePlayerHUD();
        console.log(`💊 Jugador-IA usó poción (+${CONFIG.AXIE_POTION_HEAL} HP) | HP: ${Math.floor(playerHealth)}/${playerMaxHealth} | Pociones: ${playerAIPotionCount}`);
    }
    
    if (playerAIShopCooldown > 0) {
        playerAIShopCooldown -= delta;
        if (playerAIShopCooldown < 0) playerAIShopCooldown = 0;
    }
    
    if (playerAIRetreatCooldown > 0) playerAIRetreatCooldown -= delta;
    if (playerAIRetreatTimer > 0) playerAIRetreatTimer -= delta;

    const timeSinceDamage = gameTime - playerAILastDamageTime;
    const hasRecentDamage = timeSinceDamage < PLAYER_AI_DAMAGE_MEMORY;
    const nearShootingTower = towers.some(t => 
        !t.isDead && t.isEnemy && 
        playerModel.position.distanceTo(t.position) < (t.range + 0.5)
    );
    
    if (hasRecentDamage && nearShootingTower && !playerAIIsRetreating && playerAIRetreatCooldown <= 0) {
        playerAIIsRetreating = true;
        playerAIRetreatTimer = CONFIG.AXIE_RETREAT_MIN_TIME;
        console.log('🚨 Jugador-IA retrocede fuera del rango de torre');
    }
    
    if (playerAIIsRetreating) {
        const mustKeepRetreating = playerAIRetreatTimer > 0;
        const shootingTowers = towers.filter(t => !t.isDead && t.isEnemy);
        let nearestTower = null;
        let nearestTowerDist = Infinity;
        for (const t of shootingTowers) {
            const d = playerModel.position.distanceTo(t.position);
            if (d < nearestTowerDist) { nearestTowerDist = d; nearestTower = t; }
        }
        
        if (nearestTower) {
            const safeDist = nearestTower.range + CONFIG.AXIE_RETREAT_SAFE_DISTANCE;
            const dx = smoothPlayerPos.x - nearestTower.position.x;
            const dz = smoothPlayerPos.z - nearestTower.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist < safeDist || mustKeepRetreating) {
                const targetX = nearestTower.position.x + (dx / (dist || 1)) * safeDist;
                const targetZ = nearestTower.position.z + (dz / (dist || 1)) * safeDist;
                const rdx = targetX - smoothPlayerPos.x;
                const rdz = targetZ - smoothPlayerPos.z;
                const rdist = Math.sqrt(rdx * rdx + rdz * rdz);
                
                if (rdist > 0.15) {
                    const ms = playerSpeed * 1.3 * playerAIBonuses.speedMultiplier * delta;
                    smoothPlayerPos.x += (rdx / rdist) * ms;
                    smoothPlayerPos.z += (rdz / rdist) * ms;
                    smoothPlayerPos.y = GROUND_Y;
                    smoothPlayerPos.x = Math.max(-17, Math.min(17, smoothPlayerPos.x));
                    smoothPlayerPos.z = Math.max(-26, Math.min(26, smoothPlayerPos.z));
                    
                    if (currentAnim !== 'walk' && animWalk) {
                        if (animIdle) animIdle.stop();
                        animWalk.play();
                        currentAnim = 'walk';
                    }
                    
                    const angle = Math.atan2(rdx, rdz);
                    let diff = angle - playerModel.rotation.y;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    playerModel.rotation.y += diff * Math.min(1, 6 * delta);
                } else if (!mustKeepRetreating) {
                    playerAIIsRetreating = false;
                    playerAIRetreatCooldown = CONFIG.AXIE_RETREAT_COOLDOWN;
                    console.log('✅ Jugador-IA fuera del rango de torre');
                }
            } else if (!mustKeepRetreating) {
                playerAIIsRetreating = false;
                playerAIRetreatCooldown = CONFIG.AXIE_RETREAT_COOLDOWN;
                console.log('✅ Jugador-IA fuera del rango de torre');
            }
        } else if (!mustKeepRetreating) {
            playerAIIsRetreating = false;
            playerAIRetreatCooldown = CONFIG.AXIE_RETREAT_COOLDOWN;
        }
        
        playerModel.position.x = smoothPlayerPos.x;
        playerModel.position.z = smoothPlayerPos.z;
        playerModel.position.y = GROUND_Y;
        return;
    }
    
    playerAITargetTimer -= delta;
    
    const timeSinceDamageShopAI = gameTime - playerAILastDamageTime;
    const underAttackAI = timeSinceDamageShopAI < CONFIG.AXIE_SHOP_DAMAGE_MEMORY;
    const lowHPAI = hpPctAI < CONFIG.AXIE_SHOP_HP_MIN;
    
    const canUseShop = shopAliada && playerAIShopCooldown <= 0 && playerAIShopUses < PLAYER_AI_SHOP_MAX_USES;
    const hasItemsToBuyAI = Object.entries(ENEMY_AXIE_ITEM_CATALOG).some(([id, item]) => {
        const stack = playerAIItems[id] || 0;
        return stack < item.maxStack && playerAIGold >= item.cost;
    });
    const hasGoldForPotionsAI = playerAIGold >= CONFIG.AXIE_POTION_BUY_THRESHOLD && playerAIPotionCount < CONFIG.AXIE_MAX_POTIONS;
    const hasMinGoldAI = playerAIGold >= 30;
    
    if (hasMinGoldAI && !underAttackAI && !lowHPAI && (hasItemsToBuyAI || hasGoldForPotionsAI) && canUseShop && (!playerAITarget || playerAITarget.type !== 'shop_run')) {
        const dts = playerModel.position.distanceTo(shopAliada.group.position);
        if (dts < 40) {
            const shopPos = shopAliada.group.position.clone();
            shopPos.x = Math.max(-17, Math.min(17, shopPos.x));
            shopPos.z = Math.max(-26, Math.min(26, shopPos.z));
            playerAITarget = { type: 'shop_run', position: shopPos, ref: shopAliada, isShopRun: true };
            playerAITargetTimer = 1.5;
        }
    }
    if (!playerAITarget || playerAITarget.isDead || playerAITargetTimer <= 0) {
        playerAITarget = findBestPlayerAITarget();
        playerAITargetTimer = 0.5;
    }
    if (!playerAITarget) {
        if (currentAnim !== 'idle' && animIdle) {
            if (animWalk) animWalk.stop();
            animIdle.play();
            currentAnim = 'idle';
        }
        return;
    }
    if (playerAITarget.isShopRun) {
        const timeSinceDamageInShopAI = gameTime - playerAILastDamageTime;
        const underAttackInShopAI = timeSinceDamageInShopAI < CONFIG.AXIE_SHOP_CANCEL_DAMAGE_MEMORY;
        const hpPctInShopAI = playerHealth / playerMaxHealth;
        
        const nearbyEnemyMinionAI = enemigos.find(m => !m.isDead && playerModel.position.distanceTo(m.group.position) < CONFIG.AXIE_SHOP_ENEMY_NEARBY_RADIUS);
        const nearbyEnemyAxie = enemyAxieModel && !enemyAxieIsDead && playerModel.position.distanceTo(enemyAxieModel.position) < CONFIG.AXIE_SHOP_ENEMY_NEARBY_RADIUS;
        
        if (underAttackInShopAI || hpPctInShopAI < CONFIG.AXIE_SHOP_CANCEL_HP || nearbyEnemyMinionAI || nearbyEnemyAxie) {
            playerAIShopCooldown = 5.0;
            playerAIIsShopping = false;
            playerAITarget = null;
            console.log('⚠️ Jugador-IA cancela ida a tienda');
        } else {
            const shopPos = playerAITarget.position;
            const dx = shopPos.x - playerModel.position.x;
            const dz = shopPos.z - playerModel.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const shopReachDist = 2.0;
            if (dist > shopReachDist) {
                const ms = playerSpeed * playerAIBonuses.speedMultiplier * delta;
                smoothPlayerPos.x += (dx / dist) * ms;
                smoothPlayerPos.z += (dz / dist) * ms;
                smoothPlayerPos.y = GROUND_Y;
                smoothPlayerPos.x = Math.max(-17, Math.min(17, smoothPlayerPos.x));
                smoothPlayerPos.z = Math.max(-26, Math.min(26, smoothPlayerPos.z));
                if (currentAnim !== 'walk' && animWalk) {
                    if (animIdle) animIdle.stop();
                    animWalk.play();
                    currentAnim = 'walk';
                }
                const angle = Math.atan2(dx, dz);
                let diff = angle - playerModel.rotation.y;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                playerModel.rotation.y += diff * Math.min(1, 6 * delta);
            } else {
                if (!playerAIIsShopping) {
                    const canBuySomethingAI = Object.entries(ENEMY_AXIE_ITEM_CATALOG).some(([id, item]) => {
                        const stack = playerAIItems[id] || 0;
                        return stack < item.maxStack && playerAIGold >= item.cost;
                    }) || (playerAIGold >= CONFIG.AXIE_POTION_BUY_THRESHOLD && playerAIPotionCount < CONFIG.AXIE_MAX_POTIONS);
                    
                    if (canBuySomethingAI) {
                        playerAIIsShopping = true;
                        playerAIShopUses++;
                        playerAIShopCooldown = PLAYER_AI_SHOP_COOLDOWN;
                        buyPlayerAIItems();
                        console.log('🛒 Jugador-IA compró items');
                        playerAIShopInteractionTimer = 1.0;
                    } else {
                        playerAIShopCooldown = 5.0;
                        playerAIShopInteractionTimer = 0;
                        playerAIIsShopping = false;
                        console.log('⚠️ Jugador-IA no puede comprar, volviendo al combate');
                    }
                }
            }
            if (playerAIShopInteractionTimer > 0) {
                playerAIShopInteractionTimer -= delta;
                if (playerAIShopInteractionTimer <= 0) playerAIIsShopping = false;
            }
        }
        playerModel.position.x = smoothPlayerPos.x;
        playerModel.position.z = smoothPlayerPos.z;
        playerModel.position.y = GROUND_Y;
        return;
    }
    let targetPos = null;
    if (playerAITarget.position) targetPos = playerAITarget.position;
    else if (playerAITarget.group && playerAITarget.group.position) targetPos = playerAITarget.group.position;
    if (!targetPos) { playerAITarget = null; playerAITargetTimer = 0; return; }
    const dx = targetPos.x - playerModel.position.x;
    const dz = targetPos.z - playerModel.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 35) { playerAITarget = null; playerAITargetTimer = 0; return; }
    const dynamicRange = attackRange + playerAIBonuses.rangeBonus;
    if (dist > dynamicRange * 0.9) {
        const ms = playerSpeed * playerAIBonuses.speedMultiplier * delta;
        smoothPlayerPos.x += (dx / dist) * ms;
        smoothPlayerPos.z += (dz / dist) * ms;
        smoothPlayerPos.y = GROUND_Y;
        smoothPlayerPos.x = Math.max(-17, Math.min(17, smoothPlayerPos.x));
        smoothPlayerPos.z = Math.max(-26, Math.min(26, smoothPlayerPos.z));
        if (currentAnim !== 'walk' && animWalk) {
            if (animIdle) animIdle.stop();
            animWalk.play();
            currentAnim = 'walk';
        }
        const angle = Math.atan2(dx, dz);
        let diff = angle - playerModel.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        playerModel.rotation.y += diff * Math.min(1, 6 * delta);
    } else {
        if (currentAnim !== 'idle' && animIdle) {
            if (animWalk) animWalk.stop();
            animIdle.play();
            currentAnim = 'idle';
        }
        playerModel.rotation.y = Math.atan2(dx, dz);
        attackCooldown -= delta * playerAIBonuses.attackSpeedMultiplier;
        if (attackCooldown <= 0 && !isAttacking) {
            let vt = playerAITarget;
            if (!vt.group && vt.ref && vt.ref.group) vt = vt.ref;
            if (vt && vt.group) {
                const sp = playerModel.position.clone();
                sp.y = 0.5;
                let dmg = Math.round(attackDamage * playerAIBonuses.damageMultiplier);
                if (Math.random() < playerAIBonuses.critChance) dmg = Math.round(dmg * 2);
                dispararAtaqueJugador(vt, sp, dmg);
                attackCooldown = attackSpeed;
                isAttacking = true;
                setTimeout(() => { isAttacking = false; }, 50);
            }
        }
    }
    playerModel.position.x = smoothPlayerPos.x;
    playerModel.position.z = smoothPlayerPos.z;
    playerModel.position.y = GROUND_Y;
}

let isMouseDownRight = false;
let isMouseDownLeft = false;
let isDragging = false;
let mouseDownPos = { x: 0, y: 0 };

function isEnemyForPlayer(entity) {
    if (!entity) return false;
    if (entity.type === 'shop') return false;
    if (entity.type === 'enemy_axie') return true;
    if (entity.type === 'minion' && entity.isEnemy === true) return true;
    if (entity.type === 'tower' && entity.isEnemy === true) return true;
    if (entity.type === 'nexus' && entity.isEnemy === true) return true;
    return false;
}

function getEntityFromClick(event) {
    if (!renderer) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    const mouseVec = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouseVec, camera);

    const selectables = [];

    if (enemyAxieModel && !enemyAxieIsDead) {
        enemyAxieModel.traverse((child) => {
            if (child.isMesh) { child.userData.targetRef = makeEnemyAxieRef(); selectables.push(child); }
        });
    }
    for (const em of enemigos) {
        if (em.isDead) continue;
        em.group.traverse((child) => {
            if (child.isMesh) { child.userData.targetRef = em; selectables.push(child); }
        });
    }
    for (const am of aliados) {
        if (am.isDead) continue;
        am.group.traverse((child) => {
            if (child.isMesh) { child.userData.targetRef = am; selectables.push(child); }
        });
    }
    for (const t of towers) {
        if (t.isDead) continue;
        t.group.traverse((child) => {
            if (child.isMesh) { child.userData.targetRef = t; selectables.push(child); }
        });
    }
    if (nexusEnemigo && !nexusEnemigo.isDead) {
        nexusEnemigo.group.traverse((child) => {
            if (child.isMesh) { child.userData.targetRef = nexusEnemigo; selectables.push(child); }
        });
    }
    if (nexusAliado && !nexusAliado.isDead) {
        nexusAliado.group.traverse((child) => {
            if (child.isMesh) { child.userData.targetRef = nexusAliado; selectables.push(child); }
        });
    }

    if (shopAliada) {
        shopAliada.group.traverse((child) => {
            if (child.isMesh) {
                child.userData.targetRef = {
                    type: 'shop', isEnemy: false, ref: shopAliada,
                    group: shopAliada.group, isDead: false, health: 999999, maxHealth: 999999
                };
                selectables.push(child);
            }
        });
    }
    if (shopEnemiga) {
        shopEnemiga.group.traverse((child) => {
            if (child.isMesh) {
                child.userData.targetRef = {
                    type: 'shop', isEnemy: true, ref: shopEnemiga,
                    group: shopEnemiga.group, isDead: false, health: 999999, maxHealth: 999999
                };
                selectables.push(child);
            }
        });
    }

    const intersects = ray.intersectObjects(selectables);
    if (intersects.length > 0) {
        let parent = intersects[0].object;
        while (parent) {
            if (parent.userData && parent.userData.targetRef) return parent.userData.targetRef;
            parent = parent.parent;
        }
    }
    return null;
}

renderer.domElement.addEventListener('mousedown', (e) => {
    if (isAITrainingMode) return;
    if (e.button === 2) {
        isMouseDownRight = true;
        isDragging = false;
        mouseDownPos.x = e.clientX;
        mouseDownPos.y = e.clientY;
    } else if (e.button === 0) {
        isMouseDownLeft = true;
    }
});

renderer.domElement.addEventListener('mousemove', (e) => {
    if (isAITrainingMode) return;
    if (isMouseDownRight) {
        const dx = e.clientX - mouseDownPos.x;
        const dy = e.clientY - mouseDownPos.y;
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) isDragging = true;
    }
});

renderer.domElement.addEventListener('mouseup', (e) => {
    if (isAITrainingMode) return;
    if (!playerModel || isPlayerDead) return;

    if (e.button === 0 && isMouseDownLeft) {
        isMouseDownLeft = false;
        const target = getEntityFromClick(e);
        
        if (target && !target.isDead) {
            window.currentTarget = target;
            window.showTarget(target);
            
            const targetPos = target.group ? target.group.position : target.position;
            if (targetPos) {
                const isEnemy = isEnemyForPlayer(target);
                const isShop = target.type === 'shop';
                // Para tiendas, usamos una distancia de parada similar a las torres aliadas
                // Para enemigos, usamos el rango de ataque
                const stopDistance = isShop ? 2.0 : (isEnemy ? Math.max(1.5, attackRange - 0.5) : 2.0);
                const dx = targetPos.x - playerModel.position.x;
                const dz = targetPos.z - playerModel.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist > stopDistance) {
                    const ratio = stopDistance / dist;
                    const targetX = playerModel.position.x + dx * (1 - ratio);
                    const targetZ = playerModel.position.z + dz * (1 - ratio);
                    targetPosition = new THREE.Vector3(targetX, GROUND_Y, targetZ);
                    smoothTargetPos.copy(targetPosition);
                    isMovingToTarget = true;
                    isAutoMovingToTarget = true;
                }
            }
        } else {
            window.currentTarget = null;
            targetUI.style.display = 'none';
        }
    }

    if (e.button === 2 && isMouseDownRight) {
        isMouseDownRight = false;
        if (shopOpen && !isDragging) {
            closeShop();
            isDragging = false;
            return;
        }
        if (!isDragging) {
            const point = getGroundIntersection(e);
            if (point) {
                targetPosition = point.clone();
                smoothTargetPos.copy(targetPosition);
                isMovingToTarget = true;
                isAutoMovingToTarget = false;
                window.currentTarget = null;
                targetUI.style.display = 'none';
            }
        }
        isDragging = false;
    }
});

function showPauseMenu() {
    if (gamePaused) return;
    if (gameFinished && !isAITrainingMode) return;
    gamePaused = true;
    pauseMenu = document.createElement('div');
    pauseMenu.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:1500;color:#fff;font-family:Arial;`;
    const totalMin = Math.floor((Date.now() - aiTrainingStartTime) / 60000);
    pauseMenu.innerHTML = `
        <div style="font-size:56px;font-weight:bold;color:#88ddff;margin-bottom:20px;font-family:'Arial Black';">⏸️ ${isAITrainingMode ? 'ENTRENAMIENTO' : 'PAUSA'}</div>
        ${isAITrainingMode ? `<div style="color:#aa88ff;font-family:monospace;font-size:16px;margin-bottom:30px;text-align:center;line-height:1.8;">🤖 Partidas: <b>${aiTrainingMatches}</b><br>⏱️ Sesión: <b>${totalMin} min</b></div>` : ''}
        <div style="margin: 20px 0; text-align: center;">
            <div style="margin-bottom: 10px; font-size: 18px; color: #88ddff;">🔊 AUDIO</div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span>Música:</span>
                    <input type="range" id="music-volume" min="0" max="1" step="0.01" value="${audio.musicVolume}" style="width: 100px;">
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span>EFX:</span>
                    <input type="range" id="sfx-volume" min="0" max="1" step="0.01" value="${audio.sfxVolume}" style="width: 100px;">
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span>Master:</span>
                    <input type="range" id="master-volume" min="0" max="1" step="0.01" value="${audio.masterVolume}" style="width: 100px;">
                </div>
            </div>
            <div style="margin-top: 10px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button id="btn-mute-music" style="padding:8px 16px;font-size:14px;background:${audio.muted ? '#444' : '#666'};color:#fff;border:none;border-radius:4px;cursor:pointer;">🔇 Música</button>
                <button id="btn-mute-sfx" style="padding:8px 16px;font-size:14px;background:${audio.muted ? '#444' : '#666'};color:#fff;border:none;border-radius:4px;cursor:pointer;">🔇 Efectos</button>
                <button id="btn-mute-all" style="padding:8px 16px;font-size:14px;background:${audio.muted ? '#444' : '#666'};color:#fff;border:none;border-radius:4px;cursor:pointer;">🔇 Todo</button>
            </div>
        </div>
        <button id="btn-exit" style="padding:16px 48px;font-size:24px;font-weight:bold;background:linear-gradient(135deg,#ff4444,#cc2222);color:#fff;border:none;border-radius:12px;cursor:pointer;">${isAITrainingMode ? '🚪 Salir al Menú' : '🚪 Volver al Inicio'}</button>
        <button id="btn-resume" style="margin-top:15px;padding:12px 36px;font-size:18px;background:rgba(255,255,255,0.1);color:#88aaff;border:2px solid rgba(136,170,255,0.3);border-radius:12px;cursor:pointer;">↩️ Reanudar</button>
    `;
    document.body.appendChild(pauseMenu);
    document.getElementById('btn-exit').onclick = () => isAITrainingMode ? exitAITrainingMode() : abandonGame();
    document.getElementById('btn-resume').onclick = () => hidePauseMenu();
    
    // Audio controls
    document.getElementById('music-volume').addEventListener('input', (e) => {
        audio.setMusicVolume(parseFloat(e.target.value));
    });
    document.getElementById('sfx-volume').addEventListener('input', (e) => {
        audio.setSfxVolume(parseFloat(e.target.value));
    });
    document.getElementById('master-volume').addEventListener('input', (e) => {
        audio.setMasterVolume(parseFloat(e.target.value));
    });
    document.getElementById('btn-mute-music').addEventListener('click', () => {
        const isMuted = audio.muted; // This is master mute, but we want to toggle music mute specifically
        // Since AudioManager doesn't have separate mute for music/sfx, we'll implement it via volume
        audio.setMusicVolume(audio.muted ? 0.5 : 0); // Toggle between 0 and last known value
        // Better approach: store previous music volume
        if (!audio._prevMusicVolume) audio._prevMusicVolume = audio.musicVolume;
        audio.setMusicVolume(audio.muted ? audio._prevMusicVolume : 0);
        e.target.textContent = audio.muted ? '🔇 Música' : '🔊 Música';
    });
    document.getElementById('btn-mute-sfx').addEventListener('click', () => {
        if (!audio._prevSfxVolume) audio._prevSfxVolume = audio.sfxVolume;
        audio.setSfxVolume(audio.muted ? audio._prevSfxVolume : 0);
        e.target.textContent = audio.muted ? '🔇 Efectos' : '🔊 Efectos';
    });
    document.getElementById('btn-mute-all').addEventListener('click', () => {
        audio.setMuted(!audio.muted);
        e.target.textContent = audio.muted ? '🔇 Todo' : '🔊 Todo';
    });
}

function hidePauseMenu() {
    gamePaused = false;
    lastTime = performance.now();
    if (pauseMenu) { pauseMenu.remove(); pauseMenu = null; }
}

function abandonGame() {
    // Detener la música de partida al volver al menú
    audio.stopMusic();
    saveBrains();
    isAITrainingMode = false;
    aiTrainingIsRestarting = false;
    aiTrainingAutoRestartTimer = 0;
    playerAITarget = null;
    resetDynamicCamera();
    const banner = document.getElementById('ai-transition-banner');
    if (banner) banner.remove();
    const hud = document.getElementById('ai-training-hud');
    if (hud) hud.remove();
    gameFinished = true;
    gamePaused = false;
    if (pauseMenu) { pauseMenu.remove(); pauseMenu = null; }
    if (victoryScreen) { victoryScreen.remove(); victoryScreen = null; }
    if (defeatScreen) { defeatScreen.remove(); defeatScreen = null; }
    if (playerHUD) { playerHUD.remove(); playerHUD = null; }
    if (hudWrapper) { hudWrapper.remove(); hudWrapper = null; }
    if (potionHUD) { potionHUD.remove(); potionHUD = null; }
    if (itemHUD) { itemHUD.remove(); itemHUD = null; }
    if (abilityHUD) { abilityHUD.remove(); abilityHUD = null; }
    enemyAxieDebugHUD.style.display = 'none';
    goldDiv.style.display = 'none';
    for (const m of aliados) if (m.group && m.group.parent) scene.remove(m.group);
    for (const m of enemigos) if (m.group && m.group.parent) scene.remove(m.group);
    aliados.length = 0; enemigos.length = 0;
    spawnQueue.length = 0;
    spawnQueueTimer = 0;
    for (const p of playerProjectiles) if (p.mesh && p.mesh.parent) scene.remove(p.mesh);
    playerProjectiles.length = 0;
    for (const t of towers) if (t.group && t.group.parent) scene.remove(t.group);
    towers.length = 0;
    if (nexusAliado) { nexusAliado.isDead = false; nexusAliado.health = nexusAliado.maxHealth; nexusAliado.group.visible = true; nexusAliado.updateHealthBar(); }
    if (nexusEnemigo) { nexusEnemigo.isDead = false; nexusEnemigo.health = nexusEnemigo.maxHealth; nexusEnemigo.group.visible = true; nexusEnemigo.updateHealthBar(); }
    createTower(-2.5, -18, false, 1);
    createTower(-2.5, -6, false, 2);
    createTower(3.13, 17.62, true, 1);
    createTower(3.11, 5.98, true, 2);
    gameStarted = false;
    startTimer = CONFIG.SPAWN_DELAY;
    waveNumber = 1;
    gameTime = 0;
    isFirstWave = true;
    firstWaveTimer = 0;
    gameFinished = false;
    isPlayerDead = false;
    playerHealth = playerMaxHealth;
    playerMana = playerMaxMana;
    playerRespawnTimer = 0;
    playerDeathCount = 0;
    playerGold = 0;
    playerKillStreak = 0;
    playerFirstBlood = false;
    playerItemSlots = [null, null, null, null, null, null];
    potionHPCount = 0;
    potionMPCount = 0;
    potionUseCooldown = 0;
    playerAIIsRetreating = false;
    playerAIRetreatTimer = 0;
    playerAIRetreatCooldown = 0;
    playerAILastDamageTime = -999;
    enemyAxieSpawned = false;
    enemyAxieShopInteractionTimer = 0;
    playerAIShopInteractionTimer = 0;
    shopAutoOpenCooldown = 0;
    playerSpawned = false;
    enemyAxiePotionCount = 0;
    playerAIPotionCount = 0;
    enemyAxiePotionCooldown = 0;
    playerAIPotionCooldown = 0;
    enemyAxieRetreatCooldown = 0;
    resetEnemyAxie();
    stopGameLoop();
    if (timerDiv) timerDiv.style.display = 'none';
    if (fpsDiv) fpsDiv.style.display = 'none';
    if (waveDiv) waveDiv.style.display = 'none';
    if (targetUI) targetUI.style.display = 'none';
    for (const t of towers) {
        for (const p of t.projectiles) { p.active = false; if (p.mesh && p.mesh.parent) scene.remove(p.mesh); }
        t.projectiles = [];
    }
    if (renderer) renderer.domElement.style.display = 'none';
    showMainMenu();
}

function exitAITrainingMode() {
    const stats = JSON.parse(localStorage.getItem('axie_ai_training_stats') || '{"matches":0,"totalTime":0}');
    stats.matches = aiTrainingMatches;
    stats.totalTime = (stats.totalTime || 0) + Math.floor((Date.now() - aiTrainingStartTime) / 1000);
    localStorage.setItem('axie_ai_training_stats', JSON.stringify(stats));
    saveBrains();
    abandonGame();
}

function handleAITrainingMatchEnd(result) {
    if (aiTrainingIsRestarting) return;
    aiTrainingIsRestarting = true;
    aiTrainingMatches++;
    console.log(`🤖 Partida #${aiTrainingMatches}: ${result.toUpperCase()}`);
    const stats = JSON.parse(localStorage.getItem('axie_ai_training_stats') || '{"matches":0,"totalTime":0}');
    stats.matches = aiTrainingMatches;
    stats.totalTime = (stats.totalTime || 0) + Math.floor((Date.now() - aiTrainingStartTime) / 1000);
    localStorage.setItem('axie_ai_training_stats', JSON.stringify(stats));
    saveBrains();
    mostrarBannerTransicion(result);
    aiTrainingAutoRestartTimer = 3.0;
}

function mostrarBannerTransicion(result) {
    const old = document.getElementById('ai-transition-banner');
    if (old) old.remove();
    const banner = document.createElement('div');
    banner.id = 'ai-transition-banner';
    banner.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:3000;padding:30px 60px;background:rgba(0,0,0,0.9);border:3px solid ${result === 'victory' ? '#44ff88' : '#ff4444'};border-radius:16px;font-family:'Arial Black';font-size:32px;color:${result === 'victory' ? '#44ff88' : '#ff4444'};text-align:center;pointer-events:none;`;
    banner.innerHTML = `
        ${result === 'victory' ? '🏆 ALIADOS GANARON' : '💀 ENEMIGOS GANARON'}<br>
        <span style="font-size:18px;color:#88aaff;">Reiniciando en 3s...</span><br>
        <span style="font-size:14px;color:#aaa;">Partidas: ${aiTrainingMatches}</span>
    `;
    document.body.appendChild(banner);
}

function updateHUDEntrenamiento() {
    let hud = document.getElementById('ai-training-hud');
    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'ai-training-hud';
        hud.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:2000;padding:10px 16px;background:rgba(102,68,255,0.85);color:#fff;border:2px solid rgba(170,140,255,0.8);border-radius:10px;font-family:monospace;font-size:13px;font-weight:bold;pointer-events:none;line-height:1.6;text-align:center;`;
        document.body.appendChild(hud);
    }
    const totalMin = Math.floor((Date.now() - aiTrainingStartTime) / 60000);
    const camE = { player: '🦊', enemy: '🤖', idle: '🎯' }[dynamicCameraMode] || '🎥';
    const camT = { player: 'Aliado', enemy: 'Enemigo', idle: 'Centro' }[dynamicCameraMode] || 'Auto';
    hud.innerHTML = `
        🤖 <b>ENTRENAMIENTO IA</b> · 🎮 #${aiTrainingMatches + 1} · ⏱️ ${totalMin} min<br>
        ${camE} Cámara: <b>${camT}</b> · Pulsa ESC para salir
    `;
}

function showVictoryScreen() {
    if (gameFinished) return;
    gameFinished = true;
    if (isAITrainingMode) { handleAITrainingMatchEnd('victory'); return; }
    // Sonido de victoria
    audio.play('victory', { volume: 0.8 });
    if (victoryScreen) victoryScreen.remove();
    victoryScreen = document.createElement('div');
    victoryScreen.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:1000;`;
    victoryScreen.innerHTML = `
        <div style="font-size:80px;color:#ffdd44;font-family:'Arial Black';">🏆 GANASTE 🏆</div>
        <div style="font-size:28px;color:#88ddff;margin-top:20px;">¡Has destruido el Nexo Enemigo!</div>
        <button style="margin-top:40px;padding:16px 48px;font-size:24px;background:linear-gradient(135deg,#44ff88,#22aa66);color:#fff;border:none;border-radius:12px;cursor:pointer;" onclick="window.location.reload()">🏠 Ir a Inicio</button>
    `;
    document.body.appendChild(victoryScreen);
}

let menuScreen = null;
let pantallaCarga = null;

function actualizarPantallaCarga(progreso, texto) {
    if (!pantallaCarga) return;
    const barra = pantallaCarga.querySelector('#loading-progress-bar');
    const textoEl = pantallaCarga.querySelector('#loading-text');
    if (barra) barra.style.width = `${progreso}%`;
    if (textoEl) textoEl.textContent = texto || `Cargando... ${progreso}%`;
}

function mostrarPantallaCarga() {
    if (pantallaCarga) return;
    pantallaCarga = document.createElement('div');
    pantallaCarga.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#0a0a1a,#1a1a3a);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:5000;font-family:Arial;`;
    pantallaCarga.innerHTML = `
        <div style="font-size:56px;font-weight:bold;color:#44ff88;margin-bottom:60px;letter-spacing:4px;">⚔️ AXIE LEGENDS</div>
        <div style="font-size:18px;color:#88aaff;margin-bottom:30px;">Cargando terreno de batalla...</div>
        <div style="width:400px;height:14px;background:rgba(255,255,255,0.1);border-radius:8px;overflow:hidden;border:2px solid rgba(68,255,136,0.4);">
            <div id="loading-progress-bar" style="width:0%;height:100%;background:linear-gradient(90deg,#44ff88,#22aa66);transition:width 0.3s;"></div>
        </div>
        <div id="loading-text" style="font-size:14px;color:#aaa;margin-top:20px;">Cargando... 0%</div>
    `;
    document.body.appendChild(pantallaCarga);
}

function ocultarPantallaCarga() {
    if (pantallaCarga) { pantallaCarga.remove(); pantallaCarga = null; }
}

function showMainMenu() {
    if (renderer) renderer.domElement.style.display = 'none';
    if (timerDiv) timerDiv.style.display = 'none';
    if (fpsDiv) fpsDiv.style.display = 'none';
    if (waveDiv) waveDiv.style.display = 'none';
    if (targetUI) targetUI.style.display = 'none';
    if (goldDiv) goldDiv.style.display = 'none';
    enemyAxieDebugHUD.style.display = 'none';
    if (menuScreen) { menuScreen.destroy(); menuScreen = null; }
    menuScreen = new MenuScreen();
    menuScreen.show(
        (axieId, mode) => { selectedAxieId = axieId; startGame(axieId); },
        (axieId) => { selectedAxieId = axieId; }
    );
    setTimeout(() => {
        if (document.getElementById('btn-ai-training')) return;
        const btn = document.createElement('button');
        btn.id = 'btn-ai-training';
        btn.innerHTML = '🤖 Entrenar IA (Auto)<br><span style="font-size:11px;opacity:0.7;">IA vs IA · rondas infinitas</span>';
        btn.style.cssText = `position:fixed;bottom:30px;right:30px;z-index:10000;padding:14px 22px;background:linear-gradient(135deg,#6644ff,#4422aa);color:#fff;border:2px solid rgba(170,140,255,0.6);border-radius:12px;font-family:Arial;font-size:14px;font-weight:bold;cursor:pointer;text-align:center;line-height:1.3;`;
        btn.onclick = () => {
            btn.remove();
            const info = document.getElementById('ai-training-info');
            if (info) info.remove();
            startAITrainingMode();
        };
        document.body.appendChild(btn);
        const stats = JSON.parse(localStorage.getItem('axie_ai_training_stats') || '{"matches":0,"totalTime":0}');
        if (stats.matches > 0) {
            const info = document.createElement('div');
            info.id = 'ai-training-info';
            info.style.cssText = `position:fixed;bottom:110px;right:30px;z-index:10000;padding:8px 14px;background:rgba(0,0,0,0.7);color:#aa88ff;border:1px solid rgba(170,140,255,0.4);border-radius:8px;font-family:monospace;font-size:11px;text-align:center;line-height:1.5;`;
            const mins = Math.floor(stats.totalTime / 60);
            info.innerHTML = `📊 Entrenamientos: <b>${stats.matches}</b><br>⏱️ Total: ${mins} min`;
            document.body.appendChild(info);
        }
    }, 100);
}

async function startAITrainingMode() {
    isAITrainingMode = true;
    aiTrainingMatches = 0;
    aiTrainingStartTime = Date.now();
    aiTrainingAutoRestartTimer = 0;
    aiTrainingIsRestarting = false;
    const stats = JSON.parse(localStorage.getItem('axie_ai_training_stats') || '{"matches":0,"totalTime":0}');
    aiTrainingMatches = stats.matches || 0;
    const allAxies = getAllAxies();
    const randomAxie = allAxies[Math.floor(Math.random() * allAxies.length)];
    await startAIGame(randomAxie.id);
}

async function startAIGame(axieId) {
    mostrarPantallaCarga();
    actualizarPantallaCarga(5, 'Iniciando entrenamiento...');
    if (menuScreen) { menuScreen.destroy(); menuScreen = null; }
    let loadWaitGuard = 0;
    while (!groundReady || !nexusAliado || !nexusEnemigo || towers.length === 0 || !shopAliada || !shopEnemiga) {
        actualizarPantallaCarga(15, 'Cargando...');
        await new Promise(r => setTimeout(r, 100));
        if (++loadWaitGuard > 150) { console.error('❌ Timeout esperando el escenario'); break; }
    }
    actualizarPantallaCarga(60, 'Cargando Axie...');
    await loadSelectedAxie(axieId);
    playerModel.position.copy(playerSpawnPosition);
    playerModel.position.y = GROUND_Y - 100;
    smoothPlayerPos.copy(playerSpawnPosition);
    smoothPlayerPos.y = GROUND_Y;
    playerModel.visible = false;
    playerSpawned = false;
    gameFinished = false;
    gameStarted = false;
    startTimer = CONFIG.MINION_SPAWN_TIME;
    waveNumber = 1;
    gameTime = 0;
    isFirstWave = true;
    firstWaveTimer = 0;
    isPlayerDead = false;
    playerHealth = playerMaxHealth;
    playerMana = playerMaxMana;
    playerRespawnTimer = 0;
    isMovingToTarget = false;
    targetPosition = null;
    window.currentTarget = null;
    attackCooldown = 0;
    isAttacking = false;
    playerAITarget = null;
    playerAITargetTimer = 0;
    playerAIGold = 0;
    playerAIItems = {};
    playerAIBonuses = { speedMultiplier: 1.0, damageMultiplier: 1.0, attackSpeedMultiplier: 1.0, rangeBonus: 0, critChance: 0 };
    playerAIShopCooldown = 0;
    playerAIShopUses = 0;
    playerAIIsShopping = false;
    playerAIShopInteractionTimer = 0;
    playerAIIsRetreating = false;
    playerAIRetreatTimer = 0;
    playerAIRetreatCooldown = 0;
    playerAILastDamageTime = -999;
    playerAIPotionCount = 0;
    playerAIPotionCooldown = 0;
    playerDeathCount = 0;
    playerSpeed = CONFIG.axieSpeed;
    attackDamage = CONFIG.attackDamage;
    attackRange = CONFIG.attackRange;
    attackSpeed = CONFIG.attackSpeed;
    shopAutoOpenCooldown = 0;
    spawnQueue.length = 0;
    spawnQueueTimer = 0;
    factionFocusTarget.ally.target = null;
    factionFocusTarget.ally.count = 0;
    factionFocusTarget.enemy.target = null;
    factionFocusTarget.enemy.count = 0;
    potionHPCount = 0;
    potionMPCount = 0;
    potionUseCooldown = 0;
    for (const m of aliados) if (m.group && m.group.parent) scene.remove(m.group);
    for (const m of enemigos) if (m.group && m.group.parent) scene.remove(m.group);
    aliados.length = 0; enemigos.length = 0;
    for (const p of playerProjectiles) if (p.mesh && p.mesh.parent) scene.remove(p.mesh);
    playerProjectiles.length = 0;
    for (const t of towers) if (t.group && t.group.parent) scene.remove(t.group);
    towers.length = 0;
    if (nexusAliado) { nexusAliado.isDead = false; nexusAliado.health = nexusAliado.maxHealth; nexusAliado.group.visible = true; nexusAliado.updateHealthBar(); }
    if (nexusEnemigo) { nexusEnemigo.isDead = false; nexusEnemigo.health = nexusEnemigo.maxHealth; nexusEnemigo.group.visible = true; nexusEnemigo.updateHealthBar(); }
    createTower(-2.5, -18, false, 1);
    createTower(-2.5, -6, false, 2);
    createTower(3.13, 17.62, true, 1);
    createTower(3.11, 5.98, true, 2);
    resetEnemyAxie();
    inicializarCamaraFija();
    resetDynamicCamera();
    chooseNewDynamicCameraTarget();
    if (!playerHUD) { createPlayerHUD(); updatePlayerHUD(); }
    updatePotionHUD();
    goldDiv.style.display = 'block';
    updatePlayerGoldHUD();
    renderer.domElement.style.display = 'block';
    timerDiv.style.display = 'block';
    fpsDiv.style.display = 'block';
    waveDiv.style.display = 'block';
    camera.position.copy(cameraSmoothPos);
    camera.lookAt(cameraSmoothTarget);
    renderer.render(scene, camera);
    await new Promise(r => requestAnimationFrame(r));
    actualizarPantallaCarga(100, '¡Listo!');
    await new Promise(r => setTimeout(r, 200));
    ocultarPantallaCarga();
    // Iniciar música de fondo
    audio.playMusic("music");
    setTimeout(() => {
        if (gameFinished) return;
        if (playerModel && !playerSpawned) {
            playerSpawned = true;
            playerModel.position.copy(playerSpawnPosition);
            playerModel.position.y = GROUND_Y;
            smoothPlayerPos.copy(playerSpawnPosition);
            smoothPlayerPos.y = GROUND_Y;
            playerModel.visible = true;
            console.log(`🦊 [t=${gameTime.toFixed(2)}s] Axie aliado aparece`);
        }
        if (!enemyAxieSpawned) spawnEnemyAxie();
    }, CONFIG.AXIE_SPAWN_TIME * 1000);
    updateHUDEntrenamiento();
    startGameLoop();
}

async function startGame(axieId) {
    setAxieActual(axieId);
    // Inicializar audio (requiere interacción del usuario - el click en JUGAR ya cuenta)
    audio.init().catch(() => {});
    mostrarPantallaCarga();
    actualizarPantallaCarga(5, 'Iniciando...');
    if (menuScreen) { menuScreen.destroy(); menuScreen = null; }
    isAITrainingMode = false;
    console.log('🎮 Modo: JUGADOR HUMANO');
    let loadWaitGuard = 0;
    while (!groundReady || !nexusAliado || !nexusEnemigo || towers.length === 0 || !shopAliada || !shopEnemiga) {
        actualizarPantallaCarga(15, 'Cargando...');
        await new Promise(r => setTimeout(r, 100));
        if (++loadWaitGuard > 150) { console.error('❌ Timeout esperando el escenario'); break; }
    }
    actualizarPantallaCarga(60, 'Cargando Axie...');
    await loadSelectedAxie(axieId);
    playerModel.position.copy(playerSpawnPosition);
    playerModel.position.y = GROUND_Y - 100;
    smoothPlayerPos.copy(playerSpawnPosition);
    smoothPlayerPos.y = GROUND_Y;
    playerModel.visible = false;
    playerSpawned = false;
    gameFinished = false;
    gameStarted = false;
    startTimer = CONFIG.MINION_SPAWN_TIME;
    waveNumber = 1;
    gameTime = 0;
    isFirstWave = true;
    firstWaveTimer = 0;
    isPlayerDead = false;
    playerHealth = playerMaxHealth;
    playerMana = playerMaxMana;
    playerRespawnTimer = 0;
    resetPlayerEconomy();
    playerDeathCount = 0;
    playerSpeed = CONFIG.axieSpeed;
    attackDamage = CONFIG.attackDamage;
    attackRange = CONFIG.attackRange;
    attackSpeed = CONFIG.attackSpeed;
    shopAutoOpenCooldown = 0;
    spawnQueue.length = 0;
    spawnQueueTimer = 0;
    factionFocusTarget.ally.target = null;
    factionFocusTarget.ally.count = 0;
    factionFocusTarget.enemy.target = null;
    factionFocusTarget.enemy.count = 0;
    for (const m of aliados) if (m.group && m.group.parent) scene.remove(m.group);
    for (const m of enemigos) if (m.group && m.group.parent) scene.remove(m.group);
    aliados.length = 0; enemigos.length = 0;
    resetEnemyAxie();
    inicializarCamaraFija();
    if (!playerHUD) { createPlayerHUD(); updatePlayerHUD(); }
    updateItemHUD();
    updatePotionHUD();
    goldDiv.style.display = 'block';
    updatePlayerGoldHUD();
    renderer.domElement.style.display = 'block';
    timerDiv.style.display = 'block';
    fpsDiv.style.display = 'block';
    waveDiv.style.display = 'block';
    camera.position.copy(cameraSmoothPos);
    camera.lookAt(cameraSmoothTarget);
    renderer.render(scene, camera);
    await new Promise(r => requestAnimationFrame(r));
    actualizarPantallaCarga(100, '¡Listo!');
    await new Promise(r => setTimeout(r, 200));
    ocultarPantallaCarga();
    // Iniciar música de fondo (igual que en modo IA)
    audio.playMusic("music");
    setTimeout(() => {
        if (gameFinished) return;
        if (playerModel && !playerSpawned) {
            playerSpawned = true;
            playerModel.position.copy(playerSpawnPosition);
            playerModel.position.y = GROUND_Y;
            smoothPlayerPos.copy(playerSpawnPosition);
            smoothPlayerPos.y = GROUND_Y;
            playerModel.visible = true;
            console.log(`🦊 [t=${gameTime.toFixed(2)}s] Axie aliado aparece`);
        }
        if (!enemyAxieSpawned) spawnEnemyAxie();
    }, CONFIG.AXIE_SPAWN_TIME * 1000);
    startGameLoop();
}

// ============================================================
// TELETRANSPORTE AL NEXO (tecla B) - tipo recall de LoL
// ============================================================
// Sin canalizacion: es instantaneo. Se pide un minimo de 1.5s entre usos
// para que no se pueda usar como escape en mitad de un intercambio.
let recallCooldown = 0;
const RECALL_COOLDOWN = 1.5;

function teletransporteAlNexo() {
    if (recallCooldown > 0) {
        console.log('⏳ Teletransporte en enfriamiento: ' + recallCooldown.toFixed(1) + 's');
        return;
    }
    if (!playerModel || !smoothPlayerPos) return;

    // Punto de llegada: junto al nexo aliado, desplazado hacia el carril.
    // Se usa la posicion REAL del nexo si existe, con respaldo en el spawn.
    let destinoX = playerSpawnPosition.x;
    let destinoZ = playerSpawnPosition.z;
    if (nexusAliado && nexusAliado.group) {
        destinoX = nexusAliado.group.position.x;
        destinoZ = nexusAliado.group.position.z + 2.2;   // delante del nexo
    }
    destinoX = Math.max(-17, Math.min(17, destinoX));
    destinoZ = Math.max(-26, Math.min(26, destinoZ));

    playerModel.position.set(destinoX, GROUND_Y, destinoZ);
    smoothPlayerPos.set(destinoX, GROUND_Y, destinoZ);
    smoothTargetPos.copy(smoothPlayerPos);
    isMovingToTarget = false;
    isAutoMovingToTarget = false;
    targetPosition = null;

    recallCooldown = RECALL_COOLDOWN;
    console.log('🌀 Teletransporte al nexo -> x=' + destinoX.toFixed(2) + ' z=' + destinoZ.toFixed(2));
}

// ============================================================
// SISTEMA DE HABILIDADES (Q / W / E / R)
// ============================================================
// El catalogo vive en src/config/habilidades.js. Aqui solo esta el MOTOR:
// quien puede usarla, cuanto mana cuesta, cuanto recarga y como se ejecuta
// cada tipo. Anadir una habilidad = tocar el catalogo, no este bloque.

// Recarga restante por habilidad, en segundos.
const cooldownsHabilidad = {};
// Tabla tecla -> id de habilidad, construida desde el catalogo. Asi reasignar
// una tecla es cambiar 'tecla' en el catalogo y nada mas.
const HABILIDADES_POR_TECLA = {};
for (const h of getHabilidades()) HABILIDADES_POR_TECLA[h.tecla.toLowerCase()] = h.id;
// Ondas visuales activas: se expanden y se borran solas.
const ondasActivas = [];
// Huecos del HUD, por id de habilidad.
let habilidadCajas = {};

// Puerta comun: comprueba que se puede actuar y que hay mana. NO descuenta.
// Devuelve false y explica por consola por que no se puede.
function habilidadDisponible(hab) {
    if (!hab) return false;
    if (gamePaused || isAITrainingMode) return false;
    if (!playerSpawned || isPlayerDead || !playerModel) return false;
    if (shopOpen) return false;
    if (hab.tipo !== 'pocion' && gameFinished) return false;
    if ((cooldownsHabilidad[hab.id] || 0) > 0) {
        console.log('⏳ ' + hab.nombre + ' en recarga: ' + cooldownsHabilidad[hab.id].toFixed(1) + 's');
        return false;
    }
    if (hab.mana > 0 && playerMana < hab.mana) {
        console.log('⛔ Mana insuficiente (' + Math.floor(playerMana) + '/' + hab.mana + ')');
        return false;
    }
    return true;
}

// Punto de entrada unico de una tecla de habilidad.
function usarHabilidad(id) {
    const hab = getHabilidad(id);
    if (!hab) return;
    if (!habilidadDisponible(hab)) return;
    aplicarHabilidad(hab);
}

// Efecto segun el tipo. Cada tipo nuevo que inventes se anade aqui.
function aplicarHabilidad(hab) {
    switch (hab.tipo) {
        case 'pocion':
            // Las pociones gestionan su propio cooldown y su propio aviso de
            // "sin pociones" / "ya esta lleno", asi que solo se delegа.
            usePotion(hab.pocion);
            return;
        case 'area':
            aplicarHabilidadArea(hab);
            return;
        case 'utilidad':
            if (hab.utilidad === 'reiniciar') reiniciarPosicionJugador();
            return;
        default:
            console.log('⚠️ Habilidad sin efecto implementado: ' + hab.id + ' (' + hab.tipo + ')');
            return;
    }
}

// Habilidad de area: cuesta mana, recarga y golpea a todo lo enemigo cercano.
function aplicarHabilidadArea(hab) {
    playerMana -= hab.mana;
    cooldownsHabilidad[hab.id] = hab.cooldown;
    updatePlayerHUD();

    const centro = playerModel.position;
    let impactos = 0;
    for (const m of enemigos) {
        if (m.isDead || !m.group) continue;
        if (centro.distanceTo(m.group.position) <= hab.radio) {
            aplicarDanoMeleeJugador({ ref: m, isDead: m.isDead, type: 'minion' }, hab.dano);
            impactos++;
        }
    }
    if (enemyAxieModel && !enemyAxieIsDead
        && centro.distanceTo(enemyAxieModel.position) <= hab.radio) {
        aplicarDanoMeleeJugador({ ref: null, isDead: false, type: 'enemy_axie' }, hab.dano);
        impactos++;
    }
    for (const tw of towers) {
        if (tw.isDead || !tw.isEnemy) continue;
        if (centro.distanceTo(tw.position) <= hab.radio) {
            aplicarDanoMeleeJugador({ ref: tw, isDead: tw.isDead, type: 'tower' }, hab.dano);
            impactos++;
        }
    }

    // Onda visual: anillo que se expande y se desvanece.
    const anillo = new THREE.Mesh(
        new THREE.RingGeometry(hab.radio * 0.35, hab.radio, 32),
        new THREE.MeshBasicMaterial({ color: hab.color, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    anillo.rotation.x = -Math.PI / 2;
    anillo.position.copy(centro);
    anillo.position.y = GROUND_Y + 0.06;
    scene.add(anillo);
    ondasActivas.push({ mesh: anillo, t: 0 });

    console.log('💥 ' + hab.nombre + ' | impactos: ' + impactos + ' | MP: ' + Math.floor(playerMana));
}

// Avanza recargas y ondas. Se llama cada frame desde el bucle principal.
function actualizarHabilidades(delta) {
    for (const id in cooldownsHabilidad) {
        if (cooldownsHabilidad[id] > 0) {
            cooldownsHabilidad[id] = Math.max(0, cooldownsHabilidad[id] - delta);
        }
    }
}

function actualizarOndas(delta) {
    for (let i = ondasActivas.length - 1; i >= 0; i--) {
        const o = ondasActivas[i];
        o.t += delta;
        const k = o.t / 0.45;
        if (k >= 1) {
            scene.remove(o.mesh);
            o.mesh.geometry.dispose();
            o.mesh.material.dispose();
            ondasActivas.splice(i, 1);
        } else {
            o.mesh.scale.setScalar(1 + k * 0.6);
            o.mesh.material.opacity = 0.55 * (1 - k);
        }
    }
}

// Tecla R: devuelve al Axie a su punto de aparicion. Documentado en el
// README desde el principio pero nunca estuvo implementado. Sin cooldown:
// sirve para desatascarse, no para moverse.
function reiniciarPosicionJugador() {
    if (!playerModel || !smoothPlayerPos) return;
    playerModel.position.copy(playerSpawnPosition);
    playerModel.position.y = GROUND_Y;
    smoothPlayerPos.copy(playerSpawnPosition);
    smoothPlayerPos.y = GROUND_Y;
    smoothTargetPos.copy(smoothPlayerPos);
    isMovingToTarget = false;
    isAutoMovingToTarget = false;
    targetPosition = null;
    console.log('↩️ Posicion reiniciada');
}

// ============================================================
// MARCADOR (tecla Tab, mantenida)
// ============================================================
let marcadorElemento = null;

function contarStructures() {
    const vivos = { torresAliadas: 0, torresEnemigas: 0, torresAliadasTotal: 0, torresEnemigasTotal: 0 };
    for (const t of towers) {
        if (t.isEnemy) {
            vivos.torresEnemigasTotal++;
            if (!t.isDead) vivos.torresEnemigas++;
        } else {
            vivos.torresAliadasTotal++;
            if (!t.isDead) vivos.torresAliadas++;
        }
    }
    return vivos;
}

function filaMarcador(emoji, etiqueta, valor, color) {
    return '<div style="display:flex;justify-content:space-between;gap:18px;padding:6px 0;font-size:14px;">' +
        '<span style="color:#bbb;">' + emoji + ' ' + etiqueta + '</span>' +
        '<span style="font-weight:bold;color:' + color + ';">' + valor + '</span></div>';
}

function mostrarMarcador() {
    if (marcadorElemento) return;   // ya esta abierto

    const st = contarStructures();
    const hpHumano = Math.max(0, Math.round(playerHealth));
    const hpAxie = Math.max(0, Math.round(enemyAxieHealth));

    // Fila de la izquierda: jugador humano. Derecha: la IA enemiga.
    const ladoJugador =
        filaMarcador('🗡️', 'Daño de ataque', Math.round(attackDamage), '#ff8844') +
        filaMarcador('🛡️', 'Defensa física', playerArmor, '#aabbdd') +
        filaMarcador('📿', 'Defensa mágica', playerMagicResist, '#cc88ff') +
        filaMarcador('⚡', 'Vel. ataque', attackSpeed.toFixed(2) + 's', '#ffaa44') +
        filaMarcador('🏹', 'Rango', attackRange.toFixed(1), '#aa88ff') +
        filaMarcador('❤️', 'Vida', hpHumano + '/' + Math.round(playerMaxHealth), '#ff6644') +
        filaMarcador('💰', 'Oro', Math.round(playerGold), '#ffcc44') +
        filaMarcador('💀', 'Muertes', playerDeathCount, '#ff4466') +
        filaMarcador('🏰', 'Torres en pie', st.torresAliadas + '/' + st.torresAliadasTotal, '#44ff88');

    const ladoEnemigo =
        filaMarcador('🗡️', 'Daño de ataque', Math.round(ENEMY_AXIE_ATTACK_DAMAGE * enemyAxieBonuses.damageMultiplier), '#ff8844') +
        filaMarcador('🛡️', 'Defensa física', '-', '#888') +
        filaMarcador('📿', 'Defensa mágica', '-', '#888') +
        filaMarcador('⚡', 'Vel. ataque', (ENEMY_AXIE_ATTACK_SPEED).toFixed(2) + 's', '#ffaa44') +
        filaMarcador('🏹', 'Rango', ENEMY_AXIE_ATTACK_RANGE.toFixed(1), '#aa88ff') +
        filaMarcador('❤️', 'Vida', hpAxie + '/' + Math.round(enemyAxieMaxHealth), '#ff6644') +
        filaMarcador('💰', 'Oro', Math.round(enemyAxieGold), '#ffcc44') +
        filaMarcador('🏆', 'Objetos', Object.keys(enemyAxieItems || {}).length, '#ffcc44') +
        filaMarcador('🏰', 'Torres en pie', st.torresEnemigas + '/' + st.torresEnemigasTotal, '#ff4488');

    const el = document.createElement('div');
    el.id = 'marcador-tab';
    el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'background:rgba(0,0,0,0.92);border:2px solid rgba(255,255,255,0.35);border-radius:14px;' +
        'padding:22px 28px;z-index:300;color:#fff;font-family:\'Courier New\',monospace;' +
        'min-width:560px;pointer-events:none;box-shadow:0 0 40px rgba(0,0,0,0.8);';

    el.innerHTML =
        '<div style="text-align:center;font-size:20px;font-weight:bold;margin-bottom:14px;color:#ffcc44;letter-spacing:2px;">MARCADOR</div>' +
        '<div style="display:flex;gap:34px;justify-content:space-between;">' +
            '<div style="flex:1;"><div style="text-align:center;font-size:16px;font-weight:bold;color:#44ff88;margin-bottom:8px;">' + currentAxieName + '</div>' + ladoJugador + '</div>' +
            '<div style="width:2px;background:rgba(255,255,255,0.2);"></div>' +
            '<div style="flex:1;"><div style="text-align:center;font-size:16px;font-weight:bold;color:#ff4488;margin-bottom:8px;">AXIE ENEMIGO</div>' + ladoEnemigo + '</div>' +
        '</div>' +
        '<div style="text-align:center;font-size:11px;color:#888;margin-top:14px;">Suelta Tab para cerrar</div>';

    document.body.appendChild(el);
    marcadorElemento = el;
}

function ocultarMarcador() {
    if (marcadorElemento) {
        marcadorElemento.remove();
        marcadorElemento = null;
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (gameFinished && !isAITrainingMode) return;
        if (shopOpen) { closeShop(); return; }
        if (isAITrainingMode || gameStarted) {
            if (gamePaused) hidePauseMenu();
            else showPauseMenu();
        }
        return;
    }

    // --- Tab: marcador de partida (se mantiene mientras se pulsa) ---
    if (e.key === 'Tab') {
        e.preventDefault();   // sin esto el navegador cambia el foco
        if (!gameStarted || gameFinished || isAITrainingMode) return;
        mostrarMarcador();
        return;
    }

    // --- B: teletransporte al nexo aliado (recall) ---
    if (e.key === 'b' || e.key === 'B') {
        if (!gameStarted || gameFinished || gamePaused) return;
        if (isAITrainingMode) return;
        if (!playerSpawned || isPlayerDead) return;
        if (shopOpen) return;
        teletransporteAlNexo();
        return;
    }

    // --- Teclas de habilidad (Q/W/E/R): todo lo decide el catalogo ---
    // Para reasignar teclas se cambia 'tecla' en src/config/habilidades.js.
    // Ojo: 'b' (nexo) y 'r' (reset) NO deben solaparse con el catalogo.
    if (gameStarted && !isAITrainingMode) {
        const tecla = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (HABILIDADES_POR_TECLA[tecla]) { usarHabilidad(HABILIDADES_POR_TECLA[tecla]); return; }
    }
});

// Tab se suelta: se esconde el marcador.
document.addEventListener('keyup', (e) => {
    if (e.key === 'Tab') ocultarMarcador();
});

// Al perder el foco con Tab pulsado, el navegador no manda el keyup.
// Sin esto el marcador se quedaria pegado en pantalla.
window.addEventListener('blur', () => ocultarMarcador());

let frameCounter = 0;
let lastTime = 0;
let gameLoopToken = 0;

function startGameLoop() {
    gameLoopToken++;
    const token = gameLoopToken;
    lastTime = performance.now();
    requestAnimationFrame((t) => gameLoop(t, token));
}

function stopGameLoop() {
    gameLoopToken++;
}
let realFPS = 0;
let fpsCounter = 0;
let fpsTimer = 0;

function gameLoop(time, token) {
    if (token !== gameLoopToken) return;
    if (isAITrainingMode && aiTrainingAutoRestartTimer > 0) {
        const delta = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;
        aiTrainingAutoRestartTimer -= delta;
        if (nexusEnemigo) nexusEnemigo.updateExplosion(delta);
        if (nexusAliado) nexusAliado.updateExplosion(delta);
        updateHUDEntrenamiento();
        if (aiTrainingAutoRestartTimer <= 0) {
            aiTrainingAutoRestartTimer = 0;
            const banner = document.getElementById('ai-transition-banner');
            if (banner) banner.remove();
            const allAxies = getAllAxies();
            const randomAxie = allAxies[Math.floor(Math.random() * allAxies.length)];
            aiTrainingIsRestarting = false;
            startAIGame(randomAxie.id);
            return;
        }
        renderer.render(scene, camera);
        requestAnimationFrame((t) => gameLoop(t, token));
        return;
    }
    if (gameFinished) {
        if (nexusEnemigo) nexusEnemigo.updateExplosion(0.016);
        if (nexusAliado) nexusAliado.updateExplosion(0.016);
        renderer.render(scene, camera);
        requestAnimationFrame((t) => gameLoop(t, token));
        return;
    }
    if (gamePaused) {
        lastTime = time;
        renderer.render(scene, camera);
        requestAnimationFrame((t) => gameLoop(t, token));
        return;
    }
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    frameCounter++;
    gameTime += delta;

    processSpawnQueue(delta);

    if (potionUseCooldown > 0) {
        potionUseCooldown -= delta;
        if (potionUseCooldown < 0) potionUseCooldown = 0;
    }

    if (shopAutoOpenCooldown > 0) {
        shopAutoOpenCooldown -= delta;
        if (shopAutoOpenCooldown < 0) shopAutoOpenCooldown = 0;
    }

    if (window.currentTarget && !isAITrainingMode) {
        let dead = false;
        if (window.currentTarget.isDead === true) dead = true;
        else if (window.currentTarget.health !== undefined && window.currentTarget.health <= 0) dead = true;
        if (dead) { window.currentTarget = null; targetUI.style.display = 'none'; isAutoMovingToTarget = false; }
    }
    if (isPlayerDead) {
        playerRespawnTimer -= delta;
        if (playerRespawnTimer <= 0 && !gameFinished) {
            isPlayerDead = false;
            playerHealth = playerMaxHealth;
            playerMana = playerMaxMana;
            playerRespawnTimer = 0;
            updatePlayerHUD();
            if (playerModel) {
                playerModel.position.copy(playerSpawnPosition);
                playerModel.position.y = GROUND_Y;
                smoothPlayerPos.copy(playerSpawnPosition);
                smoothPlayerPos.y = GROUND_Y;
                playerModel.visible = true;
            }
        }
    }
    if (isFirstWave) {
        firstWaveTimer += delta;
        if (firstWaveTimer >= CONFIG.firstWaveGhostDuration) isFirstWave = false;
    }
    timerDiv.textContent = `${Math.floor(gameTime / 60).toString().padStart(2, '0')}:${Math.floor(gameTime % 60).toString().padStart(2, '0')}`;
    fpsCounter++;
    fpsTimer += delta;
    if (fpsTimer >= 1.0) {
        realFPS = Math.round(fpsCounter / fpsTimer);
        fpsCounter = 0;
        fpsTimer = 0;
        fpsDiv.textContent = `FPS: ${realFPS}`;
    }

    if (isAITrainingMode) {
        updatePlayerAsAI(delta);
        updateHUDEntrenamiento();
    } else {
        if (playerModel && !isPlayerDead && playerSpawned) {
            if (isMovingToTarget && targetPosition) {
                const dx = smoothTargetPos.x - smoothPlayerPos.x;
                const dz = smoothTargetPos.z - smoothPlayerPos.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < 0.1) {
                    smoothPlayerPos.copy(smoothTargetPos);
                    smoothPlayerPos.y = GROUND_Y;
                    isMovingToTarget = false;
                    targetPosition = null;
                    isAutoMovingToTarget = false;
                    if (animIdle && animWalk) { animWalk.stop(); animIdle.play(); currentAnim = 'idle'; }
                } else {
                    const ms = playerSpeed * delta;
                    smoothPlayerPos.x += (dx / dist) * ms;
                    smoothPlayerPos.z += (dz / dist) * ms;
                    smoothPlayerPos.y = GROUND_Y;

                    const limitX = 17, limitZ = 26;
                    smoothPlayerPos.x = Math.max(-limitX, Math.min(limitX, smoothPlayerPos.x));
                    smoothPlayerPos.z = Math.max(-limitZ, Math.min(limitZ, smoothPlayerPos.z));

                    if (currentAnim !== 'walk' && animWalk) {
                        if (animIdle) animIdle.stop();
                        animWalk.play();
                        currentAnim = 'walk';
                    }

                    const angle = Math.atan2(dx, dz);
                    let diff = angle - playerModel.rotation.y;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    playerModel.rotation.y += diff * Math.min(1, 6 * delta);
                }
                playerModel.position.x = smoothPlayerPos.x;
                playerModel.position.z = smoothPlayerPos.z;
                playerModel.position.y = GROUND_Y;
            }

            if (window.currentTarget && !window.currentTarget.isDead) {
                const targetPos = window.currentTarget.group ? window.currentTarget.group.position : window.currentTarget.position;
                const isEnemy = isEnemyForPlayer(window.currentTarget);

                if (targetPos && isEnemy) {
                    const distToTarget = Math.sqrt(
                        Math.pow(targetPos.x - playerModel.position.x, 2) +
                        Math.pow(targetPos.z - playerModel.position.z, 2)
                    );

                    if (distToTarget <= attackRange && !isMovingToTarget) {
                        const angle = Math.atan2(targetPos.x - playerModel.position.x, targetPos.z - playerModel.position.z);
                        playerModel.rotation.y = angle;

                        if (currentAnim !== 'idle' && animIdle) {
                            if (animWalk) animWalk.stop();
                            animIdle.play();
                            currentAnim = 'idle';
                        }

                        attackCooldown -= delta;
                        if (attackCooldown <= 0 && !isAttacking) {
                            const startPos = playerModel.position.clone();
                            startPos.y = 0.5;
                            // Gesto de ataque: el Axie levanta el arma (Cannon.Attack / Sword.Attack)
                            dispararAtaqueJugador(window.currentTarget, startPos, attackDamage);
                            attackCooldown = attackSpeed;
                            isAttacking = true;
                            setTimeout(() => { isAttacking = false; }, 100);
                        }
                    }
                }
            }

            if (!shopOpen && shopAutoOpenCooldown <= 0 && shopAliada) {
                const d = playerModel.position.distanceTo(shopAliada.group.position);
                if (d <= CONFIG.SHOP_AUTO_OPEN_DISTANCE) {
                    const pdx = playerModel.position.x - shopAliada.group.position.x;
                    const pdz = playerModel.position.z - shopAliada.group.position.z;
                    const pdist = Math.sqrt(pdx * pdx + pdz * pdz) || 1;
                    const pushDist = 1.0;
                    smoothPlayerPos.x = shopAliada.group.position.x + (pdx / pdist) * (CONFIG.SHOP_AUTO_OPEN_DISTANCE + pushDist);
                    smoothPlayerPos.z = shopAliada.group.position.z + (pdz / pdist) * (CONFIG.SHOP_AUTO_OPEN_DISTANCE + pushDist);
                    smoothPlayerPos.y = GROUND_Y;
                    playerModel.position.x = smoothPlayerPos.x;
                    playerModel.position.z = smoothPlayerPos.z;
                    playerModel.position.y = GROUND_Y;
                    openShop();
                }
            }
        }
    }

    // Temporizador del gesto de ataque del Axie ENEMIGO: mismo criterio que el
    // del jugador, para que al acabar el clip no se quede clavado en el golpe.
    if (enemyAxieAttackTimer > 0) {
        enemyAxieAttackTimer -= delta;
        if (enemyAxieAttackTimer <= 0) {
            if (enemyAxieAnimAttack) enemyAxieAnimAttack.fadeOut(0.12);
            const siguienteE = enemyAxieAnimWalk && enemyAxieCurrentAnim === 'walk' ? enemyAxieAnimWalk : enemyAxieAnimIdle;
            if (siguienteE) {
                siguienteE.reset();
                siguienteE.setEffectiveWeight(1);
                siguienteE.fadeIn(0.12).play();
                enemyAxieCurrentAnim = (siguienteE === enemyAxieAnimWalk) ? 'walk' : 'idle';
            }
            enemyAxieAttackTimer = 0;
        }
    }

    // Temporizador del gesto de ataque del Axie: al terminar el clip de ataque
    // (Cannon.Attack / Sword.Attack), vuelve a idle o walk. Sin esto el Axie se
    // queda clavado en el ultimo frame porque el clip va con clampWhenFinished.
    if (attackAnimTimer > 0) {
        attackAnimTimer -= delta;
        if (attackAnimTimer <= 0) {
            if (animAttack) animAttack.fadeOut(0.12);
            const quieroMover = isMovingToTarget || (window.currentTarget && !window.currentTarget.isDead &&
                playerModel && playerModel.position.distanceTo(
                    window.currentTarget.group ? window.currentTarget.group.position : window.currentTarget.position
                ) > attackRange);
            const siguiente = quieroMover ? animWalk : animIdle;
            if (siguiente) {
                siguiente.reset();
                siguiente.setEffectiveWeight(1);
                siguiente.fadeIn(0.12).play();
                currentAnim = quieroMover ? 'walk' : 'idle';
            }
            attackAnimTimer = 0;
        }
    }

    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
        const proj = playerProjectiles[i];
        proj.update(delta);
        if (!proj.active) playerProjectiles.splice(i, 1);
    }
    if (mixer && !isPlayerDead) mixer.update(delta);
    // Habilidades: recargas, ondas visuales y estado del panel.
    actualizarHabilidades(delta);
    actualizarOndas(delta);
    updateAbilityHUD();

    if (!gameStarted) {
        startTimer -= delta;
        waveDiv.textContent = `⏳ ${Math.ceil(startTimer)}s`;
        if (startTimer <= 0) {
            gameStarted = true;
            if (aliados.filter(m => !m.isDead).length === 0 && enemigos.filter(m => !m.isDead).length === 0 && spawnQueue.length === 0) {
                spawnWave();
            }
        }
        if (isAITrainingMode) {
            updateDynamicCamera(delta);
            updateDynamicHUDForCamera();
        } else { if (playerModel) updateCameraPosition(); if (camaraInicializada) camera.position.y = CAMERA_FIXED_Y; }
        renderer.render(scene, camera);
        requestAnimationFrame((t) => gameLoop(t, token));
        return;
    }

    const enemies = { aliados, enemigos };
    for (const tower of towers) tower.update(delta, enemies);
    for (const m of aliados) m.update(delta, aliados, enemigos, towers, playerModel);
    for (const m of enemigos) m.update(delta, aliados, enemigos, towers, playerModel);
    // Colision con estructuras: tienda, nexo y torres tienen cuerpo real.
    applyStructureCollisions(aliados.concat(enemigos));
    resolveMinionCollisions(delta);
    // Los Axies tambien respetan las estructuras (mismo empuje, otro cuerpo).
    applyStructureCollisions([playerModel, enemyAxieModel].filter(Boolean));
    suavizarYEntidades(delta);
    if (gameStarted && !gameFinished) updateEnemyAxie(delta);
    if (nexusEnemigo) nexusEnemigo.updateExplosion(delta);
    updateEnemyAxieDebugHUD();

    const aa = aliados.filter(m => !m.isDead);
    const ae = enemigos.filter(m => !m.isDead);
    // La oleada sale cada 30s de forma constante (LoL style),
    // sin esperar a que la anterior muera.
    const WAVE_INTERVAL = 30.0;
    waveCooldown += delta;
    if (waveCooldown >= WAVE_INTERVAL) {
        waveCooldown = 0;
        spawnWave();
    }

    if (isAITrainingMode) {
        updateDynamicCamera(delta);
        updateDynamicHUDForCamera();
    } else {
        if (playerModel) updateCameraPosition();
        if (camaraInicializada) camera.position.y = CAMERA_FIXED_Y;
    }
    // Editor de mapa: usar sus cámaras
    let renderCamera = camera;
    if (editorMode) {
        renderCamera = editorCameraMode === 'perspective' ? editorPerspectiveCamera : editorCamera;
        // Actualizar aspect ratio en resize del editor
        const aspect = window.innerWidth / window.innerHeight;
        if (editorCameraMode === 'ortho' && editorCamera) {
            const w = window.__debug.widths;
            const size = Math.max(w.laneReal, w.laneLargo) * 0.6;
            editorCamera.left = -size * aspect;
            editorCamera.right = size * aspect;
            editorCamera.top = size;
            editorCamera.bottom = -size;
            editorCamera.updateProjectionMatrix();
        } else if (editorPerspectiveCamera) {
            editorPerspectiveCamera.aspect = aspect;
            editorPerspectiveCamera.updateProjectionMatrix();
        }
    }
    renderer.render(scene, renderCamera);
    requestAnimationFrame((t) => gameLoop(t, token));
}

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    const fs = 8.0;
    camera.left = -fs * aspect / 2;
    camera.right = fs * aspect / 2;
    camera.top = fs / 2;
    camera.bottom = -fs / 2;
    camera.updateProjectionMatrix();
    // Actualizar cámaras del editor si está activo
    if (editorMode) {
        const w = window.__debug.widths;
        const size = Math.max(w.laneReal, w.laneLargo) * 0.6;
        if (editorCamera) {
            editorCamera.left = -size * aspect;
            editorCamera.right = size * aspect;
            editorCamera.top = size;
            editorCamera.bottom = -size;
            editorCamera.updateProjectionMatrix();
        }
        if (editorPerspectiveCamera) {
            editorPerspectiveCamera.aspect = aspect;
            editorPerspectiveCamera.updateProjectionMatrix();
        }
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('beforeunload', () => {
    saveBrains();
    healthBarCache.clear();
    renderer.dispose();
});

const targetUI = document.createElement('div');
targetUI.style.cssText = `position:fixed;top:20px;left:20px;width:240px;background:rgba(0,0,0,0.85);border:2px solid rgba(255,200,50,0.6);border-radius:8px;padding:8px 12px;z-index:150;color:#fff;display:none;pointer-events:none;font-family:Arial;`;
document.body.appendChild(targetUI);

window.currentTarget = null;

window.showTarget = function (target) {
    window.currentTarget = target;
    if (!target || target.isDead) { targetUI.style.display = 'none'; return; }
    targetUI.style.display = 'block';
    let name = 'Enemigo';
    if (target.type === 'minion') name = target.isEnemy ? '🔴 Minion' : '🔵 Minion Aliado';
    else if (target.type === 'tower') name = target.isEnemy ? '🗼 Torre Enemiga' : '🏰 Torre Aliada';
    else if (target.type === 'nexus') name = target.isEnemy ? '🔥 Nexo Enemigo' : '💎 Nexo Aliado';
    else if (target.type === 'enemy_axie') name = `🤖 ${enemyAxie ? enemyAxie.nombre : 'Axie'}`;
    else if (target.type === 'player') name = `🦊 ${currentAxieName}`;
    else if (target.type === 'shop') name = target.isEnemy ? '🏪 Tienda Enemiga' : '🏪 Tienda Aliada';

    if (target.type === 'shop') {
        targetUI.innerHTML = `
            <div style="font-weight:bold;font-size:14px;color:#ffcc44;margin-bottom:6px;">${name}</div>
            <div style="font-size:11px;color:#88ddff;">🚶 Camina hacia ella para abrirla</div>
        `;
        return;
    }

    const maxHP = target.maxHealth || 100;
    const curHP = target.health || 100;
    const pct = Math.max(0, (curHP / maxHP) * 100);
    targetUI.innerHTML = `
        <div style="font-weight:bold;font-size:14px;color:#ffcc44;margin-bottom:6px;">${name}</div>
        <div style="display:flex;gap:8px;align-items:center;">
            <div style="flex:1;height:16px;background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden;">
                <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#ff2244,#ff6644);"></div>
            </div>
            <span style="font-size:11px;font-weight:bold;">${Math.floor(curHP)}/${maxHP}</span>
        </div>
    `;
};

window.updateTargetUI = function () {
    if (window.currentTarget && !window.currentTarget.isDead) window.showTarget(window.currentTarget);
    else if (window.currentTarget) { window.currentTarget = null; targetUI.style.display = 'none'; }
};

// 🔧 CORRECCIÓN 2: Precalienta todas las combinaciones de health bars al inicio
function precalentarHealthBars() {
    const combinaciones = [
        { segments: 6, isEnemy: false },
        { segments: 6, isEnemy: true },
        { segments: 3, isEnemy: false },
        { segments: 3, isEnemy: true },
        { segments: 10, isEnemy: false },
        { segments: 10, isEnemy: true },
    ];
    for (const { segments, isEnemy } of combinaciones) {
        for (let v = 0; v <= segments; v++) {
            getHealthBarTexture(segments, v, isEnemy);
        }
    }
    console.log(`✅ HealthBars precalentadas: ${healthBarCache.size} texturas`);
}

document.addEventListener('DOMContentLoaded', () => {
    loadBrains();
    precalentarHealthBars();
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    timerDiv.style.display = 'none';
    fpsDiv.style.display = 'none';
    waveDiv.style.display = 'none';
    targetUI.style.display = 'none';
    goldDiv.style.display = 'none';
    enemyAxieDebugHUD.style.display = 'none';
    showMainMenu();
});


// ---------------------------------------------------------------------
// HOOKS DE DEPURACION (vista cenital)
// ---------------------------------------------------------------------
// Expone el estado interno a tools/vista-cenital.html: escena, camara,
// renderer y las posiciones vivas del carril. Sin esto la vista cenital
// tendria que duplicar la logica de carga y se desincronizaria.
window.__debug = {
    THREE,
    get scene() { return scene; },
    get camera() { return camera; },
    get renderer() { return renderer; },
    get groundY() { return GROUND_Y; },
    get laneTopY() { return LANE_TOP_Y; },
    get groundReady() { return groundReady; },
    get widths() {
        // Ancho visual del asfalto: LANE_TARGET_WIDTH es el del modelo
        // entero (incluye arcen). Estos son los topes logicos del motor.
        return {
            laneReal: LANE_TARGET_WIDTH,          // ancho del modelo
            laneUtil: CONFIG.MINION_LANE_LIMIT_X, // ancho jugable
            laneLargo: LANE_TARGET_LENGTH,
            limitZ: CONFIG.MINION_LANE_LIMIT_Z,
        };
    },
    get actors() {
        // Todo lo que se coloca en el carril, con su ancho real medido del
        // bbox escalado. La vista cenital dibuja estos rectangulos.
        const out = [];
        const push = (label, side, obj, x, z) => {
            if (!obj || !obj.group) return;
            const box = new THREE.Box3().setFromObject(obj.group);
            const size = box.getSize(new THREE.Vector3());
            out.push({
                label, side, x, z,
                width: size.x, depth: size.z, height: size.y,
                minX: box.min.x, maxX: box.max.x,
                minZ: box.min.z, maxZ: box.max.z,
                health: obj.health, maxHealth: obj.maxHealth,
                isDead: !!obj.isDead,
            });
        };
        if (nexusAliado) push('Nexo azul', 'ally', nexusAliado, nexusAliado.group.position.x, nexusAliado.group.position.z);
        if (nexusEnemigo) push('Nexo rojo', 'enemy', nexusEnemigo, nexusEnemigo.group.position.x, nexusEnemigo.group.position.z);
        if (shopAliada) push('Tienda azul', 'ally', shopAliada, shopAliada.group.position.x, shopAliada.group.position.z);
        if (shopEnemiga) push('Tienda roja', 'enemy', shopEnemiga, shopEnemiga.group.position.x, shopEnemiga.group.position.z);
        towers.forEach((tw, i) => {
            if (!tw || !tw.group) return;
            push('Torre ' + (tw.isEnemy ? 'roja' : 'azul') + ' T' + (tw.tier || 1), tw.isEnemy ? 'enemy' : 'ally', tw, tw.group.position.x, tw.group.position.z);
        });
        if (playerModel) push('Jugador', 'ally', { group: playerModel }, playerModel.position.x, playerModel.position.z);
        if (enemyAxieModel) push('Axie rival', 'enemy', { group: enemyAxieModel }, enemyAxieModel.position.x, enemyAxieModel.position.z);
        // Los minions tambien van al carril, asi que la cenital los dibuja.
        // Faltaban: la vista solo pintaba nexos, torres, tiendas y Axies,
        // y por eso el reparto lateral no habia forma de revisarlo.
        const etiquetaMinion = (m, i, bando) => {
            const tipo = m.esBig ? 'grande' : (m.tipo || 'melee');
            return 'Minion ' + bando + ' ' + tipo + ' ' + i;
        };
        aliados.forEach((m, i) => {
            if (!m || !m.group) return;
            push(etiquetaMinion(m, i, 'azul'), 'ally', m, m.group.position.x, m.group.position.z);
        });
        enemigos.forEach((m, i) => {
            if (!m || !m.group) return;
            push(etiquetaMinion(m, i, 'rojo'), 'enemy', m, m.group.position.x, m.group.position.z);
        });
        return out;
    },
    get config() { return CONFIG; },

    // Mueve un objeto del carril a una posicion concreta. Lo usa el
    // editor de posiciones de la vista cenital: el usuario arrastra y
    // esto aplica el cambio sobre el objeto real, para que vea el
    // resultado en vivo sin recargar. Devuelve la posicion aplicada.
    setPos(label, x, z) {
        const objetivos = [
            ['Nexo azul', nexusAliado], ['Nexo rojo', nexusEnemigo],
            ['Tienda azul', shopAliada], ['Tienda roja', shopEnemiga],
            ['Jugador', playerModel ? { group: playerModel } : null],
            ['Axie rival', enemyAxieModel ? { group: enemyAxieModel } : null],
        ];
        towers.forEach(tw => {
            if (!tw || !tw.group) return;
            objetivos.push(['Torre ' + (tw.isEnemy ? 'roja' : 'azul') + ' T' + (tw.tier || 1), tw]);
        });
        for (const [nombre, obj] of objetivos) {
            if (nombre === label && obj && obj.group) {
                obj.group.position.x = x;
                obj.group.position.z = z;
                if (obj.position) { obj.position.x = x; obj.position.z = z; }
                return { ok: true, label, x, z };
            }
        }
        return { ok: false, error: 'objeto no encontrado: ' + label };
    },

    // ===== IMPLEMENTACION EDITOR DE MAPA (delega a funciones globales) =====
    createEditorUI() { return createEditorUI(); },
    addEditorListeners() { return addEditorListeners(); },
    removeEditorListeners() { return removeEditorListeners(); },
    toggleEditorMode() { return toggleEditorMode(); },
    toggleEditorCamera() { return toggleEditorCamera(); },
    setEditorTool(t) { return setEditorTool(t); },
    exportEditorChanges() { return exportEditorChanges(); },
    rotateEditorSelection() { return rotateEditorSelection(); },
    mirrorEditorSelectionX() { return mirrorEditorSelectionX(); },
    mirrorEditorSelectionZ() { return mirrorEditorSelectionZ(); },
    deleteEditorSelection() { return deleteEditorSelection(); },
    duplicateEditorSelection() { return { ok: false, error: 'duplicar no implementado aun' }; },
    snapToGrid(v) { return snapToGrid(v); },
},

console.log('🔍 window.__debug listo: vista cenital + editor disponible');

import './js/hub-control.js';
import './js/inject-memory.js';


