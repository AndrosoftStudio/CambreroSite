let scene, camera, renderer, plane;
let obstacles = [];
let trees = [];
let houses = [];
let clouds = [];
let enemies = [];
let bombs = [];
let baseSpeed = 0.1;
let currentSpeed = baseSpeed;
let distance = 0;
let bestDistance = 0;
let bestSpeed = 0;
let gameActive = true;
let targetX = 0;
let touchStartX = 0;
let isPaused = false;
let animationId;
let speedInterval;
let lastObstacleZ = -50;
let laneSequence = 0;
let speed = 0;
let obstaclesAvoided = 0;
let timeSurvived = 0;
let maxSpeed = 0;
let timeInterval;
let boostActive = false;
let brakeActive = false;
let boostCooldown = 0;
let brakeCooldown = 0;
let lastTreeZ = -50;

const obstaclePatterns = [
    [-3, 0], [0, 3], [-3, 3], [-3], [3], [0]
];

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

function initGame() {
    bestDistance = parseFloat(getCookie('bestDistance')) || 0;
    bestSpeed = parseFloat(getCookie('bestSpeed')) || 0;
    updateDistanceDisplay();
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Céu fixo azul claro
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, -10);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    const planeGeometry = new THREE.ConeGeometry(0.3, 1, 32);
    const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 100, specular: 0x555555 });
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = Math.PI / 2;
    scene.add(plane);
    
    const light = new THREE.DirectionalLight(0xffffff, 1); // Luz fixa
    light.position.set(0, 10, 5);
    scene.add(light);
    
    const ambientLight = new THREE.AmbientLight(0x404040); // Ambiente fixo
    scene.add(ambientLight);
    
    const floorGeometry = new THREE.PlaneGeometry(100, 1000, 32, 32);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22, shininess: 30 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    scene.add(floor);
    
    const pathGeometry = new THREE.PlaneGeometry(10, 1000, 32, 32);
    const pathMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513, shininess: 20 });
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    path.rotation.x = -Math.PI / 2;
    path.position.y = -0.49;
    scene.add(path);
    
    addInitialDecorations();
    setupControls();
    animate();
    speedInterval = setInterval(() => {
        if (!isPaused) baseSpeed += 0.03;
    }, 5000);
    timeInterval = setInterval(() => {
        if (!isPaused && gameActive) timeSurvived += 1;
        document.getElementById('timeSurvived').textContent = timeSurvived;
    }, 1000);
}

function setupControls() {
    document.addEventListener('keydown', (event) => {
        if (!gameActive || isPaused) return;
        if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') targetX = Math.max(-3, targetX - 3);
        if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') targetX = Math.min(3, targetX + 3);
        if ((event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') && !boostActive && boostCooldown <= 0) activateBoost();
        if ((event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') && !brakeActive && brakeCooldown <= 0) activateBrake();
    });

    document.addEventListener('touchstart', (event) => {
        touchStartX = event.touches[0].clientX;
    });

    document.addEventListener('touchmove', (event) => {
        if (!gameActive || isPaused) return;
        const diff = event.touches[0].clientX - touchStartX;
        if (Math.abs(diff) > 30) {
            targetX += diff > 0 ? 3 : -3;
            targetX = Math.max(-3, Math.min(3, targetX));
            touchStartX = event.touches[0].clientX;
        }
    });

    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('boostBtn').addEventListener('click', () => { if (!boostActive && boostCooldown <= 0) activateBoost(); });
    document.getElementById('brakeBtn').addEventListener('click', () => { if (!brakeActive && brakeCooldown <= 0) activateBrake(); });
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function activateBoost() {
    boostActive = true;
    boostCooldown = 5;
    setTimeout(() => boostActive = false, 1000);
}

function activateBrake() {
    brakeActive = true;
    brakeCooldown = 5;
    setTimeout(() => brakeActive = false, 1000);
}

function createObstacle() {
    const patternIndex = Math.floor(Math.random() * obstaclePatterns.length);
    const pattern = obstaclePatterns[patternIndex];
    const minDistance = 3;
    
    pattern.forEach((posX) => {
        const geometry = new THREE.BoxGeometry(1.5, 0.3, 0.3, 16, 16, 16);
        const material = new THREE.MeshPhongMaterial({ 
            color: Math.random() > 0.5 ? 0xff4444 : 0xffff00,
            shininess: 50,
            specular: 0x555555
        });
        const obstacle = new THREE.Mesh(geometry, material);
        
        obstacle.position.set(posX, 0.15, lastObstacleZ - minDistance);
        scene.add(obstacle);
        obstacles.push(obstacle);
    });
    
    lastObstacleZ -= minDistance;
}

function addTree(x, z) {
    const treeGroup = new THREE.Group();
    
    const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.25, 1.5, 32);
    const trunkMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513, 
        shininess: 20, 
        specular: 0x222222 
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 0.75, z);
    treeGroup.add(trunk);
    
    for (let i = 0; i < 3; i++) {
        const foliageGeometry = new THREE.SphereGeometry(1 - i * 0.2, 32, 32);
        const foliageMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x228B22, 
            shininess: 30, 
            specular: 0x111111,
            opacity: 0.9,
            transparent: true
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.set(x, 1.5 + i * 0.8, z);
        treeGroup.add(foliage);
    }
    
    scene.add(treeGroup);
    trees.push(treeGroup);
}

function addHouse(x, z) {
    const baseGeometry = new THREE.BoxGeometry(2, 1, 2, 16, 16, 16);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0xA0522D, shininess: 20 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, 0.5, z);
    
    const roofGeometry = new THREE.ConeGeometry(1.5, 1, 16);
    const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x8B0000, shininess: 30 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(x, 1.5, z);
    roof.rotation.y = Math.PI / 4;
    
    scene.add(base);
    scene.add(roof);
    houses.push(base, roof);
}

function addCloud(x, y, z) {
    const cloudGroup = new THREE.Group();
    const baseSize = 1.5 + Math.random() * 1;
    
    for (let i = 0; i < 5; i++) {
        const geometry = new THREE.SphereGeometry(baseSize * (0.6 + Math.random() * 0.4), 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xFFFFFF, 
            transparent: true, 
            opacity: 0.85, // Opacidade fixa
            shininess: 5, 
            specular: 0x333333 
        });
        const cloudPart = new THREE.Mesh(geometry, material);
        cloudPart.position.set(
            x + (Math.random() - 0.5) * baseSize * 2,
            y + (Math.random() - 0.5) * baseSize,
            z + (Math.random() - 0.5) * baseSize * 2
        );
        cloudGroup.add(cloudPart);
    }
    
    scene.add(cloudGroup);
    clouds.push(cloudGroup);
}

function addEnemy(z) {
    const enemyGeometry = new THREE.ConeGeometry(0.5, 1, 32);
    const enemyMaterial = new THREE.MeshPhongMaterial({ color: 0xFF00FF, shininess: 50, specular: 0x555555 });
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemy.rotation.x = Math.PI;
    enemy.position.set(Math.random() * 6 - 3, 2, z);
    scene.add(enemy);
    enemies.push(enemy);
}

function addBomb(x, y, z) {
    const bombGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const bombMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 20 });
    const bomb = new THREE.Mesh(bombGeometry, bombMaterial);
    bomb.position.set(x, y, z);
    scene.add(bomb);
    bombs.push(bomb);
}

