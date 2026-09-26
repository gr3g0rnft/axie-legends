// =============================================
// PANTALLA DE INICIO - MENU PRINCIPAL
// =============================================
// Estructura:
//   1) Menu principal limpio (logo + botones 1v1 / 5v5 / Entrenar IA)
//   2) Al pulsar 1v1 -> ventana modal de seleccion de Axie
//      (solo muestra los Axies habilitados en axies.js)

import { getAllAxies, isAxieHabilitado } from '../config/axies.js';
import { AxiePreviewer } from './AxiePreviewer.js';
import { audio } from '../audio/AudioManager.js';
import { t, setIdioma, getIdioma } from '../config/idiomas.js';

export class MenuScreen {
    constructor() {
        this.container = null;
        this.modal = null;
        this.selectedAxie = null;
        this.onStartGame = null;
        this.onSelectAxie = null;
        this.previewer = null;      // visor 3D del Axie seleccionado
        this.previewToken = 0;      // evita cargas cruzadas al cambiar rapido
        this._onResize = null;
        this.menuMusicAudio = null; // dedicated audio for menu music
        this._unlockHandler = null;
    }

    // Arranca la música del lobby. Si el navegador la bloquea,
    // registra un desbloqueo que se dispara con la primera interacción.
    _startLobbyMusic() {
        if (this.menuMusicAudio) return;
        const audioEl = new Audio('/axie-legends/assets/sound/lobby.mp3');
        audioEl.loop = true;
        audioEl.volume = audio.musicVolume * audio.masterVolume;
        this.menuMusicAudio = audioEl;

        const tryPlay = () => {
            audioEl.play().catch(err => {
                console.warn('Lobby music autoplay blocked:', err);
                if (!this._unlockHandler) {
                    this._unlockHandler = () => {
                        if (audio.muted) return;
                        audioEl.volume = audio.musicVolume * audio.masterVolume;
                        audioEl.play().then(() => {
                            window.removeEventListener('pointerdown', this._unlockHandler);
                            window.removeEventListener('keydown', this._unlockHandler);
                            this._unlockHandler = null;
                        }).catch(() => {});
                    };
                    window.addEventListener('pointerdown', this._unlockHandler);
                    window.addEventListener('keydown', this._unlockHandler);
                }
            });
        };

        if (audio.muted) return; // no suena si está muteado globalmente
        tryPlay();
    }

    stopMenuMusic() {
        if (this._unlockHandler) {
            window.removeEventListener('pointerdown', this._unlockHandler);
            window.removeEventListener('keydown', this._unlockHandler);
            this._unlockHandler = null;
        }
        if (this.menuMusicAudio) {
            this.menuMusicAudio.pause();
            this.menuMusicAudio.currentTime = 0;
            this.menuMusicAudio = null;
        }
    }

