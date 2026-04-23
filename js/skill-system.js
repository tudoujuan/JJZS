/**
 * 技能系统
 * 处理机甲的技能释放和效果
 */

const SkillSystem = {
    // 技能定义
    skills: {
        skill1: {
            id: 'skill1',
            name: '攻击强化',
            icon: '⚔',
            keyCode: 81, // Q
            config: GameConfig.skills.attackBoost,
            cooldownKey: 'skill1',
            canUse: function(mech) {
                return mech.energy >= this.config.energyCost &&
                       mech.skillCooldowns[this.cooldownKey] <= 0 &&
                       !mech.isStunned;
            },
            use: function(mech, gameState, renderer) {
                if (!this.canUse(mech)) return false;
                
                // 消耗能量
                mech.energy -= this.config.energyCost;
                
                // 设置冷却
                mech.skillCooldowns[this.cooldownKey] = this.config.cooldown;
                
                // 添加状态效果
                GameState.addStatusEffect(mech, 'attack_boost', this.config.duration, {
                    damageMultiplier: this.config.damageMultiplier,
                    speedMultiplier: this.config.speedMultiplier
                });
                
                // 播放效果
                this.playSkillEffect(mech, renderer, 0x00ff00);
                
                console.log('释放技能: 攻击强化');
                return true;
            }
        },
        
        skill2: {
            id: 'skill2',
            name: '防御护盾',
            icon: '🛡',
            keyCode: 87, // W
            config: GameConfig.skills.defenseShield,
            cooldownKey: 'skill2',
            canUse: function(mech) {
                return mech.energy >= this.config.energyCost &&
                       mech.skillCooldowns[this.cooldownKey] <= 0 &&
                       !mech.isStunned;
            },
            use: function(mech, gameState, renderer) {
                if (!this.canUse(mech)) return false;
                
                // 消耗能量
                mech.energy -= this.config.energyCost;
                
                // 设置冷却
                mech.skillCooldowns[this.cooldownKey] = this.config.cooldown;
                
                // 添加状态效果
                GameState.addStatusEffect(mech, 'defense_shield', this.config.duration, {
                    damageReduction: this.config.damageReduction,
                    shieldHealth: this.config.shieldHealth
                });
                
                // 激活护盾视觉效果
                mech.isShieldActive = true;
                
                // 播放效果
                this.playSkillEffect(mech, renderer, 0x00aaff);
                
                console.log('释放技能: 防御护盾');
                return true;
            }
        },
        
        skill3: {
            id: 'skill3',
            name: '爆气状态',
            icon: '🔥',
            keyCode: 69, // E
            config: GameConfig.skills.burstMode,
            cooldownKey: 'skill3',
            canUse: function(mech) {
                return mech.energy >= this.config.energyCost &&
                       mech.skillCooldowns[this.cooldownKey] <= 0 &&
                       !mech.isStunned;
            },
            use: function(mech, gameState, renderer) {
                if (!this.canUse(mech)) return false;
                
                // 消耗能量
                mech.energy -= this.config.energyCost;
                
                // 设置冷却
                mech.skillCooldowns[this.cooldownKey] = this.config.cooldown;
                
                // 添加状态效果
                GameState.addStatusEffect(mech, 'burst_mode', this.config.duration, {
                    attackMultiplier: this.config.attackMultiplier,
                    defenseMultiplier: this.config.defenseMultiplier,
                    speedMultiplier: this.config.speedMultiplier
                });
                
                // 激活爆气视觉效果
                mech.isBurstActive = true;
                
                // 播放效果
                this.playSkillEffect(mech, renderer, 0xff6600);
                
                console.log('释放技能: 爆气状态');
                return true;
            }
        },
        
        skill4: {
            id: 'skill4',
            name: '终极必杀',
            icon: '💥',
            keyCode: 82, // R
            config: GameConfig.skills.ultimateAbility,
            cooldownKey: 'skill4',
            canUse: function(mech) {
                return mech.energy >= this.config.energyCost &&
                       mech.skillCooldowns[this.cooldownKey] <= 0 &&
                       !mech.isStunned;
            },
            use: function(mech, gameState, renderer) {
                if (!this.canUse(mech)) return false;
                
                // 消耗能量
                mech.energy -= this.config.energyCost;
                
                // 设置冷却
                mech.skillCooldowns[this.cooldownKey] = this.config.cooldown;
                
                // 对范围内所有敌人造成伤害
                const mechPosition = mech.position || new THREE.Vector3(0, 0, 0);
                const radius = this.config.radius;
                const damage = this.config.damage;
                
                // 获取所有敌人
                const enemies = gameState.enemies || [];
                
                enemies.forEach(enemy => {
                    if (!enemy.isAlive) return;
                    
                    const enemyPosition = enemy.position || new THREE.Vector3(0, 0, 0);
                    const distance = mechPosition.distanceTo(enemyPosition);
                    
                    if (distance <= radius) {
                        // 距离衰减伤害
                        const distanceRatio = 1 - (distance / radius) * 0.5;
                        const actualDamage = Math.round(damage * distanceRatio);
                        
                        // 应用伤害
                        if (mech.isPlayer) {
                            // 玩家对敌人造成伤害
                            gameState.enemyTakeDamage(enemy.id, actualDamage, mech.id);
                        } else {
                            // 敌人对玩家造成伤害
                            if (gameState.player && gameState.player.isAlive) {
                                const playerPos = gameState.player.position || new THREE.Vector3(0, 0, 0);
                                if (mechPosition.distanceTo(playerPos) <= radius) {
                                    gameState.playerTakeDamage(actualDamage, mech.id);
                                }
                            }
                        }
                        
                        // 添加击退效果
                        const knockback = this.config.knockback;
                        if (knockback > 0 && enemy.velocity) {
                            const direction = enemyPosition.clone().sub(mechPosition).normalize();
                            enemy.velocity.add(direction.multiplyScalar(knockback));
                        }
                    }
                });
                
                // 播放大爆炸效果
                this.playUltimateEffect(mech, renderer, radius);
                
                console.log('释放技能: 终极必杀');
                return true;
            }
        },
        
        special: {
            id: 'special',
            name: '特殊能力',
            icon: '⭐',
            keyCode: null,
            cooldownKey: 'special',
            canUse: function(mech) {
                // 检查机甲的特殊能力冷却
                if (!mech.specialAbility) return false;
                
                return mech.skillCooldowns[this.cooldownKey] <= 0 &&
                       !mech.isStunned;
            },
            use: function(mech, gameState, renderer) {
                if (!this.canUse(mech)) return false;
                
                // 设置冷却
                if (mech.specialAbility) {
                    mech.skillCooldowns[this.cooldownKey] = mech.specialAbility.cooldown;
                }
                
                // 根据蓝图类型应用不同的特殊能力
                const blueprintId = mech.blueprintId;
                
                switch (blueprintId) {
                    case 'default':
                    case 'sentinel':
                        // 平衡强化：全属性提升
                        GameState.addStatusEffect(mech, 'balanced_boost', 10, {
                            attackMultiplier: 1.2,
                            defenseMultiplier: 1.2,
                            speedMultiplier: 1.1
                        });
                        this.playSkillEffect(mech, renderer, 0xffff00);
                        break;
                        
                    case 'striker':
                        // 极速突袭：大幅提升速度和攻击速度
                        GameState.addStatusEffect(mech, 'speed_boost', 8, {
                            speedMultiplier: 2.0,
                            attackSpeedMultiplier: 1.5
                        });
                        this.playSkillEffect(mech, renderer, 0xff4444);
                        break;
                        
                    case 'fortress':
                        // 铁壁防御：大幅提升防御
                        GameState.addStatusEffect(mech, 'defense_boost', 12, {
                            defenseMultiplier: 3.0
                        });
                        mech.isShieldActive = true;
                        setTimeout(() => {
                            mech.isShieldActive = false;
                        }, 12000);
                        this.playSkillEffect(mech, renderer, 0x44ff44);
                        break;
                        
                    case 'phantom':
                        // 相位瞬移：短暂无敌并提升速度
                        mech.isInvulnerable = true;
                        mech.invulnerableTimer = 5;
                        GameState.addStatusEffect(mech, 'phase_boost', 5, {
                            speedMultiplier: 2.5
                        });
                        this.playSkillEffect(mech, renderer, 0xaa44ff);
                        break;
                }
                
                console.log(`释放特殊能力: ${mech.specialAbility?.name || '未知'}`);
                return true;
            }
        }
    },
    
    // 释放技能
    useSkill: function(skillId, mech, gameState, renderer) {
        const skill = this.skills[skillId];
        if (!skill) return false;
        
        return skill.use(mech, gameState, renderer);
    },
    
    // 检查技能是否可用
    canUseSkill: function(skillId, mech) {
        const skill = this.skills[skillId];
        if (!skill) return false;
        
        return skill.canUse(mech);
    },
    
    // 获取技能冷却百分比
    getSkillCooldownPercent: function(skillId, mech) {
        const skill = this.skills[skillId];
        if (!skill) return 0;
        
        const cooldown = mech.skillCooldowns[skill.cooldownKey] || 0;
        const maxCooldown = skill.config?.cooldown || 1;
        
        return Math.max(0, Math.min(1, cooldown / maxCooldown));
    },
    
    // 根据键盘码获取技能ID
    getSkillIdByKeyCode: function(keyCode) {
        for (const [skillId, skill] of Object.entries(this.skills)) {
            if (skill.keyCode === keyCode) {
                return skillId;
            }
        }
        return null;
    },
    
    // 播放技能效果
    playSkillEffect: function(mech, renderer, color) {
        if (!renderer || !renderer.particleSystem) return;
        
        const position = mech.position || new THREE.Vector3(0, 0, 0);
        
        // 创建粒子效果
        for (let i = 0; i < 30; i++) {
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 15,
                Math.random() * 10,
                (Math.random() - 0.5) * 15
            );
            
            renderer.particleSystem.createParticle({
                position: position.clone(),
                velocity: velocity,
                color: color,
                size: 0.3 + Math.random() * 0.4,
                lifetime: 0.8 + Math.random() * 0.5,
                gravity: -5
            });
        }
    },
    
    // 播放终极技能效果
    playUltimateEffect: function(mech, renderer, radius) {
        if (!renderer || !renderer.particleSystem || !renderer.projectileManager) return;
        
        const position = mech.position || new THREE.Vector3(0, 0, 0);
        
        // 大爆炸效果
        renderer.projectileManager.createExplosion(
            position,
            radius,
            renderer.scene,
            renderer.particleSystem
        );
        
        // 额外的粒子效果
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * radius * 0.5;
            const distance = Math.random() * radius;
            
            const velocity = new THREE.Vector3(
                Math.cos(angle) * distance * 0.5,
                height * 0.5,
                Math.sin(angle) * distance * 0.5
            );
            
            const colors = [0xff6600, 0xff0000, 0xffff00, 0xffaa00];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            renderer.particleSystem.createParticle({
                position: position.clone(),
                velocity: velocity,
                color: color,
                size: 0.4 + Math.random() * 0.6,
                lifetime: 1.0 + Math.random() * 1.0,
                gravity: -3
            });
        }
    },
    
    // 计算实际伤害（应用技能加成）
    calculateDamage: function(baseDamage, mech) {
        let damage = baseDamage;
        
        // 检查攻击强化效果
        const attackBoost = mech.statusEffects.find(e => e.type === 'attack_boost');
        if (attackBoost && attackBoost.data) {
            damage *= attackBoost.data.damageMultiplier || 1;
        }
        
        // 检查爆气效果
        const burstMode = mech.statusEffects.find(e => e.type === 'burst_mode');
        if (burstMode && burstMode.data) {
            damage *= burstMode.data.attackMultiplier || 1;
        }
        
        return Math.round(damage);
    },
    
    // 计算实际速度（应用技能加成）
    calculateSpeed: function(baseSpeed, mech) {
        let speed = baseSpeed;
        
        // 检查攻击强化效果
        const attackBoost = mech.statusEffects.find(e => e.type === 'attack_boost');
        if (attackBoost && attackBoost.data) {
            speed *= attackBoost.data.speedMultiplier || 1;
        }
        
        // 检查爆气效果
        const burstMode = mech.statusEffects.find(e => e.type === 'burst_mode');
        if (burstMode && burstMode.data) {
            speed *= burstMode.data.speedMultiplier || 1;
        }
        
        return speed;
    },
    
    // 计算实际防御（应用技能加成）
    calculateDefense: function(baseDefense, mech) {
        let defense = baseDefense;
        
        // 检查护盾效果
        const defenseShield = mech.statusEffects.find(e => e.type === 'defense_shield');
        if (defenseShield && defenseShield.data) {
            defense *= (1 + (1 - defenseShield.data.damageReduction));
        }
        
        // 检查爆气效果
        const burstMode = mech.statusEffects.find(e => e.type === 'burst_mode');
        if (burstMode && burstMode.data) {
            defense *= burstMode.data.defenseMultiplier || 1;
        }
        
        return defense;
    }
};

// 导出（如果需要模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillSystem;
}