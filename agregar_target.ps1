cd "D:\AXIELEGENDS"
Copy-Item -Path "src\main.js" -Destination "src\main.js.backup_seguro" -Force
$mainJS = Get-Content -Path "src\main.js" -Raw
if ($mainJS -match "SISTEMA_DE_TARGET") { Write-Host "Ya existe"; exit }
$targetCode = @"
// =============================================
// SISTEMA_DE_TARGET
// =============================================
const targetUI = document.createElement('div');
targetUI.id = 'target-ui';
targetUI.style.cssText = 'position:fixed;top:20px;left:20px;width:240px;background:rgba(0,0,0,0.85);border:2px solid rgba(255,200,50,0.6);border-radius:8px;padding:8px 12px;z-index:150;font-family:Segoe UI,Arial,sans-serif;color:#fff;display:none;pointer-events:none;box-shadow:0 0 30px rgba(0,0,0,0.9);';
targetUI.innerHTML = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span id="target-name" style="font-weight:bold;font-size:14px;color:#ffcc44;">Enemigo</span><span id="target-level" style="font-size:11px;color:#88aaff;background:rgba(255,255,255,0.1);padding:0 8px;border-radius:4px;">Lv.1</span><span id="target-type" style="font-size:10px;color:#88aaff;background:rgba(255,255,255,0.1);padding:0 8px;border-radius:4px;">Minion</span></div><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:12px;color:#ff6644;">❤️</span><div style="flex:1;height:16px;background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);"><div id="target-health-bar" style="width:100%;height:100%;background:linear-gradient(90deg,#ff2244,#ff6644);border-radius:4px;transition:width 0.2s;"></div></div><span id="target-health-text" style="font-size:11px;font-weight:bold;min-width:50px;text-align:right;color:#fff;">100/100</span></div>';
document.body.appendChild(targetUI);
let currentTarget = null;
function showTarget(target) {
    currentTarget = target;
    if (!target || target.isDead) { targetUI.style.display = 'none'; return; }
    targetUI.style.display = 'block';
    let nameEl = document.getElementById('target-name');
    let levelEl = document.getElementById('target-level');
    let typeEl = document.getElementById('target-type');
    let healthBar = document.getElementById('target-health-bar');
    let healthText = document.getElementById('target-health-text');
    let name = 'Enemigo';
    if (target.type === 'minion') { name = target.minionType === 'mage' ? 'Minion Mago' : 'Minion Guerrero'; }
    else if (target.type === 'tower') { name = target.isEnemy ? 'Torre Enemiga' : 'Torre Aliada'; }
    else if (target.type === 'nexus') { name = target.isEnemy ? 'Nexo Enemigo' : 'Nexo Aliado'; }
    nameEl.textContent = name;
    levelEl.textContent = 'Lv.1';
    typeEl.textContent = target.type || 'objeto';
    let pct = (target.health / target.maxHealth) * 100;
    healthBar.style.width = Math.max(0, pct) + '%';
    healthText.textContent = Math.floor(target.health) + '/' + target.maxHealth;
}
function updateTargetUI() {
    if (currentTarget && !currentTarget.isDead) { showTarget(currentTarget); }
    else if (currentTarget) { currentTarget = null; targetUI.style.display = 'none'; }
}
function getTargetFromClick(event) {
    let rect = renderer.domElement.getBoundingClientRect();
    let mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    let selectables = [];
    let allEntities = [].concat(enemigos, aliados, towers, [nexusAliado, nexusEnemigo]);
    for (let i = 0; i < allEntities.length; i++) {
        let entity = allEntities[i];
        if (entity.isDead || !entity.group) continue;
        entity.group.traverse(function(child) {
            if (child.isMesh) selectables.push(child);
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
}
renderer.domElement.addEventListener('mousedown', function(e) {
    if (e.button === 0 && playerModel) {
        let target = getTargetFromClick(e);
        if (target && !target.isDead) { showTarget(target); return; }
        if (currentTarget) { currentTarget = null; targetUI.style.display = 'none'; }
    } else if (e.button === 2 && currentTarget) {
        currentTarget = null; targetUI.style.display = 'none';
    }
});
"@
$mainJS = $mainJS.TrimEnd() + "`n`n" + $targetCode
$lines = $mainJS -split "`n"
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'playerModel\.position\.copy\(smoothPlayerPos\)' -and $lines[$i] -notmatch 'updateTargetUI') {
        $lines[$i] = $lines[$i] + "`n    updateTargetUI();"
        break
    }
}
$mainJS = $lines -join "`n"
$mainJS | Out-File -FilePath "src\main.js" -Encoding UTF8
Write-Host "SISTEMA DE TARGET AGREGADO" -ForegroundColor Green
