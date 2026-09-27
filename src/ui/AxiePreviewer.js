// =============================================
// VISOR 3D PARA EL MENU DE SELECCION (estilo LoL)
// =============================================
// Renderer propio y ligero, INDEPENDIENTE del motor del juego.
// Objetivo: previsualizar el modelo del Axie girando, con su arma.
// Rendimiento:
//   - pixelRatio bajo (1.25)
//   - antialias off
//   - auto-pausa cuando la pestana no esta visible
//   - un solo visor activo a la vez (se destruye al cerrar)

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Cache de GLTF compartida: si abres el menu 2 veces, no re-descarga.
const gltfCache = new Map();
const sharedLoader = new GLTFLoader();

function loadGLB(url) {
    if (gltfCache.has(url)) return gltfCache.get(url);
    const p = new Promise((resolve, reject) => {
        sharedLoader.load(url, resolve, undefined, reject);
    });
    gltfCache.set(url, p);
    return p;
}

export class AxiePreviewer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.baseUrl = options.baseUrl || '/';
        this.modelPath = null;
        this.model = null;
        this.weapon = null;
        this.mixer = null;
        this.idleAction = null;
        this.running = false;
        this._raf = 0;
        this._clock = new THREE.Clock();
        this._onVisibility = () => { this.syncVisibility(); };

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false,
            alpha: true,
            powerPreference: 'default',
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        this.scene = new THREE.Scene();

        // Entorno suave para que los materiales PBR no se vean planos
        try {
            const pmrem = new THREE.PMREMGenerator(this.renderer);
            const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
            this.scene.environment = env;
            pmrem.dispose();
        } catch (e) { /* sin entorno: seguimos igual */ }

        this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
        this.camera.position.set(0, 1.35, 4.2);
        this.camera.lookAt(0, 1.0, 0);

        // OrbitControls para rotar con el ratón
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false;
        this.controls.enableZoom = true;
        this.controls.minDistance = 2.5;
        this.controls.maxDistance = 8.0;
        this.controls.minPolarAngle = 0.2;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
        this.controls.target.set(0, 1.0, 0);
        this.controls.enabled = false;  // se habilita tras cargar modelo

        // Luces
        this.scene.add(new THREE.AmbientLight(0x404060, 1.1));
        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(3, 6, 5);
        this.scene.add(key);
        const rim = new THREE.DirectionalLight(0x66aaff, 1.0);
        rim.position.set(-4, 3, -4);
        this.scene.add(rim);

        // Plataforma bajo el modelo (evita que "flote" en el vacio)
        const discGeo = new THREE.CylinderGeometry(1.15, 1.35, 0.08, 48);
        const discMat = new THREE.MeshStandardMaterial({
            color: 0x1b2340, roughness: 0.35, metalness: 0.5,
        });
        this.disc = new THREE.Mesh(discGeo, discMat);
        this.disc.position.y = -0.04;
        this.scene.add(this.disc);

        this.pivot = new THREE.Group(); // giramos el pivote, no el modelo
        this.scene.add(this.pivot);

        document.addEventListener('visibilitychange', this._onVisibility);
    }

    setSize(w, h) {
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

    async load(modelPath, weaponPath = null, escala = 1.15) {
        this.modelPath = modelPath;
        // Limpiar modelo previo
        this.clearModel();

        let gltf;
        try {
            gltf = await loadGLB(modelPath);
        } catch (e) {
            this.showError();
            return false;
        }
        if (modelPath !== this.modelPath) return false; // seleccion cambiada mientras cargaba

        // clone(true) para no mutar el original cacheado entre selecciones
        const model = gltf.scene.clone(true);

        // Normalizar escala y centrar
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const norm = (2.0 / maxDim) * (escala / 1.15);
        model.scale.setScalar(norm);

        // Recentrar: pies en 0, centro en X/Z
        const box2 = new THREE.Box3().setFromObject(model);
        const c2 = box2.getCenter(new THREE.Vector3());
        model.position.sub(c2);
        model.position.y -= box2.min.y - c2.y; // pies apoyados en y=0

        model.traverse((n) => {
            if (n.isMesh) {
                n.castShadow = false;
                n.receiveShadow = false;
                if (n.material) n.material.side = THREE.FrontSide;
            }
        });

        this.pivot.add(model);
        this.model = model;

        // Animacion idle si existe
        if (gltf.animations && gltf.animations.length) {
            this.mixer = new THREE.AnimationMixer(model);
            const idleClip = gltf.animations.find(c => /idle/i.test(c.name)) || gltf.animations[0];
            if (idleClip) {
                this.idleAction = this.mixer.clipAction(idleClip);
                this.idleAction.play();
            }
        }

        // Arma en la mano (si se indica)
        if (weaponPath) this.attachWeapon(weaponPath);
        return true;
    }

    async attachWeapon(weaponPath) {
        let gltf;
        try {
            gltf = await loadGLB(weaponPath);
        } catch (e) { return; } // sin arma no pasa nada

        if (!this.model) return;
        const weapon = gltf.scene.clone(true);

        const handBone = this.findHandBone(this.model);
        if (handBone) {
            // Los GLB de armas no comparten unidad: bing-cannon viene en metros
            // (~1.25) y el resto en centimetros (~150). Se normaliza el arma por
            // su propia dimension mayor y se le da el largo objetivo en unidades
            // del modelo. Asi las 7 quedan consistentes sin tabla de escalas.
            const wb = new THREE.Box3().setFromObject(weapon);
            const ws = wb.getSize(new THREE.Vector3());
            const wMax = Math.max(ws.x, ws.y, ws.z) || 1;
            const alturaModelo = new THREE.Box3()
                .setFromObject(this.model)
                .getSize(new THREE.Vector3()).y || 2;
            const largoObjetivo = alturaModelo * 0.60;   // largo ~60% de la altura del Axie
            // El rig del Axie tiene su propia escala (Bing_Rig = 0.01) y el hueso la
            // hereda. Hay que compensarla o el arma sale 100x mas pequena.
            const escalaHueso = new THREE.Vector3();
            handBone.getWorldScale(escalaHueso);
            weapon.scale.setScalar((largoObjetivo / wMax) / (escalaHueso.x || 1));
            handBone.add(weapon);
            weapon.position.set(0, 0, 0);
            this._weaponAttached = 'bone';
        } else {
            // Fallback: al lado del modelo
            weapon.scale.setScalar(1);
            weapon.position.set(0.9, 1.0, 0.2);
            weapon.rotation.z = -0.4;
            this.pivot.add(weapon);
            this._weaponAttached = 'fallback';
        }
        weapon.traverse((n) => { if (n.isMesh) n.castShadow = false; });
        this.weapon = weapon;
    }

    findHandBone(root) {
        // El rig de los Axies trae un anclaje dedicado, Weapon_R_JNT, pensado
        // para colgar armas. Hay que buscarlo ANTES que la mano: Hand_R_JNT
        // tambien hace match con 'hand_r' y el recorrido del arbol podia
        // devolver la mano, dejando el arma mal orientada.
        const prioridad = ['weapon_r_jnt', 'weapon_r', 'hand_r_jnt', 'hand_r', 'righthand', 'right_hand'];
        const huesos = [];
        root.traverse((n) => { if (n.isBone) huesos.push(n); });
        for (const clave of prioridad) {
            const hit = huesos.find(b => b.name.toLowerCase().includes(clave));
            if (hit) return hit;
        }
        return null;
    }

    clearModel() {
        if (this.model) {
            this.pivot.remove(this.model);
            this.disposeTree(this.model);
            this.model = null;
        }
        if (this.weapon) {
            if (this.weapon.parent) this.weapon.parent.remove(this.weapon);
            this.disposeTree(this.weapon);
            this.weapon = null;
        }
        if (this.mixer) { this.mixer.stopAllAction(); this.mixer = null; }
        this.idleAction = null;
    }

    disposeTree(obj) {
        // No liberamos geometrias/materiales: vienen del gltf cacheado
        // y se reutilizan. Solo desenganchamos del arbol.
        if (obj.parent) obj.parent.remove(obj);
    }

    showError() {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = '#88aaff';
        ctx.font = '14px Segoe UI, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Modelo no disponible', this.canvas.width / 2, this.canvas.height / 2);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this._clock.start();
        const tick = () => {
            if (!this.running) return;
            this._raf = requestAnimationFrame(tick);
            if (document.hidden) return; // ahorro GPU en pestana oculta
            const dt = Math.min(this._clock.getDelta(), 0.05);
            if (this.mixer) this.mixer.update(dt);
            if (this.controls && this.controls.enabled) {
                this.controls.update();
            } else {
                this.pivot.rotation.y += dt * 0.6; // giro lento tipo vitrina
            }
            this.renderer.render(this.scene, this.camera);
        };
        this._raf = requestAnimationFrame(tick);
    }

    syncVisibility() {
        if (document.hidden) {
            if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; }
        } else if (this.running && !this._raf) {
            this.start();
        }
    }

    stop() {
        this.running = false;
        if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; }
    }

    destroy() {
        this.stop();
        document.removeEventListener('visibilitychange', this._onVisibility);
        this.clearModel();
        try { this.renderer.dispose(); } catch (e) { /* noop */ }
    }
}

export default AxiePreviewer;
