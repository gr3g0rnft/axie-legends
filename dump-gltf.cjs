import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MenuScreen } from './ui/MenuScreen.js';
import { getAxieById, getAllAxies } from './config/axies.js';

const CONFIG = {
    gravedad: -20,
    velocidadSalto: 7,
    shadowMapSize: 256,
    pixelRatio: 1.2,
    updateInterval: 2,
    minionLimitZ: 26,
    camaraAngulo: 60,
    camaraDistancia: 18,
    camaraAltura: 14,
    SPAWN_DELAY: 15,
    towerRange: 5,
    towerDamage: 20,
    towerFireRate: 1.5,
    projectileSpeed: 8,
    towerHealth: 500,
    nexusHealth: 1000,
    meleeSpacing: 1.1,
    mageSpacing: 0.9,
    meleeSpeed: 1.4,
    mageSpeed: 1.4,
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
    enemyMaxHealth: 200,
    RESPAWN_TIME: 3.0,
    AXIE_SPAWN_DELAY: 5.0,
    firstWaveGhostDuration: 28,
    SHOP_INTERACTION_DISTANCE: 6.0,
    SHOP_AUTO_OPEN_DISTANCE: 2.0,
    SHOP_POTION_LIMIT: 10,

    MINION_GLB_MAGE_ENEMY: '/public/assets/minions/mage2_bone.glb',
    MINION_GLB_MELEE_ENEMY: null,

    MAGE_GLB_WALK:   '/public/assets/minions/mage2_walk.glb',
    MAGE_GLB_IDLE:   '/public/assets/minions/mage2_idle.glb',
    MAGE_GLB_ATTACK: '/public/assets/minions/mage2_attack.glb',
    MAGE_GLB_STAFF:  '/public/assets/minions/mage2_staff.glb',

    TERRAIN_GLB_LANE: '/public/assets/terrain/carril_1.glb',

    MINION_GLB_HEIGHT: 0.45,
    MINION_COLLISION_DISTANCE: 0.75,
};

let GROUND_Y = -0.35;
let LANE_TOP_Y = -0.35;
let groundReady = false;

function reposicionarEntidadesSobreCarril() {
    if (!groundReady) return;
    console.log(`🔧 Reposicionando entidades con lerp suave. GROUND_Y = ${GROUND_Y.toFixed(3)}`);
}

function suavizarYEntidades(delta) {
    if (!groundReady) return;
    const speed = 6;
    const factor = Math.min(1, speed * delta);

    for (const minion of aliados) {
        if (minion.group && !minion.isDead) {
            const diff = GROUND_Y - minion.group.position.y;
            if (Math.abs(diff) > 0.001) minion.group.position.y += diff * factor;
            else minion.group.position.y = GROUND_Y;
        }
    }
    for (const minion of enemigos) {
        if (minion.group && !minion.isDead) {
            const diff = GROUND_Y - minion.group.position.y;
            if (Math.abs(diff) > 0.001) minion.group.position.y += diff * factor;
            else minion.group.position.y = GROUND_Y;
        }
    }
    for (const tower of towers) {
        if (tower.group && !tower.isDead) {
            const diff = GROUND_Y - tower.group.position.y;
            if (Math.abs(diff) > 0.001) tower.group.position.y += diff * factor;
            else tower.group.position.y = GROUND_Y;
        }
    }
    if (nexusAliado && nexusAliado.group && !nexusAliado.isDead) {
        const diff = GROUND_Y - nexusAliado.group.position.y;
        if (Math.abs(diff) > 0.001) nexusAliado.group.position.y += diff * factor;
        else nexusAliado.group.position.y = GROUND_Y;
    }
    if (nexusEnemigo && nexusEnemigo.group && !nexusEnemigo.isDead) {
        const diff = GROUND_Y - nexusEnemigo.group.position.y;
        if (Math.abs(diff) > 0.001) nexusEnemigo.group.position.y += diff * factor;
        else nexusEnemigo.group.position.y = GROUND_Y;
    }
    if (shopAliada && shopAliada.group) {
        const diff = GROUND_Y - shopAliada.group.position.y;
        if (Math.abs(diff) > 0.001) shopAliada.group.position.y += diff * factor;
        else shopAliada.group.position.y = GROUND_Y;
    }
    if (shopEnemiga && shopEnemiga.group) {
        const diff = GROUND_Y - shopEnemiga.group.position.y;
        if (Math.abs(diff) > 0.001) shopEnemiga.group.position.y += diff * factor;
        else shopEnemiga.group.position.y = GROUND_Y;
    }

    // ✅ FIX: player siempre en GROUND_Y, sin lerp
    if (playerModel && !isPlayerDead) {
        smoothPlayerPos.y = GROUND_Y;
        playerModel.position.y = GROUND_Y;
    }
}

let playerHealth = CONFIG.playerMaxHealth;
let playerMaxHealth = CONFIG.playerMaxHealth;
let isPlayerDead = false;
let playerRespawnTimer = 0;
let playerAttackTarget = null;
let gameTime = 0;
let isFirstWave = true;
let firstWaveTimer = 0;
let gameFinished = false;
let victoryScreen = null;
let defeatScreen = null;
let gamePaused = false;
let pauseMenu = null;
let selectedAxieId = 'bestia';
let axieLoaded = false;
let currentAxieName = 'Bing';

let isAutoWalkingToShop = false;
let autoWalkShopTarget = null;

let staffTemplatePromise = null;
function loadStaffTemplate() {
    if (staffTemplatePromise) return staffTemplatePromise;
    const loader = new GLTFLoader();
    staffTemplatePromise = loader.loadAsync(CONFIG.MAGE_GLB_STAFF)
        .then(gltf => {
            console.log('🪄 Báculo cargado:', CONFIG.MAGE_GLB_STAFF);
            return gltf.scene;
        })
        .catch(err => {
            console.error('❌ Error cargando báculo:', err);
            return null;
        });
    return staffTemplatePromise;
}

const healthBarCache = new Map();

function getHealthBarTexture(segments, visibleSegments, isEnemy) {
    const key = `${segments}-${visibleSegments}-${isEnemy}`;
    if (healthBarCache.has(key)) {
        return healthBarCache.get(key);
    }

    const canvas = document.createElement('canvas');
    const width = 128;
    const height = 20;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    const segmentWidth = (width - 4) / segments;
    const segmentHeight = height - 4;
    const colors = isEnemy ? ['#ff4444', '#ff6666'] : ['#4488ff', '#66aaff'];

    for (let i = 0; i < visibleSegments; i++) {
        const x = 2 + i * segmentWidth;
        const y = 2;
        const w = segmentWidth - 1;
        const h = segmentHeight;
        const color = i % 2 === 0 ? colors[0] : colors[1];
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#88aaff';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, w, h);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    healthBarCache.set(key, texture);
    return texture;
}

function createHealthBar(segments = 10, isEnemy = false) {
    const texture = getHealthBarTexture(segments, segments, isEnemy);
    const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.2, 0.2, 1);
    sprite.renderOrder = 999;
    return { sprite, spriteMat };
}

function updateHealthBarSprite(spriteMat, segments, visibleSegments, isEnemy) {
    const texture = getHealthBarTexture(segments, visibleSegments, isEnemy);
    spriteMat.map = texture;
    spriteMat.needsUpdate = true;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);
scene.fog = new THREE.Fog(0x0a0a1a, 35, 55);

const frustumSize = 7.2;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
    -frustumSize * aspect,
    frustumSize * aspect,
    frustumSize,
    -frustumSize,
    0.1,
    100
);
camera.zoom = 1.0;

const CAMERA_OFFSET = new THREE.Vector3(
    Math.sin(CONFIG.camaraAngulo * Math.PI / 180) * CONFIG.camaraDistancia,
    CONFIG.camaraAltura,
    Math.cos(CONFIG.camaraAngulo * Math.PI / 180) * CONFIG.camaraDistancia
);

let cameraSmoothPos = new THREE.Vector3(0, 0, 0);
let cameraSmoothTarget = new THREE.Vector3(0, 0, 0);

// ✅ FIX: Y de cámara FIJA calculada UNA VEZ
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
    camera.zoom = 1.0;
    camera.updateProjectionMatrix();
    
    camaraInicializada = true;
    console.log(`📷 Cámara inicializada. CAMERA_FIXED_Y = ${CAMERA_FIXED_Y.toFixed(3)}, target Y = ${CAMERA_FIXED_TARGET_Y.toFixed(3)}`);
}

function updateCameraPosition() {
    if (!playerModel || !camaraInicializada) return;
    
    const targetX = playerModel.position.x;
    const targetZ = playerModel.position.z;
    
    const smoothFactor = 1 - Math.exp(-CONFIG.cameraSmoothSpeed * 0.016);
    
    cameraSmoothPos.x = THREE.MathUtils.lerp(cameraSmoothPos.x, targetX + CAMERA_OFFSET.x, smoothFactor);
    cameraSmoothPos.z = THREE.MathUtils.lerp(cameraSmoothPos.z, targetZ + CAMERA_OFFSET.z, smoothFactor);
    cameraSmoothPos.y = CAMERA_FIXED_Y;
    
    cameraSmoothTarget.x = THREE.MathUtils.lerp(cameraSmoothTarget.x, targetX, smoothFactor);
    cameraSmoothTarget.z = THREE.MathUtils.lerp(cameraSmoothTarget.z, targetZ, smoothFactor);
    cameraSmoothTarget.y = CAMERA_FIXED_TARGET_Y;
    
    camera.position.copy(cameraSmoothPos);
    camera.lookAt(cameraSmoothTarget);
}

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});
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

const ambientLight = new THREE.AmbientLight(0x303048, 0.7);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffeedd, 1.4);
mainLight.position.set(15, 25, 10);
mainLight.castShadow = false;
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0x4488ff, 0.2);
fillLight.position.set(-10, 10, -10);
scene.add(fillLight);

const minionLight = new THREE.DirectionalLight(0xffddaa, 1.0);
minionLight.position.set(0, 20, 15);
minionLight.castShadow = false;
scene.add(minionLight);

function createAridSnowLaneTexture() {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 800; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 20 + Math.random() * 80;
        const shade = 40 + Math.random() * 40;
        ctx.fillStyle = `rgba(${shade + 20}, ${shade + 10}, ${shade}, ${0.15 + Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = 'rgba(20, 15, 10, 0.7)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 60; i++) {
        ctx.beginPath();
        let x = Math.random() * size;
        let y = Math.random() * size;
        ctx.moveTo(x, y);
        const segments = 4 + Math.floor(Math.random() * 4);
        for (let j = 0; j < segments; j++) {
            x += (Math.random() - 0.5) * 120;
            y += (Math.random() - 0.5) * 120;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(30, 20, 15, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 120; i++) {
        ctx.beginPath();
        let x = Math.random() * size;
        let y = Math.random() * size;
        ctx.moveTo(x, y);
        const segments = 3 + Math.floor(Math.random() * 3);
        for (let j = 0; j < segments; j++) {
            x += (Math.random() - 0.5) * 80;
            y += (Math.random() - 0.5) * 80;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    for (let i = 0; i < 4000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const s = 1 + Math.random() * 3;
        const shade = 50 + Math.random() * 60;
        ctx.fillStyle = `rgba(${shade + 20}, ${shade + 10}, ${shade}, ${0.2 + Math.random() * 0.3})`;
        ctx.fillRect(x, y, s, s);
    }

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 25; i++) {
        const cx = Math.random() * size;
        const cy = Math.random() * size;
        const baseR = 60 + Math.random() * 140;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR);
        gradient.addColorStop(0, 'rgba(200, 220, 240, 0.55)');
        gradient.addColorStop(0.5, 'rgba(180, 200, 225, 0.35)');
        gradient.addColorStop(1, 'rgba(180, 200, 225, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
        ctx.fill();
        const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.5);
        coreGradient.addColorStop(0, 'rgba(230, 240, 255, 0.75)');
        coreGradient.addColorStop(1, 'rgba(230, 240, 255, 0)');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    for (let i = 0; i < 1500; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 0.5 + Math.random() * 1.5;
        ctx.fillStyle = `rgba(240, 250, 255, ${0.4 + Math.random() * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    const edgeGradient = ctx.createLinearGradient(0, 0, size, 0);
    edgeGradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
    edgeGradient.addColorStop(0.15, 'rgba(0, 0, 0, 0)');
    edgeGradient.addColorStop(0.85, 'rgba(0, 0, 0, 0)');
    edgeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = edgeGradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
}

const groundGeo = new THREE.PlaneGeometry(40, 58);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a2a2a, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
ground.receiveShadow = false;
ground.visible = false;
scene.add(ground);

const grid = new THREE.GridHelper(40, 20, 0x446688, 0x224466);
grid.position.y = -0.45;
grid.visible = false;
scene.add(grid);

const laneLoader = new GLTFLoader();
const LANE_PATH = CONFIG.TERRAIN_GLB_LANE;
const LANE_TARGET_WIDTH = 10;
const LANE_TARGET_LENGTH = 52;
const LANE_OVERLAP = 1.0;
const LANE_TARGET_LENGTH_EACH = LANE_TARGET_LENGTH / 2 + LANE_OVERLAP / 2;

let lanesCargados = 0;
const lanesData = [];

const cargarLanePart = (index) => {
    laneLoader.load(
        LANE_PATH,
        (gltf) => {
            const laneModel = gltf.scene;
            const bbox = new THREE.Box3().setFromObject(laneModel);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            bbox.getSize(size);
            bbox.getCenter(center);
            console.log(`📏 Carril ${index + 1} ORIGINAL: size=(${size.x.toFixed(4)}, ${size.y.toFixed(4)}, ${size.z.toFixed(4)})`);
            lanesData.push({ index, model: laneModel, size, center });
            lanesCargados++;
            if (lanesCargados >= 2) procesarLanes();
        },
        undefined,
        (err) => console.error(`❌ Error cargando carril ${index + 1}:`, err)
    );
};

const procesarLanes = () => {
    console.log('🎬 Procesando 2 carriles idénticos...');

    const dims = [
        { axis: 'x', value: lanesData[0].size.x },
        { axis: 'y', value: lanesData[0].size.y },
        { axis: 'z', value: lanesData[0].size.z },
    ].sort((a, b) => b.value - a.value);

    const largoAxis = dims[0].axis;
    const anchoAxis = dims[1].axis;
    const altoAxis  = dims[2].axis;

    const scaleLargo = LANE_TARGET_LENGTH_EACH / dims[0].value;
    const scaleAncho = LANE_TARGET_WIDTH / dims[1].value;
    const scaleAlto  = (scaleLargo + scaleAncho) / 4;

    const scaleMap = { x: 1, y: 1, z: 1 };
    scaleMap[largoAxis] = scaleLargo;
    scaleMap[anchoAxis] = scaleAncho;
    scaleMap[altoAxis]  = scaleAlto;

    console.log(`✅ Escala por mitad: x=${scaleMap.x.toFixed(3)}, y=${scaleMap.y.toFixed(3)}, z=${scaleMap.z.toFixed(3)}`);

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

        console.log(`📍 Carril ${idx + 1} posicionado en (${m.position.x.toFixed(3)}, ${m.position.y.toFixed(3)}, ${m.position.z.toFixed(3)})`);

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
        console.log(`📐 Carril ${idx + 1} maxY final = ${bboxFinal.max.y.toFixed(3)}`);
        if (bboxFinal.max.y > maxTopY) maxTopY = bboxFinal.max.y;
    });

    console.log(`✅ Ambos carriles unidos (solape ${LANE_OVERLAP})`);
    console.log(`📐 Superficie superior real del carril: y = ${maxTopY.toFixed(3)}`);

    LANE_TOP_Y = maxTopY;
    GROUND_Y = maxTopY - 0.12;

    console.log(`✅ GROUND_Y actualizado a ${GROUND_Y.toFixed(3)} (offset -0.12)`);
    groundReady = true;

    console.log(`🏗️ Creando torres, nexos y tiendas con GROUND_Y = ${GROUND_Y.toFixed(3)}...`);

    if (!nexusAliado) nexusAliado = new Nexus(0, -26, false);
    if (!nexusEnemigo) nexusEnemigo = new Nexus(0, 26, true);
    if (!shopAliada) shopAliada = new Shop(-6, -29, false);
    if (!shopEnemiga) shopEnemiga = new Shop(5.5, 30.5, true);
    if (towers.length === 0) {
        // ✅ FIX: torres pegadas al borde del carril
        createTower(-3.5, -18, false, 1);
        createTower(-3.5, -6, false, 2);
        createTower(4.2, 18, true, 1);
        createTower(4.2, 6, true, 2);
    }

    console.log(`✅ ${towers.length} torres, 2 nexos, 2 tiendas creadas en Y=${GROUND_Y.toFixed(3)}`);
    
    inicializarCamaraFija();

    if (typeof actualizarPantallaCarga === 'function') {
        actualizarPantallaCarga(100, '¡Listo!');
    }
};

let nexusAliado = null;
let nexusEnemigo = null;
let shopAliada = null;
let shopEnemiga = null;

cargarLanePart(0);
cargarLanePart(1);

const lineMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, emissive: 0x4488ff, emissiveIntensity: 0.2 });
for (let z = -24; z <= 24; z += 4) {
    const lineLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 1.5), lineMat);
    lineLeft.rotation.x = -Math.PI / 2;
    lineLeft.position.set(-4.8, -0.4, z);
    lineLeft.visible = false;
    scene.add(lineLeft);
    const lineRight = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 1.5), lineMat);
    lineRight.rotation.x = -Math.PI / 2;
    lineRight.position.set(4.8, -0.4, z);
    lineRight.visible = false;
    scene.add(lineRight);
}

const centerLineMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, emissive: 0x4488ff, emissiveIntensity: 0.1, transparent: true, opacity: 0.4 });
for (let z = -24; z <= 24; z += 4) {
    const center = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.8), centerLineMat);
    center.rotation.x = -Math.PI / 2;
    center.position.set(0, -0.4, z);
    center.visible = false;
    scene.add(center);
}

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

        this.group = new THREE.Group();
        this.group.userData.targetRef = this;

        const baseGeo = new THREE.CylinderGeometry(3, 3.5, 0.5, 24);
        const baseMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.5 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0;
        base.userData.targetRef = this;
        this.group.add(base);

        const ringGeo = new THREE.TorusGeometry(2.5, 0.1, 12, 24);
        const ringMat = new THREE.MeshStandardMaterial({ color: emissiveColor, emissive: emissiveColor, emissiveIntensity: 0.3 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 0.3;
        ring.rotation.x = Math.PI / 2;
        ring.userData.targetRef = this;
        this.group.add(ring);

        this.nexusGeo = new THREE.SphereGeometry(1.5, 24, 24);
        this.nexusMat = new THREE.MeshStandardMaterial({
            color: emissiveColor,
            roughness: 0.1,
            metalness: 0.9,
            emissive: emissiveColor,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.85
        });
        this.nexusMesh = new THREE.Mesh(this.nexusGeo, this.nexusMat);
        this.nexusMesh.position.y = 1.5;
        this.nexusMesh.userData.targetRef = this;
        this.group.add(this.nexusMesh);

        const particleMat = new THREE.PointsMaterial({
            color: emissiveColor,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const particleCount = 30;
        const particleGeo = new THREE.BufferGeometry();
        const particlePos = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i++) {
            particlePos[i] = (Math.random() - 0.5) * 4;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
        this.particles = new THREE.Points(particleGeo, particleMat);
        this.particles.position.y = 1.5;
        this.particles.userData.targetRef = this;
        this.group.add(this.particles);

        const healthBar = createHealthBar(this.segments, this.isEnemy);
        healthBar.sprite.position.y = 2.8;
        this.group.add(healthBar.sprite);
        this.spriteMat = healthBar.spriteMat;
        this.healthSprite = healthBar.sprite;

        this.group.position.set(x, GROUND_Y, z);
        scene.add(this.group);
        this.position = new THREE.Vector3(x, 0, z);
    }

    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        const visibleSegments = Math.max(0, Math.min(this.segments, Math.ceil(healthPercent * this.segments)));
        updateHealthBarSprite(this.spriteMat, this.segments, visibleSegments, this.isEnemy);
    }

    takeDamage(damage) {
        if (this.isDead) return;
        this.health -= damage;
        this.updateHealthBar();
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            this.startExplosion();
            console.log(`💀 NEXO ${this.isEnemy ? 'ENEMIGO' : 'ALIADO'} DESTRUIDO!`);
            if (this.isEnemy) {
                showVictoryScreen();
            } else {
                showDefeatScreen();
            }
        }
    }

    startExplosion() {
        if (this.isExploding) return;
        this.isExploding = true;
        this.group.visible = false;
        const colors = [0xff4444, 0xff8800, 0xffff00, 0xffaa44, 0xff2244];
        const position = this.group.position.clone();
        position.y = 1.5;
        for (let i = 0; i < 80; i++) {
            const size = 0.1 + Math.random() * 0.3;
            const geo = new THREE.SphereGeometry(size, 6, 6);
            const mat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                transparent: true,
                opacity: 0.8 + Math.random() * 0.2
            });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(position);
            p.position.x += (Math.random() - 0.5) * 0.5;
            p.position.z += (Math.random() - 0.5) * 0.5;
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            const angleY = Math.random() * Math.PI * 2;
            p.userData.vel = new THREE.Vector3(
                Math.cos(angle) * Math.cos(angleY) * speed,
                Math.sin(angleY) * speed * 1.5,
                Math.sin(angle) * Math.cos(angleY) * speed
            );
            p.userData.life = 1.5 + Math.random() * 1.5;
            p.userData.maxLife = p.userData.life;
            p.userData.rotSpeed = (Math.random() - 0.5) * 10;
            scene.add(p);
            this.explosionParticles.push(p);
        }
        const ringGeo2 = new THREE.TorusGeometry(0.5, 0.1, 12, 24);
        const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.8 });
        const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
        ring2.position.copy(position);
        ring2.rotation.x = Math.PI / 2;
        ring2.userData.life = 1.0;
        ring2.userData.maxLife = 1.0;
        scene.add(ring2);
        this.explosionParticles.push(ring2);
        for (let i = 0; i < 20; i++) {
            const size = 0.02 + Math.random() * 0.06;
            const geo = new THREE.SphereGeometry(size, 4, 4);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(position);
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 2;
            p.position.x += Math.cos(angle) * dist;
            p.position.z += Math.sin(angle) * dist;
            p.position.y += Math.random() * 2;
            p.userData.vel = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 3,
                (Math.random() - 0.5) * 2
            );
            p.userData.life = 0.5 + Math.random() * 0.5;
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
            if (p.userData.life <= 0) {
                scene.remove(p);
                this.explosionParticles.splice(i, 1);
                continue;
            }
            const lifeRatio = p.userData.life / p.userData.maxLife;
            if (p.geometry.type === 'SphereGeometry') {
                p.position.x += p.userData.vel.x * delta;
                p.position.y += p.userData.vel.y * delta;
                p.position.z += p.userData.vel.z * delta;
                p.userData.vel.y -= 2 * delta;
                p.material.opacity = lifeRatio * 0.8;
                const s = 0.5 + lifeRatio * 0.5;
                p.scale.set(s, s, s);
                p.rotation.x += p.userData.rotSpeed * delta;
                p.rotation.y += p.userData.rotSpeed * delta;
            } else if (p.geometry.type === 'TorusGeometry') {
                const scale = 1 + (1 - lifeRatio) * 3;
                p.scale.set(scale, scale, scale);
                p.material.opacity = lifeRatio * 0.8;
            }
        }
    }

    die() { this.takeDamage(this.health); }
}

let shopUI = null;
let shopOpen = false;
let shopActiveTab = 'potions';

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
        const color = isEnemy ? 0x882222 : 0x224488;
        const emissiveColor = isEnemy ? 0xff4444 : 0x4488ff;

        const baseGeo = new THREE.CylinderGeometry(1.8, 2.2, 0.3, 20);
        const baseMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.5 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0;
        base.userData.shopRef = this;
        this.group.add(base);

        const ringGeo = new THREE.TorusGeometry(1.5, 0.06, 10, 20);
        const ringMat = new THREE.MeshStandardMaterial({ color: emissiveColor, emissive: emissiveColor, emissiveIntensity: 0.3 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 0.2;
        ring.rotation.x = Math.PI / 2;
        ring.userData.shopRef = this;
        this.group.add(ring);

        this.cofreGroup = new THREE.Group();
        this.cofreGroup.position.set(0.6, 0.15, -0.6);

        const cofreBaseGeo = new THREE.BoxGeometry(0.7, 0.4, 0.5);
        const cofreBaseMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.7, metalness: 0.2 });
        this.cofreBase = new THREE.Mesh(cofreBaseGeo, cofreBaseMat);
        this.cofreBase.position.y = 0.2;
        this.cofreBase.userData.shopRef = this;
        this.cofreGroup.add(this.cofreBase);

        const goldMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.3, metalness: 0.9 });
        const cofreTrimGeo = new THREE.BoxGeometry(0.72, 0.05, 0.52);
        const cofreTrim = new THREE.Mesh(cofreTrimGeo, goldMat);
        cofreTrim.position.y = 0.4;
        cofreTrim.userData.shopRef = this;
        this.cofreGroup.add(cofreTrim);

        this.cofreTapaGroup = new THREE.Group();
        this.cofreTapaGroup.position.set(0, 0.4, -0.25);

        const tapaGeo = new THREE.BoxGeometry(0.7, 0.1, 0.5);
        const tapaMat = new THREE.MeshStandardMaterial({ color: 0x6B3A1B, roughness: 0.7, metalness: 0.2 });
        const tapa = new THREE.Mesh(tapaGeo, tapaMat);
        tapa.position.set(0, 0.05, 0.25);
        tapa.userData.shopRef = this;
        this.cofreTapaGroup.add(tapa);

        const tapaTrimGeo = new THREE.BoxGeometry(0.72, 0.05, 0.05);
        const tapaTrim = new THREE.Mesh(tapaTrimGeo, goldMat);
        tapaTrim.position.set(0, 0.1, 0.5);
        tapaTrim.userData.shopRef = this;
        this.cofreTapaGroup.add(tapaTrim);

        this.cofreGroup.add(this.cofreTapaGroup);

        const glowGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.0 });
        this.cofreGlow = new THREE.Mesh(glowGeo, glowMat);
        this.cofreGlow.position.y = 0.3;
        this.cofreGlow.userData.shopRef = this;
        this.cofreGroup.add(this.cofreGlow);

        this.group.add(this.cofreGroup);

        this.npcGroup = new THREE.Group();
        this.npcGroup.position.set(-0.9, 0.15, 0);
        this.group.add(this.npcGroup);

        this.npcModel = null;
        this.npcMixer = null;
        this.npcAnimIdle = null;

        scene.add(this.group);
        this.loadNPC();
    }

    loadNPC() {
        const loader = new GLTFLoader();
        const npcPath = this.isEnemy
            ? '/axie-3d-assets/assets/sapidae/sapidae-m-a.glb'
            : '/axie-3d-assets/assets/sapidae/sapidae-f-a.glb';
        loader.load(
            npcPath,
            (gltf) => {
                console.log(`✅ NPC de tienda cargado (${this.isEnemy ? 'enemiga' : 'aliada'})`);
                this.npcModel = gltf.scene;
                this.npcModel.scale.set(1.0, 1.0, 1.0);
                this.npcModel.rotation.y = 0;
                this.npcModel.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = false;
                        node.receiveShadow = false;
                        node.userData.shopRef = this;
                    }
                });
                this.npcGroup.add(this.npcModel);
                if (gltf.animations && gltf.animations.length > 0) {
                    this.npcMixer = new THREE.AnimationMixer(this.npcModel);
                    gltf.animations.forEach(clip => {
                        const name = clip.name.toLowerCase();
                        if (name.includes('idle')) {
                            this.npcAnimIdle = this.npcMixer.clipAction(clip);
                        }
                    });
                    if (this.npcAnimIdle) {
                        this.npcAnimIdle.play();
                    }
                }
            },
            undefined,
            (error) => {
                console.error(`❌ Error cargando NPC de tienda:`, error);
                const fallback = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 1, 0.5),
                    new THREE.MeshStandardMaterial({ color: this.isEnemy ? 0xaa3333 : 0x3366aa })
                );
                fallback.position.y = 0.5;
                fallback.userData.shopRef = this;
                this.npcGroup.add(fallback);
            }
        );
    }

    update(delta, playerPos) {
        if (this.npcGroup) {
            this.npcGroup.rotation.y = Math.sin(gameTime * 1.5) * 0.15;
        }
        if (playerPos) {
            const dist = Math.sqrt(
                Math.pow(playerPos.x - this.x, 2) +
                Math.pow(playerPos.z - this.z, 2)
            );
            const abrir = dist < 5.0;
            const targetRotation = abrir ? -Math.PI / 2.5 : 0;
            this.cofreTapaGroup.rotation.x += (targetRotation - this.cofreTapaGroup.rotation.x) * Math.min(1, 6 * delta);
            const targetOpacity = abrir ? 0.6 : 0.0;
            this.cofreGlow.material.opacity += (targetOpacity - this.cofreGlow.material.opacity) * Math.min(1, 6 * delta);
        }
        if (this.npcMixer) {
            this.npcMixer.update(delta);
        }
    }
}

function createShopUI() {
    if (shopUI) { shopUI.remove(); }
    shopUI = document.createElement('div');
    shopUI.id = 'shop-ui';
    shopUI.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 600px;
        max-height: 70vh;
        background: rgba(0,0,0,0.95);
        border: 3px solid rgba(255,200,50,0.6);
        border-radius: 16px;
        z-index: 2000;
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #fff;
        display: none;
        flex-direction: column;
        box-shadow: 0 0 50px rgba(0,0,0,0.9);
        pointer-events: auto;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background: rgba(255,200,50,0.1);
        border-bottom: 2px solid rgba(255,200,50,0.3);
        border-radius: 13px 13px 0 0;
    `;

    const title = document.createElement('div');
    title.textContent = '🏪 TIENDA';
    title.style.cssText = `
        font-size: 24px;
        font-weight: bold;
        color: #ffcc44;
        letter-spacing: 3px;
        text-shadow: 0 0 15px rgba(255,204,68,0.5);
    `;
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
        background: rgba(255,68,68,0.2);
        border: 2px solid rgba(255,68,68,0.6);
        color: #ff4444;
        font-size: 20px;
        font-weight: bold;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    `;
    closeBtn.onmouseenter = () => { closeBtn.style.background = 'rgba(255,68,68,0.5)'; closeBtn.style.color = '#fff'; };
    closeBtn.onmouseleave = () => { closeBtn.style.background = 'rgba(255,68,68,0.2)'; closeBtn.style.color = '#ff4444'; };
    closeBtn.onclick = () => closeShop();
    header.appendChild(closeBtn);

    shopUI.appendChild(header);

    const tabs = document.createElement('div');
    tabs.style.cssText = `display: flex; gap: 5px; padding: 10px 20px; background: rgba(0,0,0,0.5);`;

    const potionsTab = document.createElement('button');
    potionsTab.textContent = '🧪 Pociones';
    potionsTab.dataset.tab = 'potions';
    potionsTab.className = 'shop-tab active';
    potionsTab.style.cssText = `
        flex: 1;
        padding: 12px;
        background: rgba(68,255,136,0.2);
        border: 2px solid rgba(68,255,136,0.6);
        color: #44ff88;
        font-size: 16px;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    `;
    potionsTab.onclick = () => switchTab('potions');
    tabs.appendChild(potionsTab);

    const itemsTab = document.createElement('button');
    itemsTab.textContent = '⚔️ Items';
    itemsTab.dataset.tab = 'items';
    itemsTab.className = 'shop-tab';
    itemsTab.style.cssText = `
        flex: 1;
        padding: 12px;
        background: rgba(136,170,255,0.1);
        border: 2px solid rgba(136,170,255,0.3);
        color: #88aaff;
        font-size: 16px;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    `;
    itemsTab.onclick = () => switchTab('items');
    tabs.appendChild(itemsTab);

    shopUI.appendChild(tabs);

    const content = document.createElement('div');
    content.id = 'shop-content';
    content.style.cssText = `flex: 1; padding: 20px; overflow-y: auto; min-height: 300px;`;
    shopUI.appendChild(content);

    document.body.appendChild(shopUI);

    document.addEventListener('mousedown', (e) => {
        if (shopOpen && shopUI && !shopUI.contains(e.target)) {
            const shopClick = getShopFromClick(e);
            if (!shopClick) {
                closeShop();
            }
        }
    });
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
    if (shopActiveTab === 'potions') {
        renderPotions(content);
    } else {
        renderItems(content);
    }
}

function renderPotions(container) {
    const potions = [
        { id: 'hp', emoji: '🧪', name: 'Poción de HP', desc: '+50 HP', color: '#ff6644', count: potionHPCount, max: CONFIG.SHOP_POTION_LIMIT },
        { id: 'mp', emoji: '💧', name: 'Poción de MP', desc: '+50 MP', color: '#44aaff', count: potionMPCount, max: CONFIG.SHOP_POTION_LIMIT }
    ];
    potions.forEach(p => {
        const item = createShopItem(p.emoji, p.name, p.desc, p.color, `Tienes: ${p.count}/${p.max}`, () => {
            buyPotion(p.id);
        });
        container.appendChild(item);
    });
}

function renderItems(container) {
    const items = [
        { id: 'botas', emoji: '👢', name: 'Botas', desc: '+Velocidad de movimiento', color: '#88ff88' },
        { id: 'espada', emoji: '⚔️', name: 'Espada', desc: '+Daño físico', color: '#ff8844' },
        { id: 'arco', emoji: '🏹', name: 'Arco', desc: '+Velocidad de ataque', color: '#ffaa44' },
        { id: 'baculo', emoji: '🔮', name: 'Báculo', desc: '+Ataque mágico', color: '#aa88ff' },
        { id: 'daga', emoji: '🗡️', name: 'Daga', desc: '+Daño crítico', color: '#ff4488' }
    ];
    items.forEach(item => {
        const shopItem = createShopItem(item.emoji, item.name, item.desc, item.color, 'Comprar', () => {
            buyItem(item.id);
        });
        container.appendChild(shopItem);
    });
}

function createShopItem(emoji, name, desc, color, buttonText, onBuy) {
    const item = document.createElement('div');
    item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 12px 15px;
        margin-bottom: 10px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 10px;
        transition: all 0.2s;
    `;
    item.onmouseenter = () => { item.style.background = 'rgba(255,255,255,0.1)'; item.style.borderColor = color; };
    item.onmouseleave = () => { item.style.background = 'rgba(255,255,255,0.05)'; item.style.borderColor = 'rgba(255,255,255,0.1)'; };

    const icon = document.createElement('div');
    icon.textContent = emoji;
    icon.style.cssText = `font-size: 36px; width: 50px; text-align: center;`;
    item.appendChild(icon);

    const info = document.createElement('div');
    info.style.cssText = 'flex: 1;';
    const itemName = document.createElement('div');
    itemName.textContent = name;
    itemName.style.cssText = `font-size: 16px; font-weight: bold; color: ${color}; margin-bottom: 3px;`;
    info.appendChild(itemName);
    const itemDesc = document.createElement('div');
    itemDesc.textContent = desc;
    itemDesc.style.cssText = `font-size: 12px; color: #aaa;`;
    info.appendChild(itemDesc);
    item.appendChild(info);

    const buyBtn = document.createElement('button');
    buyBtn.textContent = buttonText;
    buyBtn.style.cssText = `
        padding: 10px 20px;
        background: linear-gradient(135deg, ${color}, ${color}88);
        border: none;
        color: #000;
        font-size: 14px;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 100px;
    `;
    buyBtn.onmouseenter = () => { buyBtn.style.transform = 'scale(1.05)'; };
    buyBtn.onmouseleave = () => { buyBtn.style.transform = 'scale(1)'; };
    buyBtn.onclick = onBuy;
    item.appendChild(buyBtn);

    return item;
}

function openShop() {
    if (!shopUI) { createShopUI(); }
    shopOpen = true;
    shopUI.style.display = 'flex';
    switchTab('potions');
    console.log('🏪 Tienda abierta');
}

function closeShop() {
    if (shopUI) { shopUI.style.display = 'none'; }
    shopOpen = false;
    console.log('🏪 Tienda cerrada');
}

function buyPotion(type) {
    if (type === 'hp') {
        if (potionHPCount >= CONFIG.SHOP_POTION_LIMIT) { return; }
        potionHPCount++;
    } else if (type === 'mp') {
        if (potionMPCount >= CONFIG.SHOP_POTION_LIMIT) { return; }
        potionMPCount++;
    }
    updatePotionHUD();
    renderShopContent();
}

function buyItem(itemId) {
    let slotIndex = -1;
    for (let i = 0; i < itemSlots.length; i++) {
        if (!itemSlots[i].dataset.itemName) { slotIndex = i; break; }
    }
    if (slotIndex === -1) { return; }

    const itemsConfig = {
        'botas': { emoji: '👢', name: 'Botas', color: '#88ff88' },
        'espada': { emoji: '⚔️', name: 'Espada', color: '#ff8844' },
        'arco': { emoji: '🏹', name: 'Arco', color: '#ffaa44' },
        'baculo': { emoji: '🔮', name: 'Báculo', color: '#aa88ff' },
        'daga': { emoji: '🗡️', name: 'Daga', color: '#ff4488' }
    };
    const config = itemsConfig[itemId];
    if (!config) return;

    const slot = itemSlots[slotIndex];
    slot.dataset.itemName = itemId;
    slot.textContent = config.emoji;
    slot.style.fontSize = '20px';
    slot.style.color = config.color;
    slot.style.background = `${config.color}22`;
    slot.style.borderColor = config.color;
    renderShopContent();
}

function getShopFromClick(event) {
    if (!renderer) return null;
    let rect = renderer.domElement.getBoundingClientRect();
    let mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    let selectables = [];
    [shopAliada, shopEnemiga].forEach(shop => {
        if (!shop) return;
        shop.group.traverse(child => {
            if (child.isMesh) { selectables.push(child); }
        });
    });

    let intersects = raycaster.intersectObjects(selectables);
    if (intersects.length > 0) {
        let parent = intersects[0].object;
        while (parent) {
            if (parent.userData && parent.userData.shopRef) { return parent.userData.shopRef; }
            parent = parent.parent;
        }
    }
    return null;
}

renderer.domElement.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (shopOpen) return;

    const shop = getShopFromClick(e);
    if (shop) {
        if (playerModel && !isPlayerDead) {
            const dist = Math.sqrt(
                Math.pow(playerModel.position.x - shop.x, 2) +
                Math.pow(playerModel.position.z - shop.z, 2)
            );
            if (dist <= CONFIG.SHOP_INTERACTION_DISTANCE) {
                if (!shop.isEnemy) { openShop(); }
                else { console.log('⛔ Esta es la tienda enemiga'); }
            } else {
                if (!shop.isEnemy) {
                    isAutoWalkingToShop = true;
                    autoWalkShopTarget = shop;
                    const dx = shop.x - playerModel.position.x;
                    const dz = shop.z - playerModel.position.z;
                    const mag = Math.sqrt(dx * dx + dz * dz);
                    const stopDistance = 2.5;
                    const targetX = shop.x - (dx / mag) * stopDistance;
                    const targetZ = shop.z - (dz / mag) * stopDistance;
                    targetPosition = new THREE.Vector3(targetX, GROUND_Y, targetZ);
                    smoothTargetPos.copy(targetPosition);
                    isMovingToTarget = true;
                    isAutoMovingToTarget = false;
                    window.currentTarget = null;
                    targetUI.style.display = 'none';
                } else {
                    console.log('⛔ No puedes ir a la tienda enemiga');
                }
            }
        }
    }
}, true);

