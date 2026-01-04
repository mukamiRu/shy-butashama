document.addEventListener('keydown', function (e) {
  // Qキーが押された瞬間
  if ((e.key === 'q' || e.key === 'Q' || e.key === 'Escape') && 
      document.getElementById('hud').style.display !== 'none') {
    
    // 確認アラートを出さずに、すぐタイトルへ
    window.location.href = 'index.html';
  }
}, true);