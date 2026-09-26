// ============================================================
// MenuScreen.js — Pantalla principal de Axie Legends
// Diseño: título + PLAY NOW + 5 botones inferiores
// ============================================================

export class MenuScreen {
    constructor() {
        this.element = null;
        this.onPlay = null;
        this.onGuide = null;
        this.onOptions = null;
        this.onPatchNotes = null;
        this.onLanguage = null;
        this.currentLang = 'en';   // 'en' | 'es'
    }

    show(callbackJugar) {
        this.onPlay = callbackJugar;
        this._construir();
        this._bindEventos();
    }

    _construir() {
        // Eliminar cualquier menú anterior
        const anterior = document.getElementById('menu-screen');
        if (anterior) anterior.remove();

        this.element = document.createElement('div');
        this.element.id = 'menu-screen';
        this.element.style.cssText = `
            position: fixed;
            inset: 0;
            background: linear-gradient(rgba(10, 15, 30, 0.75), rgba(5, 5, 15, 0.9)), url('assets/menu-background.jpg') center/cover no-repeat;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #fff;
            z-index: 9999;
            user-select: none;
        `;

        this.element.innerHTML = `
            <!-- BOTÓN PLAY NOW -->
            <button id="menu-play-btn" style="
                padding: 22px 80px;
                font-size: 28px;
                font-weight: bold;
                letter-spacing: 4px;
                background: linear-gradient(135deg, #00aaff, #0066cc);
                color: #fff;
                border: 3px solid #88ddff;
                border-radius: 16px;
                cursor: pointer;
                box-shadow: 0 0 30px rgba(0, 170, 255, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.15);
                transition: all 0.2s ease;
                text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                margin-bottom: 80px;
            ">▶ PLAY NOW</button>

            <!-- BOTONES INFERIORES -->
            <div style="
                position: absolute;
                bottom: 40px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 16px;
                align-items: center;
            ">
                <button id="menu-guide-btn" style="
                    padding: 10px 20px;
                    font-size: 13px;
                    font-weight: bold;
                    background: rgba(0, 170, 255, 0.15);
                    color: #88ddff;
                    border: 2px solid rgba(136, 221, 255, 0.4);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">📖 GUIDE</button>

                <button id="menu-options-btn" style="
                    padding: 10px 20px;
                    font-size: 13px;
                    font-weight: bold;
                    background: rgba(0, 170, 255, 0.15);
                    color: #88ddff;
                    border: 2px solid rgba(136, 221, 255, 0.4);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">⚙️ OPTIONS</button>

                <button id="menu-patch-btn" style="
                    padding: 10px 20px;
                    font-size: 13px;
                    font-weight: bold;
                    background: rgba(0, 170, 255, 0.15);
                    color: #88ddff;
                    border: 2px solid rgba(136, 221, 255, 0.4);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">📜 PATCH NOTES</button>

                <div style="
                    width: 2px;
                    height: 30px;
                    background: rgba(136, 221, 255, 0.3);
                    margin: 0 8px;
                "></div>

                <button id="menu-lang-es-btn" style="
                    padding: 10px 16px;
                    font-size: 13px;
                    font-weight: bold;
                    background: rgba(255, 255, 255, 0.08);
                    color: #fff;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">🇪🇸 ES</button>

                <button id="menu-lang-en-btn" style="
                    padding: 10px 16px;
                    font-size: 13px;
                    font-weight: bold;
                    background: rgba(0, 170, 255, 0.3);
                    color: #fff;
                    border: 2px solid #88ddff;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">🇬🇧 EN</button>
            </div>
        `;

        // Ocultar gadgets que NO deben verse en el menú
        this._gadgetsOcultos = [];
        const idsAOcultar = [
            'forced-memory-box',
            'camera-hud',
            'memory-value',
            'player-gold-display',
            'timerDiv',
            'fpsDiv',
            'waveDiv'
        ];
        for (const id of idsAOcultar) {
            const el = document.getElementById(id);
            if (el) {
                this._gadgetsOcultos.push(el);
                el.style.display = 'none';
            }
        }

        document.body.appendChild(this.element);
    }

    _bindEventos() {
        const playBtn = document.getElementById('menu-play-btn');
        if (playBtn) {
            playBtn.onmouseenter = () => {
                playBtn.style.transform = 'scale(1.05)';
                playBtn.style.boxShadow = '0 0 50px rgba(0, 170, 255, 0.9), inset 0 0 20px rgba(255, 255, 255, 0.3)';
            };
            playBtn.onmouseleave = () => {
                playBtn.style.transform = 'scale(1)';
                playBtn.style.boxShadow = '0 0 30px rgba(0, 170, 255, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.15)';
            };
            playBtn.onclick = () => {
                // Por ahora, solo llama al callback de JUGAR.
                // En ML.4 se abrirá un modal de modos de juego.
                console.log('▶ PLAY NOW pulsado');
                if (this.onPlay) this.onPlay();
            };
        }

        const botones = [
            { id: 'menu-guide-btn', nombre: 'GUÍA' },
            { id: 'menu-options-btn', nombre: 'OPCIONES' },
            { id: 'menu-patch-btn', nombre: 'PATCH NOTES' },
            { id: 'menu-lang-es-btn', nombre: 'ES' },
            { id: 'menu-lang-en-btn', nombre: 'EN' },
        ];
        for (const b of botones) {
            const el = document.getElementById(b.id);
            if (!el) continue;
            el.onmouseenter = () => {
                el.style.background = 'rgba(0, 170, 255, 0.35)';
                el.style.borderColor = '#88ddff';
            };
            el.onmouseleave = () => {
                const esLangActivo = (b.id === 'menu-lang-es-btn' && this.currentLang === 'es')
                                  || (b.id === 'menu-lang-en-btn' && this.currentLang === 'en');
                el.style.background = esLangActivo ? 'rgba(0, 170, 255, 0.3)' : 'rgba(0, 170, 255, 0.15)';
                el.style.borderColor = esLangActivo ? '#88ddff' : 'rgba(136, 221, 255, 0.4)';
            };
            el.onclick = () => {
                console.log('🔘 Botón pulsado: ' + b.nombre);
                // En ML.5, ML.6, ML.7 y ML.1 se conectarán los modales.
            };
        }
    }

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        // Restaurar gadgets ocultados
        if (this._gadgetsOcultos) {
            for (const el of this._gadgetsOcultos) {
                if (el && el.parentNode) el.style.display = '';
            }
            this._gadgetsOcultos = [];
        }
    }
}