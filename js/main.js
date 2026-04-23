/**
 * 游戏主入口文件
 * 初始化游戏系统并启动
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    console.log('========================================');
    console.log('      机甲战神 - 机甲定制与竞技游戏      ');
    console.log('========================================');
    console.log('版本: ' + GameConfig.version);
    console.log('初始化游戏系统...');
    
    try {
        // 初始化所有模块
        initGameSystems();
        
        console.log('✓ 游戏系统初始化完成');
        console.log('========================================');
        
    } catch (error) {
        console.error('游戏初始化失败:', error);
        showInitError(error);
    }
});

// 初始化游戏系统
function initGameSystems() {
    // 检查Three.js是否加载
    if (typeof THREE === 'undefined') {
        throw new Error('Three.js库未加载，请检查网络连接或CDN地址');
    }
    
    console.log('  正在初始化游戏引擎...');
    GameEngine.init();
    
    console.log('  正在初始化UI管理器...');
    UIManager.init();
    
    console.log('  正在启动UI更新循环...');
    UIManager.startUpdateLoop();
    
    // 显示主菜单
    console.log('  正在显示主菜单...');
    UIManager.showScreen('menu');
    
    // 添加调试信息（开发模式）
    if (GameConfig.debug.enabled) {
        console.log('  调试模式已启用');
        addDebugInfo();
    }
}

// 添加调试信息
function addDebugInfo() {
    // 创建调试信息容器
    const debugContainer = document.createElement('div');
    debugContainer.id = 'debugInfo';
    debugContainer.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: #00ff00;
        padding: 15px;
        border-radius: 10px;
        font-family: monospace;
        font-size: 12px;
        z-index: 9999;
        min-width: 200px;
        border: 1px solid #00ff00;
    `;
    
    debugContainer.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; color: #00ffff;">
            调试信息
        </div>
        <div id="debugFPS">FPS: 0</div>
        <div id="debugState">状态: 菜单</div>
        <div id="debugMode">模式: 无</div>
        <div id="debugMechs">机甲数: 0</div>
        <div id="debugProjectiles">弹道数: 0</div>
    `;
    
    document.body.appendChild(debugContainer);
    
    // 更新调试信息
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 0;
    
    function updateDebugInfo() {
        requestAnimationFrame(updateDebugInfo);
        
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastTime = currentTime;
            
            const fpsElement = document.getElementById('debugFPS');
            if (fpsElement) {
                let color = '#00ff00';
                if (fps < 30) color = '#ff0000';
                else if (fps < 60) color = '#ffff00';
                fpsElement.innerHTML = `FPS: <span style="color: ${color}">${fps}</span>`;
            }
        }
        
        // 更新其他调试信息
        const stateElement = document.getElementById('debugState');
        if (stateElement) {
            stateElement.textContent = `状态: ${GameState.currentState}`;
        }
        
        const modeElement = document.getElementById('debugMode');
        if (modeElement) {
            modeElement.textContent = `模式: ${GameState.currentMode || '无'}`;
        }
        
        const mechsElement = document.getElementById('debugMechs');
        if (mechsElement) {
            const activeMechs = GameState.getAllActiveMechs().length;
            mechsElement.textContent = `机甲数: ${activeMechs}`;
        }
        
        const projectilesElement = document.getElementById('debugProjectiles');
        if (projectilesElement && GameEngine.renderer && GameEngine.renderer.projectileManager) {
            const projectileCount = GameEngine.renderer.projectileManager.projectiles.length;
            projectilesElement.textContent = `弹道数: ${projectileCount}`;
        }
    }
    
    updateDebugInfo();
    
    console.log('  调试信息面板已创建');
}

// 显示初始化错误
function showInitError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 30px;
        border-radius: 15px;
        font-family: sans-serif;
        text-align: center;
        z-index: 10000;
        max-width: 500px;
    `;
    
    errorDiv.innerHTML = `
        <h2 style="margin: 0 0 20px 0;">游戏初始化失败</h2>
        <p style="margin: 0 0 15px 0; font-size: 14px;">
            ${error.message}
        </p>
        <p style="margin: 0; font-size: 12px; opacity: 0.8;">
            请刷新页面重试，或检查网络连接
        </p>
    `;
    
    document.body.appendChild(errorDiv);
}

// 添加全局错误处理
window.onerror = function(message, source, lineno, colno, error) {
    console.error('全局错误:', {
        message: message,
        source: source,
        lineno: lineno,
        colno: colno,
        error: error
    });
    
    // 可以在这里添加错误上报逻辑
    return false;
};

// 添加未处理的Promise错误处理
window.addEventListener('unhandledrejection', function(event) {
    console.error('未处理的Promise拒绝:', event.reason);
});

// 性能监控（可选）
if (GameConfig.debug.showStats) {
    // 可以在这里添加性能监控
}

// 游戏控制快捷键（开发模式）
if (GameConfig.debug.enabled) {
    document.addEventListener('keydown', (e) => {
        // F1: 切换调试信息显示
        if (e.keyCode === 112) {
            const debugInfo = document.getElementById('debugInfo');
            if (debugInfo) {
                debugInfo.style.display = 
                    debugInfo.style.display === 'none' ? 'block' : 'none';
            }
        }
        
        // F2: 切换无敌模式（仅游戏中）
        if (e.keyCode === 113 && GameState.currentState === 'playing') {
            if (GameState.player) {
                GameConfig.debug.godMode = !GameConfig.debug.godMode;
                GameState.player.isInvulnerable = GameConfig.debug.godMode;
                console.log('无敌模式:', GameConfig.debug.godMode ? '开启' : '关闭');
            }
        }
        
        // F3: 无限能量
        if (e.keyCode === 114 && GameState.currentState === 'playing') {
            GameConfig.debug.infiniteEnergy = !GameConfig.debug.infiniteEnergy;
            console.log('无限能量:', GameConfig.debug.infiniteEnergy ? '开启' : '关闭');
            
            if (GameState.player && GameConfig.debug.infiniteEnergy) {
                GameState.player.energy = GameState.player.maxEnergy;
            }
        }
    });
}

// 导出全局访问（用于调试）
window.MechGame = {
    GameConfig: GameConfig,
    GameState: GameState,
    GameEngine: GameEngine,
    UIManager: UIManager,
    CustomizeManager: CustomizeManager,
    SkillSystem: SkillSystem,
    WeaponSystem: WeaponSystem,
    EnemyAI: EnemyAI,
    MechBlueprints: MechBlueprints,
    ThreeDRenderer: ThreeDRenderer,
    ProjectileManager: ProjectileManager,
    ParticleSystem: ParticleSystem
};

console.log('提示: 可以通过 window.MechGame 访问游戏对象进行调试');
console.log('例如: window.MechGame.GameState.player 查看玩家状态');