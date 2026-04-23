/**
 * 机甲自定义管理器
 * 处理机甲定制界面的逻辑
 */

const CustomizeManager = {
    // 当前配置
    currentConfig: {
        blueprintId: 'default',
        primaryWeapon: 'plasma_cannon',
        secondaryWeapon: 'none',
        stats: {
            attack: 50,
            defense: 50,
            speed: 50,
            energy: 50
        }
    },
    
    // 预览机甲
    previewMech: null,
    previewMechGroup: null,
    
    // 旋转控制
    rotationAngle: 0,
    isAutoRotating: true,
    
    // 初始化
    init: function() {
        console.log('机甲自定义管理器初始化');
        
        // 绑定UI事件
        this.bindEvents();
        
        // 初始化蓝图选择
        this.initBlueprintGrid();
        
        // 加载保存的配置
        this.loadSavedConfig();
    },
    
    // 绑定UI事件
    bindEvents: function() {
        // 蓝图选择
        const blueprintGrid = document.getElementById('blueprintGrid');
        if (blueprintGrid) {
            blueprintGrid.addEventListener('click', (e) => {
                const blueprintItem = e.target.closest('.blueprint-item');
                if (blueprintItem) {
                    const blueprintId = blueprintItem.dataset.blueprintId;
                    if (blueprintId) {
                        this.selectBlueprint(blueprintId);
                    }
                }
            });
        }
        
        // 武器选择
        const primaryWeapon = document.getElementById('primaryWeapon');
        if (primaryWeapon) {
            primaryWeapon.addEventListener('change', (e) => {
                this.currentConfig.primaryWeapon = e.target.value;
                this.updatePreview();
                this.saveConfig();
            });
        }
        
        const secondaryWeapon = document.getElementById('secondaryWeapon');
        if (secondaryWeapon) {
            secondaryWeapon.addEventListener('change', (e) => {
                this.currentConfig.secondaryWeapon = e.target.value;
                this.updatePreview();
                this.saveConfig();
            });
        }
        
        // 属性调整
        const statSliders = ['attack', 'defense', 'speed', 'energy'];
        statSliders.forEach(stat => {
            const slider = document.getElementById(stat + 'Stat');
            const valueDisplay = document.getElementById(stat + 'Value');
            
            if (slider) {
                slider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    this.currentConfig.stats[stat] = value;
                    
                    if (valueDisplay) {
                        valueDisplay.textContent = value;
                    }
                    
                    this.updateTotalPoints();
                    this.updatePreview();
                });
                
                slider.addEventListener('change', () => {
                    this.saveConfig();
                });
            }
        });
        
        // 视角控制
        const rotateLeft = document.getElementById('rotateLeft');
        if (rotateLeft) {
            rotateLeft.addEventListener('click', () => {
                this.manualRotate(-0.5);
            });
        }
        
        const rotateRight = document.getElementById('rotateRight');
        if (rotateRight) {
            rotateRight.addEventListener('click', () => {
                this.manualRotate(0.5);
            });
        }
        
        const resetView = document.getElementById('resetView');
        if (resetView) {
            resetView.addEventListener('click', () => {
                this.resetCamera();
            });
        }
        
        // 保存配置
        const saveBtn = document.getElementById('saveCustomization');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveConfig();
                this.showSaveNotification();
            });
        }
    },
    
    // 初始化蓝图网格
    initBlueprintGrid: function() {
        const grid = document.getElementById('blueprintGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        const blueprintIds = MechBlueprints.getAllIds();
        
        blueprintIds.forEach(blueprintId => {
            const blueprint = MechBlueprints.getById(blueprintId);
            
            const item = document.createElement('div');
            item.className = 'blueprint-item';
            if (blueprintId === this.currentConfig.blueprintId) {
                item.classList.add('selected');
            }
            item.dataset.blueprintId = blueprintId;
            
            item.innerHTML = `
                <div class="blueprint-icon">${blueprint.icon}</div>
                <div class="blueprint-name">${blueprint.name}</div>
                <div class="blueprint-desc">${blueprint.description}</div>
            `;
            
            grid.appendChild(item);
        });
    },
    
    // 选择蓝图
    selectBlueprint: function(blueprintId) {
        if (blueprintId === this.currentConfig.blueprintId) return;
        
        // 更新UI
        const items = document.querySelectorAll('.blueprint-item');
        items.forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.blueprintId === blueprintId) {
                item.classList.add('selected');
            }
        });
        
        // 更新配置
        this.currentConfig.blueprintId = blueprintId;
        
        // 更新预览
        this.updatePreview();
        
        // 保存配置
        this.saveConfig();
    },
    
    // 更新总属性点
    updateTotalPoints: function() {
        const totalPointsDisplay = document.getElementById('totalPoints');
        if (!totalPointsDisplay) return;
        
        const stats = this.currentConfig.stats;
        const total = stats.attack + stats.defense + stats.speed + stats.energy;
        
        totalPointsDisplay.textContent = total;
        
        // 检查是否超过限制
        if (total > 400) {
            totalPointsDisplay.style.color = '#ff4444';
        } else {
            totalPointsDisplay.style.color = '#00c8ff';
        }
    },
    
    // 手动旋转
    manualRotate: function(delta) {
        this.isAutoRotating = false;
        this.rotationAngle += delta;
        
        if (this.previewMechGroup) {
            this.previewMechGroup.rotation.y = this.rotationAngle;
        }
    },
    
    // 重置相机
    resetCamera: function() {
        this.rotationAngle = 0;
        this.isAutoRotating = true;
        
        if (ThreeDRendererInstance) {
            ThreeDRendererInstance.resetCamera();
        }
        
        if (this.previewMechGroup) {
            this.previewMechGroup.rotation.y = 0;
        }
    },
    
    // 更新预览
    updatePreview: function() {
        if (!ThreeDRendererInstance) return;
        
        // 移除旧的预览机甲
        if (this.previewMechGroup) {
            ThreeDRendererInstance.scene.remove(this.previewMechGroup);
            this.previewMechGroup = null;
        }
        
        // 创建新的机甲配置
        this.previewMech = MechBlueprints.createMech(
            this.currentConfig.blueprintId,
            {
                primaryWeapon: this.currentConfig.primaryWeapon,
                secondaryWeapon: this.currentConfig.secondaryWeapon,
                stats: this.currentConfig.stats
            }
        );
        
        // 设置位置
        this.previewMech.position = new THREE.Vector3(0, 0, 0);
        this.previewMech.rotation = this.rotationAngle;
        
        // 创建3D模型
        this.previewMechGroup = ThreeDRendererInstance.createMechModel(this.previewMech);
        
        // 添加武器模型
        if (this.previewMechGroup) {
            const leftMount = this.previewMechGroup.getObjectByName('WeaponMount_Left');
            const rightMount = this.previewMechGroup.getObjectByName('WeaponMount_Right');
            
            if (rightMount) {
                ThreeDRendererInstance.createWeaponModel(
                    this.currentConfig.primaryWeapon,
                    rightMount
                );
            }
            
            if (leftMount && this.currentConfig.secondaryWeapon !== 'none') {
                ThreeDRendererInstance.createWeaponModel(
                    this.currentConfig.secondaryWeapon,
                    leftMount
                );
            }
        }
        
        console.log('预览更新完成:', this.currentConfig);
    },
    
    // 启动预览渲染循环
    startPreviewRender: function() {
        const canvas = document.getElementById('customizeCanvas');
        if (!canvas) return;
        
        // 初始化渲染器（定制模式）
        ThreeDRendererInstance.init(canvas, true);
        
        // 设置相机
        ThreeDRendererInstance.camera.position.set(0, 5, 12);
        ThreeDRendererInstance.camera.lookAt(0, 3, 0);
        
        // 添加简单的背景
        this.addPreviewBackground();
        
        // 更新预览
        this.updatePreview();
        
        // 启动渲染循环
        this.renderLoop();
    },
    
    // 添加预览背景
    addPreviewBackground: function() {
        // 简单的网格地面
        const groundGeometry = new THREE.PlaneGeometry(30, 30, 20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.3,
            roughness: 0.8,
            transparent: true,
            opacity: 0.5
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        ThreeDRendererInstance.scene.add(ground);
        
        // 网格线
        const gridHelper = new THREE.GridHelper(30, 20, 0x0066ff, 0x003366);
        gridHelper.position.y = -1.99;
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        ThreeDRendererInstance.scene.add(gridHelper);
    },
    
    // 渲染循环
    renderLoop: function() {
        requestAnimationFrame(() => this.renderLoop());
        
        const deltaTime = 0.016; // 假设60fps
        
        // 自动旋转
        if (this.isAutoRotating && this.previewMechGroup) {
            this.rotationAngle += deltaTime * 0.5;
            this.previewMechGroup.rotation.y = this.rotationAngle;
        }
        
        // 渲染
        ThreeDRendererInstance.render();
    },
    
    // 保存配置
    saveConfig: function() {
        try {
            localStorage.setItem('mechConfig', JSON.stringify(this.currentConfig));
            console.log('机甲配置已保存');
        } catch (e) {
            console.warn('无法保存配置到localStorage:', e);
        }
    },
    
    // 加载保存的配置
    loadSavedConfig: function() {
        try {
            const saved = localStorage.getItem('mechConfig');
            if (saved) {
                this.currentConfig = JSON.parse(saved);
                console.log('加载已保存的机甲配置:', this.currentConfig);
                
                // 更新UI
                this.updateUIFromConfig();
            }
        } catch (e) {
            console.warn('无法加载保存的配置:', e);
        }
    },
    
    // 从配置更新UI
    updateUIFromConfig: function() {
        // 更新蓝图选择
        const blueprintItems = document.querySelectorAll('.blueprint-item');
        blueprintItems.forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.blueprintId === this.currentConfig.blueprintId) {
                item.classList.add('selected');
            }
        });
        
        // 更新武器选择
        const primaryWeapon = document.getElementById('primaryWeapon');
        if (primaryWeapon) {
            primaryWeapon.value = this.currentConfig.primaryWeapon;
        }
        
        const secondaryWeapon = document.getElementById('secondaryWeapon');
        if (secondaryWeapon) {
            secondaryWeapon.value = this.currentConfig.secondaryWeapon;
        }
        
        // 更新属性滑块
        const stats = this.currentConfig.stats;
        ['attack', 'defense', 'speed', 'energy'].forEach(stat => {
            const slider = document.getElementById(stat + 'Stat');
            const valueDisplay = document.getElementById(stat + 'Value');
            
            if (slider) {
                slider.value = stats[stat];
            }
            if (valueDisplay) {
                valueDisplay.textContent = stats[stat];
            }
        });
        
        this.updateTotalPoints();
    },
    
    // 显示保存通知
    showSaveNotification: function() {
        // 创建临时通知元素
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 200, 255, 0.9);
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            font-family: 'Orbitron', sans-serif;
            font-size: 1.1rem;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out;
            pointer-events: none;
        `;
        notification.textContent = '✓ 配置已保存';
        
        // 添加关键帧动画
        if (!document.getElementById('notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // 2秒后移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    },
    
    // 获取当前配置
    getConfig: function() {
        return { ...this.currentConfig };
    },
    
    // 获取玩家机甲
    getPlayerMech: function() {
        return MechBlueprints.createMech(
            this.currentConfig.blueprintId,
            {
                primaryWeapon: this.currentConfig.primaryWeapon,
                secondaryWeapon: this.currentConfig.secondaryWeapon,
                stats: this.currentConfig.stats
            }
        );
    }
};

// 导出（如果需要模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomizeManager;
}