class TowerProjectile {
    constructor(startPos, target, isEnemy = false, damage = 20) {
        this.target = target;
        this.damage = damage;
        this.isEnemy = isEnemy;
        this.speed = CONFIG.projectileSpeed;
        this.active = true;
        this.targetRef = target;
        const color = isEnemy ? 0xff4444 : 0x4488ff;
        const geo = new THREE.SphereGeometry(0.12, 8, 8);
        const mat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(startPos);
        this.mesh.position.y = 0.3;
        scene.add(this.mesh);
        const glowGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.15 });
        this.glow = new THREE.Mesh(glowGeo, glowMat);
        this.glow.position.copy(this.mesh.position);
        scene.add(this.glow);
        this.targetPosition = target.group.position.clone();
        this.targetPosition.y = 0.3;
        this.direction = new THREE.Vector3().copy(this.targetPosition).sub(this.mesh.position);
        this.direction.y = 0;
        this.direction.normalize();
        const angle = Math.atan2(this.direction.x, this.direction.z);
        this.mesh.rotation.y = angle;
    }

    update(delta) {
        if (!this.active) return;
        if (!this.targetRef || !this.targetRef.group) {
            this.cleanup(); return;
        }
        if (this.targetRef.isDead) {
            this.active = false;
            scene.remove(this.mesh);
            scene.remove(this.glow);
            return;
        }
        this.targetPosition.copy(this.targetRef.group.position);
        this.targetPosition.y = 0.3;
        this.direction = new THREE.Vector3().copy(this.targetPosition).sub(this.mesh.position);
        this.direction.y = 0;
        this.direction.normalize();
        this.mesh.position.x += this.direction.x * this.speed * delta;
        this.mesh.position.z += this.direction.z * this.speed * delta;
        this.glow.position.copy(this.mesh.position);
        this.mesh.rotation.x += delta * 5;
        this.mesh.rotation.z += delta * 3;
        const dist = this.mesh.position.distanceTo(this.targetRef.group.position);
        if (dist < 0.8) { this.hit(); }
        if (Math.abs(this.mesh.position.x) > 20 || Math.abs(this.mesh.position.z) > 30) {
            this.active = false;
            scene.remove(this.mesh);
            scene.remove(this.glow);
        }
    }

    hit() {
        if (!this.active) return;
        this.active = false;
        if (!this.targetRef.isDead) {
            if (this.targetRef.type === 'player') {
                playerTakeDamage(this.damage);
            } else if (this.targetRef.type === 'enemy_axie' && enemyAxie) {
                enemyAxieTakeDamage(this.damage);
            } else {
                this.targetRef.health -= this.damage;
                if (this.targetRef.updateHealthBar) { this.targetRef.updateHealthBar(); }
                if (this.targetRef.health <= 0) {
                    if (this.targetRef.die) { this.targetRef.die(); }
                }
            }
            this.createExplosion();
        }
        scene.remove(this.mesh);
        scene.remove(this.glow);
    }

    cleanup() {
        this.active = false;
        if (this.mesh) scene.remove(this.mesh);
        if (this.glow) scene.remove(this.glow);
    }

    createExplosion() {
        const color = this.isEnemy ? 0xff4444 : 0x4488ff;
        for (let i = 0; i < 8; i++) {
            const size = 0.03 + Math.random() * 0.04;
            const geo = new THREE.SphereGeometry(size, 4, 4);
            const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.7 });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(this.mesh.position);
            p.position.y = 0.3;
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            p.userData.vel = new THREE.Vector3(Math.cos(angle) * speed, Math.random() * 2, Math.sin(angle) * speed);
            p.userData.life = 0.5 + Math.random() * 0.3;
            scene.add(p);
            const startTime = performance.now();
            const animateParticle = () => {
                const elapsed = (performance.now() - startTime) / 1000;
                if (elapsed > p.userData.life) { scene.remove(p); return; }
                p.position.x += p.userData.vel.x * 0.02;
                p.position.y += p.userData.vel.y * 0.02;
                p.position.z += p.userData.vel.z * 0.02;
                p.userData.vel.y -= 0.05;
                p.material.opacity = 0.7 * (1 - elapsed / p.userData.life);
                requestAnimationFrame(animateParticle);
            };
            animateParticle();
        }
    }
}

