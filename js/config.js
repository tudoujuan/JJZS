/**
 * 游戏配置文件
 * 包含游戏的核心参数和常量定义
 */

const GameConfig = {
    // 游戏版本
    version: '1.0.0',
    
    // 帧率设置
    targetFPS: 60,
    physicsStep: 1/60,
    
    // 机甲配置
    mech: {
        baseHealth: 100,
        baseEnergy: 100,
        baseSpeed: 5.0,
        baseAttack: 10,
        baseDefense: 5,
        rotationSpeed: Math.PI * 0.5,
        boostSpeedMultiplier: 2.0,
        energyRegenRate: 2.0,
        healthRegenRate: 0.5,
        hitFlashDuration: 0.3
    },
    
    // 武器配置
    weapons: {
        plasmaCannon: {
            damage: 25,
            energyCost: 15,
            cooldown: 1.5,
            projectileSpeed: 30,
            range: 100,
            splashRadius: 2,
            color: 0x00ffff,
            name: '等离子炮'
        },
        laserRifle: {
            damage: 15,
            energyCost: 8,
            cooldown: 0.5,
            projectileSpeed: 50,
            range: 150,
            splashRadius: 0,
            color: 0xff0000,
            name: '激光步枪'
        },
        missileLauncher: {
            damage: 40,
            energyCost: 25,
            cooldown: 3.0,
            projectileSpeed: 15,
            range: 200,
            splashRadius: 5,
            color: 0xff6600,
            name: '导弹发射器',
            homing: true
        },
        plasmaPistol: {
            damage: 10,
            energyCost: 5,
            cooldown: 0.3,
            projectileSpeed: 35,
            range: 80,
            splashRadius: 0,
            color: 0x00ffaa,
            name: '等离子手枪'
        },
        shotgun: {
            damage: 8,
            energyCost: 12,
            cooldown: 1.0,
            projectileSpeed: 25,
            range: 60,
            splashRadius: 0,
            color: 0xffff00,
            name: '霰弹枪',
            pelletCount: 5,
            spreadAngle: 0.3
        },
        gatling: {
            damage: 5,
            energyCost: 3,
            cooldown: 0.1,
            projectileSpeed: 40,
            range: 100,
            splashRadius: 0,
            color: 0xff00ff,
            name: '加特林机枪',
            spinUpTime: 0.5
        }
    },
    
    // 技能配置
    skills: {
        attackBoost: {
            name: '攻击强化',
            icon: '⚔',
            keyCode: 81, // Q
            cooldown: 10,
            duration: 5,
            energyCost: 20,
            damageMultiplier: 2.0,
            speedMultiplier: 1.2
        },
        defenseShield: {
            name: '防御护盾',
            icon: '🛡',
            keyCode: 87, // W
            cooldown: 15,
            duration: 8,
            energyCost: 30,
            damageReduction: 0.8,
            shieldHealth: 50
        },
        burstMode: {
            name: '爆气状态',
            icon: '🔥',
            keyCode: 69, // E
            cooldown: 20,
            duration: 10,
            energyCost: 40,
            attackMultiplier: 1.5,
            defenseMultiplier: 1.5,
            speedMultiplier: 1.5,
            particleEffect: true
        },
        ultimateAbility: {
            name: '终极必杀',
            icon: '💥',
            keyCode: 82, // R
            cooldown: 45,
            duration: 2,
            energyCost: 80,
            damage: 100,
            radius: 20,
            knockback: 10
        }
    },
    
    // AI配置
    ai: {
        reactionTime: 0.3,
        accuracy: 0.7,
        aggressionBase: 0.5,
        dodgeChance: 0.3,
        retreatHealthThreshold: 0.3,
        attackRange: 80,
        preferredDistance: 50,
        skillUsageChance: 0.3
    },
    
    // 物理配置
    physics: {
        gravity: 0,
        friction: 0.95,
        maxVelocity: 50,
        collisionDetection: true,
        boundarSize: 200
    },
    
    // 视觉配置
    visuals: {
        particleCount: 100,
        particleLifeTime: 2.0,
        explosionDuration: 0.5,
        screenShakeIntensity: 0.5,
        bloomIntensity: 0.8,
        ambientLight: 0x333344,
        directionalLight: 0xffffff,
        fogColor: 0x0a0a1a,
        fogNear: 50,
        fogFar: 300
    },
    
    // 音效配置
    audio: {
        masterVolume: 0.8,
        sfxVolume: 0.7,
        musicVolume: 0.5,
        hitSoundPitchRange: [0.8, 1.2],
        explosionSoundPitch: 1.0
    },
    
    // UI配置
    ui: {
        healthBarSmoothness: 0.1,
        energyBarSmoothness: 0.1,
        comboDisplayDuration: 2.0,
        damageNumberDuration: 1.0,
        damageNumberSpeed: 50
    },
    
    // 游戏模式配置
    gameModes: {
        soloBattle: {
            name: '单人混战',
            maxEnemies: 1,
            roundDuration: 180,
            winCondition: 'eliminate',
            respawnEnabled: false,
            powerUpsEnabled: true
        },
        arena: {
            name: '竞技场',
            maxEnemies: 5,
            roundDuration: 300,
            winCondition: 'survival',
            respawnEnabled: true,
            respawnDelay: 5.0,
            powerUpsEnabled: true
        },
        training: {
            name: '训练模式',
            maxEnemies: 1,
            roundDuration: 0,
            winCondition: 'none',
            respawnEnabled: true,
            infiniteAmmo: true,
            infiniteEnergy: true,
            powerUpsEnabled: false
        }
    },
    
    // 输入配置
    input: {
        moveForward: 87, // W
        moveBackward: 83, // S
        moveLeft: 65, // A
        moveRight: 68, // D
        attack: 0, // 鼠标左键
        specialAttack: 2, // 鼠标右键
        boost: 32, // 空格
        pause: 27, // ESC
        cameraRotate: 1, // 鼠标右键
        cameraZoomIn: 187, // +
        cameraZoomOut: 189 // -
    },
    
    // 调试配置
    debug: {
        enabled: false,
        showStats: false,
        showColliders: false,
        showPathfinding: false,
        godMode: false,
        infiniteEnergy: false
    }
};

// 导出配置（如果需要模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}