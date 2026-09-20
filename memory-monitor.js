// Monitor de Memoria y FPS para la página web
const memoryValueEl = document.getElementById('memory-value');

function updateMemoryUsage() {
    if (performance.memory) {
        const usedMB = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2);
        const totalMB = (performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(2);
        
        if (memoryValueEl) {
            memoryValueEl.textContent = ${usedMB} /  MB;
        }
    } else {
        if (memoryValueEl) {
            memoryValueEl.textContent = "No soportado (usa Chrome/Edge)";
        }
    }
}

// Actualizar cada segundo
setInterval(updateMemoryUsage, 1000);