class PlayerProjectile {
    constructor(startPos, target, damage = 15) {
        this.target = target;
        this.damage = damage;
        this.speed = CONFIG.projectileSpeed;
        this.active = true;
        this.targetRef = target;
        const color = 0x44ff88;
        const geo = new THREE.SphereGeometry(0.15, 8, 8);
        const mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 1.0, transparent: true, opacity: 0.9 });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(startPos);
        this.mesh.position.y = 0.5;
        scene.add(this.mesh);
        const glowGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.15 });
        this.glow = new THREE.Mesh(glowGeo, glowMat);
        this.glow.position.copy(this.mesh.position);
        scene.add(this.glow);
        this.startPos = startPos.clone();
        this.endPos = target.group.position.clone();
        this.endPos.y = 0.5;
        this.progress = 0;
    }

    update(delta) {
        if (!this.active) return;
        if (!this.targetRef || !this.targetRef.group) {
            this.active = false;
            scene.remove(this.mesh);
            scene.remove(this.glow);
            return;
        }
        if (this.targetRef.isDead) {
            this.active = false;
            scene.remove(this.mesh);
            scene.remove(this.glow);
            return;
        }
        this.endPos.copy(this.targetRef.group.position);
        this.endPos.y = 0.5;
        this.progress += delta * this.speed;
        if (this.progress >= 1) { this.hit(); return; }
        const currentPos = new THREE.Vector3().lerpVectors(this.startPos, this.endPos, this.progress);
        this.mesh.position.copy(currentPos);
        this.glow.position.copy(currentPos);
        this.mesh.rotation.x += delta * 15;
        this.mesh.rotation.z += delta * 10;
    }

    hit() {
        if (!this.active) return;
        this.active = false;
        if (this.targetRef.isDead) {
            scene.remove(this.mesh);
            scene.remove(this.glow);
            return;
        }
        if (this.targetRef.type === 'enemy_axie' && enemyAxie) {
            enemyAxieTakeDamage(this.damage);
        } else if (this.targetRef.isEnemy === true) {
            this.targetRef.health -= this.damage;
            if (this.targetRef.updateHealthBar) { this.targetRef.updateHealthBar(); }
            if (window.currentTarget === this.targetRef) { window.showTarget(this.targetRef); }
            if (this.targetRef.health <= 0) {
                if (this.targetRef.die) { this.targetRef.die(); }
                if (window.currentTarget === this.targetRef) {
                    window.currentTarget = null;
                    targetUI.style.display = 'none';
                }
            }
        } else if (this.targetRef.isEnemy === false) {
            console.log('⛔ No se puede atacar a un aliado');
        }
        this.createExplosion();
        playerAttackTarget = this.targetRef;
        setTimeout(() => { playerAttackTarget = null; }, 2000);
        scene.remove(this.mesh);
        scene.remove(this.glow);
    }

    createExplosion() {
        const color = 0x44ff88;
        const pos = this.mesh.position.clone();
        for (let i = 0; i < 8; i++) {
            const size = 0.03 + Math.random() * 0.04;
            const geo = new THREE.SphereGeometry(size, 4, 4);
            const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6 });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos);
            p.position.y = 0.5;
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            p.userData.vel = new THREE.Vector3(Math.cos(angle) * speed, Math.random() * 2, Math.sin(angle) * speed);
            p.userData.life = 0.3 + Math.random() * 0.3;
            scene.add(p);
            const startTime = performance.now();
            const animateParticle = function () {
                const elapsed = (performance.now() - startTime) / 1000;
                if (elapsed > p.userData.life) { scene.remove(p); return; }
                p.position.x += p.userData.vel.x * 0.02;
                p.position.y += p.userData.vel.y * 0.02;
                p.position.z += p.userData.vel.z * 0.02;
                p.userData.vel.y -= 0.05;
                p.material.opacity = 0.6 * (1 - elapsed / p.userData.life);
                requestAnimationFrame(animateParticle);
            };
            animateParticle();
        }
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

        const scale = tier === 2 ? 1.3 : 1.0;
        const color = isEnemy ? 0xcc4444 : 0x4488cc;
        const emissiveColor = isEnemy ? 0xff4444 : 0x4488ff;

        this.group = new THREE.Group();
        this.group.userData.targetRef = this;

        const baseGeo = new THREE.CylinderGeometry(0.9 * scale, 1.1 * scale, 0.3 * scale, 12);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.8, metalness: 0.2 });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = 0.15 * scale;
        baseMesh.userData.targetRef = this;
        this.group.add(baseMesh);

        const bodyGeo = new THREE.SphereGeometry(0.5 * scale, 8, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5, metalness: 0.3 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(1, 1.2, 0.8);
        body.position.y = 0.9 * scale;
        body.userData.targetRef = this;
        this.group.add(body);

        const headGeo = new THREE.SphereGeometry(0.35 * scale, 8, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.2 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.scale.set(1, 0.9, 0.9);
        head.position.set(0, 1.5 * scale, 0);
        head.userData.targetRef = this;
        this.group.add(head);

        const eyeGeo = new THREE.SphereGeometry(0.06 * scale, 8, 8);
        const eyeMat = new THREE.MeshStandardMaterial({ color: emissiveColor, emissive: emissiveColor, emissiveIntensity: 0.8 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-0.12 * scale, 1.55 * scale, 0.2 * scale);
        eyeL.userData.targetRef = this;
        this.group.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(0.12 * scale, 1.55 * scale, 0.2 * scale);
        eyeR.userData.targetRef = this;
        this.group.add(eyeR);

        const earGeo = new THREE.ConeGeometry(0.12 * scale, 0.25 * scale, 6);
        const earMat = new THREE.MeshStandardMaterial({ color: isEnemy ? 0xaa3333 : 0x3366aa, roughness: 0.6, metalness: 0.1 });
        const earL = new THREE.Mesh(earGeo, earMat);
        earL.position.set(-0.2 * scale, 1.7 * scale, 0);
        earL.rotation.z = -0.2;
        earL.userData.targetRef = this;
        this.group.add(earL);
        const earR = new THREE.Mesh(earGeo, earMat);
        earR.position.set(0.2 * scale, 1.7 * scale, 0);
        earR.rotation.z = 0.2;
        earR.userData.targetRef = this;
        this.group.add(earR);

        const armGeo = new THREE.CylinderGeometry(0.06 * scale, 0.08 * scale, 0.3 * scale, 6);
        const armMat = new THREE.MeshStandardMaterial({ color: isEnemy ? 0xaa3333 : 0x3366aa, roughness: 0.5, metalness: 0.2 });
        const armR = new THREE.Mesh(armGeo, armMat);
        armR.position.set(0.35 * scale, 0.9 * scale, 0);
        armR.rotation.z = -0.6;
        armR.rotation.x = 0.2;
        armR.userData.targetRef = this;
        this.group.add(armR);
        const armL = new THREE.Mesh(armGeo, armMat);
        armL.position.set(-0.35 * scale, 0.9 * scale, 0);
        armL.rotation.z = 0.6;
        armL.rotation.x = -0.2;
        armL.userData.targetRef = this;
        this.group.add(armL);

        this.staffGroup = new THREE.Group();
        this.staffGroup.position.set(0.4 * scale, 0.8 * scale, 0);
        this.staffGroup.rotation.z = -0.3;
        this.staffGroup.userData.targetRef = this;

        const staff = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03 * scale, 0.05 * scale, 1.2 * scale, 8),
            new THREE.MeshStandardMaterial({ color: 0xccaa88, metalness: 0.5, roughness: 0.3 })
        );
        staff.position.y = 0.6 * scale;
        staff.userData.targetRef = this;
        this.staffGroup.add(staff);

        this.gemGeo = new THREE.OctahedronGeometry(0.12 * scale);
        this.gemMat = new THREE.MeshStandardMaterial({
            color: emissiveColor,
            emissive: emissiveColor,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.9,
            roughness: 0.1,
            metalness: 0.9
        });
        this.gem = new THREE.Mesh(this.gemGeo, this.gemMat);
        this.gem.position.y = 1.2 * scale;
        this.gem.userData.targetRef = this;
        this.staffGroup.add(this.gem);

        const ringStaffGeo = new THREE.TorusGeometry(0.15 * scale, 0.02 * scale, 8, 12);
        const ringStaffMat = new THREE.MeshStandardMaterial({
            color: emissiveColor,
            emissive: emissiveColor,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7
        });
        const ringStaff = new THREE.Mesh(ringStaffGeo, ringStaffMat);
        ringStaff.position.y = 1.2 * scale;
        ringStaff.rotation.x = Math.PI / 2;
        ringStaff.userData.targetRef = this;
        this.staffGroup.add(ringStaff);

        this.group.add(this.staffGroup);

        const ringBaseGeo = new THREE.TorusGeometry(0.8 * scale, 0.04 * scale, 8, 16);
        const ringBaseMat = new THREE.MeshStandardMaterial({
            color: emissiveColor,
            emissive: emissiveColor,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.5
        });
        const ringBase = new THREE.Mesh(ringBaseGeo, ringBaseMat);
        ringBase.position.y = 0.3 * scale;
        ringBase.rotation.x = Math.PI / 2;
        ringBase.userData.targetRef = this;
        this.group.add(ringBase);

        const shieldGeo = new THREE.CylinderGeometry(0.5 * scale, 0.5 * scale, 0.02 * scale, 16);
        const shieldMat = new THREE.MeshStandardMaterial({
            color: isEnemy ? 0x882222 : 0x224488,
            metalness: 0.7,
            roughness: 0.3
        });
        const shield = new THREE.Mesh(shieldGeo, shieldMat);
        shield.position.y = 0.35 * scale;
        shield.userData.targetRef = this;
        this.group.add(shield);

        const symbolGeo = new THREE.RingGeometry(0.15 * scale, 0.25 * scale, 12);
        const symbolMat = new THREE.MeshStandardMaterial({
            color: emissiveColor,
            emissive: emissiveColor,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const symbol = new THREE.Mesh(symbolGeo, symbolMat);
        symbol.position.y = 0.36 * scale;
        symbol.rotation.x = -Math.PI / 2;
        symbol.userData.targetRef = this;
        this.group.add(symbol);

        if (tier === 2) {
            const crownGeo = new THREE.TorusGeometry(0.4 * scale, 0.05 * scale, 6, 12);
            const crownMat = new THREE.MeshStandardMaterial({
                color: 0xffdd44,
                emissive: 0xff8800,
                emissiveIntensity: 0.3,
                metalness: 0.8
            });
            const crown = new THREE.Mesh(crownGeo, crownMat);
            crown.position.y = 1.7 * scale;
            crown.rotation.x = Math.PI / 2;
            crown.userData.targetRef = this;
            this.group.add(crown);

            for (let i = 0; i < 4; i++) {
                const spikeGeo = new THREE.ConeGeometry(0.04 * scale, 0.12 * scale, 4);
                const spikeMat = new THREE.MeshStandardMaterial({
                    color: 0xffdd44,
                    emissive: 0xff8800,
                    emissiveIntensity: 0.2,
                    metalness: 0.8
                });
                const spike = new THREE.Mesh(spikeGeo, spikeMat);
                const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
                spike.position.set(Math.cos(angle) * 0.4 * scale, 1.8 * scale, Math.sin(angle) * 0.4 * scale);
                spike.rotation.x = Math.PI / 2;
                spike.rotation.z = angle;
                spike.userData.targetRef = this;
                this.group.add(spike);
            }
        }

        const glowGeo = new THREE.SphereGeometry(0.5 * scale, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: emissiveColor, transparent: true, opacity: 0.05 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.y = 1 * scale;
        glow.userData.targetRef = this;
        this.group.add(glow);

        const healthBar = createHealthBar(this.segments, this.isEnemy);
        healthBar.sprite.position.y = 2.2 * scale;
        this.group.add(healthBar.sprite);
        this.spriteMat = healthBar.spriteMat;
        this.healthSprite = healthBar.sprite;

        this.group.position.set(x, GROUND_Y, z);
        scene.add(this.group);

        this.position = new THREE.Vector3(x, 0, z);
        this.projectiles = [];
    }

    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        const visibleSegments = Math.max(0, Math.min(this.segments, Math.ceil(healthPercent * this.segments)));
        updateHealthBarSprite(this.spriteMat, this.segments, visibleSegments, this.isEnemy);
    }

    takeDamage(damage) {
        if (this.isDead) return;
        this.health -= damage;
        this.updateHealthBar();
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            this.group.visible = false;
            for (const proj of this.projectiles) {
                proj.active = false;
                scene.remove(proj.mesh);
                scene.remove(proj.glow);
            }
            this.projectiles = [];
            console.log(`💀 Torre ${this.isEnemy ? 'enemiga' : 'aliada'} destruida!`);
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
            if (dist < closestDist && dist <= this.range) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        }
        if (this.isEnemy && !closestEnemy && playerModel && !isPlayerDead) {
            const distToPlayer = this.position.distanceTo(playerModel.position);
            if (distToPlayer <= this.range) {
                closestEnemy = {
                    group: playerModel,
                    isDead: isPlayerDead,
                    health: playerHealth,
                    type: 'player',
                    updateHealthBar: function () { },
                    die: function () { }
                };
                closestDist = distToPlayer;
            }
        }
        if (!this.isEnemy && !closestEnemy && enemyAxieModel && !enemyAxieIsDead) {
            const distToEnemy = this.position.distanceTo(enemyAxieModel.position);
            if (distToEnemy <= this.range) {
                closestEnemy = {
                    group: enemyAxieModel,
                    isDead: enemyAxieIsDead,
                    health: enemyAxie ? enemyAxie.health : 0,
                    type: 'enemy_axie',
                    updateHealthBar: updateEnemyHealthBar,
                    takeDamage: enemyAxieTakeDamage,
                    die: function () {
                        enemyAxieIsDead = true;
                        enemyAxieRespawnTimer = CONFIG.RESPAWN_TIME;
                        if (enemyAxieModel) { enemyAxieModel.visible = false; }
                    }
                };
                closestDist = distToEnemy;
            }
        }
        this.target = closestEnemy;
        if (this.target && closestDist <= this.range) {
            const angle = Math.atan2(
                this.target.group.position.x - this.position.x,
                this.target.group.position.z - this.position.z
            );
            this.group.rotation.y = angle;
            if (this.cooldown <= 0) {
                this.fire();
                this.cooldown = this.fireRate;
            }
        }
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(delta);
            if (!proj.active) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    fire() {
        if (!this.target || this.isDead) return;
        const startPos = new THREE.Vector3();
        this.gem.getWorldPosition(startPos);
        const proj = new TowerProjectile(startPos, this.target, this.isEnemy, this.damage);
        this.projectiles.push(proj);
    }
}

const towers = [];

function createTower(x, z, isEnemy = false, tier = 1) {
    const tower = new AxieTower(x, z, isEnemy, tier);
    towers.push(tower);
    return tower;
}

const timerDiv = document.createElement('div');
timerDiv.id = 'timer-display';
timerDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    color: #44ff88;
    font-family: 'Courier New', monospace;
    font-size: 28px;
    font-weight: bold;
    background: rgba(0,0,0,0.8);
    padding: 8px 24px;
    border-radius: 12px;
    z-index: 100;
    pointer-events: none;
    text-align: center;
    border: 2px solid rgba(68,255,136,0.3);
    text-shadow: 0 0 20px rgba(68,255,136,0.3);
    letter-spacing: 2px;
`;
timerDiv.textContent = '00:00';
timerDiv.style.display = 'none';
document.body.appendChild(timerDiv);

const fpsDiv = document.createElement('div');
fpsDiv.id = 'fps-display';
fpsDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    color: #88aaff;
    font-family: 'Courier New', monospace;
    font-size: 18px;
    font-weight: bold;
    background: rgba(0,0,0,0.7);
    padding: 6px 14px;
    border-radius: 8px;
    z-index: 100;
    pointer-events: none;
    border: 1px solid rgba(136,170,255,0.2);
`;
fpsDiv.textContent = 'FPS: 0';
fpsDiv.style.display = 'none';
document.body.appendChild(fpsDiv);

const waveDiv = document.createElement('div');
waveDiv.id = 'wave-display';
waveDiv.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    color: #ffaa44;
    font-family: 'Courier New', monospace;
    font-size: 16px;
    font-weight: bold;
    background: rgba(0,0,0,0.7);
    padding: 4px 16px;
    border-radius: 8px;
    z-index: 100;
    pointer-events: none;
    text-align: center;
    border: 1px solid rgba(255,170,68,0.2);
`;
waveDiv.textContent = '⏳ 15s';
waveDiv.style.display = 'none';
document.body.appendChild(waveDiv);

class Minion {
    constructor(x, z, isEnemy = false, tipo = 'melee', formationIndex = 0) {
        this.isEnemy = isEnemy;
        this.tipo = tipo;
        this.formationIndex = formationIndex;
        this.minionType = tipo;
        this.maxHealth = tipo === 'mage' ? 60 : 100;
        this.health = this.maxHealth;
        this.speed = tipo === 'melee' ? CONFIG.meleeSpeed : CONFIG.mageSpeed;
        this.direction = isEnemy ? -1 : 1;
        this.attackDamage = tipo === 'mage' ? 15 : 10;
        this.attackRange = tipo === 'mage' ? 3.5 : 1.5;
        this.attackCooldown = 0;
        this.attackSpeed = tipo === 'mage' ? 1.5 : 1.0;
        this.state = 'move';
        this.target = null;
        this.isDead = false;
        this.segments = tipo === 'mage' ? 3 : 6;
        this.hpPerSegment = tipo === 'mage' ? 20 : 17;
        this.currentVisibleSegments = this.segments;
        this.attackTimer = 0;
        this.isAttacking = false;
        this.type = 'minion';

        this.agroTarget = null;
        this.chaseTimer = 0;
        this.isChasing = false;
        this.reevaluationTimer = 0;
        this.isGhost = false;
        this.ghostTimer = CONFIG.firstWaveGhostDuration;
        this.hasAttackedPlayer = false;

        this.lastAttackTime = 0;
        this.attackCount = 0;

        this.attackAnimTimer = 0;
        this.attackAnimDuration = 0.4;
        this.attackAnimActive = false;
        this.glbModel = null;
        this.staffMesh = null;

        this.mixer = null;
        this.actions = {};
        this.currentAction = null;

        this._attackTimeoutId = null;
        this._attackActive = false;
        this._attackStartTime = null;
        this._attackDurationMs = 0;

        const scale = 0.5;
        let lightColor, darkColor, eyeColor, cloakColor;

        if (isEnemy) {
            if (tipo === 'melee') { lightColor = 0xff5555; darkColor = 0xaa2222; cloakColor = 0x881111; }
            else { lightColor = 0xdd66cc; darkColor = 0x882266; cloakColor = 0x661144; }
            eyeColor = 0xffaa44;
        } else {
            if (tipo === 'melee') { lightColor = 0x5588ff; darkColor = 0x2244aa; cloakColor = 0x112288; }
            else { lightColor = 0x66ccff; darkColor = 0x226688; cloakColor = 0x114466; }
            eyeColor = 0x88ddff;
        }

        this.group = new THREE.Group();
        this.group.userData.targetRef = this;

        const usarGLB = isEnemy && tipo === 'mage';

        if (usarGLB) {
            this.pendingHealthBar = { segments: this.segments, isEnemy: this.isEnemy };
            this.loadMinionGLB(tipo);
        } else {
            this.buildProceduralModel(scale, lightColor, darkColor, eyeColor, cloakColor);
        }

        if (!usarGLB) {
            const texture = getHealthBarTexture(this.segments, this.segments, this.isEnemy);
            const spriteMat = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false,
                depthWrite: false,
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(0.7, 0.15, 1);
            sprite.position.y = 1.3 * scale;
            sprite.renderOrder = 999;
            this.group.add(sprite);
            this.spriteMat = spriteMat;
            this.healthSprite = sprite;
        }

        this.group.rotation.y = isEnemy ? Math.PI : 0;
        this.group.position.set(x, GROUND_Y - 0.5, z);
        scene.add(this.group);
        this.mesh = this.group;
    }

    buildProceduralModel(scale, lightColor, darkColor, eyeColor, cloakColor) {
        const bodyGeo = new THREE.SphereGeometry(0.3 * scale, 8, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: lightColor, roughness: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(0.9, 1.2, 0.8);
        body.position.y = 0.5 * scale;
        body.userData.targetRef = this;
        this.group.add(body);

        const cloakGeo = new THREE.ConeGeometry(0.35 * scale, 0.3 * scale, 6);
        const cloakMat = new THREE.MeshStandardMaterial({ color: cloakColor, roughness: 0.7 });
        const cloak = new THREE.Mesh(cloakGeo, cloakMat);
        cloak.position.y = 0.15 * scale;
        cloak.scale.set(1, 0.5, 0.8);
        cloak.userData.targetRef = this;
        this.group.add(cloak);

        const headGeo = new THREE.SphereGeometry(0.22 * scale, 8, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: lightColor, roughness: 0.5 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.scale.set(1, 0.9, 0.9);
        head.position.set(0, 0.9 * scale, 0);
        head.userData.targetRef = this;
        this.group.add(head);

        const earGeo = new THREE.ConeGeometry(0.08 * scale, 0.15 * scale, 4);
        const earMat = new THREE.MeshStandardMaterial({ color: darkColor, roughness: 0.7 });
        const earL = new THREE.Mesh(earGeo, earMat);
        earL.position.set(-0.15 * scale, 1.05 * scale, 0);
        earL.rotation.z = -0.2;
        earL.userData.targetRef = this;
        this.group.add(earL);
        const earR = new THREE.Mesh(earGeo, earMat);
        earR.position.set(0.15 * scale, 1.05 * scale, 0);
        earR.rotation.z = 0.2;
        earR.userData.targetRef = this;
        this.group.add(earR);

        const eyeGeo = new THREE.SphereGeometry(0.035 * scale, 6, 6);
        const eyeMat = new THREE.MeshStandardMaterial({ color: eyeColor, emissive: eyeColor, emissiveIntensity: 0.3 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-0.08 * scale, 0.92 * scale, 0.15 * scale);
        eyeL.userData.targetRef = this;
        this.group.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(0.08 * scale, 0.92 * scale, 0.15 * scale);
        eyeR.userData.targetRef = this;
        this.group.add(eyeR);

        const noseGeo = new THREE.SphereGeometry(0.025 * scale, 6, 6);
        const noseMat = new THREE.MeshStandardMaterial({ color: 0xff8888 });
        const nose = new THREE.Mesh(noseGeo, noseMat);
        nose.position.set(0, 0.88 * scale, 0.18 * scale);
        nose.userData.targetRef = this;
        this.group.add(nose);

        const armGeo = new THREE.CylinderGeometry(0.04 * scale, 0.05 * scale, 0.25 * scale, 6);
        const armMat = new THREE.MeshStandardMaterial({ color: lightColor, roughness: 0.6 });
        const armR = new THREE.Mesh(armGeo, armMat);
        armR.position.set(0.3 * scale, 0.6 * scale, 0);
        armR.rotation.z = -0.5;
        armR.userData.targetRef = this;
        this.group.add(armR);
        const armL = new THREE.Mesh(armGeo, armMat);
        armL.position.set(-0.3 * scale, 0.6 * scale, 0);
        armL.rotation.z = 0.5;
        armL.userData.targetRef = this;
        this.group.add(armL);

        const legGeo = new THREE.CylinderGeometry(0.06 * scale, 0.08 * scale, 0.15 * scale, 6);
        const legMat = new THREE.MeshStandardMaterial({ color: darkColor, roughness: 0.7 });
        const legL = new THREE.Mesh(legGeo, legMat);
        legL.position.set(-0.12 * scale, 0.08 * scale, 0);
        legL.userData.targetRef = this;
        this.group.add(legL);
        const legR = new THREE.Mesh(legGeo, legMat);
        legR.position.set(0.12 * scale, 0.08 * scale, 0);
        legR.userData.targetRef = this;
        this.group.add(legR);
    }

    loadMinionGLB(tipo) {
        const bodyPath = CONFIG.MINION_GLB_MAGE_ENEMY;

        const loader = new GLTFLoader();
        loader.load(
            bodyPath,
            (gltf) => {
                console.log(`✅ GLB minion ${tipo} enemigo cargado: ${bodyPath}`);
                while (this.group.children.length > 0) {
                    this.group.remove(this.group.children[0]);
                }

                const model = gltf.scene;

                const bbox = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                bbox.getSize(size);
                const currentHeight = size.y > 0.0001 ? size.y : 1;
                const scaleFactor = CONFIG.MINION_GLB_HEIGHT / currentHeight;
                model.scale.setScalar(scaleFactor);

                const bbox2 = new THREE.Box3().setFromObject(model);
                model.position.y = -bbox2.min.y;
                model.position.x = -(bbox2.min.x + bbox2.max.x) / 2;
                model.position.z = -(bbox2.min.z + bbox2.max.z) / 2;

                model.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = false;
                        node.receiveShadow = false;
                        node.userData.targetRef = this;
                        if (node.material) {
                            const mats = Array.isArray(node.material) ? node.material : [node.material];
                            mats.forEach(mat => {
                                if ('metalness' in mat) mat.metalness = 0.05;
                                if ('roughness' in mat) mat.roughness = 0.75;
                                if ('envMapIntensity' in mat) mat.envMapIntensity = 1.5;
                                mat.needsUpdate = true;
                            });
                        }
                    }
                });

                model.rotation.y = 0;
                this.group.add(model);
                this.glbModel = model;

                const texture = getHealthBarTexture(this.segments, this.segments, this.isEnemy);
                const spriteMat = new THREE.SpriteMaterial({
                    map: texture,
                    transparent: true,
                    depthTest: false,
                    depthWrite: false,
                });
                const sprite = new THREE.Sprite(spriteMat);
                sprite.scale.set(0.7, 0.15, 1);
                sprite.position.y = CONFIG.MINION_GLB_HEIGHT + 0.55;
                sprite.renderOrder = 999;
                this.group.add(sprite);
                this.spriteMat = spriteMat;
                this.healthSprite = sprite;

                this.loadMageAnimations(model);
                this.attachStaffToHand(model);
            },
            undefined,
            (error) => {
                console.error(`❌ Error cargando GLB de minion ${tipo}:`, error);
                const scale = 0.5;
                this.buildProceduralModel(scale, 0xff5555, 0xaa2222, 0xffaa44,
                    this.tipo === 'mage' ? 0x661144 : 0x881111);
                const texture = getHealthBarTexture(this.segments, this.segments, this.isEnemy);
                const spriteMat = new THREE.SpriteMaterial({
                    map: texture,
                    transparent: true,
                    depthTest: false,
                    depthWrite: false,
                });
                const sprite = new THREE.Sprite(spriteMat);
                sprite.scale.set(0.7, 0.15, 1);
                sprite.position.y = 1.3 * scale;
                sprite.renderOrder = 999;
                this.group.add(sprite);
                this.spriteMat = spriteMat;
                this.healthSprite = sprite;
            }
        );
    }

    async attachStaffToHand(model) {
        const staffTemplate = await loadStaffTemplate();
        if (!staffTemplate) {
            console.warn('⚠️ No se pudo cargar el báculo');
            return;
        }

        let handBone = null;
        model.traverse((node) => {
            if (!node.isBone) return;
            const cleanName = node.name.replace(/[:_\-]/g, '').toLowerCase();
            if (cleanName === 'mixamorigrighthand' || cleanName === 'righthand') {
                handBone = node;
            }
        });

        if (!handBone) {
            model.traverse((node) => {
                if (!node.isBone || handBone) return;
                const cleanName = node.name.replace(/[:_\-]/g, '').toLowerCase();
                if (cleanName.endsWith('hand') && !/(index|middle|ring|thumb|pinky)/i.test(cleanName)) {
                    handBone = node;
                }
            });
        }

        if (!handBone) {
            console.warn('⚠️ No encontré el hueso de la mano para el báculo');
            return;
        }

        console.log(`🪄 Attacheando báculo a: ${handBone.name}`);

        const staffClone = staffTemplate.clone(true);

        staffClone.traverse((node) => {
            if (node.isMesh && node.material) {
                const mats = Array.isArray(node.material) ? node.material : [node.material];
                mats.forEach(mat => {
                    if ('metalness' in mat) mat.metalness = 0.4;
                    if ('roughness' in mat) mat.roughness = 0.6;
                    if ('envMapIntensity' in mat) mat.envMapIntensity = 1.5;
                    mat.needsUpdate = true;
                });
            }
        });

        const staffWrapper = new THREE.Group();

        const staffBBox = new THREE.Box3().setFromObject(staffClone);
        const staffSize = new THREE.Vector3();
        const staffCenter = new THREE.Vector3();
        staffBBox.getSize(staffSize);
        staffBBox.getCenter(staffCenter);

        staffClone.position.sub(staffCenter);

        const maxDim = Math.max(staffSize.x, staffSize.y, staffSize.z);
        const normalizeScale = 1.0 / maxDim;
        staffClone.scale.multiplyScalar(normalizeScale);

        staffWrapper.add(staffClone);

        const STAFF_WORLD_SIZE = 0.75;
        const modelScale = model.scale.x || 1;
        const localScale = STAFF_WORLD_SIZE / modelScale;

        staffWrapper.scale.setScalar(localScale);

        staffWrapper.rotation.set(0, 0, 0);
        staffWrapper.position.set(0, 0, 0);

        this.staffMesh = staffWrapper;
        handBone.add(staffWrapper);

        console.log(`🪄 Báculo final attachado (tamaño ${STAFF_WORLD_SIZE})`);
    }

    loadMageAnimations(model) {
        const loader = new GLTFLoader();
        this.mixer = new THREE.AnimationMixer(model);

        const nombresHuesosModelo = [];
        model.traverse((nodo) => {
            if (nodo.isBone) nombresHuesosModelo.push(nodo.name);
        });
        console.log(`🦴 Huesos del modelo (${nombresHuesosModelo.length}):`, nombresHuesosModelo.slice(0, 5), '...');

        const norm = (s) => s
            .replace(/^mixamorig[:_\-]?/i, '')
            .replace(/[:_\-]+/g, '_')
            .toLowerCase();

        const boneMap = new Map();
        for (const n of nombresHuesosModelo) {
            boneMap.set(norm(n), n);
        }

        let clipsCargados = 0;
        const totalClips = 3;

        const cargarClip = (path, nombreAccion) => {
            loader.load(path, (gltf) => {
                if (!gltf.animations || gltf.animations.length === 0) {
                    console.warn(`⚠️ ${nombreAccion}: sin animaciones en el GLB`);
                    return;
                }
                const clip = gltf.animations[0];

                const esHipsPosition = (track) => {
                    const dotIndex = track.name.indexOf('.');
                    if (dotIndex === -1) return false;
                    const bone = track.name.substring(0, dotIndex);
                    const prop = track.name.substring(dotIndex + 1);
                    return norm(bone) === 'hips' && prop === 'position';
                };
                const antes1 = clip.tracks.length;
                clip.tracks = clip.tracks.filter(t => !esHipsPosition(t));
                if (antes1 !== clip.tracks.length) {
                    console.log(`🧹 ${nombreAccion}: eliminados ${antes1 - clip.tracks.length} tracks de posición del Hips`);
                }

                if (nombreAccion === 'attack') {
                    const antes2 = clip.tracks.length;
                    clip.tracks = clip.tracks.filter(track => {
                        const dotIndex = track.name.indexOf('.');
                        if (dotIndex === -1) return true;
                        const bone = track.name.substring(0, dotIndex).toLowerCase();
                        const prop = track.name.substring(dotIndex + 1).toLowerCase();

                        const esPierna = /(upleg|leg|foot|toebase|toe_end)/.test(bone);
                        if (esPierna) return false;

                        if (prop === 'position') {
                            const esColumna = /(spine|neck|head|chest)/.test(bone);
                            if (esColumna) return false;
                            if (bone === 'hips') return true;
                            return true;
                        }

                        if (prop === 'scale') return false;

                        return true;
                    });
                    if (antes2 !== clip.tracks.length) {
                        console.log(`🔥 attack: filtrados ${antes2 - clip.tracks.length} tracks (piernas + .position columna + .scale)`);
                    }
                }

                let matched = 0;
                let unmatched = 0;
                const huerfanos = [];

                clip.tracks.forEach(track => {
                    const dotIndex = track.name.indexOf('.');
                    if (dotIndex === -1) { unmatched++; return; }
                    const nombreOriginal = track.name.substring(0, dotIndex);
                    const propiedad = track.name.substring(dotIndex);

                    let huesoCoincidente = null;

                    if (nombresHuesosModelo.includes(nombreOriginal)) {
                        huesoCoincidente = nombreOriginal;
                    }
                    if (!huesoCoincidente) {
                        huesoCoincidente = boneMap.get(norm(nombreOriginal)) || null;
                    }
                    if (!huesoCoincidente) {
                        const lower = nombreOriginal.toLowerCase().replace(/[^a-z0-9]/g, '');
                        for (const nombreHueso of nombresHuesosModelo) {
                            if (nombreHueso.toLowerCase().replace(/[^a-z0-9]/g, '') === lower) {
                                huesoCoincidente = nombreHueso;
                                break;
                            }
                        }
                    }

                    if (huesoCoincidente) {
                        track.name = `${huesoCoincidente}${propiedad}`;
                        matched++;
                    } else {
                        unmatched++;
                        huerfanos.push(nombreOriginal);
                    }
                });

                console.log(`🎬 ${nombreAccion}: ${clip.tracks.length} tracks | ✅ ${matched} match | ❌ ${unmatched} huérfanos`);

                const action = this.mixer.clipAction(clip);
                this.actions[nombreAccion] = action;

                if (nombreAccion === 'walk') {
                    action.setLoop(THREE.LoopRepeat);
                    action.timeScale = 1.0;
                } else if (nombreAccion === 'idle') {
                    action.setLoop(THREE.LoopRepeat);
                    action.timeScale = 1.0;
                } else if (nombreAccion === 'attack') {
                    action.setLoop(THREE.LoopOnce);
                    action.clampWhenFinished = true;
                    action.timeScale = 1.8;
                }

                console.log(`✅ ${nombreAccion} cargado (${clip.duration.toFixed(2)}s, timeScale=${action.timeScale})`);

                if (nombreAccion === 'idle' && !this.currentAction) {
                    action.play();
                    this.currentAction = action;
                }

                clipsCargados++;
                if (clipsCargados >= totalClips) {
                    this.mergeLegsFromIdleToAttack();
                }
            }, undefined, (err) => {
                console.error(`❌ Error cargando ${nombreAccion}:`, err);
            });
        };

        cargarClip(CONFIG.MAGE_GLB_WALK, 'walk');
        cargarClip(CONFIG.MAGE_GLB_IDLE, 'idle');
        cargarClip(CONFIG.MAGE_GLB_ATTACK, 'attack');
    }

    mergeLegsFromIdleToAttack() {
        const idleAction = this.actions.idle;
        const attackAction = this.actions.attack;
        if (!idleAction || !attackAction) {
            console.warn('⚠️ No se pudo hacer merge de piernas: falta idle o attack');
            return;
        }

        const idleClip = idleAction.getClip();
        const attackClip = attackAction.getClip();

        const esPierna = (nombreHueso) => {
            const n = nombreHueso.toLowerCase();
            return /(upleg|leg|foot|toebase|toe_end|thigh|calf|shin)/.test(n);
        };

        const idleLegTracks = idleClip.tracks.filter(track => {
            const dotIndex = track.name.indexOf('.');
            if (dotIndex === -1) return false;
            const bone = track.name.substring(0, dotIndex);
            return esPierna(bone);
        });

        console.log(`🦵 idle tiene ${idleLegTracks.length} tracks de piernas`);

        if (idleLegTracks.length === 0) {
            console.warn('⚠️ El clip idle no tiene tracks de piernas');
            return;
        }

        const attackTrackNames = new Set(attackClip.tracks.map(t => t.name));

        const tracksParaAnadir = [];
        for (const idleTrack of idleLegTracks) {
            if (attackTrackNames.has(idleTrack.name)) {
                continue;
            }
            const clon = idleTrack.clone();
            tracksParaAnadir.push(clon);
        }

        if (tracksParaAnadir.length === 0) {
            console.log('✅ attack ya tiene todos los tracks de piernas — no hace falta merge');
            return;
        }

        attackClip.tracks.push(...tracksParaAnadir);

        let maxTime = attackClip.duration;
        for (const track of attackClip.tracks) {
            const lastTime = track.times[track.times.length - 1] || 0;
            if (lastTime > maxTime) maxTime = lastTime;
        }
        attackClip.duration = maxTime;

        const timeScaleAnterior = attackAction.timeScale;
        const loopAnterior = attackAction.loop;
        const clampAnterior = attackAction.clampWhenFinished;
        const eraActual = (this.currentAction === attackAction);

        attackAction.stop();

        const nuevaAction = this.mixer.clipAction(attackClip);
        nuevaAction.setLoop(loopAnterior);
        nuevaAction.timeScale = timeScaleAnterior;
        nuevaAction.clampWhenFinished = clampAnterior;

        this.actions.attack = nuevaAction;

        if (eraActual) {
            this.currentAction = nuevaAction;
            nuevaAction.play();
        }

        console.log(`🦵 Merge idle→attack: +${tracksParaAnadir.length} tracks (total ${attackClip.tracks.length})`);

        const piernasFinales = attackClip.tracks
            .filter(t => esPierna(t.name.split('.')[0]))
            .map(t => t.name.split('.')[0]);
        console.log('🦵 attack piernas finales:', [...new Set(piernasFinales)]);
    }

    playAction(name) {
        if (!this.actions[name]) return;
        if (this.currentAction === this.actions[name]) return;

        const nuevo = this.actions[name];
        const anterior = this.currentAction;

        if (anterior && anterior !== nuevo) {
            anterior.fadeOut(0.2);
        }
        nuevo.reset();
        nuevo.fadeIn(0.2);
        nuevo.play();
        this.currentAction = nuevo;
    }

    updateAnimationByState() {
        if (!this.mixer) return;

        if (this.state === 'attack' && this.actions.attack) {
            if (this.currentAction !== this.actions.attack) {
                this.actions.attack.reset();
                this.actions.attack.setEffectiveWeight(1);
                this.playAction('attack');
            }
        } else if (this.state === 'move' && this.actions.walk) {
            if (this.currentAction !== this.actions.walk) {
                this.playAction('walk');
            }
        } else if (this.actions.idle) {
            if (this.currentAction !== this.actions.idle) {
                this.playAction('idle');
            }
        }
    }

    triggerAttackAnimation() {
        if (!this.actions.attack) return;
        const attack = this.actions.attack;
        const anterior = this.currentAction;

        if (anterior && anterior !== attack) {
            anterior.fadeOut(0.1);
        }

        attack.reset();
        attack.setEffectiveWeight(1);
        attack.fadeIn(0.1);
        attack.play();
        this.currentAction = attack;

        this._attackStartTime = performance.now();
        const clipDuration = attack.getClip().duration || 2;
        const timeScale = attack.timeScale || 1;
        this._attackDurationMs = (clipDuration / timeScale) * 1000;
        this._attackActive = true;
    }

    updateAttackAnimation(delta) {
        if (this.actions.attack || !this.glbModel || !this.attackAnimActive) return;
        this.attackAnimTimer += delta;
        const t = this.attackAnimTimer / this.attackAnimDuration;
        if (t >= 1) {
            this.attackAnimActive = false;
            this.glbModel.rotation.x = 0;
            this.glbModel.rotation.z = 0;
            this.glbModel.position.y = -new THREE.Box3().setFromObject(this.glbModel).min.y;
            return;
        }
        const swing = Math.sin(t * Math.PI);
        if (this.tipo === 'melee') {
            this.glbModel.rotation.x = -swing * 0.6;
            this.glbModel.rotation.z = swing * 0.3;
        } else {
            this.glbModel.rotation.x = -swing * 0.4;
            this.glbModel.position.y += swing * 0.05;
        }
    }

    updateHealthBar() {
        const currentSegments = Math.ceil(this.health / this.hpPerSegment);
        const visibleSegments = Math.max(0, Math.min(this.segments, currentSegments));
        if (visibleSegments !== this.currentVisibleSegments) {
            this.currentVisibleSegments = visibleSegments;
            const texture = getHealthBarTexture(this.segments, visibleSegments, this.isEnemy);
            if (this.spriteMat) {
                this.spriteMat.map = texture;
                this.spriteMat.needsUpdate = true;
            }
        }
    }

    findBestTarget(aliados, enemigos, towers, playerModel) {
        if (!nexusAliado || !nexusEnemigo) return null;
        
        const enemyMinions = this.isEnemy ? aliados : enemigos;
        const enemyTowers = towers.filter(t => t.isEnemy !== this.isEnemy && !t.isDead);
        const enemyNexus = this.isEnemy ? nexusAliado : nexusEnemigo;

        if (this.isEnemy && nexusEnemigo.isDead) return null;
        if (!this.isEnemy && nexusAliado.isDead) return null;

        if (this.isEnemy && playerModel && !isPlayerDead) {
            const distToPlayer = this.group.position.distanceTo(playerModel.position);
            if (distToPlayer <= CONFIG.agroRange) {
                if (playerAttackTarget && playerAttackTarget.isEnemy === this.isEnemy) {
                    return { target: { group: playerModel, isDead: false, health: 999999, type: 'player', isEnemy: true }, type: 'player', dist: distToPlayer };
                }
                if (distToPlayer < 3.0) {
                    return { target: { group: playerModel, isDead: false, health: 999999, type: 'player', isEnemy: true }, type: 'player', dist: distToPlayer };
                }
            }
        }

        let agroTarget = null;
        let agroDist = Infinity;
        for (const enemy of enemyMinions) {
            if (enemy.isDead) continue;
            if (enemy.target && enemy.target.isEnemy !== this.isEnemy) {
                const dist = this.group.position.distanceTo(enemy.group.position);
                if (dist < agroDist && dist <= CONFIG.agroRange) {
                    agroDist = dist;
                    agroTarget = enemy;
                }
            }
        }
        if (agroTarget) return { target: agroTarget, type: 'minion', dist: agroDist };

        const MAX_CHASE_DISTANCE = 30;

        let closestMinion = null;
        let closestMinionDist = Infinity;
        for (const enemy of enemyMinions) {
            if (enemy.isDead) continue;
            const dist = this.group.position.distanceTo(enemy.group.position);
            if (dist < closestMinionDist && dist < MAX_CHASE_DISTANCE) {
                closestMinionDist = dist;
                closestMinion = enemy;
            }
        }
        if (closestMinion && closestMinionDist <= MAX_CHASE_DISTANCE) {
            return { target: closestMinion, type: 'minion', dist: closestMinionDist };
        }

        let closestTower = null;
        let closestTowerDist = Infinity;
        for (const tower of enemyTowers) {
            if (tower.isDead) continue;
            const dist = this.group.position.distanceTo(tower.group.position);
            if (dist < closestTowerDist && dist < MAX_CHASE_DISTANCE) {
                closestTowerDist = dist;
                closestTower = tower;
            }
        }
        if (closestTower && closestTowerDist < MAX_CHASE_DISTANCE) {
            return { target: closestTower, type: 'tower', dist: closestTowerDist };
        }

        if (!enemyNexus.isDead) {
            const distToNexus = this.group.position.distanceTo(enemyNexus.group.position);
            if (distToNexus < MAX_CHASE_DISTANCE + 10) {
                return { target: enemyNexus, type: 'nexus', dist: distToNexus };
            }
        }
        return null;
    }

    fireMageProjectile(target) {
        const color = this.isEnemy ? 0xff44aa : 0x44aaff;
        const startPos = new THREE.Vector3();
        startPos.copy(this.group.position);
        startPos.y = 0.5;

        const geo = new THREE.SphereGeometry(0.08, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9 });
        const proj = new THREE.Mesh(geo, mat);
        proj.position.copy(startPos);
        scene.add(proj);

        const glowGeo = new THREE.SphereGeometry(0.15, 6, 6);
        const glowMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.2 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.copy(startPos);
        scene.add(glow);

        const endPos = target.group.position.clone();
        endPos.y = 0.5;
        const startPosCopy = startPos.clone();
        let t = 0;

        const animateMageProj = () => {
            t += 0.02;
            if (t >= 1 || target.isDead) {
                scene.remove(proj);
                scene.remove(glow);
                if (!target.isDead && t >= 1) {
                    if (target.type === 'player') {
                        console.log('⚔️ Minion atacó al Axie (inmortal)');
                    } else {
                        target.health -= this.attackDamage;
                        if (target.updateHealthBar) target.updateHealthBar();
                        if (target.health <= 0) {
                            if (target.die) target.die();
                        }
                    }
                    const expColor = this.isEnemy ? 0xff44aa : 0x44aaff;
                    for (let i = 0; i < 6; i++) {
                        const pGeo = new THREE.SphereGeometry(0.03, 4, 4);
                        const pMat = new THREE.MeshBasicMaterial({ color: expColor, transparent: true, opacity: 0.6 });
                        const p = new THREE.Mesh(pGeo, pMat);
                        p.position.copy(endPos);
                        p.position.y += 0.2;
                        const angle = Math.random() * Math.PI * 2;
                        p.userData.vel = new THREE.Vector3(Math.cos(angle) * 1.5, Math.random() * 2, Math.sin(angle) * 1.5);
                        scene.add(p);
                        const startTime2 = performance.now();
                        const animateP = () => {
                            const elapsed = (performance.now() - startTime2) / 1000;
                            if (elapsed > 0.5) { scene.remove(p); return; }
                            p.position.x += p.userData.vel.x * 0.02;
                            p.position.y += p.userData.vel.y * 0.02;
                            p.position.z += p.userData.vel.z * 0.02;
                            p.userData.vel.y -= 0.05;
                            p.material.opacity = 0.6 * (1 - elapsed / 0.5);
                            requestAnimationFrame(animateP);
                        };
                        animateP();
                    }
                }
                return;
            }
            const currentPos = new THREE.Vector3().lerpVectors(startPosCopy, endPos, t);
            proj.position.copy(currentPos);
            glow.position.copy(currentPos);
            proj.scale.setScalar(1 + t * 0.5);
            requestAnimationFrame(animateMageProj);
        };
        animateMageProj();
    }

    update(delta, aliados, enemigos, towers, playerModel) {
        if (this.isDead || gameFinished) return;

        if (this._attackActive) {
            const attack = this.actions.attack;
            let debeVolver = false;

            if (!attack) {
                debeVolver = true;
            } else if (!attack.isRunning()) {
                debeVolver = true;
            } else if (this._attackStartTime && this._attackDurationMs > 0) {
                const elapsed = performance.now() - this._attackStartTime;
                if (elapsed >= this._attackDurationMs) {
                    debeVolver = true;
                }
            }

            if (debeVolver) {
                this._attackActive = false;
                this._attackStartTime = null;

                const target = (this.state === 'move' && this.actions.walk) ? this.actions.walk : this.actions.idle;
                if (target) {
                    if (this.currentAction && this.currentAction !== target) {
                        this.currentAction.fadeOut(0.15);
                    }
                    target.reset();
                    target.setEffectiveWeight(1);
                    target.fadeIn(0.15);
                    target.play();
                    this.currentAction = target;
                }
            }
        }

        this.reevaluationTimer += delta;

        this.updateAttackAnimation(delta);

        if (isFirstWave && this.ghostTimer > 0) {
            this.ghostTimer -= delta;
            let newZ = this.group.position.z + this.direction * this.speed * delta;
            if (newZ > CONFIG.minionLimitZ) newZ = CONFIG.minionLimitZ;
            if (newZ < -CONFIG.minionLimitZ) newZ = -CONFIG.minionLimitZ;
            this.group.position.z = newZ;

            this.state = 'move';
            this.updateAnimationByState();

            return;
        }

        this.attackCooldown -= delta;

        if (this.reevaluationTimer >= CONFIG.reevaluationTime || !this.target || this.target.isDead) {
            this.reevaluationTimer = 0;
            const bestTarget = this.findBestTarget(aliados, enemigos, towers, playerModel);
            if (bestTarget) {
                this.target = bestTarget.target;
                this.state = 'attack';
            } else {
                this.state = 'move';
                this.target = null;
            }
        }

        if (this.target && this.target.isDead) {
            this.target = null;
            this.state = 'move';
            this.reevaluationTimer = CONFIG.reevaluationTime;
        }

        if (this.target && !this.target.isDead) {
            const dist = this.group.position.distanceTo(this.target.group.position);
            if (dist <= this.attackRange) {
                this.state = 'attack';
                const angle = Math.atan2(
                    this.target.group.position.x - this.group.position.x,
                    this.target.group.position.z - this.group.position.z
                );
                this.group.rotation.y = angle;

                if (this.attackCooldown <= 0) {
                    this.triggerAttackAnimation();
                    if (this.tipo === 'mage') {
                        this.fireMageProjectile(this.target);
                        this.attackCooldown = this.attackSpeed;
                    } else {
                        if (this.target.type === 'player') {
                            this.attackCooldown = this.attackSpeed;
                        } else {
                            this.target.health -= this.attackDamage;
                            this.attackCooldown = this.attackSpeed;
                            if (this.target.updateHealthBar) this.target.updateHealthBar();
                            if (this.target.health <= 0) {
                                if (this.target.die) this.target.die();
                                this.target = null;
                                this.state = 'move';
                                this.reevaluationTimer = CONFIG.reevaluationTime;
                            }
                        }
                    }
                }
            } else {
                this.state = 'move';
                const dx = this.target.group.position.x - this.group.position.x;
                const dz = this.target.group.position.z - this.group.position.z;
                const totalDist = Math.sqrt(dx * dx + dz * dz);
                if (totalDist > 0.1) {
                    const moveSpeed = this.speed * delta;
                    const stepX = (dx / totalDist) * moveSpeed;
                    const stepZ = (dz / totalDist) * moveSpeed;
                    this.group.position.x += stepX;
                    this.group.position.z += stepZ;
                    const angle = Math.atan2(dx, dz);
                    this.group.rotation.y = angle;
                }
            }
        } else {
            this.state = 'move';
            let newZ = this.group.position.z + this.direction * this.speed * delta;
            if (newZ > CONFIG.minionLimitZ) newZ = CONFIG.minionLimitZ;
            if (newZ < -CONFIG.minionLimitZ) newZ = -CONFIG.minionLimitZ;
            this.group.position.z = newZ;
        }

        this.updateAnimationByState();
        this.updateHealthBar();
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.state = 'dead';
        this.group.visible = false;
        if (this._attackTimeoutId) {
            clearTimeout(this._attackTimeoutId);
            this._attackTimeoutId = null;
        }
        this._attackActive = false;
        this._attackStartTime = null;
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
    else return { melee: 3, mage: 2 };
}

function spawnWave() {
    if (gameFinished) return;

    for (let i = aliados.length - 1; i >= 0; i--) {
        if (aliados[i].isDead) {
            if (aliados[i].group.parent) scene.remove(aliados[i].group);
            aliados.splice(i, 1);
        }
    }
    for (let i = enemigos.length - 1; i >= 0; i--) {
        if (enemigos[i].isDead) {
            if (enemigos[i].group.parent) scene.remove(enemigos[i].group);
            enemigos.splice(i, 1);
        }
    }

    const comp = getWaveComposition();
    const waveDisplay = waveNumber;
    waveDiv.textContent = `⚔️ OLEADA ${waveDisplay}`;

    const spacing = CONFIG.meleeSpacing;
    const mageSpacing = CONFIG.mageSpacing;
    const startZ = -18;

    const meleeCount = comp.melee;
    const totalMeleeWidth = (meleeCount - 1) * spacing;
    const mageCount = comp.mage;
    const totalMageWidth = (mageCount - 1) * mageSpacing;

    const aliadoPositions = [];
    for (let i = 0; i < meleeCount; i++) {
        const x = -totalMeleeWidth / 2 + i * spacing;
        const z = startZ - i * 0.3;
        aliadoPositions.push({ x, z, tipo: 'melee', index: i });
        const minion = new Minion(x, z, false, 'melee', i);
        aliados.push(minion);
    }
    const mageStartZ = startZ - meleeCount * 0.3 - 1.0;
    for (let i = 0; i < mageCount; i++) {
        const x = -totalMageWidth / 2 + i * mageSpacing;
        const z = mageStartZ - i * 0.2;
        aliadoPositions.push({ x, z, tipo: 'mage', index: i + meleeCount });
        const minion = new Minion(x, z, false, 'mage', i + meleeCount);
        aliados.push(minion);
    }

    for (const pos of aliadoPositions) {
        const mirrorX = -pos.x;
        const mirrorZ = -pos.z;
        const minion = new Minion(mirrorX, mirrorZ, true, pos.tipo, pos.index);
        enemigos.push(minion);
    }

    waveNumber++;
    waveCooldown = 0;

    if (waveNumber === 2) {
        isFirstWave = true;
        for (const minion of aliados) {
            minion.isGhost = true;
            minion.ghostTimer = CONFIG.firstWaveGhostDuration;
        }
        for (const minion of enemigos) {
            minion.isGhost = true;
            minion.ghostTimer = CONFIG.firstWaveGhostDuration;
        }
    }
}

let playerModel = null;
let mixer = null;
let animIdle = null;
let animWalk = null;
let currentAnim = 'idle';

let targetPosition = null;
let isMovingToTarget = false;
let playerSpeed = CONFIG.axieSpeed;
const playerSpawnPosition = new THREE.Vector3(0, 0, -20);

let smoothPlayerPos = new THREE.Vector3(0, 0, -20);
let smoothTargetPos = new THREE.Vector3(0, 0, -20);

let isDragging = false;
let isMouseDown = false;
let mouseDownPos = { x: 0, y: 0 };

let attackCooldown = 0;
let playerProjectiles = [];
let isAttacking = false;
let attackRange = CONFIG.attackRange;
let attackDamage = CONFIG.attackDamage;
let attackSpeed = CONFIG.attackSpeed;

let isAutoMovingToTarget = false;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ✅ FIX: forzar Y = GROUND_Y en el destino del click
function getGroundIntersection(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    const intersectPoint = raycaster.ray.intersectPlane(plane, intersection);
    if (intersectPoint) {
        const limitX = 17, limitZ = 27;
        intersectPoint.x = Math.max(-limitX, Math.min(limitX, intersectPoint.x));
        intersectPoint.z = Math.max(-limitZ, Math.min(limitZ, intersectPoint.z));
        intersectPoint.y = GROUND_Y;  // ✅ FIX CLAVE
        return intersectPoint;
    }
    return null;
}

renderer.domElement.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
        isMouseDown = true;
        isDragging = false;
        mouseDownPos.x = e.clientX;
        mouseDownPos.y = e.clientY;
    }
});

renderer.domElement.addEventListener('mousemove', (e) => {
    if (isMouseDown) {
        const dx = e.clientX - mouseDownPos.x;
        const dy = e.clientY - mouseDownPos.y;
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            isDragging = true;
        }
    }
});

renderer.domElement.addEventListener('mouseup', (e) => {
    if (e.button === 2) {
        if (!isDragging && playerModel) {
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
        isMouseDown = false;
        isDragging = false;
    }
});

renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

function loadSelectedAxie(axieId) {
    return new Promise((resolve) => {
        const axieData = getAxieById(axieId);
        if (!axieData) {
            loadDefaultAxie().then(resolve);
            return;
        }
        const loader = new GLTFLoader();
        loader.load(
            axieData.modelo,
            (gltf) => {
                if (playerModel) {
                    scene.remove(playerModel);
                    if (mixer) { mixer.stopAllAction(); mixer = null; }
                }
                playerModel = gltf.scene;
                const escala = axieData.escala || 1.2;
                playerModel.scale.set(escala, escala, escala);
                playerModel.position.copy(playerSpawnPosition);
                playerModel.position.y = GROUND_Y;
                smoothPlayerPos.copy(playerSpawnPosition);
                smoothPlayerPos.y = GROUND_Y;
                playerModel.traverse((node) => {
                    if (node.isMesh) { node.castShadow = false; node.receiveShadow = false; }
                });
                scene.add(playerModel);
                mixer = new THREE.AnimationMixer(playerModel);
                gltf.animations.forEach(clip => {
                    const name = clip.name.toLowerCase();
                    if (name.includes('idle')) animIdle = mixer.clipAction(clip);
                    if (name.includes('walk')) animWalk = mixer.clipAction(clip);
                });
                if (animIdle) { animIdle.play(); }
                axieLoaded = true;
                currentAxieName = axieData.nombre;
                resolve();
            },
            undefined,
            () => { loadDefaultAxie().then(resolve); }
        );
    });
}

function loadDefaultAxie() {
    return new Promise((resolve) => {
        const loader = new GLTFLoader();
        loader.load(
            '/axie-3d-assets/assets/mascots/bing.glb',
            (gltf) => {
                if (playerModel) {
                    scene.remove(playerModel);
                    if (mixer) { mixer.stopAllAction(); mixer = null; }
                }
                playerModel = gltf.scene;
                playerModel.scale.set(1.2, 1.2, 1.2);
                playerModel.position.copy(playerSpawnPosition);
                playerModel.position.y = GROUND_Y;
                smoothPlayerPos.copy(playerSpawnPosition);
                smoothPlayerPos.y = GROUND_Y;
                playerModel.traverse((node) => {
                    if (node.isMesh) { node.castShadow = false; node.receiveShadow = false; }
                });
                scene.add(playerModel);
                mixer = new THREE.AnimationMixer(playerModel);
                gltf.animations.forEach(clip => {
                    const name = clip.name.toLowerCase();
                    if (name.includes('idle')) animIdle = mixer.clipAction(clip);
                    if (name.includes('walk')) animWalk = mixer.clipAction(clip);
                });
                if (animIdle) { animIdle.play(); }
                axieLoaded = true;
                currentAxieName = 'Bing';
                resolve();
            },
            undefined,
            () => {
                const fallback = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1.5, 1),
                    new THREE.MeshStandardMaterial({ color: 0xff4444 })
                );
                fallback.position.copy(playerSpawnPosition);
                fallback.position.y = GROUND_Y;
                scene.add(fallback);
                playerModel = fallback;
                smoothPlayerPos.copy(playerSpawnPosition);
                smoothPlayerPos.y = GROUND_Y;
                axieLoaded = true;
                currentAxieName = 'Bing';
                resolve();
            }
        );
    });
}

let playerHUD = null;
let playerHUDHealthBar = null;
let playerHUDHealthText = null;
let playerHUDManaBar = null;
let playerHUDManaText = null;

let hudWrapper = null;
let potionHUD = null;
let itemHUD = null;
let itemSlots = [];
let potionHPCount = 5;
let potionMPCount = 5;

function createPlayerHUD() {
    if (playerHUD) playerHUD.remove();
    if (hudWrapper) hudWrapper.remove();

    hudWrapper = document.createElement('div');
    hudWrapper.id = 'hud-wrapper';
    hudWrapper.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: stretch;
        gap: 10px;
        z-index: 1000;
        pointer-events: none;
    `;
    document.body.appendChild(hudWrapper);

    playerHUD = document.createElement('div');
    playerHUD.id = 'player-hud';
    playerHUD.style.cssText = `
        width: 400px;
        background: rgba(0,0,0,0.9);
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 12px;
        padding: 15px;
        pointer-events: none;
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #fff;
        box-shadow: 0 0 20px rgba(0,0,0,0.8);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    `;

    playerHUD.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="font-size:20px;">⚔️</div>
            <div style="font-weight:bold;font-size:18px;color:#44ff88;">${currentAxieName}</div>
            <div style="margin-left:auto;font-size:14px;color:#88aaff;">Nv.1</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-size:14px;color:#ff6644;">❤️</span>
            <div style="flex:1;height:18px;background:rgba(255,255,255,0.15);border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
                <div id="player-hud-health-bar" style="width:100%;height:100%;background:linear-gradient(90deg,#ff2244,#ff6644);border-radius:4px;transition:width 0.3s;"></div>
            </div>
            <span id="player-hud-health-text" style="font-size:14px;font-weight:bold;min-width:60px;text-align:right;">200/200</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:14px;color:#44aaff;">💧</span>
            <div style="flex:1;height:14px;background:rgba(255,255,255,0.15);border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
                <div id="player-hud-mana-bar" style="width:100%;height:100%;background:linear-gradient(90deg,#4488ff,#66aaff);border-radius:4px;transition:width 0.3s;"></div>
            </div>
            <span id="player-hud-mana-text" style="font-size:12px;font-weight:bold;min-width:60px;text-align:right;">100/100</span>
        </div>
    `;

    hudWrapper.appendChild(playerHUD);
    playerHUDHealthBar = document.getElementById('player-hud-health-bar');
    playerHUDHealthText = document.getElementById('player-hud-health-text');
    playerHUDManaBar = document.getElementById('player-hud-mana-bar');
    playerHUDManaText = document.getElementById('player-hud-mana-text');

    requestAnimationFrame(() => {
        const alturaReal = playerHUD.offsetHeight;
        createPotionHUD(alturaReal);
        createItemHUD(alturaReal);
    });
}

function createPotionHUD(alturaHUDPrincipal) {
    if (potionHUD) potionHUD.remove();
    potionHUD = document.createElement('div');
    potionHUD.id = 'potion-hud';
    potionHUD.style.cssText = `
        width: 50px;
        height: ${alturaHUDPrincipal}px;
        background: rgba(0,0,0,0.9);
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 3px;
        pointer-events: none;
        font-family: 'Segoe UI', Arial, sans-serif;
        box-shadow: 0 0 20px rgba(0,0,0,0.8);
        padding: 5px;
        box-sizing: border-box;
    `;

    const hpBox = document.createElement('div');
    hpBox.style.cssText = `
        flex: 1;
        width: 100%;
        background: rgba(255,68,68,0.08);
        border: 1px solid rgba(255,68,68,0.3);
        border-radius: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
        pointer-events: auto;
        box-sizing: border-box;
    `;
    hpBox.onmouseenter = () => { hpBox.style.background = 'rgba(255,68,68,0.2)'; hpBox.style.borderColor = 'rgba(255,68,68,0.8)'; };
    hpBox.onmouseleave = () => { hpBox.style.background = 'rgba(255,68,68,0.08)'; hpBox.style.borderColor = 'rgba(255,68,68,0.3)'; };
    hpBox.onclick = () => { usePotion('hp'); };

    const hpLabel = document.createElement('div');
    hpLabel.textContent = `HP (${potionHPCount})`;
    hpLabel.style.cssText = `font-size: 10px; font-weight: bold; color: #ff6644; letter-spacing: 0.3px; text-align: center;`;
    hpBox.appendChild(hpLabel);

    const mpBox = document.createElement('div');
    mpBox.style.cssText = `
        flex: 1;
        width: 100%;
        background: rgba(68,170,255,0.08);
        border: 1px solid rgba(68,170,255,0.3);
        border-radius: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
        pointer-events: auto;
        box-sizing: border-box;
    `;
    mpBox.onmouseenter = () => { mpBox.style.background = 'rgba(68,170,255,0.2)'; mpBox.style.borderColor = 'rgba(68,170,255,0.8)'; };
    mpBox.onmouseleave = () => { mpBox.style.background = 'rgba(68,170,255,0.08)'; mpBox.style.borderColor = 'rgba(68,170,255,0.3)'; };
    mpBox.onclick = () => { usePotion('mp'); };

    const mpLabel = document.createElement('div');
    mpLabel.textContent = `MP (${potionMPCount})`;
    mpLabel.style.cssText = `font-size: 10px; font-weight: bold; color: #44aaff; letter-spacing: 0.3px; text-align: center;`;
    mpBox.appendChild(mpLabel);

    potionHUD.appendChild(hpBox);
    potionHUD.appendChild(mpBox);
    hudWrapper.appendChild(potionHUD);
}

