const ADMIN_EMAIL = "fernandoalmeidacarvalhojr@gmail.com";

// V36 GOOGLE LOGIN — CONFIGURAÇÃO FIREBASE
// Para ativar login Google real:
// 1) Crie um projeto em https://console.firebase.google.com
// 2) Ative Authentication > Sign-in method > Google
// 3) Adicione seu domínio autorizado
// 4) Substitua os valores abaixo pelas chaves do seu app Web Firebase.
const V36_GOOGLE_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAoxqHA0D-xhbmMxS12fjgJROiE3aBTqT0",
  authDomain: "assinatura-magnetica.firebaseapp.com",
  projectId: "assinatura-magnetica",
  storageBucket: "assinatura-magnetica.firebasestorage.app",
  messagingSenderId: "519915223614",
  appId: "1:519915223614:web:ae78373ecf6dc910316f6f",
  measurementId: "G-FX33RKFSZC"
};
function googleConfigReady(){
  return !!(V36_GOOGLE_FIREBASE_CONFIG.apiKey && V36_GOOGLE_FIREBASE_CONFIG.authDomain && V36_GOOGLE_FIREBASE_CONFIG.projectId && V36_GOOGLE_FIREBASE_CONFIG.appId);
}

const $ = (s) => document.querySelector(s);
const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'), 2600); };
let currentUser = JSON.parse(localStorage.getItem('am_user') || 'null');
function shouldBeAdmin(loginValue='', emailValue=''){
  const login = String(loginValue || '').trim().toLowerCase();
  const email = String(emailValue || '').trim().toLowerCase();
  return login === 'admin' || login === 'admin@magnetica.com' || login === 'feeh' || login === 'fernandoalmeidacarvalhojr@gmail.com' || email === 'fernandoalmeidacarvalhojr@gmail.com';
}

function promoteAdminAccounts(){
  // Garante que a conta feeh e o e-mail do Fernando sejam sempre ADMIN,
  // inclusive se já estavam salvos antes como usuário comum no localStorage.
  if(currentUser && shouldBeAdmin(currentUser.username || currentUser.name, currentUser.email)){
    currentUser = { ...currentUser, role:'admin', plan:'VIP', status:'Ativo' };
    if(!currentUser.username || currentUser.email === ADMIN_EMAIL) currentUser.username = currentUser.username || 'feeh';
    localStorage.setItem('am_user', JSON.stringify(currentUser));
  }
  let changed = false;
  users = users.map(u => {
    if(shouldBeAdmin(u.username || u.name, u.email)){
      changed = true;
      return { ...u, role:'admin', plan:'VIP', status:'Ativo' };
    }
    return u;
  });
  if(changed) saveUsers();
}

function enterPlatform(){
  const welcome = document.querySelector('#welcomeScreen');
  if(welcome){
    welcome.classList.add('hide');
    welcome.style.opacity = '0';
    welcome.style.visibility = 'hidden';
    welcome.style.pointerEvents = 'none';
  }
  localStorage.setItem('am_welcome_seen','yes');
}
window.enterPlatform = enterPlatform;
let users = JSON.parse(localStorage.getItem('am_users') || '[]');
const saveUsers = () => localStorage.setItem('am_users', JSON.stringify(users));

function openAuth(tab='login'){
  $('#authModal').classList.remove('hidden');
  switchTab(tab);
}
function closeAuth(){ $('#authModal').classList.add('hidden'); }
function switchTab(tab){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  $('#loginForm').classList.toggle('hidden', tab!=='login');
  $('#registerForm').classList.toggle('hidden', tab!=='register');
}
function refreshUserUI(){
  if(currentUser){
    $('#loginBtn').textContent = currentUser.role === 'admin' ? 'Admin' : (currentUser.username || currentUser.name || 'Perfil');
    $('#loginBtn').onclick = () => currentUser.role === 'admin' ? openAdminPanel() : $('#profilePanel').classList.remove('hidden');
    $('#profileName').value = currentUser.name || '';
    $('#profileBio').value = currentUser.bio || '';
    $('#profilePreview').src = currentUser.photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect width="120" height="120" rx="60" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="54%25" dominant-baseline="middle" text-anchor="middle" font-size="34" font-family="Arial" fill="%236c5ce7"%3EAM%3C/text%3E%3C/svg%3E';
  } else {
    $('#loginBtn').textContent = 'Log in';
    $('#loginBtn').onclick = () => openAuth('login');
  }
}
function sendAdminEmail(data){
  const subject = encodeURIComponent('Novo cadastro - Assinatura Magnética');
  const body = encodeURIComponent(`Novo usuário cadastrado:\n\nNome completo: ${data.fullName}\nUsuário: ${data.username}\nE-mail: ${data.email}\nData de nascimento: ${data.birthDate}\nSenha: protegida por segurança, não enviada em texto puro.\n\nObservação: para envio automático real, conectar EmailJS, Formspree, Firebase Function ou backend próprio.`);
  const mailto = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
  window.location.href = mailto;
}


async function loginWithGoogleV36(){
  if(!googleConfigReady()){
    toast('Login com Google ainda precisa ser ativado pelo administrador.');
    console.warn('V36 Google Login: preencha V36_GOOGLE_FIREBASE_CONFIG no app.js.');
    return;
  }
  try{
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js');
    const firebaseApp = initializeApp(V36_GOOGLE_FIREBASE_CONFIG);
    const auth = getAuth(firebaseApp);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const gUser = result.user;
    const email = (gUser.email || '').trim().toLowerCase();
    const usernameBase = email ? email.split('@')[0] : (gUser.displayName || 'googleuser').replace(/\s+/g,'').toLowerCase();
    const googleUser = {
      id: 'google_' + (gUser.uid || Date.now()),
      name: gUser.displayName || usernameBase,
      username: usernameBase,
      email,
      birthDate: '',
      password: '',
      provider: 'google',
      role: shouldBeAdmin(usernameBase, email) ? 'admin' : 'user',
      plan: shouldBeAdmin(usernameBase, email) ? 'VIP' : 'Free',
      status: 'Ativo',
      bio: '',
      photo: gUser.photoURL || ''
    };
    const idx = users.findIndex(u => u.email && u.email.toLowerCase() === email);
    if(idx >= 0){ users[idx] = { ...users[idx], ...googleUser, id: users[idx].id || googleUser.id }; currentUser = users[idx]; }
    else { currentUser = googleUser; users.push(googleUser); }
    saveUsers();
    localStorage.setItem('am_user', JSON.stringify(currentUser));
    closeAuth();
    refreshUserUI();
    if(typeof updateFeedUserUI === 'function') updateFeedUserUI();
    if(typeof renderFeedPosts === 'function') renderFeedPosts();
    if(currentUser.role === 'admin') openAdminPanel();
    toast('Login com Google realizado com sucesso.');
  }catch(err){
    console.error(err);
    toast('Não foi possível entrar com Google agora.');
  }
}
window.loginWithGoogleV36 = loginWithGoogleV36;


document.addEventListener('DOMContentLoaded', () => {
  promoteAdminAccounts();
  refreshUserUI();
  const oldVipBtn = $('#vipBtn'); if(oldVipBtn) oldVipBtn.onclick = () => toast('Área VIP pronta para integração de pagamento.');
  $('#closeModal').onclick = closeAuth;
  $('#authModal').addEventListener('click', e => { if(e.target.id === 'authModal') closeAuth(); });
  document.querySelectorAll('.tab').forEach(b => b.onclick = () => switchTab(b.dataset.tab));
  $('#googleLoginBtn')?.addEventListener('click', loginWithGoogleV36);
  $('#googleRegisterBtn')?.addEventListener('click', loginWithGoogleV36);

  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const loginValue = $('#loginUser').value.trim();
    const password = $('#loginPassword').value;
    if(shouldBeAdmin(loginValue) && (password === 'admin123' || loginValue.toLowerCase() === 'feeh' || loginValue.toLowerCase() === 'fernandoalmeidacarvalhojr@gmail.com')){
      currentUser = { name: loginValue.toLowerCase() === 'feeh' ? 'Feeh' : 'Administrador', username: loginValue.toLowerCase() === 'feeh' ? 'feeh' : 'admin', email: loginValue.toLowerCase() === 'feeh' ? 'fernandoalmeidacarvalhojr@gmail.com' : 'admin@magnetica.com', role: 'admin', plan: 'VIP', status: 'Ativo', bio: '', photo: '' };
      localStorage.setItem('am_user', JSON.stringify(currentUser));
      closeAuth(); refreshUserUI(); updateFeedUserUI(); renderFeedPosts(); openAdminPanel(); toast('Admin logado com acesso total.');
      return;
    }
    const found = users.find(u => (u.username === loginValue || u.email === loginValue) && u.password === password);
    if(found){
      currentUser = shouldBeAdmin(found.username, found.email) ? {...found, role:'admin', plan:'VIP'} : found;
    } else {
      currentUser = { name: loginValue, username: loginValue, email: '', role: 'user', bio: '', photo: '', plan: 'Free', status: 'Ativo' };
    }
    localStorage.setItem('am_user', JSON.stringify(currentUser));
    closeAuth(); refreshUserUI(); updateFeedUserUI(); renderFeedPosts(); toast('Login realizado com sucesso.');
  });

  $('#registerForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      fullName: $('#fullName').value.trim(),
      username: $('#username').value.trim(),
      email: $('#email').value.trim(),
      birthDate: $('#birthDate').value,
      password: $('#password').value
    };
    if(users.some(u => u.username === data.username || u.email === data.email)) return toast('Usuário ou e-mail já cadastrado.');
    currentUser = { id: Date.now(), name: data.fullName, username: data.username, email: data.email, birthDate: data.birthDate, password: data.password, role: shouldBeAdmin(data.username, data.email) ? 'admin' : 'user', plan: shouldBeAdmin(data.username, data.email) ? 'VIP' : 'Free', status: 'Ativo', bio: '', photo: '' };
    users.push(currentUser); saveUsers();
    localStorage.setItem('am_user', JSON.stringify(currentUser));
    closeAuth(); refreshUserUI(); updateFeedUserUI(); renderFeedPosts(); toast('Cadastro finalizado. Abrindo e-mail para notificar o administrador.');
    setTimeout(()=>sendAdminEmail(data), 700);
  });

  $('#profilePhoto').addEventListener('change', e => {
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = () => { $('#profilePreview').src = reader.result; currentUser.photo = reader.result; localStorage.setItem('am_user', JSON.stringify(currentUser)); };
    reader.readAsDataURL(file);
  });
  $('#saveProfile').onclick = () => {
    if(!currentUser) return;
    currentUser.name = $('#profileName').value.trim();
    currentUser.bio = $('#profileBio').value.trim();
    users = users.map(u => u.id === currentUser.id ? currentUser : u); saveUsers();
    localStorage.setItem('am_user', JSON.stringify(currentUser));
    refreshUserUI(); toast('Perfil atualizado.');
  };
  $('#closeProfile').onclick = () => $('#profilePanel').classList.add('hidden');
  $('#languageSelect').onchange = e => toast(`Idioma selecionado: ${e.target.options[e.target.selectedIndex].text}`);
});


