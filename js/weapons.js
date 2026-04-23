/**
 * 武器系统
 * 定义所有武器类型及其行为
 */

const WeaponSystem = {
    // 武器类型映射
    weaponTypes: {
        'plasma_cannon': 'plasmaCannon',
        'laser_rifle': 'laserRifle',
        'missile_launcher': 'missileLauncher',
        'plasma_pistol': 'plasmaPistol',
        'shotgun': 'shotgun',
        'gatling': 'gatling',
        'none': null
    },
    
    // 武器状态
    weaponStates: {},
    
    // 初始化武器
    initWeapon: function(weaponId, ownerId) {
        const weaponType = this.weaponTypes[weaponId];
        if (!weaponType) return null;
        
        const config = GameConfig.weapons[weaponType];
        if (!config) return null;
        
        const stateKey = ownerId + '_' + weaponId;
        this.weaponStates[stateKey] = {
            weaponId: weaponId,
            weaponType: weaponType,
            ownerId: ownerId,
            cooldownTimer: 0,
            isReady: true,
            spinUpTimer: 0,
            isSpinning: false,
            lastFireTime: 0,
            config: { ...config }
        };
        
        return this.weaponStates[stateKey];
    },
    
    // 获取武器状态
    getWeaponState: function(weaponId, ownerId) {
        const stateKey = ownerId + '_' + weaponId;
        return this.weaponStates[stateKey] || this.initWeapon(weaponId, ownerId);
    },
    
    // 更新武器状态
    update: function(deltaTime) {
        Object.values(this.weaponStates).forEach(state => {
            // 更新冷却时间
            if (state.cooldownTimer > 0) {
                state.cooldownTimer -= deltaTime;
                if (state.cooldownTimer <= 0) {
                    state.cooldownTimer = 0;
                    state.isReady = true;
                }
            }
            
            // 更新加特林预热
            if (state.weaponType === 'gatling' && state.isSpinning) {
                if (state.spinUpTimer < state.config.spinUpTime) {
                    state.spinUpTimer += deltaTime;
                }
            }
        });
    },
    
    // 检查武器是否可以开火
    canFire: function(weaponId, ownerId, mech) {
        const state = this.getWeaponState(weaponId, ownerId);
        if (!state) return false;
        if (!state.isReady) return false;
        if (mech.energy < state.config.energyCost) return false;
        if (mech.isStunned) return false;
        
        // 加特林需要预热
        if (state.weaponType === 'gatling') {
            return state.spinUpTimer >= state.config.spinUpTime;
        }
        
        return true;
    },
    
    // 开火
    fire: function(weaponId, ownerId, mech, targetPosition, scene, projectileManager) {
        const state = this.getWeaponState(weaponId, ownerId);
        if (!state) return null;
        
        if (!this.canFire(weaponId, ownerId, mech)) {
            return null;
        }
        
        // 消耗能量
        mech.energy = Math.max(0, mech.energy - state.config.energyCost);
        
        // 设置冷却
        state.isReady = false;
        state.cooldownTimer = state.config.cooldown;
        state.lastFireTime = Date.now();
        
        // 计算攻击方向
        const mechPosition = mech.position || new THREE.Vector3(0, 0, 0);
        const direction = targetPosition.clone().sub(mechPosition).normalize();
        
        // 根据武器类型创建不同的弹道
        const projectiles = [];
        
        switch (state.weaponType) {
            case 'shotgun':
                // 霰弹枪：多发子弹
                const pelletCount = state.config.pelletCount || 5;
                const spreadAngle = state.config.spreadAngle || 0.3;
                
                for (let i = 0; i < pelletCount; i++) {
                    const spread = new THREE.Vector3(
                        (Math.random() - 0.5) * spreadAngle,
                        (Math.random() - 0.5) * spreadAngle,
                        (Math.random() - 0.5) * spreadAngle
                    );
                    
                    const pelletDirection = direction.clone().add(spread).normalize();
                    
                    const projectile = projectileManager.createProjectile({
                        type: 'shotgun_pellet',
                        position: mechPosition.clone(),
                        direction: pelletDirection,
                        speed: state.config.projectileSpeed,
                        damage: state.config.damage,
                        range: state.config.range,
                        color: state.config.color,
                        ownerId: ownerId,
                        lifetime: state.config.range / state.config.projectileSpeed
                    });
                    
                    projectiles.push(projectile);
                }
                break;
                
            case 'missileLauncher':
                // 导弹：追踪导弹
                const missile = projectileManager.createProjectile({
                    type: 'missile',
                    position: mechPosition.clone(),
                    direction: direction,
                    speed: state.config.projectileSpeed,
                    damage: state.config.damage,
                    range: state.config.range,
                    color: state.config.color,
                    ownerId: ownerId,
                    lifetime: state.config.range / state.config.projectileSpeed,
                    splashRadius: state.config.splashRadius,
                    homing: true,
                    targetPosition: targetPosition
                });
                
                projectiles.push(missile);
                break;
                
            case 'gatling':
                // 加特林机枪
                const gatlingBullet = projectileManager.createProjectile({
                    type: 'bullet',
                    position: mechPosition.clone(),
                    direction: direction,
                    speed: state.config.projectileSpeed,
                    damage: state.config.damage,
                    range: state.config.range,
                    color: state.config.color,
                    ownerId: ownerId,
                    lifetime: state.config.range / state.config.projectileSpeed
                });
                
                projectiles.push(gatlingBullet);
                break;
                
            case 'laserRifle':
                // 激光步枪：即时命中
                const laser = projectileManager.createProjectile({
                    type: 'laser',
                    position: mechPosition.clone(),
                    direction: direction,
                    speed: state.config.projectileSpeed,
                    damage: state.config.damage,
                    range: state.config.range,
                    color: state.config.color,
                    ownerId: ownerId,
                    lifetime: 0.1,
                    instant: true
                });
                
                projectiles.push(laser);
                break;
                
            default:
                // 普通弹道武器
                const bullet = projectileManager.createProjectile({
                    type: 'plasma',
                    position: mechPosition.clone(),
                    direction: direction,
                    speed: state.config.projectileSpeed,
                    damage: state.config.damage,
                    range: state.config.range,
                    color: state.config.color,
                    ownerId: ownerId,
                    lifetime: state.config.range / state.config.projectileSpeed,
                    splashRadius: state.config.splashRadius || 0
                });
                
                projectiles.push(bullet);
        }
        
        // 添加到场景
        projectiles.forEach(proj => {
            if (proj.mesh) {
                scene.add(proj.mesh);
            }
        });
        
        return projectiles;
    },
    
    // 开始预热（加特林专用）
    startSpin: function(weaponId, ownerId) {
        const state = this.getWeaponState(weaponId, ownerId);
        if (state && state.weaponType === 'gatling') {
            state.isSpinning = true;
        }
    },
    
    // 停止预热
    stopSpin: function(weaponId, ownerId) {
        const state = this.getWeaponState(weaponId, ownerId);
        if (state && state.weaponType === 'gatling') {
            state.isSpinning = false;
            state.spinUpTimer = 0;
        }
    },
    
    // 获取武器信息
    getWeaponInfo: function(weaponId) {
        const weaponType = this.weaponTypes[weaponId];
        if (!weaponType) return null;
        
        const config = GameConfig.weapons[weaponType];
        if (!config) return null;
        
        return {
            id: weaponId,
            name: config.name,
            damage: config.damage,
            energyCost: config.energyCost,
            cooldown: config.cooldown,
            range: config.range,
            color: config.color
        };
    },
    
    // 重置所有武器状态
    reset: function() {
        this.weaponStates = {};
    }
};