function createItemHUD(alturaHUDPrincipal) {
    if (itemHUD) itemHUD.remove();
    itemHUD = document.createElement('div');
    itemHUD.id = 'item-hud';
    itemHUD.style.cssText = `
        width: 130px;
        height: ${alturaHUDPrincipal}px;
        background: rgba(0,0,0,0.9);
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 12px;
        padding: 6px;
        pointer-events: none;
        font-family: 'Segoe UI', Arial, sans-serif;
        box-shadow: 0 0 20px rgba(0,0,0,0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
    `;

    const title = document.createElement('div');
    title.textContent = 'ITEMS';
    title.style.cssText = `font-size: 10px; font-weight: bold; color: #ffcc44; text-align: center; margin-bottom: 3px; letter-spacing: 2px;`;
    itemHUD.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 4px;
    `;

    itemSlots = [];
    for (let i = 0; i < 6; i++) {
        const slot = document.createElement('div');
        slot.dataset.slotIndex = i;
        slot.style.cssText = `
            width: 30px;
            height: 30px;
            background: rgba(255,255,255,0.05);
            border: 2px solid rgba(255,255,255,0.15);
            border-radius: 6px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 13px;
            color: rgba(255,255,255,0.2);
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            pointer-events: auto;
        `;
        slot.textContent = '';

        const slotNum = document.createElement('div');
        slotNum.textContent = i + 1;
        slotNum.style.cssText = `position: absolute; bottom: 1px; right: 3px; font-size: 8px; color: rgba(255,255,255,0.3); font-weight: bold;`;
        slot.appendChild(slotNum);

        slot.onmouseenter = () => { slot.style.borderColor = 'rgba(255,200,50,0.6)'; slot.style.background = 'rgba(255,255,255,0.1)'; };
        slot.onmouseleave = () => { slot.style.borderColor = 'rgba(255,255,255,0.15)'; slot.style.background = 'rgba(255,255,255,0.05)'; };
        slot.onclick = () => { useItem(i); };

        itemSlots.push(slot);
        grid.appendChild(slot);
    }

    itemHUD.appendChild(grid);
    hudWrapper.appendChild(itemHUD);
}

function usePotion(type) {
    if (type === 'hp') {
        if (potionHPCount > 0 && playerHealth < playerMaxHealth) {
            potionHPCount--;
            playerHealth = Math.min(playerMaxHealth, playerHealth + 50);
            updatePlayerHUD();
            updatePotionHUD();
        }
    } else if (type === 'mp') {
        if (potionMPCount > 0) {
            potionMPCount--;
            updatePotionHUD();
        }
    }
}

function useItem(slotIndex) { }

function updatePlayerHUD() {
    if (!playerHUD) return;
    const pct = Math.max(0, (playerHealth / playerMaxHealth) * 100);
    if (playerHUDHealthBar) playerHUDHealthBar.style.width = `${pct}%`;
    if (playerHUDHealthText) playerHUDHealthText.textContent = `${Math.floor(playerHealth)}/${playerMaxHealth}`;
    if (playerHUDManaBar) playerHUDManaBar.style.width = '100%';
    if (playerHUDManaText) playerHUDManaText.textContent = '100/100';
}

function updatePotionHUD() {
    const hpBox = potionHUD?.querySelector('div:first-child');
    const mpBox = potionHUD?.querySelector('div:last-child');
    if (hpBox) { const label = hpBox.querySelector('div'); if (label) label.textContent = `HP (${potionHPCount})`; }
    if (mpBox) { const label = mpBox.querySelector('div'); if (label) label.textContent = `MP (${potionMPCount})`; }
}

function playerTakeDamage(damage) {
    if (isPlayerDead) return;
    playerHealth -= damage;
    if (playerHealth < 0) playerHealth = 0;
    updatePlayerHUD();
    if (playerHealth <= 0) {
        playerHealth = 0;
        isPlayerDead = true;
        playerRespawnTimer = CONFIG.RESPAWN_TIME;
        if (playerModel) playerModel.visible = false;
    }
}

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
        if (window.currentTarget && window.currentTarget.type === 'enemy_axie') {
            window.currentTarget = null;
            targetUI.style.display = 'none';
        }
    }
}

function showDefeatScreen() {
    if (gameFinished) return;
    gameFinished = true;
    if (defeatScreen && defeatScreen.parentNode) defeatScreen.parentNode.removeChild(defeatScreen);
    defeatScreen = document.createElement('div');
    defeatScreen.id = 'defeat-screen';
    defeatScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    const title = document.createElement('div');
    title.textContent = '💀 DERROTA 💀';
    title.style.cssText = `font-size: 80px; font-weight: bold; color: #ff2244; text-shadow: 0 0 30px rgba(255,34,68,0.5); font-family: 'Arial Black', sans-serif; margin-bottom: 30px;`;
    const subtitle = document.createElement('div');
    subtitle.textContent = '¡El Axie enemigo ha destruido tu nexo!';
    subtitle.style.cssText = `font-size: 28px; color: #88ddff; font-family: 'Arial', sans-serif; margin-bottom: 40px;`;
    const button = document.createElement('button');
    button.textContent = '🏠 Ir a Inicio';
    button.style.cssText = `
        padding: 16px 48px;
        font-size: 24px;
        font-weight: bold;
        background: linear-gradient(135deg, #ff4444, #cc2222);
        color: #fff;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-family: 'Arial', sans-serif;
        transition: transform 0.3s;
    `;
    button.onclick = () => {
        if (defeatScreen && defeatScreen.parentNode) defeatScreen.parentNode.removeChild(defeatScreen);
        abandonGame();
    };
    defeatScreen.appendChild(title);
    defeatScreen.appendChild(subtitle);
    defeatScreen.appendChild(button);
    document.body.appendChild(defeatScreen);
}