    show(onStartGame, onSelectAxie) {
        this.onPlay = onStartGame;
        this.onStartGame = onStartGame;
        this.onSelectAxie = onSelectAxie;

        this.container = document.createElement('div');
        this.container.id = 'menu-screen';

        const baseUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL ? import.meta.env.BASE_URL : './';
        this._baseUrl = baseUrl;

        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('${baseUrl}assets/fondos/fondo-inicio.jpg') center/cover no-repeat;
            filter: brightness(1.15) contrast(1.05) saturate(1.1);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            font-family: 'Segoe UI', Arial, sans-serif;
            overflow: hidden;
            padding: 20px;
            animation: menuFadeIn 0.6s ease-out;
        `;

        // Overlay oscuro para que resalten los elementos
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 100%);
            backdrop-filter: brightness(1.05);
            z-index: 1;
        `;
        this.container.appendChild(overlay);

        this.injectStyles();

        // Contenido (z-index: 2)
        const content = document.createElement('div');
        content.style.cssText = `
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100%;
            max-width: 1000px;
            height: 100%;
        `;

        // Iniciar música de fondo del menú (lobby).
        // El navegador bloquea el autoplay hasta la primera interacción,
        // así que intentamos sonar y, si falla, lo desbloqueamos al primer clic.
        this._startLobbyMusic();

        // ---- LOGO / TITULO ----
        // Logo text removed per user request (no "AXIE LEGENDS" label)
        // const logo = document.createElement('div');
        // logo.style.cssText = `
        //     font-size: 64px;
        //     font-weight: 900;
        //     letter-spacing: 6px;
        //     color: #ffffff;
        //     text-shadow: 0 0 30px rgba(68,255,136,0.55), 0 4px 18px rgba(0,0,0,0.8);
        //     margin-bottom: 8px;
        //     text-align: center;
        //     line-height: 1.1;
        // `;
        // logo.textContent = 'AXIE LEGENDS';
        // content.appendChild(logo);

        const subtitle = document.createElement('div');
        subtitle.id = 'menu-subtitle';
        subtitle.style.cssText = `
            font-size: 26px;
            font-weight: 900;
            letter-spacing: 4px;
            color: #ffffff;
            margin-top: 0;
            margin-bottom: 5px;
            text-align: center;
            -webkit-text-stroke: 1.5px #00aaff;
            text-shadow:
                0 0 10px #00aaff,
                0 0 20px #00aaff,
                0 0 30px rgba(0, 170, 255, 0.8),
                0 0 50px rgba(0, 170, 255, 0.5),
                0 4px 8px rgba(0, 0, 0, 1),
                2px 2px 0 rgba(0, 0, 0, 0.9),
                -2px -2px 0 rgba(0, 0, 0, 0.9),
                2px -2px 0 rgba(0, 0, 0, 0.9),
                -2px 2px 0 rgba(0, 0, 0, 0.9);
            font-family: 'Arial Black', sans-serif;
            text-transform: uppercase;
            filter: drop-shadow(0 0 15px rgba(0, 170, 255, 0.7));
        `;
        subtitle.textContent = t('menu.subtitle');
        content.appendChild(subtitle);

        // ---- BOTONES PRINCIPALES ----
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 18px;
            align-items: center;
            justify-content: center;
        `;

        const btn1v1 = this.createGameButton('1 vs 1', 'Duelo 1 a 1', '#44ff88', () => {
            this._mostrarModalModos();
        }, false);
        buttonsContainer.appendChild(btn1v1);

        const btnSandbox = this.createGameButton('Sandbox Mapa', 'Editar mapa y montañas', '#ffaa44', () => {
            if (typeof window !== 'undefined' && window.startSandboxMode) {
                this.hide();
                window.startSandboxMode();
            } else {
                this.showToast('Sandbox no disponible');
            }
        }, false);
        buttonsContainer.appendChild(btnSandbox);

        const btn5v5 = this.createGameButton('5 vs 5', 'Pr\u00f3ximamente', '#888899', () => {
            this.showToast('\uD83C\uDF1F Modo 5 vs 5 en desarrollo... \u00a1Pronto disponible!');
        }, true);
        buttonsContainer.appendChild(btn5v5);

        content.appendChild(buttonsContainer);
        // Ocultar botones viejos (sandbox, 1v1, 5v5)
        buttonsContainer.style.display = 'none';

        // ---- BOTÓN JUGAR (centrado, grande) ----
        const btnJugar = document.createElement('button');
        btnJugar.id = 'menu-play-btn';
        btnJugar.textContent = t('menu.play');
        btnJugar.style.cssText = `
            pointer-events: auto;
            position: relative;
            z-index: 3;
            padding: 24px 100px;
            font-size: 32px;
            font-weight: 900;
            letter-spacing: 6px;
            background: linear-gradient(135deg, #00aaff, #0066cc);
            color: #fff;
            border: 3px solid #88ddff;
            border-radius: 16px;
            cursor: pointer;
            box-shadow: 0 0 40px rgba(0, 170, 255, 0.7), inset 0 0 20px rgba(255, 255, 255, 0.2);
            transition: all 0.25s ease;
            text-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
            font-family: 'Arial Black', sans-serif;
            margin-top: 20px;
        `;
        btnJugar.onmouseenter = () => {
            btnJugar.style.transform = 'scale(1.05)';
            btnJugar.style.boxShadow = '0 0 60px rgba(0, 170, 255, 0.9), inset 0 0 30px rgba(255, 255, 255, 0.3)';
        };
        btnJugar.onmouseleave = () => {
            btnJugar.style.transform = 'scale(1)';
            btnJugar.style.boxShadow = '0 0 40px rgba(0, 170, 255, 0.7), inset 0 0 20px rgba(255, 255, 255, 0.2)';
        };
        btnJugar.onclick = () => {
            this._mostrarModalModos();
        };
        content.appendChild(btnJugar);

        // ---- BARRA INFERIOR CON BOTONES ----
        const bottomBar = document.createElement('div');
        bottomBar.style.cssText = `
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 12px;
            align-items: center;
            z-index: 3;
            pointer-events: auto;
            padding: 0 20px;
            box-sizing: border-box;
        `;

        const crearBotonInferior = (id, texto) => {
            const btn = document.createElement('button');
            btn.id = id;
            btn.textContent = texto;
            btn.style.cssText = `
                width: 150px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
                font-weight: 900;
                background: linear-gradient(135deg, rgba(0, 170, 255, 0.25), rgba(0, 102, 204, 0.15));
                color: #88ddff;
                border: 2px solid rgba(136, 221, 255, 0.5);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 0 12px rgba(0, 170, 255, 0.3);
                letter-spacing: 0.5px;
                font-family: 'Segoe UI', Arial, sans-serif;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                box-sizing: border-box;
            `;
            btn.onmouseenter = () => {
                btn.style.background = 'linear-gradient(135deg, rgba(0, 170, 255, 0.5), rgba(0, 102, 204, 0.35))';
                btn.style.borderColor = '#88ddff';
                btn.style.transform = 'scale(0.95)';
                btn.style.boxShadow = '0 0 20px rgba(0, 170, 255, 0.5)';
            };
            btn.onmouseleave = () => {
                btn.style.background = 'linear-gradient(135deg, rgba(0, 170, 255, 0.25), rgba(0, 102, 204, 0.15))';
                btn.style.borderColor = 'rgba(136, 221, 255, 0.5)';
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 0 12px rgba(0, 170, 255, 0.3)';
            };
            btn.onclick = () => {
                this.showToast('🔧 Próximamente');
            };
            return btn;
        };

        bottomBar.appendChild(crearBotonInferior('menu-guide-btn', t('menu.guide')));
        bottomBar.appendChild(crearBotonInferior('menu-options-btn', t('menu.options')));
        bottomBar.appendChild(crearBotonInferior('menu-patch-btn', t('menu.patch')));

        const separador = document.createElement('div');
        separador.style.cssText = `
            width: 2px;
            height: 40px;
            background: rgba(136, 221, 255, 0.3);
            margin: 0 4px;
        `;
        bottomBar.appendChild(separador);

        const btnES = crearBotonInferior('menu-lang-es-btn', t('menu.lang_es'));
        btnES.style.background = 'rgba(255, 255, 255, 0.08)';
        btnES.style.color = '#fff';
        btnES.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        btnES.onclick = () => {
            setIdioma('es');
            this._actualizarTextos();
            this._actualizarEstilosIdioma();
        };
        bottomBar.appendChild(btnES);

        const btnEN = crearBotonInferior('menu-lang-en-btn', t('menu.lang_en'));
        btnEN.onclick = () => {
            setIdioma('en');
            this._actualizarTextos();
            this._actualizarEstilosIdioma();
        };
        btnEN.style.background = 'linear-gradient(135deg, rgba(0, 170, 255, 0.4), rgba(0, 102, 204, 0.3))';
        btnEN.style.color = '#fff';
        btnEN.style.borderColor = '#88ddff';
        btnEN.style.boxShadow = '0 0 18px rgba(0, 170, 255, 0.6)';
        bottomBar.appendChild(btnEN);

        content.appendChild(bottomBar);

        this.container.appendChild(content);
        document.body.appendChild(this.container);
    }

    injectStyles() {
        if (document.getElementById('menu-screen-styles')) return;
        const style = document.createElement('style');
        style.id = 'menu-screen-styles';
        style.textContent = `
            @keyframes menuFadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes modalPopIn {
                from { opacity: 0; transform: translateY(18px) scale(0.96); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .menu-card {
                transition: all 0.3s ease;
                position: relative;
                margin: 0;
                transform: scale(1);
                transform-origin: center center;
                cursor: pointer;
            }
            .menu-card:hover {
                transform: scale(0.93) !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
            }
            .menu-card.selected {
                border-color: #ffdd44 !important;
                box-shadow: 0 0 30px rgba(255,220,68,0.3), 0 4px 20px rgba(0,0,0,0.4) !important;
                transform: scale(0.95) !important;
            }
            .btn-5v5 {
                cursor: not-allowed !important;
                background: rgba(255,255,255,0.12) !important;
                border: 2px solid rgba(255,255,255,0.25) !important;
                color: rgba(255,255,255,0.8) !important;
                backdrop-filter: blur(8px);
            }
            .btn-5v5:hover {
                transform: none !important;
                box-shadow: none !important;
            }
            .menu-play-btn { transition: all 0.3s ease; }
        `;
        document.head.appendChild(style);
    }

    _actualizarTextos() {
        // Actualizar subtítulo
        const subtitleEl = document.getElementById('menu-subtitle');
        if (subtitleEl) subtitleEl.textContent = t('menu.subtitle');

        // Actualizar botón JUGAR
        const btnJugar = document.getElementById('menu-play-btn');
        if (btnJugar) btnJugar.textContent = t('menu.play');

        // Actualizar botones inferiores
        const btnGuide = document.getElementById('menu-guide-btn');
        if (btnGuide) btnGuide.textContent = t('menu.guide');

        const btnOptions = document.getElementById('menu-options-btn');
        if (btnOptions) btnOptions.textContent = t('menu.options');

        const btnPatch = document.getElementById('menu-patch-btn');
        if (btnPatch) btnPatch.textContent = t('menu.patch');

        const btnEs = document.getElementById('menu-lang-es-btn');
        if (btnEs) btnEs.textContent = t('menu.lang_es');

        const btnEn = document.getElementById('menu-lang-en-btn');
        if (btnEn) btnEn.textContent = t('menu.lang_en');
    }

    _actualizarEstilosIdioma() {
        const idioma = getIdioma();

        const btnES = document.getElementById('menu-lang-es-btn');
        const btnEN = document.getElementById('menu-lang-en-btn');

        if (btnES) {
            if (idioma === 'es') {
                btnES.style.background = 'linear-gradient(135deg, rgba(0, 170, 255, 0.4), rgba(0, 102, 204, 0.3))';
                btnES.style.borderColor = '#88ddff';
                btnES.style.boxShadow = '0 0 18px rgba(0, 170, 255, 0.6)';
                btnES.style.color = '#fff';
            } else {
                btnES.style.background = 'rgba(255, 255, 255, 0.08)';
                btnES.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                btnES.style.boxShadow = 'none';
                btnES.style.color = '#fff';
            }
        }

        if (btnEN) {
            if (idioma === 'en') {
                btnEN.style.background = 'linear-gradient(135deg, rgba(0, 170, 255, 0.4), rgba(0, 102, 204, 0.3))';
                btnEN.style.borderColor = '#88ddff';
                btnEN.style.boxShadow = '0 0 18px rgba(0, 170, 255, 0.6)';
                btnEN.style.color = '#fff';
            } else {
                btnEN.style.background = 'rgba(255, 255, 255, 0.08)';
                btnEN.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                btnEN.style.boxShadow = 'none';
                btnEN.style.color = '#fff';
            }
        }
    }

    // =========================================
    // VENTANA MODAL DE SELECCION DE AXIE (1v1)
    // =========================================
    openAxieSelectModal() {
        if (this.modal) return; // ya abierta

        const backdrop = document.createElement('div');
        backdrop.id = 'axie-select-modal';
        backdrop.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.65);
            backdrop-filter: blur(4px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2500;
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 20px;
            animation: menuFadeIn 0.25s ease-out;
        `;

        // Cerrar al hacer clic fuera del panel
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) this.closeAxieSelectModal();
        });

        const panel = document.createElement('div');
        panel.style.cssText = `
            position: relative;
            background: linear-gradient(160deg, rgba(20,24,48,0.97), rgba(10,12,28,0.97));
            border: 2px solid rgba(68,255,136,0.35);
            border-radius: 18px;
            box-shadow: 0 0 60px rgba(68,255,136,0.18), 0 20px 60px rgba(0,0,0,0.6);
            padding: 26px 30px 28px;
            width: auto;
            min-width: 340px;
            max-width: 94vw;
            max-height: 92vh;
            overflow-y: auto;
            animation: modalPopIn 0.3s ease-out;
        `;
        panel.addEventListener('click', (e) => e.stopPropagation());

        // Boton cerrar
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '\u2715';
        closeBtn.setAttribute('aria-label', 'Cerrar');
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px; right: 14px;
            background: transparent;
            border: none;
            color: rgba(255,255,255,0.55);
            font-size: 20px;
            cursor: pointer;
            line-height: 1;
            padding: 6px;
            transition: color 0.2s ease;
        `;
        closeBtn.onmouseenter = () => { closeBtn.style.color = '#ff6666'; };
        closeBtn.onmouseleave = () => { closeBtn.style.color = 'rgba(255,255,255,0.55)'; };
        closeBtn.onclick = () => this.closeAxieSelectModal();
        panel.appendChild(closeBtn);

        // Titulo
        const title = document.createElement('div');
        title.id = 'axie-modal-title';
        title.textContent = 'ELIGE TU AXIE';
        title.style.cssText = `
            text-align: center;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 3px;
            color: #ffffff;
            text-shadow: 0 0 20px rgba(68,255,136,0.4);
            margin-bottom: 4px;
        `;
        panel.appendChild(title);

        const sub = document.createElement('div');
        sub.textContent = 'Duelo 1 vs 1';
        sub.style.cssText = `
            text-align: center;
            font-size: 12px;
            letter-spacing: 2px;
            color: #88ddff;
            opacity: 0.75;
            margin-bottom: 22px;
            text-transform: uppercase;
        `;
        panel.appendChild(sub);

        // =========================================
        // CUERPO ESTILO LoL: lista | visor 3D | info
        // =========================================
        const row = document.createElement('div');
        row.style.cssText = `display:flex;gap:18px;align-items:stretch;`;

        // --- Izquierda: lista de Axies ---
        const list = document.createElement('div');
        list.id = 'axie-list';
        list.style.cssText = `display:flex;flex-direction:column;gap:10px;width:190px;flex:0 0 auto;`;

        // --- Centro: visor 3D + nombre + stats ---
        const center = document.createElement('div');
        center.style.cssText = `flex:1 1 auto;min-width:300px;display:flex;flex-direction:column;align-items:center;`;

        const stage = document.createElement('div');
        stage.style.cssText = `
            position: relative;
            width: 100%;
            max-width: 420px;
            height: 300px;
            border-radius: 14px;
            background: radial-gradient(circle at 50% 35%, rgba(68,255,136,0.12), rgba(10,14,30,0.85) 70%);
            border: 1px solid rgba(255,255,255,0.09);
            overflow: hidden;
            box-shadow: inset 0 0 60px rgba(0,0,0,0.55);
        `;

        const preview = document.createElement('canvas');
        preview.id = 'axie-preview-canvas';
        preview.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;display:block;`;
        preview.width = 420;
        preview.height = 300;
        stage.appendChild(preview);
        center.appendChild(stage);

        const bigName = document.createElement('div');
        bigName.id = 'axie-modal-name';
        bigName.style.cssText = `
            margin-top: 12px;
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 2px;
            color: #ffffff;
            text-shadow: 0 0 18px rgba(68,255,136,0.35);
            text-align: center;
        `;
        center.appendChild(bigName);

        const roleLine = document.createElement('div');
        roleLine.id = 'axie-modal-role';
        roleLine.style.cssText = `
            font-size: 12px;
            letter-spacing: 2px;
            color: #88ddff;
            opacity: 0.8;
            text-transform: uppercase;
            margin-bottom: 10px;
            text-align: center;
        `;
        center.appendChild(roleLine);

        const statsBox = document.createElement('div');
        statsBox.id = 'axie-modal-stats';
        statsBox.style.cssText = `width:100%;max-width:420px;display:flex;flex-direction:column;gap:6px;`;
        center.appendChild(statsBox);

        // --- Derecha: habilidades Q/W/E/R ---
        const skills = document.createElement('div');
        skills.id = 'axie-modal-skills';
        skills.style.cssText = `display:flex;flex-direction:column;gap:8px;width:210px;flex:0 0 auto;`;

        row.appendChild(list);
        row.appendChild(center);
        row.appendChild(skills);
        panel.appendChild(row);

        const axies = getAllAxies();   // los 7: los no habilitados salen bloqueados
        const primerHabilitadoId = (axies.find(a => isAxieHabilitado(a.id)) || {}).id || null;
        this.selectedAxie = null;

        axies.forEach((axie, index) => {
            const card = this.createAxieCard(axie, axie.id === primerHabilitadoId, !isAxieHabilitado(axie.id));
            list.appendChild(card);
        });

        // Visor 3D (renderer propio, se destruye al cerrar)
        this.previewer = new AxiePreviewer(preview, { baseUrl: this._baseUrl || './' });
        this._onResize = () => {
            if (!this.previewer) return;
            const r = preview.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) this.previewer.setSize(r.width, r.height);
        };
        window.addEventListener('resize', this._onResize);
        this._onResize();
        this.previewer.start();

