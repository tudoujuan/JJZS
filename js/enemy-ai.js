/**
 * 敌人AI系统
 * 处理敌人的行为逻辑
 */

const EnemyAI = {
    // AI状态定义
    AIStates: {
        IDLE: 'idle',
        PATROL: 'patrol',
        CHASE: 'chase',
        ATTACK: 'attack',
        RETREAT: 'retreat',
        DODGE: 'dodge'
    },
    
    // 更新所有敌人AI
    updateAll: function(gameState, deltaTime) {
        gameState.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                this.updateEnemy(enemy, gameState, deltaTime);
            }
        });
    },
    
    // 更新单个敌人AI
    updateEnemy: function(enemy, gameState, deltaTime) {
        if (!enemy.ai) {
            enemy.ai = this.createAIConfig();
        }
        
        const ai = enemy.ai;
        
        // 寻找目标
        this.findTarget(enemy, gameState);
        
        // 决策逻辑
        this.makeDecision(enemy, gameState, deltaTime);
        
        // 执行当前状态
        this.executeState(enemy, gameState, deltaTime);
    },
    
    // 创建AI配置
    createAIConfig: function() {
        return {
            state: this.AIStates.IDLE,
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
            },
            reactionTimer: 0,
            reactionTime: GameConfig.ai.reactionTime
        };
    },
    
    // 寻找目标
    findTarget: function(enemy, gameState) {
        const ai = enemy.ai;
        
        // 优先寻找玩家
        if (gameState.player && gameState.player.isAlive) {
            ai.targetId = gameState.player.id;
            return;
        }
        
        // 如果玩家死亡，寻找其他敌人（竞技场模式）
        const otherEnemies = gameState.enemies.filter(e => 
            e.id !== enemy.id && e.isAlive
        );
        
        if (otherEnemies.length > 0) {
            // 选择最近的敌人
            let closestEnemy = null;
            let closestDistance = Infinity;
            
            otherEnemies.forEach(e => {
                const distance = this.getDistance(enemy, e);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = e;
                }
            });
            
            if (closestEnemy) {
                ai.targetId = closestEnemy.id;
            }
        }
    },
    
    // 获取目标
    getTarget: function(enemy, gameState) {
        const ai = enemy.ai;
        
        if (!ai.targetId) return null;
        
        // 检查是否是玩家
        if (gameState.player && gameState.player.id === ai.targetId) {
            return gameState.player;
        }
        
        // 检查是否是敌人
        return gameState.enemies.find(e => e.id === ai.targetId && e.isAlive);
    },
    
    // 决策逻辑
    makeDecision: function(enemy, gameState, deltaTime) {
        const ai = enemy.ai;
        const target = this.getTarget(enemy, gameState);
        
        // 如果没有目标，进入巡逻状态
        if (!target) {
            ai.state = this.AIStates.PATROL;
            return;
        }
        
        const distance = this.getDistance(enemy, target);
        const healthPercent = enemy.health / enemy.maxHealth;
        
        // 反应时间延迟
        if (ai.reactionTimer > 0) {
            ai.reactionTimer -= deltaTime;
            return;
        }
        
        // 低血量时撤退
        if (healthPercent < GameConfig.ai.retreatHealthThreshold) {
            if (Math.random() < 0.7) {
                ai.state = this.AIStates.RETREAT;
                ai.reactionTimer = ai.reactionTime;
                return;
            }
        }
        
        // 根据距离决定行为
        if (distance > GameConfig.ai.attackRange * 1.5) {
            // 距离太远，追逐
            ai.state = this.AIStates.CHASE;
        } else if (distance > GameConfig.ai.preferredDistance) {
            // 在攻击范围内但距离较远，攻击
            ai.state = this.AIStates.ATTACK;
        } else {
            // 距离很近，决定是攻击还是闪避
            if (Math.random() < GameConfig.ai.dodgeChance && 
                ai.dodgeTimer <= 0 && 
                ai.state !== this.AIStates.DODGE) {
                ai.state = this.AIStates.DODGE;
                ai.dodgeTimer = ai.dodgeCooldown;
            } else {
                ai.state = this.AIStates.ATTACK;
            }
        }
    },
    
    // 执行当前状态
    executeState: function(enemy, gameState, deltaTime) {
        const ai = enemy.ai;
        
        switch (ai.state) {
            case this.AIStates.IDLE:
                this.executeIdle(enemy, gameState, deltaTime);
                break;
                
            case this.AIStates.PATROL:
                this.executePatrol(enemy, gameState, deltaTime);
                break;
                
            case this.AIStates.CHASE:
                this.executeChase(enemy, gameState, deltaTime);
                break;
                
            case this.AIStates.ATTACK:
                this.executeAttack(enemy, gameState, deltaTime);
                break;
                
            case this.AIStates.RETREAT:
                this.executeRetreat(enemy, gameState, deltaTime);
                break;
                
            case this.AIStates.DODGE:
                this.executeDodge(enemy, gameState, deltaTime);
                break;
        }
        
        // 更新计时器
        if (ai.dodgeTimer > 0) {
            ai.dodgeTimer -= deltaTime;
        }
        if (ai.moveTimer > 0) {
            ai.moveTimer -= deltaTime;
        }
    },
    
    // 执行闲置状态
    executeIdle: function(enemy, gameState, deltaTime) {
        // 随机转向
        enemy.isMoving = false;
    },
    
    // 执行巡逻状态
    executePatrol: function(enemy, gameState, deltaTime) {
        const ai = enemy.ai;
        
        // 随机移动
        if (ai.currentMovement.duration <= 0 || ai.moveTimer <= 0) {
            // 选择新的移动方向
            const angle = Math.random() * Math.PI * 2;
            ai.currentMovement.direction.set(
                Math.cos(angle),
                0,
                Math.sin(angle)
            ).normalize();
            ai.currentMovement.duration = 2 + Math.random() * 3;
            ai.moveTimer = ai.moveCooldown;
        }
        
        // 移动
        this.moveEnemy(enemy, ai.currentMovement.direction, deltaTime);
        ai.currentMovement.duration -= deltaTime;
    },
    
    // 执行追逐状态
    executeChase: function(enemy, gameState, deltaTime) {
        const ai = enemy.ai;
        const target = this.getTarget(enemy, gameState);
        
        if (!target) {
            ai.state = this.AIStates.PATROL;
            return;
        }
        
        // 向目标移动
        const direction = this.getDirectionToTarget(enemy, target);
        this.moveEnemy(enemy, direction, deltaTime);
        
        // 面向目标
        this.lookAtTarget(enemy, target);
    },
    
    // 执行攻击状态
    executeAttack: function(enemy, gameState, deltaTime) {
        const ai = enemy.ai;
        const target = this.getTarget(enemy, gameState);
        
        if (!target) {
            ai.state = this.AIStates.PATROL;
            return;
        }
        
        const distance = this.getDistance(enemy, target);
        
        // 保持适当距离
        const preferredDistance = GameConfig.ai.preferredDistance;
        if (distance < preferredDistance * 0.8) {
            // 太近，后退
            const direction = this.getDirectionToTarget(enemy, target).multiplyScalar(-1);
            this.moveEnemy(enemy, direction, deltaTime);
        } else if (distance > preferredDistance * 1.2) {
            // 太远，前进
            const direction = this.getDirectionToTarget(enemy, target);
            this.moveEnemy(enemy, direction, deltaTime);
        } else {
            // 距离合适，停止移动
            enemy.isMoving = false;
        }
        
        // 面向目标
        this.lookAtTarget(enemy, target);
        
        // 尝试攻击
        if (ai.lastAttackTime + ai.attackCooldown < gameState.gameData.roundTime) {
            // 有几率使用技能
            if (Math.random() < GameConfig.ai.skillUsageChance) {
                this.tryUseSkill(enemy, gameState);
            }
            
            // 普通攻击
            this.attackTarget(enemy, target, gameState);
            ai.lastAttackTime = gameState.gameData.roundTime;
        }
    },
    
    // 执行撤退状态
    executeRetreat: function(enemy, gameState, deltaTime) {
        const ai = enemy.ai;
        const target = this.getTarget(enemy, gameState);
        
        if (!target) {
            ai.state = this.AIStates.PATROL;
            return;
        }
        
        // 向反方向移动
        const direction = this.getDirectionToTarget(enemy, target).multiplyScalar(-1);
        this.moveEnemy(enemy, direction, deltaTime, true);
        
        // 有机会使用防御技能
        if (Math.random() < 0.1) {
            if (SkillSystem.canUseSkill('skill2', enemy)) {
                SkillSystem.useSkill('skill2', enemy, gameState, null);
            }
        }
    },
    
    // 执行闪避状态
    executeDodge: function(enemy, gameState, deltaTime) {
        const ai = enemy.ai;
        const target = this.getTarget(enemy, gameState);
        
        if (ai.currentMovement.duration <= 0) {
            // 选择闪避方向
            let dodgeDirection;
            
            if (target) {
                // 垂直于目标方向闪避
                const toTarget = this.getDirectionToTarget(enemy, target);
                // 随机选择左右
                const side = Math.random() < 0.5 ? 1 : -1;
                dodgeDirection = new THREE.Vector3(
                    -toTarget.z * side,
                    0,
                    toTarget.x * side
                ).normalize();
            } else {
                // 随机方向
                const angle = Math.random() * Math.PI * 2;
                dodgeDirection = new THREE.Vector3(
                    Math.cos(angle),
                    0,
                    Math.sin(angle)
                ).normalize();
            }
            
            ai.currentMovement.direction = dodgeDirection;
            ai.currentMovement.duration = 0.5; // 闪避持续时间
        }
        
        // 快速移动
        this.moveEnemy(enemy, ai.currentMovement.direction, deltaTime, true);
        ai.currentMovement.duration -= deltaTime;
        
        if (ai.currentMovement.duration <= 0) {
            ai.state = this.AIStates.ATTACK;
        }
    },
    
    // 移动敌人
    moveEnemy: function(enemy, direction, deltaTime, isBoost = false) {
        if (!enemy.position || !direction) return;
        
        // 计算速度
        let speed = SkillSystem.calculateSpeed(enemy.speed, enemy);
        if (isBoost) {
            speed *= GameConfig.mech.boostSpeedMultiplier;
        }
        
        // 应用移动
        const moveDistance = speed * deltaTime;
        enemy.position.x += direction.x * moveDistance;
        enemy.position.z += direction.z * moveDistance;
        
        // 限制在边界内
        const boundary = GameConfig.physics.boundarSize;
        enemy.position.x = Math.max(-boundary, Math.min(boundary, enemy.position.x));
        enemy.position.z = Math.max(-boundary, Math.min(boundary, enemy.position.z));
        
        // 标记为移动中（用于动画）
        enemy.isMoving = true;
    },
    
    // 面向目标
    lookAtTarget: function(enemy, target) {
        if (!enemy.position || !target.position) return;
        
        const dx = target.position.x - enemy.position.x;
        const dz = target.position.z - enemy.position.z;
        
        enemy.rotation = Math.atan2(dx, dz);
    },
    
    // 获取与目标的距离
    getDistance: function(enemy, target) {
        if (!enemy.position || !target.position) return Infinity;
        return enemy.position.distanceTo(target.position);
    },
    
    // 获取指向目标的方向
    getDirectionToTarget: function(enemy, target) {
        if (!enemy.position || !target.position) {
            return new THREE.Vector3(0, 0, 1);
        }
        
        return target.position.clone()
            .sub(enemy.position)
            .setY(0)
            .normalize();
    },
    
    // 攻击目标
    attackTarget: function(enemy, target, gameState) {
        if (!target || !target.isAlive) return;
        
        const currentTime = Date.now();
        
        // 使用主武器攻击
        const primaryWeapon = enemy.primaryWeapon;
        if (primaryWeapon && primaryWeapon !== 'none') {
            // 检查武器是否就绪
            const weaponState = WeaponSystem.getWeaponState(primaryWeapon, enemy.id);
            if (weaponState && weaponState.isReady) {
                // 检查能量
                if (enemy.energy >= weaponState.config.energyCost) {
                    // 计算准确度
                    const accuracy = GameConfig.ai.accuracy;
                    const hitRoll = Math.random();
                    
                    if (hitRoll < accuracy) {
                        // 命中 - 对玩家造成伤害
                        if (target.isPlayer) {
                            const damage = SkillSystem.calculateDamage(
                                weaponState.config.damage,
                                enemy
                            );
                            gameState.playerTakeDamage(damage, enemy.id);
                        } else {
                            // 对其他敌人造成伤害
                            gameState.enemyTakeDamage(target.id, 
                                SkillSystem.calculateDamage(weaponState.config.damage, enemy),
                                enemy.id
                            );
                        }
                        
                        // 消耗能量和设置冷却
                        enemy.energy -= weaponState.config.energyCost;
                        weaponState.isReady = false;
                        weaponState.cooldownTimer = weaponState.config.cooldown;
                    } else {
                        // 未命中 - 消耗较少能量
                        enemy.energy -= Math.floor(weaponState.config.energyCost * 0.3);
                    }
                }
            }
        }
        
        // 有几率使用副武器
        if (Math.random() < 0.3) {
            const secondaryWeapon = enemy.secondaryWeapon;
            if (secondaryWeapon && secondaryWeapon !== 'none') {
                const weaponState = WeaponSystem.getWeaponState(secondaryWeapon, enemy.id);
                if (weaponState && weaponState.isReady && 
                    enemy.energy >= weaponState.config.energyCost) {
                    
                    const accuracy = GameConfig.ai.accuracy * 0.9;
                    const hitRoll = Math.random();
                    
                    if (hitRoll < accuracy) {
                        if (target.isPlayer) {
                            gameState.playerTakeDamage(
                                SkillSystem.calculateDamage(weaponState.config.damage, enemy),
                                enemy.id
                            );
                        } else {
                            gameState.enemyTakeDamage(target.id,
                                SkillSystem.calculateDamage(weaponState.config.damage, enemy),
                                enemy.id
                            );
                        }
                    }
                    
                    enemy.energy -= weaponState.config.energyCost;
                    weaponState.isReady = false;
                    weaponState.cooldownTimer = weaponState.config.cooldown;
                }
            }
        }
    },
    
    // 尝试使用技能
    tryUseSkill: function(enemy, gameState) {
        const healthPercent = enemy.health / enemy.maxHealth;
        
        // 根据情况选择技能
        let skillToUse = null;
        
        if (healthPercent < 0.5) {
            // 低血量时优先使用防御技能
            if (SkillSystem.canUseSkill('skill2', enemy)) {
                skillToUse = 'skill2';
            } else if (SkillSystem.canUseSkill('skill3', enemy)) {
                skillToUse = 'skill3';
            }
        } else {
            // 高血量时优先使用攻击技能
            if (SkillSystem.canUseSkill('skill1', enemy)) {
                skillToUse = 'skill1';
            } else if (SkillSystem.canUseSkill('skill4', enemy)) {
                // 检查是否有多个目标在范围内
                const targets = this.getTargetsInRange(enemy, gameState, 20);
                if (targets.length >= 1) {
                    skillToUse = 'skill4';
                }
            }
        }
        
        if (skillToUse) {
            SkillSystem.useSkill(skillToUse, enemy, gameState, null);
            return true;
        }
        
        return false;
    },
    
    // 获取范围内的所有目标
    getTargetsInRange: function(enemy, gameState, range) {
        const targets = [];
        
        // 检查玩家
        if (gameState.player && gameState.player.isAlive) {
            const distance = this.getDistance(enemy, gameState.player);
            if (distance <= range) {
                targets.push(gameState.player);
            }
        }
        
        // 检查其他敌人
        gameState.enemies.forEach(e => {
            if (e.id !== enemy.id && e.isAlive) {
                const distance = this.getDistance(enemy, e);
                if (distance <= range) {
                    targets.push(e);
                }
            }
        });
        
        return targets;
    }
};

// 导出（如果需要模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnemyAI;
}