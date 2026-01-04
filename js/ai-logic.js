import { gameState, target } from "./game-core.js";
import * as THREE from "three";
// ぶたしゃまの気まぐれな移動方向
let wanderAngle = 0;

export const AI = {
  easy: (delta, now, dist, norm, inOut, inIn, vel, setUI) => {
    const pwr = (12.0 / Math.max(1, dist)) * (inOut ? 1.6 : 0.6);
    // ランダムに方向を変えて「うろうろ」させる
    wanderAngle += (Math.random() - 0.5) * 0.4;
    vel.add(new THREE.Vector3(Math.cos(wanderAngle), 0, Math.sin(wanderAngle)).multiplyScalar(24 * delta));
    vel.add(norm.multiplyScalar(pwr * 55 * delta));
    // スコア加算処理（中心に近いほどボーナス）
    if (inIn) { setUI(2); gameState.score += delta * 150 * Math.pow(22 / Math.max(2, dist), 2.2); }
    else if (inOut) { setUI(1); gameState.score += delta * 40; }
    else setUI(0);
    vel.multiplyScalar(0.93);
    target.position.addScaledVector(vel, delta);
    target.position.y = 1.5;
  },

  normal: (delta, now, dist, norm, inOut, inIn, vel, setUI) => {
    const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), norm).normalize();
    if (inOut) {
      gameState.captureTimer += delta;
      vel.addScaledVector(norm, Math.min(gameState.captureTimer * 10, 28) * delta);
      // 横に揺れながら逃げる（ジグザグ走行）
      vel.addScaledVector(side, Math.sin(now * 0.0006) * 22 * delta);
      if (gameState.captureTimer > 2.8) { vel.addScaledVector(vel.clone().normalize(), 14); gameState.captureTimer = 0; }
      if (inIn) { setUI(2); gameState.score += delta * 180 * Math.pow(22 / Math.max(2, dist), 2.2); }
      else { setUI(1); gameState.score += delta * 50; }
    } else {
      setUI(0); gameState.captureTimer = Math.max(0, gameState.captureTimer - delta * 0.4);
      wanderAngle += (Math.random() - 0.5) * 0.05;
      vel.add(new THREE.Vector3(Math.cos(wanderAngle), 0, Math.sin(wanderAngle)).multiplyScalar(0.3));
    }
    vel.multiplyScalar(0.98);
    target.position.addScaledVector(vel, delta);
    target.position.y = 1.5;
  },

  hard: (delta, now, dist, norm, inOut, inIn, vel, setUI) => {
    const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), norm).normalize();
    if (inOut) {
      gameState.captureTimer += delta;
      vel.addScaledVector(norm, Math.min(gameState.captureTimer * 12, 30) * delta);
      vel.addScaledVector(side, Math.sin(now * 0.0006) * 25 * delta);
      // 上下にもふわふわ動く
      vel.y += Math.sin(now * 0.001) * 10 * delta;
      if (gameState.captureTimer > 2.5) { vel.addScaledVector(vel.clone().normalize(), 16); gameState.captureTimer = 0; }
      if (inIn) { setUI(2); gameState.score += delta * 200 * Math.pow(22 / Math.max(2, dist), 2.2); }
      else { setUI(1); gameState.score += delta * 60; }
    } else {
      setUI(0); gameState.captureTimer = Math.max(0, gameState.captureTimer - delta * 0.5);
      // 元の高さ(1.5)に戻ろうとする力
      vel.y += (1.5 - target.position.y) * delta;
    }
    // 高すぎる・低すぎる場合の制限
    if (target.position.y < 1.0) vel.y += 3.0 * delta;
    if (target.position.y > 12.0) vel.y -= 3.0 * delta;
    vel.multiplyScalar(0.98);
    target.position.addScaledVector(vel, delta);
  }
};