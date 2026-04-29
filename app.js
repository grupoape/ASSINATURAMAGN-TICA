const ADMIN_EMAIL = "fernandoalmeidacarvalhojr@gmail.com";

// V36 GOOGLE LOGIN — CONFIGURAÇÃO FIREBASE
// Para ativar login Google real:
// 1) Crie um projeto em https://console.firebase.google.com
// 2) Ative Authentication > Sign-in method > Google
// 3) Adicione seu domínio autorizado
// 4) Substitua os valores abaixo pelas chaves do seu app Web Firebase.
const V36_GOOGLE_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  appId: ""
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
  $('#vipBtn').onclick = () => toast('Área VIP pronta para integração de pagamento.');
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