// 弹道管理器
class ProjectileManager {
    constructor() {
        this.projectiles = [];
        this.explosions = [];
    }
    
    // 创建弹道
    createProjectile(params) {
        const projectile = {
            id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: params.type || 'bullet',
            position: params.position.clone(),
            direction: params.direction.clone(),
            speed: params.speed || 20,
            damage: params.damage || 10,
            range: params.range || 100,
            color: params.color || 0xffffff,
            ownerId: params.ownerId,
            lifetime: params.lifetime || 5,
            splashRadius: params.splashRadius || 0,
            homing: params.homing || false,
            targetPosition: params.targetPosition,
            instant: params.instant || false,
            
            // 状态
            isActive: true,
            startPosition: params.position.clone(),
            distanceTraveled: 0,
            
            // 视觉
            mesh: null
        };
        
        // 创建视觉网格
        projectile.mesh = this.createProjectileMesh(projectile);
        
        this.projectiles.push(projectile);
        return projectile;
    }
    
    // 创建弹道网格
    createProjectileMesh(projectile) {
        let geometry, material;
        
        switch (projectile.type) {
            case 'missile':
                geometry = new THREE.CylinderGeometry(0.2, 0.1, 1.5, 8);
                geometry.rotateX(Math.PI / 2);
                material = new THREE.MeshStandardMaterial({
                    color: projectile.color,
                    emissive: projectile.color,
                    emissiveIntensity: 0.5,
                    metalness: 0.8,
                    roughness: 0.2
                });
                break;
                
            case 'laser':
                geometry = new THREE.CylinderGeometry(0.05, 0.05, projectile.range, 8);
                geometry.rotateX(Math.PI / 2);
                material = new THREE.MeshBasicMaterial({
                    color: projectile.color,
                    transparent: true,
                    opacity: 0.8
                });
                break;
                
            case 'shotgun_pellet':
                geometry = new THREE.SphereGeometry(0.1, 8, 8);
                material = new THREE.MeshBasicMaterial({
                    color: projectile.color,
                    transparent: true,
                    opacity: 0.9
                });
                break;
                
            case 'plasma':
            default:
                geometry = new THREE.SphereGeometry(0.2, 16, 16);
                material = new THREE.MeshStandardMaterial({
                    color: projectile.color,
                    emissive: projectile.color,
                    emissiveIntensity: 0.8,
                    transparent: true,
                    opacity: 0.9
                });
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(projectile.position);
        
        // 添加辉光效果
        const glowGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: projectile.color,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        mesh.add(glow);
        
        return mesh;
    }
    
    // 更新弹道
    update(deltaTime, mechs, scene, particleSystem) {
        const toRemove = [];
        
        this.projectiles.forEach((projectile, index) => {
            if (!projectile.isActive) return;
            
            // 更新生命周期
            projectile.lifetime -= deltaTime;
            
            if (projectile.instant) {
                // 即时命中武器（如激光）
                const hitInfo = this.checkInstantHit(projectile, mechs);
                if (hitInfo) {
                    this.handleHit(projectile, hitInfo.target, hitInfo.position, scene, particleSystem);
                }
                toRemove.push(index);
                return;
            }
            
            // 移动弹道
            const moveDistance = projectile.speed * deltaTime;
            projectile.position.add(projectile.direction.clone().multiplyScalar(moveDistance));
            projectile.distanceTraveled += moveDistance;
            
            // 更新网格位置
            if (projectile.mesh) {
                projectile.mesh.position.copy(projectile.position);
                projectile.mesh.lookAt(projectile.position.clone().add(projectile.direction));
            }
            
            // 检测碰撞
            const collision = this.checkCollision(projectile, mechs);
            
            if (collision) {
                this.handleHit(projectile, collision.target, collision.position, scene, particleSystem);
                toRemove.push(index);
                return;
            }
            
            // 检查是否超出范围或生命周期结束
            if (projectile.distanceTraveled >= projectile.range || projectile.lifetime <= 0) {
                toRemove.push(index);
            }
        });
        
        // 移除过期弹道
        toRemove.sort((a, b) => b - a).forEach(index => {
            const projectile = this.projectiles[index];
            if (projectile.mesh) {
                scene.remove(projectile.mesh);
            }
            this.projectiles.splice(index, 1);
        });
        
        // 更新爆炸效果
        this.updateExplosions(deltaTime);
    }
    
    // 检查即时命中
    checkInstantHit(projectile, mechs) {
        const raycaster = new THREE.Raycaster();
        raycaster.set(projectile.startPosition, projectile.direction);
        
        let closestHit = null;
        let closestDistance = projectile.range;
        
        mechs.forEach(mech => {
            if (mech.id === projectile.ownerId || !mech.isAlive) return;
            
            // 简化的碰撞检测
            const direction = mech.position.clone().sub(projectile.startPosition);
            const distance = direction.length();
            
            if (distance < closestDistance) {
                const dot = direction.normalize().dot(projectile.direction);
                if (dot > 0.95) { // 近似命中
                    closestHit = {
                        target: mech,
                        position: mech.position.clone()
                    };
                    closestDistance = distance;
                }
            }
        });
        
        return closestHit;
    }
    
    // 检查碰撞
    checkCollision(projectile, mechs) {
        for (const mech of mechs) {
            if (mech.id === projectile.ownerId || !mech.isAlive) continue;
            
            // 简化的球体碰撞检测
            const distance = projectile.position.distanceTo(mech.position || new THREE.Vector3(0, 0, 0));
            const collisionRadius = 2.0; // 机甲碰撞半径
            
            if (distance < collisionRadius) {
                return {
                    target: mech,
                    position: projectile.position.clone()
                };
            }
        }
        
        return null;
    }
    
    // 处理命中
    handleHit(projectile, target, position, scene, particleSystem) {
        // 计算伤害
        let damage = projectile.damage;
        
        // 应用伤害
        if (target && target.isAlive) {
            // 考虑防御力
            const actualDamage = Math.max(1, damage - (target.defense || 0) * 0.5);
            target.health = Math.max(0, target.health - actualDamage);
            
            // 添加击中效果
            target.isHit = true;
            target.hitTimer = GameConfig.mech.hitFlashDuration;
            
            // 更新统计
            const attackerMech = this.findMechById(projectile.ownerId);
            if (attackerMech) {
                attackerMech.totalDamageDealt += actualDamage;
                
                // 更新连击
                attackerMech.comboCount++;
                attackerMech.comboTimer = GameConfig.ui.comboDisplayDuration;
            }
            
            // 检查是否死亡
            if (target.health <= 0) {
                target.isAlive = false;
                if (attackerMech) {
                    attackerMech.kills++;
                }
                
                // 创建死亡爆炸
                this.createExplosion(position, 5, scene, particleSystem);
            }
        }
        
        // 溅射伤害
        if (projectile.splashRadius > 0) {
            this.createExplosion(position, projectile.splashRadius, scene, particleSystem);
        }
        
        // 创建击中粒子效果
        if (particleSystem) {
            particleSystem.createHitEffect(position, projectile.color);
        }
    }
    
    // 查找机甲
    findMechById(mechId) {
        // 这个方法需要在外部实现，或者通过参数传入机甲列表
        return null;
    }
    
    // 创建爆炸
    createExplosion(position, radius, scene, particleSystem) {
        const explosion = {
            position: position.clone(),
            radius: radius,
            lifetime: GameConfig.visuals.explosionDuration,
            maxLifetime: GameConfig.visuals.explosionDuration
        };
        
        // 创建爆炸视觉效果
        const geometry = new THREE.SphereGeometry(0.1, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 1
        });
        explosion.mesh = new THREE.Mesh(geometry, material);
        explosion.mesh.position.copy(position);
        scene.add(explosion.mesh);
        
        // 创建粒子效果
        if (particleSystem) {
            particleSystem.createExplosion(position, radius);
        }
        
        this.explosions.push(explosion);
    }
    