        if (axies.length) this.selectAxieInModal(axies[0]);

        // Boton jugar
        const playBtn = document.createElement('button');
        playBtn.className = 'menu-play-btn';
        playBtn.textContent = 'JUGAR';
        playBtn.style.cssText = `
            display: block;
            width: 100%;
            padding: 14px 30px;
            font-size: 19px;
            font-weight: 800;
            letter-spacing: 3px;
            background: linear-gradient(135deg, #44ff88, #22aa66);
            color: #06220f;
            border: 2px solid #44ff88;
            border-radius: 12px;
            cursor: pointer;
            font-family: 'Segoe UI', Arial, sans-serif;
            box-shadow: 0 0 24px rgba(68,255,136,0.3);
            transition: all 0.3s ease;
        `;
        playBtn.onmouseenter = () => {
            playBtn.style.transform = 'scale(1.03)';
            playBtn.style.boxShadow = '0 0 44px rgba(68,255,136,0.5)';
        };
        playBtn.onmouseleave = () => {
            playBtn.style.transform = 'scale(1)';
            playBtn.style.boxShadow = '0 0 24px rgba(68,255,136,0.3)';
        };
        playBtn.onclick = () => {
            if (!this.selectedAxie) {
                this.showToast('\u26A0\uFE0F Selecciona un Axie primero');
                return;
            }
            const axieId = this.selectedAxie;
            this.closeAxieSelectModal();
            this.hide();
            if (this.onStartGame) this.onStartGame(axieId, '1v1');
        };
        panel.appendChild(playBtn);