let enemyAxie = null;
let enemyAxieModel = null;
let enemyAxieMixer = null;
let enemyAxieAnimIdle = null;
let enemyAxieAnimWalk = null;
let enemyAxieCurrentAnim = 'idle';
let enemyAxieTarget = null;
let enemyAxieState = 'move';
let enemyAxieAttackCooldown = 0;
let enemyAxieVelocityY = 0;
let enemyAxieIsGrounded = false;
let enemyAxieJumpCooldown = 0;
let enemyAxieHealth = CONFIG.enemyMaxHealth;
let enemyAxieMaxHealth = CONFIG.enemyMaxHealth;
let enemyAxieIsDead = false;
let enemyAxieRespawnTimer = 0;
let enemyAxieSpawnTimer = 0;
let enemyAxieSpawned = false;
const ENEMY_AXIE_SPAWN_DELAY = CONFIG.AXIE_SPAWN_DELAY;

const ENEMY_AXIE_ATTACK_RANGE = 2.5;
const ENEMY_AXIE_ATTACK_DAMAGE = 10;
const ENEMY_AXIE_ATTACK_SPEED = 0.8;
const ENEMY_AXIE_SPEED = 1.2;
const ENEMY_AXIE_AGRO_RANGE = 10.0;
const ENEMY_AXIE_SPAWN_POS = new THREE.Vector3(0, 0, 22);

let enemyHealthBarSprite = null;
let enemyHealthBarMat = null;
const ENEMY_HEALTH_SEGMENTS = 10;

function spawnEnemyAxie() {
    if (enemyAxieSpawned || gameFinished) return;
    const allAxies = getAllAxies();
    const availableAxies = allAxies.filter(a => a.id !== selectedAxieId);
    const randomAxie = availableAxies[Math.floor(Math.random() * availableAxies.length)];
    enemyAxie = {
        id: randomAxie.id,
        nombre: randomAxie.nombre,
        data: randomAxie,
        health: enemyAxieHealth,
        maxHealth: enemyAxieMaxHealth,
        isDead: false,
    };
    const loader = new GLTFLoader();
    loader.load(
        randomAxie.modelo,
        (gltf) => {
            enemyAxieModel = gltf.scene;
            enemyAxieModel.position.set(ENEMY_AXIE_SPAWN_POS.x, GROUND_Y - 0.5, ENEMY_AXIE_SPAWN_POS.z);
            enemyAxieVelocityY = 0;
            const escala = randomAxie.escala || 1.2;
            enemyAxieModel.scale.set(escala, escala, escala);
            enemyAxieModel.rotation.y = Math.PI;
            enemyAxieModel.traverse((node) => {
                if (node.isMesh) { node.castShadow = false; node.receiveShadow = false; }
            });
            scene.add(enemyAxieModel);
            enemyAxieMixer = new THREE.AnimationMixer(enemyAxieModel);
            gltf.animations.forEach(clip => {
                const name = clip.name.toLowerCase();
                if (name.includes('idle')) enemyAxieAnimIdle = enemyAxieMixer.clipAction(clip);
                if (name.includes('walk')) enemyAxieAnimWalk = enemyAxieMixer.clipAction(clip);
            });
            if (enemyAxieAnimIdle) { enemyAxieAnimIdle.play(); enemyAxieCurrentAnim = 'idle'; }
            const healthBar = createHealthBar(ENEMY_HEALTH_SEGMENTS, true);
            healthBar.sprite.position.set(0, 1.8, 0);
            enemyAxieModel.add(healthBar.sprite);
            enemyHealthBarSprite = healthBar.sprite;
            enemyHealthBarMat = healthBar.spriteMat;
            enemyAxieSpawned = true;
        },
        undefined,
        (error) => { crearEnemyAxieFallback(randomAxie); }
    );
}