function avatarSrc(u){
  return u.photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" rx="40" fill="%23eafaf1"/%3E%3Ctext x="50%25" y="54%25" dominant-baseline="middle" text-anchor="middle" font-size="26" font-family="Arial" fill="%2318d66f"%3EAM%3C/text%3E%3C/svg%3E';
}
function openAdminPanel(){
  if(!currentUser || currentUser.role !== 'admin') return toast('Acesso restrito ao admin.');
  $('#adminPanel').classList.remove('hidden');
  renderUsersTable();
}
function renderUsersTable(){
  const q = ($('#adminSearch')?.value || '').toLowerCase();
  const list = users.filter(u => [u.name,u.username,u.email].join(' ').toLowerCase().includes(q));
  $('#totalUsers').textContent = `${list.length} usuário${list.length===1?'':'s'}`;
  $('#usersTable').innerHTML = list.map(u => `
    <tr>
      <td><img class="mini-avatar" src="${avatarSrc(u)}" alt="Foto"></td>
      <td contenteditable="true" data-field="name" data-id="${u.id}">${u.name || '-'}</td>
      <td contenteditable="true" data-field="username" data-id="${u.id}">${u.username || '-'}</td>
      <td contenteditable="true" data-field="email" data-id="${u.id}">${u.email || '-'}</td>
      <td>${u.birthDate || '-'}</td>
      <td><span class="status-pill ${u.plan === 'VIP' ? 'vip' : ''}">${u.plan || 'Free'}</span></td>
      <td><span class="status-pill ${u.status === 'Bloqueado' ? 'blocked' : ''}">${u.status || 'Ativo'}</span></td>
      <td class="row-actions">
        <button onclick="toggleVip(${u.id})">VIP</button>
        <button onclick="toggleBlock(${u.id})">Bloquear</button>
        <button onclick="removeUser(${u.id})">Remover</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="8">Nenhuma conta cadastrada ainda.</td></tr>';
  document.querySelectorAll('[contenteditable][data-id]').forEach(cell => {
    cell.onblur = () => {
      const id = Number(cell.dataset.id), field = cell.dataset.field;
      users = users.map(u => u.id === id ? {...u, [field]: cell.textContent.trim()} : u);
      saveUsers();
    };
  });
}
window.toggleVip = (id) => { users = users.map(u => u.id === id ? {...u, plan: u.plan === 'VIP' ? 'Free' : 'VIP'} : u); saveUsers(); renderUsersTable(); };
window.toggleBlock = (id) => { users = users.map(u => u.id === id ? {...u, status: u.status === 'Bloqueado' ? 'Ativo' : 'Bloqueado'} : u); saveUsers(); renderUsersTable(); };
window.removeUser = (id) => { if(confirm('Remover esta conta?')){ users = users.filter(u => u.id !== id); saveUsers(); renderUsersTable(); } };
function exportUsersCSV(){
  const header = ['Nome','Usuario','Email','Nascimento','Plano','Status'];
  const rows = users.map(u => [u.name,u.username,u.email,u.birthDate,u.plan,u.status]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v||'').replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'contas-assinatura-magnetica.csv'; a.click();
}
document.addEventListener('DOMContentLoaded', () => {
  $('#closeAdmin').onclick = () => $('#adminPanel').classList.add('hidden');
  $('#adminSearch').oninput = renderUsersTable;
  $('#exportUsers').onclick = exportUsersCSV;
});

// V9: logout + featured prompt popup/copy
function bindV9Features(){
  const logoutBtn = document.querySelector('#logoutBtn');
  if(logoutBtn){
    logoutBtn.onclick = () => {
      localStorage.removeItem('am_user');
      currentUser = null;
      document.querySelector('#profilePanel')?.classList.add('hidden');
      refreshUserUI();
      updateFeedUserUI();
      renderFeedPosts();
      toast('Você saiu da conta.');
    };
  }
  const featured = document.querySelector('#featuredPromptCard');
  const modal = document.querySelector('#promptModal');
  const close = document.querySelector('#closePromptModal');
  const copy = document.querySelector('#copyPromptBtn');
  const text = document.querySelector('#promptText');
  if(featured && modal){ featured.onclick = () => modal.classList.remove('hidden'); }
  if(close && modal){ close.onclick = () => modal.classList.add('hidden'); }
  if(modal){ modal.addEventListener('click', e => { if(e.target.id === 'promptModal') modal.classList.add('hidden'); }); }
  if(copy && text){
    copy.onclick = async () => {
      try{ await navigator.clipboard.writeText(text.value); toast('Prompt copiado com sucesso.'); }
      catch(e){ text.select(); document.execCommand('copy'); toast('Prompt copiado.'); }
    };
  }
}
document.addEventListener('DOMContentLoaded', bindV9Features);

// V11/V23 REAL: welcome screen control corrigido
document.addEventListener('DOMContentLoaded',()=>{
  const welcome=document.querySelector('#welcomeScreen');
  const enter=document.querySelector('#enterPlatform');
  if(welcome){
    welcome.classList.remove('hide');
    welcome.style.opacity='1';
    welcome.style.visibility='visible';
    welcome.style.pointerEvents='auto';
  }
  if(enter){ enter.onclick = enterPlatform; }
});

// V12 REAL: clicar no nome ASSINATURA MAGNÉTICA volta para a tela de boas-vindas
function showWelcomeScreen(){
  const welcome = document.querySelector('#welcomeScreen');
  if(!welcome) return;
  localStorage.removeItem('am_welcome_seen');
  welcome.classList.remove('hide');
  window.scrollTo({top:0, behavior:'smooth'});
}
document.addEventListener('DOMContentLoaded', () => {
  const brand = document.querySelector('.topbar .brand');
  if(brand){
    brand.setAttribute('title','Voltar para a tela de boas-vindas');
    brand.addEventListener('click', showWelcomeScreen);
  }
});

// V13/V23 REAL: tela de boas-vindas sempre aparece ao carregar; botão COMEÇAR AGORA fecha corretamente.
document.addEventListener('DOMContentLoaded', () => {
  const welcome = document.querySelector('#welcomeScreen');
  const enter = document.querySelector('#enterPlatform');
  if(welcome) welcome.classList.remove('hide');
  if(enter) enter.onclick = enterPlatform;
});

// V20 FIX: Feed isolado, sem aparecer no restante do site
let feedPosts = JSON.parse(localStorage.getItem('am_feed_posts') || '[]');
let pendingFeedMedia = null;
function saveFeedPosts(){ localStorage.setItem('am_feed_posts', JSON.stringify(feedPosts)); }
function isAdminUser(){ return currentUser && currentUser.role === 'admin'; }
function feedUser(){
  return currentUser || null;
}
function canDeleteFeedPost(post){
  if(!currentUser) return false;
  if(currentUser.role === 'admin') return true;
  const owner = String(post.owner || '');
  const me = String(currentUser.id || currentUser.username || currentUser.email || currentUser.name || '');
  return owner && owner === me;
}
function formatFeedDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
}
function updateFeedUserUI(){
  const u = feedUser();
  const role = !u ? 'Faça login para postar' : (u.role === 'admin' ? 'Administrador' : (u.plan === 'VIP' ? 'Membro VIP' : 'Membro Free'));
  const img = u?.photo ? `<img src="" alt="Foto">` : 'AM';
  ['feedSidebarAvatar','composerAvatar'].forEach(id=>{ const el = document.getElementById(id); if(el) el.innerHTML = img; });
  const sidebarName = document.getElementById('feedSidebarName'); if(sidebarName) sidebarName.textContent = u ? (u.name || u.username || 'Usuário') : 'Visitante';
  const sidebarRole = document.getElementById('feedSidebarRole'); if(sidebarRole) sidebarRole.textContent = role;
  const composerName = document.getElementById('composerName'); if(composerName) composerName.textContent = u ? (u.name || u.username || 'Usuário') : 'Entre na conta';
  const composerRole = document.getElementById('composerRole'); if(composerRole) composerRole.textContent = role + (u ? ' • agora' : '');
  const adminTools = document.getElementById('adminFeedTools'); if(adminTools) adminTools.classList.toggle('hidden', !isAdminUser());
  const textArea = document.getElementById('feedPostText');
  const publishBtn = document.getElementById('publishFeedPost');
  const mediaInput = document.getElementById('feedMediaInput');
  if(textArea){ textArea.disabled = !u; textArea.placeholder = u ? 'Compartilhe uma ideia, prompt, novidade ou criação...' : 'Faça login para publicar no feed.'; }
  if(publishBtn){ publishBtn.textContent = u ? 'Publicar' : 'Entrar para postar'; }
  if(mediaInput){ mediaInput.disabled = !u; }
}
function safeText(value){
  return String(value || '').replace(/[<>&"]/g, ch => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[ch]));
}
function currentUserKey(){
  if(!currentUser) return '';
  return String(currentUser.id || currentUser.username || currentUser.email || currentUser.name || '');
}
function postShareText(post){
  const clean = String(post.text || 'Post da comunidade Assinatura Magnética').slice(0, 220);
  return clean + '\n\nAssinatura Magnética';
}
function renderShareMenu(post){
  return '<div class="share-menu" id="shareMenu-' + post.id + '">' +
    '<button onclick="shareFeedPost(' + post.id + ', \'facebook\')">Facebook</button>' +
    '<button onclick="shareFeedPost(' + post.id + ', \'instagram\')">Instagram</button>' +
    '<button onclick="shareFeedPost(' + post.id + ', \'threads\')">Threads</button>' +
    '<button onclick="shareFeedPost(' + post.id + ', \'whatsapp\')">WhatsApp</button>' +
  '</div>';
}
function renderFeedPosts(){
  const box = document.getElementById('feedPosts');
  if(!box) return;
  if(feedPosts.length === 0){
    box.innerHTML = '<article class="feed-post"><div class="feed-post-head"><div class="feed-avatar small">AM</div><div><strong>Assinatura Magnética</strong><span>Administrador • agora</span></div></div><p class="feed-post-text">Bem-vindo ao feed da comunidade. Esta área agora só aparece quando você clica no menu Feed.</p></article>';
    return;
  }
  const me = currentUserKey();
  box.innerHTML = feedPosts.slice().reverse().map(post => {
    post.likes = Array.isArray(post.likes) ? post.likes : [];
    post.comments = Array.isArray(post.comments) ? post.comments : [];
    const liked = me && post.likes.includes(me);
    const media = post.media ? '<div class="feed-post-media">' + ((post.mediaType && post.mediaType.startsWith('video')) ? '<video controls src="' + post.media + '"></video>' : '<img src="' + post.media + '" alt="Mídia do post">') + '</div>' : '';
    const del = canDeleteFeedPost(post) ? '<button class="feed-delete" onclick="deleteFeedPost(' + post.id + ')">Excluir</button>' : '';
    const avatar = post.photo ? '<img src="' + post.photo + '" alt="Foto">' : 'AM';
    const comments = post.comments.length ? '<div class="feed-comments">' + post.comments.map(c => '<div class="feed-comment"><strong>' + safeText(c.name) + '</strong><span>' + safeText(c.text) + '</span></div>').join('') + '</div>' : '';
    return '<article class="feed-post" id="post-' + post.id + '">' +
      '<div class="feed-post-head"><div class="feed-avatar small">' + avatar + '</div><div><strong>' + safeText(post.name) + '</strong><span>' + safeText(post.role) + ' • ' + formatFeedDate(post.createdAt) + '</span></div></div>' +
      '<p class="feed-post-text">' + safeText(post.text) + '</p>' + media +
      '<div class="feed-stats"><span>' + post.likes.length + ' curtida' + (post.likes.length===1?'':'s') + '</span><span>' + post.comments.length + ' comentário' + (post.comments.length===1?'':'s') + '</span></div>' +
      '<div class="feed-post-actions">' +
        '<button class="' + (liked ? 'liked' : '') + '" onclick="toggleFeedLike(' + post.id + ')">' + (liked ? '💙 Curtido' : '♡ Curtir') + '</button>' +
        '<button onclick="commentFeedPost(' + post.id + ')">💬 Comentar</button>' +
        '<button onclick="toggleShareMenu(' + post.id + ')">↗ Compartilhar</button>' + del +
      '</div>' + renderShareMenu(post) + comments + '</article>';
  }).join('');
}
window.deleteFeedPost = (id) => {
  const post = feedPosts.find(p => p.id === id);
  if(!post || !canDeleteFeedPost(post)) return toast('Você só pode excluir seus próprios posts. Admin pode excluir todos.');
  if(confirm('Excluir este post?')){ feedPosts = feedPosts.filter(p => p.id !== id); saveFeedPosts(); renderFeedPosts(); toast('Post excluído.'); }
};
window.toggleFeedLike = (id) => {
  if(!currentUser){ openAuth('login'); return toast('Faça login para curtir.'); }
  const me = currentUserKey();
  feedPosts = feedPosts.map(p => {
    if(p.id !== id) return p;
    const likes = Array.isArray(p.likes) ? p.likes : [];
    return {...p, likes: likes.includes(me) ? likes.filter(x => x !== me) : [...likes, me]};
  });
  saveFeedPosts();
  renderFeedPosts();
};
function openCommentModal(postId){
  if(!currentUser){ openAuth('login'); return toast('Faça login para comentar.'); }
  const old = document.getElementById('commentModal');
  if(old) old.remove();
  const modal = document.createElement('div');
  modal.id = 'commentModal';
  modal.className = 'modal comment-modal';
  modal.innerHTML = `
    <div class="modal-card comment-modal-card">
      <button class="close" id="closeCommentModal">×</button>
      <h2>Comentar publicação</h2>
      <p class="safe-note">Seu comentário aparecerá abaixo do post.</p>
      <textarea id="commentTextArea" class="comment-textarea" placeholder="Digite seu comentário..."></textarea>
      <button id="sendCommentBtn" class="btn primary full">Publicar comentário</button>
    </div>`;
  document.body.appendChild(modal);
  const textarea = document.getElementById('commentTextArea');
  textarea.focus();
  const close = () => modal.remove();
  document.getElementById('closeCommentModal').onclick = close;
  modal.addEventListener('click', e => { if(e.target.id === 'commentModal') close(); });
  document.getElementById('sendCommentBtn').onclick = () => {
    const text = textarea.value.trim();
    if(!text) return toast('Digite um comentário.');
    feedPosts = feedPosts.map(p => {
      if(p.id !== postId) return p;
      const comments = Array.isArray(p.comments) ? p.comments : [];
      return {...p, comments:[...comments, { id:Date.now(), user: currentUserKey(), name: currentUser.name || currentUser.username || 'Usuário', text, createdAt:new Date().toISOString() }]};
    });
    saveFeedPosts();
    renderFeedPosts();
    close();
    toast('Comentário publicado.');
  };
}
window.commentFeedPost = (id) => openCommentModal(id);
window.toggleShareMenu = (id) => {
  document.querySelectorAll('.share-menu').forEach(menu => {
    if(menu.id !== 'shareMenu-' + id) menu.classList.remove('open');
  });
  const menu = document.getElementById('shareMenu-' + id);
  if(menu) menu.classList.toggle('open');
};
window.shareFeedPost = async (id, network) => {
  const post = feedPosts.find(p => p.id === id);
  if(!post) return;
  const text = postShareText(post);
  const url = location.href.split('#')[0] + '#feed';
  try{ await navigator.clipboard.writeText(text + '\n' + url); }catch(e){}
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  const links = {
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl + '&quote=' + encodedText,
    whatsapp: 'https://api.whatsapp.com/send?text=' + encodedText + '%20' + encodedUrl,
    threads: 'https://www.threads.net/intent/post?text=' + encodedText + '%20' + encodedUrl,
    instagram: 'https://www.instagram.com/'
  };
  if(network === 'instagram') toast('Texto copiado. Cole no Instagram ao abrir.');
  window.open(links[network], '_blank', 'noopener,noreferrer');
  const menu = document.getElementById('shareMenu-' + id);
  if(menu) menu.classList.remove('open');
};
function setupFeedOnlyPage(){
  const normal = document.getElementById('normalContent');
  const feed = document.getElementById('feedPage');
  const community = document.getElementById('communityPage');
  const showFeed = location.hash === '#feed';
  const showCommunity = location.hash === '#community';
  const isolated = showFeed || showCommunity;
  if(normal) normal.classList.toggle('feed-hidden', isolated);
  if(feed) feed.classList.toggle('hidden', !showFeed);
  if(community) community.classList.toggle('hidden', !showCommunity);
  document.querySelectorAll('.rail-item').forEach(a => a.classList.toggle('active', a.getAttribute('href') === location.hash || (!location.hash && a.getAttribute('href') === '#home')));
  if(showFeed){ updateFeedUserUI(); renderFeedPosts(); window.scrollTo({top:0, behavior:'smooth'}); }
  if(showCommunity){ renderCommunityTopics(); window.scrollTo({top:0, behavior:'smooth'}); }
}
document.addEventListener('DOMContentLoaded', () => {
  setupFeedOnlyPage();
  window.addEventListener('hashchange', setupFeedOnlyPage);
  const mediaInput = document.getElementById('feedMediaInput');
  const preview = document.getElementById('feedPreview');
  if(mediaInput){
    mediaInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        pendingFeedMedia = { data: reader.result, type: file.type };
        if(preview){
          preview.classList.remove('hidden');
          preview.innerHTML = file.type.startsWith('video') ? `<video controls src="${reader.result}"></video>` : `<img src="${reader.result}" alt="Preview">`;
        }
      };
      reader.readAsDataURL(file);
    });
  }
  const publish = document.getElementById('publishFeedPost');
  if(publish){
    publish.addEventListener('click', () => {
      if(!currentUser){ openAuth('login'); return toast('Para publicar no Feed, faça login primeiro.'); }
      const textEl = document.getElementById('feedPostText');
      const text = (textEl?.value || '').trim();
      if(!text && !pendingFeedMedia) return toast('Escreva algo ou envie uma foto/vídeo.');
      const u = feedUser();
      const owner = String(u.id || u.username || u.email || u.name || Date.now());
      feedPosts.push({ id:Date.now(), owner, text, media: pendingFeedMedia?.data || '', mediaType: pendingFeedMedia?.type || '', name:u.name || u.username || 'Usuário', role:u.role === 'admin' ? 'Administrador' : (u.plan === 'VIP' ? 'Membro VIP' : 'Membro Free'), photo:u.photo || '', createdAt:new Date().toISOString(), likes:[], comments:[] });
      saveFeedPosts();
      if(textEl) textEl.value = '';
      pendingFeedMedia = null;
      if(preview){ preview.classList.add('hidden'); preview.innerHTML = ''; }
      renderFeedPosts(); toast('Publicado no Feed.');
    });
  }
});

// V25: logout visível para admin + segundo prompt em destaque com popup/cópia
function logoutCurrentUser(){
  localStorage.removeItem('am_user');
  currentUser = null;
  document.querySelector('#profilePanel')?.classList.add('hidden');
  document.querySelector('#adminPanel')?.classList.add('hidden');
  refreshUserUI();
  if(typeof updateFeedUserUI === 'function') updateFeedUserUI();
  if(typeof renderFeedPosts === 'function') renderFeedPosts();
  toast('Você saiu da conta.');
}
function bindV25Features(){
  const adminLogout = document.querySelector('#adminLogoutBtn');
  if(adminLogout) adminLogout.onclick = logoutCurrentUser;
  const logoutBtn = document.querySelector('#logoutBtn');
  if(logoutBtn) logoutBtn.onclick = logoutCurrentUser;
  const card = document.querySelector('#celebrationPromptCard');
  const modal = document.querySelector('#celebrationPromptModal');
  const close = document.querySelector('#closeCelebrationPromptModal');
  const copy = document.querySelector('#copyCelebrationPromptBtn');
  const text = document.querySelector('#celebrationPromptText');
  if(card && modal) card.onclick = () => modal.classList.remove('hidden');
  if(close && modal) close.onclick = () => modal.classList.add('hidden');
  if(modal) modal.addEventListener('click', e => { if(e.target.id === 'celebrationPromptModal') modal.classList.add('hidden'); });
  if(copy && text){
    copy.onclick = async () => {
      try{ await navigator.clipboard.writeText(text.value); toast('Prompt copiado com sucesso.'); }
      catch(e){ text.select(); document.execCommand('copy'); toast('Prompt copiado.'); }
    };
  }
}
document.addEventListener('DOMContentLoaded', bindV25Features);

// V28: likes/dislikes em Prompts em destaque + filtro Mais curtidos + aba planos VIP/Creator
const PROMPT_REACTIONS_KEY = 'am_prompt_reactions_v28';
function getPromptReactions(){
  try{return JSON.parse(localStorage.getItem(PROMPT_REACTIONS_KEY) || '{}')}catch(e){return {}}
}
function savePromptReactions(data){ localStorage.setItem(PROMPT_REACTIONS_KEY, JSON.stringify(data)); }

function currentPromptUserKey(){
  if(!currentUser) return null;
  return String(currentUser.id || currentUser.username || currentUser.email || currentUser.name || 'user');
}
function normalizePromptItem(item){
  item = item || {};
  item.likes = Array.isArray(item.likes) ? item.likes : [];
  item.dislikes = Array.isArray(item.dislikes) ? item.dislikes : [];
  item.favorites = Array.isArray(item.favorites) ? item.favorites : [];
  return item;
}
function updatePromptReactionUI(){
  const data = getPromptReactions();
  const me = currentPromptUserKey();
  document.querySelectorAll('[data-prompt-id]').forEach(card => {
    const id = card.dataset.promptId;
    const item = normalizePromptItem(data[id]);
    const likeBtn = card.querySelector('[data-action="like"]');
    const dislikeBtn = card.querySelector('[data-action="dislike"]');
    const favoriteBtn = card.querySelector('[data-action="favorite"]');
    if(likeBtn){
      likeBtn.querySelector('b').textContent = item.likes.length;
      likeBtn.classList.toggle('active-like', !!me && item.likes.includes(me));
    }
    if(dislikeBtn){
      dislikeBtn.querySelector('b').textContent = item.dislikes.length;
      dislikeBtn.classList.toggle('active-dislike', !!me && item.dislikes.includes(me));
    }
    if(favoriteBtn){
      favoriteBtn.querySelector('b').textContent = item.favorites.length;
      favoriteBtn.classList.toggle('active-favorite', !!me && item.favorites.includes(me));
    }
    card.dataset.likes = item.likes.length;
    card.dataset.favorites = item.favorites.length;
    card.dataset.isFavorite = (!!me && item.favorites.includes(me)) ? 'yes' : 'no';
  });
}
function requirePromptLogin(actionName){
  if(currentUser) return true;
  openAuth('login');
  toast(`Faça login para ${actionName}.`);
  return false;
}
function reactPrompt(id, action){
  if(action === 'like' && !requirePromptLogin('curtir prompts')) return;
  if(action === 'dislike' && !requirePromptLogin('descurtir prompts')) return;
  if(action === 'favorite' && !requirePromptLogin('favoritar prompts')) return;
  const data = getPromptReactions();
  const me = currentPromptUserKey();
  const item = normalizePromptItem(data[id]);
  if(action === 'like'){
    item.dislikes = item.dislikes.filter(x => x !== me);
    item.likes = item.likes.includes(me) ? item.likes.filter(x => x !== me) : [...item.likes, me];
  } else if(action === 'dislike') {
    item.likes = item.likes.filter(x => x !== me);
    item.dislikes = item.dislikes.includes(me) ? item.dislikes.filter(x => x !== me) : [...item.dislikes, me];
  } else if(action === 'favorite') {
    item.favorites = item.favorites.includes(me) ? item.favorites.filter(x => x !== me) : [...item.favorites, me];
  }
  data[id] = item;
  savePromptReactions(data);
  updatePromptReactionUI();
}
function resetPromptVisibility(){
  document.querySelectorAll('#prompts .cards.horizontal [data-prompt-id]').forEach(card => card.style.display = '');
}
function sortPromptsByLikes(){
  const grid = document.querySelector('#prompts .cards.horizontal');
  if(!grid) return;
  resetPromptVisibility();
  updatePromptReactionUI();
  [...grid.querySelectorAll('[data-prompt-id]')]
    .sort((a,b) => Number(b.dataset.likes || 0) - Number(a.dataset.likes || 0))
    .forEach(card => grid.appendChild(card));
  toast('Prompts ordenados por mais curtidos.');
}
function filterFavoritePrompts(){
  if(!currentUser){ openAuth('login'); return toast('Faça login para ver seus favoritos.'); }
  const grid = document.querySelector('#prompts .cards.horizontal');
  if(!grid) return;
  updatePromptReactionUI();
  let count = 0;
  [...grid.querySelectorAll('[data-prompt-id]')].forEach(card => {
    const show = card.dataset.isFavorite === 'yes';
    card.style.display = show ? '' : 'none';
    if(show) count++;
  });
  toast(count ? 'Mostrando seus prompts favoritos.' : 'Você ainda não favoritou nenhum prompt.');
}
function setupPromptReactions(){
  document.querySelectorAll('[data-prompt-id] .prompt-reactions button').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest('[data-prompt-id]');
      reactPrompt(card.dataset.promptId, btn.dataset.action);
    });
  });
  document.querySelectorAll('.filter-chip').forEach(btn => {
    const txt = btn.textContent.trim().toLowerCase();
    if(txt.includes('mais curtidos')){
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        sortPromptsByLikes();
      });
    }
    if(txt.includes('mais recentes')){
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        resetPromptVisibility();
        const grid = document.querySelector('#prompts .cards.horizontal');
        if(grid){ [...grid.querySelectorAll('[data-prompt-id]')].sort((a,b)=>(a.dataset.promptId||'').localeCompare(b.dataset.promptId||'')).forEach(card=>grid.appendChild(card)); }
      });
    }
    if(txt.includes('favoritos')){
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        filterFavoritePrompts();
      });
    }
  });
  updatePromptReactionUI();
}

function setupPlansV28(){
  const modal = document.querySelector("#vipPlansModal");
  const openPlans = (e) => {
    if(e) e.preventDefault();
    modal?.classList.remove("hidden");
  };
  const closePlans = () => modal?.classList.add("hidden");
  document.querySelector("#vipBtn")?.addEventListener("click", openPlans);
  document.querySelector("#plansNavLink")?.addEventListener("click", openPlans);
  document.querySelector("#closeVipPlans")?.addEventListener("click", closePlans);
  modal?.addEventListener("click", e => { if(e.target.id === "vipPlansModal") closePlans(); });

  const monthly = document.getElementById("monthlyToggle");
  const annual = document.getElementById("annualToggle");
  function setBilling(mode){
    monthly?.classList.toggle("active", mode === "monthly");
    annual?.classList.toggle("active", mode === "annual");
    document.querySelectorAll("#vipPlansModal .pricing-card .price[data-monthly]").forEach(el => el.textContent = el.dataset[mode]);
    document.querySelectorAll("#vipPlansModal .billing-note[data-monthly]").forEach(el => el.textContent = el.dataset[mode]);
  }
  monthly?.addEventListener("click", () => setBilling("monthly"));
  annual?.addEventListener("click", () => setBilling("annual"));
  document.querySelectorAll("#vipPlansModal .plan-btn:not(.current)").forEach(btn => btn.addEventListener("click", () => toast("Plano selecionado. Integração de pagamento pronta para conectar.")));
}
document.addEventListener('DOMContentLoaded', () => {
  setupPromptReactions();
  setupPlansV28();
});


// V34 - Comunidade Magnética: fórum + portfólio + diálogos
// Sem debates fictícios: a comunidade começa vazia e mostra apenas publicações reais criadas pelos usuários.
const communityFakeAuthors = ['Equipe AM','Assinatura Magnética','Comunidade','Mentoria Magnética','Creator Hub','VIP Club'];
let communityTopics = JSON.parse(localStorage.getItem('am_community_topics') || '[]');
communityTopics = Array.isArray(communityTopics) ? communityTopics.filter(t => !communityFakeAuthors.includes(t.name)) : [];
localStorage.setItem('am_community_topics', JSON.stringify(communityTopics));
let currentCommunityFilter = 'all';
function saveCommunityTopics(){ localStorage.setItem('am_community_topics', JSON.stringify(communityTopics)); }
function categoryName(cat){ return ({portfolio:'🎨 Portfólio Criativo', prompts:'🤖 Prompts & IA', freela:'💼 Freelance / Serviços', marketing:'📈 Marketing & Crescimento', networking:'💬 Networking', vip:'🏆 Área VIP'})[cat] || 'Comunidade'; }
function topicAvatarHTML(topic){ return topic.photo ? `<img src="${topic.photo}" alt="Foto">` : (topic.name || 'AM').slice(0,1).toUpperCase(); }
function renderCommunityTopics(){
  const wrap = document.getElementById('communityTopics'); if(!wrap) return;
  const list = communityTopics.filter(t => currentCommunityFilter === 'all' || t.category === currentCommunityFilter);
  wrap.innerHTML = list.map(t => `<article class="topic-card" data-topic-id="${t.id}"><div class="topic-top"><div class="topic-avatar">${topicAvatarHTML(t)}</div><div class="topic-author"><strong>${t.name || 'Usuário'}</strong><span>${t.role || 'Membro'} • agora</span></div></div><span class="topic-tag">${categoryName(t.category)}</span><h4>${t.title}</h4><p>${t.desc}</p><div class="topic-stats"><button onclick="likeCommunityTopic(${t.id})">❤️ ${t.likes || 0}</button><span>💬 ${t.replies || 0} respostas</span><span>👁 ${t.views || 0} views</span></div></article>`).join('') || '<div class="community-empty"><strong>Nenhum debate publicado ainda.</strong><p>Quando um usuário logado criar um debate, ele aparecerá aqui.</p></div>';
}
window.likeCommunityTopic = (id) => {
  if(!currentUser){ openAuth('login'); return toast('Faça login para curtir debates.'); }
  const me = currentUserKey ? currentUserKey() : String(currentUser.id || currentUser.username || currentUser.email || currentUser.name);
  communityTopics = communityTopics.map(t => {
    if(t.id !== id) return t;
    const likedBy = Array.isArray(t.likedBy) ? t.likedBy : [];
    const next = likedBy.includes(me) ? likedBy.filter(x => x !== me) : [...likedBy, me];
    return {...t, likedBy: next, likes: next.length};
  });
  saveCommunityTopics(); renderCommunityTopics();
};
function openTopicModal(){ if(!currentUser){ openAuth('login'); return toast('Para publicar na Comunidade Magnética, faça login primeiro.'); } document.getElementById('topicModal')?.classList.remove('hidden'); }
function closeTopicModal(){ document.getElementById('topicModal')?.classList.add('hidden'); }
function bindCommunity(){
  document.querySelectorAll('.community-filter').forEach(btn => { btn.onclick = () => { currentCommunityFilter = btn.dataset.category || 'all'; document.querySelectorAll('.community-filter').forEach(b=>b.classList.toggle('active', b===btn)); renderCommunityTopics(); }; });
  document.getElementById('newTopicBtn')?.addEventListener('click', openTopicModal);
  document.getElementById('closeTopicModal')?.addEventListener('click', closeTopicModal);
  document.getElementById('topicModal')?.addEventListener('click', e => { if(e.target.id === 'topicModal') closeTopicModal(); });
  document.getElementById('publishTopic')?.addEventListener('click', () => {
    if(!currentUser){ openAuth('login'); return; }
    const title = (document.getElementById('topicTitle')?.value || '').trim();
    const desc = (document.getElementById('topicDesc')?.value || '').trim();
    const category = document.getElementById('topicType')?.value || 'portfolio';
    if(!title || !desc) return toast('Preencha título e descrição.');
    communityTopics.unshift({id:Date.now(), category, title, desc, name:currentUser.name || currentUser.username || 'Usuário', role: currentUser.role === 'admin' ? 'Administrador' : (currentUser.plan === 'VIP' ? 'Membro VIP' : 'Membro Free'), photo:currentUser.photo || '', likes:0, replies:0, views:1});
    saveCommunityTopics(); document.getElementById('topicTitle').value = ''; document.getElementById('topicDesc').value = '';
    closeTopicModal(); renderCommunityTopics(); toast('Debate publicado na Comunidade Magnética.');
  });
  renderCommunityTopics();
}
document.addEventListener('DOMContentLoaded', bindCommunity);

// V32 REAL: tradução funcional do site pelo seletor de idioma
const AM_I18N = {
  pt: {
    home:'Home', prompts:'Prompts', feed:'Feed', blog:'Blog', forum:'Comunidade Magnética', marketplace:'Marketplace', plans:'Planos', ai:'AI Studio', chat:'Chat', login:'Log in', vip:'Virar VIP',
    welcomeTitle:'CREATOR-FIRST\nAI PLATFORM', welcomeText:'Seu portal magnético para criar, vender e crescer.', welcomeBtn:'COMEÇAR AGORA',
    eyebrowHero:'Creator-first AI platform', heroTitle:'CREATOR-FIRST\nAI PLATFORM', heroCopy:'Seu portal magnético para criar, vender e crescer.\nRede social, prompts, marketplace e AI Studio em um único ambiente premium.',
    promptPlaceholder:'Digite um prompt, ideia ou referência...', generate:'Gerar', image:'Imagem', video:'Vídeo', upscaler:'Upscaler', canvas:'Canvas',
    categories:'Categorias', filters:'Filtros', design:'Design', marketing:'Marketing', ecommerce:'E-commerce', latest:'Mais recentes', mostLiked:'Mais curtidos', free:'Free', featuredPrompts:'Featured Prompts', promptsFeatured:'Prompts em destaque', seeAll:'Ver todos →',
    communityCreations:'Community Creations', communityTitle:'Criações da comunidade', marketTitle:'Venda prompts, packs, mentorias e produtos digitais', marketCopy:'Área premium para criadores VIP publicarem seus stands, estampas, templates e serviços.',
    feedEyebrow:'Social Feed', feedTitle:'Feed da comunidade', feedBadge:'Clean premium', feedMain:'🏠 Feed principal', feedCommunity:'👥 Comunidade', feedPrompt:'🧠 Prompts', feedVip:'⭐ VIP', feedMarket:'🛒 Marketplace', feedPlaceholder:'Compartilhe uma ideia, prompt, novidade ou criação...', media:'📷 Foto/Vídeo', publish:'Publicar', loginToPost:'Entrar para postar',
    enter:'Entrar', register:'Registrar', accountLogin:'Entrar na conta', userEmail:'Usuário ou e-mail', userEmailPh:'Digite seu usuário ou e-mail', password:'Senha', passwordPh:'Digite sua senha', createAccount:'Criar conta', fullName:'Nome completo', fullNamePh:'Digite seu nome completo', username:'Usuário', usernamePh:'Escolha um nome de usuário', createPassPh:'Crie uma senha segura', email:'E-mail', emailPh:'Digite seu e-mail', birth:'Data de nascimento', finishRegister:'Finalizar cadastro', safeNote:'Por segurança, a senha não será enviada em texto puro por e-mail.', googleLogin:'Continuar com Google',
    myProfile:'Meu perfil', updatePhoto:'Atualizar foto', name:'Nome', bio:'Bio', bioPh:'Escreva uma bio curta...', saveProfile:'Salvar perfil', logout:'Sair da conta',
    adminMaster:'Admin Master', adminPanel:'Painel de contas cadastradas', searchUsers:'Buscar por nome, usuário ou e-mail...', exportCsv:'Exportar CSV', photo:'Foto', plan:'Plano', status:'Status', actions:'Ações',
    copyPrompt:'Copiar prompt', promptFeatured:'Prompt em destaque', clickCopy:'Clique em copiar para usar o texto completo do prompt.',
    vipPlans:'Planos', choosePlan:'Escolha o plano ideal para crescer na plataforma.', monthly:'Mensal', annual:'Anual', currentPlan:'Plano atual', popular:'Mais popular', perMonth:'por mês', subscribeVip:'Assinar VIP', creator:'Creator', becomeCreator:'Virar Creator',
    languageChanged:'Idioma alterado para Português.'
  },
  en: {
    home:'Home', prompts:'Prompts', feed:'Feed', blog:'Blog', forum:'Magnetic Community', marketplace:'Marketplace', plans:'Plans', ai:'AI Studio', chat:'Chat', login:'Log in', vip:'Go VIP',
    welcomeTitle:'CREATOR-FIRST\nAI PLATFORM', welcomeText:'Your magnetic portal to create, sell and grow.', welcomeBtn:'START NOW',
    eyebrowHero:'Creator-first AI platform', heroTitle:'CREATOR-FIRST\nAI PLATFORM', heroCopy:'Your magnetic portal to create, sell and grow.\nSocial network, prompts, marketplace and AI Studio in one premium space.',
    promptPlaceholder:'Type a prompt, idea or reference...', generate:'Generate', image:'Image', video:'Video', upscaler:'Upscaler', canvas:'Canvas',
    categories:'Categories', filters:'Filters', design:'Design', marketing:'Marketing', ecommerce:'E-commerce', latest:'Latest', mostLiked:'Most liked', free:'Free', featuredPrompts:'Featured Prompts', promptsFeatured:'Featured prompts', seeAll:'See all →',
    communityCreations:'Community Creations', communityTitle:'Community creations', marketTitle:'Sell prompts, packs, mentorships and digital products', marketCopy:'Premium area for VIP creators to publish stands, prints, templates and services.',
    feedEyebrow:'Social Feed', feedTitle:'Community feed', feedBadge:'Clean premium', feedMain:'🏠 Main feed', feedCommunity:'👥 Community', feedPrompt:'🧠 Prompts', feedVip:'⭐ VIP', feedMarket:'🛒 Marketplace', feedPlaceholder:'Share an idea, prompt, update or creation...', media:'📷 Photo/Video', publish:'Publish', loginToPost:'Log in to post',
    enter:'Sign in', register:'Register', accountLogin:'Sign in to account', userEmail:'Username or email', userEmailPh:'Type your username or email', password:'Password', passwordPh:'Type your password', createAccount:'Create account', fullName:'Full name', fullNamePh:'Type your full name', username:'Username', usernamePh:'Choose a username', createPassPh:'Create a secure password', email:'Email', emailPh:'Type your email', birth:'Birth date', finishRegister:'Finish registration', safeNote:'For security, the password will not be sent by email in plain text.', googleLogin:'Continue with Google',
    myProfile:'My profile', updatePhoto:'Update photo', name:'Name', bio:'Bio', bioPh:'Write a short bio...', saveProfile:'Save profile', logout:'Log out',
    adminMaster:'Admin Master', adminPanel:'Registered accounts panel', searchUsers:'Search by name, username or email...', exportCsv:'Export CSV', photo:'Photo', plan:'Plan', status:'Status', actions:'Actions',
    copyPrompt:'Copy prompt', promptFeatured:'Featured prompt', clickCopy:'Click copy to use the full prompt text.',
    vipPlans:'Plans', choosePlan:'Choose the ideal plan to grow on the platform.', monthly:'Monthly', annual:'Annual', currentPlan:'Current plan', popular:'Most popular', perMonth:'per month', subscribeVip:'Subscribe VIP', creator:'Creator', becomeCreator:'Become Creator',
    languageChanged:'Language changed to English.'
  },
  es: {
    home:'Inicio', prompts:'Prompts', feed:'Feed', blog:'Blog', forum:'Comunidad Magnética', marketplace:'Marketplace', plans:'Planes', ai:'AI Studio', chat:'Chat', login:'Entrar', vip:'Hacerse VIP',
    welcomeTitle:'PLATAFORMA IA\nPARA CREADORES', welcomeText:'Tu portal magnético para crear, vender y crecer.', welcomeBtn:'EMPEZAR AHORA',
    eyebrowHero:'Plataforma de IA para creadores', heroTitle:'PLATAFORMA IA\nPARA CREADORES', heroCopy:'Tu portal magnético para crear, vender y crecer.\nRed social, prompts, marketplace y AI Studio en un solo entorno premium.',
    promptPlaceholder:'Escribe un prompt, idea o referencia...', generate:'Generar', image:'Imagen', video:'Vídeo', upscaler:'Upscaler', canvas:'Canvas',
    categories:'Categorías', filters:'Filtros', design:'Diseño', marketing:'Marketing', ecommerce:'E-commerce', latest:'Más recientes', mostLiked:'Más gustados', free:'Gratis', featuredPrompts:'Prompts destacados', promptsFeatured:'Prompts destacados', seeAll:'Ver todos →',
    communityCreations:'Creaciones de la comunidad', communityTitle:'Creaciones de la comunidad', marketTitle:'Vende prompts, packs, mentorías y productos digitales', marketCopy:'Área premium para creadores VIP publicar stands, estampas, plantillas y servicios.',
    feedEyebrow:'Feed social', feedTitle:'Feed de la comunidad', feedBadge:'Clean premium', feedMain:'🏠 Feed principal', feedCommunity:'👥 Comunidad', feedPrompt:'🧠 Prompts', feedVip:'⭐ VIP', feedMarket:'🛒 Marketplace', feedPlaceholder:'Comparte una idea, prompt, novedad o creación...', media:'📷 Foto/Vídeo', publish:'Publicar', loginToPost:'Entrar para publicar',
    enter:'Entrar', register:'Registrar', accountLogin:'Entrar en la cuenta', userEmail:'Usuario o email', userEmailPh:'Escribe tu usuario o email', password:'Contraseña', passwordPh:'Escribe tu contraseña', createAccount:'Crear cuenta', fullName:'Nombre completo', fullNamePh:'Escribe tu nombre completo', username:'Usuario', usernamePh:'Elige un nombre de usuario', createPassPh:'Crea una contraseña segura', email:'Email', emailPh:'Escribe tu email', birth:'Fecha de nacimiento', finishRegister:'Finalizar registro', safeNote:'Por seguridad, la contraseña no será enviada por email en texto plano.', googleLogin:'Continuar con Google',
    myProfile:'Mi perfil', updatePhoto:'Actualizar foto', name:'Nombre', bio:'Bio', bioPh:'Escribe una bio corta...', saveProfile:'Guardar perfil', logout:'Salir de la cuenta',
    adminMaster:'Admin Master', adminPanel:'Panel de cuentas registradas', searchUsers:'Buscar por nombre, usuario o email...', exportCsv:'Exportar CSV', photo:'Foto', plan:'Plan', status:'Estado', actions:'Acciones',
    copyPrompt:'Copiar prompt', promptFeatured:'Prompt destacado', clickCopy:'Haz clic en copiar para usar el texto completo del prompt.',
    vipPlans:'Planes', choosePlan:'Elige el plan ideal para crecer en la plataforma.', monthly:'Mensual', annual:'Anual', currentPlan:'Plan actual', popular:'Más popular', perMonth:'por mes', subscribeVip:'Suscribir VIP', creator:'Creator', becomeCreator:'Ser Creator',
    languageChanged:'Idioma cambiado a Español.'
  },
  hi: {
    home:'होम', prompts:'प्रॉम्प्ट्स', feed:'फ़ीड', blog:'ब्लॉग', forum:'मैग्नेटिक कम्युनिटी', marketplace:'मार्केटप्लेस', plans:'प्लान', ai:'AI Studio', chat:'चैट', login:'लॉग इन', vip:'VIP बनें',
    welcomeTitle:'CREATOR-FIRST\nAI PLATFORM', welcomeText:'बनाने, बेचने और बढ़ने के लिए आपका मैग्नेटिक पोर्टल।', welcomeBtn:'अभी शुरू करें',
    eyebrowHero:'Creator-first AI platform', heroTitle:'CREATOR-FIRST\nAI PLATFORM', heroCopy:'बनाने, बेचने और बढ़ने के लिए आपका मैग्नेटिक पोर्टल।\nसोशल नेटवर्क, प्रॉम्प्ट्स, मार्केटप्लेस और AI Studio एक प्रीमियम जगह में।',
    promptPlaceholder:'प्रॉम्प्ट, आइडिया या रेफरेंस लिखें...', generate:'जनरेट', image:'इमेज', video:'वीडियो', upscaler:'अपस्केलर', canvas:'कैनवास',
    categories:'कैटेगरी', filters:'फ़िल्टर', design:'डिज़ाइन', marketing:'मार्केटिंग', ecommerce:'ई-कॉमर्स', latest:'नए', mostLiked:'सबसे अधिक लाइक', free:'फ्री', featuredPrompts:'Featured Prompts', promptsFeatured:'प्रमुख प्रॉम्प्ट्स', seeAll:'सभी देखें →',
    communityCreations:'कम्युनिटी क्रिएशन्स', communityTitle:'कम्युनिटी क्रिएशन्स', marketTitle:'प्रॉम्प्ट्स, पैक्स, मेंटरशिप और डिजिटल प्रोडक्ट बेचें', marketCopy:'VIP क्रिएटर्स के लिए प्रीमियम क्षेत्र।',
    feedEyebrow:'Social Feed', feedTitle:'कम्युनिटी फ़ीड', feedBadge:'Clean premium', feedMain:'🏠 मुख्य फ़ीड', feedCommunity:'👥 कम्युनिटी', feedPrompt:'🧠 प्रॉम्प्ट्स', feedVip:'⭐ VIP', feedMarket:'🛒 मार्केटप्लेस', feedPlaceholder:'एक आइडिया, प्रॉम्प्ट, अपडेट या क्रिएशन शेयर करें...', media:'📷 फोटो/वीडियो', publish:'पोस्ट करें', loginToPost:'पोस्ट करने के लिए लॉग इन करें',
    enter:'लॉग इन', register:'रजिस्टर', accountLogin:'अकाउंट में लॉग इन', userEmail:'यूज़र या ईमेल', userEmailPh:'अपना यूज़र या ईमेल लिखें', password:'पासवर्ड', passwordPh:'अपना पासवर्ड लिखें', createAccount:'अकाउंट बनाएँ', fullName:'पूरा नाम', fullNamePh:'अपना पूरा नाम लिखें', username:'यूज़र', usernamePh:'यूज़रनेम चुनें', createPassPh:'सुरक्षित पासवर्ड बनाएँ', email:'ईमेल', emailPh:'अपना ईमेल लिखें', birth:'जन्म तारीख', finishRegister:'रजिस्ट्रेशन पूरा करें', safeNote:'सुरक्षा के लिए पासवर्ड ईमेल में plain text में नहीं भेजा जाएगा।', googleLogin:'Google से जारी रखें',
    myProfile:'मेरी प्रोफ़ाइल', updatePhoto:'फोटो अपडेट करें', name:'नाम', bio:'बायो', bioPh:'छोटी बायो लिखें...', saveProfile:'प्रोफ़ाइल सेव करें', logout:'लॉग आउट',
    adminMaster:'Admin Master', adminPanel:'रजिस्टर्ड अकाउंट पैनल', searchUsers:'नाम, यूज़र या ईमेल से खोजें...', exportCsv:'CSV एक्सपोर्ट', photo:'फोटो', plan:'प्लान', status:'स्थिति', actions:'एक्शन',
    copyPrompt:'प्रॉम्प्ट कॉपी करें', promptFeatured:'प्रमुख प्रॉम्प्ट', clickCopy:'पूरा प्रॉम्प्ट टेक्स्ट इस्तेमाल करने के लिए कॉपी करें।',
    vipPlans:'प्लान', choosePlan:'प्लेटफ़ॉर्म पर बढ़ने के लिए सही प्लान चुनें।', monthly:'मासिक', annual:'वार्षिक', currentPlan:'मौजूदा प्लान', popular:'सबसे लोकप्रिय', perMonth:'प्रति माह', subscribeVip:'VIP सब्सक्राइब', creator:'Creator', becomeCreator:'Creator बनें',
    languageChanged:'भाषा हिंदी में बदल दी गई।'
  }
};

function setText(selector, value, all=false){
  const nodes = all ? document.querySelectorAll(selector) : [document.querySelector(selector)];
  nodes.forEach(el => { if(el) el.textContent = value; });
}
function setHTML(selector, value){ const el=document.querySelector(selector); if(el) el.innerHTML = String(value).replace(/\n/g,'<br>'); }
function setPlaceholder(selector, value){ const el=document.querySelector(selector); if(el) el.placeholder = value; }
function applyLanguage(lang){
  const d = AM_I18N[lang] || AM_I18N.pt;
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
  localStorage.setItem('am_lang', lang);

  setText('.side-rail a[href="#home"] span', d.home);
  setText('.side-rail a[href="#prompts"] span', d.prompts);
  setText('.side-rail a[href="#feed"] span', d.feed);
  setText('.side-rail a[href="#community"] span', d.forum);
  setText('.side-rail a[href="#studio"] span', d.ai);
  setText('.side-rail a[href="#marketplace"] span', d.marketplace);
  setText('.side-rail a[href="#chat"] span', d.chat);

  setText('.topnav a[href="#prompts"]', d.prompts);
  setText('.topnav a[href="#feed"]', d.feed);
  setText('.topnav a[href="#blog"]', d.blog);
  setText('.topnav a[href="#community"]', d.forum);
  setText('.topnav a[href="#marketplace"]', d.marketplace);
  setText('#plansNavLink', d.plans);
  if(!currentUser) setText('#loginBtn', d.login);
  setText('#vipBtn', d.vip);

  const optMap = {pt:'Português', en:'English', hi:'Hindi', es:'Español'};
  document.querySelectorAll('#languageSelect option').forEach(o => { if(optMap[o.value]) o.textContent = optMap[o.value]; });

  setHTML('.welcome-center h1', d.welcomeTitle);
  setText('.welcome-center p', d.welcomeText);
  setText('#enterPlatform', d.welcomeBtn);
  setText('.hero .eyebrow', d.eyebrowHero);
  setHTML('.hero h1', d.heroTitle);
  setHTML('.hero-copy', d.heroCopy);
  setPlaceholder('.prompt-bar input', d.promptPlaceholder);
  setText('.prompt-bar button', d.generate);
  const quick = document.querySelectorAll('.quick-tools button');
  [d.image,d.video,d.prompts,d.upscaler,d.canvas].forEach((txt,i)=>{ if(quick[i]) quick[i].textContent=txt; });

  setText('.filters h3:nth-of-type(1)', d.categories);
  setText('.filters h3:nth-of-type(2)', d.filters);
  const labels = document.querySelectorAll('.filters label');
  [d.prompts,d.design,d.marketing,d.ecommerce,'IA'].forEach((txt,i)=>{ if(labels[i]) labels[i].lastChild.textContent = ' ' + txt; });
  const chips = document.querySelectorAll('.filter-chip');
  [d.latest,d.mostLiked,'VIP',d.free].forEach((txt,i)=>{ if(chips[i]) chips[i].textContent=txt; });

  setText('#prompts .section-head .eyebrow', d.featuredPrompts);
  setText('#prompts .section-head h2', d.promptsFeatured);
  setText('#prompts .section-head a', d.seeAll);
  const heads = document.querySelectorAll('#prompts .section-head');
  if(heads[1]){ const ey=heads[1].querySelector('.eyebrow'); const h=heads[1].querySelector('h2'); if(ey) ey.textContent=d.communityCreations; if(h) h.textContent=d.communityTitle; }
  setText('.marketplace-section .eyebrow', d.marketplace);
  setText('.marketplace-section h2', d.marketTitle);
  setText('.marketplace-section > p:not(.eyebrow)', d.marketCopy);

  setText('#feedPage .feed-title-row .eyebrow', d.feedEyebrow);
  setText('#feedPage .feed-title-row h2', d.feedTitle);
  setText('.feed-pill', d.feedBadge);
  const fm = document.querySelectorAll('.feed-menu-clean button');
  [d.feedMain,d.feedCommunity,d.feedPrompt,d.feedVip,d.feedMarket].forEach((txt,i)=>{ if(fm[i]) fm[i].textContent=txt; });
  setPlaceholder('#feedPostText', d.feedPlaceholder);
  const uploadChip=document.querySelector('.upload-chip'); if(uploadChip) uploadChip.childNodes[0].textContent = d.media + ' ';
  const publishBtn=document.querySelector('#publishFeedPost'); if(publishBtn) publishBtn.textContent = currentUser ? d.publish : d.loginToPost;

  setText('.tab[data-tab="login"]', d.enter);
  setText('.tab[data-tab="register"]', d.register);
  setText('#loginForm h2', d.accountLogin);
  const loginLabels = document.querySelectorAll('#loginForm label'); if(loginLabels[0]) loginLabels[0].textContent=d.userEmail; if(loginLabels[1]) loginLabels[1].textContent=d.password;
  setPlaceholder('#loginUser', d.userEmailPh); setPlaceholder('#loginPassword', d.passwordPh);
  setText('#loginForm button[type="submit"]', d.enter);
  setHTML('#googleLoginBtn', '<span class="google-g">G</span> ' + (d.googleLogin || 'Continuar com Google'));
  setText('#registerForm h2', d.createAccount);
  const regLabels = document.querySelectorAll('#registerForm label'); [d.fullName,d.username,d.password,d.email,d.birth].forEach((txt,i)=>{ if(regLabels[i]) regLabels[i].textContent=txt; });
  setPlaceholder('#fullName', d.fullNamePh); setPlaceholder('#username', d.usernamePh); setPlaceholder('#password', d.createPassPh); setPlaceholder('#email', d.emailPh);
  setText('#registerForm button[type="submit"]', d.finishRegister);
  setHTML('#googleRegisterBtn', '<span class="google-g">G</span> ' + (d.googleLogin || 'Continuar com Google'));
  setText('#registerForm .safe-note', d.safeNote);

  setText('#profilePanel h2', d.myProfile);
  setText('.photo-upload span', d.updatePhoto);
  const profLabels = document.querySelectorAll('#profilePanel label:not(.photo-upload)'); if(profLabels[0]) profLabels[0].textContent=d.name; if(profLabels[1]) profLabels[1].textContent=d.bio;
  setPlaceholder('#profileBio', d.bioPh); setText('#saveProfile', d.saveProfile); setText('#logoutBtn', d.logout);
  setText('#adminLogoutBtn', d.logout);

  setText('#adminPanel .eyebrow', d.adminMaster); setText('#adminPanel h2', d.adminPanel); setPlaceholder('#adminSearch', d.searchUsers); setText('#exportUsers', d.exportCsv);
  const th = document.querySelectorAll('.admin-table th'); [d.photo,d.name,d.username,d.email,d.birth,d.plan,d.status,d.actions].forEach((txt,i)=>{ if(th[i]) th[i].textContent=txt; });

  document.querySelectorAll('.prompt-copy-area .eyebrow').forEach(el=>el.textContent=d.promptFeatured);
  document.querySelectorAll('.prompt-copy-area p:not(.eyebrow)').forEach(el=>el.textContent=d.clickCopy);
  setText('#copyPromptBtn', d.copyPrompt); setText('#copyCelebrationPromptBtn', d.copyPrompt);

  setText('#vipPlansModal .plans-header .eyebrow', d.vipPlans);
  const plansDesc = document.querySelector('#vipPlansModal .plans-header p:not(.eyebrow)'); if(plansDesc) plansDesc.textContent=d.choosePlan;
  setText('#monthlyToggle', d.monthly);
  const annualBtn=document.querySelector('#annualToggle'); if(annualBtn) annualBtn.innerHTML = `${d.annual} <span>-10%</span>`;
  setText('.plan-btn.current', d.currentPlan);
  setText('.popular-ribbon', d.popular);
  document.querySelectorAll('#vipPlansModal .billing-note[data-monthly]').forEach(el=>{ if(el.textContent === 'por mês' || el.textContent === 'per month' || el.dataset.monthly === 'por mês') el.textContent=d.perMonth; });
  const planBtns = document.querySelectorAll('#vipPlansModal .plan-btn'); if(planBtns[1]) planBtns[1].textContent=d.subscribeVip; if(planBtns[2]) planBtns[2].textContent=d.becomeCreator;
  const creatorTitle = document.querySelector('#vipPlansModal .pricing-card:nth-child(3) h3'); if(creatorTitle) creatorTitle.textContent=d.creator;

  toast(d.languageChanged);
}

function initLanguageSystem(){
  const select = document.querySelector('#languageSelect');
  if(!select) return;
  const saved = localStorage.getItem('am_lang') || 'pt';
  select.value = saved;
  select.onchange = e => applyLanguage(e.target.value);
  applyLanguage(saved);
}
document.addEventListener('DOMContentLoaded', initLanguageSystem);

// V37: modo escuro com preferência salva
function applyDarkModePreference(){
  const enabled = localStorage.getItem('am_dark_mode') === 'yes';
  document.body.classList.toggle('dark-mode', enabled);
  const btn = document.querySelector('#darkModeBtn');
  if(btn){
    btn.textContent = enabled ? '☀️' : '🌙';
    btn.title = enabled ? 'Desativar modo escuro' : 'Ativar modo escuro';
  }
}
function toggleDarkMode(){
  const enabled = !(localStorage.getItem('am_dark_mode') === 'yes');
  localStorage.setItem('am_dark_mode', enabled ? 'yes' : 'no');
  applyDarkModePreference();
  toast(enabled ? 'Modo escuro ativado.' : 'Modo claro ativado.');
}
document.addEventListener('DOMContentLoaded', () => {
  applyDarkModePreference();
  document.querySelector('#darkModeBtn')?.addEventListener('click', toggleDarkMode);
});



// V42: tradução ampliada dos textos fixos dos cards, popups, comunidade e prompts
const AM_EXTRA_I18N_V42 = {
  pt: {
    prompt1Title:'Crie essa imagem',
    prompt1Desc:'Prompt editorial hiper-realista para imagem premium.',
    prompt2Title:'Super Pack Celebração',
    prompt2Desc:'Prompt comemorativo editorial hiper-realista.',
    colorTitle:'Color Grading',
    colorDesc:'Paletas e direção de arte profissional.',
    socialTitle:'Social Pack',
    socialDesc:'Posts, reels e carrosséis prontos.',
    brandTitle:'Brand Builder',
    brandDesc:'Crie identidade visual em minutos.',
    minimalTitle:'Minimal AI Portrait',
    minimalDesc:'Prompt para retrato realista editorial.',
    mentoriaTitle:'Mentoria Magnética',
    mentoriaDesc:'Conteúdo premium para transformar presença em influência.',
    standTitle:'Stands VIP',
    standDesc:'Vitrine exclusiva para vender produtos digitais e criativos.',
    premiumPromptTitle:'Prompts premium',
    premiumPromptDesc:'Venda prompts prontos, packs de imagem e bibliotecas de criação.',
    founderTitle:'Mentoria Magnética',
    founderDesc:'Espaço para assinatura, aulas e produtos do fundador.',
    noDebates:'Nenhum debate publicado ainda.',
    noDebatesDesc:'Quando um usuário logado criar um debate, ele aparecerá aqui.',
    newDebate:'+ Novo Debate',
    communityHeroTitle:'Portfólio, diálogo e oportunidade no mesmo lugar',
    communityHeroDesc:'Mostre seus trabalhos, compartilhe prompts, peça feedback, encontre parceiros e transforme conversas em autoridade.',
    discussions:'Discussões em destaque',
    forumPremium:'Fórum premium',
    favorites:'Favoritos',
    like:'Curtir',
    dislike:'Descurtir',
    favorite:'Favoritar'
  },
  en: {
    prompt1Title:'Create this image',
    prompt1Desc:'Hyper-realistic editorial prompt for a premium image.',
    prompt2Title:'Celebration Super Pack',
    prompt2Desc:'Hyper-realistic editorial commemorative prompt.',
    colorTitle:'Color Grading',
    colorDesc:'Professional palettes and art direction.',
    socialTitle:'Social Pack',
    socialDesc:'Ready-made posts, reels and carousels.',
    brandTitle:'Brand Builder',
    brandDesc:'Create a visual identity in minutes.',
    minimalTitle:'Minimal AI Portrait',
    minimalDesc:'Prompt for realistic editorial portraits.',
    mentoriaTitle:'Magnetic Mentorship',
    mentoriaDesc:'Premium content to transform presence into influence.',
    standTitle:'VIP Stands',
    standDesc:'Exclusive storefront to sell digital and creative products.',
    premiumPromptTitle:'Premium prompts',
    premiumPromptDesc:'Sell ready-made prompts, image packs and creation libraries.',
    founderTitle:'Magnetic Mentorship',
    founderDesc:'Space for subscriptions, classes and founder products.',
    noDebates:'No debates published yet.',
    noDebatesDesc:'When a logged-in user creates a debate, it will appear here.',
    newDebate:'+ New Debate',
    communityHeroTitle:'Portfolio, dialogue and opportunity in one place',
    communityHeroDesc:'Show your work, share prompts, ask for feedback, find partners and turn conversations into authority.',
    discussions:'Featured discussions',
    forumPremium:'Premium forum',
    favorites:'Favorites',
    like:'Like',
    dislike:'Dislike',
    favorite:'Favorite'
  },
  es: {
    prompt1Title:'Crea esta imagen',
    prompt1Desc:'Prompt editorial hiperrealista para una imagen premium.',
    prompt2Title:'Super Pack Celebración',
    prompt2Desc:'Prompt conmemorativo editorial hiperrealista.',
    colorTitle:'Color Grading',
    colorDesc:'Paletas y dirección de arte profesional.',
    socialTitle:'Social Pack',
    socialDesc:'Posts, reels y carruseles listos.',
    brandTitle:'Brand Builder',
    brandDesc:'Crea identidad visual en minutos.',
    minimalTitle:'Retrato IA Minimalista',
    minimalDesc:'Prompt para retrato editorial realista.',
    mentoriaTitle:'Mentoría Magnética',
    mentoriaDesc:'Contenido premium para transformar presencia en influencia.',
    standTitle:'Stands VIP',
    standDesc:'Vitrina exclusiva para vender productos digitales y creativos.',
    premiumPromptTitle:'Prompts premium',
    premiumPromptDesc:'Vende prompts listos, packs de imagen y bibliotecas creativas.',
    founderTitle:'Mentoría Magnética',
    founderDesc:'Espacio para suscripción, clases y productos del fundador.',
    noDebates:'Aún no hay debates publicados.',
    noDebatesDesc:'Cuando un usuario conectado cree un debate, aparecerá aquí.',
    newDebate:'+ Nuevo Debate',
    communityHeroTitle:'Portafolio, diálogo y oportunidad en un solo lugar',
    communityHeroDesc:'Muestra tus trabajos, comparte prompts, pide feedback, encuentra socios y transforma conversaciones en autoridad.',
    discussions:'Discusiones destacadas',
    forumPremium:'Foro premium',
    favorites:'Favoritos',
    like:'Me gusta',
    dislike:'No me gusta',
    favorite:'Favorito'
  },
  hi: {
    prompt1Title:'यह इमेज बनाएं',
    prompt1Desc:'प्रीमियम इमेज के लिए हाइपर-रियलिस्टिक एडिटोरियल प्रॉम्प्ट।',
    prompt2Title:'सेलिब्रेशन सुपर पैक',
    prompt2Desc:'हाइपर-रियलिस्टिक एडिटोरियल सेलिब्रेशन प्रॉम्प्ट।',
    colorTitle:'कलर ग्रेडिंग',
    colorDesc:'प्रोफेशनल पैलेट और आर्ट डायरेक्शन।',
    socialTitle:'सोशल पैक',
    socialDesc:'तैयार पोस्ट, रील्स और कैरोसेल।',
    brandTitle:'ब्रांड बिल्डर',
    brandDesc:'मिनटों में विज़ुअल आइडेंटिटी बनाएं।',
    minimalTitle:'मिनिमल AI पोर्ट्रेट',
    minimalDesc:'रियलिस्टिक एडिटोरियल पोर्ट्रेट के लिए प्रॉम्प्ट।',
    mentoriaTitle:'मैग्नेटिक मेंटरशिप',
    mentoriaDesc:'प्रेज़ेंस को इन्फ्लुएंस में बदलने के लिए प्रीमियम कंटेंट।',
    standTitle:'VIP स्टैंड्स',
    standDesc:'डिजिटल और क्रिएटिव प्रोडक्ट बेचने के लिए एक्सक्लूसिव विंडो।',
    premiumPromptTitle:'प्रीमियम प्रॉम्प्ट्स',
    premiumPromptDesc:'तैयार प्रॉम्प्ट्स, इमेज पैक्स और क्रिएशन लाइब्रेरी बेचें।',
    founderTitle:'मैग्नेटिक मेंटरशिप',
    founderDesc:'सब्सक्रिप्शन, क्लासेस और फाउंडर प्रोडक्ट्स के लिए जगह।',
    noDebates:'अभी कोई डिबेट प्रकाशित नहीं हुई।',
    noDebatesDesc:'लॉगिन यूज़र जब डिबेट बनाएगा, वह यहाँ दिखेगी।',
    newDebate:'+ नई डिबेट',
    communityHeroTitle:'पोर्टफोलियो, संवाद और अवसर एक ही जगह',
    communityHeroDesc:'अपना काम दिखाएं, प्रॉम्प्ट साझा करें, फीडबैक लें, पार्टनर खोजें और संवाद को अथॉरिटी में बदलें।',
    discussions:'प्रमुख चर्चाएँ',
    forumPremium:'प्रीमियम फोरम',
    favorites:'फेवरिट्स',
    like:'लाइक',
    dislike:'डिस्लाइक',
    favorite:'फेवरिट'
  }
};
function applyExtraTranslationsV42(lang){
  const e = AM_EXTRA_I18N_V42[lang] || AM_EXTRA_I18N_V42.pt;
  const byId = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  const setCard = (sel, title, desc) => {
    const card = document.querySelector(sel);
    if(card){
      const h = card.querySelector('h3'); const p = card.querySelector('p');
      if(h) h.textContent = title;
      if(p) p.textContent = desc;
    }
  };
  setCard('#featuredPromptCard', e.prompt1Title, e.prompt1Desc);
  setCard('#celebrationPromptCard', e.prompt2Title, e.prompt2Desc);
  setCard('[data-prompt-id="color-grading"]', e.colorTitle, e.colorDesc);
  setCard('[data-prompt-id="social-pack"]', e.socialTitle, e.socialDesc);
  setCard('.img2', e.brandTitle, e.brandDesc);
  const creations = document.querySelectorAll('.creation');
  if(creations[1]){ const h=creations[1].querySelector('h3'); const p=creations[1].querySelector('p'); if(h)h.textContent=e.minimalTitle; if(p)p.textContent=e.minimalDesc; }
  if(creations[2]){ const h=creations[2].querySelector('h3'); const p=creations[2].querySelector('p'); if(h)h.textContent=e.mentoriaTitle; if(p)p.textContent=e.mentoriaDesc; }
  const markets = document.querySelectorAll('.market-card');
  [[e.standTitle,e.standDesc],[e.premiumPromptTitle,e.premiumPromptDesc],[e.founderTitle,e.founderDesc]].forEach((pair,i)=>{
    if(markets[i]){ const s=markets[i].querySelector('strong'); const p=markets[i].querySelector('p'); if(s)s.textContent=pair[0]; if(p)p.textContent=pair[1]; }
  });
  const favBtn = [...document.querySelectorAll('.filter-chip')].find(b => /favoritos|favorites|फेवरिट्स/i.test(b.textContent));
  if(favBtn) favBtn.textContent = e.favorites;
  document.querySelectorAll('.prompt-like').forEach(btn=>{ const b=btn.querySelector('b'); btn.childNodes[0].textContent = '👍 '; if(btn.childNodes[1]){} });
  document.querySelectorAll('.prompt-dislike').forEach(btn=>{ btn.childNodes[0].textContent = '👎 '; });
  document.querySelectorAll('.prompt-favorite').forEach(btn=>{ btn.childNodes[0].textContent = '☆ '; });
  const heroTitle = document.querySelector('.community-hero-card h2'); if(heroTitle) heroTitle.textContent = e.communityHeroTitle;
  const heroDesc = document.querySelector('.community-hero-card p:not(.eyebrow)'); if(heroDesc) heroDesc.textContent = e.communityHeroDesc;
  const newBtn = document.querySelector('#newTopicBtn'); if(newBtn) newBtn.textContent = e.newDebate;
  const commHead = document.querySelector('.community-section-head h3'); if(commHead) commHead.textContent = e.discussions;
  const forumPill = document.querySelector('.community-section-head .feed-pill'); if(forumPill) forumPill.textContent = e.forumPremium;
  document.querySelectorAll('.community-empty').forEach(empty=>{
    const strong = empty.querySelector('strong'); const p = empty.querySelector('p');
    if(strong) strong.textContent = e.noDebates;
    if(p) p.textContent = e.noDebatesDesc;
  });
}
const originalApplyLanguageV42 = typeof applyLanguage === 'function' ? applyLanguage : null;
if(originalApplyLanguageV42){
  applyLanguage = function(lang){
    originalApplyLanguageV42(lang);
    applyExtraTranslationsV42(lang);
  };
}
document.addEventListener('DOMContentLoaded', () => {
  applyExtraTranslationsV42(localStorage.getItem('am_lang') || 'pt');
});




// V43 — Conta no topo + Área do Cliente/Admin + Suporte + Senha
const SUPPORT_TICKETS_KEY = 'am_support_tickets_v43';
let supportTickets = JSON.parse(localStorage.getItem(SUPPORT_TICKETS_KEY) || '[]');
let pendingPasswordCode = null;
let replyingTicketId = null;

function saveSupportTickets(){
  localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(supportTickets));
}
function isValidSitePassword(password){
  return typeof password === 'string'
    && password.length >= 8
    && /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}
function getUserEmail(){
  return (currentUser && currentUser.email) ? currentUser.email : '';
}
function accountPhotoHTML(){
  const photo = currentUser && currentUser.photo;
  if(photo) return `<img src="${photo}" alt="Foto">`;
  const initials = currentUser ? (currentUser.name || currentUser.username || 'AM').trim().slice(0,1).toUpperCase() : 'AM';
  return initials || 'AM';
}
function refreshAccountMenuV43(){
  const avatar = document.getElementById('accountAvatar');
  const greet = document.getElementById('accountGreeting');
  const loginBtn = document.getElementById('loginBtn');
  const accountBtn = document.getElementById('accountInfoBtn');
  const areaBtn = document.getElementById('clientAreaBtn');
  const changeBtn = document.getElementById('changePasswordBtn');
  const logoutBtn = document.getElementById('logoutMenuBtn');
  if(avatar) avatar.innerHTML = accountPhotoHTML();
  if(greet) greet.textContent = currentUser ? `Olá, ${currentUser.name || currentUser.username || 'Usuário'}!` : 'Conta';
  if(loginBtn) loginBtn.style.display = currentUser ? 'none' : '';
  if(accountBtn) accountBtn.style.display = currentUser ? '' : 'none';
  if(areaBtn){
    areaBtn.style.display = currentUser ? '' : 'none';
    areaBtn.textContent = currentUser && currentUser.role === 'admin' ? 'Área do Administrador' : 'Área do Cliente';
  }
  if(changeBtn) changeBtn.style.display = currentUser ? '' : 'none';
  if(logoutBtn) logoutBtn.style.display = currentUser ? '' : 'none';
}
const originalRefreshUserUIV43 = typeof refreshUserUI === 'function' ? refreshUserUI : null;
if(originalRefreshUserUIV43){
  refreshUserUI = function(){
    originalRefreshUserUIV43();
    refreshAccountMenuV43();
  };
}
function closeAccountDropdown(){
  document.getElementById('accountDropdown')?.classList.add('hidden');
}
function toggleAccountDropdown(){
  document.getElementById('accountDropdown')?.classList.toggle('hidden');
}
function showAccountInfo(){
  closeAccountDropdown();
  if(!currentUser){ openAuth('login'); return; }
  document.getElementById('profilePanel')?.classList.remove('hidden');
}
function openChangePasswordModal(){
  closeAccountDropdown();
  if(!currentUser){ openAuth('login'); return toast('Faça login para mudar a senha.'); }
  const modal = document.getElementById('changePasswordModal');
  const email = document.getElementById('changePasswordEmail');
  const area = document.getElementById('passwordCodeArea');
  if(email) email.value = currentUser.email || '';
  if(area) area.classList.add('hidden');
  modal?.classList.remove('hidden');
}
function openForgotPasswordModal(){
  closeAuth();
  const modal = document.getElementById('forgotPasswordModal');
  const email = document.getElementById('forgotPasswordEmail');
  const loginEmail = document.getElementById('loginUser')?.value || '';
  if(email) email.value = loginEmail.includes('@') ? loginEmail : '';
  modal?.classList.remove('hidden');
}
function sendMailtoPasswordCode(email, code){
  const subject = encodeURIComponent('Código de confirmação - Assinatura Magnética');
  const body = encodeURIComponent(`Olá!\n\nSeu código de confirmação para alterar a senha é: ${code}\n\nSe você não solicitou esta alteração, ignore esta mensagem.\n\nAssinatura Magnética`);
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}
function sendPasswordCode(){
  const email = (document.getElementById('changePasswordEmail')?.value || '').trim();
  if(!email) return toast('Digite o e-mail da conta.');
  pendingPasswordCode = String(Math.floor(100000 + Math.random() * 900000));
  localStorage.setItem('am_pending_password_code', pendingPasswordCode);
  document.getElementById('passwordCodeArea')?.classList.remove('hidden');
  toast('Código gerado. O e-mail será aberto para envio.');
  setTimeout(()=>sendMailtoPasswordCode(email, pendingPasswordCode), 400);
}
function confirmPasswordChange(){
  const code = (document.getElementById('passwordCodeInput')?.value || '').trim();
  const newPass = document.getElementById('newPasswordInput')?.value || '';
  const savedCode = pendingPasswordCode || localStorage.getItem('am_pending_password_code');
  if(!savedCode || code !== savedCode) return toast('Código inválido.');
  if(!isValidSitePassword(newPass)) return toast('Senha inválida: use mínimo 8 caracteres, 1 maiúscula e 1 símbolo.');
  if(!currentUser) return toast('Faça login novamente.');
  currentUser.password = newPass;
  users = users.map(u => {
    const same = (currentUser.id && u.id === currentUser.id) || (currentUser.email && u.email === currentUser.email) || (currentUser.username && u.username === currentUser.username);
    return same ? {...u, password:newPass} : u;
  });
  saveUsers();
  localStorage.setItem('am_user', JSON.stringify(currentUser));
  localStorage.removeItem('am_pending_password_code');
  pendingPasswordCode = null;
  document.getElementById('changePasswordModal')?.classList.add('hidden');
  toast('Senha alterada com sucesso.');
}
function requestForgotPassword(){
  const email = (document.getElementById('forgotPasswordEmail')?.value || '').trim();
  if(!email) return toast('Digite seu e-mail.');
  const subject = encodeURIComponent('Solicitação de redefinição de senha - Assinatura Magnética');
  const body = encodeURIComponent(`Olá, solicito a redefinição da senha da minha conta.\n\nE-mail cadastrado: ${email}\n\nAssinatura Magnética`);
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  toast('Solicitação de redefinição aberta no seu e-mail.');
}
function openClientArea(){
  closeAccountDropdown();
  if(!currentUser){ openAuth('login'); return toast('Faça login para acessar a área da conta.'); }
  document.getElementById('normalContent')?.classList.add('feed-hidden');
  document.getElementById('feedPage')?.classList.add('hidden');
  document.getElementById('communityPage')?.classList.add('hidden');
  const area = document.getElementById('clientAreaPage');
  if(area) area.classList.remove('hidden');
  renderClientArea();
  window.scrollTo({top:0, behavior:'smooth'});
}
function closeClientArea(){
  document.getElementById('clientAreaPage')?.classList.add('hidden');
  document.getElementById('normalContent')?.classList.remove('feed-hidden');
  if(location.hash === '#feed' || location.hash === '#community') location.hash = '#home';
}
function currentUserTickets(){
  if(!currentUser) return [];
  if(currentUser.role === 'admin') return supportTickets;
  const key = currentUserKey();
  const email = (currentUser.email || '').toLowerCase();
  return supportTickets.filter(t => t.owner === key || (email && String(t.email || '').toLowerCase() === email));
}
function renderClientArea(){
  const isAdmin = currentUser && currentUser.role === 'admin';
  const title = document.getElementById('clientAreaTitle');
  const eyebrow = document.getElementById('clientAreaEyebrow');
  const badge = document.getElementById('clientAreaBadge');
  const plan = document.getElementById('clientPlanInfo');
  if(eyebrow) eyebrow.textContent = isAdmin ? 'Área do Administrador' : 'Área do Cliente';
  if(title) title.textContent = isAdmin ? 'Central administrativa' : 'Bem-vindo à sua central';
  if(badge) badge.textContent = isAdmin ? 'Admin' : 'Cliente';
  if(plan) plan.textContent = currentUser?.plan || 'Free';
  const ticketCount = document.getElementById('clientTicketCount');
  if(ticketCount) ticketCount.textContent = `${currentUserTickets().length} ticket${currentUserTickets().length===1?'':'s'}`;
  renderSupportTickets();
}
function renderSupportTickets(){
  const list = document.getElementById('supportTicketsList');
  if(!list) return;
  const tickets = currentUserTickets();
  if(!tickets.length){
    list.innerHTML = '<div class="client-card"><p>Nenhum ticket aberto ainda.</p></div>';
    return;
  }
  list.innerHTML = tickets.slice().reverse().map(t => {
    const replies = (t.replies || []).map(r => `<div class="ticket-reply"><strong>${safeText(r.by)}</strong><span>${formatFeedDate(r.createdAt)}</span><p>${safeText(r.text)}</p></div>`).join('');
    const adminButton = currentUser && currentUser.role === 'admin' ? `<button class="btn primary" onclick="openAdminReply(${t.id})">Responder</button>` : '';
    return `<article class="ticket-card">
      <div class="ticket-head"><div><strong>${safeText(t.subject)}</strong><span>${safeText(t.name)} • ${formatFeedDate(t.createdAt)}</span></div><em>${safeText(t.status || 'Aberto')}</em></div>
      <p>${safeText(t.message)}</p>
      <div class="ticket-actions">${adminButton}</div>
      <div class="ticket-replies">${replies}</div>
    </article>`;
  }).join('');
}
function openSupportTicketModal(){
  if(!currentUser){ openAuth('login'); return toast('Faça login para abrir suporte.'); }
  document.getElementById('supportTicketModal')?.classList.remove('hidden');
}
function publishSupportTicket(){
  if(!currentUser){ openAuth('login'); return; }
  const subject = (document.getElementById('ticketSubject')?.value || '').trim();
  const message = (document.getElementById('ticketMessage')?.value || '').trim();
  if(!subject || !message) return toast('Preencha assunto e mensagem.');
  supportTickets.push({
    id: Date.now(),
    owner: currentUserKey(),
    name: currentUser.name || currentUser.username || 'Usuário',
    email: currentUser.email || '',
    subject,
    message,
    status:'Aberto',
    replies:[],
    createdAt:new Date().toISOString()
  });
  saveSupportTickets();
  document.getElementById('ticketSubject').value = '';
  document.getElementById('ticketMessage').value = '';
  document.getElementById('supportTicketModal')?.classList.add('hidden');
  renderClientArea();
  toast('Ticket enviado ao suporte.');
}
window.openAdminReply = function(id){
  replyingTicketId = id;
  const ticket = supportTickets.find(t => t.id === id);
  if(!ticket) return;
  document.getElementById('adminReplyTicketInfo').textContent = `${ticket.name} — ${ticket.subject}`;
  document.getElementById('adminReplyText').value = '';
  document.getElementById('adminReplyModal')?.classList.remove('hidden');
};
function sendAdminReply(){
  if(!currentUser || currentUser.role !== 'admin') return toast('Acesso restrito ao admin.');
  const text = (document.getElementById('adminReplyText')?.value || '').trim();
  if(!text) return toast('Digite a resposta.');
  supportTickets = supportTickets.map(t => {
    if(t.id !== replyingTicketId) return t;
    const replies = Array.isArray(t.replies) ? t.replies : [];
    return {...t, status:'Respondido', replies:[...replies, {by:'Admin', text, createdAt:new Date().toISOString()}]};
  });
  saveSupportTickets();
  document.getElementById('adminReplyModal')?.classList.add('hidden');
  renderClientArea();
  toast('Resposta enviada ao cliente.');
}
function bindAccountV43(){
  refreshAccountMenuV43();
  document.getElementById('accountMenuBtn')?.addEventListener('click', toggleAccountDropdown);
  document.addEventListener('click', e => {
    const wrap = document.querySelector('.account-menu-wrap');
    if(wrap && !wrap.contains(e.target)) closeAccountDropdown();
  });
  document.getElementById('loginBtn')?.addEventListener('click', () => { closeAccountDropdown(); openAuth('login'); });
  document.getElementById('accountInfoBtn')?.addEventListener('click', showAccountInfo);
  document.getElementById('clientAreaBtn')?.addEventListener('click', openClientArea);
  document.getElementById('changePasswordBtn')?.addEventListener('click', openChangePasswordModal);
  document.getElementById('logoutMenuBtn')?.addEventListener('click', logoutCurrentUser);
  document.getElementById('forgotPasswordBtn')?.addEventListener('click', openForgotPasswordModal);
  document.getElementById('closeChangePassword')?.addEventListener('click', () => document.getElementById('changePasswordModal')?.classList.add('hidden'));
  document.getElementById('sendPasswordCodeBtn')?.addEventListener('click', sendPasswordCode);
  document.getElementById('confirmPasswordChangeBtn')?.addEventListener('click', confirmPasswordChange);
  document.getElementById('closeForgotPassword')?.addEventListener('click', () => document.getElementById('forgotPasswordModal')?.classList.add('hidden'));
  document.getElementById('sendForgotPasswordBtn')?.addEventListener('click', requestForgotPassword);
  document.getElementById('backFromClientArea')?.addEventListener('click', closeClientArea);
  document.querySelectorAll('.client-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.client-nav').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.clientTab;
      document.querySelectorAll('.client-tab').forEach(sec=>sec.classList.remove('active'));
      const map = {overview:'clientOverview',services:'clientServices',support:'clientSupport',payments:'clientPayments',base:'clientBase'};
      document.getElementById(map[tab])?.classList.add('active');
      renderClientArea();
    });
  });
  document.getElementById('newSupportTicketBtn')?.addEventListener('click', openSupportTicketModal);
  document.getElementById('closeSupportTicket')?.addEventListener('click', () => document.getElementById('supportTicketModal')?.classList.add('hidden'));
  document.getElementById('publishTicketBtn')?.addEventListener('click', publishSupportTicket);
  document.getElementById('closeAdminReply')?.addEventListener('click', () => document.getElementById('adminReplyModal')?.classList.add('hidden'));
  document.getElementById('sendAdminReplyBtn')?.addEventListener('click', sendAdminReply);
}
document.addEventListener('DOMContentLoaded', bindAccountV43);

// reforço de validação de senha no cadastro
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  if(!form) return;
  form.addEventListener('submit', e => {
    const pass = document.getElementById('password')?.value || '';
    if(!isValidSitePassword(pass)){
      e.preventDefault();
      e.stopImmediatePropagation();
      toast('Senha inválida: use mínimo 8 caracteres, 1 letra maiúscula e 1 símbolo.');
      return false;
    }
  }, true);
});




// V45 — Sistema de notificações Cliente/Admin
const NOTIFICATIONS_KEY = 'am_notifications_v45';
let amNotifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');

function saveNotificationsV45(){
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(amNotifications));
}
function currentNotificationUserKey(){
  if(!currentUser) return 'guest';
  return String(currentUser.id || currentUser.email || currentUser.username || currentUser.name || 'user');
}
function pushNotificationV45({to='all', role='', title='', message='', type='info', link=''}) {
  amNotifications.push({
    id: Date.now() + Math.random(),
    to,
    role,
    title,
    message,
    type,
    link,
    readBy: [],
    createdAt: new Date().toISOString()
  });
  saveNotificationsV45();
  renderNotificationsV45();
}
function visibleNotificationsV45(){
  if(!currentUser) return [];
  const me = currentNotificationUserKey();
  const role = currentUser.role || 'user';
  return amNotifications.filter(n => {
    if(n.to === 'all') return true;
    if(n.to === me) return true;
    if(n.role && n.role === role) return true;
    if(n.role === 'admin' && role === 'admin') return true;
    return false;
  }).slice().reverse();
}
function unreadNotificationsV45(){
  const me = currentNotificationUserKey();
  return visibleNotificationsV45().filter(n => !(n.readBy || []).includes(me));
}
function renderNotificationsV45(){
  const count = document.getElementById('notificationCount');
  const list = document.getElementById('notificationList');
  const unread = unreadNotificationsV45();
  if(count){
    count.textContent = unread.length;
    count.classList.toggle('hidden', unread.length === 0);
  }
  if(!list) return;
  const notifications = visibleNotificationsV45();
  if(!currentUser){
    list.innerHTML = '<div class="notification-empty">Faça login para ver notificações.</div>';
    return;
  }
  if(!notifications.length){
    list.innerHTML = '<div class="notification-empty">Nenhuma notificação por enquanto.</div>';
    return;
  }
  list.innerHTML = notifications.map(n => `
    <button class="notification-item" onclick="openNotificationV45('${n.id}')">
      <strong>${safeText(n.title)}</strong>
      <span>${safeText(n.message)}</span>
    </button>
  `).join('');
}
window.openNotificationV45 = function(id){
  const me = currentNotificationUserKey();
  amNotifications = amNotifications.map(n => String(n.id) === String(id)
    ? {...n, readBy: Array.from(new Set([...(n.readBy || []), me]))}
    : n
  );
  saveNotificationsV45();
  renderNotificationsV45();
  const n = amNotifications.find(x => String(x.id) === String(id));
  if(n && n.link){
    if(n.link === 'client-area') openClientArea();
    else location.hash = n.link;
  }
};
function clearNotificationsV45(){
  const me = currentNotificationUserKey();
  amNotifications = amNotifications.map(n => ({...n, readBy: Array.from(new Set([...(n.readBy || []), me]))}));
  saveNotificationsV45();
  renderNotificationsV45();
}
function bindNotificationsV45(){
  document.getElementById('notificationBtn')?.addEventListener('click', () => {
    if(!currentUser){ openAuth('login'); return toast('Faça login para ver notificações.'); }
    document.getElementById('notificationPanel')?.classList.toggle('hidden');
    renderNotificationsV45();
  });
  document.getElementById('clearNotificationsBtn')?.addEventListener('click', clearNotificationsV45);
  document.addEventListener('click', e => {
    const wrap = document.querySelector('.notification-wrap');
    if(wrap && !wrap.contains(e.target)) document.getElementById('notificationPanel')?.classList.add('hidden');
  });
  renderNotificationsV45();
}
document.addEventListener('DOMContentLoaded', bindNotificationsV45);

// Hooks simples para gerar notificações em ações importantes
const originalPublishSupportTicketV45 = typeof publishSupportTicket === 'function' ? publishSupportTicket : null;
if(originalPublishSupportTicketV45){
  publishSupportTicket = function(){
    const before = supportTickets.length;
    originalPublishSupportTicketV45();
    if(supportTickets.length > before){
      const ticket = supportTickets[supportTickets.length - 1];
      pushNotificationV45({
        role:'admin',
        title:'Novo ticket aberto',
        message:`${ticket.name} abriu: ${ticket.subject}`,
        type:'ticket',
        link:'client-area'
      });
    }
  };
}

const originalSendAdminReplyV45 = typeof sendAdminReply === 'function' ? sendAdminReply : null;
if(originalSendAdminReplyV45){
  sendAdminReply = function(){
    const ticket = supportTickets.find(t => t.id === replyingTicketId);
    originalSendAdminReplyV45();
    if(ticket){
      pushNotificationV45({
        to: ticket.owner,
        title:'Seu ticket foi respondido',
        message:`Resposta no ticket: ${ticket.subject}`,
        type:'ticket-reply',
        link:'client-area'
      });
    }
  };
}

const originalRenderFeedPostsV45 = typeof renderFeedPosts === 'function' ? renderFeedPosts : null;
if(originalRenderFeedPostsV45){
  renderFeedPosts = function(){
    originalRenderFeedPostsV45();
    renderNotificationsV45();
  };
}

const originalRefreshUserUIV45 = typeof refreshUserUI === 'function' ? refreshUserUI : null;
if(originalRefreshUserUIV45){
  refreshUserUI = function(){
    originalRefreshUserUIV45();
    renderNotificationsV45();
  };
}




// V46 — Central de atendimento mais profissional: protocolo, busca, edição, encerramento e reabertura
let editingTicketIdV46 = null;

function generateTicketProtocolV46(){
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth()+1).padStart(2,'0');
  const dd = String(now.getDate()).padStart(2,'0');
  const seq = String((supportTickets.length || 0) + 1).padStart(4,'0');
  return `AM-${yyyy}${mm}${dd}-${seq}`;
}
function ticketMatchesSearchV46(ticket, query, status){
  const q = String(query || '').trim().toLowerCase();
  const statusOk = !status || status === 'all' || ticket.status === status;
  if(!statusOk) return false;
  if(!q) return true;
  return [
    ticket.protocol,
    ticket.subject,
    ticket.message,
    ticket.name,
    ticket.email,
    ticket.status
  ].join(' ').toLowerCase().includes(q);
}
function filteredTicketsV46(){
  const q = document.getElementById('ticketSearchInput')?.value || '';
  const status = document.getElementById('ticketStatusFilter')?.value || 'all';
  return currentUserTickets().filter(t => ticketMatchesSearchV46(t, q, status));
}
function normalizeTicketsV46(){
  let changed = false;
  supportTickets = supportTickets.map((t, index) => {
    if(!t.protocol){
      changed = true;
      const d = new Date(t.createdAt || Date.now());
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const dd = String(d.getDate()).padStart(2,'0');
      return {...t, protocol:`AM-${yyyy}${mm}${dd}-${String(index+1).padStart(4,'0')}`};
    }
    return t;
  });
  if(changed) saveSupportTickets();
}
const originalPublishSupportTicketV46 = typeof publishSupportTicket === 'function' ? publishSupportTicket : null;
if(originalPublishSupportTicketV46){
  publishSupportTicket = function(){
    if(!currentUser){ openAuth('login'); return; }
    const subject = (document.getElementById('ticketSubject')?.value || '').trim();
    const message = (document.getElementById('ticketMessage')?.value || '').trim();
    if(!subject || !message) return toast('Preencha assunto e mensagem.');
    const ticket = {
      id: Date.now(),
      protocol: generateTicketProtocolV46(),
      owner: currentUserKey(),
      name: currentUser.name || currentUser.username || 'Usuário',
      email: currentUser.email || '',
      subject,
      message,
      status:'Aberto',
      replies:[],
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
    supportTickets.push(ticket);
    saveSupportTickets();
    document.getElementById('ticketSubject').value = '';
    document.getElementById('ticketMessage').value = '';
    document.getElementById('supportTicketModal')?.classList.add('hidden');
    renderClientArea();
    toast(`Ticket aberto. Protocolo: ${ticket.protocol}`);
    if(typeof pushNotificationV45 === 'function'){
      pushNotificationV45({
        role:'admin',
        title:'Novo ticket aberto',
        message:`${ticket.protocol} • ${ticket.name}: ${ticket.subject}`,
        type:'ticket',
        link:'client-area'
      });
    }
  };
}
function ticketStatusClassV46(status){
  return String(status || 'Aberto').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function canEditTicketV46(ticket){
  if(!currentUser) return false;
  if(currentUser.role === 'admin') return true;
  return ticket.owner === currentUserKey() && ticket.status !== 'Encerrado';
}
window.editTicketV46 = function(id){
  const ticket = supportTickets.find(t => t.id === id);
  if(!ticket || !canEditTicketV46(ticket)) return toast('Você não pode editar este ticket.');
  editingTicketIdV46 = id;
  document.getElementById('editTicketSubject').value = ticket.subject || '';
  document.getElementById('editTicketMessage').value = ticket.message || '';
  document.getElementById('editTicketModal')?.classList.remove('hidden');
};
function saveTicketEditV46(){
  const subject = (document.getElementById('editTicketSubject')?.value || '').trim();
  const message = (document.getElementById('editTicketMessage')?.value || '').trim();
  if(!subject || !message) return toast('Preencha assunto e mensagem.');
  supportTickets = supportTickets.map(t => t.id === editingTicketIdV46 ? {...t, subject, message, updatedAt:new Date().toISOString()} : t);
  saveSupportTickets();
  document.getElementById('editTicketModal')?.classList.add('hidden');
  renderClientArea();
  toast('Ticket atualizado.');
}
window.closeTicketV46 = function(id){
  if(!currentUser || currentUser.role !== 'admin') return toast('Apenas admin pode encerrar ticket.');
  supportTickets = supportTickets.map(t => t.id === id ? {...t, status:'Encerrado', closedAt:new Date().toISOString(), updatedAt:new Date().toISOString()} : t);
  saveSupportTickets();
  renderClientArea();
  toast('Ticket encerrado.');
};
window.reopenTicketV46 = function(id){
  const ticket = supportTickets.find(t => t.id === id);
  if(!ticket || !currentUser) return;
  if(ticket.owner !== currentUserKey() && currentUser.role !== 'admin') return toast('Você não pode reabrir este ticket.');
  supportTickets = supportTickets.map(t => t.id === id ? {...t, status:'Aberto', reopenedAt:new Date().toISOString(), updatedAt:new Date().toISOString()} : t);
  saveSupportTickets();
  renderClientArea();
  toast('Ticket reaberto.');
  if(typeof pushNotificationV45 === 'function'){
    pushNotificationV45({
      role:'admin',
      title:'Ticket reaberto',
      message:`${ticket.protocol || 'Sem protocolo'} • ${ticket.subject}`,
      type:'ticket',
      link:'client-area'
    });
  }
};
const originalSendAdminReplyV46 = typeof sendAdminReply === 'function' ? sendAdminReply : null;
if(originalSendAdminReplyV46){
  sendAdminReply = function(){
    if(!currentUser || currentUser.role !== 'admin') return toast('Acesso restrito ao admin.');
    const text = (document.getElementById('adminReplyText')?.value || '').trim();
    if(!text) return toast('Digite a resposta.');
    const ticket = supportTickets.find(t => t.id === replyingTicketId);
    supportTickets = supportTickets.map(t => {
      if(t.id !== replyingTicketId) return t;
      const replies = Array.isArray(t.replies) ? t.replies : [];
      return {...t, status:'Respondido', updatedAt:new Date().toISOString(), replies:[...replies, {by:'Admin', text, createdAt:new Date().toISOString()}]};
    });
    saveSupportTickets();
    document.getElementById('adminReplyModal')?.classList.add('hidden');
    renderClientArea();
    toast('Resposta enviada ao cliente.');
    if(ticket && typeof pushNotificationV45 === 'function'){
      pushNotificationV45({
        to: ticket.owner,
        title:'Seu ticket foi respondido',
        message:`${ticket.protocol || ''} • ${ticket.subject}`,
        type:'ticket-reply',
        link:'client-area'
      });
    }
  };
}
const originalRenderSupportTicketsV46 = typeof renderSupportTickets === 'function' ? renderSupportTickets : null;
if(originalRenderSupportTicketsV46){
  renderSupportTickets = function(){
    normalizeTicketsV46();
    const list = document.getElementById('supportTicketsList');
    if(!list) return;
    const tickets = filteredTicketsV46();
    if(!tickets.length){
      list.innerHTML = '<div class="client-card"><p>Nenhum ticket encontrado.</p></div>';
      return;
    }
    list.innerHTML = tickets.slice().reverse().map(t => {
      const replies = (t.replies || []).map(r => `<div class="ticket-reply"><strong>${safeText(r.by)}</strong><span>${formatFeedDate(r.createdAt)}</span><p>${safeText(r.text)}</p></div>`).join('');
      const admin = currentUser && currentUser.role === 'admin';
      const canEdit = canEditTicketV46(t);
      const editBtn = canEdit ? `<button class="ticket-action secondary" onclick="editTicketV46(${t.id})">Editar</button>` : '';
      const replyBtn = admin && t.status !== 'Encerrado' ? `<button class="ticket-action primary" onclick="openAdminReply(${t.id})">Responder</button>` : '';
      const closeBtn = admin && t.status !== 'Encerrado' ? `<button class="ticket-action danger" onclick="closeTicketV46(${t.id})">Encerrar</button>` : '';
      const reopenBtn = t.status === 'Encerrado' && (!admin || admin) ? `<button class="ticket-action primary" onclick="reopenTicketV46(${t.id})">Reabrir</button>` : '';
      return `<article class="ticket-card pro-ticket ${ticketStatusClassV46(t.status)}">
        <div class="ticket-head">
          <div>
            <div class="ticket-protocol">${safeText(t.protocol || 'Sem protocolo')}</div>
            <strong>${safeText(t.subject)}</strong>
            <span>${safeText(t.name)} • ${formatFeedDate(t.createdAt)}</span>
          </div>
          <em>${safeText(t.status || 'Aberto')}</em>
        </div>
        <p>${safeText(t.message)}</p>
        <div class="ticket-actions">${editBtn}${replyBtn}${closeBtn}${reopenBtn}</div>
        <div class="ticket-replies">${replies}</div>
      </article>`;
    }).join('');
  };
}
function bindTicketsV46(){
  document.getElementById('ticketSearchInput')?.addEventListener('input', renderSupportTickets);
  document.getElementById('ticketStatusFilter')?.addEventListener('change', renderSupportTickets);
  document.getElementById('closeEditTicket')?.addEventListener('click', () => document.getElementById('editTicketModal')?.classList.add('hidden'));
  document.getElementById('saveTicketEditBtn')?.addEventListener('click', saveTicketEditV46);
  normalizeTicketsV46();
}
document.addEventListener('DOMContentLoaded', bindTicketsV46);




// V47 — Notificações limpam de verdade + protocolos + editor rico estilo Gmail
function cleanHTMLV47(html){
  return String(html || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi,'');
}
function richTextPlainV47(html){
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return (div.textContent || '').trim();
}
function getRichEditorHTMLV47(id){
  const el = document.getElementById(id);
  return cleanHTMLV47(el ? el.innerHTML.trim() : '');
}
function setRichEditorHTMLV47(id, html){
  const el = document.getElementById(id);
  if(el) el.innerHTML = html || '';
}
function syncRichHiddenV47(editorId, textareaId){
  const ta = document.getElementById(textareaId);
  if(ta) ta.value = getRichEditorHTMLV47(editorId);
}
function bindRichEditorsV47(){
  document.querySelectorAll('.rich-toolbar button[data-cmd]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const editor = btn.closest('.rich-editor')?.dataset.target;
      document.getElementById(editor)?.focus();
      document.execCommand(btn.dataset.cmd, false, null);
    });
  });
  document.querySelectorAll('.rich-toolbar select[data-cmd]').forEach(sel => {
    sel.addEventListener('change', () => {
      const editor = sel.closest('.rich-editor')?.dataset.target;
      document.getElementById(editor)?.focus();
      document.execCommand(sel.dataset.cmd, false, sel.value);
    });
  });
  document.querySelectorAll('.rich-toolbar input[type="color"][data-cmd]').forEach(input => {
    input.addEventListener('input', () => {
      const editor = input.closest('.rich-editor')?.dataset.target;
      document.getElementById(editor)?.focus();
      document.execCommand(input.dataset.cmd, false, input.value);
    });
  });
  document.querySelectorAll('.rich-toolbar input[type="file"][data-image]').forEach(input => {
    input.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      const editorId = input.dataset.image;
      if(!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const editor = document.getElementById(editorId);
        if(!editor) return;
        editor.focus();
        document.execCommand('insertHTML', false, `<img src="${reader.result}" alt="Imagem anexada">`);
      };
      reader.readAsDataURL(file);
      input.value = '';
    });
  });
}
const originalClearNotificationsV45 = typeof clearNotificationsV45 === 'function' ? clearNotificationsV45 : null;
clearNotificationsV45 = function(){
  const me = currentNotificationUserKey ? currentNotificationUserKey() : '';
  const role = currentUser?.role || '';
  amNotifications = amNotifications.filter(n => {
    if(n.to === 'all') return false;
    if(n.to === me) return false;
    if(n.role && n.role === role) return false;
    if(role === 'admin' && n.role === 'admin') return false;
    return true;
  });
  saveNotificationsV45();
  renderNotificationsV45();
  toast('Notificações limpas.');
};
function showTicketCreatedV47(protocol){
  const modal = document.getElementById('ticketCreatedModal');
  const number = document.getElementById('createdProtocolNumber');
  if(number) number.textContent = protocol;
  modal?.classList.remove('hidden');
}
const originalPublishSupportTicketV47 = typeof publishSupportTicket === 'function' ? publishSupportTicket : null;
if(originalPublishSupportTicketV47){
  publishSupportTicket = function(){
    if(!currentUser){ openAuth('login'); return; }
    syncRichHiddenV47('ticketMessageEditor','ticketMessage');
    const subject = (document.getElementById('ticketSubject')?.value || '').trim();
    const messageHTML = getRichEditorHTMLV47('ticketMessageEditor');
    const messageText = richTextPlainV47(messageHTML);
    if(!subject || !messageText) return toast('Preencha assunto e mensagem.');
    const ticket = {
      id: Date.now(),
      protocol: generateTicketProtocolV46 ? generateTicketProtocolV46() : ('AM-' + Date.now()),
      owner: currentUserKey(),
      name: currentUser.name || currentUser.username || 'Usuário',
      email: currentUser.email || '',
      subject,
      message: messageText,
      messageHTML,
      status:'Aberto',
      replies:[],
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
    supportTickets.push(ticket);
    saveSupportTickets();
    document.getElementById('ticketSubject').value = '';
    setRichEditorHTMLV47('ticketMessageEditor','');
    document.getElementById('ticketMessage').value = '';
    document.getElementById('supportTicketModal')?.classList.add('hidden');
    renderClientArea();
    showTicketCreatedV47(ticket.protocol);
    toast(`Ticket aberto. Protocolo: ${ticket.protocol}`);
    if(typeof pushNotificationV45 === 'function'){
      pushNotificationV45({
        role:'admin',
        title:'Novo ticket aberto',
        message:`${ticket.protocol} • ${ticket.name}: ${ticket.subject}`,
        type:'ticket',
        link:'client-area'
      });
    }
  };
}
const originalEditTicketV46 = window.editTicketV46;
window.editTicketV46 = function(id){
  const ticket = supportTickets.find(t => t.id === id);
  if(!ticket || !canEditTicketV46(ticket)) return toast('Você não pode editar este ticket.');
  editingTicketIdV46 = id;
  document.getElementById('editTicketSubject').value = ticket.subject || '';
  setRichEditorHTMLV47('editTicketEditor', ticket.messageHTML || safeText(ticket.message || ''));
  document.getElementById('editTicketModal')?.classList.remove('hidden');
};
const originalSaveTicketEditV46 = typeof saveTicketEditV46 === 'function' ? saveTicketEditV46 : null;
saveTicketEditV46 = function(){
  const subject = (document.getElementById('editTicketSubject')?.value || '').trim();
  const messageHTML = getRichEditorHTMLV47('editTicketEditor');
  const messageText = richTextPlainV47(messageHTML);
  if(!subject || !messageText) return toast('Preencha assunto e mensagem.');
  supportTickets = supportTickets.map(t => t.id === editingTicketIdV46 ? {...t, subject, message:messageText, messageHTML, updatedAt:new Date().toISOString()} : t);
  saveSupportTickets();
  document.getElementById('editTicketModal')?.classList.add('hidden');
  renderClientArea();
  toast('Ticket atualizado.');
};
const originalOpenAdminReply = window.openAdminReply;
window.openAdminReply = function(id){
  replyingTicketId = id;
  const ticket = supportTickets.find(t => t.id === id);
  if(!ticket) return;
  document.getElementById('adminReplyTicketInfo').textContent = `${ticket.protocol || ''} • ${ticket.name} — ${ticket.subject}`;
  setRichEditorHTMLV47('adminReplyEditor','');
  document.getElementById('adminReplyModal')?.classList.remove('hidden');
};
const originalSendAdminReplyV47 = typeof sendAdminReply === 'function' ? sendAdminReply : null;
sendAdminReply = function(){
  if(!currentUser || currentUser.role !== 'admin') return toast('Acesso restrito ao admin.');
  const replyHTML = getRichEditorHTMLV47('adminReplyEditor');
  const replyText = richTextPlainV47(replyHTML);
  if(!replyText) return toast('Digite a resposta.');
  const ticket = supportTickets.find(t => t.id === replyingTicketId);
  supportTickets = supportTickets.map(t => {
    if(t.id !== replyingTicketId) return t;
    const replies = Array.isArray(t.replies) ? t.replies : [];
    return {...t, status:'Respondido', updatedAt:new Date().toISOString(), replies:[...replies, {by:'Admin', text:replyText, html:replyHTML, createdAt:new Date().toISOString()}]};
  });
  saveSupportTickets();
  document.getElementById('adminReplyModal')?.classList.add('hidden');
  renderClientArea();
  toast('Resposta enviada ao cliente.');
  if(ticket && typeof pushNotificationV45 === 'function'){
    pushNotificationV45({
      to: ticket.owner,
      title:'Seu ticket foi respondido',
      message:`${ticket.protocol || ''} • ${ticket.subject}`,
      type:'ticket-reply',
      link:'client-area'
    });
  }
};
function renderProtocolHistoryV47(){
  const list = document.getElementById('protocolHistoryList');
  if(!list) return;
  const q = (document.getElementById('protocolSearchInput')?.value || '').toLowerCase();
  const status = document.getElementById('protocolStatusFilter')?.value || 'all';
  const tickets = currentUserTickets().filter(t => ticketMatchesSearchV46 ? ticketMatchesSearchV46(t, q, status) : true);
  if(!tickets.length){
    list.innerHTML = '<div class="client-card"><p>Nenhum protocolo encontrado.</p></div>';
    return;
  }
  list.innerHTML = tickets.slice().reverse().map(t => {
    const replies = (t.replies || []).map(r => `<div class="ticket-reply"><strong>${safeText(r.by)}</strong><span>${formatFeedDate(r.createdAt)}</span><div class="ticket-html">${r.html || safeText(r.text)}</div></div>`).join('');
    return `<article class="ticket-card pro-ticket protocol-card ${ticketStatusClassV46 ? ticketStatusClassV46(t.status) : ''}">
      <div class="ticket-head">
        <div>
          <div class="ticket-protocol">${safeText(t.protocol || 'Sem protocolo')}</div>
          <strong>${safeText(t.subject)}</strong>
          <span>${safeText(t.name)} • ${formatFeedDate(t.createdAt)}</span>
        </div>
        <em>${safeText(t.status || 'Aberto')}</em>
      </div>
      <div class="ticket-html">${t.messageHTML || safeText(t.message)}</div>
      <div class="ticket-replies">${replies}</div>
    </article>`;
  }).join('');
}
const originalRenderSupportTicketsV47 = typeof renderSupportTickets === 'function' ? renderSupportTickets : null;
renderSupportTickets = function(){
  if(originalRenderSupportTicketsV47) originalRenderSupportTicketsV47();
  document.querySelectorAll('.pro-ticket').forEach(card => {
    const p = card.querySelector(':scope > p');
    if(!p) return;
    const protocol = card.querySelector('.ticket-protocol')?.textContent || '';
    const ticket = supportTickets.find(t => (t.protocol || '') === protocol.trim());
    if(ticket && ticket.messageHTML){
      const div = document.createElement('div');
      div.className = 'ticket-html';
      div.innerHTML = ticket.messageHTML;
      p.replaceWith(div);
    }
    card.querySelectorAll('.ticket-reply').forEach(reply => {
      const strong = reply.querySelector('strong');
      const span = reply.querySelector('span');
      const textP = reply.querySelector('p');
      if(textP){
        const txt = textP.textContent;
        const ticketMatch = supportTickets.find(t => (t.replies || []).some(r => r.text === txt && r.html));
        const rMatch = ticketMatch ? (ticketMatch.replies || []).find(r => r.text === txt && r.html) : null;
        if(rMatch){
          const html = document.createElement('div');
          html.className = 'ticket-html';
          html.innerHTML = rMatch.html;
          textP.replaceWith(html);
        }
      }
    });
  });
  renderProtocolHistoryV47();
};
function bindV47(){
  bindRichEditorsV47();
  document.getElementById('closeTicketCreated')?.addEventListener('click', () => document.getElementById('ticketCreatedModal')?.classList.add('hidden'));
  document.getElementById('goToProtocolBtn')?.addEventListener('click', () => {
    document.getElementById('ticketCreatedModal')?.classList.add('hidden');
    document.querySelector('.client-nav[data-client-tab="protocols"]')?.click();
  });
  document.getElementById('protocolSearchInput')?.addEventListener('input', renderProtocolHistoryV47);
  document.getElementById('protocolStatusFilter')?.addEventListener('change', renderProtocolHistoryV47);
  const originalNavClick = document.querySelector('.client-nav[data-client-tab="protocols"]');
  if(originalNavClick){
    originalNavClick.addEventListener('click', renderProtocolHistoryV47);
  }
}
document.addEventListener('DOMContentLoaded', bindV47);




// V48 — Tickets encerrados saem do Suporte e ficam apenas em Protocolos
function supportActiveTicketsV48(){
  const q = document.getElementById('ticketSearchInput')?.value || '';
  const status = document.getElementById('ticketStatusFilter')?.value || 'all';
  return currentUserTickets()
    .filter(t => t.status !== 'Encerrado')
    .filter(t => ticketMatchesSearchV46 ? ticketMatchesSearchV46(t, q, status) : true);
}
function renderSupportTicketsActiveOnlyV48(){
  normalizeTicketsV46 && normalizeTicketsV46();
  const list = document.getElementById('supportTicketsList');
  if(!list) return;
  const tickets = supportActiveTicketsV48();
  if(!tickets.length){
    list.innerHTML = '<div class="client-card"><p>Nenhum atendimento em aberto no suporte. Atendimentos encerrados ficam no menu Protocolos.</p></div>';
    if(typeof renderProtocolHistoryV47 === 'function') renderProtocolHistoryV47();
    return;
  }
  list.innerHTML = tickets.slice().reverse().map(t => {
    const replies = (t.replies || []).map(r => `<div class="ticket-reply"><strong>${safeText(r.by)}</strong><span>${formatFeedDate(r.createdAt)}</span><div class="ticket-html">${r.html || safeText(r.text)}</div></div>`).join('');
    const admin = currentUser && currentUser.role === 'admin';
    const canEdit = canEditTicketV46(t);
    const editBtn = canEdit ? `<button class="ticket-action secondary" onclick="editTicketV46(${t.id})">Editar</button>` : '';
    const replyBtn = admin ? `<button class="ticket-action primary" onclick="openAdminReply(${t.id})">Responder</button>` : '';
    const closeBtn = admin ? `<button class="ticket-action danger" onclick="closeTicketV46(${t.id})">Encerrar</button>` : '';
    return `<article class="ticket-card pro-ticket ${ticketStatusClassV46 ? ticketStatusClassV46(t.status) : ''}">
      <div class="ticket-head">
        <div>
          <div class="ticket-protocol">${safeText(t.protocol || 'Sem protocolo')}</div>
          <strong>${safeText(t.subject)}</strong>
          <span>${safeText(t.name)} • ${formatFeedDate(t.createdAt)}</span>
        </div>
        <em>${safeText(t.status || 'Aberto')}</em>
      </div>
      <div class="ticket-html">${t.messageHTML || safeText(t.message)}</div>
      <div class="ticket-actions">${editBtn}${replyBtn}${closeBtn}</div>
      <div class="ticket-replies">${replies}</div>
    </article>`;
  }).join('');
  if(typeof renderProtocolHistoryV47 === 'function') renderProtocolHistoryV47();
}
renderSupportTickets = renderSupportTicketsActiveOnlyV48;

const originalCloseTicketV46ForV48 = window.closeTicketV46;
window.closeTicketV46 = function(id){
  if(!currentUser || currentUser.role !== 'admin') return toast('Apenas admin pode encerrar ticket.');
  const ticket = supportTickets.find(t => t.id === id);
  supportTickets = supportTickets.map(t => t.id === id ? {
    ...t,
    status:'Encerrado',
    closedAt:new Date().toISOString(),
    updatedAt:new Date().toISOString()
  } : t);
  saveSupportTickets();
  renderClientArea();
  if(typeof renderProtocolHistoryV47 === 'function') renderProtocolHistoryV47();
  toast('Atendimento encerrado. O histórico foi movido para Protocolos.');
  if(ticket && typeof pushNotificationV45 === 'function'){
    pushNotificationV45({
      to: ticket.owner,
      title:'Atendimento encerrado',
      message:`${ticket.protocol || ''} • ${ticket.subject}`,
      type:'ticket-closed',
      link:'client-area'
    });
  }
};

const originalReopenTicketV46ForV48 = window.reopenTicketV46;
window.reopenTicketV46 = function(id){
  const ticket = supportTickets.find(t => t.id === id);
  if(!ticket || !currentUser) return;
  if(ticket.owner !== currentUserKey() && currentUser.role !== 'admin') return toast('Você não pode reabrir este ticket.');
  supportTickets = supportTickets.map(t => t.id === id ? {
    ...t,
    status:'Aberto',
    reopenedAt:new Date().toISOString(),
    updatedAt:new Date().toISOString()
  } : t);
  saveSupportTickets();
  renderClientArea();
  if(typeof renderProtocolHistoryV47 === 'function') renderProtocolHistoryV47();
  toast('Ticket reaberto. Ele voltou para a área de Suporte.');
  if(typeof pushNotificationV45 === 'function'){
    pushNotificationV45({
      role:'admin',
      title:'Ticket reaberto',
      message:`${ticket.protocol || 'Sem protocolo'} • ${ticket.subject}`,
      type:'ticket',
      link:'client-area'
    });
  }
};




// V49 — Ajustes solicitados: somente admin altera ticket + protocolos só para cliente + alerta de assinatura
function canEditTicketV46(ticket){
  return !!(currentUser && currentUser.role === 'admin');
}

function adjustClientMenuForRoleV49(){
  const protocolBtn = document.querySelector('.client-nav[data-client-tab="protocols"]');
  const supportBtn = document.querySelector('.client-nav[data-client-tab="support"]');
  if(protocolBtn){
    protocolBtn.style.display = (currentUser && currentUser.role === 'admin') ? 'none' : '';
    if(currentUser && currentUser.role === 'admin' && protocolBtn.classList.contains('active')){
      supportBtn?.click();
    }
  }
}
const originalRenderClientAreaV49 = typeof renderClientArea === 'function' ? renderClientArea : null;
if(originalRenderClientAreaV49){
  renderClientArea = function(){
    originalRenderClientAreaV49();
    adjustClientMenuForRoleV49();
    renderSubscriptionCountdownV49();
  };
}
const originalOpenClientAreaV49 = typeof openClientArea === 'function' ? openClientArea : null;
if(originalOpenClientAreaV49){
  openClientArea = function(){
    originalOpenClientAreaV49();
    adjustClientMenuForRoleV49();
    renderSubscriptionCountdownV49();
  };
}

function ensureSubscriptionDataV49(){
  if(!currentUser) return;
  if((currentUser.plan === 'VIP' || currentUser.plan === 'Creator') && !currentUser.subscriptionEndsAt){
    const end = new Date();
    end.setDate(end.getDate() + 30);
    currentUser.subscriptionStartedAt = currentUser.subscriptionStartedAt || new Date().toISOString();
    currentUser.subscriptionEndsAt = end.toISOString();
    users = users.map(u => {
      const same = (currentUser.id && u.id === currentUser.id) || (currentUser.email && u.email === currentUser.email) || (currentUser.username && u.username === currentUser.username);
      return same ? {...u, subscriptionStartedAt: currentUser.subscriptionStartedAt, subscriptionEndsAt: currentUser.subscriptionEndsAt} : u;
    });
    saveUsers();
    localStorage.setItem('am_user', JSON.stringify(currentUser));
  }
}
function diffSubscriptionV49(){
  if(!currentUser || !currentUser.subscriptionEndsAt) return null;
  const end = new Date(currentUser.subscriptionEndsAt).getTime();
  const now = Date.now();
  let diff = Math.max(0, end - now);
  const days = Math.floor(diff / 86400000); diff %= 86400000;
  const hours = Math.floor(diff / 3600000); diff %= 3600000;
  const minutes = Math.floor(diff / 60000);
  return {days, hours, minutes, ended: end <= now};
}
function renderSubscriptionCountdownV49(){
  ensureSubscriptionDataV49();
  const box = document.getElementById('subscriptionCountdownBox');
  if(!box || !currentUser) return;
  if(!(currentUser.plan === 'VIP' || currentUser.plan === 'Creator')){
    box.classList.add('hidden');
    return;
  }
  const d = diffSubscriptionV49();
  if(!d){
    box.classList.add('hidden');
    return;
  }
  box.classList.remove('hidden');
  box.innerHTML = d.ended
    ? `<strong>Assinatura expirada</strong><span>Renove seu plano ${currentUser.plan} para continuar com os benefícios.</span>`
    : `<strong>Plano ${currentUser.plan} ativo</strong><span>Expira em ${d.days} dias, ${d.hours} horas e ${d.minutes} minutos.</span>`;
}
function bindSubscriptionCountdownV49(){
  renderSubscriptionCountdownV49();
  setInterval(renderSubscriptionCountdownV49, 60000);
}
document.addEventListener('DOMContentLoaded', bindSubscriptionCountdownV49);

// Quando admin altera plano no painel, cria/atualiza validade da assinatura
const originalToggleVipV49 = window.toggleVip;
window.toggleVip = (id) => {
  users = users.map(u => {
    if(u.id !== id) return u;
    const nextPlan = u.plan === 'VIP' ? 'Free' : 'VIP';
    const end = new Date();
    end.setDate(end.getDate() + 30);
    return {
      ...u,
      plan: nextPlan,
      subscriptionStartedAt: nextPlan === 'VIP' ? new Date().toISOString() : '',
      subscriptionEndsAt: nextPlan === 'VIP' ? end.toISOString() : ''
    };
  });
  const updated = users.find(u => currentUser && ((currentUser.id && u.id === currentUser.id) || (currentUser.email && u.email === currentUser.email)));
  if(updated){ currentUser = updated; localStorage.setItem('am_user', JSON.stringify(currentUser)); }
  saveUsers();
  renderUsersTable();
  renderSubscriptionCountdownV49();
};




// V50 — Admin VIP ilimitado + VIP/Creator com prazo mensal/anual
function activatePlanV50(userId, plan='VIP', cycle='monthly'){
  const now = new Date();
  const end = new Date();
  if(cycle === 'annual') end.setFullYear(end.getFullYear() + 1);
  else end.setDate(end.getDate() + 30);

  users = users.map(u => {
    if(u.id !== userId) return u;
    if(u.role === 'admin'){
      return {
        ...u,
        plan:'VIP',
        subscriptionCycle:'lifetime',
        subscriptionStartedAt: now.toISOString(),
        subscriptionEndsAt:'infinite'
      };
    }
    return {
      ...u,
      plan,
      subscriptionCycle: cycle,
      subscriptionStartedAt: now.toISOString(),
      subscriptionEndsAt: end.toISOString()
    };
  });

  const updated = users.find(u => currentUser && (
    (currentUser.id && u.id === currentUser.id) ||
    (currentUser.email && u.email === currentUser.email) ||
    (currentUser.username && u.username === currentUser.username)
  ));
  if(updated){
    currentUser = updated;
    localStorage.setItem('am_user', JSON.stringify(currentUser));
  }
  saveUsers();
  if(typeof renderUsersTable === 'function') renderUsersTable();
  renderSubscriptionCountdownV49();
}

function ensureSubscriptionDataV49(){
  if(!currentUser) return;

  if(currentUser.role === 'admin'){
    currentUser.plan = 'VIP';
    currentUser.subscriptionCycle = 'lifetime';
    currentUser.subscriptionEndsAt = 'infinite';
    users = users.map(u => {
      const same = (currentUser.id && u.id === currentUser.id) || (currentUser.email && u.email === currentUser.email) || (currentUser.username && u.username === currentUser.username);
      return same ? {...u, plan:'VIP', subscriptionCycle:'lifetime', subscriptionEndsAt:'infinite'} : u;
    });
    saveUsers();
    localStorage.setItem('am_user', JSON.stringify(currentUser));
    return;
  }

  if((currentUser.plan === 'VIP' || currentUser.plan === 'Creator') && !currentUser.subscriptionEndsAt){
    const end = new Date();
    if(currentUser.subscriptionCycle === 'annual') end.setFullYear(end.getFullYear() + 1);
    else end.setDate(end.getDate() + 30);
    currentUser.subscriptionCycle = currentUser.subscriptionCycle || 'monthly';
    currentUser.subscriptionStartedAt = currentUser.subscriptionStartedAt || new Date().toISOString();
    currentUser.subscriptionEndsAt = end.toISOString();
    users = users.map(u => {
      const same = (currentUser.id && u.id === currentUser.id) || (currentUser.email && u.email === currentUser.email) || (currentUser.username && u.username === currentUser.username);
      return same ? {...u, subscriptionCycle: currentUser.subscriptionCycle, subscriptionStartedAt: currentUser.subscriptionStartedAt, subscriptionEndsAt: currentUser.subscriptionEndsAt} : u;
    });
    saveUsers();
    localStorage.setItem('am_user', JSON.stringify(currentUser));
  }
}

function diffSubscriptionV49(){
  if(!currentUser || !currentUser.subscriptionEndsAt) return null;
  if(currentUser.role === 'admin' || currentUser.subscriptionEndsAt === 'infinite'){
    return {infinite:true, days:Infinity, hours:Infinity, minutes:Infinity, ended:false};
  }
  const end = new Date(currentUser.subscriptionEndsAt).getTime();
  const now = Date.now();
  let diff = Math.max(0, end - now);
  const days = Math.floor(diff / 86400000); diff %= 86400000;
  const hours = Math.floor(diff / 3600000); diff %= 3600000;
  const minutes = Math.floor(diff / 60000);
  return {days, hours, minutes, ended: end <= now, infinite:false};
}

function renderSubscriptionCountdownV49(){
  ensureSubscriptionDataV49();
  const box = document.getElementById('subscriptionCountdownBox');
  if(!box || !currentUser) return;

  if(currentUser.role === 'admin'){
    box.classList.remove('hidden');
    box.classList.add('infinite');
    box.innerHTML = `<strong>Plano VIP ilimitado ∞</strong><span>Conta administrativa com acesso vitalício e sem expiração.</span>`;
    return;
  }

  if(!(currentUser.plan === 'VIP' || currentUser.plan === 'Creator')){
    box.classList.add('hidden');
    return;
  }

  const d = diffSubscriptionV49();
  if(!d){
    box.classList.add('hidden');
    return;
  }

  box.classList.remove('hidden');
  box.classList.remove('infinite');
  const cycleText = currentUser.subscriptionCycle === 'annual' ? 'anual' : 'mensal';
  box.innerHTML = d.ended
    ? `<strong>Assinatura expirada</strong><span>Renove seu plano ${currentUser.plan} para continuar com os benefícios.</span>`
    : `<strong>Plano ${currentUser.plan} ${cycleText} ativo</strong><span>Expira em ${d.days} dias, ${d.hours} horas e ${d.minutes} minutos.</span>`;
}

// Ajuste do botão VIP do painel admin: alterna Free/VIP mensal por padrão; admin continua infinito.
window.toggleVip = (id) => {
  const user = users.find(u => u.id === id);
  if(!user) return;
  if(user.role === 'admin'){
    activatePlanV50(id, 'VIP', 'lifetime');
    return;
  }
  if(user.plan === 'VIP'){
    users = users.map(u => u.id === id ? {...u, plan:'Free', subscriptionCycle:'', subscriptionStartedAt:'', subscriptionEndsAt:''} : u);
    saveUsers();
    if(typeof renderUsersTable === 'function') renderUsersTable();
    renderSubscriptionCountdownV49();
    return;
  }
  activatePlanV50(id, 'VIP', 'monthly');
};




// V51 — Correção definitiva: Protocolos não aparece para admin + 3º prompt Harry Potter
function hideProtocolsForAdminV51(){
  const protocolBtn = document.querySelector('.client-nav[data-client-tab="protocols"]');
  const supportBtn = document.querySelector('.client-nav[data-client-tab="support"]');
  const protocolSection = document.getElementById('clientProtocols');
  if(currentUser && currentUser.role === 'admin'){
    if(protocolBtn) protocolBtn.classList.add('force-hidden');
    if(protocolSection) protocolSection.classList.remove('active');
    if(protocolBtn && protocolBtn.classList.contains('active')){
      protocolBtn.classList.remove('active');
      supportBtn?.classList.add('active');
      document.querySelectorAll('.client-tab').forEach(sec=>sec.classList.remove('active'));
      document.getElementById('clientSupport')?.classList.add('active');
    }
  } else {
    if(protocolBtn) protocolBtn.classList.remove('force-hidden');
  }
}
const originalAdjustClientMenuForRoleV49_V51 = typeof adjustClientMenuForRoleV49 === 'function' ? adjustClientMenuForRoleV49 : null;
adjustClientMenuForRoleV49 = function(){
  if(originalAdjustClientMenuForRoleV49) originalAdjustClientMenuForRoleV49();
  hideProtocolsForAdminV51();
};
const originalRenderClientAreaV51 = typeof renderClientArea === 'function' ? renderClientArea : null;
renderClientArea = function(){
  if(originalRenderClientAreaV51) originalRenderClientAreaV51();
  hideProtocolsForAdminV51();
};
document.addEventListener('DOMContentLoaded', () => {
  hideProtocolsForAdminV51();
  document.querySelector('.client-nav[data-client-tab="protocols"]')?.addEventListener('click', e => {
    if(currentUser && currentUser.role === 'admin'){
      e.preventDefault();
      e.stopImmediatePropagation();
      toast('Protocolos ficam disponíveis apenas para clientes.');
      document.querySelector('.client-nav[data-client-tab="support"]')?.click();
      return false;
    }
  }, true);
});

function bindHarryPromptV51(){
  const card = document.querySelector('#harryPromptCard');
  const modal = document.querySelector('#harryPromptModal');
  const close = document.querySelector('#closeHarryPromptModal');
  const copy = document.querySelector('#copyHarryPromptBtn');
  const text = document.querySelector('#harryPromptText');
  if(card && modal) card.onclick = () => modal.classList.remove('hidden');
  if(close && modal) close.onclick = () => modal.classList.add('hidden');
  if(modal) modal.addEventListener('click', e => { if(e.target.id === 'harryPromptModal') modal.classList.add('hidden'); });
  if(copy && text){
    copy.onclick = async () => {
      try{ await navigator.clipboard.writeText(text.value); toast('Prompt copiado com sucesso.'); }
      catch(e){ text.select(); document.execCommand('copy'); toast('Prompt copiado.'); }
    };
  }
}
document.addEventListener('DOMContentLoaded', bindHarryPromptV51);

// Tradução extra do novo prompt
const originalApplyExtraTranslationsV42_V51 = typeof applyExtraTranslationsV42 === 'function' ? applyExtraTranslationsV42 : null;
if(originalApplyExtraTranslationsV42_V51){
  applyExtraTranslationsV42 = function(lang){
    originalApplyExtraTranslationsV42_V51(lang);
    const data = {
      pt:['Super Pack Harry Potter 3','Prompt mágico editorial hiper-realista.'],
      en:['Harry Potter 3 Super Pack','Hyper-realistic magical editorial prompt.'],
      es:['Super Pack Harry Potter 3','Prompt mágico editorial hiperrealista.'],
      hi:['हैरी पॉटर 3 सुपर पैक','हाइपर-रियलिस्टिक मैजिकल एडिटोरियल प्रॉम्प्ट।']
    }[lang] || ['Super Pack Harry Potter 3','Prompt mágico editorial hiper-realista.'];
    const card = document.querySelector('#harryPromptCard');
    if(card){
      const h = card.querySelector('h3');
      const p = card.querySelector('p');
      if(h) h.textContent = data[0];
      if(p) p.textContent = data[1];
    }
    const modalTitle = document.querySelector('#harryPromptModal .prompt-copy-area h2');
    if(modalTitle) modalTitle.textContent = data[0];
  };
}




// V52 — Protocolos removido do menu para todos
function removeProtocolsMenuForEveryoneV52(){
  document.querySelectorAll('.client-nav[data-client-tab="protocols"]').forEach(btn => btn.remove());
  document.getElementById('clientProtocols')?.remove();
}
document.addEventListener('DOMContentLoaded', removeProtocolsMenuForEveryoneV52);
const originalRenderClientAreaV52 = typeof renderClientArea === 'function' ? renderClientArea : null;
if(originalRenderClientAreaV52){
  renderClientArea = function(){
    originalRenderClientAreaV52();
    removeProtocolsMenuForEveryoneV52();
  };
}




// V53 EXPRESS — FREE/VIP filters + prompt VIP + PIX 24h local access
const AM_V53_VIP_ACCESS_KEY = 'am_v53_vip_prompt_access_until';
const AM_V53_VIP_PROMPT_ID = 'pika-vip';

function v53IsLogged(){
  return !!currentUser;
}
function v53IsVipUser(){
  return !!(currentUser && (currentUser.role === 'admin' || currentUser.plan === 'VIP' || currentUser.plan === 'Creator'));
}
function v53VipAccessUntil(){
  return Number(localStorage.getItem(AM_V53_VIP_ACCESS_KEY) || '0');
}
function v53HasVipPromptAccess(){
  return v53IsVipUser() || Date.now() < v53VipAccessUntil();
}
function v53FormatRemaining(ms){
  if(ms <= 0) return '0h 0min';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}min`;
}
function v53UpdateVipAccessUI(){
  const note = document.getElementById('vipPromptAccessNote');
  const buy = document.getElementById('buyVipPromptBtn');
  const copy = document.getElementById('copyVipPromptBtn');
  if(!note || !buy || !copy) return;
  if(v53IsVipUser()){
    note.textContent = 'Acesso liberado pelo seu plano VIP/Creator.';
    buy.classList.add('hidden');
    copy.classList.remove('hidden');
    return;
  }
  const remaining = v53VipAccessUntil() - Date.now();
  if(remaining > 0){
    note.textContent = `Acesso avulso liberado. Tempo restante: ${v53FormatRemaining(remaining)}.`;
    buy.classList.add('hidden');
    copy.classList.remove('hidden');
  } else {
    note.textContent = 'Acesso exclusivo VIP/Creator ou compra avulsa por R$10,00 com liberação por 24h.';
    buy.classList.remove('hidden');
    copy.classList.add('hidden');
  }
}
function v53OpenVipPrompt(){
  const modal = document.getElementById('vipPromptModal');
  if(!modal) return;
  modal.classList.remove('hidden');
  v53UpdateVipAccessUI();
}
function v53OpenPix(){
  if(!v53IsLogged()){
    openAuth('login');
    return toast('Faça login para comprar este prompt.');
  }
  document.getElementById('pixPromptModal')?.classList.remove('hidden');
}
function v53ConfirmPixAccess(){
  if(!v53IsLogged()){
    openAuth('login');
    return toast('Faça login para liberar o acesso.');
  }
  const until = Date.now() + (24 * 60 * 60 * 1000);
  localStorage.setItem(AM_V53_VIP_ACCESS_KEY, String(until));
  document.getElementById('pixPromptModal')?.classList.add('hidden');
  v53UpdateVipAccessUI();
  toast('Acesso liberado por 24 horas.');
}
async function v53CopyTextFrom(id, success){
  const el = document.getElementById(id);
  if(!el) return;
  try{
    await navigator.clipboard.writeText(el.value || el.textContent || '');
    toast(success || 'Copiado.');
  }catch(e){
    if(el.select) el.select();
    document.execCommand('copy');
    toast(success || 'Copiado.');
  }
}
function v53FilterPrompts(type){
  const cards = document.querySelectorAll('#prompts .cards.horizontal [data-prompt-id]');
  cards.forEach(card => {
    const label = (card.querySelector('span')?.textContent || '').trim().toLowerCase();
    const isVip = label === 'vip' || card.dataset.plan === 'vip';
    const isFree = label === 'free';
    let show = true;
    if(type === 'vip') show = isVip;
    if(type === 'free') show = isFree;
    card.style.display = show ? '' : 'none';
  });
}
function v53BindFilters(){
  document.querySelectorAll('.filter-chip').forEach(btn => {
    const txt = btn.textContent.trim().toLowerCase();
    if(txt === 'vip'){
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        v53FilterPrompts('vip');
        toast('Mostrando prompts VIP.');
      });
    }
    if(txt === 'free'){
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        v53FilterPrompts('free');
        toast('Mostrando prompts Free.');
      });
    }
    if(txt.includes('mais recentes')){
      btn.addEventListener('click', () => {
        document.querySelectorAll('#prompts .cards.horizontal [data-prompt-id]').forEach(card => card.style.display = '');
      });
    }
  });
}
function v53BindVipPrompt(){
  const card = document.getElementById('pikapromptVipCard');
  const modal = document.getElementById('vipPromptModal');
  const pix = document.getElementById('pixPromptModal');
  card?.addEventListener('click', v53OpenVipPrompt);
  document.getElementById('closeVipPromptModal')?.addEventListener('click', () => modal?.classList.add('hidden'));
  document.getElementById('closePixPromptModal')?.addEventListener('click', () => pix?.classList.add('hidden'));
  modal?.addEventListener('click', e => { if(e.target.id === 'vipPromptModal') modal.classList.add('hidden'); });
  pix?.addEventListener('click', e => { if(e.target.id === 'pixPromptModal') pix.classList.add('hidden'); });
  document.getElementById('buyVipPromptBtn')?.addEventListener('click', v53OpenPix);
  document.getElementById('confirmPixAccessBtn')?.addEventListener('click', v53ConfirmPixAccess);
  document.getElementById('copyPixBtn')?.addEventListener('click', () => v53CopyTextFrom('pixCopyInput','PIX copia e cola copiado.'));
  document.getElementById('copyVipPromptBtn')?.addEventListener('click', () => {
    if(!v53HasVipPromptAccess()){
      return v53OpenPix();
    }
    v53CopyTextFrom('vipPromptText','Prompt VIP copiado com sucesso.');
  });
  setInterval(v53UpdateVipAccessUI, 60000);
}
document.addEventListener('DOMContentLoaded', () => {
  v53BindFilters();
  v53BindVipPrompt();
  v53UpdateVipAccessUI();
});


