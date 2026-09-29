// ============================================================
// main-test.js — Entorno aislado para probar el mapa ARAM
// ============================================================
// Solo carga el mapa. Cámara con zoom y movimiento libre.
// ============================================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---- CONFIGURACIÓN ----
const ARAM_MODEL_PATH = (import.meta.env.BASE_URL || '/') + 'assets/maps/aram_map.glb';

const CAM_CONFIG = {
    // Ángulo de la cámara (grados desde el suelo mirando hacia abajo)
    // 55 = vista isométrica típica de LoL
    angulo: 55,
    // Distancia desde el punto de mira
    distancia: 50,
    // Altura de la cámara sobre el suelo
    altura: 40,
    // Campo de visión (grados). 45 = LoL
    fov: 45,
    // A qué altura mira la cámara (para no mirar el suelo exacto sino un poco por encima)
    lookAtY: 1.0,
};

const MOVE_SPEED = 20;   // unidades por segundo con WASD/flechas
const ZOOM_SPEED = 0.1;  // multiplicador por cada tick de rueda

// ---- ESCENA ----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);
scene.fog = new THREE.Fog(0x0a0a1a, 80, 200);

// ---- CÁMARA ----
const camera = new THREE.PerspectiveCamera(
    CAM_CONFIG.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);

// Punto de mira: centro del mapa
const lookAtTarget = new THREE.Vector3(0, CAM_CONFIG.lookAtY, 0);

// Distancia orbital actual (modificable con la rueda del ratón)
let camDistancia = CAM_CONFIG.distancia;

function updateCamera() {
    const rad = CAM_CONFIG.angulo * Math.PI / 180;
    const offsetX = 0;
    const offsetZ = -Math.cos(rad) * camDistancia;
    const offsetY = CAM_CONFIG.altura;
    camera.position.set(
        lookAtTarget.x + offsetX,
        offsetY,
        lookAtTarget.z + offsetZ
    );
    camera.lookAt(lookAtTarget);
}

// ---- RENDERER ----
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ---- ENTORNO (reflejos suaves) ----
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
const roomEnv = new RoomEnvironment();
const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
scene.environment = envTexture;

// ---- LUCES ----
scene.add(new THREE.AmbientLight(0x303048, 1.2));
const mainLight = new THREE.DirectionalLight(0xffeedd, 1.8);
mainLight.position.set(15, 25, 10);
scene.add(mainLight);
const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
fillLight.position.set(-10, 10, -10);
scene.add(fillLight);

// ---- SUELO (grid de referencia, para saber dónde está el origen) ----
const grid = new THREE.GridHelper(200, 40, 0x4488cc, 0x224466);
grid.position.y = -0.01;
scene.add(grid);

// ---- CARGA DEL MAPA ARAM ----
const loader = new GLTFLoader();
let aramMapMesh = null;

loader.load(
    ARAM_MODEL_PATH,
    (gltf) => {
        aramMapMesh = gltf.scene;
        console.log('ARAM GLB cargado, hijos:', aramMapMesh.children.length);

        // Asegurar que todos los meshes tengan material
        aramMapMesh.traverse((child) => {
            if (child.isMesh) {
                if (!child.material) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        roughness: 0.5,
                        metalness: 0.1,
                    });
                }
            }
        });

        // El modelo viene limpio desde Blender:
        // escala 1:1:1, sin rotación, centrado en el origen.
        aramMapMesh.scale.set(50, 50, 50);
        aramMapMesh.rotation.set(0, 0, 0);
        aramMapMesh.position.set(0, 0, 0);

        scene.add(aramMapMesh);
    },
    undefined,
    (err) => {
        console.error('Error cargando mapa ARAM:', err);
    }
);

// ---- CONTROLES DE CÁMARA ----
// Zoom con la rueda del ratón
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    camDistancia += Math.sign(e.deltaY) * 2;
    camDistancia = Math.max(10, Math.min(150, camDistancia));
}, { passive: false });

// Movimiento con teclado (WASD + flechas) — mueve el punto de mira
const keys = { w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false };
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = true;
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = false;
});

// Pan con botón central o derecho del ratón
let isPanning = false;
let lastMouse = { x: 0, y: 0 };
renderer.domElement.addEventListener('mousedown', (e) => {
    if (e.button === 1 || e.button === 2) {
        isPanning = true;
        lastMouse.x = e.clientX;
        lastMouse.y = e.clientY;
        e.preventDefault();
    }
});
renderer.domElement.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
    // Mover en el plano del mundo (ignorar Y)
    lookAtTarget.x -= dx * 0.1;
    lookAtTarget.z -= dy * 0.1;
});
renderer.domElement.addEventListener('mouseup', () => { isPanning = false; });
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

// ---- BUCLE DE ANIMACIÓN ----
let lastTime = performance.now();
function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // Movimiento WASD
    const move = new THREE.Vector3();
    if (keys.w) move.z -= 1;
    if (keys.s) move.z += 1;
    if (keys.a) move.x -= 1;
    if (keys.d) move.x += 1;
    if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(MOVE_SPEED * delta);
        lookAtTarget.x += move.x;
        lookAtTarget.z += move.z;
    }

    updateCamera();
    renderer.render(scene, camera);
}
animate();

// ---- RESIZE ----
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log('main-test.js cargado. Controles: WASD/flechas = mover, rueda = zoom, botón derecho/central = pan.');