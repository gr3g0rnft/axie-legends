// Monitor de memoria desplazado a la izquierda para mejor alineación
function forceMemoryMonitor() {
    if (document.getElementById('forced-memory-box')) return;

    const box = document.createElement('div');
    box.id = 'forced-memory-box';
    box.style.cssText = 'position: fixed; top: 54px; right: 22px; z-index: 2147483647; color: #ff0; font-family: monospace; font-size: 13px; font-weight: bold; background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); pointer-events: none; text-align: right;';
    box.innerHTML = 'MEM: <span id="memory-value">--</span> MB';
    
    document.body.appendChild(box);

    setInterval(() => {
        const memVal = document.getElementById('memory-value');
        if (memVal) {
            if (performance.memory) {
                const mb = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
                memVal.textContent = mb;
            } else {
                memVal.textContent = 'N/A';
            }
        }
    }, 1000);
}

if (document.readyState === 'complete') {
    forceMemoryMonitor();
} else {
    window.addEventListener('load', forceMemoryMonitor);
    setTimeout(forceMemoryMonitor, 2000);
}