// V54 — Menu de Prompts dedicado com filtros
function v54PromptCardKind(card){
  const label = (card.querySelector('span')?.textContent || '').trim().toLowerCase();
  if(label === 'vip' || card.dataset.plan === 'vip') return 'vip';
  if(label === 'free') return 'free';
  return 'other';
}
function v54GetReactionData(id){
  try{
    const data = JSON.parse(localStorage.getItem('am_prompt_reactions_v28') || '{}');
    return data[id] || {likes:[], dislikes:[], favorites:[]};
  }catch(e){
    return {likes:[], dislikes:[], favorites:[]};
  }
}
function v54FilterPromptMenu(filter){
  const grid = document.querySelector('.prompt-menu-grid');
  if(!grid) return;
  const cards = [...grid.querySelectorAll('[data-prompt-id]')];
  const me = typeof currentPromptUserKey === 'function' ? currentPromptUserKey() : null;

  cards.forEach(card => {
    const kind = v54PromptCardKind(card);
    const data = v54GetReactionData(card.dataset.promptId);
    const favs = Array.isArray(data.favorites) ? data.favorites : [];
    let show = true;
    if(filter === 'free') show = kind === 'free';
    if(filter === 'vip') show = kind === 'vip';
    if(filter === 'favorites'){
      if(!currentUser){
        openAuth('login');
        toast('Faça login para ver favoritos.');
        show = false;
      } else {
        show = favs.includes(me);
      }
    }
    card.style.display = show ? '' : 'none';
  });

  if(filter === 'liked'){
    cards
      .sort((a,b) => {
        const al = (v54GetReactionData(a.dataset.promptId).likes || []).length;
        const bl = (v54GetReactionData(b.dataset.promptId).likes || []).length;
        return bl - al;
      })
      .forEach(card => grid.appendChild(card));
    cards.forEach(card => card.style.display = '');
  }
}
function v54BindPromptMenu(){
  document.querySelectorAll('.prompt-menu-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.prompt-menu-filter').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      v54FilterPromptMenu(btn.dataset.filter || 'all');
    });
  });

  document.querySelectorAll('.prompt-menu-grid [data-prompt-id]').forEach(card => {
    card.addEventListener('click', e => {
      if(e.target.closest('.prompt-reactions')) return;
      const id = card.dataset.promptId;
      if(id === 'crie-imagem') document.querySelector('#promptModal')?.classList.remove('hidden');
      else if(id === 'celebracao') document.querySelector('#celebrationPromptModal')?.classList.remove('hidden');
      else if(id === 'harry-pack') document.querySelector('#harryPromptModal')?.classList.remove('hidden');
      else if(id === 'pika-vip') {
        if(typeof v53OpenVipPrompt === 'function') v53OpenVipPrompt();
        else document.querySelector('#vipPromptModal')?.classList.remove('hidden');
      }
    });
  });

  document.querySelector('#seeMorePromptsBtn')?.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector('#promptMenu')?.scrollIntoView({behavior:'smooth', block:'start'});
  });
}
document.addEventListener('DOMContentLoaded', v54BindPromptMenu);


