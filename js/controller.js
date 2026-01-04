const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1920;
// 現在の画面状態
let state = 'top';
let howIndex = 0;
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pcHowImg = document.getElementById('pcHowImage');
const arrowL = document.getElementById('arrowLeft');
const arrowR = document.getElementById('arrowRight');
const sidePanel = document.getElementById('pcSidePanel');

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// QRコード生成
let currentURL = window.location.href;

if (currentURL.startsWith('file:')) {
  currentURL = 'https://example.com';
}

document.getElementById('qrCode').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentURL)}`;

const URLS = {
  bg: 'img/pig.png',
  btnPlay: 'img/play.png',
  btnHow: 'img/explanation.png',
  how1: isMobile ? 'img/mobile-first.png' : 'img/pc-first.png',
  how2: isMobile ? 'img/mobile-second.png' : 'img/pc-second.png',
  how3: isMobile ? 'img/mobile-third.png' : 'img/pc-third.png'
};

const images = {};
// 画像を読み込む関数
function loadImage(key, url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => { images[key] = img; resolve(); };
    img.src = url;
  });
}
// 遊び方のページを切り替える関数
function changeHow(dir) {
  howIndex = Math.max(0, Math.min(2, howIndex + dir));
  draw();
}

function draw() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  if (state === 'how') {
    // 「あそびかた」画面の時だけ白くするエフェクト追加
    document.body.style.backgroundColor = "rgba(235, 245, 243, 1)";


    sidePanel.style.display = 'none';
    if (!isMobile) {
      pcHowImg.style.display = 'block';
      // （howIndex）に合わせて、表示する画像を差し替え
      pcHowImg.src = URLS['how' + (howIndex + 1)];
      // 矢印の制御
      arrowL.style.display = (howIndex > 0) ? 'block' : 'none';
      arrowR.style.display = (howIndex < 2) ? 'block' : 'none';
    } else {
      pcHowImg.style.display = 'none';
      arrowL.style.display = 'none'; arrowR.style.display = 'none';
    }
    drawHowUI();
    return;
  }
  document.body.style.backgroundColor = "#bfdfd9";

  pcHowImg.style.display = 'none';
  arrowL.style.display = 'none';
  arrowR.style.display = 'none';

  // TOP画面のみ右下パネルを表示
  if (!isMobile && state === 'top') {
    sidePanel.style.display = 'block';
  } else {
    sidePanel.style.display = 'none';
  }

  drawCoverImage(images.bg);

  if (state === 'top') {
    const bw = 480, bh = 168;
    ctx.drawImage(images.btnPlay, (GAME_WIDTH - bw) / 2, 1200, bw, bh);
    ctx.drawImage(images.btnHow, (GAME_WIDTH - bw) / 2, 1400, bw, bh);
  } else if (state === 'difficulty') drawDifficulty();
  else if (state === 'notice') drawNotice();
}

function drawCoverImage(img) {
  const ir = img.width / img.height;
  const cr = GAME_WIDTH / GAME_HEIGHT;
  let w, h, x = 0, y = 0;
  if (ir > cr) { h = GAME_HEIGHT; w = h * ir; x = (GAME_WIDTH - w) / 2; }
  else { w = GAME_WIDTH; h = w / ir; y = (GAME_HEIGHT - h) / 2; }
  ctx.drawImage(img, x, y, w, h);
}

// 遊び方画面のUI
function drawHowUI() {
  if (isMobile) {
    ctx.fillStyle = "rgba(235, 245, 243, 1)";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    const img = images['how' + (howIndex + 1)];
    if (img) {
      const scale = Math.min(GAME_WIDTH * 0.95 / img.width, GAME_HEIGHT * 0.8 / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (GAME_WIDTH - w) / 2, (GAME_HEIGHT - h) / 2 - 40, w, h);
    }
    ctx.fillStyle = '#668884';
    ctx.font = 'bold 100px sans-serif';
    ctx.textAlign = 'center';
    if (howIndex > 0) ctx.fillText('◀', 80, GAME_HEIGHT / 2);
    if (howIndex < 2) ctx.fillText('▶', GAME_WIDTH - 80, GAME_HEIGHT / 2);
  }
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(GAME_WIDTH / 2 - 60 + i * 60, GAME_HEIGHT * 0.93, 12, 0, Math.PI * 2);
    ctx.fillStyle = (i === howIndex) ? '#ff88aa' : '#b0cfca';
    ctx.fill();
  }
  ctx.fillStyle = '#7e2e37';
  ctx.font = 'bold 45px "MyGameFont", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('× とじる', GAME_WIDTH / 2, GAME_HEIGHT - 60);
}

// 難易度選択画面を描画
let difficultyAreas = [];
function drawDifficulty() {
  const panelX = 130, panelY = 1250, panelW = 820, panelH = 500;
  ctx.fillStyle = '#fff'; ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.fillStyle = '#333'; ctx.textAlign = 'center';
  ctx.font = 'bold 36px "MyGameFont", sans-serif';
  ctx.fillText('むずかしさをえらんでね', GAME_WIDTH / 2, panelY + 80);
  const items = [{ label: 'しょきゅー', level: 'easy' }, { label: 'ちゅーきゅー', level: 'normal' }, { label: 'じょーきゅー', level: 'hard' }, { label: '← もどる', level: 'back' }];
  difficultyAreas = [];
  items.forEach((it, i) => {
    const y = panelY + 170 + i * 90;
    ctx.font = '32px "MyGameFont", sans-serif'; ctx.fillText(it.label, GAME_WIDTH / 2, y);
    difficultyAreas.push({ level: it.level, y: y - 40, h: 60 });
  });
}

// 注意事項画面を描画
let noticeAreas = [];
function drawNotice() {
  const panelX = 130, panelY = 1250, panelW = 820, panelH = 500;
  ctx.fillStyle = '#fff'; ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.fillStyle = '#333'; ctx.textAlign = 'center'; ctx.font = 'bold 36px "MyGameFont", sans-serif';
  ctx.fillText('あそぶまえに', GAME_WIDTH / 2, panelY + 80);
  ctx.font = '28px "MyGameFont", sans-serif'; ctx.fillStyle = '#555';
  const lines = ['・画面の動きで気分が悪くなることがあります', '・まわりの安全に気をつけてあそんでね', '', '※このゲームはフィクションです'];
  lines.forEach((l, i) => ctx.fillText(l, GAME_WIDTH / 2, panelY + 170 + i * 45));
  noticeAreas = [];
  ctx.fillStyle = '#aaaaaa'; ctx.font = 'bold 40px "MyGameFont", sans-serif'; ctx.fillText('← もどる', GAME_WIDTH / 2 - 200, panelY + 430);
  noticeAreas.push({ type: 'back', x1: 150, x2: 500, y1: panelY + 380, y2: panelY + 480 });
  ctx.fillStyle = '#ff88aa'; ctx.font = 'bold 40px "MyGameFont", sans-serif'; ctx.fillText('つぎへ →', GAME_WIDTH / 2 + 200, panelY + 430);
  noticeAreas.push({ type: 'next', x1: 580, x2: 930, y1: panelY + 380, y2: panelY + 480 });
}

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (GAME_WIDTH / rect.width);
  const y = (e.clientY - rect.top) * (GAME_HEIGHT / rect.height);
  if (state === 'top') {
    if (x >= 300 && x <= 780) {
      if (y >= 1200 && y <= 1368) { state = 'difficulty'; draw(); }
      if (y >= 1400 && y <= 1568) { state = 'how'; howIndex = 0; draw(); }
    }
  } else if (state === 'how') {
    if (isMobile) {
      if (x > GAME_WIDTH - 200 && howIndex < 2) changeHow(1);
      else if (x < 200 && howIndex > 0) changeHow(-1);
    }
    if (y > GAME_HEIGHT - 200 || y < 150) { state = 'top'; draw(); }
  } else if (state === 'difficulty') {
    difficultyAreas.forEach(a => {
      if (y >= a.y && y <= a.y + a.h) {
        if (a.level === 'back') { state = 'top'; draw(); }
        else { selectedLevel = a.level; state = 'notice'; draw(); }
      }
    });
  } else if (state === 'notice') {
    noticeAreas.forEach(a => {
      if (x >= a.x1 && x <= a.x2 && y >= a.y1 && y <= a.y2) {
        if (a.type === 'back') { state = 'top'; draw(); }
        else if (a.type === 'next') {
          window.location.href = (isMobile ? 'mobile-' : 'pc-') + selectedLevel + '.html';
        }
      }
    });
  }
});

function resize() {
  const sw = window.innerWidth, sh = window.innerHeight;
  const wr = sw / sh, gr = GAME_WIDTH / GAME_HEIGHT;
  let w, h;
  if (wr > gr) { h = sh; w = h * gr; } else { w = sw; h = w / gr; }
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
}

// 初期化処理
async function init() {
  // フォントの読み込み完了を待ち
  await document.fonts.ready;


  try {
    await document.fonts.load('10px "MyGameFont"');
  } catch (e) {
    console.error("フォントのロードに失敗しました", e);
  }

  // 画像の読み込みを待つ
  await Promise.all([
    loadImage('bg', URLS.bg),
    loadImage('btnPlay', URLS.btnPlay),
    loadImage('btnHow', URLS.btnHow),
    loadImage('how1', URLS.how1),
    loadImage('how2', URLS.how2),
    loadImage('how3', URLS.how3)
  ]);

  // 画面サイズを調整して描画
  window.addEventListener('resize', () => { resize(); draw(); });
  resize();
  draw();
}
init();

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // ダイアログを出して、OKならタイトルへ、キャンセルならそのまま
        if (confirm('タイトルにもどりますか？')) {
            location.href = 'index.html';
        }
    }
});