function crearEnemyAxieFallback(axieData) {
    const group = new THREE.Group();
    group.position.set(ENEMY_AXIE_SPAWN_POS.x, GROUND_Y - 0.5, ENEMY_AXIE_SPAWN_POS.z);
    group.rotation.y = Math.PI;
    const color = new THREE.Color(axieData.color || '#ff4444');
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 }));
    body.position.y = 0.6;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshStandardMaterial({ color: color, roughness: 0.4 }));
    head.position.set(0, 1.0, 0.25);
    group.add(head);
    scene.add(group);
    enemyAxieModel = group;
    enemyAxieSpawned = true;
    const healthBar = createHealthBar(ENEMY_HEALTH_SEGMENTS, true);
    healthBar.sprite.position.set(0, 1.8, 0);
    group.add(healthBar.sprite);
    enemyHealthBarSprite = healthBar.sprite;
    enemyHealthBarMat = healthBar.spriteMat;
}

function updateEnemyHealthBar() {
    if (!enemyHealthBarMat || !enemyAxie) return;
    const healthPercent = Math.max(0, enemyAxie.health / enemyAxieMaxHealth);
    const visibleSegments = Math.max(0, Math.min(ENEMY_HEALTH_SEGMENTS, Math.ceil(healthPercent * ENEMY_HEALTH_SEGMENTS)));
    updateHealthBarSprite(enemyHealthBarMat, ENEMY_HEALTH_SEGMENTS, visibleSegments, true);
}

function findBestEnemyTarget() {
    if (!enemyAxieModel || enemyAxieIsDead) return null;
    const enemyPos = enemyAxieModel.position;
    let bestTarget = null;
    let bestPriority = 0;
    if (playerModel && !isPlayerDead) {
        const distToPlayer = enemyPos.distanceTo(playerModel.position);
        if (distToPlayer <= ENEMY_AXIE_AGRO_RANGE) {
            return { position: playerModel.position, type: 'player', health: playerHealth, isDead: isPlayerDead, priority: 5, dist: distToPlayer, takeDamage: playerTakeDamage };
        }
    }
    let closestMinion = null;
    let closestMinionDist = Infinity;
    for (const minion of aliados) {
        if (minion.isDead) continue;
        const dist = enemyPos.distanceTo(minion.group.position);
        if (dist < closestMinionDist && dist < ENEMY_AXIE_AGRO_RANGE) {
            closestMinionDist = dist;
            closestMinion = minion;
        }
    }
    if (closestMinion) {
        bestTarget = { position: closestMinion.group.position, type: 'minion', health: closestMinion.health, isDead: closestMinion.isDead, ref: closestMinion, priority: 4, dist: closestMinionDist };
        bestPriority = 4;
    }
    if (bestPriority < 4) {
        let closestTower = null;
        let closestDist = Infinity;
        for (const tower of towers) {
            if (tower.isDead || tower.isEnemy) continue;
            const dist = enemyPos.distanceTo(tower.position);
            if (dist < closestDist && dist < 15) {
                closestDist = dist;
                closestTower = tower;
            }
        }
        if (closestTower) {
            bestTarget = { position: closestTower.position, type: 'tower', health: closestTower.health, isDead: closestTower.isDead, ref: closestTower, priority: 3, dist: closestDist };
            bestPriority = 3;
        }
    }
    if (bestPriority < 3 && nexusAliado && !nexusAliado.isDead) {
        const distToNexus = enemyPos.distanceTo(nexusAliado.position);
        if (distToNexus < 20) {
            bestTarget = { position: nexusAliado.position, type: 'nexus', health: nexusAliado.health, isDead: nexusAliado.isDead, ref: nexusAliado, priority: 2, dist: distToNexus };
            bestPriority = 2;
        }
    }
    return bestTarget;
}

function enemyAxieAttack(target) {
    if (!target || target.isDead || enemyAxieIsDead) return;
    if (target.type === 'player') { playerTakeDamage(ENEMY_AXIE_ATTACK_DAMAGE); return; }
    if (target.type === 'minion' && target.ref) {
        target.ref.health -= ENEMY_AXIE_ATTACK_DAMAGE;
        if (target.ref.updateHealthBar) target.ref.updateHealthBar();
        if (target.ref.health <= 0) target.ref.die();
        return;
    }
    if (target.type === 'tower' && target.ref) {
        target.ref.health -= ENEMY_AXIE_ATTACK_DAMAGE;
        if (target.ref.updateHealthBar) target.ref.updateHealthBar();
        if (target.ref.health <= 0) target.ref.die();
        return;
    }
    if (target.type === 'nexus' && target.ref) {
        target.ref.health -= ENEMY_AXIE_ATTACK_DAMAGE;
        if (target.ref.updateHealthBar) target.ref.updateHealthBar();
        if (target.ref.health <= 0) target.ref.die();
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
                enemyAxieVelocityY = 0;
            }
            updateEnemyHealthBar();
        }
        return;
    }

    const diffY = GROUND_Y - enemyAxieModel.position.y;
    if (Math.abs(diffY) > 0.001) {
        enemyAxieModel.position.y += diffY * Math.min(1, 6 * delta);
    } else {
        enemyAxieModel.position.y = GROUND_Y;
    }
    enemyAxieVelocityY = 0;

    enemyAxieAttackCooldown -= delta;
    const bestTarget = findBestEnemyTarget();
    if (bestTarget) {
        const distToTarget = enemyAxieModel.position.distanceTo(bestTarget.position);
        if (distToTarget <= ENEMY_AXIE_ATTACK_RANGE) {
            enemyAxieState = 'attack';
            enemyAxieTarget = bestTarget;
            const angle = Math.atan2(bestTarget.position.x - enemyAxieModel.position.x, bestTarget.position.z - enemyAxieModel.position.z);
            enemyAxieModel.rotation.y = angle;
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
            enemyAxieState = 'chase';
            enemyAxieTarget = bestTarget;
            const dx = bestTarget.position.x - enemyAxieModel.position.x;
            const dz = bestTarget.position.z - enemyAxieModel.position.z;
            const totalDist = Math.sqrt(dx * dx + dz * dz);
            if (totalDist > 0.5) {
                const moveSpeed = ENEMY_AXIE_SPEED * delta;
                const stepX = (dx / totalDist) * moveSpeed;
                const stepZ = (dz / totalDist) * moveSpeed;
                enemyAxieModel.position.x += stepX;
                enemyAxieModel.position.z += stepZ;
                const angle = Math.atan2(dx, dz);
                enemyAxieModel.rotation.y = angle;
                if (enemyAxieCurrentAnim !== 'walk' && enemyAxieAnimWalk) {
                    if (enemyAxieAnimIdle) enemyAxieAnimIdle.stop();
                    enemyAxieAnimWalk.play();
                    enemyAxieCurrentAnim = 'walk';
                }
            }
        }
    } else {
        enemyAxieState = 'move';
        enemyAxieTarget = null;
        const moveSpeed = ENEMY_AXIE_SPEED * delta * 0.8;
        enemyAxieModel.position.z -= moveSpeed;
        if (enemyAxieModel.position.z < -26) enemyAxieModel.position.z = -26;
        if (enemyAxieCurrentAnim !== 'walk' && enemyAxieAnimWalk) {
            if (enemyAxieAnimIdle) enemyAxieAnimIdle.stop();
            enemyAxieAnimWalk.play();
            enemyAxieCurrentAnim = 'walk';
        }
    }
    const limitX = 17;
    enemyAxieModel.position.x = Math.max(-limitX, Math.min(limitX, enemyAxieModel.position.x));
    updateEnemyHealthBar();
    if (enemyAxieMixer) enemyAxieMixer.update(delta);
}

function resetEnemyAxie() {
    if (enemyAxieModel) { scene.remove(enemyAxieModel); enemyAxieModel = null; }
    enemyAxie = null;
    enemyAxieMixer = null;
    enemyAxieAnimIdle = null;
    enemyAxieAnimWalk = null;
    enemyAxieSpawned = false;
    enemyAxieSpawnTimer = 0;
    enemyAxieIsDead = false;
    enemyAxieHealth = enemyAxieMaxHealth;
    enemyAxieRespawnTimer = 0;
    enemyAxieVelocityY = 0;
    enemyHealthBarSprite = null;
    enemyHealthBarMat = null;
}

function resolveMinionCollisions(delta) {
    const allMinions = aliados.concat(enemigos);
    const minDist = CONFIG.MINION_COLLISION_DISTANCE;
    const minDistSq = minDist * minDist;
    for (let i = 0; i < allMinions.length; i++) {
        const a = allMinions[i];
        if (a.isDead || !a.group.visible) continue;
        for (let j = i + 1; j < allMinions.length; j++) {
            const b = allMinions[j];
            if (b.isDead || !b.group.visible) continue;
            const dx = b.group.position.x - a.group.position.x;
            const dz = b.group.position.z - a.group.position.z;
            const distSq = dx * dx + dz * dz;
            if (distSq < minDistSq && distSq > 0.0001) {
                const dist = Math.sqrt(distSq);
                const overlap = (minDist - dist) * 0.3;
                const nx = dx / dist;
                const nz = dz / dist;
                a.group.position.x -= nx * overlap;
                a.group.position.z -= nz * overlap;
                b.group.position.x += nx * overlap;
                b.group.position.z += nz * overlap;
                const limitX = 16;
                const limitZ = CONFIG.minionLimitZ;
                a.group.position.x = Math.max(-limitX, Math.min(limitX, a.group.position.x));
                b.group.position.x = Math.max(-limitX, Math.min(limitX, b.group.position.x));
                a.group.position.z = Math.max(-limitZ, Math.min(limitZ, a.group.position.z));
                b.group.position.z = Math.max(-limitZ, Math.min(limitZ, b.group.position.z));
            }
        }
    }

    for (const minion of allMinions) {
        if (minion.isDead || !minion.group.visible) continue;
        if (!minion.target || minion.target.isDead) {
            const newZ = minion.group.position.z + minion.direction * minion.speed * delta * 0.5;
            minion.group.position.z = Math.max(-CONFIG.minionLimitZ, Math.min(CONFIG.minionLimitZ, newZ));
        }
    }
}

function showPauseMenu() {
    if (gameFinished || gamePaused) return;
    gamePaused = true;
    pauseMenu = document.createElement('div');
    pauseMenu.id = 'pause-menu';
    pauseMenu.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1500;
    `;
    const title = document.createElement('div');
    title.textContent = '⏸️ PAUSA';
    title.style.cssText = `font-size: 64px; font-weight: bold; color: #88ddff; text-shadow: 0 0 30px rgba(136,221,255,0.3); font-family: 'Arial Black', sans-serif; margin-bottom: 40px;`;
    const button = document.createElement('button');
    button.textContent = '🚪 Volver al Inicio';
    button.style.cssText = `
        padding: 16px 48px;
        font-size: 24px;
        font-weight: bold;
        background: linear-gradient(135deg, #ff4444, #cc2222);
        color: #fff;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-family: 'Arial', sans-serif;
        transition: transform 0.3s;
        box-shadow: 0 0 30px rgba(255,68,68,0.3);
    `;
    button.onmouseenter = () => { button.style.transform = 'scale(1.05)'; };
    button.onmouseleave = () => { button.style.transform = 'scale(1)'; };
    button.onclick = () => { abandonGame(); };
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '↩️ Reanudar';
    cancelBtn.style.cssText = `
        padding: 12px 36px;
        font-size: 18px;
        font-weight: bold;
        background: rgba(255,255,255,0.1);
        color: #88aaff;
        border: 2px solid rgba(136,170,255,0.3);
        border-radius: 12px;
        cursor: pointer;
        font-family: 'Arial', sans-serif;
        transition: transform 0.3s;
        margin-top: 15px;
    `;
    cancelBtn.onclick = () => { hidePauseMenu(); };
    pauseMenu.appendChild(title);
    pauseMenu.appendChild(button);
    pauseMenu.appendChild(cancelBtn);
    document.body.appendChild(pauseMenu);
}

function hidePauseMenu() {
    gamePaused = false;
    if (pauseMenu && pauseMenu.parentNode) {
        pauseMenu.parentNode.removeChild(pauseMenu);
        pauseMenu = null;
    }
}

function abandonGame() {
    gameFinished = true;
    gamePaused = false;
    if (pauseMenu && pauseMenu.parentNode) { pauseMenu.parentNode.removeChild(pauseMenu); pauseMenu = null; }
    if (victoryScreen && victoryScreen.parentNode) { victoryScreen.parentNode.removeChild(victoryScreen); victoryScreen = null; }
    if (defeatScreen && defeatScreen.parentNode) { defeatScreen.parentNode.removeChild(defeatScreen); defeatScreen = null; }
    if (playerHUD) { playerHUD.remove(); playerHUD = null; }
    if (potionHUD) { potionHUD.remove(); potionHUD = null; }
    if (itemHUD) { itemHUD.remove(); itemHUD = null; }
    if (hudWrapper) { hudWrapper.remove(); hudWrapper = null; }

    for (const minion of aliados) { if (minion.group && minion.group.parent) scene.remove(minion.group); }
    for (const minion of enemigos) { if (minion.group && minion.group.parent) scene.remove(minion.group); }
    aliados.length = 0;
    enemigos.length = 0;

    for (const proj of playerProjectiles) {
        if (proj.mesh && proj.mesh.parent) scene.remove(proj.mesh);
        if (proj.glow && proj.glow.parent) scene.remove(proj.glow);
    }
    playerProjectiles.length = 0;

    for (const tower of towers) { if (tower.group && tower.group.parent) scene.remove(tower.group); }
    towers.length = 0;

    if (nexusAliado) {
        nexusAliado.isDead = false;
        nexusAliado.health = nexusAliado.maxHealth;
        nexusAliado.group.visible = true;
        nexusAliado.isExploding = false;
        nexusAliado.updateHealthBar();
    }
    if (nexusEnemigo) {
        nexusEnemigo.isDead = false;
        nexusEnemigo.health = nexusEnemigo.maxHealth;
        nexusEnemigo.group.visible = true;
        nexusEnemigo.isExploding = false;
        nexusEnemigo.updateHealthBar();
    }

    createTower(-3.5, -18, false, 1);
    createTower(-3.5, -6, false, 2);
    createTower(4.2, 18, true, 1);
    createTower(4.2, 6, true, 2);

    gameStarted = false;
    startTimer = CONFIG.SPAWN_DELAY;
    waveNumber = 1;
    gameTime = 0;
    isFirstWave = true;
    firstWaveTimer = 0;
    gameFinished = false;
    axieLoaded = false;
    currentAxieName = 'Bing';
    isPlayerDead = false;
    playerHealth = playerMaxHealth;
    playerRespawnTimer = 0;

    resetEnemyAxie();

    if (renderer && renderer.domElement) {
        renderer.domElement.style.display = 'none';
    }
    showMainMenu();
}