function addInitialDecorations() {
    for (let i = -50; i > -500; i -= 30) {
        const offsetX = Math.random() * 8 + 10;
        addTree(-offsetX, i);
        addTree(offsetX, i);
    }
    
    for (let i = -50; i > -500; i -= 50) {
        if (Math.random() < 0.2) {
            addHouse(Math.random() > 0.5 ? 12 : -12, i);
        }
    }
    
    for (let i = -50; i > -200; i -= 25) {
        addCloud(Math.random() * 20 - 10, Math.random() * 5 + 8, i);
    }
}

function updateDecorations() {
    for (let i = trees.length - 1; i >= 0; i--) {
        trees[i].position.z += currentSpeed;
        if (trees[i].position.z > plane.position.z + 100) {
            scene.remove(trees[i]);
            trees.splice(i, 1);
        }
    }
    
    for (let i = houses.length - 1; i >= 0; i -= 2) {
        houses[i].position.z += currentSpeed;
        houses[i-1].position.z += currentSpeed;
        if (houses[i].position.z > plane.position.z + 100) {
            scene.remove(houses[i]);
            scene.remove(houses[i-1]);
            houses.splice(i-1, 2);
        }
    }
    
    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].position.z += currentSpeed * 0.5;
        if (clouds[i].position.z > plane.position.z + 100) {
            scene.remove(clouds[i]);
            clouds.splice(i, 1);
        }
    }
    
    if (trees.length < 20 && (trees.length === 0 || trees[trees.length-1].position.z > lastTreeZ - 30)) {
        const offsetX = Math.random() * 8 + 10;
        addTree(-offsetX, lastTreeZ - 30);
        addTree(offsetX, lastTreeZ - 30);
        lastTreeZ -= 30;
    }
    if (Math.random() < 0.05 && houses.length < 5) {
        addHouse(Math.random() > 0.5 ? 12 : -12, lastObstacleZ - 50);
    }
    if (clouds.length < 15 && (clouds.length === 0 || clouds[clouds.length-1].position.z > -150)) {
        addCloud(Math.random() * 20 - 10, Math.random() * 5 + 8, lastObstacleZ - 25);
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].position.z += currentSpeed * 0.8;
        enemies[i].position.x += Math.sin(distance * 0.1) * 0.05;
        if (Math.random() < 0.05) {
            addBomb(enemies[i].position.x, enemies[i].position.y - 0.5, enemies[i].position.z);
        }
        if (enemies[i].position.z > plane.position.z + 100) {
            scene.remove(enemies[i]);
            enemies.splice(i, 1);
            obstaclesAvoided += 1;
            document.getElementById('obstaclesAvoided').textContent = obstaclesAvoided;
        } else if (Math.abs(enemies[i].position.x - plane.position.x) < 3) {
            enemies[i].position.x += (plane.position.x - enemies[i].position.x) * 0.02;
        }
    }
    
    if (Math.random() < 0.02 && enemies.length < 3) {
        addEnemy(lastObstacleZ - 20);
    }
}

