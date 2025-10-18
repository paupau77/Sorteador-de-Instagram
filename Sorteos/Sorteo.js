let commentData = [];
let filteredComments = [];
const commentsInput = document.getElementById('comments');
const commentList = document.getElementById('commentList');
const processBtn = document.getElementById('processCommentsBtn');
const raffleBtn = document.getElementById('raffleBtn');
const winnersInput = document.getElementById('winners');
const winnersOutput = document.getElementById('winnersOutput');
const form = document.getElementById('raffleForm');
const csvFile = document.getElementById('csvFile');
processBtn.onclick = function() {
  commentData = [];
  let text = commentsInput.value.trim();
  if (!text && !commentList.hasChildNodes()) {
    alert('¡Pega la lista de usuarios o comentarios primero!');
    return;
  }
  let lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let usersSet = new Set();
  lines.forEach(line => {
    if (!line) return;
    let user = '', comment = '';
    let m = line.match(/^([^:;,]+)[\s:;,]+(.*)$/);
    if (m) {
      user = m[1].trim();
      comment = m[2].trim();
    } else {
      user = line.trim();
    }
    if (user && !usersSet.has(user.toLowerCase())) {
      commentData.push({ user, text: comment });
      usersSet.add(user.toLowerCase());
    }
  });
  if (!commentData.length) {
    alert('No se detectaron participantes válidos. Usa el formato: usuario o usuario: comentario');
    return;
  }
  renderCommentList();
  commentList.style.display = '';
  raffleBtn.style.display = '';
  winnersOutput.style.display = 'none';
};
csvFile.onchange = function(e) {
  const file = csvFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function() {
    let lines = reader.result.split(/\r?\n/).filter(Boolean);
    let colUser = -1, colComment = -1;
    let headers = lines[0].split(/[;,|\t]/);
    headers.forEach((h, idx) => {
      let norm = h.trim().toLowerCase();
      if (['usuario','user','nombre','username'].includes(norm)) colUser = idx;
      if (['comentario','comentarios','comment','texto','mensaje'].includes(norm)) colComment = idx;
    });
    if (colUser === -1) {
      colUser = 0;
      colComment = 1;
    } else {
      lines = lines.slice(1);
    }
    let usersSet = new Set();
    commentData = [];
    lines.forEach(line => {
      let cols = line.split(/[;,|\t]/);
      let user = (cols[colUser]||'').trim();
      let comment = (colComment>-1 && cols[colComment]) ? cols[colComment].trim() : '';
      if (user && !usersSet.has(user.toLowerCase())) {
        commentData.push({ user, text: comment });
        usersSet.add(user.toLowerCase());
      }
    });
    if (!commentData.length) {
      alert('No se detectaron usuarios válidos en el archivo.');
      return;
    }
    commentsInput.value = commentData.map(c => c.user + (c.text ? ': ' + c.text : '')).join('\n');
    renderCommentList();
    commentList.style.display = '';
    raffleBtn.style.display = '';
    winnersOutput.style.display = 'none';
  };
  reader.readAsText(file);
};
function renderCommentList() {
  commentList.innerHTML = '';
  commentData.forEach((c) => {
    const row = document.createElement('div');
    row.className = 'comment-row';
    row.innerHTML = `
      <span class="user">@${escapeHTML(c.user)}</span>
      <span style="color:#444;font-size:0.96em">${c.text ? escapeHTML(c.text) : ''}</span>
    `;
    commentList.appendChild(row);
  });
}
form.onsubmit = function(e) {
  e.preventDefault();
  let url = document.getElementById('url').value.trim();
  let nWinners = parseInt(winnersInput.value, 10) || 1;
  if (!url.match(/^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_\-]+/)) {
    alert('Pega una URL de Instagram válida.');
    return;
  }
  if (commentData.length < nWinners) {
    alert('No hay suficientes participantes para ese número de ganadores.');
    return;
  }
  filteredComments = commentData;
  if (filteredComments.length < nWinners) {
    alert('No hay suficientes participantes.');
    return;
  }
  let winners = pickRandom(filteredComments, nWinners);
  showWinners(winners);
};
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function pickRandom(arr, n) {
  let copy = shuffle(arr.slice());
  return copy.slice(0, n);
}
function showWinners(winners) {
  winnersOutput.innerHTML = `<h2>🎊 Ganador${winners.length > 1 ? 'es' : ''}:</h2>` +
    winners.map(w => `<div class="winner">
      <svg viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9.5 17,14 18.5,21 12,17.5 5.5,21 7,14 2,9.5 9,9"></polygon></svg>
      @${escapeHTML(w.user)}
    </div>`).join('');
  winnersOutput.style.display = '';
  scrollToWinners();
}
function scrollToWinners() {
  setTimeout(() => {
    winnersOutput.scrollIntoView({behavior:'smooth', block:'center'});
  }, 250);
}
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#39;'
    })[m];
  });
}