// V55 — Home fecha central + Atendimentos em chat + Firestore realtime opcional
let V55_TICKET_CHAT_ID = null;
let V55_FIRESTORE = null;
let V55_CLOUD_READY = false;
let V55_REMOTE_PROMPT_REACTIONS = null;
let V55_REMOTE_TICKETS = null;

function v55CloseClientAreaAndGoHome(){
  document.getElementById('clientAreaPage')?.classList.add('hidden');
  document.getElementById('normalContent')?.classList.remove('feed-hidden');
  document.getElementById('feedPage')?.classList.add('hidden');
  document.getElementById('communityPage')?.classList.add('hidden');
  location.hash = '#home';
  window.scrollTo({top:0, behavior:'smooth'});
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href="#home"], .rail-item[href="#home"]').forEach(a => {
    a.addEventListener('click', () => {
      if(!document.getElementById('clientAreaPage')?.classList.contains('hidden')){
        v55CloseClientAreaAndGoHome();
      }
    });
  });
});

function v55IsAdmin(){ return currentUser && currentUser.role === 'admin'; }

function v55AdjustAdminMenus(){
  const att = document.querySelector('.client-nav[data-client-tab="attendances"]');
  if(att) att.style.display = v55IsAdmin() ? '' : 'none';
}
const v55OriginalRenderClientArea = typeof renderClientArea === 'function' ? renderClientArea : null;
if(v55OriginalRenderClientArea){
  renderClientArea = function(){
    v55OriginalRenderClientArea();
    v55AdjustAdminMenus();
    v55RenderAttendances();
  };
}
const v55OriginalOpenClientArea = typeof openClientArea === 'function' ? openClientArea : null;
if(v55OriginalOpenClientArea){
  openClientArea = function(){
    v55OriginalOpenClientArea();
    v55AdjustAdminMenus();
    v55RenderAttendances();
  };
}

