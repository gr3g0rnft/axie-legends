// =============================================
// COMBAT CONTROLLER - Targeting estilo LoL (versión simple)
// =============================================
// Delegación completa a main.js a través de la API expuesta
// - Click IZQUIERDO: Seleccionar objetivo / Atacar
// - Click DERECHO: Mover
// - Target "sticky": se maneja en main.js
// - Prioridad: UI (tienda) > Objetivo > Movimiento

// Elementos UI que bloquean clicks de juego
const UI_SELECTORS = [
  '#axie-hub', '#axie-skills', '#axie-items', '#shop-ui', 
  '#menu-screen', '#axie-select-modal', '#pantalla-carga'
];

function isClickOnUI(event) {
  for (const sel of UI_SELECTORS) {
    const el = document.querySelector(sel);
    if (el && (el === event.target || el.contains(event.target))) return true;
  }
  return false;
}

export function initCombatSystem() {
  console.log('⚔️ Sistema de combate (targeting LoL) inicializado.');

  // Prevenir menú contextual en clic derecho
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  // Mousedown: detectar qué botón
  window.addEventListener('pointerdown', (e) => {
    if (isClickOnUI(e)) return; // UI tiene prioridad
    
    if (e.button === 2) { // Click DERECHO -> Mover
      if (typeof window.setMoveTarget === 'function') {
        window.setMoveTarget(e.clientX, e.clientY);
      }
      // Limpiar target si click en suelo vacío
      if (typeof window.clearTarget === 'function') {
        window.clearTarget();
      }
    }
    else if (e.button === 0) { // Click IZQUIERDO -> Target/Atacar
      if (typeof window.setTarget === 'function') {
        window.setTarget(e.clientX, e.clientY);
      }
    }
  });

  // Mouseup: reset (no necesitamos hacer nada especial aquí)
  window.addEventListener('pointerup', (e) => {
    // Nada que hacer por ahora
  });

  // Click en UI de tienda: forzar apertura (evita que se interprete como movimiento)
  document.addEventListener('click', (e) => {
    const shopEl = e.target.closest('.shop-slot, .item-slot, .skill-slot, #axie-hub button, #axie-skills button');
    if (shopEl && typeof window.openShop === 'function') {
      e.stopPropagation();
      window.openShop();
    }
  }, true);
}

// API pública para otros módulos (por consistencia)
export function getSelectedTarget() { 
  return typeof window.getSelectedTarget === 'function' ? window.getSelectedTarget() : null; 
}
export function setSelectedTarget(t) { 
  if (typeof window.setTarget === 'function') window.setTarget(t); 
}
export function clearSelectedTarget() { 
  if (typeof window.clearTarget === 'function') window.clearTarget(); 
}

export default { initCombatSystem, getSelectedTarget, setSelectedTarget, clearSelectedTarget };
