import * as THREE from "three";
import { PointerLockControls } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/PointerLockControls.js";
// GLTF読み込み用のローダーを追加
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/GLTFLoader.js";

// ゲーム変数
export const config = { PLAY_TIME: 30, scoreGoal: 20000 };
export let gameState = { remainingTime: 30, score: 0, isPlaying: false, isFinished: false, captureTimer: 0 };

// DOM要素
const els = {
  overlay: document.getElementById("overlay"),
  hud: document.getElementById("hud"),
  frame: document.getElementById("frame"),
  bonusMsg: document.getElementById("bonus-msg"),
  score: document.getElementById("score"),
  timeLeft: document.getElementById("timeLeft"),
  gaugeFill: document.getElementById("gaugeFill"),
  flash: document.getElementById("flash")
};

// --- Three.js セットアップ ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb8d8d4);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ライト
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshBasicMaterial({ color: 0xa8c8c4 }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// ぶたしゃま）の設定 
export const target = new THREE.Group();
target.position.set(0, 1.5, -12);
target.visible = false;
scene.add(target);

// GLBモデルの読み込み
const loader = new GLTFLoader();
loader.load('./glb/pig.glb', (gltf) => {
  const model = gltf.scene;

  // モデルのサイズや向きを調整
  model.scale.set(1.5, 1.5, 1.5);
  // プレイヤーの方を向かせるための調整
  model.rotation.y = Math.PI; 
  

  target.add(model);
  console.log("モデルの読み込みが完了しました");
}, undefined, (error) => {
  console.error("モデルの読み込みに失敗しました:", error);
});

const controls = new PointerLockControls(camera, renderer.domElement);
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// --- スタート関数 ---
window.startGame = () => {
  controls.lock();
  document.getElementById("start-menu").style.display = "none";
  document.getElementById("msg").textContent = "じゅんびは いい？";
  setTimeout(() => {
    document.getElementById("msg").textContent = "すたーと！";
    setTimeout(() => {
      els.overlay.style.display = "none";
      els.hud.style.display = "flex";
      els.frame.style.display = "block";
      target.visible = true;
      gameState.isPlaying = true;
    }, 500);
  }, 1000);
};

function updateFrameVisuals(level) {
  els.frame.style.borderColor = level === 2 ? "#ffcc00" : (level === 1 ? "#ff88aa" : "rgba(255,255,255,0.8)");
  els.bonusMsg.style.opacity = level === 2 ? "1" : "0";
  els.frame.style.transform = level === 2 ? "translate(-50%, -50%) scale(1.05)" : "translate(-50%, -50%) scale(1.0)";
}

function endGame() {
  gameState.isFinished = true;
  controls.unlock();
  target.visible = false;

  els.hud.style.display = "none";
  els.frame.style.display = "none";

  document.getElementById("start-menu").style.display = "none";
  els.overlay.style.display = "flex";

  const finalScore = Math.floor(gameState.score);
  const msgEl = document.getElementById("msg");
  if (msgEl) {
    msgEl.innerHTML = `
      <div style="color: #7a9a96; font-size: 18px; margin-bottom: 5px;">こんかいのきろく</div>
      <div style="font-size: 48px; color: #ff6699; font-weight: bold; text-shadow: 2px 2px 0 white;">${finalScore}<span style="font-size:24px;"> pts</span></div>
    `;
  }

  const endMenu = document.getElementById("end-menu");
  if (endMenu) endMenu.style.display = "flex";

  const scoreInput = document.getElementById("scoreInput");
  const nameInput = document.getElementById("nameInput");
  const saveBtn = document.getElementById("saveBtn");

  if (scoreInput) scoreInput.value = finalScore;
  if (nameInput && localStorage.getItem("name")) {
    nameInput.value = localStorage.getItem("name");
  }

  if (saveBtn) {
    saveBtn.onclick = function () {
      const name = nameInput.value.trim() || "ななしのぶたしゃま";
      localStorage.setItem("name", name);
      localStorage.setItem("score", finalScore);
      // ステージ名を取得
      const path = window.location.pathname;
      const stageName = path.split('/').pop().replace('.html', '');

      // ランキングページへ移動（パラメータを付与）
      location.href = "./result.html?stage=" + stageName;
    };
    saveBtn.onmousedown = () => saveBtn.style.transform = "translateY(2px)";
    saveBtn.onmouseup = () => saveBtn.style.transform = "translateY(0px)";
  }

  els.flash.style.opacity = 1;
  setTimeout(() => {
    els.flash.style.transition = "opacity 1.5s";
    els.flash.style.opacity = 0;
  }, 50);
}

// --- アニメーションループ ---
let vel = new THREE.Vector3(), prev = performance.now();

export function startLoop(aiLogicFunc, goal) {
  config.scoreGoal = goal;
  function animate(now) {
    requestAnimationFrame(animate);
    const delta = (now - prev) / 1000; prev = now;
    if (!gameState.isPlaying || gameState.isFinished) { renderer.render(scene, camera); return; }

    gameState.remainingTime -= delta;
    if (gameState.remainingTime <= 0) endGame();
    els.timeLeft.textContent = Math.max(0, gameState.remainingTime).toFixed(1);
    els.score.textContent = Math.floor(gameState.score);

    const progress = Math.min((gameState.score / config.scoreGoal) * 100, 100);
    els.gaugeFill.style.width = progress + "%";
    if (progress >= 100) els.gaugeFill.classList.add("maxed");

    const toTarget = new THREE.Vector3().subVectors(target.position, camera.position);
    const dist = toTarget.length(), norm = toTarget.clone().normalize();
    const view = new THREE.Vector3(); camera.getWorldDirection(view);
    const dot = view.dot(norm);

    const fSize = Math.max(80, Math.min(230, 230 * (10 / dist)));
    els.frame.style.width = fSize + "px"; els.frame.style.height = (fSize * 0.82) + "px";
    const inOut = dot > (1.0 - (0.04 * (fSize / 230))), inIn = dot > (1.0 - (0.04 * (fSize / 230)) + 0.015) && dist < 18;

    if (controls.isLocked) {
      const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
      const side = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
      const b = inOut ? 1.6 : 1.0;
      if (keys.KeyW) controls.getObject().position.addScaledVector(fwd, 13 * b * delta);
      if (keys.KeyS) controls.getObject().position.addScaledVector(fwd, -13 * delta);
      if (keys.KeyA) controls.getObject().position.addScaledVector(side, -13 * delta);
      if (keys.KeyD) controls.getObject().position.addScaledVector(side, 13 * delta);
    }

    aiLogicFunc(delta, now, dist, norm, inOut, inIn, vel, updateFrameVisuals);

   
    

    renderer.render(scene, camera);
  }
  animate(performance.now());
}