function v55TicketSearchMatch(ticket, query, status){
  const q = String(query || '').toLowerCase().trim();
  const okStatus = !status || status === 'all' || ticket.status === status;
  if(!okStatus) return false;
  if(!q) return true;
  return [ticket.protocol, ticket.name, ticket.email, ticket.subject, ticket.message, ticket.status].join(' ').toLowerCase().includes(q);
}
function v55RenderAttendances(){
  const list = document.getElementById('attendanceList');
  if(!list || !v55IsAdmin()) return;
  const q = document.getElementById('attendanceSearchInput')?.value || '';
  const status = document.getElementById('attendanceStatusFilter')?.value || 'all';
  const data = Array.isArray(supportTickets) ? supportTickets : [];
  const tickets = data.filter(t => v55TicketSearchMatch(t, q, status));
  if(!tickets.length){
    list.innerHTML = '<div class="client-card"><p>Nenhum atendimento encontrado.</p></div>';
    return;
  }
  list.innerHTML = tickets.slice().reverse().map(t => {
    const count = (t.replies || []).length;
    const statusClass = typeof ticketStatusClassV46 === 'function' ? ticketStatusClassV46(t.status) : '';
    return `<article class="attendance-card ${statusClass}">
      <div>
        <div class="ticket-protocol">${safeText(t.protocol || 'Sem protocolo')}</div>
        <strong>${safeText(t.subject || 'Atendimento')}</strong>
        <span>${safeText(t.name || 'Cliente')} • ${safeText(t.email || '')}</span>
        <small>${count} mensagem${count===1?'':'s'} • ${safeText(t.status || 'Aberto')}</small>
      </div>
      <button class="btn primary" onclick="v55OpenTicketChat(${t.id})">Abrir chat</button>
    </article>`;
  }).join('');
}
function v55RenderTicketChat(){
  const ticket = supportTickets.find(t => t.id === V55_TICKET_CHAT_ID);
  if(!ticket) return;
  const title = document.getElementById('ticketChatTitle');
  const sub = document.getElementById('ticketChatSubtitle');
  const box = document.getElementById('ticketChatMessages');
  if(title) title.textContent = ticket.subject || 'Atendimento';
  if(sub) sub.textContent = `${ticket.protocol || 'Sem protocolo'} • ${ticket.name || 'Cliente'} • ${ticket.status || 'Aberto'}`;
  const messages = [
    {by: ticket.name || 'Cliente', role:'client', text: ticket.message || '', html: ticket.messageHTML || '', createdAt: ticket.createdAt},
    ...(ticket.replies || []).map(r => ({...r, role: (String(r.by || '').toLowerCase().includes('admin') ? 'admin' : 'client')}))
  ];
  if(box){
    box.innerHTML = messages.map(m => `<div class="chat-bubble ${m.role === 'admin' ? 'admin' : 'client'}">
      <strong>${safeText(m.by || (m.role === 'admin' ? 'Admin' : 'Cliente'))}</strong>
      <div>${m.html || safeText(m.text || '')}</div>
      <span>${m.createdAt ? formatFeedDate(m.createdAt) : ''}</span>
    </div>`).join('');
    box.scrollTop = box.scrollHeight;
  }
}
window.v55OpenTicketChat = function(id){
  if(!currentUser){ openAuth('login'); return; }
  const ticket = supportTickets.find(t => t.id === id);
  if(!ticket) return toast('Ticket não encontrado.');
  const isOwner = ticket.owner === currentUserKey();
  if(!v55IsAdmin() && !isOwner) return toast('Você não pode acessar este atendimento.');
  V55_TICKET_CHAT_ID = id;
  document.getElementById('ticketChatModal')?.classList.remove('hidden');
  v55RenderTicketChat();
};
function v55SendTicketChatMessage(){
  if(!V55_TICKET_CHAT_ID || !currentUser) return;
  const input = document.getElementById('ticketChatText');
  const text = (input?.value || '').trim();
  if(!text) return toast('Digite uma mensagem.');
  const by = v55IsAdmin() ? 'Admin' : (currentUser.name || currentUser.username || 'Cliente');
  supportTickets = supportTickets.map(t => {
    if(t.id !== V55_TICKET_CHAT_ID) return t;
    const replies = Array.isArray(t.replies) ? t.replies : [];
    const nextStatus = v55IsAdmin() ? 'Respondido' : (t.status === 'Encerrado' ? 'Aberto' : t.status);
    return {...t, status: nextStatus, updatedAt: new Date().toISOString(), replies:[...replies, {by, text, createdAt:new Date().toISOString()}]};
  });
  saveSupportTickets();
  input.value = '';
  renderClientArea();
  v55RenderTicketChat();
  if(typeof v55SyncTicketsCloud === 'function') v55SyncTicketsCloud();
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('attendanceSearchInput')?.addEventListener('input', v55RenderAttendances);
  document.getElementById('attendanceStatusFilter')?.addEventListener('change', v55RenderAttendances);
  document.getElementById('closeTicketChat')?.addEventListener('click', () => document.getElementById('ticketChatModal')?.classList.add('hidden'));
  document.getElementById('sendTicketChatMessage')?.addEventListener('click', v55SendTicketChatMessage);
  document.getElementById('ticketChatText')?.addEventListener('keydown', e => {
    if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); v55SendTicketChatMessage(); }
  });
});