function updateBombs() {
    for (let i = bombs.length - 1; i >= 0; i--) {
        bombs[i].position.z += currentSpeed;
        bombs[i].position.y -= 0.05;
        if (bombs[i].position.z > plane.position.z + 100 || bombs[i].position.y < -0.5) {
            scene.remove(bombs[i]);
            bombs.splice(i, 1);
        }
    }
}

function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].position.z += currentSpeed;
        obstacles[i].rotation.z += 0.1;
        if (obstacles[i].position.z > plane.position.z + 100) {
            scene.remove(obstacles[i]);
            obstacles.splice(i, 1);
            distance += 0.1;
            obstaclesAvoided += 1;
            document.getElementById('obstaclesAvoided').textContent = obstaclesAvoided;
            updateDistanceDisplay();
        }
    }
    
    if (obstacles.length === 0 || obstacles[obstacles.length-1].position.z > -20) {
        createObstacle();
    }
}

function checkCollision() {
    const planeBox = new THREE.Box3().setFromObject(plane);
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacleBox = new THREE.Box3().setFromObject(obstacles[i]);
        if (planeBox.intersectsBox(obstacleBox)) {
            gameOver();
            return;
        }
    }
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemyBox = new THREE.Box3().setFromObject(enemies[i]);
        if (planeBox.intersectsBox(enemyBox)) {
            gameOver();
            return;
        }
    }
    
    for (let i = bombs.length - 1; i >= 0; i--) {
        const bombBox = new THREE.Box3().setFromObject(bombs[i]);
        if (planeBox.intersectsBox(bombBox)) {
            gameOver();
            return;
        }
    }
    
    if (Math.abs(plane.position.x) > 5) {
        for (let i = trees.length - 1; i >= 0; i--) {
            const treeBox = new THREE.Box3().setFromObject(trees[i]);
            if (planeBox.intersectsBox(treeBox)) {
                gameOver();
                return;
            }
        }
    }
}

function gameOver() {
    gameActive = false;
    isPaused = true;
    clearInterval(speedInterval);
    clearInterval(timeInterval);
    cancelAnimationFrame(animationId);
    
    if (distance > bestDistance) {
        bestDistance = distance;
        setCookie('bestDistance', bestDistance, 365);
    }
    if (maxSpeed > bestSpeed) {
        bestSpeed = maxSpeed;
        setCookie('bestSpeed', bestSpeed, 365);
    }
    
    document.getElementById('pauseScreen').classList.add('active');
    document.getElementById('gameOverScreen').classList.add('active');
    document.getElementById('finalDistance').textContent = distance.toFixed(1);
    document.getElementById('maxSpeed').textContent = maxSpeed.toFixed(1);
    document.getElementById('finalTime').textContent = timeSurvived;
    document.getElementById('finalObstacles').textContent = obstaclesAvoided;
    updateDistanceDisplay();
}

function updateDistanceDisplay() {
    const distanceElement = document.getElementById('distance');
    const bestElement = document.getElementById('best');
    const bestSpeedElement = document.getElementById('bestSpeed');
    
    distanceElement.textContent = distance.toFixed(1);
    bestElement.textContent = bestDistance.toFixed(1);
    bestSpeedElement.textContent = bestSpeed.toFixed(1);
}

function togglePause() {
    if (!gameActive) return;
    
    isPaused = !isPaused;
    document.getElementById('pauseScreen').classList.toggle('active', isPaused);
    const pauseIcon = document.querySelector('#pauseBtn .material-icons');
    pauseIcon.textContent = isPaused ? 'play_arrow' : 'pause';
    if (!isPaused) animate();
}

function resetGame() {
    location.reload();
}

function animate() {
    if (!gameActive || isPaused) return;
    
    animationId = requestAnimationFrame(animate);
    
    plane.position.x = THREE.MathUtils.lerp(plane.position.x, targetX, 0.15);
    plane.position.y = 0.5;
    camera.position.x = plane.position.x;
    camera.position.y = plane.position.y + 3;
    camera.position.z = plane.position.z + 5;
    
    let speedModifier = 1;
    if (boostActive) speedModifier = 1.5;
    if (brakeActive) speedModifier = 0.5;
    currentSpeed = baseSpeed * (1 + distance / 5000) * speedModifier;
    
    if (boostCooldown > 0) boostCooldown -= 1/60;
    if (brakeCooldown > 0) brakeCooldown -= 1/60;
    
    updateObstacles();
    updateDecorations();
    updateEnemies();
    updateBombs();
    checkCollision();
    
    speed = currentSpeed * 3600;
    maxSpeed = Math.max(maxSpeed, speed);
    document.getElementById('speedDisplay').textContent = `${speed.toFixed(1)} km/h`;
    
    renderer.render(scene, camera);
}

initGame();