function showVictoryScreen() {
    if (gameFinished) return;
    gameFinished = true;
    if (victoryScreen && victoryScreen.parentNode) victoryScreen.parentNode.removeChild(victoryScreen);
    victoryScreen = document.createElement('div');
    victoryScreen.id = 'victory-screen';
    victoryScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    const title = document.createElement('div');
    title.textContent = '🏆 GANASTE 🏆';
    title.style.cssText = `
        font-size: 80px;
        font-weight: bold;
        color: #ffdd44;
        text-shadow: 0 0 30px rgba(255,220,68,0.5), 0 0 60px rgba(255,220,68,0.3);
        font-family: 'Arial Black', sans-serif;
        margin-bottom: 30px;
    `;
    const subtitle = document.createElement('div');
    subtitle.textContent = '¡Has destruido el Nexo Enemigo!';
    subtitle.style.cssText = `font-size: 28px; color: #88ddff; font-family: 'Arial', sans-serif; margin-bottom: 40px;`;
    const button = document.createElement('button');
    button.textContent = '🏠 Ir a Inicio';
    button.style.cssText = `
        padding: 16px 48px;
        font-size: 24px;
        font-weight: bold;
        background: linear-gradient(135deg, #44ff88, #22aa66);
        color: #fff;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-family: 'Arial', sans-serif;
        transition: transform 0.3s;
        box-shadow: 0 0 30px rgba(68,255,136,0.3);
    `;
    button.onclick = () => {
        if (victoryScreen && victoryScreen.parentNode) victoryScreen.parentNode.removeChild(victoryScreen);
        abandonGame();
    };
    victoryScreen.appendChild(title);
    victoryScreen.appendChild(subtitle);
    victoryScreen.appendChild(button);
    document.body.appendChild(victoryScreen);
    gameFinished = true;
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
    pantallaCarga.id = 'loading-screen';
    pantallaCarga.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 5000;
        font-family: 'Segoe UI', Arial, sans-serif;
    `;
    
    const title = document.createElement('div');
    title.textContent = '⚔️ AXIE LEGENDS';
    title.style.cssText = `
        font-size: 56px;
        font-weight: bold;
        color: #44ff88;
        text-shadow: 0 0 30px rgba(68,255,136,0.6), 0 0 60px rgba(68,255,136,0.3);
        margin-bottom: 60px;
        letter-spacing: 4px;
    `;
    pantallaCarga.appendChild(title);
    
    const sub = document.createElement('div');
    sub.textContent = 'Cargando terreno de batalla...';
    sub.style.cssText = `
        font-size: 18px;
        color: #88aaff;
        margin-bottom: 30px;
        letter-spacing: 2px;
    `;
    pantallaCarga.appendChild(sub);
    
    const barContainer = document.createElement('div');
    barContainer.style.cssText = `
        width: 400px;
        height: 14px;
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid rgba(68,255,136,0.4);
        box-shadow: 0 0 30px rgba(68,255,136,0.2);
    `;
    
    const bar = document.createElement('div');
    bar.id = 'loading-progress-bar';
    bar.style.cssText = `
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #44ff88, #22aa66);
        border-radius: 6px;
        transition: width 0.3s ease;
        box-shadow: 0 0 20px rgba(68,255,136,0.6);
    `;
    barContainer.appendChild(bar);
    pantallaCarga.appendChild(barContainer);
    
    const texto = document.createElement('div');
    texto.id = 'loading-text';
    texto.textContent = 'Cargando... 0%';
    texto.style.cssText = `
        font-size: 14px;
        color: #aaa;
        margin-top: 20px;
        letter-spacing: 1px;
    `;
    pantallaCarga.appendChild(texto);
    
    document.body.appendChild(pantallaCarga);
}

function ocultarPantallaCarga() {
    if (pantallaCarga && pantallaCarga.parentNode) {
        pantallaCarga.parentNode.removeChild(pantallaCarga);
        pantallaCarga = null;
    }
}

function showMainMenu() {
    if (renderer && renderer.domElement) renderer.domElement.style.display = 'none';
    if (timerDiv) timerDiv.style.display = 'none';
    if (fpsDiv) fpsDiv.style.display = 'none';
    if (waveDiv) waveDiv.style.display = 'none';
    if (targetUI) targetUI.style.display = 'none';

    if (menuScreen) { menuScreen.destroy(); menuScreen = null; }

    menuScreen = new MenuScreen();
    menuScreen.show(
        (axieId, mode) => {
            selectedAxieId = axieId;
            startGame(axieId);
        },
        (axieId) => { selectedAxieId = axieId; }
    );
}

async function startGame(axieId) {
    mostrarPantallaCarga();
    actualizarPantallaCarga(5, 'Iniciando...');
    
    if (menuScreen) { menuScreen.destroy(); menuScreen = null; }
    
    while (!groundReady || !nexusAliado || !nexusEnemigo || towers.length === 0 || !shopAliada || !shopEnemiga) {
        actualizarPantallaCarga(15, 'Cargando terreno...');
        await new Promise(r => setTimeout(r, 100));
    }
    actualizarPantallaCarga(40, 'Terreno listo');
    
    console.log('📦 Cargando modelo del jugador...');
    actualizarPantallaCarga(60, 'Cargando Axie...');
    await loadSelectedAxie(axieId);
    console.log('✅ Axie cargado');
    actualizarPantallaCarga(80, 'Axie listo');
    
    playerModel.position.set(playerSpawnPosition.x, GROUND_Y, playerSpawnPosition.z);
    smoothPlayerPos.set(playerSpawnPosition.x, GROUND_Y, playerSpawnPosition.z);
    playerModel.visible = true;
    
    gameFinished = false;
    gameStarted = false;
    startTimer = CONFIG.SPAWN_DELAY;
    waveNumber = 1;
    gameTime = 0;
    isFirstWave = true;
    firstWaveTimer = 0;
    isPlayerDead = false;
    playerHealth = playerMaxHealth;
    playerRespawnTimer = 0;
    
    for (const minion of aliados) { if (minion.group && minion.group.parent) scene.remove(minion.group); }
    for (const minion of enemigos) { if (minion.group && minion.group.parent) scene.remove(minion.group); }
    aliados.length = 0;
    enemigos.length = 0;
    
    inicializarCamaraFija();
    console.log('📷 Cámara lista');
    
    actualizarPantallaCarga(90, 'Preparando HUD...');
    createPlayerHUD();
    updatePlayerHUD();
    
    actualizarPantallaCarga(95, 'Renderizando...');
    if (renderer && renderer.domElement) renderer.domElement.style.display = 'block';
    if (timerDiv) timerDiv.style.display = 'block';
    if (fpsDiv) fpsDiv.style.display = 'block';
    if (waveDiv) waveDiv.style.display = 'block';
    
    camera.position.copy(cameraSmoothPos);
    camera.lookAt(cameraSmoothTarget);
    renderer.render(scene, camera);
    await new Promise(r => requestAnimationFrame(r));
    renderer.render(scene, camera);
    await new Promise(r => requestAnimationFrame(r));
    
    actualizarPantallaCarga(100, '¡Listo!');
    await new Promise(r => setTimeout(r, 200));
    ocultarPantallaCarga();
    
    console.log(`🎮 ¡JUEGO INICIADO! GROUND_Y = ${GROUND_Y.toFixed(3)}, CAMERA_FIXED_Y = ${CAMERA_FIXED_Y.toFixed(3)}`);
    
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (gameFinished) return;
        if (shopOpen) { closeShop(); return; }
        if (gameStarted) {
            if (gamePaused) hidePauseMenu();
            else showPauseMenu();
        }
    }
});

let frameCounter = 0;
let lastTime = 0;
let realFPS = 0;
let fpsCounter = 0;
let fpsTimer = 0;

function gameLoop(time) {
    if (gameFinished) {
        if (nexusEnemigo) nexusEnemigo.updateExplosion(0.016);
        renderer.render(scene, camera);
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gamePaused) {
        renderer.render(scene, camera);
        requestAnimationFrame(gameLoop);
        return;
    }

    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    frameCounter++;
    gameTime += delta;

    if (window.currentTarget) {
        let isTargetDead = false;
        if (window.currentTarget.isDead === true) isTargetDead = true;
        else if (window.currentTarget.health !== undefined && window.currentTarget.health <= 0) isTargetDead = true;
        if (isTargetDead) {
            window.currentTarget = null;
            if (typeof targetUI !== 'undefined' && targetUI) targetUI.style.display = 'none';
            isAutoMovingToTarget = false;
        }
    }

    if (isPlayerDead) {
        playerRespawnTimer -= delta;
        if (playerRespawnTimer <= 0 && !gameFinished) {
            isPlayerDead = false;
            playerHealth = playerMaxHealth;
            playerRespawnTimer = 0;
            updatePlayerHUD();
            if (playerModel) {
                playerModel.position.set(playerSpawnPosition.x, GROUND_Y, playerSpawnPosition.z);
                smoothPlayerPos.set(playerSpawnPosition.x, GROUND_Y, playerSpawnPosition.z);
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

    if (playerModel && !isPlayerDead && isMovingToTarget && targetPosition) {
        const dx = smoothTargetPos.x - smoothPlayerPos.x;
        const dz = smoothTargetPos.z - smoothPlayerPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.05) {
            // ✅ FIX: solo X y Z, Y siempre GROUND_Y
            smoothPlayerPos.x = smoothTargetPos.x;
            smoothPlayerPos.z = smoothTargetPos.z;
            smoothPlayerPos.y = GROUND_Y;
            isMovingToTarget = false;
            targetPosition = null;
            isAutoMovingToTarget = false;
            if (animIdle && animWalk) { animWalk.stop(); animIdle.play(); currentAnim = 'idle'; }
            if (isAutoWalkingToShop && autoWalkShopTarget) {
                const distToShop = Math.sqrt(
                    Math.pow(playerModel.position.x - autoWalkShopTarget.x, 2) +
                    Math.pow(playerModel.position.z - autoWalkShopTarget.z, 2)
                );
                if (distToShop <= CONFIG.SHOP_AUTO_OPEN_DISTANCE + 1.5) {
                    if (!autoWalkShopTarget.isEnemy) openShop();
                }
                isAutoWalkingToShop = false;
                autoWalkShopTarget = null;
            }
        } else {
            const moveSpeed = playerSpeed * delta;
            const stepX = (dx / dist) * moveSpeed;
            const stepZ = (dz / dist) * moveSpeed;
            if (Math.abs(stepX) > Math.abs(dx)) smoothPlayerPos.x = smoothTargetPos.x;
            else smoothPlayerPos.x += stepX;
            if (Math.abs(stepZ) > Math.abs(dz)) smoothPlayerPos.z = smoothTargetPos.z;
            else smoothPlayerPos.z += stepZ;
            // ✅ FIX: Y siempre GROUND_Y
            smoothPlayerPos.y = GROUND_Y;
            if (currentAnim !== 'walk' && animWalk) {
                if (animIdle) animIdle.stop();
                animWalk.play();
                currentAnim = 'walk';
            }
            const angle = Math.atan2(dx, dz);
            let currentAngle = playerModel.rotation.y;
            let diff = angle - currentAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            playerModel.rotation.y += diff * Math.min(1, 6 * delta);
        }
        // ✅ FIX: solo X y Z, Y siempre GROUND_Y
        playerModel.position.x = smoothPlayerPos.x;
        playerModel.position.z = smoothPlayerPos.z;
        playerModel.position.y = GROUND_Y;
    } else if (playerModel && smoothPlayerPos) {
        if (!isPlayerDead) {
            playerModel.position.x = smoothPlayerPos.x;
            playerModel.position.z = smoothPlayerPos.z;
            playerModel.position.y = GROUND_Y;
        }
        if (currentAnim !== 'idle' && animIdle && !isMovingToTarget && !isAutoMovingToTarget && !isPlayerDead) {
            if (animWalk) animWalk.stop();
            animIdle.play();
            currentAnim = 'idle';
        }
    }

    if (playerModel && !isPlayerDead && window.currentTarget && !window.currentTarget.isDead) {
        const targetPos = window.currentTarget.group.position;
        const playerPos = playerModel.position;
        const distToTarget = Math.sqrt(
            Math.pow(targetPos.x - playerPos.x, 2) +
            Math.pow(targetPos.z - playerPos.z, 2)
        );

        if (!window.currentTarget.isEnemy) {
            window.showTarget(window.currentTarget);
            if (distToTarget > 0.5) {
                isAutoMovingToTarget = true;
                isMovingToTarget = true;
                targetPosition = new THREE.Vector3(targetPos.x, GROUND_Y, targetPos.z);
                smoothTargetPos.copy(targetPosition);
            } else {
                if (isAutoMovingToTarget) {
                    isAutoMovingToTarget = false;
                    isMovingToTarget = false;
                    targetPosition = null;
                }
            }
            attackCooldown = 0;
            isAttacking = false;
        } else {
            if (distToTarget <= attackRange) {
                if (isAutoMovingToTarget) {
                    isAutoMovingToTarget = false;
                    isMovingToTarget = false;
                    targetPosition = null;
                }
                const angle = Math.atan2(targetPos.x - playerPos.x, targetPos.z - playerPos.z);
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
                    const proj = new PlayerProjectile(startPos, window.currentTarget, attackDamage);
                    playerProjectiles.push(proj);
                    attackCooldown = attackSpeed;
                    isAttacking = true;
                    setTimeout(() => { isAttacking = false; }, 100);
                }
            } else {
                if (!isMovingToTarget || isAutoMovingToTarget) {
                    const dx = targetPos.x - playerPos.x;
                    const dz = targetPos.z - playerPos.z;
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    if (dist > 0.5) {
                        isAutoMovingToTarget = true;
                        isMovingToTarget = true;
                        targetPosition = new THREE.Vector3(targetPos.x, GROUND_Y, targetPos.z);
                        smoothTargetPos.copy(targetPosition);
                    }
                }
            }
        }
    } else {
        attackCooldown = 0;
        isAttacking = false;
        if (!window.currentTarget || window.currentTarget.isDead) {
            if (isAutoMovingToTarget) {
                isAutoMovingToTarget = false;
                isMovingToTarget = false;
                targetPosition = null;
            }
        }
    }

    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
        const proj = playerProjectiles[i];
        proj.update(delta);
        if (!proj.active) playerProjectiles.splice(i, 1);
    }

    updateTargetUI();

    if (mixer && !isPlayerDead) mixer.update(delta);

    if (!gameStarted) {
        startTimer -= delta;
        waveDiv.textContent = `⏳ ${Math.ceil(startTimer)}s`;
        if (startTimer <= 0) {
            gameStarted = true;
            spawnWave();
            setTimeout(() => {
                if (!gameFinished && gameStarted) spawnEnemyAxie();
            }, ENEMY_AXIE_SPAWN_DELAY * 1000);
        }
        if (playerModel) updateCameraPosition();
        renderer.render(scene, camera);
        requestAnimationFrame(gameLoop);
        return;
    }

    const enemies = { aliados, enemigos };
    for (const tower of towers) tower.update(delta, enemies);

    for (const minion of aliados) {
        if (minion.mixer && !minion.isDead) minion.mixer.update(delta);
    }
    for (const minion of enemigos) {
        if (minion.mixer && !minion.isDead) minion.mixer.update(delta);
    }

    if (frameCounter % CONFIG.updateInterval === 0) {
        for (const minion of aliados) minion.update(delta, aliados, enemigos, towers, playerModel);
        for (const minion of enemigos) minion.update(delta, aliados, enemigos, towers, playerModel);
        resolveMinionCollisions(delta);
    }

    suavizarYEntidades(delta);

    if (gameStarted && !gameFinished) updateEnemyAxie(delta);

    if (shopAliada) shopAliada.update(delta, playerModel ? playerModel.position : null);
    if (shopEnemiga) shopEnemiga.update(delta, enemyAxieModel ? enemyAxieModel.position : null);

    if (nexusEnemigo) nexusEnemigo.updateExplosion(delta);

    const aliveAliados = aliados.filter(m => !m.isDead);
    const aliveEnemigos = enemigos.filter(m => !m.isDead);
    if (aliveAliados.length === 0 || aliveEnemigos.length === 0) {
        waveCooldown += delta;
        if (waveCooldown > WAVE_DELAY) {
            waveCooldown = 0;
            spawnWave();
        }
    } else {
        waveCooldown = 0;
    }

    if (playerModel) updateCameraPosition();
    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
}

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 7.2;
    camera.left = -frustumSize * aspect;
    camera.right = frustumSize * aspect;
    camera.top = frustumSize;
    camera.bottom = -frustumSize;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('beforeunload', () => {
    healthBarCache.clear();
    renderer.dispose();
});

const targetUI = document.createElement('div');
targetUI.id = 'target-ui';
targetUI.style.cssText = "position:fixed;top:20px;left:20px;width:240px;background:rgba(0,0,0,0.85);border:2px solid rgba(255,200,50,0.6);border-radius:8px;padding:8px 12px;z-index:150;font-family:'Segoe UI',Arial,sans-serif;color:#fff;display:none;pointer-events:none;box-shadow:0 0 30px rgba(0,0,0,0.9);";
targetUI.innerHTML = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span id="target-name" style="font-weight:bold;font-size:14px;color:#ffcc44;">Enemigo</span><span id="target-level" style="font-size:11px;color:#88aaff;background:rgba(255,255,255,0.1);padding:0 8px;border-radius:4px;">Lv.1</span><span id="target-type" style="font-size:10px;color:#88aaff;background:rgba(255,255,255,0.1);padding:0 8px;border-radius:4px;">Minion</span></div><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:12px;color:#ff6644;">❤️</span><div style="flex:1;height:16px;background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);"><div id="target-health-bar" style="width:100%;height:100%;background:linear-gradient(90deg,#ff2244,#ff6644);border-radius:4px;transition:width 0.2s;"></div></div><span id="target-health-text" style="font-size:11px;font-weight:bold;min-width:50px;text-align:right;color:#fff;">100/100</span></div>';
document.body.appendChild(targetUI);

window.currentTarget = null;

window.showTarget = function (target) {
    window.currentTarget = target;
    if (!target || target.isDead) {
        targetUI.style.display = 'none';
        return;
    }
    targetUI.style.display = 'block';
    let nameEl = document.getElementById('target-name');
    let levelEl = document.getElementById('target-level');
    let typeEl = document.getElementById('target-type');
    let healthBar = document.getElementById('target-health-bar');
    let healthText = document.getElementById('target-health-text');

    let name = 'Enemigo';
    let tipoTexto = '';
    if (target.type === 'minion') {
        if (target.isEnemy) {
            if (target.minionType === 'melee' || target.tipo === 'melee') { name = '⚔️ Guerrero Rojo'; tipoTexto = 'Melee'; }
            else if (target.minionType === 'mage' || target.tipo === 'mage') { name = '🧙 Mago Rojo'; tipoTexto = 'Mago'; }
            else { name = '🔴 Minion Enemigo'; tipoTexto = 'Minion'; }
        } else {
            if (target.minionType === 'melee' || target.tipo === 'melee') { name = '🛡️ Guerrero Azul'; tipoTexto = 'Melee'; }
            else if (target.minionType === 'mage' || target.tipo === 'mage') { name = '🔮 Mago Azul'; tipoTexto = 'Mago'; }
            else { name = '🔵 Minion Aliado'; tipoTexto = 'Minion'; }
        }
    } else if (target.type === 'tower') {
        if (target.isEnemy) { name = '🗼 Torre Enemiga'; tipoTexto = 'Torre'; }
        else { name = '🏰 Torre Aliada'; tipoTexto = 'Torre'; }
    } else if (target.type === 'nexus') {
        if (target.isEnemy) { name = '🔥 Nexo Enemigo'; tipoTexto = 'Nexo'; }
        else { name = '💎 Nexo Aliado'; tipoTexto = 'Nexo'; }
    } else if (target.type === 'shop') {
        if (target.isEnemy) { name = '🏪 Tienda Enemiga'; tipoTexto = 'Tienda'; }
        else { name = '🏪 Tienda Aliada'; tipoTexto = 'Tienda'; }
    } else if (target.type === 'enemy_axie') {
        name = `🤖 ${enemyAxie ? enemyAxie.nombre : 'Axie Enemigo'}`;
        tipoTexto = 'Axie Enemigo';
    } else if (target.type === 'player') {
        name = `🦊 ${currentAxieName}`;
        tipoTexto = 'Jugador';
    }

    nameEl.textContent = name;
    levelEl.textContent = 'Lv.1';
    typeEl.textContent = tipoTexto;

    let maxHealth = 100;
    let currentHealth = 100;
    if (target.type === 'enemy_axie') {
        maxHealth = enemyAxieMaxHealth || 200;
        currentHealth = enemyAxie ? enemyAxie.health : 0;
    } else if (target.type === 'shop') {
        maxHealth = 1;
        currentHealth = 1;
    } else {
        maxHealth = target.maxHealth || 100;
        currentHealth = target.health;
    }

    let pct = (currentHealth / maxHealth) * 100;
    healthBar.style.width = Math.max(0, pct) + '%';
    healthText.textContent = Math.floor(currentHealth) + '/' + maxHealth;
};

window.updateTargetUI = function () {
    if (window.currentTarget && !window.currentTarget.isDead) {
        window.showTarget(window.currentTarget);
    } else if (window.currentTarget) {
        window.currentTarget = null;
        targetUI.style.display = 'none';
    }
};

window.getTargetFromClick = function (event) {
    let rect = renderer.domElement.getBoundingClientRect();
    let mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    let selectables = [];
    let allEntities = [].concat(enemigos, aliados, towers);
    if (nexusAliado) allEntities.push(nexusAliado);
    if (nexusEnemigo) allEntities.push(nexusEnemigo);

    if (enemyAxieModel && !enemyAxieIsDead) {
        enemyAxieModel.traverse(function (child) {
            if (child.isMesh) {
                child.userData.targetRef = {
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
                selectables.push(child);
            }
        });
    }

    if (playerModel) {
        playerModel.traverse(function (child) {
            if (child.isMesh) {
                child.userData.targetRef = {
                    group: playerModel,
                    isDead: isPlayerDead,
                    health: playerHealth,
                    maxHealth: playerMaxHealth,
                    type: 'player',
                    isEnemy: false,
                    updateHealthBar: function () { },
                    die: function () { }
                };
                selectables.push(child);
            }
        });
    }

    for (let i = 0; i < allEntities.length; i++) {
        let entity = allEntities[i];
        if (entity.isDead || !entity.group) continue;
        entity.group.traverse(function (child) {
            if (child.isMesh) {
                if (!child.userData.targetRef) child.userData.targetRef = entity;
                selectables.push(child);
            }
        });
    }

    if (shopAliada) {
        shopAliada.group.traverse(function (child) {
            if (child.isMesh) {
                child.userData.targetRef = {
                    group: shopAliada.group,
                    isDead: false,
                    health: 1,
                    maxHealth: 1,
                    type: 'shop',
                    isEnemy: false,
                    updateHealthBar: function () { },
                    die: function () { }
                };
                selectables.push(child);
            }
        });
    }
    if (shopEnemiga) {
        shopEnemiga.group.traverse(function (child) {
            if (child.isMesh) {
                child.userData.targetRef = {
                    group: shopEnemiga.group,
                    isDead: false,
                    health: 1,
                    maxHealth: 1,
                    type: 'shop',
                    isEnemy: true,
                    updateHealthBar: function () { },
                    die: function () { }
                };
                selectables.push(child);
            }
        });
    }

    let intersects = raycaster.intersectObjects(selectables);
    if (intersects.length > 0) {
        let parent = intersects[0].object;
        while (parent) {
            if (parent.userData && parent.userData.targetRef) return parent.userData.targetRef;
            parent = parent.parent;
        }
    }
    return null;
};

renderer.domElement.addEventListener('mousedown', function (e) {
    if (e.button === 0 && playerModel && !isPlayerDead) {
        let target = window.getTargetFromClick(e);
        if (target && !target.isDead) {
            window.showTarget(target);
            isMovingToTarget = false;
            targetPosition = null;
            isAutoMovingToTarget = false;
            return;
        }
        if (window.currentTarget) {
            window.currentTarget = null;
            targetUI.style.display = 'none';
        }
    } else if (e.button === 2 && window.currentTarget) {
        window.currentTarget = null;
        targetUI.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    if (timerDiv) timerDiv.style.display = 'none';
    if (fpsDiv) fpsDiv.style.display = 'none';
    if (waveDiv) waveDiv.style.display = 'none';
    if (targetUI) targetUI.style.display = 'none';
    showMainMenu();
});