// abrir chat também a partir da lista normal de suporte
const v55OldOpenAdminReply = window.openAdminReply;
window.openAdminReply = function(id){
  v55OpenTicketChat(id);
};

// Firestore opcional para sincronização real entre PCs/redes.
// Para funcionar: ative Firestore Database no Firebase e permita leitura/escrita autenticada nas regras.
async function v55InitCloudRealtime(){
  try{
    if(!googleConfigReady || !googleConfigReady()) return;
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const fsMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(V36_GOOGLE_FIREBASE_CONFIG);
    V55_FIRESTORE = fsMod.getFirestore(app);
    V55_CLOUD_READY = true;

    fsMod.onSnapshot(fsMod.doc(V55_FIRESTORE, 'assinaturaMagnetica', 'promptReactions'), snap => {
      if(snap.exists()){
        V55_REMOTE_PROMPT_REACTIONS = snap.data().value || {};
        localStorage.setItem('am_prompt_reactions_v28', JSON.stringify(V55_REMOTE_PROMPT_REACTIONS));
        if(typeof updatePromptReactionUI === 'function') updatePromptReactionUI();
      }
    });

    fsMod.onSnapshot(fsMod.doc(V55_FIRESTORE, 'assinaturaMagnetica', 'supportTickets'), snap => {
      if(snap.exists()){
        V55_REMOTE_TICKETS = snap.data().value || [];
        if(Array.isArray(V55_REMOTE_TICKETS)){
          supportTickets = V55_REMOTE_TICKETS;
          localStorage.setItem('am_support_tickets_v43', JSON.stringify(supportTickets));
          if(typeof renderClientArea === 'function') renderClientArea();
          if(V55_TICKET_CHAT_ID) v55RenderTicketChat();
        }
      }
    });

    window.v55FirestoreSetDoc = fsMod.setDoc;
    window.v55FirestoreDoc = fsMod.doc;
  }catch(e){
    console.warn('V55 realtime Firestore indisponível. Usando localStorage.', e);
  }
}
async function v55SyncPromptReactionsCloud(data){
  try{
    if(!V55_CLOUD_READY || !window.v55FirestoreSetDoc) return;
    await window.v55FirestoreSetDoc(window.v55FirestoreDoc(V55_FIRESTORE, 'assinaturaMagnetica', 'promptReactions'), {value:data, updatedAt:Date.now()});
  }catch(e){ console.warn('Falha ao sincronizar reações:', e); }
}
async function v55SyncTicketsCloud(){
  try{
    if(!V55_CLOUD_READY || !window.v55FirestoreSetDoc) return;
    await window.v55FirestoreSetDoc(window.v55FirestoreDoc(V55_FIRESTORE, 'assinaturaMagnetica', 'supportTickets'), {value:supportTickets, updatedAt:Date.now()});
  }catch(e){ console.warn('Falha ao sincronizar tickets:', e); }
}

