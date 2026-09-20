// Sistema de Raycasting y Selector de Enemigos para Three.js v2
function initLineageTargeting() {
    if (!document.getElementById('l2-target-frame')) {
        const frame = document.createElement('div');
        frame.id = 'l2-target-frame';
        frame.style.cssText = 'position: fixed; top: 70px; left: 35%; transform: translateX(-50%); z-index: 2147483647; background: rgba(0,0,0,0.85); border: 2px solid #b8860b; border-radius: 6px; padding: 8px 12px; width: 220px; font-family: monospace; color: #fff; display: none; pointer-events: none; box-shadow: 0 4px 10px rgba(0,0,0,0.5);';
        frame.innerHTML = 
            <div id="l2-target-name" style="font-size: 12px; font-weight: bold; color: #ffd700; margin-bottom: 4px; text-align: center; text-transform: uppercase;">Objetivo</div>
            <div style="background: #333; border: 1px solid #555; border-radius: 3px; height: 14px; position: relative; overflow: hidden;">
                <div id="l2-target-hp-fill" style="background: linear-gradient(90deg, #cc0000, #ff3333); width: 100%; height: 100%; transition: width 0.2s;"></div>
                <div id="l2-target-hp-text" style="position: absolute; width: 100%; top: 0; left: 0; font-size: 10px; text-align: center; line-height: 14px; color: #fff; font-weight: bold;">100 / 100</div>
            </div>
        ;
        document.body.appendChild(frame);
    }

    let selectedTarget = null;
    let lastAttackTime = 0;
    const attackCooldown = 1000;

    // Función para encontrar la cámara y la escena automáticamente analizando el canvas de Three.js
    function findThreeSceneAndCamera() {
        if (window.scene && window.camera) return true;
        
        // Intentar rescatar la escena desde los canvas o instancias globales si existen
        const canvas = document.querySelector('canvas');
        if (!canvas) return false;

        // Recorremos las propiedades del DOM o buscamos objetos globales comunes
        for (let key in window) {
            try {
                if (window[key] && window[key].isScene) {
                    window.scene = window[key];
                }
                if (window[key] && window[key].isPerspectiveCamera) {
                    window.camera = window[key];
                }
            } catch(e) {}
        }
        return !!(window.scene && window.camera);
    }

    window.addEventListener('click', (event) => {
        if (!findThreeSceneAndCamera()) {
            console.warn("Esperando a que Three.js cargue la escena y la cámara...");
            return;
        }

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, window.camera);
        const intersects = raycaster.intersectObjects(window.scene.children, true);

        const frame = document.getElementById('l2-target-frame');

        if (intersects.length > 0) {
            // Buscamos el primer objeto interactitable válido
            let hit = intersects[0].object;
            selectedTarget = hit;
            
            console.log("¡Clic en objeto 3D!", hit);

            if (!selectedTarget.userData.hp) {
                selectedTarget.userData.maxHp = 100;
                selectedTarget.userData.hp = 100;
                selectedTarget.userData.name = hit.name || "Minion / Enemigo";
            }

            updateTargetUI(selectedTarget);
            frame.style.display = 'block';
        } else {
            selectedTarget = null;
            frame.style.display = 'none';
        }
    });

    function updateTargetUI(target) {
        const nameEl = document.getElementById('l2-target-name');
        const fillEl = document.getElementById('l2-target-hp-fill');
        const textEl = document.getElementById('l2-target-hp-text');

        if (target && target.userData) {
            nameEl.textContent = target.userData.name;
            const pct = Math.max(0, (target.userData.hp / target.userData.maxHp) * 100);
            fillEl.style.width = pct + '%';
            textEl.textContent = ${target.userData.hp} / ;
        }
    }

    function updateLoop() {
        const now = Date.now();
        if (selectedTarget && (now - lastAttackTime >= attackCooldown)) {
            selectedTarget.userData.hp -= 15;
            updateTargetUI(selectedTarget);
            
            console.log("¡Auto-ataque ejecutado! HP restante del objetivo:", selectedTarget.userData.hp);

            if (selectedTarget.userData.hp <= 0) {
                console.log("¡Enemigo abatido!");
                if (selectedTarget.parent) {
                    selectedTarget.parent.remove(selectedTarget);
                }
                selectedTarget = null;
                document.getElementById('l2-target-frame').style.display = 'none';
            }

            lastAttackTime = now;
        }
        requestAnimationFrame(updateLoop);
    }

    requestAnimationFrame(updateLoop);
}

window.addEventListener('load', () => {
    setTimeout(initLineageTargeting, 2000);
});