        backdrop.appendChild(panel);
        document.body.appendChild(backdrop);
        this.modal = backdrop;

        // Escape cierra el modal
        this._escHandler = (e) => {
            if (e.key === 'Escape') this.closeAxieSelectModal();
        };
        document.addEventListener('keydown', this._escHandler);
    }

    closeAxieSelectModal() {
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
            this._escHandler = null;
        }
        if (this._onResize) {
            window.removeEventListener('resize', this._onResize);
            this._onResize = null;
        }
        // Liberar el visor 3D para no dejar GPU colgada
        if (this.previewer) {
            this.previewer.destroy();
            this.previewer = null;
        }
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        this.modal = null;
    }

    // =========================================
    // SELECCION: actualiza visor 3D, nombre, stats y habilidades
    // =========================================
    selectAxieInModal(axie) {
        this.selectedAxie = axie.id;
        if (this.onSelectAxie) this.onSelectAxie(axie.id);

        const nameEl = document.getElementById('axie-modal-name');
        const roleEl = document.getElementById('axie-modal-role');
        const statsEl = document.getElementById('axie-modal-stats');
        const skillsEl = document.getElementById('axie-modal-skills');

        if (nameEl) {
            nameEl.textContent = axie.nombre;
            nameEl.style.color = axie.color || '#ffffff';
            nameEl.style.textShadow = `0 0 18px ${axie.color || '#44ff88'}55`;
        }
        if (roleEl) roleEl.textContent = (axie.rol || axie.id).toUpperCase();

        // Stats en barras
        if (statsEl) {
            statsEl.innerHTML = '';
            const s = axie.stats || {};
            const rows = [
                ['VIDA', s.vida || 0, 200, '#44ff88'],
                ['ATAQUE', s.ataque || 0, 40, '#ff8844'],
                ['DEFENSA', s.defensa || 0, 40, '#44aaff'],
                ['VELOCIDAD', s.velocidad || 0, 2, '#ffdd44'],
            ];
            rows.forEach(([label, value, max, color]) => {
                const r = document.createElement('div');
                r.style.cssText = `display:flex;align-items:center;gap:8px;`;
                const l = document.createElement('div');
                l.textContent = label;
                l.style.cssText = `width:78px;font-size:10px;letter-spacing:1px;color:#9aa8c8;`;
                const track = document.createElement('div');
                track.style.cssText = `flex:1;height:8px;background:rgba(255,255,255,0.09);border-radius:5px;overflow:hidden;`;
                const fill = document.createElement('div');
                fill.style.cssText = `width:${Math.min(100, (value / max) * 100)}%;height:100%;background:${color};border-radius:5px;transition:width 0.35s ease;`;
                track.appendChild(fill);
                const v = document.createElement('div');
                v.textContent = value;
                v.style.cssText = `width:32px;font-size:11px;text-align:right;color:#dfe6f5;`;
                r.appendChild(l); r.appendChild(track); r.appendChild(v);
                statsEl.appendChild(r);
            });
        }

        // Habilidades Q/W/E/R + pasiva
        if (skillsEl) {
            skillsEl.innerHTML = '';
            const h = axie.habilidades || {};
            [['Q', h.q], ['W', h.w], ['E', h.e], ['R', h.r || h.definitiva]].forEach(([key, hab]) => {
                if (hab) skillsEl.appendChild(this.createSkillRow(key, hab));
            });
            const pass = h.pasiva;
            if (pass && pass.nombre) skillsEl.appendChild(this.createSkillRow('P', pass));
        }

        // Cargar modelo 3D + arma (token evita cargas cruzadas)
        const token = ++this.previewToken;
        if (this.previewer) {
            const modelo = axie.modeloPath || axie.modelo;
            const arma = axie.armaPath || axie.arma;
            this.previewer.load(modelo, arma, axie.escala || 1.15).then(() => {
                if (token !== this.previewToken) return;
            });
        }
    }

    createSkillRow(key, hab) {
        const row = document.createElement('div');
        const isKey = /^[QWERP]$/.test(key);
        const border = isKey ? 'rgba(68,255,136,0.35)' : 'rgba(170,140,255,0.35)';
        row.style.cssText = `
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 7px 9px;
            background: rgba(255,255,255,0.05);
            border: 1px solid ${border};
            border-radius: 9px;
        `;
        const keyBox = document.createElement('div');
        keyBox.textContent = key;
        keyBox.style.cssText = `
            width: 24px; height: 24px;
            flex: 0 0 auto;
            display: flex; align-items: center; justify-content: center;
            border-radius: 6px;
            font-size: 11px; font-weight: 800;
            background: ${isKey ? 'rgba(68,255,136,0.15)' : 'rgba(170,140,255,0.15)'};
            color: ${isKey ? '#44ff88' : '#bb99ff'};
            border: 1px solid ${border};
        `;
        const txt = document.createElement('div');
        txt.style.cssText = `flex:1;min-width:0;`;
        const n = document.createElement('div');
        n.textContent = (hab.icono ? hab.icono + ' ' : '') + (hab.nombre || '');
        n.style.cssText = `font-size:12px;font-weight:700;color:#e8eefc;`;
        txt.appendChild(n);
        if (hab.descripcion) {
            const d = document.createElement('div');
            d.textContent = hab.descripcion;
            d.style.cssText = `font-size:10px;color:#9aa8c8;line-height:1.3;margin-top:1px;`;
            txt.appendChild(d);
        }
        row.appendChild(keyBox);
        row.appendChild(txt);
        return row;
    }

    createAxieCard(axie, isDefault = false, isLocked = false) {
        const card = document.createElement('div');
        card.className = 'menu-card';
        if (isDefault) {
            card.classList.add('selected');
            this.selectedAxie = axie.id;
        }
        card.dataset.axieId = axie.id;

        const emojis = {
            bing: '\uD83D\uDC3B',
            kibo: '\uD83D\uDC31',
            kotaro: '\uD83E\uDD8A',
            paladill: '\uD83D\uDC09',
            pomodoro: '\uD83C\uDF45',
            tripp: '\uD83E\uDD84',
            xia: '\u2B50'
        };

        const iconEmoji = emojis[axie.id] || axie.habilidades?.pasiva?.icono || '\uD83D\uDC3E';

        // Fila horizontal estilo LoL: miniatura | nombre+rol
        card.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px 11px;
            background: ${isDefault ? 'rgba(255,220,68,0.10)' : 'rgba(255,255,255,0.06)'};
            border: 2px solid ${isDefault ? '#ffdd44' : 'rgba(255,255,255,0.15)'};
            border-radius: 11px;
            cursor: pointer;
            text-align: left;
            color: #fff;
            transition: all 0.22s ease;
            transform-origin: center center;
        `;

        // Miniatura estilo LoL: emoji sobre fondo con el color del Axie
        const thumb = document.createElement('div');
        thumb.style.cssText = `
            width: 46px; height: 46px;
            flex: 0 0 auto;
            border-radius: 9px;
            display: flex; align-items: center; justify-content: center;
            font-size: 26px;
            background: radial-gradient(circle at 50% 35%, ${axie.color || '#44ff88'}44, rgba(10,14,30,0.9) 75%);
            border: 1px solid ${axie.color || '#44ff88'}66;
            box-shadow: 0 0 14px ${axie.color || '#44ff88'}33;
        `;
        thumb.textContent = iconEmoji;

        const info = document.createElement('div');
        info.style.cssText = `flex:1;min-width:0;`;

        const name = document.createElement('div');
        name.style.cssText = `
            font-size: 14px;
            font-weight: bold;
            color: ${axie.color || '#ffffff'};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        name.textContent = axie.nombre;

        const type = document.createElement('div');
        type.style.cssText = `font-size: 10px; color: #88aaff; opacity: 0.7; letter-spacing: 1px;`;
        type.textContent = (axie.rol || axie.id).toUpperCase();

        info.appendChild(name);
        info.appendChild(type);
        card.appendChild(thumb);
        card.appendChild(info);

        // Axie bloqueado: tarjeta en gris, candado y sin seleccion
        if (isLocked) {
            card.style.background = 'rgba(255,255,255,0.03)';
            card.style.borderColor = 'rgba(255,255,255,0.08)';
            card.style.cursor = 'not-allowed';
            card.style.opacity = '0.45';
            card.style.filter = 'grayscale(1)';
            name.style.color = '#7c8399';
            type.textContent = 'BLOQUEADO';
            type.style.color = '#8a8f9e';

            const candado = document.createElement('div');
            candado.textContent = '\uD83D\uDD12';
            candado.style.cssText = 'font-size:13px;opacity:0.8;flex:0 0 auto;';
            card.appendChild(candado);

            card.addEventListener('click', () => {
                this.showToast('\uD83D\uDD12 ' + axie.nombre + ' no esta disponible todavia');
            });
            return card;
        }

        card.addEventListener('click', () => {
            document.querySelectorAll('#axie-select-modal .menu-card').forEach(c => {
                c.classList.remove('selected');
                c.style.background = 'rgba(255,255,255,0.06)';
                c.style.borderColor = 'rgba(255,255,255,0.15)';
                c.style.boxShadow = 'none';
                c.style.transform = 'translateX(0)';
            });
            card.classList.add('selected');
            card.style.background = 'rgba(255,220,68,0.10)';
            card.style.borderColor = '#ffdd44';
            card.style.boxShadow = '0 0 22px rgba(255,220,68,0.22)';
            card.style.transform = 'translateX(4px)';

            this.selectAxieInModal(axie);
        });

        return card;
    }

    createGameButton(label, subLabel, color, onClick, isDisabled = false) {
        const btn = document.createElement('button');
        btn.className = isDisabled ? 'btn-5v5' : 'menu-play-btn';

        if (isDisabled) {
            btn.style.cssText = `
                padding: 14px 60px;
                font-size: 20px;
                font-weight: bold;
                background: rgba(255,255,255,0.12);
                color: rgba(255,255,255,0.85);
                border: 2px solid rgba(255,255,255,0.25);
                border-radius: 12px;
                cursor: not-allowed;
                transition: all 0.3s ease;
                font-family: 'Segoe UI', Arial, sans-serif;
                min-width: 240px;
                backdrop-filter: blur(8px);
                box-shadow: 0 0 20px rgba(255,255,255,0.05);
            `;
        } else {
            btn.style.cssText = `
                padding: 16px 68px;
                font-size: 22px;
                font-weight: 900;
                background: linear-gradient(135deg, ${color}, ${color}dd);
                color: #031a0e;
                border: 2.5px solid ${color};
                border-radius: 14px;
                cursor: pointer;
                transition: all 0.25s ease;
                box-shadow: 0 0 28px ${color}44, inset 0 0 12px rgba(255,255,255,0.25);
                font-family: 'Segoe UI', Arial, sans-serif;
                min-width: 260px;
                letter-spacing: 1px;
            `;
        }

        if (!isDisabled) {
            btn.onmouseenter = () => {
                btn.style.transform = 'scale(1.06)';
                btn.style.boxShadow = `0 0 50px ${color}77, inset 0 0 14px rgba(255,255,255,0.35)`;
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = `0 0 28px ${color}44, inset 0 0 12px rgba(255,255,255,0.25)`;
            };
        }

        const mainText = document.createElement('div');
        mainText.textContent = label;
        mainText.style.fontSize = '20px';

        const subText = document.createElement('div');
        subText.textContent = subLabel;
        subText.style.fontSize = '11px';
        subText.style.opacity = '0.7';
        subText.style.marginTop = '2px';

        btn.appendChild(mainText);
        btn.appendChild(subText);
        btn.addEventListener('click', onClick);
        return btn;
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background: rgba(0,0,0,0.9);
            color: #ffdd44;
            border: 1px solid #ffdd44;
            border-radius: 10px;
            font-size: 15px;
            font-family: 'Segoe UI', Arial, sans-serif;
            z-index: 3000;
            animation: menuFadeIn 0.3s ease-out;
            box-shadow: 0 0 30px rgba(255,220,68,0.2);
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 500);
        }, 3000);
    }

    _mostrarModalModos() {
        const anterior = document.getElementById('menu-modes-modal');
        if (anterior) anterior.remove();
        const modal = document.createElement('div');
        modal.id = 'menu-modes-modal';
        modal.style.cssText = `position: fixed; inset: 0; z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.85); font-family: 'Segoe UI', Arial, sans-serif; color: #fff; padding-top: 80px; box-sizing: border-box;`;
        const video = document.createElement('video');
        video.src = import.meta.env.BASE_URL + 'assets/menu/menu-background.mp4';
        video.autoplay = true; video.loop = true; video.muted = true; video.playsInline = true;
        video.style.cssText = `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; opacity: 0.35; pointer-events: none;`;
        modal.appendChild(video);
        const overlay = document.createElement('div');
        overlay.style.cssText = `position: absolute; inset: 0; background: rgba(0, 0, 0, 0.55); z-index: 1; pointer-events: none;`;
        modal.appendChild(overlay);
// Overlay para tapar la marca de agua de KlingAI (esquina inferior derecha)
const watermarkCover = document.createElement('div');
watermarkCover.style.cssText = `
    position: absolute;
    bottom: 0;
    right: 0;
    width: 280px;
    height: 60px;
    background: radial-gradient(ellipse at bottom right, rgba(0,0,0,0.95) 30%, transparent 75%);
    z-index: 1;
    pointer-events: none;
`;
modal.appendChild(watermarkCover);

        const content = document.createElement('div');
        content.style.cssText = `position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; width: 100%; max-width: 900px; height: 100%; max-height: 100vh; padding: 60px 24px 24px 24px; box-sizing: border-box;`;
        const title = document.createElement('div');
        title.textContent = t('modes.select_title');
        title.style.cssText = `font-size: 26px; font-weight: 900; letter-spacing: 3px; color: #fff; text-shadow: 0 0 10px #00aaff, 0 0 20px #00aaff, 0 4px 8px rgba(0,0,0,0.9); margin-bottom: 10px;`;
        content.appendChild(title);
        const grid = document.createElement('div');
        grid.style.cssText = `display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%;`;
        grid.appendChild(this._crearTarjetaModo('🎮', t('modes.1v1_title'), t('modes.1v1_desc'), t('modes.play'), true, () => { this._cerrarModalModos(); this.openAxieSelectModal(); }));
        grid.appendChild(this._crearTarjetaModo('🤖', t('modes.ia_title'), t('modes.ia_desc'), t('modes.train'), true, () => { this._cerrarModalModos(); window.startAITrainingMode && window.startAITrainingMode(); }));
        grid.appendChild(this._crearTarjetaModo('🔒', t('modes.pvp_title'), t('modes.pvp_desc'), t('modes.locked'), false, null));
        grid.appendChild(this._crearTarjetaModo('🔒', t('modes.5v5_title'), t('modes.5v5_desc'), t('modes.locked'), false, null));
        content.appendChild(grid);
        modal.appendChild(content);
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `position: fixed; top: 4px; right: 4px; width: 44px; height: 44px; background: rgba(255, 68, 68, 0.9); border: 2px solid rgba(255, 200, 200, 0.9); border-radius: 8px; color: #fff; font-size: 22px; font-weight: bold; cursor: pointer; z-index: 2147483647; box-shadow: 0 0 12px rgba(255, 68, 68, 0.8);`;
        closeBtn.onclick = () => this._cerrarModalModos();
        modal.appendChild(closeBtn);
        const escHandler = (e) => { if (e.key === 'Escape') { this._cerrarModalModos(); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        modal._escHandler = escHandler;
        document.body.appendChild(modal);
    }

    _crearTarjetaModo(emoji, titulo, desc, botonTexto, activo, onClick) {
        const card = document.createElement('div');
        card.style.cssText = `background: ${activo ? 'linear-gradient(135deg, rgba(0, 170, 255, 0.15), rgba(20, 20, 40, 0.95))' : 'rgba(30, 30, 30, 0.7)'}; border: 2px solid ${activo ? 'rgba(0, 170, 255, 0.7)' : 'rgba(80, 80, 80, 0.5)'}; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: ${activo ? 'pointer' : 'not-allowed'}; transition: all 0.3s ease; opacity: ${activo ? '1' : '0.6'}; min-height: 200px; justify-content: center;`;
        if (activo) {
        card.onmouseenter = () => {
            card.style.transform = 'scale(0.93)';
            card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        };
        card.onmouseleave = () => {
            card.style.transform = 'scale(1)';
            card.style.boxShadow = 'none';
        };
        card.onclick = onClick;
    }
        const emojiEl = document.createElement('div'); emojiEl.textContent = emoji; emojiEl.style.cssText = 'font-size: 44px;'; card.appendChild(emojiEl);
        const tituloEl = document.createElement('div'); tituloEl.textContent = titulo; tituloEl.style.cssText = `font-size: 18px; font-weight: 700; color: ${activo ? '#00aaff' : '#888'}; text-align: center; line-height: 1.3;`;
        card.appendChild(tituloEl);
        const descEl = document.createElement('div'); descEl.textContent = desc; descEl.style.cssText = `font-size: 12px; color: #aaa; text-align: center; line-height: 1.4; margin-bottom: 8px;`;
        card.appendChild(descEl);
        const btnEl = document.createElement('div'); btnEl.textContent = botonTexto; btnEl.style.cssText = `margin-top: 6px; padding: 8px 20px; background: ${activo ? 'linear-gradient(135deg, #00aaff, #0088dd)' : 'rgba(80, 80, 80, 0.5)'}; color: ${activo ? '#fff' : '#666'}; font-size: 13px; font-weight: bold; border-radius: 8px; letter-spacing: 1px; white-space: nowrap;`;
        card.appendChild(btnEl);
        return card;
    }

    _cerrarModalModos() {
        const modal = document.getElementById('menu-modes-modal');
        if (modal) { if (modal._escHandler) document.removeEventListener('keydown', modal._escHandler); modal.remove(); }
    }

    hide() {
        this.stopMenuMusic();
        this.closeAxieSelectModal();
        if (this.container && this.container.parentNode) {
            this.container.style.opacity = '0';
            this.container.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
            }, 500);
        }
    }

    destroy() {
        this.stopMenuMusic();
        this.closeAxieSelectModal();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

export default MenuScreen;
