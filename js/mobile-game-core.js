let score = 0;
let timeLeft = 30.0;
let isPlaying = false;

window.gameSettings = {
    difficulty: 'easy',
    scoreGoal: 15000
};

// --- ゲーム開始（画面の出し入れを確実にする） ---
function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('end-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    
    if (document.getElementById('screen-edge-guide')) document.getElementById('screen-edge-guide').style.display = 'block';
    if (document.getElementById('center-frame')) document.getElementById('center-frame').style.display = 'block';
    
    isPlaying = true;
}

// --- 終了処理 ---
function showResult() {
    if (!isPlaying) return;
    isPlaying = false;

    document.getElementById('hud').style.display = 'none';
    if (document.getElementById('screen-edge-guide')) document.getElementById('screen-edge-guide').style.display = 'none';
    if (document.getElementById('center-frame')) document.getElementById('center-frame').style.display = 'none';

    const end = document.getElementById('end-screen');
    end.style.display = 'flex'; 

    const finalScoreValue = Math.floor(score);
    document.getElementById('final-score').innerText = finalScoreValue;

    const nameInput = document.getElementById("nameInput");
    const scoreInput = document.getElementById("scoreInput");
    const saveBtn = document.getElementById("saveBtn");

    if (scoreInput) scoreInput.value = finalScoreValue;
    if (nameInput && localStorage.getItem("name")) {
        nameInput.value = localStorage.getItem("name");
    }

    if (saveBtn) {
        saveBtn.onclick = function () {
            const name = nameInput.value.trim() || "ななしのぶたしゃま";
            localStorage.setItem("name", name);
            localStorage.setItem("score", finalScoreValue);
            const path = window.location.pathname;
            const stageName = path.split('/').pop().replace('.html', '');
            location.href = "./result.html?stage=" + stageName;
        };
    }
}

// --- 動きの制御（変更なし） ---
AFRAME.registerComponent('move-world', {
    init: function () { this.time = 0; },
    tick: function (t, dt) {
        if (!isPlaying) return;
        let delta = dt / 1000;
        if (window.gameSettings.difficulty === 'easy') {
            this.time += delta * 0.38;
            this.el.setAttribute('position', { x: Math.sin(this.time) * 1.8, y: 0.4 + Math.sin(this.time * 0.5) * 0.2, z: -3.5 + Math.cos(this.time * 0.7) * 1.2 });
        } else if (window.gameSettings.difficulty === 'normal') {
            this.time += delta * 0.65;
            const x = Math.sin(this.time) * 2.3 + Math.cos(this.time * 2.1) * 0.6;
            const y = 0.6 + Math.sin(this.time * 1.4) * 0.9 + Math.cos(this.time * 0.7) * 0.4;
            const z = -4.0 + Math.cos(this.time * 1.1) * 2.0;
            this.el.setAttribute('position', { x, y, z });
        } else if (window.gameSettings.difficulty === 'hard') {
            this.time += delta * 1.5;
            const x = Math.sin(this.time * 0.9) * 2.5 + Math.sin(this.time * 2.1) * 0.8;
            const y = 0.8 + Math.cos(this.time * 1.3) * 1.2 + Math.sin(this.time * 2.8) * 0.4;
            const z = -3.5 + Math.sin(this.time * 0.7) * 1.5 + Math.cos(this.time * 1.9) * 0.6;
            this.el.setAttribute('position', { x, y, z });
        }
        this.el.object3D.lookAt(0, 0, 0);
    }
});

// --- 判定ロジック（変更なし） ---
AFRAME.registerComponent('game-manager', {
    init: function () {
        this.vector = new THREE.Vector3();
        this.cameraDir = new THREE.Vector3();
        this.toTarget = new THREE.Vector3();
        this.edge = document.getElementById('screen-edge-guide');
        this.center = document.getElementById('center-frame');
        this.bonusMsg = document.getElementById('bonus-msg');
        this.gaugeFill = document.getElementById('gaugeFill');
    },
    tick: function (t, dt) {
        if (!isPlaying) return;
        let delta = dt / 1000;
        timeLeft -= delta;
        const cameraEl = this.el.sceneEl.camera.el;
        const camera = this.el.sceneEl.camera;
        if (!camera || !cameraEl) return;
        this.el.object3D.updateWorldMatrix(true, false);
        this.el.object3D.getWorldPosition(this.vector);
        cameraEl.object3D.getWorldDirection(this.cameraDir);
        this.cameraDir.multiplyScalar(-1);
        this.toTarget.copy(this.vector).sub(cameraEl.object3D.position).normalize();
        const dot = this.cameraDir.dot(this.toTarget);
        const isForward = dot > 0.6;
        this.vector.project(camera);
        const limit = 0.85;
        const centerLimit = 0.22;
        const inScreen = isForward && Math.abs(this.vector.x) < limit && Math.abs(this.vector.y) < limit;
        const inCenter = isForward && Math.abs(this.vector.x) < centerLimit && Math.abs(this.vector.y) < centerLimit;

        if (inCenter) {
            score += delta * 1500;
            if(this.edge) this.edge.classList.add('active');
            if(this.center) this.center.classList.add('perfect');
            if(this.bonusMsg) this.bonusMsg.style.opacity = "1";
        } else if (inScreen) {
            score += delta * 400;
            if(this.edge) this.edge.classList.add('active');
            if(this.center) this.center.classList.remove('perfect');
            if(this.bonusMsg) this.bonusMsg.style.opacity = "0";
        } else {
            if(this.edge) this.edge.classList.remove('active');
            if(this.center) this.center.classList.remove('perfect');
            if(this.bonusMsg) this.bonusMsg.style.opacity = "0";
        }
        document.getElementById('score-val').innerText = Math.floor(score);
        document.getElementById('timeLeft').innerText = Math.max(0, timeLeft).toFixed(1);
        let progress = Math.min((score / window.gameSettings.scoreGoal) * 100, 100);
        if(this.gaugeFill) {
            this.gaugeFill.style.width = progress + "%";
            if (progress >= 100) this.gaugeFill.classList.add('maxed');
        }
        if (timeLeft <= 0) showResult();
    }
});