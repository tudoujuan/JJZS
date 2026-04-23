/**
 * 游戏引擎
 * 管理游戏的主循环和核心逻辑
 */

const GameEngine = {
    // 游戏状态
    isRunning: false,
    isPaused: false,
    
    // 时间管理
    lastTime: 0,
    deltaTime: 0,
    fixedTimeStep: 1/60,
    accumulator: 0,
    
    // 渲染器引用
    renderer: null,
    
    // 输入状态
    inputState: {
        keys: {},
        mouse: {
            x: 0,
            y: 0,
            isDown: false,
            isRightDown: false
        }
    },
    
    // 初始化
    init: function() {
        console.log('游戏引擎初始化');
        
        // 绑定输入事件
        this.bindInputEvents();
        
        // 初始化游戏状态
        GameState.init();
        
        // 初始化定制管理器
        CustomizeManager.init();
    },
    
    // 绑定输入事件
    bindInputEvents: function() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.inputState.keys[e.keyCode] = true;
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.inputState.keys[e.keyCode] = false;
            this.handleKeyUp(e);
        });
        
        // 鼠标事件
        document.addEventListener('mousemove', (e) => {
            this.inputState.mouse.x = e.clientX;
            this.inputState.mouse.y = e.clientY;
            this.handleMouseMove(e);
        });
        
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.inputState.mouse.isDown = true;
            } else if (e.button === 2) {
                this.inputState.mouse.isRightDown = true;
            }
            this.handleMouseDown(e);
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.inputState.mouse.isDown = false;
            } else if (e.button === 2) {
                this.inputState.mouse.isRightDown = false;
            }
            this.handleMouseUp(e);
        });
        
        // 右键菜单禁用
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // 窗口失焦
        window.addEventListener('blur', () => {
            this.inputState.keys = {};
            this.inputState.mouse.isDown = false;
            this.inputState.mouse.isRightDown = false;
        });
    },
    
    // 处理按键按下
    handleKeyDown: function(e) {
        // 游戏中的技能按键
        if (GameState.currentState === 'playing' && !GameState.gameData.isPaused) {
            const skillId = SkillSystem.getSkillIdByKeyCode(e.keyCode);
            if (skillId && GameState.player) {
                const used = SkillSystem.useSkill(
                    skillId,
                    GameState.player,
                    GameState,
                    this.renderer
                );
                
                if (used) {
                    GameState.statistics.skillsUsed++;
                }
            }
            
            // 暂停键
            if (e.keyCode === GameConfig.input.pause) {
                GameState.switchState('paused');
            }
        }
        
        // 暂停菜单中的按键
        if (GameState.currentState === 'paused') {
            if (e.keyCode === GameConfig.input.pause) {
                GameState.resume();
            }
        }
    },
    
    // 处理按键释放
    handleKeyUp: function(e) {
        // 可以在这里处理按键释放事件
    },
    
    // 处理鼠标移动
    handleMouseMove: function(e) {
        if (GameState.currentState === 'playing' && this.renderer) {
            // 更新玩家朝向
            if (GameState.player && GameState.player.isAlive) {
                this.updatePlayerRotation(e);
            }
        }
    },
    
    // 处理鼠标按下
    handleMouseDown: function(e) {
        if (GameState.currentState === 'playing' && 
            !GameState.gameData.isPaused &&
            GameState.player &&
            GameState.player.isAlive) {
            
            // 左键攻击
            if (e.button === 0) {
                this.playerAttack();
            }
        }
    },
    
    // 处理鼠标释放
    handleMouseUp: function(e) {
        // 可以在这里处理鼠标释放事件
    },
    
    // 更新玩家朝向
    updatePlayerRotation: function(e) {
        if (!this.renderer || !this.renderer.camera || !GameState.player) return;
        
        const player = GameState.player;
        const camera = this.renderer.camera;
        
        // 获取鼠标在屏幕上的位置
        const mouse = new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
        );
        
        // 创建射线
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        
        // 与地面平面相交
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        
        raycaster.ray.intersectPlane(groundPlane, intersectPoint);
        
        if (intersectPoint) {
            // 计算朝向
            const playerPos = player.position || new THREE.Vector3(0, 0, 0);
            const dx = intersectPoint.x - playerPos.x;
            const dz = intersectPoint.z - playerPos.z;
            
            player.rotation = Math.atan2(dx, dz);
            
            // 保存目标位置用于攻击
            player.targetPosition = intersectPoint;
        }
    },
    
    // 玩家攻击
    playerAttack: function() {
        const player = GameState.player;
        if (!player || !player.isAlive) return;
        
        // 使用主武器
        const primaryWeapon = player.primaryWeapon;
        if (primaryWeapon && primaryWeapon !== 'none') {
            const canFire = WeaponSystem.canFire(
                primaryWeapon,
                player.id,
                player
            );
            
            if (canFire && this.renderer) {
                // 计算攻击目标位置
                let targetPosition;
                if (player.targetPosition) {
                    targetPosition = player.targetPosition.clone();
                } else {
                    // 默认朝向正前方
                    const forward = new THREE.Vector3(
                        Math.sin(player.rotation || 0),
                        0,
                        Math.cos(player.rotation || 0)
                    );
                    targetPosition = (player.position || new THREE.Vector3(0, 0, 0))
                        .clone()
                        .add(forward.multiplyScalar(50));
                }
                
                // 发射武器
                const projectiles = WeaponSystem.fire(
                    primaryWeapon,
                    player.id,
                    player,
                    targetPosition,
                    this.renderer.scene,
                    this.renderer.projectileManager
                );
                
                if (projectiles) {
                    // 攻击成功的视觉反馈
                }
            }
        }
        
        // 检查是否需要使用副武器（如果主武器冷却中）
        const secondaryWeapon = player.secondaryWeapon;
        if (secondaryWeapon && secondaryWeapon !== 'none') {
            const primaryState = WeaponSystem.getWeaponState(primaryWeapon, player.id);
            if (!primaryState || !primaryState.isReady) {
                const canFireSecondary = WeaponSystem.canFire(
                    secondaryWeapon,
                    player.id,
                    player
                );
                
                if (canFireSecondary && this.renderer) {
                    let targetPosition;
                    if (player.targetPosition) {
                        targetPosition = player.targetPosition.clone();
                    } else {
                        const forward = new THREE.Vector3(
                            Math.sin(player.rotation || 0),
                            0,
                            Math.cos(player.rotation || 0)
                        );
                        targetPosition = (player.position || new THREE.Vector3(0, 0, 0))
                            .clone()
                            .add(forward.multiplyScalar(50));
                    }
                    
                    WeaponSystem.fire(
                        secondaryWeapon,
                        player.id,
                        player,
                        targetPosition,
                        this.renderer.scene,
                        this.renderer.projectileManager
                    );
                }
            }
        }
    },
    
    // 启动游戏
    startGame: function(mode) {
        console.log('启动游戏，模式:', mode);
        
        // 初始化渲染器
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('无法找到游戏画布');
            return;
        }
        
        // 初始化渲染器
        if (!this.renderer) {
            this.renderer = new ThreeDRenderer();
        }
        this.renderer.init(canvas, false);
        
        // 切换游戏状态
        GameState.switchState('playing', { mode: mode });
        
        // 创建玩家模型
        if (GameState.player) {
            this.renderer.createMechModel(GameState.player);
            
            // 添加武器模型
            const playerGroup = this.renderer.findMechGroupById(GameState.player.id);
            if (playerGroup) {
                const rightMount = playerGroup.getObjectByName('WeaponMount_Right');
                const leftMount = playerGroup.getObjectByName('WeaponMount_Left');
                
                if (rightMount) {
                    this.renderer.createWeaponModel(GameState.player.primaryWeapon, rightMount);
                }
                
                if (leftMount && GameState.player.secondaryWeapon !== 'none') {
                    this.renderer.createWeaponModel(GameState.player.secondaryWeapon, leftMount);
                }
            }
            
            // 设置相机跟随玩家
            this.renderer.setCameraTarget(
                GameState.player.position || new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 15, 25)
            );
        }
        
        // 创建敌人模型
        GameState.enemies.forEach(enemy => {
            this.renderer.createMechModel(enemy);
            
            const enemyGroup = this.renderer.findMechGroupById(enemy.id);
            if (enemyGroup) {
                const rightMount = enemyGroup.getObjectByName('WeaponMount_Right');
                if (rightMount) {
                    this.renderer.createWeaponModel(enemy.primaryWeapon, rightMount);
                }
            }
        });
        
        // 启动游戏循环
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.gameLoop();
    },
    
    // 游戏主循环
    gameLoop: function() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.gameLoop());
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 限制最大deltaTime
        if (this.deltaTime > 0.1) {
            this.deltaTime = 0.1;
        }
        
        // 固定时间步长更新
        if (!this.isPaused && GameState.currentState === 'playing') {
            this.accumulator += this.deltaTime;
            
            while (this.accumulator >= this.fixedTimeStep) {
                this.fixedUpdate(this.fixedTimeStep);
                this.accumulator -= this.fixedTimeStep;
            }
            
            // 更新游戏状态
            GameState.update(this.deltaTime);
            
            // 更新敌人AI
            EnemyAI.updateAll(GameState, this.deltaTime);
            
            // 更新武器系统
            WeaponSystem.update(this.deltaTime);
            
            // 处理玩家输入
            this.handlePlayerInput(this.deltaTime);
            
            // 更新渲染器
            if (this.renderer) {
                // 更新相机目标（跟随玩家）
                if (GameState.player && GameState.player.isAlive) {
                    this.renderer.setCameraTarget(GameState.player.position);
                }
                
                this.renderer.update(this.deltaTime, GameState.getAllActiveMechs());
            }
        }
        
        // 渲染
        if (this.renderer) {
            this.renderer.render();
        }
    },
    
    // 固定时间步更新（物理等）
    fixedUpdate: function(deltaTime) {
        // 更新玩家物理
        if (GameState.player && GameState.player.isAlive) {
            this.updateMechPhysics(GameState.player, deltaTime);
        }
        
        // 更新敌人物理
        GameState.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                this.updateMechPhysics(enemy, deltaTime);
            }
        });
    },
    
    // 更新机甲物理
    updateMechPhysics: function(mech, deltaTime) {
        if (!mech.position || !mech.velocity) return;
        
        // 应用摩擦力
        mech.velocity.multiplyScalar(GameConfig.physics.friction);
        
        // 限制最大速度
        const speed = mech.velocity.length();
        if (speed > GameConfig.physics.maxVelocity) {
            mech.velocity.normalize().multiplyScalar(GameConfig.physics.maxVelocity);
        }
        
        // 应用速度
        mech.position.add(mech.velocity.clone().multiplyScalar(deltaTime));
        
        // 限制在边界内
        const boundary = GameConfig.physics.boundarSize;
        mech.position.x = Math.max(-boundary, Math.min(boundary, mech.position.x));
        mech.position.z = Math.max(-boundary, Math.min(boundary, mech.position.z));
        
        // 边界碰撞反弹
        if (Math.abs(mech.position.x) >= boundary) {
            mech.velocity.x *= -0.5;
        }
        if (Math.abs(mech.position.z) >= boundary) {
            mech.velocity.z *= -0.5;
        }
    },
    
    // 处理玩家输入
    handlePlayerInput: function(deltaTime) {
        const player = GameState.player;
        if (!player || !player.isAlive || player.isStunned) return;
        
        // 计算移动方向
        let moveX = 0;
        let moveZ = 0;
        
        if (this.inputState.keys[GameConfig.input.moveForward]) {
            moveZ -= 1;
        }
        if (this.inputState.keys[GameConfig.input.moveBackward]) {
            moveZ += 1;
        }
        if (this.inputState.keys[GameConfig.input.moveLeft]) {
            moveX -= 1;
        }
        if (this.inputState.keys[GameConfig.input.moveRight]) {
            moveX += 1;
        }
        
        // 归一化移动方向
        const moveLength = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (moveLength > 0) {
            moveX /= moveLength;
            moveZ /= moveLength;
            
            // 计算实际速度
            let speed = SkillSystem.calculateSpeed(player.speed, player);
            
            // 加速
            player.isBoosting = this.inputState.keys[GameConfig.input.boost];
            if (player.isBoosting && player.energy > 0) {
                speed *= GameConfig.mech.boostSpeedMultiplier;
                player.energy = Math.max(0, player.energy - 5 * deltaTime);
            }
            
            // 应用移动
            const moveDistance = speed * deltaTime;
            
            // 应用到位置
            if (!player.position) {
                player.position = new THREE.Vector3(0, 0, 0);
            }
            
            player.position.x += moveX * moveDistance;
            player.position.z += moveZ * moveDistance;
            
            // 标记为移动中
            player.isMoving = true;
            
            // 限制在边界内
            const boundary = GameConfig.physics.boundarSize;
            player.position.x = Math.max(-boundary, Math.min(boundary, player.position.x));
            player.position.z = Math.max(-boundary, Math.min(boundary, player.position.z));
        } else {
            player.isMoving = false;
        }
        
        // 持续攻击（按住鼠标）
        if (this.inputState.mouse.isDown) {
            this.playerAttack();
        }
    },
    
    // 暂停游戏
    pause: function() {
        this.isPaused = true;
        GameState.pause();
    },
    
    // 继续游戏
    resume: function() {
        this.isPaused = false;
        GameState.resume();
        this.lastTime = performance.now();
    },
    
    // 停止游戏
    stopGame: function() {
        this.isRunning = false;
        this.isPaused = false;
        
        // 清理渲染器
        if (this.renderer) {
            this.renderer.clear();
        }
        
        // 清理武器系统
        WeaponSystem.reset();
    },
    
    // 重新开始游戏
    restartGame: function() {
        this.stopGame();
        
        if (GameState.currentMode) {
            this.startGame(GameState.currentMode);
        }
    }
};

// 导出（如果需要模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameEngine;
}