// sobrescreve salvamentos locais para também tentar nuvem
const v55OldSavePromptReactions = typeof savePromptReactions === 'function' ? savePromptReactions : null;
if(v55OldSavePromptReactions){
  savePromptReactions = function(data){
    localStorage.setItem('am_prompt_reactions_v28', JSON.stringify(data));
    v55SyncPromptReactionsCloud(data);
  };
}
const v55OldSaveSupportTickets = typeof saveSupportTickets === 'function' ? saveSupportTickets : null;
if(v55OldSaveSupportTickets){
  saveSupportTickets = function(){
    localStorage.setItem('am_support_tickets_v43', JSON.stringify(supportTickets));
    v55SyncTicketsCloud();
  };
}
document.addEventListener('DOMContentLoaded', v55InitCloudRealtime);


// V56 — Comunidade sem bloco lateral duplicado + criações reais com imagem e prompt
let v56TopicImageData = '';

function v56EmptyCommunityMessage(){
  return '<div class="community-empty"><strong>Não há criações no momento.</strong><p>Quando alguém publicar uma criação com imagem e prompt, ela aparecerá aqui.</p></div>';
}

function v56TopicCardHTML(t){
  const img = t.image ? `<div class="community-creation-image"><img src="${t.image}" alt="Imagem da criação"></div>` : '';
  const prompt = t.prompt ? `<details class="community-prompt-box"><summary>Ver prompt</summary><pre>${safeText(t.prompt)}</pre></details>` : '';
  return `<article class="topic-card community-creation-card" data-topic-id="${t.id}">
    <div class="topic-top"><div class="topic-avatar">${topicAvatarHTML(t)}</div><div class="topic-author"><strong>${safeText(t.name || 'Usuário')}</strong><span>${safeText(t.role || 'Membro')} • agora</span></div></div>
    <span class="topic-tag">${categoryName(t.category)}</span>
    <h4>${safeText(t.title)}</h4>
    <p>${safeText(t.desc)}</p>
    ${img}
    ${prompt}
    <div class="topic-stats"><button onclick="likeCommunityTopic(${t.id})">❤️ ${t.likes || 0}</button><span>💬 ${t.replies || 0} respostas</span><span>👁 ${t.views || 0} views</span></div>
  </article>`;
}

renderCommunityTopics = function(){
  const wrap = document.getElementById('communityTopics'); 
  if(!wrap) return;
  const list = communityTopics.filter(t => currentCommunityFilter === 'all' || t.category === currentCommunityFilter);
  wrap.innerHTML = list.map(v56TopicCardHTML).join('') || v56EmptyCommunityMessage();
};

function bindCommunityImageV56(){
  const input = document.getElementById('topicImageInput');
  const preview = document.getElementById('topicImagePreview');
  if(!input || !preview) return;
  input.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      v56TopicImageData = reader.result;
      preview.innerHTML = `<img src="${reader.result}" alt="Preview">`;
      preview.classList.add('has-image');
    };
    reader.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindCommunityImageV56();

  const oldPublish = document.getElementById('publishTopic');
  if(oldPublish){
    const clone = oldPublish.cloneNode(true);
    oldPublish.parentNode.replaceChild(clone, oldPublish);
    clone.addEventListener('click', () => {
      if(!currentUser){ openAuth('login'); return; }
      const title = (document.getElementById('topicTitle')?.value || '').trim();
      const desc = (document.getElementById('topicDesc')?.value || '').trim();
      const category = document.getElementById('topicType')?.value || 'portfolio';
      const prompt = (document.getElementById('topicPrompt')?.value || '').trim();
      if(!title || !desc) return toast('Preencha título e descrição.');
      communityTopics.unshift({
        id:Date.now(),
        category,
        title,
        desc,
        prompt,
        image:v56TopicImageData || '',
        name:currentUser.name || currentUser.username || 'Usuário',
        role: currentUser.role === 'admin' ? 'Administrador' : (currentUser.plan === 'VIP' ? 'Membro VIP' : 'Membro Free'),
        photo:currentUser.photo || '',
        likes:0,
        replies:0,
        views:1
      });
      saveCommunityTopics();
      document.getElementById('topicTitle').value = '';
      document.getElementById('topicDesc').value = '';
      document.getElementById('topicPrompt').value = '';
      const preview = document.getElementById('topicImagePreview');
      if(preview){ preview.textContent = 'Enviar imagem de exemplo'; preview.classList.remove('has-image'); }
      const input = document.getElementById('topicImageInput');
      if(input) input.value = '';
      v56TopicImageData = '';
      closeTopicModal();
      renderCommunityTopics();
      toast('Criação salva na Comunidade.');
    });
  }
});




// V58 — Criações da comunidade começam vazias; não puxam prompts/destaques
function v58CommunityEmptyHTML(){
  return `<div class="community-empty community-empty-real">
    <strong>Nenhuma imagem foi gerada ainda.</strong>
    <p>Quando alguém publicar uma criação com imagem de exemplo e prompt, ela aparecerá aqui.</p>
  </div>`;
}
function v58IsRealCommunityCreation(t){
  return !!(t && (t.image || t.prompt) && t.title && t.desc);
}
function v58RenderCommunityOnlyRealCreations(){
  const wrap = document.getElementById('communityTopics');
  if(!wrap) return;
  const saved = Array.isArray(communityTopics) ? communityTopics : [];
  const list = saved
    .filter(v58IsRealCommunityCreation)
    .filter(t => currentCommunityFilter === 'all' || t.category === currentCommunityFilter);

  if(!list.length){
    wrap.innerHTML = v58CommunityEmptyHTML();
    return;
  }

  wrap.innerHTML = list.map(t => {
    const img = t.image ? `<div class="community-creation-image"><img src="${t.image}" alt="Imagem da criação"></div>` : '';
    const prompt = t.prompt ? `<details class="community-prompt-box"><summary>Ver prompt</summary><pre>${safeText(t.prompt)}</pre></details>` : '';
    return `<article class="topic-card community-creation-card" data-topic-id="${t.id}">
      <div class="topic-top"><div class="topic-avatar">${topicAvatarHTML(t)}</div><div class="topic-author"><strong>${safeText(t.name || 'Usuário')}</strong><span>${safeText(t.role || 'Membro')} • agora</span></div></div>
      <span class="topic-tag">${categoryName(t.category)}</span>
      <h4>${safeText(t.title)}</h4>
      <p>${safeText(t.desc)}</p>
      ${img}
      ${prompt}
      <div class="topic-stats"><button onclick="likeCommunityTopic(${t.id})">❤️ ${t.likes || 0}</button><span>💬 ${t.replies || 0} respostas</span><span>👁 ${t.views || 0} views</span></div>
    </article>`;
  }).join('');
}
renderCommunityTopics = v58RenderCommunityOnlyRealCreations;

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(v58RenderCommunityOnlyRealCreations, 100);
  document.querySelectorAll('.community-filter').forEach(btn => {
    btn.addEventListener('click', () => setTimeout(v58RenderCommunityOnlyRealCreations, 50));
  });
});




