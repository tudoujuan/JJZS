/**
 * UI管理器
 * 处理游戏界面的UI更新和交互
 */

const UIManager = {
    // UI元素引用
    elements: {},
    
    // 动画状态
    animations: {
        healthBar: { target: 1, current: 1 },
        energyBar: { target: 1, current: 1 },
        enemyHealthBar: { target: 1, current: 1 }
    },
    
    // 初始化
    init: function() {
        console.log('UI管理器初始化');
        
        // 缓存UI元素
        this.cacheElements();
        
        // 绑定事件
        this.bindEvents();
        
        // 监听游戏状态变化
        this.listenToGameState();
    },
    
    // 缓存UI元素
    cacheElements: function() {
        // 屏幕
        this.elements.mainMenu = document.getElementById('mainMenu');
        this.elements.customizeScreen = document.getElementById('customizeScreen');
        this.elements.modeSelectScreen = document.getElementById('modeSelectScreen');
        this.elements.gameScreen = document.getElementById('gameScreen');
        this.elements.helpScreen = document.getElementById('helpScreen');
        
        // 游戏UI
        this.elements.playerHealthBar = document.getElementById('playerHealthBar');
        this.elements.playerHealth = document.getElementById('playerHealth');
        this.elements.playerEnergyBar = document.getElementById('playerEnergyBar');
        this.elements.playerEnergy = document.getElementById('playerEnergy');
        this.elements.comboCount = document.getElementById('comboCount');
        this.elements.enemyHealthBar = document.getElementById('enemyHealthBar');
        
        // 技能栏
        this.elements.skillItems = {
            skill1: document.getElementById('skill1'),
            skill2: document.getElementById('skill2'),
            skill3: document.getElementById('skill3'),
            skill4: document.getElementById('skill4')
        };
        
        // 暂停菜单
        this.elements.pauseMenu = document.getElementById('pauseMenu');
        
        // 游戏结束
        this.elements.gameOverScreen = document.getElementById('gameOverScreen');
        this.elements.gameOverTitle = document.getElementById('gameOverTitle');
        this.elements.gameOverMessage = document.getElementById('gameOverMessage');
        this.elements.finalKills = document.getElementById('finalKills');
        this.elements.finalCombo = document.getElementById('finalCombo');
        this.elements.finalDamage = document.getElementById('finalDamage');
    },
    
    // 绑定事件
    bindEvents: function() {
        // 主菜单按钮
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                this.showScreen('modeSelect');
            });
        }
        
        const customizeBtn = document.getElementById('customizeBtn');
        if (customizeBtn) {
            customizeBtn.addEventListener('click', () => {
                this.showScreen('customize');
            });
        }
        
        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.showScreen('help');
            });
        }
        
        // 返回按钮
        const backToMenuBtn = document.getElementById('backToMenuBtn');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                this.showScreen('menu');
            });
        }
        
        const backFromModeBtn = document.getElementById('backFromModeBtn');
        if (backFromModeBtn) {
            backFromModeBtn.addEventListener('click', () => {
                this.showScreen('menu');
            });
        }
        
        const backFromHelpBtn = document.getElementById('backFromHelpBtn');
        if (backFromHelpBtn) {
            backFromHelpBtn.addEventListener('click', () => {
                this.showScreen('menu');
            });
        }
        
        // 模式选择
        const soloMode = document.getElementById('soloMode');
        if (soloMode) {
            soloMode.addEventListener('click', () => {
                this.startGame('soloBattle');
            });
        }
        
        const arenaMode = document.getElementById('arenaMode');
        if (arenaMode) {
            arenaMode.addEventListener('click', () => {
                this.startGame('arena');
            });
        }
        
        const trainingMode = document.getElementById('trainingMode');
        if (trainingMode) {
            trainingMode.addEventListener('click', () => {
                this.startGame('training');
            });
        }
        
        // 暂停按钮
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                GameState.switchState('paused');
            });
        }
        
        // 暂停菜单按钮
        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                GameState.resume();
            });
        }
        
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                GameState.restart();
            });
        }
        
        const quitBtn = document.getElementById('quitBtn');
        if (quitBtn) {
            quitBtn.addEventListener('click', () => {
                GameEngine.stopGame();
                GameState.switchState('menu');
                this.showScreen('menu');
            });
        }
        
        // 游戏结束按钮
        const playAgainBtn = document.getElementById('playAgainBtn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                GameEngine.restartGame();
            });
        }
        
        const backToMenuFromGame = document.getElementById('backToMenuFromGame');
        if (backToMenuFromGame) {
            backToMenuFromGame.addEventListener('click', () => {
                GameEngine.stopGame();
                this.showScreen('menu');
            });
        }
        
        // 技能点击
        Object.entries(this.elements.skillItems).forEach(([skillId, element]) => {
            if (element) {
                element.addEventListener('click', () => {
                    this.useSkillByClick(skillId);
                });
            }
        });
    },
    
    // 监听游戏状态
    listenToGameState: function() {
        // 状态变化
        GameState.on('stateChange', (data) => {
            console.log('UI收到状态变化:', data);
            
            switch (data.newState) {
                case 'menu':
                    this.showScreen('menu');
                    break;
                    
                case 'customize':
                    this.showScreen('customize');
                    break;
                    
                case 'modeSelect':
                    this.showScreen('modeSelect');
                    break;
                    
                case 'playing':
                    this.showScreen('game');
                    this.hidePauseMenu();
                    this.hideGameOver();
                    break;
                    
                case 'paused':
                    this.showPauseMenu();
                    break;
                    
                case 'gameOver':
                    this.showGameOver(data.data);
                    break;
            }
        });
        
        // 游戏开始
        GameState.on('gameStart', (data) => {
            console.log('UI收到游戏开始事件');
            this.resetGameUI();
        });
        
        // 伤害事件
        GameState.on('damageDealt', (data) => {
            if (data.target && data.target.isPlayer) {
                // 玩家受到伤害
                this.shakeScreen();
            }
        });
        
        // 玩家死亡
        GameState.on('playerDeath', (data) => {
            console.log('玩家死亡');
        });
        
        // 敌人死亡
        GameState.on('enemyDeath', (data) => {
            console.log('敌人死亡:', data.enemy?.name);
        });
    },
    
    // 显示屏幕
    showScreen: function(screenName) {
        // 隐藏所有屏幕
        const screens = [
            this.elements.mainMenu,
            this.elements.customizeScreen,
            this.elements.modeSelectScreen,
            this.elements.gameScreen,
            this.elements.helpScreen
        ];
        
        screens.forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
            }
        });
        
        // 显示指定屏幕
        let targetScreen;
        switch (screenName) {
            case 'menu':
                targetScreen = this.elements.mainMenu;
                break;
            case 'customize':
                targetScreen = this.elements.customizeScreen;
                break;
            case 'modeSelect':
                targetScreen = this.elements.modeSelectScreen;
                break;
            case 'game':
                targetScreen = this.elements.gameScreen;
                break;
            case 'help':
                targetScreen = this.elements.helpScreen;
                break;
        }
        
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    },
    
    // 开始游戏
    startGame: function(mode) {
        console.log('UI: 开始游戏，模式:', mode);
        GameEngine.startGame(mode);
    },
    
    // 点击使用技能
    useSkillByClick: function(skillId) {
        if (GameState.currentState !== 'playing' || GameState.gameData.isPaused) {
            return;
        }
        
        if (!GameState.player || !GameState.player.isAlive) {
            return;
        }
        
        const used = SkillSystem.useSkill(
            skillId,
            GameState.player,
            GameState,
            GameEngine.renderer
        );
        
        if (used) {
            GameState.statistics.skillsUsed++;
            this.playSkillAnimation(skillId);
        }
    },
    
    // 播放技能动画
    playSkillAnimation: function(skillId) {
        const element = this.elements.skillItems[skillId];
        if (!element) return;
        
        // 添加点击反馈
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = '';
        }, 100);
    },
    
    // 更新游戏UI
    update: function() {
        if (GameState.currentState !== 'playing') return;
        if (GameState.gameData.isPaused) return;
        
        // 更新玩家状态
        this.updatePlayerStatus();
        
        // 更新技能冷却
        this.updateSkillCooldowns();
        
        // 更新敌人状态
        this.updateEnemyStatus();
        
        // 更新连击
        this.updateCombo();
    },
    
    // 更新玩家状态
    updatePlayerStatus: function() {
        const player = GameState.player;
        if (!player) return;
        
        // 生命值
        const healthPercent = player.health / player.maxHealth;
        this.animations.healthBar.target = healthPercent;
        
        // 平滑过渡
        const smoothness = GameConfig.ui.healthBarSmoothness;
        this.animations.healthBar.current += 
            (this.animations.healthBar.target - this.animations.healthBar.current) * smoothness;
        
        if (this.elements.playerHealthBar) {
            this.elements.playerHealthBar.style.width = 
                (this.animations.healthBar.current * 100) + '%';
        }
        
        if (this.elements.playerHealth) {
            this.elements.playerHealth.textContent = Math.ceil(player.health);
        }
        
        // 能量值
        const energyPercent = player.energy / player.maxEnergy;
        this.animations.energyBar.target = energyPercent;
        
        this.animations.energyBar.current +=
            (this.animations.energyBar.target - this.animations.energyBar.current) * smoothness;
        
        if (this.elements.playerEnergyBar) {
            this.elements.playerEnergyBar.style.width =
                (this.animations.energyBar.current * 100) + '%';
        }
        
        if (this.elements.playerEnergy) {
            this.elements.playerEnergy.textContent = Math.ceil(player.energy);
        }
        
        // 低血量警告颜色
        if (this.elements.playerHealthBar) {
            if (healthPercent < 0.3) {
                this.elements.playerHealthBar.style.background = 
                    'linear-gradient(90deg, #ff0000, #ff4444)';
            } else if (healthPercent < 0.5) {
                this.elements.playerHealthBar.style.background =
                    'linear-gradient(90deg, #ff8800, #ffaa00)';
            } else {
                this.elements.playerHealthBar.style.background =
                    'linear-gradient(90deg, #ff4444, #ff8844)';
            }
        }
    },
    
    // 更新技能冷却
    updateSkillCooldowns: function() {
        const player = GameState.player;
        if (!player) return;
        
        Object.entries(this.elements.skillItems).forEach(([skillId, element]) => {
            if (!element) return;
            
            // 获取冷却百分比
            const cooldownPercent = SkillSystem.getSkillCooldownPercent(skillId, player);
            
            // 找到冷却指示器
            const cooldownElement = element.querySelector('.skill-cooldown');
            if (cooldownElement) {
                cooldownElement.style.height = (cooldownPercent * 100) + '%';
            }
            
            // 更新视觉状态
            if (cooldownPercent > 0) {
                element.style.opacity = '0.6';
            } else {
                // 检查能量是否足够
                const skill = SkillSystem.skills[skillId];
                if (skill && player.energy < skill.config.energyCost) {
                    element.style.opacity = '0.4';
                } else {
                    element.style.opacity = '1';
                }
            }
        });
    },
    
    // 更新敌人状态
    updateEnemyStatus: function() {
        // 简单处理：显示第一个活着的敌人的血量
        const aliveEnemy = GameState.enemies.find(e => e.isAlive);
        
        if (aliveEnemy && this.elements.enemyHealthBar) {
            const healthPercent = aliveEnemy.health / aliveEnemy.maxHealth;
            this.animations.enemyHealthBar.target = healthPercent;
            
            const smoothness = GameConfig.ui.healthBarSmoothness;
            this.animations.enemyHealthBar.current +=
                (this.animations.enemyHealthBar.target - this.animations.enemyHealthBar.current) * smoothness;
            
            this.elements.enemyHealthBar.style.width =
                (this.animations.enemyHealthBar.current * 100) + '%';
        }
    },
    
    // 更新连击
    updateCombo: function() {
        const player = GameState.player;
        if (!player || !this.elements.comboCount) return;
        
        this.elements.comboCount.textContent = player.comboCount || 0;
        
        // 更新最大连击
        if (player.comboCount > GameState.statistics.maxCombo) {
            GameState.statistics.maxCombo = player.comboCount;
        }
    },
    
    // 显示暂停菜单
    showPauseMenu: function() {
        if (this.elements.pauseMenu) {
            this.elements.pauseMenu.classList.remove('hidden');
        }
    },
    
    // 隐藏暂停菜单
    hidePauseMenu: function() {
        if (this.elements.pauseMenu) {
            this.elements.pauseMenu.classList.add('hidden');
        }
    },
    
    // 显示游戏结束
    showGameOver: function(data) {
        if (!this.elements.gameOverScreen) return;
        
        this.elements.gameOverScreen.classList.remove('hidden');
        
        // 设置标题
        if (this.elements.gameOverTitle) {
            if (data.winner === 'player') {
                this.elements.gameOverTitle.textContent = '胜利！';
                this.elements.gameOverTitle.className = '';
                this.elements.gameOverTitle.classList.add('victory');
            } else {
                this.elements.gameOverTitle.textContent = '战败';
                this.elements.gameOverTitle.className = '';
                this.elements.gameOverTitle.classList.add('defeat');
            }
        }
        
        // 设置消息
        if (this.elements.gameOverMessage) {
            if (data.winner === 'player') {
                this.elements.gameOverMessage.textContent = '恭喜你！你击败了所有敌人！';
            } else {
                this.elements.gameOverMessage.textContent = '你的机甲被摧毁了，但不要气馁！';
            }
        }
        
        // 设置统计数据
        if (this.elements.finalKills) {
            this.elements.finalKills.textContent = GameState.statistics.kills || 0;
        }
        
        if (this.elements.finalCombo) {
            this.elements.finalCombo.textContent = GameState.statistics.maxCombo || 0;
        }
        
        if (this.elements.finalDamage) {
            this.elements.finalDamage.textContent = Math.floor(GameState.player?.totalDamageDealt || 0);
        }
    },
    
    // 隐藏游戏结束
    hideGameOver: function() {
        if (this.elements.gameOverScreen) {
            this.elements.gameOverScreen.classList.add('hidden');
        }
    },
    
    // 重置游戏UI
    resetGameUI: function() {
        // 重置动画状态
        this.animations.healthBar = { target: 1, current: 1 };
        this.animations.energyBar = { target: 1, current: 1 };
        this.animations.enemyHealthBar = { target: 1, current: 1 };
        
        // 重置UI显示
        if (this.elements.playerHealthBar) {
            this.elements.playerHealthBar.style.width = '100%';
        }
        
        if (this.elements.playerEnergyBar) {
            this.elements.playerEnergyBar.style.width = '100%';
        }
        
        if (this.elements.enemyHealthBar) {
            this.elements.enemyHealthBar.style.width = '100%';
        }
        
        if (this.elements.comboCount) {
            this.elements.comboCount.textContent = '0';
        }
        
        // 隐藏菜单
        this.hidePauseMenu();
        this.hideGameOver();
    },
    
    // 屏幕震动效果
    shakeScreen: function() {
        const gameUI = document.querySelector('.game-ui');
        if (!gameUI) return;
        
        const intensity = GameConfig.visuals.screenShakeIntensity;
        const shakeX = (Math.random() - 0.5) * intensity * 10;
        const shakeY = (Math.random() - 0.5) * intensity * 10;
        
        gameUI.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        
        setTimeout(() => {
            gameUI.style.transform = '';
        }, 50);
    },
    
    // 开始UI更新循环
    startUpdateLoop: function() {
        const updateLoop = () => {
            requestAnimationFrame(updateLoop);
            this.update();
        };
        updateLoop();
    }
};

// 导出（如果需要模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}