    // 更新爆炸效果
    updateExplosions(deltaTime) {
        const toRemove = [];
        
        this.explosions.forEach((explosion, index) => {
            explosion.lifetime -= deltaTime;
            
            // 动画效果
            const progress = 1 - (explosion.lifetime / explosion.maxLifetime);
            const scale = 1 + progress * explosion.radius;
            const opacity = 1 - progress;
            
            if (explosion.mesh) {
                explosion.mesh.scale.set(scale, scale, scale);
                explosion.mesh.material.opacity = opacity;
            }
            
            if (explosion.lifetime <= 0) {
                toRemove.push(index);
            }
        });
        
        // 移除过期爆炸
        toRemove.sort((a, b) => b - a).forEach(index => {
            const explosion = this.explosions[index];
            if (explosion.mesh) {
                explosion.mesh.parent.remove(explosion.mesh);
            }
            this.explosions.splice(index, 1);
        });
    }
    
    // 清理
    clear() {
        this.projectiles = [];
        this.explosions = [];
    }
}

// 粒子系统
class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.particleCount = GameConfig.visuals.particleCount;
    }
    
    // 创建击中效果
    createHitEffect(position, color) {
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.createParticle({
                position: position.clone(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10
                ),
                color: color,
                size: 0.1 + Math.random() * 0.2,
                lifetime: 0.5 + Math.random() * 0.5,
                gravity: 0
            });
            
            this.particles.push(particle);
        }
    }
    
    // 创建爆炸效果
    createExplosion(position, radius) {
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * radius * 2,
                (Math.random() - 0.5) * radius * 2,
                (Math.random() - 0.5) * radius * 2
            );
            
            const colors = [0xff6600, 0xff0000, 0xffff00, 0xffaa00];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const particle = this.createParticle({
                position: position.clone(),
                velocity: velocity,
                color: color,
                size: 0.2 + Math.random() * 0.4,
                lifetime: 1.0 + Math.random() * 1.0,
                gravity: -5
            });
            
            this.particles.push(particle);
        }
    }
    
    // 创建移动尾迹
    createTrail(position, color) {
        const particle = this.createParticle({
            position: position.clone(),
            velocity: new THREE.Vector3(0, 0, 0),
            color: color,
            size: 0.15,
            lifetime: 0.3,
            gravity: 0
        });
        
        this.particles.push(particle);
    }
    
    // 创建单个粒子
    createParticle(params) {
        const particle = {
            position: params.position.clone(),
            velocity: params.velocity.clone(),
            color: params.color,
            size: params.size,
            lifetime: params.lifetime,
            maxLifetime: params.lifetime,
            gravity: params.gravity || 0,
            
            // 视觉
            mesh: null
        };
        
        // 创建网格
        const geometry = new THREE.SphereGeometry(particle.size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: particle.color,
            transparent: true,
            opacity: 1
        });
        
        particle.mesh = new THREE.Mesh(geometry, material);
        particle.mesh.position.copy(particle.position);
        this.scene.add(particle.mesh);
        
        return particle;
    }
    
    // 更新粒子
    update(deltaTime) {
        const toRemove = [];
        
        this.particles.forEach((particle, index) => {
            particle.lifetime -= deltaTime;
            
            // 应用重力
            particle.velocity.y += particle.gravity * deltaTime;
            
            // 移动
            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            
            // 更新透明度和大小
            const progress = 1 - (particle.lifetime / particle.maxLifetime);
            const opacity = 1 - progress;
            const scale = 1 + progress * 0.5;
            
            if (particle.mesh) {
                particle.mesh.position.copy(particle.position);
                particle.mesh.material.opacity = opacity;
                particle.mesh.scale.set(scale, scale, scale);
            }
            
            if (particle.lifetime <= 0) {
                toRemove.push(index);
            }
        });
        
        // 移除过期粒子
        toRemove.sort((a, b) => b - a).forEach(index => {
            const particle = this.particles[index];
            if (particle.mesh) {
                this.scene.remove(particle.mesh);
            }
            this.particles.splice(index, 1);
        });
    }
    
    // 清理
    clear() {
        this.particles.forEach(particle => {
            if (particle.mesh) {
                this.scene.remove(particle.mesh);
            }
        });
        this.particles = [];
    }
}

// 导出（如果需要模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WeaponSystem,
        ProjectileManager,
        ParticleSystem
    };
}