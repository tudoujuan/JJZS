/**
 * 游戏状态管理
 * 管理游戏的各种状态和数据
 */

const GameState = {
    // 当前游戏状态
    currentState: 'menu', // menu, customize, modeSelect, playing, paused, gameOver
    
    // 当前游戏模式
    currentMode: null,
    
    // 游戏数据
    gameData: {
        roundTime: 0,
        isPaused: false,
        isGameOver: false,
        winner: null
    },
    
    // 玩家数据
    player: null,
    
    // 敌人数据
    enemies: [],
    
    // 统计数据
    statistics: {
        kills: 0,
        deaths: 0,
        damageDealt: 0,
        damageTaken: 0,
        maxCombo: 0,
        skillsUsed: 0,
        timePlayed: 0
    },
    
    // 事件回调
    eventListeners: {
        stateChange: [],
        gameStart: [],
        gameOver: [],
        playerDeath: [],
        enemyDeath: [],
        damageDealt: [],
        comboUpdate: []
    },
    
    // 初始化
    init: function() {
        console.log('游戏状态管理器初始化');
        this.resetStatistics();
    },
    
    // 切换状态
    switchState: function(newState, data = {}) {
        const oldState = this.currentState;
        this.currentState = newState;
        
        console.log(`游戏状态切换: ${oldState} -> ${newState}`);
        
        // 触发状态变化事件
        this.triggerEvent('stateChange', {
            oldState: oldState,
            newState: newState,
            data: data
        });
        
        // 根据状态执行相应操作
        switch (newState) {
            case 'menu':
                this.onEnterMenu();
                break;
            case 'customize':
                this.onEnterCustomize();
                break;
            case 'modeSelect':
                this.onEnterModeSelect();
                break;
            case 'playing':
                this.onEnterPlaying(data);
                break;
            case 'paused':
                this.onEnterPaused();
                break;
            case 'gameOver':
                this.onEnterGameOver(data);
                break;
        }
    },
    
    // 进入菜单状态
    onEnterMenu: function() {
        // 停止游戏循环（如果正在运行）
        if (this.gameLoop) {
            // 游戏循环由GameEngine管理
        }
        
        // 清理游戏数据
        this.player = null;
        this.enemies = [];
        this.gameData.roundTime = 0;
        this.gameData.isPaused = false;
        this.gameData.isGameOver = false;
    },
    
    // 进入定制状态
    onEnterCustomize: function() {
        // 启动定制界面的渲染
        setTimeout(() => {
            CustomizeManager.startPreviewRender();
        }, 100);
    },
    
    // 进入模式选择状态
    onEnterModeSelect: function() {
        // 可以在这里准备模式选择界面
    },
    
    // 进入游戏状态
    onEnterPlaying: function(data) {
        this.currentMode = data.mode || 'soloBattle';
        this.gameData.isPaused = false;
        this.gameData.isGameOver = false;
        this.gameData.roundTime = 0;
        
        // 初始化玩家
        this.initPlayer();
        
        // 初始化敌人
        this.initEnemies();
        
        // 重置统计（但保留历史）
        this.resetRoundStatistics();
        
        // 触发游戏开始事件
        this.triggerEvent('gameStart', {
            mode: this.currentMode,
            player: this.player,
            enemies: this.enemies
        });
        
        console.log('游戏开始，模式:', this.currentMode);
    },
    
    // 进入暂停状态
    onEnterPaused: function() {
        this.gameData.isPaused = true;
    },
    
    // 进入游戏结束状态
    onEnterGameOver: function(data) {
        this.gameData.isGameOver = true;
        this.gameData.winner = data.winner || null;
        
        // 更新最终统计
        if (this.player) {
            this.statistics.kills = this.player.kills || 0;
            this.statistics.maxCombo = this.player.comboCount || 0;
            this.statistics.damageDealt = this.player.totalDamageDealt || 0;
        }
        
        // 触发游戏结束事件
        this.triggerEvent('gameOver', {
            winner: data.winner,
            statistics: this.statistics,
            playerAlive: this.player ? this.player.isAlive : false
        });
        
        console.log('游戏结束, 胜者:', data.winner);
    },
    
    // 初始化玩家
    initPlayer: function() {
        // 从定制管理器获取玩家机甲配置
        this.player = CustomizeManager.getPlayerMech();
        
        // 设置玩家初始位置
        this.player.position = new THREE.Vector3(0, 0, -50);
        this.player.rotation = 0;
        this.player.isPlayer = true;
        
        // 初始化状态
        this.player.isAlive = true;
        this.player.health = this.player.maxHealth;
        this.player.energy = this.player.maxEnergy;
        this.player.velocity = new THREE.Vector3(0, 0, 0);
        
        console.log('玩家机甲初始化:', this.player.name);
    },
    
    // 初始化敌人
    initEnemies: function() {
        this.enemies = [];
        
        const modeConfig = GameConfig.gameModes[this.currentMode];
        if (!modeConfig) return;
        
        const maxEnemies = modeConfig.maxEnemies || 1;
        
        // 可用的敌人蓝图
        const enemyBlueprints = ['striker', 'fortress', 'phantom', 'sentinel'];
        
        for (let i = 0; i < maxEnemies; i++) {
            // 随机选择蓝图
            const blueprintId = enemyBlueprints[Math.floor(Math.random() * enemyBlueprints.length)];
            
            // 创建敌人
            const enemy = MechBlueprints.createMech(blueprintId);
            
            // 设置敌人属性
            enemy.isPlayer = false;
            enemy.isAlive = true;
            enemy.health = enemy.maxHealth;
            enemy.energy = enemy.maxEnergy;
            enemy.velocity = new THREE.Vector3(0, 0, 0);
            
            // 设置敌人位置（围绕玩家）
            const angle = (i / maxEnemies) * Math.PI * 2 + Math.PI;
            const radius = 60;
            enemy.position = new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            enemy.rotation = angle + Math.PI;
            
            // 设置武器
            enemy.primaryWeapon = ['plasma_cannon', 'laser_rifle', 'missile_launcher'][Math.floor(Math.random() * 3)];
            enemy.secondaryWeapon = ['none', 'plasma_pistol', 'gatling'][Math.floor(Math.random() * 3)];
            
            // 添加AI配置
            enemy.ai = {
                state: 'idle',
                targetId: null,
                lastAttackTime: 0,
                attackCooldown: 1.5 + Math.random() * 1.0,
                dodgeTimer: 0,
                dodgeCooldown: 2.0,
                moveTimer: 0,
                moveCooldown: 1.0,
                currentMovement: {
                    direction: new THREE.Vector3(0, 0, 0),
                    duration: 0
                }
            };
            
            this.enemies.push(enemy);
            
            console.log(`敌人机甲初始化 [${i}]:`, enemy.name);
        }
    },
    
    // 更新游戏状态
    update: function(deltaTime) {
        if (this.gameData.isPaused || this.gameData.isGameOver) {
            return;
        }
        
        // 更新游戏时间
        this.gameData.roundTime += deltaTime;
        this.statistics.timePlayed += deltaTime;
        
        // 更新玩家
        if (this.player && this.player.isAlive) {
            this.updateMech(this.player, deltaTime);
        }
        
        // 更新敌人
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                this.updateMech(enemy, deltaTime);
            }
        });
        
        // 检查游戏结束条件
        this.checkGameOver();
    },
    
    // 更新机甲
    updateMech: function(mech, deltaTime) {
        if (!mech.isAlive) return;
        
        // 能量恢复
        if (mech.energy < mech.maxEnergy) {
            mech.energy = Math.min(
                mech.maxEnergy,
                mech.energy + GameConfig.mech.energyRegenRate * deltaTime
            );
        }
        
        // 更新状态效果
        this.updateStatusEffects(mech, deltaTime);
        
        // 更新技能冷却
        Object.keys(mech.skillCooldowns).forEach(skill => {
            if (mech.skillCooldowns[skill] > 0) {
                mech.skillCooldowns[skill] -= deltaTime;
                if (mech.skillCooldowns[skill] < 0) {
                    mech.skillCooldowns[skill] = 0;
                }
            }
        });
        
        // 更新连击计时器
        if (mech.comboTimer > 0) {
            mech.comboTimer -= deltaTime;
            if (mech.comboTimer <= 0) {
                mech.comboTimer = 0;
                mech.comboCount = 0;
            }
        }
        
        // 更新眩晕时间
        if (mech.stunTimer > 0) {
            mech.stunTimer -= deltaTime;
            if (mech.stunTimer <= 0) {
                mech.stunTimer = 0;
                mech.isStunned = false;
            }
        }
        
        // 更新无敌时间
        if (mech.invulnerableTimer > 0) {
            mech.invulnerableTimer -= deltaTime;
            if (mech.invulnerableTimer <= 0) {
                mech.invulnerableTimer = 0;
                mech.isInvulnerable = false;
            }
        }
    },
    
    // 更新状态效果
    updateStatusEffects: function(mech, deltaTime) {
        const toRemove = [];
        
        mech.statusEffects.forEach((effect, index) => {
            effect.duration -= deltaTime;
            
            // 应用效果
            switch (effect.type) {
                case 'attack_boost':
                    mech.attackBoostActive = true;
                    break;
                case 'defense_shield':
                    mech.isShieldActive = true;
                    break;
                case 'burst_mode':
                    mech.isBurstActive = true;
                    break;
            }
            
            if (effect.duration <= 0) {
                // 移除效果
                toRemove.push(index);
                
                // 清理状态标记
                switch (effect.type) {
                    case 'attack_boost':
                        mech.attackBoostActive = false;
                        break;
                    case 'defense_shield':
                        mech.isShieldActive = false;
                        break;
                    case 'burst_mode':
                        mech.isBurstActive = false;
                        break;
                }
            }
        });
        
        // 移除过期效果
        toRemove.sort((a, b) => b - a).forEach(index => {
            mech.statusEffects.splice(index, 1);
        });
    },
    
    // 添加状态效果
    addStatusEffect: function(mech, effectType, duration, data = {}) {
        // 检查是否已有相同类型的效果
        const existingIndex = mech.statusEffects.findIndex(e => e.type === effectType);
        
        const effect = {
            type: effectType,
            duration: duration,
            maxDuration: duration,
            data: data
        };
        
        if (existingIndex >= 0) {
            // 刷新效果
            mech.statusEffects[existingIndex] = effect;
        } else {
            // 添加新效果
            mech.statusEffects.push(effect);
        }
    },
    
    // 检查游戏结束
    checkGameOver: function() {
        const modeConfig = GameConfig.gameModes[this.currentMode];
        if (!modeConfig) return;
        
        switch (modeConfig.winCondition) {
            case 'eliminate':
                // 检查玩家是否死亡
                if (this.player && !this.player.isAlive) {
                    this.switchState('gameOver', { winner: 'enemy' });
                    return;
                }
                
                // 检查所有敌人是否死亡
                const allEnemiesDead = this.enemies.every(e => !e.isAlive);
                if (allEnemiesDead && this.enemies.length > 0) {
                    this.switchState('gameOver', { winner: 'player' });
                    return;
                }
                break;
                
            case 'survival':
                // 竞技场模式：玩家死亡则游戏结束
                if (this.player && !this.player.isAlive) {
                    this.switchState('gameOver', { winner: 'enemy' });
                    return;
                }
                break;
                
            case 'none':
                // 训练模式：永不结束
                break;
        }
        
        // 检查时间限制
        if (modeConfig.roundDuration > 0 && 
            this.gameData.roundTime >= modeConfig.roundDuration) {
            // 时间到，判断胜负
            const playerAlive = this.player && this.player.isAlive;
            const enemiesAlive = this.enemies.filter(e => e.isAlive).length;
            
            if (playerAlive && enemiesAlive === 0) {
                this.switchState('gameOver', { winner: 'player' });
            } else if (!playerAlive) {
                this.switchState('gameOver', { winner: 'enemy' });
            } else {
                // 根据剩余生命值判断
                const playerHealthPercent = this.player.health / this.player.maxHealth;
                const enemyHealthPercent = this.enemies.reduce((avg, e) => {
                    if (e.isAlive) {
                        return avg + (e.health / e.maxHealth);
                    }
                    return avg;
                }, 0) / Math.max(1, this.enemies.filter(e => e.isAlive).length);
                
                this.switchState('gameOver', {
                    winner: playerHealthPercent >= enemyHealthPercent ? 'player' : 'enemy'
                });
            }
        }
    },
    
    // 玩家受到伤害
    playerTakeDamage: function(amount, sourceId) {
        if (!this.player || !this.player.isAlive) return false;
        
        // 无敌状态
        if (this.player.isInvulnerable) return false;
        
        // 护盾减伤
        let actualDamage = amount;
        if (this.player.isShieldActive) {
            actualDamage *= 0.2; // 护盾减少80%伤害
        }
        
        // 防御力减伤
        actualDamage = Math.max(1, actualDamage - this.player.defense * 0.5);
        
        // 应用伤害
        this.player.health = Math.max(0, this.player.health - actualDamage);
        this.statistics.damageTaken += actualDamage;
        
        // 触发伤害事件
        this.triggerEvent('damageDealt', {
            target: this.player,
            amount: actualDamage,
            sourceId: sourceId
        });
        
        // 检查死亡
        if (this.player.health <= 0) {
            this.player.isAlive = false;
            this.statistics.deaths++;
            this.triggerEvent('playerDeath', { player: this.player });
        }
        
        return true;
    },
    
    // 敌人受到伤害
    enemyTakeDamage: function(enemyId, amount, sourceId) {
        const enemy = this.enemies.find(e => e.id === enemyId);
        if (!enemy || !enemy.isAlive) return false;
        
        // 无敌状态
        if (enemy.isInvulnerable) return false;
        
        // 护盾减伤
        let actualDamage = amount;
        if (enemy.isShieldActive) {
            actualDamage *= 0.2;
        }
        
        // 防御力减伤
        actualDamage = Math.max(1, actualDamage - enemy.defense * 0.5);
        
        // 应用伤害
        enemy.health = Math.max(0, enemy.health - actualDamage);
        
        // 触发伤害事件
        this.triggerEvent('damageDealt', {
            target: enemy,
            amount: actualDamage,
            sourceId: sourceId
        });
        
        // 检查死亡
        if (enemy.health <= 0) {
            enemy.isAlive = false;
            this.triggerEvent('enemyDeath', { enemy: enemy, killerId: sourceId });
            
            // 更新击杀统计
            if (sourceId === this.player.id) {
                this.player.kills++;
                this.statistics.kills++;
            }
        }
        
        return true;
    },
    
    // 事件系统
    on: function(eventName, callback) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].push(callback);
        }
    },
    
    off: function(eventName, callback) {
        if (this.eventListeners[eventName]) {
            const index = this.eventListeners[eventName].indexOf(callback);
            if (index > -1) {
                this.eventListeners[eventName].splice(index, 1);
            }
        }
    },
    
    triggerEvent: function(eventName, data) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`事件处理器错误 [${eventName}]:`, e);
                }
            });
        }
    },
    
    // 重置统计
    resetStatistics: function() {
        this.statistics = {
            kills: 0,
            deaths: 0,
            damageDealt: 0,
            damageTaken: 0,
            maxCombo: 0,
            skillsUsed: 0,
            timePlayed: 0
        };
    },
    
    // 重置回合统计
    resetRoundStatistics: function() {
        if (this.player) {
            this.player.kills = 0;
            this.player.totalDamageDealt = 0;
            this.player.comboCount = 0;
            this.player.comboTimer = 0;
        }
    },
    
    // 获取所有活跃机甲
    getAllActiveMechs: function() {
        const mechs = [];
        
        if (this.player && this.player.isAlive) {
            mechs.push(this.player);
        }
        
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                mechs.push(enemy);
            }
        });
        
        return mechs;
    },
    
    // 暂停游戏
    pause: function() {
        if (this.currentState === 'playing') {
            this.switchState('paused');
        }
    },
    
    // 继续游戏
    resume: function() {
        if (this.currentState === 'paused') {
            this.switchState('playing', { mode: this.currentMode });
        }
    },
    
    // 重新开始
    restart: function() {
        this.switchState('playing', { mode: this.currentMode });
    }
};

// 导出（如果需要模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
}