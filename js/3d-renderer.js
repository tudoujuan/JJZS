/**
 * 3D渲染器
 * 使用Three.js实现WebGL 3D场景渲染
 */

class ThreeDRenderer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        this.clock = null;
        
        // 机甲模型
        this.mechs = [];
        
        // 灯光
        this.ambientLight = null;
        this.directionalLight = null;
        
        // 地面
        this.ground = null;
        
        // 天空盒
        this.skybox = null;
        
        // 粒子系统
        this.particleSystem = null;
        
        // 弹道管理器
        this.projectileManager = null;
        
        // 相机控制
        this.cameraControls = {
            target: null,
            offset: new THREE.Vector3(0, 10, 20),
            rotation: 0,
            rotationSpeed: 0.01,
            isOrbiting: false,
            orbitTarget: null
        };
        
        // 动画
        this.animations = [];
    }
    
    // 初始化渲染器
    init(canvasElement, isCustomizeMode = false) {
        this.canvas = canvasElement;
        
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(GameConfig.visuals.fogColor);
        this.scene.fog = new THREE.Fog(
            GameConfig.visuals.fogColor,
            GameConfig.visuals.fogNear,
            GameConfig.visuals.fogFar
        );
        
        // 创建相机
        const aspect = canvasElement.clientWidth / canvasElement.clientHeight;
        if (isCustomizeMode) {
            this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
            this.camera.position.set(0, 5, 15);
            this.camera.lookAt(0, 3, 0);
        } else {
            this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
            this.camera.position.set(0, 20, 40);
            this.camera.lookAt(0, 0, 0);
        }
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvasElement,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // 创建时钟
        this.clock = new THREE.Clock();
        
        // 初始化灯光
        this.initLights();
        
        // 初始化地面
        if (!isCustomizeMode) {
            this.initGround();
            this.initEnvironment();
        }
        
        // 初始化粒子系统
        this.particleSystem = new ParticleSystem(this.scene);
        
        // 初始化弹道管理器
        this.projectileManager = new ProjectileManager();
        
        // 窗口大小调整事件
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('3D渲染器初始化完成');
    }
    
    // 初始化灯光
    initLights() {
        // 环境光
        this.ambientLight = new THREE.AmbientLight(
            GameConfig.visuals.ambientLight,
            0.5
        );
        this.scene.add(this.ambientLight);
        
        // 方向光（主光源）
        this.directionalLight = new THREE.DirectionalLight(
            GameConfig.visuals.directionalLight,
            1.0
        );
        this.directionalLight.position.set(50, 100, 50);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -100;
        this.directionalLight.shadow.camera.right = 100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;
        this.scene.add(this.directionalLight);
        
        // 补充光源
        const fillLight = new THREE.DirectionalLight(0x6688ff, 0.3);
        fillLight.position.set(-50, 50, -50);
        this.scene.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0xff6688, 0.2);
        rimLight.position.set(0, 100, -100);
        this.scene.add(rimLight);
    }
    
    // 初始化地面
    initGround() {
        // 创建地面网格
        const groundGeometry = new THREE.PlaneGeometry(400, 400, 50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.3,
            roughness: 0.8,
            emissive: 0x0a0a1a,
            emissiveIntensity: 0.2
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        
        // 添加网格线
        const gridHelper = new THREE.GridHelper(400, 50, 0x0066ff, 0x003366);
        gridHelper.position.y = 0.01;
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
        
        // 添加竞技场边界
        const boundaryGeometry = new THREE.RingGeometry(95, 100, 64);
        const boundaryMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
        boundary.rotation.x = -Math.PI / 2;
        boundary.position.y = 0.02;
        this.scene.add(boundary);
    }
    
    // 初始化环境
    initEnvironment() {
        // 添加装饰性物体
        const addDecorativeObject = (position, size, color) => {
            const geometry = new THREE.OctahedronGeometry(size, 0);
            const material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.8,
                roughness: 0.2,
                emissive: color,
                emissiveIntensity: 0.3
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.animations.push({
                mesh: mesh,
                baseY: position.y,
                rotationSpeed: 0.5 + Math.random() * 0.5
            });
        };
        
        // 随机放置一些装饰
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const radius = 60 + Math.random() * 30;
            const position = new THREE.Vector3(
                Math.cos(angle) * radius,
                2 + Math.random() * 5,
                Math.sin(angle) * radius
            );
            const size = 1 + Math.random() * 3;
            const colors = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff88];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            addDecorativeObject(position, size, color);
        }
    }
    
    // 创建机甲模型
    createMechModel(mechData) {
        const mechGroup = new THREE.Group();
        mechGroup.name = 'Mech_' + mechData.id;
        
        const modelConfig = mechData.modelConfig || MechBlueprints.default.modelConfig;
        const materialConfig = modelConfig.material || {
            color: mechData.color || 0x4488ff,
            metalness: 0.7,
            roughness: 0.3
        };
        
        // 创建机甲材质
        const mechMaterial = new THREE.MeshStandardMaterial({
            color: materialConfig.color,
            metalness: materialConfig.metalness,
            roughness: materialConfig.roughness,
            emissive: materialConfig.emissive || materialConfig.color,
            emissiveIntensity: materialConfig.emissiveIntensity || 0.1
        });
        
        const accentMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0xffffff,
            emissiveIntensity: 0.1
        });
        
        // 身体
        const bodyScale = modelConfig.bodyScale || { x: 1, y: 1.2, z: 0.8 };
        const bodyGeometry = new THREE.BoxGeometry(
            bodyScale.x * 2,
            bodyScale.y * 2,
            bodyScale.z * 2
        );
        const body = new THREE.Mesh(bodyGeometry, mechMaterial);
        body.position.y = 3;
        body.castShadow = true;
        body.receiveShadow = true;
        mechGroup.add(body);
        
        // 头部
        const headScale = modelConfig.headScale || { x: 0.6, y: 0.6, z: 0.6 };
        const headGeometry = new THREE.BoxGeometry(
            headScale.x * 2,
            headScale.y * 2,
            headScale.z * 2
        );
        const head = new THREE.Mesh(headGeometry, mechMaterial);
        head.position.y = 3 + bodyScale.y * 2 + headScale.y;
        head.castShadow = true;
        mechGroup.add(head);
        
        // 眼睛（发光效果）
        const eyeGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.1);
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1.0
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.4, head.position.y, headScale.z * 2);
        mechGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.4, head.position.y, headScale.z * 2);
        mechGroup.add(rightEye);
        
        // 四肢
        const limbScale = modelConfig.limbScale || { x: 0.3, y: 1.0, z: 0.3 };
        
        // 左臂
        const armGeometry = new THREE.BoxGeometry(
            limbScale.x * 2,
            limbScale.y * 2,
            limbScale.z * 2
        );
        
        const leftArm = new THREE.Mesh(armGeometry, mechMaterial);
        leftArm.position.set(
            -(bodyScale.x * 2 + limbScale.x),
            3 + bodyScale.y,
            0
        );
        leftArm.castShadow = true;
        mechGroup.add(leftArm);
        
        // 右臂
        const rightArm = new THREE.Mesh(armGeometry, mechMaterial);
        rightArm.position.set(
            bodyScale.x * 2 + limbScale.x,
            3 + bodyScale.y,
            0
        );
        rightArm.castShadow = true;
        mechGroup.add(rightArm);
        
        // 左腿
        const legGeometry = new THREE.BoxGeometry(
            limbScale.x * 2,
            limbScale.y * 2,
            limbScale.z * 2
        );
        
        const leftLeg = new THREE.Mesh(legGeometry, mechMaterial);
        leftLeg.position.set(
            -bodyScale.x,
            limbScale.y,
            0
        );
        leftLeg.castShadow = true;
        mechGroup.add(leftLeg);
        
        // 右腿
        const rightLeg = new THREE.Mesh(legGeometry, mechMaterial);
        rightLeg.position.set(
            bodyScale.x,
            limbScale.y,
            0
        );
        rightLeg.castShadow = true;
        mechGroup.add(rightLeg);
        
        // 武器挂载点
        const weaponMountLeft = new THREE.Object3D();
        weaponMountLeft.position.copy(leftArm.position);
        weaponMountLeft.position.y -= limbScale.y;
        weaponMountLeft.name = 'WeaponMount_Left';
        mechGroup.add(weaponMountLeft);
        
        const weaponMountRight = new THREE.Object3D();
        weaponMountRight.position.copy(rightArm.position);
        weaponMountRight.position.y -= limbScale.y;
        weaponMountRight.name = 'WeaponMount_Right';
        mechGroup.add(weaponMountRight);
        
        // 护盾效果（用于防御技能）
        const shieldGeometry = new THREE.SphereGeometry(5, 32, 32);
        const shieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide,
            wireframe: true
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.name = 'Shield';
        shield.visible = false;
        mechGroup.add(shield);
        
        // 爆气效果
        const burstGeometry = new THREE.SphereGeometry(6, 32, 32);
        const burstMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide
        });
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        burst.name = 'BurstEffect';
        burst.visible = false;
        mechGroup.add(burst);
        
        // 保存引用
        mechGroup.userData = {
            mechData: mechData,
            parts: {
                body: body,
                head: head,
                leftArm: leftArm,
                rightArm: rightArm,
                leftLeg: leftLeg,
                rightLeg: rightLeg,
                shield: shield,
                burst: burst,
                leftEye: leftEye,
                rightEye: rightEye
            },
            material: mechMaterial,
            animationTime: 0,
            isMoving: false,
            isHit: false,
            hitFlashTime: 0
        };
        
        this.scene.add(mechGroup);
        this.mechs.push(mechGroup);
        
        return mechGroup;
    }
    
    // 创建武器模型
    createWeaponModel(weaponId, mountPoint) {
        const weaponType = WeaponSystem.weaponTypes[weaponId];
        if (!weaponType || weaponType === 'none') return null;
        
        const config = GameConfig.weapons[weaponType];
        if (!config) return null;
        
        let geometry, material;
        
        switch (weaponType) {
            case 'plasmaCannon':
            case 'plasmaPistol':
                geometry = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8);
                geometry.rotateX(Math.PI / 2);
                material = new THREE.MeshStandardMaterial({
                    color: config.color,
                    metalness: 0.8,
                    roughness: 0.2,
                    emissive: config.color,
                    emissiveIntensity: 0.3
                });
                break;
                
            case 'laserRifle':
                geometry = new THREE.BoxGeometry(0.1, 0.1, 2);
                material = new THREE.MeshStandardMaterial({
                    color: 0xcc0000,
                    metalness: 0.9,
                    roughness: 0.1
                });
                break;
                
            case 'missileLauncher':
                geometry = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 8);
                geometry.rotateX(Math.PI / 2);
                material = new THREE.MeshStandardMaterial({
                    color: 0x444444,
                    metalness: 0.7,
                    roughness: 0.3
                });
                break;
                
            case 'shotgun':
                geometry = new THREE.BoxGeometry(0.15, 0.15, 1.2);
                material = new THREE.MeshStandardMaterial({
                    color: 0x886644,
                    metalness: 0.6,
                    roughness: 0.4
                });
                break;
                
            case 'gatling':
                geometry = new THREE.CylinderGeometry(0.2, 0.2, 1.0, 6);
                geometry.rotateX(Math.PI / 2);
                material = new THREE.MeshStandardMaterial({
                    color: 0x333333,
                    metalness: 0.8,
                    roughness: 0.2
                });
                break;
                
            default:
                geometry = new THREE.BoxGeometry(0.2, 0.2, 1);
                material = new THREE.MeshStandardMaterial({
                    color: config.color,
                    metalness: 0.7,
                    roughness: 0.3
                });
        }
        
        const weaponMesh = new THREE.Mesh(geometry, material);
        weaponMesh.position.z = 1;
        weaponMesh.castShadow = true;
        
        if (mountPoint) {
            mountPoint.add(weaponMesh);
        }
        
        return weaponMesh;
    }
    
    // 更新机甲模型
    updateMechModel(mechGroup, mechData, deltaTime) {
        if (!mechGroup || !mechGroup.userData) return;
        
        const userData = mechGroup.userData;
        const parts = userData.parts;
        
        // 更新位置
        if (mechData.position) {
            mechGroup.position.copy(mechData.position);
        }
        
        // 更新旋转
        if (mechData.rotation !== undefined) {
            mechGroup.rotation.y = mechData.rotation;
        }
        
        // 更新动画时间
        userData.animationTime += deltaTime;
        
        // 移动动画
        if (mechData.isMoving) {
            const walkSpeed = 10;
            const walkAmount = Math.sin(userData.animationTime * walkSpeed) * 0.1;
            
            if (parts.leftArm) parts.leftArm.rotation.x = walkAmount;
            if (parts.rightArm) parts.rightArm.rotation.x = -walkAmount;
            if (parts.leftLeg) parts.leftLeg.rotation.x = -walkAmount;
            if (parts.rightLeg) parts.rightLeg.rotation.x = walkAmount;
        } else {
            // 重置姿势
            if (parts.leftArm) parts.leftArm.rotation.x *= 0.95;
            if (parts.rightArm) parts.rightArm.rotation.x *= 0.95;
            if (parts.leftLeg) parts.leftLeg.rotation.x *= 0.95;
            if (parts.rightLeg) parts.rightLeg.rotation.x *= 0.95;
        }
        
        // 击中闪光效果
        if (mechData.isHit || userData.isHit) {
            userData.hitFlashTime = GameConfig.mech.hitFlashDuration;
            userData.isHit = true;
            mechData.isHit = false;
        }
        
        if (userData.hitFlashTime > 0) {
            userData.hitFlashTime -= deltaTime;
            
            const flashIntensity = Math.sin(userData.hitFlashTime * 20) * 0.5 + 0.5;
            
            if (userData.material) {
                userData.material.emissiveIntensity = 0.5 + flashIntensity * 0.5;
            }
            
            if (parts.leftEye) {
                parts.leftEye.material.emissiveIntensity = 1.0 + flashIntensity * 2.0;
            }
            if (parts.rightEye) {
                parts.rightEye.material.emissiveIntensity = 1.0 + flashIntensity * 2.0;
            }
            
            if (userData.hitFlashTime <= 0) {
                userData.isHit = false;
                if (userData.material) {
                    userData.material.emissiveIntensity = 0.1;
                }
            }
        }
        
        // 护盾效果
        if (parts.shield) {
            if (mechData.isShieldActive) {
                parts.shield.visible = true;
                parts.shield.material.opacity = 0.2 + Math.sin(Date.now() * 0.005) * 0.1;
            } else {
                parts.shield.visible = false;
                parts.shield.material.opacity = 0;
            }
        }
        
        // 爆气效果
        if (parts.burst) {
            if (mechData.isBurstActive) {
                parts.burst.visible = true;
                parts.burst.material.opacity = 0.15 + Math.sin(Date.now() * 0.01) * 0.05;
                parts.burst.rotation.y += deltaTime * 2;
            } else {
                parts.burst.visible = false;
                parts.burst.material.opacity = 0;
            }
        }
        
        // 死亡效果
        if (!mechData.isAlive) {
            mechGroup.visible = false;
        }
    }
    
    // 设置相机目标
    setCameraTarget(target, offset = null) {
        this.cameraControls.target = target;
        if (offset) {
            this.cameraControls.offset.copy(offset);
        }
    }
    
    // 旋转相机
    rotateCamera(delta) {
        this.cameraControls.rotation += delta;
    }
    
    // 重置相机
    resetCamera() {
        this.cameraControls.rotation = 0;
        this.cameraControls.offset.set(0, 10, 20);
    }
    
    // 更新相机
    updateCamera() {
        if (this.cameraControls.target) {
            const target = this.cameraControls.target;
            const offset = this.cameraControls.offset.clone();
            
            // 应用旋转
            offset.applyAxisAngle(
                new THREE.Vector3(0, 1, 0),
                this.cameraControls.rotation
            );
            
            // 设置相机位置
            const desiredPosition = target.clone().add(offset);
            this.camera.position.lerp(desiredPosition, 0.1);
            
            // 看向目标
            this.camera.lookAt(target.clone().add(new THREE.Vector3(0, 3, 0)));
        }
    }
    
    // 更新场景
    update(deltaTime, mechs = []) {
        // 更新相机
        this.updateCamera();
        
        // 更新机甲模型
        mechs.forEach(mech => {
            const mechGroup = this.findMechGroupById(mech.id);
            if (mechGroup) {
                this.updateMechModel(mechGroup, mech, deltaTime);
            }
        });
        
        // 更新弹道
        if (this.projectileManager) {
            this.projectileManager.update(deltaTime, mechs, this.scene, this.particleSystem);
        }
        
        // 更新粒子
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime);
        }
        
        // 更新装饰动画
        this.animations.forEach(anim => {
            if (anim.mesh) {
                anim.mesh.rotation.y += anim.rotationSpeed * deltaTime;
                anim.mesh.position.y = anim.baseY + Math.sin(Date.now() * 0.001) * 0.5;
            }
        });
    }
    
    // 渲染
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // 窗口大小调整
    onWindowResize() {
        if (!this.canvas || !this.camera || !this.renderer) return;
        
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }
    
    // 根据ID查找机甲组
    findMechGroupById(mechId) {
        return this.mechs.find(group => 
            group.userData && 
            group.userData.mechData && 
            group.userData.mechData.id === mechId
        );
    }
    
    // 移除机甲
    removeMech(mechId) {
        const index = this.mechs.findIndex(group => 
            group.userData && 
            group.userData.mechData && 
            group.userData.mechData.id === mechId
        );
        
        if (index !== -1) {
            const group = this.mechs[index];
            this.scene.remove(group);
            this.mechs.splice(index, 1);
        }
    }
    
    // 清空场景
    clear() {
        // 移除所有机甲
        this.mechs.forEach(group => {
            this.scene.remove(group);
        });
        this.mechs = [];
        
        // 清空粒子和弹道
        if (this.particleSystem) {
            this.particleSystem.clear();
        }
        if (this.projectileManager) {
            this.projectileManager.clear();
        }
    }
    
    // 销毁
    dispose() {
        this.clear();
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        window.removeEventListener('resize', this.onWindowResize);
    }
}

// 创建全局渲染器实例（用于UI界面）
const ThreeDRendererInstance = new ThreeDRenderer();

// 导出（如果需要模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ThreeDRenderer,
        ThreeDRendererInstance
    };
}