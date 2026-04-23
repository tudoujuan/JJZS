/**
 * 机甲蓝图数据
 * 定义所有可选择的机甲蓝图及其属性
 */

const MechBlueprints = {
    // 默认机甲
    default: {
        id: 'default',
        name: '标准机甲',
        description: '平衡型机甲，各项属性均衡',
        icon: '🤖',
        color: 0x4488ff,
        stats: {
            health: 100,
            energy: 100,
            speed: 5.0,
            attack: 10,
            defense: 5
        },
        specialAbility: {
            name: '平衡强化',
            description: '短暂提升所有属性',
            cooldown: 30,
            duration: 10
        },
        modelConfig: {
            bodyShape: 'box',
            bodyScale: { x: 1, y: 1.2, z: 0.8 },
            headScale: { x: 0.6, y: 0.6, z: 0.6 },
            limbScale: { x: 0.3, y: 1.0, z: 0.3 },
            material: {
                color: 0x4488ff,
                metalness: 0.7,
                roughness: 0.3
            }
        }
    },
    
    // 攻击型机甲
    striker: {
        id: 'striker',
        name: '突击机甲',
        description: '高攻击力，快速移动，适合正面突击',
        icon: '⚡',
        color: 0xff4444,
        stats: {
            health: 80,
            energy: 120,
            speed: 6.5,
            attack: 15,
            defense: 3
        },
        specialAbility: {
            name: '极速突袭',
            description: '大幅提升移动速度和攻击速度',
            cooldown: 25,
            duration: 8
        },
        modelConfig: {
            bodyShape: 'slim',
            bodyScale: { x: 0.8, y: 1.0, z: 0.6 },
            headScale: { x: 0.5, y: 0.5, z: 0.5 },
            limbScale: { x: 0.25, y: 1.1, z: 0.25 },
            material: {
                color: 0xff4444,
                metalness: 0.6,
                roughness: 0.4
            }
        }
    },
    
    // 防御型机甲
    fortress: {
        id: 'fortress',
        name: '堡垒机甲',
        description: '高防御力，高生命值，适合持久战',
        icon: '🛡',
        color: 0x44ff44,
        stats: {
            health: 150,
            energy: 80,
            speed: 3.5,
            attack: 8,
            defense: 12
        },
        specialAbility: {
            name: '铁壁防御',
            description: '大幅提升防御力，减少受到的伤害',
            cooldown: 35,
            duration: 12
        },
        modelConfig: {
            bodyShape: 'heavy',
            bodyScale: { x: 1.3, y: 1.4, z: 1.0 },
            headScale: { x: 0.7, y: 0.7, z: 0.7 },
            limbScale: { x: 0.4, y: 0.9, z: 0.4 },
            material: {
                color: 0x44ff44,
                metalness: 0.9,
                roughness: 0.2
            }
        }
    },
    
    // 敏捷型机甲
    phantom: {
        id: 'phantom',
        name: '幻影机甲',
        description: '极高速度，高能量，适合游走战术',
        icon: '👻',
        color: 0xaa44ff,
        stats: {
            health: 70,
            energy: 150,
            speed: 8.0,
            attack: 12,
            defense: 2
        },
        specialAbility: {
            name: '相位瞬移',
            description: '短暂无敌并大幅提升移动速度',
            cooldown: 40,
            duration: 5
        },
        modelConfig: {
            bodyShape: 'sleek',
            bodyScale: { x: 0.7, y: 1.1, z: 0.5 },
            headScale: { x: 0.45, y: 0.45, z: 0.45 },
            limbScale: { x: 0.2, y: 1.2, z: 0.2 },
            material: {
                color: 0xaa44ff,
                metalness: 0.5,
                roughness: 0.5,
                emissive: 0xaa44ff,
                emissiveIntensity: 0.3
            }
        }
    },
    
    // 平衡型机甲（进阶）
    sentinel: {
        id: 'sentinel',
        name: '哨兵机甲',
        description: '进阶平衡型，各项属性略优于标准机甲',
        icon: '🔱',
        color: 0xffaa00,
        stats: {
            health: 110,
            energy: 110,
            speed: 5.5,
            attack: 11,
            defense: 6
        },
        specialAbility: {
            name: '战术护盾',
            description: '生成护盾吸收伤害并反弹部分伤害',
            cooldown: 30,
            duration: 8
        },
        modelConfig: {
            bodyShape: 'advanced',
            bodyScale: { x: 1.1, y: 1.3, z: 0.9 },
            headScale: { x: 0.65, y: 0.65, z: 0.65 },
            limbScale: { x: 0.35, y: 1.05, z: 0.35 },
            material: {
                color: 0xffaa00,
                metalness: 0.8,
                roughness: 0.2
            }
        }
    }
};

// 获取所有蓝图ID
MechBlueprints.getAllIds = function() {
    return Object.keys(MechBlueprints).filter(key => 
        typeof MechBlueprints[key] === 'object' && 
        MechBlueprints[key].id === key
    );
};

// 根据ID获取蓝图
MechBlueprints.getById = function(id) {
    return MechBlueprints[id] || MechBlueprints.default;
};

// 创建机甲实例
MechBlueprints.createMech = function(blueprintId, customizations = {}) {
    const blueprint = MechBlueprints.getById(blueprintId);
    
    // 基础属性
    const baseStats = { ...blueprint.stats };
    
    // 应用自定义属性
    if (customizations.stats) {
        const customStats = customizations.stats;
        const totalPoints = Object.values(customStats).reduce((a, b) => a + b, 0);
        
        if (totalPoints <= 400) {
            // 计算基础属性总和
            const baseTotal = Object.values(baseStats).reduce((a, b) => a + b, 0);
            
            // 应用自定义比例
            Object.keys(customStats).forEach(stat => {
                if (baseStats[stat] !== undefined) {
                    const ratio = customStats[stat] / 100;
                    baseStats[stat] = Math.round(blueprint.stats[stat] * (0.5 + ratio));
                }
            });
        }
    }
    
    // 创建机甲对象
    return {
        id: blueprint.id + '_' + Date.now(),
        blueprintId: blueprint.id,
        name: blueprint.name,
        description: blueprint.description,
        icon: blueprint.icon,
        color: blueprint.color,
        
        // 状态
        health: baseStats.health,
        maxHealth: baseStats.health,
        energy: baseStats.energy,
        maxEnergy: baseStats.energy,
        
        // 属性
        speed: baseStats.speed,
        attack: baseStats.attack,
        defense: baseStats.defense,
        
        // 武器装备
        primaryWeapon: customizations.primaryWeapon || 'plasma_cannon',
        secondaryWeapon: customizations.secondaryWeapon || 'none',
        
        // 特殊能力
        specialAbility: { ...blueprint.specialAbility },
        
        // 模型配置
        modelConfig: { ...blueprint.modelConfig },
        
        // 状态标记
        isAlive: true,
        isInvulnerable: false,
        isBoosting: false,
        isStunned: false,
        
        // 计时器
        stunTimer: 0,
        invulnerableTimer: 0,
        boostTimer: 0,
        
        // 技能冷却
        skillCooldowns: {
            skill1: 0,
            skill2: 0,
            skill3: 0,
            skill4: 0,
            special: 0
        },
        
        // 状态效果
        statusEffects: [],
        
        // 连击计数
        comboCount: 0,
        comboTimer: 0,
        
        // 造成伤害统计
        totalDamageDealt: 0,
        kills: 0
    };
};

// 导出（如果需要模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MechBlueprints;
}