// V59 — Corrige título do Menu de Prompts que era renomeado indevidamente como Criações da comunidade
function v59FixPromptMenuLabels(){
  const menu = document.getElementById('promptMenu');
  if(!menu) return;
  const eyebrow = menu.querySelector('.section-head .eyebrow');
  const title = menu.querySelector('.section-head h2');
  if(eyebrow) eyebrow.textContent = 'Menu de Prompts';
  if(title) title.textContent = 'Todos os prompts';
}
const v59OriginalApplyLanguage = typeof applyLanguage === 'function' ? applyLanguage : null;
if(v59OriginalApplyLanguage){
  applyLanguage = function(lang){
    v59OriginalApplyLanguage(lang);
    v59FixPromptMenuLabels();
    if(typeof v58RenderCommunityOnlyRealCreations === 'function') v58RenderCommunityOnlyRealCreations();
  };
}
document.addEventListener('DOMContentLoaded', () => {
  v59FixPromptMenuLabels();
  setTimeout(v59FixPromptMenuLabels, 200);
  setTimeout(() => {
    if(typeof v58RenderCommunityOnlyRealCreations === 'function') v58RenderCommunityOnlyRealCreations();
  }, 250);
});


// V60 — Admin premium + atendimento completo
function v60IsAdmin(){
  return !!(currentUser && currentUser.role === 'admin');
}
function v60AdminPremiumNotice(){
  if(v60IsAdmin()){
    toast('Acesso premium do admin liberado.');
  }
}

// Admin sempre consegue copiar/abrir prompt VIP/pago.
const v60OldV53HasVipPromptAccess = typeof v53HasVipPromptAccess === 'function' ? v53HasVipPromptAccess : null;
if(v60OldV53HasVipPromptAccess){
  v53HasVipPromptAccess = function(){
    if(v60IsAdmin()) return true;
    return v60OldV53HasVipPromptAccess();
  };
}
const v60OldV53OpenVipPrompt = typeof v53OpenVipPrompt === 'function' ? v53OpenVipPrompt : null;
if(v60OldV53OpenVipPrompt){
  v53OpenVipPrompt = function(){
    v60OldV53OpenVipPrompt();
    if(v60IsAdmin()) v60AdminPremiumNotice();
  };
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-plan="vip"], .prompt-card span').forEach(el => {
    const card = el.closest('.prompt-card');
    if(card && ((card.dataset.plan === 'vip') || (el.textContent || '').trim().toLowerCase() === 'vip')){
      card.addEventListener('click', () => {
        if(v60IsAdmin()) setTimeout(v60AdminPremiumNotice, 120);
      }, true);
    }
  });
});

// Atendimento: admin pode editar, excluir e exportar por e-mail
function v60TicketById(id){
  return supportTickets.find(t => Number(t.id) === Number(id));
}
window.v60DeleteTicket = function(id){
  if(!v60IsAdmin()) return toast('Apenas admin pode excluir atendimento.');
  const t = v60TicketById(id);
  if(!t) return toast('Atendimento não encontrado.');
  if(!confirm(`Excluir atendimento ${t.protocol || ''}?`)) return;
  supportTickets = supportTickets.filter(x => Number(x.id) !== Number(id));
  saveSupportTickets();
  renderClientArea();
  if(V55_TICKET_CHAT_ID === id) document.getElementById('ticketChatModal')?.classList.add('hidden');
  toast('Atendimento excluído.');
};
window.v60EditTicket = function(id){
  if(!v60IsAdmin()) return toast('Apenas admin pode editar atendimento.');
  if(typeof editTicketV46 === 'function') return editTicketV46(id);
  toast('Editor indisponível.');
};
window.v60ExportTicketEmail = function(id){
  if(!v60IsAdmin()) return toast('Apenas admin pode exportar atendimento.');
  const t = v60TicketById(id);
  if(!t) return toast('Atendimento não encontrado.');
  const replies = (t.replies || []).map(r => `${r.by || 'Mensagem'} (${r.createdAt ? formatFeedDate(r.createdAt) : ''}):\n${r.text || ''}`).join('\n\n');
  const body = encodeURIComponent(
`Olá ${t.name || 'cliente'},

Segue histórico do atendimento:

Protocolo: ${t.protocol || 'Sem protocolo'}
Status: ${t.status || 'Aberto'}
Assunto: ${t.subject || '-'}

Mensagem inicial:
${t.message || ''}

Histórico:
${replies || 'Sem respostas adicionais.'}

Atenciosamente,
Assinatura Magnética`
  );
  const subject = encodeURIComponent(`Histórico do atendimento ${t.protocol || ''}`);
  const email = encodeURIComponent(t.email || '');
  if(!t.email) toast('Cliente sem e-mail cadastrado. Abrindo e-mail sem destinatário.');
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
};
function v60AttendanceActions(t){
  if(!v60IsAdmin()) return '';
  return `<div class="attendance-actions">
    <button class="ticket-action primary" onclick="v55OpenTicketChat(${t.id})">Chat</button>
    <button class="ticket-action secondary" onclick="v60EditTicket(${t.id})">Editar</button>
    <button class="ticket-action secondary" onclick="v60ExportTicketEmail(${t.id})">Exportar e-mail</button>
    <button class="ticket-action danger" onclick="v60DeleteTicket(${t.id})">Excluir</button>
  </div>`;
}
function v60RenderAttendances(){
  const list = document.getElementById('attendanceList');
  if(!list || !v60IsAdmin()) return;
  const q = document.getElementById('attendanceSearchInput')?.value || '';
  const status = document.getElementById('attendanceStatusFilter')?.value || 'all';
  const tickets = (Array.isArray(supportTickets) ? supportTickets : []).filter(t => {
    const statusOk = status === 'all' || t.status === status;
    const hay = [t.protocol,t.name,t.email,t.subject,t.message,t.status].join(' ').toLowerCase();
    return statusOk && (!q || hay.includes(q.toLowerCase()));
  });
  if(!tickets.length){
    list.innerHTML = '<div class="client-card"><p>Nenhum atendimento encontrado.</p></div>';
    return;
  }
  list.innerHTML = tickets.slice().reverse().map(t => {
    const count = (t.replies || []).length;
    const statusClass = typeof ticketStatusClassV46 === 'function' ? ticketStatusClassV46(t.status) : '';
    return `<article class="attendance-card ${statusClass}">
      <div class="attendance-info">
        <div class="ticket-protocol">${safeText(t.protocol || 'Sem protocolo')}</div>
        <strong>${safeText(t.subject || 'Atendimento')}</strong>
        <span>${safeText(t.name || 'Cliente')} • ${safeText(t.email || '')}</span>
        <small>${count} mensagem${count===1?'':'s'} • ${safeText(t.status || 'Aberto')}</small>
      </div>
      ${v60AttendanceActions(t)}
    </article>`;
  }).join('');
}
v55RenderAttendances = v60RenderAttendances;

// Quando um cliente abre um ticket, ele aparece no menu Atendimentos e pode abrir chat popup.
const v60OldPublishSupportTicket = typeof publishSupportTicket === 'function' ? publishSupportTicket : null;
if(v60OldPublishSupportTicket){
  publishSupportTicket = function(){
    const before = Array.isArray(supportTickets) ? supportTickets.length : 0;
    v60OldPublishSupportTicket();
    const after = Array.isArray(supportTickets) ? supportTickets.length : 0;
    if(after > before){
      const created = supportTickets[supportTickets.length - 1];
      if(created){
        toast(`Atendimento aberto: ${created.protocol || 'sem protocolo'}`);
      }
      if(typeof v55RenderAttendances === 'function') v55RenderAttendances();
    }
  };
}

// Ao abrir chat, admin também vê ferramentas no cabeçalho.
const v60OldRenderTicketChat = typeof v55RenderTicketChat === 'function' ? v55RenderTicketChat : null;
if(v60OldRenderTicketChat){
  v55RenderTicketChat = function(){
    v60OldRenderTicketChat();
    const header = document.querySelector('.ticket-chat-header');
    if(header && v60IsAdmin() && V55_TICKET_CHAT_ID){
      let tools = header.querySelector('.ticket-chat-admin-tools');
      if(!tools){
        tools = document.createElement('div');
        tools.className = 'ticket-chat-admin-tools';
        header.appendChild(tools);
      }
      tools.innerHTML = `<button onclick="v60EditTicket(${V55_TICKET_CHAT_ID})">Editar</button><button onclick="v60ExportTicketEmail(${V55_TICKET_CHAT_ID})">Exportar</button><button onclick="v60DeleteTicket(${V55_TICKET_CHAT_ID})">Excluir</button>`;
    }
  };
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('attendanceSearchInput')?.addEventListener('input', v60RenderAttendances);
  document.getElementById('attendanceStatusFilter')?.addEventListener('change', v60RenderAttendances);
  setTimeout(v60RenderAttendances, 300);
});




// V63 — patch Codex aplicado: prompt personalizado, orçamento e sync local
(function(){
  const oldPublish = typeof publishSupportTicket === 'function' ? publishSupportTicket : null;
  if(oldPublish){
    publishSupportTicket = function(){
      if(!currentUser){ openAuth('login'); return; }
      if(typeof syncRichHiddenV47 === 'function') syncRichHiddenV47('ticketMessageEditor','ticketMessage');
      const subject = (document.getElementById('ticketSubject')?.value || '').trim();
      const messageHTML = typeof getRichEditorHTMLV47 === 'function' ? getRichEditorHTMLV47('ticketMessageEditor') : (document.getElementById('ticketMessage')?.value || '');
      const messageText = typeof richTextPlainV47 === 'function' ? richTextPlainV47(messageHTML) : messageHTML.replace(/<[^>]+>/g,'').trim();
      const customPrompt = !!document.getElementById('ticketIsCustomPrompt')?.checked;
      const budgetRaw = (document.getElementById('ticketBudget')?.value || '').trim();
      const budget = budgetRaw ? Number(budgetRaw) : null;
      if(!subject || !messageText) return toast('Preencha assunto e mensagem.');
      const ticket = {
        id: Date.now(),
        protocol: typeof generateTicketProtocolV46 === 'function' ? generateTicketProtocolV46() : ('AM-' + Date.now()),
        owner: currentUserKey(),
        name: currentUser.name || currentUser.username || 'Usuário',
        email: currentUser.email || '',
        subject,
        message: messageText,
        messageHTML,
        customPrompt,
        budget,
        status:'Aberto',
        replies:[],
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString()
      };
      supportTickets.push(ticket);
      saveSupportTickets();
      document.getElementById('ticketSubject').value = '';
      const customField = document.getElementById('ticketIsCustomPrompt'); if(customField) customField.checked = false;
      const budgetField = document.getElementById('ticketBudget'); if(budgetField) budgetField.value = '';
      if(typeof setRichEditorHTMLV47 === 'function') setRichEditorHTMLV47('ticketMessageEditor','');
      const msg = document.getElementById('ticketMessage'); if(msg) msg.value = '';
      document.getElementById('supportTicketModal')?.classList.add('hidden');
      if(typeof renderClientArea === 'function') renderClientArea();
      if(typeof showTicketCreatedV47 === 'function') showTicketCreatedV47(ticket.protocol);
      toast(`Ticket aberto. Protocolo: ${ticket.protocol}`);
      if(typeof pushNotificationV45 === 'function'){
        pushNotificationV45({
          role:'admin',
          title:'Novo ticket aberto',
          message:`${ticket.protocol} • ${ticket.name}: ${ticket.subject}${ticket.customPrompt ? ` • Orçamento: R$ ${ticket.budget || 0}` : ''}`,
          type:'ticket',
          link:'client-area'
        });
      }
    };
  }

  const oldRenderChat = typeof v55RenderTicketChat === 'function' ? v55RenderTicketChat : null;
  if(oldRenderChat){
    v55RenderTicketChat = function(){
      const ticket = supportTickets.find(t => t.id === V55_TICKET_CHAT_ID);
      if(!ticket) return oldRenderChat();
      const originalHTML = ticket.messageHTML || '';
      const prefix = ticket.customPrompt ? `<p><strong>Prompt personalizado</strong> • Orçamento: R$ ${safeText(String(ticket.budget || 0))}</p>` : '';
      ticket.messageHTML = prefix + originalHTML;
      oldRenderChat();
      ticket.messageHTML = originalHTML;
    };
  }

  window.addEventListener('storage', (e) => {
    if(e.key === 'am_prompt_reactions_v28' && e.newValue){
      try{
        const data = JSON.parse(e.newValue);
        localStorage.setItem('am_prompt_reactions_v28', JSON.stringify(data));
        if(typeof updatePromptReactionUI === 'function') updatePromptReactionUI();
        if(typeof v54FilterPromptMenu === 'function'){
          const active = document.querySelector('.prompt-menu-filter.active')?.dataset.filter || 'all';
          v54FilterPromptMenu(active);
        }
      }catch(_e){}
    }
    if(e.key === 'am_support_tickets_v43' && e.newValue){
      try{
        supportTickets = JSON.parse(e.newValue) || [];
        if(typeof renderClientArea === 'function') renderClientArea();
        if(typeof V55_TICKET_CHAT_ID !== 'undefined' && V55_TICKET_CHAT_ID && typeof v55RenderTicketChat === 'function') v55RenderTicketChat();
      }catch(_e){}
    }
  });
})();




// V64 — Atendimento visível: chat automático + botão flutuante admin + realtime local reforçado
(function(){
  function v64IsAdmin(){
    return !!(currentUser && currentUser.role === 'admin');
  }

  function v64AllOpenTickets(){
    return (Array.isArray(supportTickets) ? supportTickets : []).filter(t => t.status !== 'Encerrado');
  }

  function v64RenderFloatingSupport(){
    const launcher = document.getElementById('supportFloatingLauncher');
    const count = document.getElementById('supportFloatingCount');
    const list = document.getElementById('supportFloatingList');
    if(!launcher || !count || !list) return;

    launcher.classList.toggle('hidden', !v64IsAdmin());

    if(!v64IsAdmin()) return;

    const tickets = v64AllOpenTickets();
    count.textContent = tickets.length;
    count.classList.toggle('hidden', tickets.length === 0);

    if(!tickets.length){
      list.innerHTML = '<div class="support-floating-empty">Nenhum atendimento aberto.</div>';
      return;
    }

    list.innerHTML = tickets.slice().reverse().map(t => `
      <button class="support-floating-item" onclick="v55OpenTicketChat(${t.id})">
        <strong>${safeText(t.subject || 'Atendimento')}</strong>
        <span>${safeText(t.protocol || 'Sem protocolo')} • ${safeText(t.name || 'Cliente')}</span>
        <span>${t.customPrompt ? 'Prompt personalizado • R$ ' + safeText(String(t.budget || 0)) : safeText(t.status || 'Aberto')}</span>
      </button>
    `).join('');
  }

  window.v64RenderFloatingSupport = v64RenderFloatingSupport;

  const oldRenderClientArea = typeof renderClientArea === 'function' ? renderClientArea : null;
  if(oldRenderClientArea){
    renderClientArea = function(){
      oldRenderClientArea();
      v64RenderFloatingSupport();
    };
  }

  const oldSaveTickets = typeof saveSupportTickets === 'function' ? saveSupportTickets : null;
  if(oldSaveTickets){
    saveSupportTickets = function(){
      oldSaveTickets();
      v64RenderFloatingSupport();
      window.dispatchEvent(new StorageEvent('storage', {
        key:'am_support_tickets_v43',
        newValue:localStorage.getItem('am_support_tickets_v43')
      }));
    };
  }

  const oldPublish = typeof publishSupportTicket === 'function' ? publishSupportTicket : null;
  if(oldPublish){
    publishSupportTicket = function(){
      const beforeIds = new Set((supportTickets || []).map(t => t.id));
      oldPublish();
      const created = (supportTickets || []).find(t => !beforeIds.has(t.id));
      if(created){
        setTimeout(() => {
          if(typeof v55OpenTicketChat === 'function') v55OpenTicketChat(created.id);
          v64RenderFloatingSupport();
        }, 350);
      }
    };
  }

  const oldOpenChat = typeof v55OpenTicketChat === 'function' ? v55OpenTicketChat : null;
  if(oldOpenChat){
    v55OpenTicketChat = function(id){
      oldOpenChat(id);
      v64RenderFloatingSupport();
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('supportFloatingBtn');
    const panel = document.getElementById('supportFloatingPanel');
    const close = document.getElementById('closeSupportFloatingPanel');

    if(btn && panel){
      btn.addEventListener('click', () => {
        if(!v64IsAdmin()) return;
        panel.classList.toggle('hidden');
        v64RenderFloatingSupport();
      });
    }
    if(close && panel){
      close.addEventListener('click', () => panel.classList.add('hidden'));
    }

    document.addEventListener('click', e => {
      const wrap = document.getElementById('supportFloatingLauncher');
      if(wrap && !wrap.contains(e.target)){
        document.getElementById('supportFloatingPanel')?.classList.add('hidden');
      }
    });

    setTimeout(v64RenderFloatingSupport, 500);
    setInterval(v64RenderFloatingSupport, 3000);
  });

  window.addEventListener('storage', (e) => {
    if(e.key === 'am_support_tickets_v43' && e.newValue){
      try{
        supportTickets = JSON.parse(e.newValue) || [];
        if(typeof renderClientArea === 'function') renderClientArea();
        if(typeof V55_TICKET_CHAT_ID !== 'undefined' && V55_TICKET_CHAT_ID && typeof v55RenderTicketChat === 'function') v55RenderTicketChat();
        v64RenderFloatingSupport();
      }catch(_e){}
    }
    if(e.key === 'am_prompt_reactions_v28' && e.newValue){
      try{
        if(typeof updatePromptReactionUI === 'function') updatePromptReactionUI();
        if(typeof v54FilterPromptMenu === 'function'){
          const active = document.querySelector('.prompt-menu-filter.active')?.dataset.filter || 'all';
          v54FilterPromptMenu(active);
        }
      }catch(_e){}
    }
  });
})();




// V65 — Correção real: tickets entre contas/computadores via Firebase Firestore
// Observação: para funcionar entre PCs diferentes, o Firebase Firestore precisa estar habilitado no console Firebase.
let V65_FIRESTORE = null;
let V65_FIRESTORE_MOD = null;
let V65_CLOUD_OK = false;
let V65_SYNCING = false;
const V65_TICKETS_DOC = ['assinaturaMagnetica', 'supportTicketsRealtime'];

function v65TicketKey(t){
  return String(t.id || t.protocol || (t.createdAt + '-' + t.subject));
}
function v65MergeTickets(localTickets, cloudTickets){
  const map = new Map();
  [...(cloudTickets || []), ...(localTickets || [])].forEach(t => {
    if(!t) return;
    const key = v65TicketKey(t);
    const existing = map.get(key);
    if(!existing){
      map.set(key, t);
      return;
    }
    const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
    const nextTime = new Date(t.updatedAt || t.createdAt || 0).getTime();
    map.set(key, nextTime >= existingTime ? {...existing, ...t} : {...t, ...existing});
  });
  return [...map.values()].sort((a,b)=> new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}
function v65PersistTicketsMerged(nextTickets, shouldRender=true){
  supportTickets = v65MergeTickets(supportTickets || [], nextTickets || []);
  localStorage.setItem('am_support_tickets_v43', JSON.stringify(supportTickets));
  if(shouldRender){
    if(typeof renderClientArea === 'function') renderClientArea();
    if(typeof v64RenderFloatingSupport === 'function') v64RenderFloatingSupport();
    if(typeof v55RenderAttendances === 'function') v55RenderAttendances();
    if(typeof v60RenderAttendances === 'function') v60RenderAttendances();
    if(typeof V55_TICKET_CHAT_ID !== 'undefined' && V55_TICKET_CHAT_ID && typeof v55RenderTicketChat === 'function') v55RenderTicketChat();
  }
}
async function v65InitFirestoreTickets(){
  try{
    if(!V36_GOOGLE_FIREBASE_CONFIG || !V36_GOOGLE_FIREBASE_CONFIG.apiKey){
      console.warn('V65 Firestore: config Firebase ausente.');
      return false;
    }
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const fsMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    V65_FIRESTORE_MOD = fsMod;
    const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(V36_GOOGLE_FIREBASE_CONFIG);
    V65_FIRESTORE = fsMod.getFirestore(app);
    V65_CLOUD_OK = true;

    const ref = fsMod.doc(V65_FIRESTORE, ...V65_TICKETS_DOC);

    // Escuta tempo real
    fsMod.onSnapshot(ref, snap => {
      if(!snap.exists()) return;
      const cloudTickets = snap.data().tickets || [];
      v65PersistTicketsMerged(cloudTickets, true);
    }, err => {
      console.warn('V65 Firestore listener falhou:', err);
      V65_CLOUD_OK = false;
      toast('Firestore não está liberado. Tickets entre PCs precisam do Firestore ativo.');
    });

    // Primeiro push dos tickets locais existentes
    setTimeout(v65PushTicketsToCloud, 1200);

    console.info('V65 Firestore tickets ativo.');
    return true;
  }catch(err){
    console.warn('V65 Firestore indisponível:', err);
    V65_CLOUD_OK = false;
    return false;
  }
}
async function v65PushTicketsToCloud(){
  if(!V65_CLOUD_OK || !V65_FIRESTORE || !V65_FIRESTORE_MOD || V65_SYNCING) return;
  V65_SYNCING = true;
  try{
    const ref = V65_FIRESTORE_MOD.doc(V65_FIRESTORE, ...V65_TICKETS_DOC);
    const snap = await V65_FIRESTORE_MOD.getDoc(ref);
    const cloudTickets = snap.exists() ? (snap.data().tickets || []) : [];
    const merged = v65MergeTickets(supportTickets || [], cloudTickets || []);
    await V65_FIRESTORE_MOD.setDoc(ref, {
      tickets: merged,
      updatedAt: Date.now()
    }, {merge:true});
    v65PersistTicketsMerged(merged, false);
  }catch(err){
    console.warn('V65 push tickets falhou:', err);
  }finally{
    V65_SYNCING = false;
  }
}
async function v65PullTicketsFromCloud(){
  if(!V65_CLOUD_OK || !V65_FIRESTORE || !V65_FIRESTORE_MOD) return;
  try{
    const ref = V65_FIRESTORE_MOD.doc(V65_FIRESTORE, ...V65_TICKETS_DOC);
    const snap = await V65_FIRESTORE_MOD.getDoc(ref);
    if(snap.exists()){
      v65PersistTicketsMerged(snap.data().tickets || [], true);
    }
  }catch(err){
    console.warn('V65 pull tickets falhou:', err);
  }
}

// Sobrescreve salvamento de tickets para também enviar para nuvem.
const v65OldSaveSupportTickets = typeof saveSupportTickets === 'function' ? saveSupportTickets : null;
saveSupportTickets = function(){
  localStorage.setItem('am_support_tickets_v43', JSON.stringify(supportTickets || []));
  if(v65OldSaveSupportTickets){
    try{ v65OldSaveSupportTickets(); }catch(e){}
  }
  setTimeout(v65PushTicketsToCloud, 150);
};

// Reforço após criar ticket: envia para nuvem e abre o chat.
const v65OldPublishSupportTicket = typeof publishSupportTicket === 'function' ? publishSupportTicket : null;
if(v65OldPublishSupportTicket){
  publishSupportTicket = function(){
    const before = new Set((supportTickets || []).map(t => v65TicketKey(t)));
    v65OldPublishSupportTicket();
    const created = (supportTickets || []).find(t => !before.has(v65TicketKey(t)));
    if(created){
      created.updatedAt = created.updatedAt || new Date().toISOString();
      localStorage.setItem('am_support_tickets_v43', JSON.stringify(supportTickets || []));
      setTimeout(v65PushTicketsToCloud, 200);
      setTimeout(() => {
        if(typeof v55OpenTicketChat === 'function') v55OpenTicketChat(created.id);
      }, 400);
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(v65InitFirestoreTickets, 800);
  setInterval(v65PullTicketsFromCloud, 5000);
  setInterval(v65PushTicketsToCloud, 10000);
});
