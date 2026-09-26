// =============================================
// PANTALLA DE INICIO - MENU PRINCIPAL
// =============================================
// Estructura:
//   1) Menu principal limpio (logo + botones 1v1 / 5v5 / Entrenar IA)
//   2) Al pulsar 1v1 -> ventana modal de seleccion de Axie
//      (solo muestra los Axies habilitados en axies.js)

import { getAllAxies, isAxieHabilitado } from '../config/axies.js';
import { getPartesAxie, getRazasInfo } from '../config/axie-core.js';
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

        const crearBotonInferior = (id, texto, onClick) => {
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
                if (onClick) onClick();
                else this.showToast('🔧 Próximamente');
            };
            return btn;
        };

        bottomBar.appendChild(crearBotonInferior('menu-guide-btn', t('menu.guide'), () => this._mostrarModalGuia()));
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
        title.textContent = t('axie.select_title');
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
        sub.textContent = t('axie.subtitle');
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
        // CUERPO ESTILO LoL CLÁSICO
        // =========================================

        // Contenedor principal: fila con preview + stats
        const mainRow = document.createElement('div');
        mainRow.style.cssText = `
            display: flex;
            gap: 24px;
            align-items: flex-start;
            margin-bottom: 20px;
        `;

        // --- IZQUIERDA: Preview 3D grande ---
        const previewStage = document.createElement('div');
        previewStage.style.cssText = `
            position: relative;
            width: 420px;
            height: 360px;
            border-radius: 14px;
            background: radial-gradient(circle at 50% 40%, rgba(68,255,136,0.15), rgba(10,14,30,0.9) 70%);
            border: 2px solid rgba(0, 170, 255, 0.4);
            overflow: hidden;
            box-shadow: 0 0 40px rgba(0, 170, 255, 0.25), inset 0 0 60px rgba(0,0,0,0.55);
        `;

        const preview = document.createElement('canvas');
        preview.id = 'axie-preview-canvas';
        preview.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;display:block;`;
        preview.width = 420;
        preview.height = 360;
        previewStage.appendChild(preview);

        // Guardar referencias para uso en selectAxieInModal
        this.previewCanvas = preview;
        this.previewStage = previewStage;

        // Nombre encima de la preview
        const nameOverlay = document.createElement('div');
        nameOverlay.id = 'axie-modal-name';
        nameOverlay.style.cssText = `
            position: absolute;
            top: 14px;
            left: 20px;
            font-size: 28px;
            font-weight: 900;
            letter-spacing: 3px;
            color: #fff;
            text-shadow: 0 0 20px rgba(68,255,136,0.6), 0 4px 8px rgba(0,0,0,0.9);
            text-transform: uppercase;
            z-index: 2;
        `;
        nameOverlay.textContent = 'BING';
        previewStage.appendChild(nameOverlay);

        // Rol debajo del nombre
        const roleOverlay = document.createElement('div');
        roleOverlay.id = 'axie-modal-role';
        roleOverlay.style.cssText = `
            position: absolute;
            top: 48px;
            left: 20px;
            font-size: 11px;
            letter-spacing: 3px;
            color: #88ddff;
            opacity: 0.8;
            text-transform: uppercase;
            z-index: 2;
        `;
        roleOverlay.textContent = 'EL LÍDER FEROZ';
        previewStage.appendChild(roleOverlay);

        mainRow.appendChild(previewStage);

        // --- DERECHA: Panel de stats grande ---
        const statsPanel = document.createElement('div');
        statsPanel.id = 'axie-modal-stats';
        statsPanel.style.cssText = `
            width: 280px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 16px;
            background: linear-gradient(135deg, rgba(0, 170, 255, 0.08), rgba(20, 20, 40, 0.5));
            border: 1px solid rgba(0, 170, 255, 0.25);
            border-radius: 12px;
        `;
        mainRow.appendChild(statsPanel);

        panel.appendChild(mainRow);

        // --- ABAJO: Grid de iconos de Axies ---
        const axieGrid = document.createElement('div');
        axieGrid.id = 'axie-list';
        axieGrid.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-bottom: 18px;
            flex-wrap: wrap;
        `;
        panel.appendChild(axieGrid);

        // --- ABAJO: Habilidades en fila horizontal ---
        const skillsRow = document.createElement('div');
        skillsRow.id = 'axie-modal-skills';
        skillsRow.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-bottom: 20px;
        `;
        panel.appendChild(skillsRow);

        // Poblar el grid de Axies
        const axies = getAllAxies();
        const primerHabilitadoId = (axies.find(a => isAxieHabilitado(a.id)) || {}).id || null;
        this.selectedAxie = null;

        axies.forEach((axie) => {
            const card = this.createAxieCard(axie, axie.id === primerHabilitadoId, !isAxieHabilitado(axie.id));
            axieGrid.appendChild(card);
        });

        // Iniciar el visor 3D
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
        playBtn.textContent = t('axie.start_match');
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
    // MODAL GUÍA DE CONTROLES
    // =========================================
    _mostrarModalGuia() {
        const anterior = document.getElementById('menu-guide-modal');
        if (anterior) anterior.remove();

        const modal = document.createElement('div');
        modal.id = 'menu-guide-modal';
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.85);
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #fff;
            padding: 20px;
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            position: relative;
            background: linear-gradient(160deg, rgba(20,24,48,0.98), rgba(10,12,28,0.98));
            border: 2px solid rgba(0, 170, 255, 0.5);
            border-radius: 16px;
            box-shadow: 0 0 60px rgba(0, 170, 255, 0.25), 0 20px 60px rgba(0,0,0,0.6);
            padding: 30px 40px;
            width: 100%;
            max-width: 700px;
            max-height: 90vh;
            overflow-y: auto;
        `;

        const title = document.createElement('div');
        title.textContent = t('guide.title');
        title.style.cssText = `
            font-size: 28px;
            font-weight: 900;
            letter-spacing: 3px;
            color: #fff;
            text-shadow: 0 0 15px rgba(0, 170, 255, 0.6);
            margin-bottom: 6px;
            text-align: center;
        `;
        panel.appendChild(title);

        const sub = document.createElement('div');
        sub.textContent = t('guide.subtitle');
        sub.style.cssText = `
            font-size: 11px;
            letter-spacing: 3px;
            color: #88aaff;
            text-align: center;
            margin-bottom: 24px;
            opacity: 0.8;
        `;
        panel.appendChild(sub);

        const crearSeccion = (tituloSeccion, filas) => {
            const sec = document.createElement('div');
            sec.style.cssText = `margin-bottom: 22px;`;

            const secTitle = document.createElement('div');
            secTitle.textContent = tituloSeccion;
            secTitle.style.cssText = `
                font-size: 14px;
                font-weight: 700;
                color: #88ddff;
                letter-spacing: 2px;
                margin-bottom: 10px;
                padding-bottom: 6px;
                border-bottom: 1px solid rgba(0, 170, 255, 0.3);
            `;
            sec.appendChild(secTitle);

            filas.forEach(([key, desc]) => {
                const row = document.createElement('div');
                row.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 6px 8px;
                    border-radius: 6px;
                    transition: background 0.15s ease;
                `;
                row.onmouseenter = () => { row.style.background = 'rgba(0, 170, 255, 0.1)'; };
                row.onmouseleave = () => { row.style.background = 'transparent'; };

                const keyEl = document.createElement('div');
                keyEl.textContent = key;
                keyEl.style.cssText = `
                    flex: 0 0 200px;
                    font-size: 13px;
                    color: #aaccff;
                    font-weight: 600;
                `;

                const arrow = document.createElement('div');
                arrow.textContent = '→';
                arrow.style.cssText = `
                    flex: 0 0 20px;
                    color: #88aaff;
                    opacity: 0.6;
                `;

                const descEl = document.createElement('div');
                descEl.textContent = desc;
                descEl.style.cssText = `
                    flex: 1;
                    font-size: 13px;
                    color: #ddeeff;
                `;

                row.appendChild(keyEl);
                row.appendChild(arrow);
                row.appendChild(descEl);
                sec.appendChild(row);
            });

            return sec;
        };

        panel.appendChild(crearSeccion(t('guide.section_movement'), [
            [t('guide.move_right'), t('guide.move_right_desc')],
            [t('guide.attack_left'), t('guide.attack_left_desc')],
            [t('guide.recall'), t('guide.recall_desc')],
        ]));

        panel.appendChild(crearSeccion(t('guide.section_camera'), [
            [t('guide.cam_y'), t('guide.cam_y_desc')],
            [t('guide.cam_zoom'), t('guide.cam_zoom_desc')],
            [t('guide.cam_edges'), t('guide.cam_edges_desc')],
            [t('guide.cam_f11'), t('guide.cam_f11_desc')],
        ]));

        panel.appendChild(crearSeccion(t('guide.section_abilities'), [
            [t('guide.hab_q'), t('guide.hab_q_desc')],
            [t('guide.hab_w'), t('guide.hab_w_desc')],
            [t('guide.hab_e'), t('guide.hab_e_desc')],
            [t('guide.hab_r'), t('guide.hab_r_desc')],
        ]));

        panel.appendChild(crearSeccion(t('guide.section_shop'), [
            [t('guide.shop_open'), t('guide.shop_open_desc')],
            [t('guide.potion'), t('guide.potion_desc')],
            [t('guide.upgrade'), t('guide.upgrade_desc')],
            [t('guide.potion_hp_key'), t('guide.potion_hp_key_desc')],
            [t('guide.potion_mp_key'), t('guide.potion_mp_key_desc')],
        ]));

        panel.appendChild(crearSeccion(t('guide.section_interface'), [
            [t('guide.tab'), t('guide.tab_desc')],
            [t('guide.escape'), t('guide.escape_desc')],
            [t('guide.axie_core'), t('guide.axie_core_desc')],
        ]));

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 12px;
            right: 12px;
            width: 40px;
            height: 40px;
            background: rgba(255, 68, 68, 0.9);
            border: 2px solid rgba(255, 200, 200, 0.9);
            border-radius: 8px;
            color: #fff;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10;
        `;
        closeBtn.onclick = () => this._cerrarModalGuia();
        panel.appendChild(closeBtn);

        modal.appendChild(panel);
        document.body.appendChild(modal);

        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this._cerrarModalGuia();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        modal._escHandler = escHandler;
    }

    _cerrarModalGuia() {
        const modal = document.getElementById('menu-guide-modal');
        if (modal) {
            if (modal._escHandler) {
                document.removeEventListener('keydown', modal._escHandler);
            }
            modal.remove();
        }
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
        if (roleEl) {
            // Mostrar la DESCRIPCIÓN corta del Axie, no el id
            roleEl.textContent = axie.descripcion ? axie.descripcion.toUpperCase() : '';
        }

        // Fondo splash (imagen JPG del Axie)
        const previewStage = this.previewStage;
        if (!previewStage) return; // seguridad: si no existe, salir
        if (previewStage) {
            // Quitar fondo splash anterior
            const old = previewStage.querySelector('.axie-splash-bg');
            if (old) old.remove();

            const splashBg = document.createElement('div');
            splashBg.className = 'axie-splash-bg';
            splashBg.style.cssText = `
                position: absolute;
                inset: 0;
                background-image: url('${import.meta.env.BASE_URL}assets/axies/splash/${axie.id}.jpg');
                background-size: cover;
                background-position: center;
                opacity: 0.35;
                z-index: 0;
                pointer-events: none;
                border-radius: 12px;
                transition: opacity 0.3s ease;
            `;
            // Insertarlo como primer hijo (detrás del canvas)
            previewStage.insertBefore(splashBg, previewStage.firstChild);
        }
        // Asegurar que el canvas esté encima
        if (this.previewCanvas) this.previewCanvas.style.zIndex = '1';

        // Stats en panel lateral (nuevo formato: icono + label + barra + valor)
        if (statsEl) {
            statsEl.innerHTML = '';
            const s = axie.stats || {};
            const rows = [
                ['❤️', t('axie.stats_hp'),    s.vida || 0, 200, '#ff4466'],
                ['⚔️', t('axie.stats_atk'),   s.ataque || 0, 40, '#ff8844'],
                ['🛡️', t('axie.stats_def'),   s.defensa || 0, 40, '#44aaff'],
                ['⚡', t('axie.stats_spd'),   s.velocidad || 0, 2, '#ffdd44'],
                ['🎯', t('axie.stats_range'), 4.0, 10, '#ff66aa'],
                ['⏱️', t('axie.stats_as'),    0.7, 2, '#aa88ff'],
                ['💧', t('axie.stats_mana'),  200, 500, '#44ddff'],
            ];
            rows.forEach(([icon, label, value, max, color]) => {
                const row = document.createElement('div');
                row.style.cssText = `display:flex;align-items:center;gap:8px;`;
                const iconEl = document.createElement('div');
                iconEl.textContent = icon;
                iconEl.style.cssText = `font-size:14px;width:20px;`;
                const labelEl = document.createElement('div');
                labelEl.textContent = label;
                labelEl.style.cssText = `font-size:10px;letter-spacing:1px;color:#9aa8c8;width:70px;`;
                const track = document.createElement('div');
                track.style.cssText = `flex:1;height:6px;background:rgba(255,255,255,0.09);border-radius:3px;overflow:hidden;`;
                const fill = document.createElement('div');
                fill.style.cssText = `width:${Math.min(100, (value / max) * 100)}%;height:100%;background:${color};border-radius:3px;transition:width 0.35s ease;`;
                track.appendChild(fill);
                const valueEl = document.createElement('div');
                valueEl.textContent = value;
                valueEl.style.cssText = `font-size:12px;font-weight:bold;color:#dfe6f5;width:36px;text-align:right;`;
                row.appendChild(iconEl); row.appendChild(labelEl);
                row.appendChild(track); row.appendChild(valueEl);
                statsEl.appendChild(row);
            });
        }

        // Habilidades Q/W/E/R + pasiva - USAR HABILIDADES REALES
        if (skillsEl) {
            skillsEl.innerHTML = '';
            
            // Importar las habilidades reales del Axie actual
            // getHabilidades() devuelve las Q/W/E/R del Axie actualmente seleccionado
            // pero como queremos las del Axie CLICKEADO (no el seleccionado del juego),
            // usamos HABILIDADES_POR_AXIE directamente.
            const habsDelAxie = window.__debug?.HABILIDADES_POR_AXIE?.[axie.id] 
                || (window.HABILIDADES_POR_AXIE && window.HABILIDADES_POR_AXIE[axie.id])
                || null;
            
            if (habsDelAxie) {
                // Mostrar Q, W, E, R (4 habilidades con iconos reales)
                ['q', 'w', 'e', 'r'].forEach(key => {
                    const hab = habsDelAxie[key];
                    if (hab) {
                        skillsEl.appendChild(this.createSkillRow(key.toUpperCase(), hab));
                    }
                });
            } else {
                // Fallback: mostrar lo que haya en axies.js (emojis)
                const h = axie.habilidades || {};
                if (h.activa) skillsEl.appendChild(this.createSkillRow('Q', h.activa));
                if (h.activa) skillsEl.appendChild(this.createSkillRow('W', h.activa));
                if (h.activa) skillsEl.appendChild(this.createSkillRow('E', h.activa));
                if (h.definitiva) skillsEl.appendChild(this.createSkillRow('R', h.definitiva));
                if (h.pasiva) skillsEl.appendChild(this.createSkillRow('P', h.pasiva));
            }
        }

        // Axie Core: 5 razas del Axie
        const coreEl = document.getElementById('axie-modal-core');
        if (coreEl) {
            const partes = getPartesAxie(axie.id);
            const razas = getRazasInfo();
            if (partes && razas) {
                let coreHtml = `<div style="font-size:11px;color:#88aaff;letter-spacing:2px;margin-bottom:6px;">${t('axie.axie_core')}:</div>`;
                coreHtml += '<div style="display:flex;gap:10px;align-items:center;justify-content:center;">';
                const casillas = ['tipo', 'boca', 'orejas', 'espalda', 'cola'];
                for (const c of casillas) {
                    const razaId = partes[c];
                    const raza = razas[razaId];
                    if (raza) {
                        coreHtml += `<div style="text-align:center;">
                            <div style="font-size:22px;filter:drop-shadow(0 0 6px ${raza.color}88);">${raza.emoji}</div>
                            <div style="font-size:9px;color:${raza.color};font-weight:bold;">${raza.nombre}</div>
                        </div>`;
                    }
                }
                coreHtml += '</div>';
                coreEl.innerHTML = coreHtml;
            }
        }

        // Cargar modelo 3D + arma (token evita cargas cruzadas)
        const token = ++this.previewToken;
        if (this.previewer) {
            const modelo = axie.modeloPath || axie.modelo;
            const arma = axie.armaPath || axie.arma;
            this.previewer.load(modelo, arma, axie.escala || 1.15).then(() => {
                if (token !== this.previewToken) return;
                if (this.previewer.controls) this.previewer.controls.enabled = true;
            });
        }
    }

    createSkillRow(key, hab) {
        const isKey = /^[QWERP]$/.test(key);
        const border = isKey ? 'rgba(68,255,136,0.35)' : 'rgba(170,140,255,0.35)';
        const bg = isKey ? 'rgba(68,255,136,0.15)' : 'rgba(170,140,255,0.15)';
        const color = isKey ? '#44ff88' : '#bb99ff';

        const box = document.createElement('div');
        box.style.cssText = `
            width: 60px;
            height: 60px;
            border-radius: 10px;
            background: ${bg};
            border: 1px solid ${border};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            cursor: default;
            transition: all 0.2s ease;
        `;

        const keyEl = document.createElement('div');
        keyEl.textContent = key;
        keyEl.style.cssText = `
            font-size: 16px;
            font-weight: 900;
            color: ${color};
            text-shadow: 0 0 8px ${color}88;
        `;

        const iconContainer = document.createElement('div');
        iconContainer.style.cssText = `width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;`;
        
        const iconoSrc = hab.icono || '';
        if (iconoSrc && (iconoSrc.startsWith('assets/') || iconoSrc.startsWith('/') || iconoSrc.includes('.jpg') || iconoSrc.includes('.png'))) {
            // Es una ruta de imagen
            const img = document.createElement('img');
            const base = import.meta.env.BASE_URL || '/';
            const cleanPath = iconoSrc.startsWith('/') ? iconoSrc.slice(1) : iconoSrc;
            const cleanBase = base.endsWith('/') ? base : base + '/';
            img.src = cleanBase + cleanPath;
            img.style.cssText = `width: 100%; height: 100%; object-fit: cover; border-radius: 6px;`;
            img.onerror = () => { img.remove(); iconContainer.textContent = '🎯'; iconContainer.style.fontSize = '20px'; };
            iconContainer.appendChild(img);
        } else {
            // Es un emoji
            iconContainer.textContent = iconoSrc || '🎯';
            iconContainer.style.fontSize = '20px';
        }

        box.appendChild(keyEl);
        box.appendChild(iconContainer);

        // Tooltip on hover
        if (hab.descripcion) {
            box.title = hab.descripcion;
        }

        return box;
    }

    createAxieCard(axie, isDefault = false, isLocked = false) {
        const card = document.createElement('div');
        card.className = 'axie-card';
        if (isDefault) card.classList.add('selected');
        card.dataset.axieId = axie.id;

        const emojis = {
            bing: '\uD83D\uDC3B', kibo: '\uD83D\uDC31', kotaro: '\uD83E\uDD8A',
            paladill: '\uD83D\uDC09', pomodoro: '\uD83C\uDF45', tripp: '\uD83E\uDD84', xia: '\u2B50'
        };
        const iconEmoji = emojis[axie.id] || '\uD83D\uDC3E';

        card.style.cssText = `
            position: relative;
            width: 76px;
            height: 76px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 34px;
            cursor: ${isLocked ? 'not-allowed' : 'pointer'};
            background: radial-gradient(circle at 50% 35%, ${axie.color || '#44ff88'}55, rgba(10,14,30,0.9) 75%);
            border: 2px solid ${isDefault ? '#ffdd44' : (axie.color || '#44ff88') + '88'};
            box-shadow: ${isDefault ? `0 0 24px ${axie.color || '#44ff88'}aa` : `0 0 10px ${axie.color || '#44ff88'}44`};
            transition: all 0.25s ease;
            opacity: ${isLocked ? 0.4 : 1};
            overflow: hidden;
        `;
        card.textContent = iconEmoji;

        // Nombre debajo del icono
        const nameLabel = document.createElement('div');
        nameLabel.style.cssText = `
            position: absolute;
            bottom: 4px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9px;
            font-weight: bold;
            color: ${axie.color || '#fff'};
            text-shadow: 0 0 4px rgba(0,0,0,0.9);
            letter-spacing: 1px;
        `;
        nameLabel.textContent = axie.nombre.toUpperCase();
        card.appendChild(nameLabel);

        if (isLocked) {
            const lock = document.createElement('div');
            lock.textContent = '\uD83D\uDD12';
            lock.style.cssText = `
                position: absolute;
                top: 4px;
                right: 4px;
                font-size: 16px;
                filter: drop-shadow(0 0 4px rgba(0,0,0,0.9));
            `;
            card.appendChild(lock);
        }

        card.onmouseenter = () => {
            if (!isLocked) {
                card.style.transform = 'scale(0.93)';
                card.style.boxShadow = `0 0 28px ${axie.color || '#44ff88'}cc`;
            }
        };
        card.onmouseleave = () => {
            if (!isLocked) {
                card.style.transform = 'scale(1)';
                card.style.boxShadow = `0 0 10px ${axie.color || '#44ff88'}44`;
            }
        };
        card.onclick = () => {
            if (!isLocked) this.selectAxieInModal(axie);
        };
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
