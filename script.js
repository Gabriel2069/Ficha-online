import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { 
  getFirestore, doc, getDoc, setDoc, collection, getDocs 
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3Qssht7axuM8aE4gQL965EBZJo-qzmsU",
  authDomain: "fichas-e87fd.firebaseapp.com",
  projectId: "fichas-e87fd",
  storageBucket: "fichas-e87fd.appspot.com",
  messagingSenderId: "496979447757",
  appId: "1:496979447757:web:dc54dfdc358c558bc53e84",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ========= TOASTS (notificações visuais) ========= */
function showToast(msg, tipo = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/* ========= LOGIN / SIGNUP ========= */
function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => showToast("Conta criada com sucesso!", "sucesso"))
    .catch(error => showToast(error.message, "erro"));
}

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  signInWithEmailAndPassword(auth, email, password)
    .then(() => showToast("Login bem-sucedido!", "sucesso"))
    .catch(error => showToast(error.message, "erro"));
}

/* ========= LISTAR FICHAS ========= */
async function listarFichas(user) {
  const fichasContainer = document.createElement("div");
  fichasContainer.id = "lista-fichas";
  fichasContainer.innerHTML = `<h2>Suas Fichas</h2><div class="fichas-grid"></div>`;
  document.getElementById('auth').replaceWith(fichasContainer);

  const grid = fichasContainer.querySelector(".fichas-grid");

  const fichasRef = collection(db, "fichas", user.uid, "personagens");
  const snap = await getDocs(fichasRef);

  snap.forEach(docSnap => {
    const dados = docSnap.data();
    const nome = dados.nome || "Sem Nome";
    const card = document.createElement("div");
    card.className = "ficha-card";
    card.innerHTML = `<h3>${nome}</h3>`;
    card.addEventListener("click", () => abrirFicha(user.uid, docSnap.id));
    grid.appendChild(card);
  });

  // botão nova ficha
  const addCard = document.createElement("div");
  addCard.className = "ficha-card add";
  addCard.textContent = "+";
  addCard.addEventListener("click", () => criarNovaFicha(user.uid));
  grid.appendChild(addCard);
}

/* ========= ABRIR / CRIAR FICHAS ========= */
async function abrirFicha(uid, fichaId) {
  const fichaRef = doc(db, "fichas", uid, "personagens", fichaId);
  const snap = await getDoc(fichaRef);
  if (snap.exists()) {
    const data = snap.data();
    Object.keys(data).forEach(key => {
      const el = document.getElementById(key);
      if (el) el.value = data[key];
    });
    showFicha();
    showToast(`Ficha "${data.nome || 'Sem nome'}" carregada`, "info");
  } else {
    showToast("Ficha não encontrada.", "erro");
  }
}

async function criarNovaFicha(uid) {
  const nome = prompt("Nome do novo personagem:");
  if (!nome) return;
  const fichaRef = doc(collection(db, "fichas", uid, "personagens"));
  await setDoc(fichaRef, { nome });
  showToast(`Ficha "${nome}" criada!`, "sucesso");
  listarFichas(auth.currentUser);
}

/* ========= MOSTRAR FICHA ========= */
function showFicha() {
  document.getElementById('ficha').style.display = 'block';
  document.getElementById('lista-fichas')?.remove();
}

/* ========= ESTADO DO USUÁRIO ========= */
onAuthStateChanged(auth, user => {
  if (user) {
    listarFichas(user);
  }
});

// ======= FUNÇÕES DE CÁLCULO =======
function limitarAtributo(valor) {
  if (valor > 6) return 6;
  if (valor < 0) return 0;
  return valor;
}

function updateCalculos() {
    const cor = limitarAtributo(+document.getElementById('cor-val').value);
    const men = limitarAtributo(+document.getElementById('men-val').value);
    const ins = limitarAtributo(+document.getElementById('ins-val').value);
    const con = limitarAtributo(+document.getElementById('con-val').value);
    const exp = +document.getElementById('exposicao').value || 0;

    document.getElementById('cor-val').value = cor;
    document.getElementById('men-val').value = men;
    document.getElementById('ins-val').value = ins;
    document.getElementById('con-val').value = con;

    // Definir máximos de acordo com exposição
    const expMap = [
      {pv:15, san:15, pe:5, def:10},
      {pv:20, san:20, pe:10, def:12},
      {pv:25, san:25, pe:15, def:14},
      {pv:30, san:30, pe:20, def:16},
      {pv:35, san:35, pe:25, def:18},
      {pv:40, san:40, pe:30, def:20},
      {pv:45, san:45, pe:35, def:22},
      {pv:50, san:50, pe:40, def:24},
      {pv:55, san:55, pe:45, def:26},
      {pv:60, san:60, pe:50, def:28},
    ];

    const maxVals = expMap[exp] || expMap[0];
    document.getElementById('pv-max').value = maxVals.pv + 2*cor;
    document.getElementById('san-max').value = maxVals.san + 2*men;
    document.getElementById('pe-max').value = maxVals.pe + 2*con;

    updateDefesa();
    updateBarraVisual('pv');
    updateBarraVisual('san');
    updateBarraVisual('pe');
}

function updateDefesa() {
    const ins = limitarAtributo(+document.getElementById('ins-val').value);
    const equip = +document.getElementById('def-equip').value || 0;
    const bonus = +document.getElementById('def-bonus').value || 0;
    document.getElementById('defesa-val').innerText = 10 + ins + equip + bonus;
}

function updateBarraVisual(tipo) {
    const atual = +document.getElementById(`${tipo}-atual`).value || 0;
    const max = +document.getElementById(`${tipo}-max`).value || 1;
    const percent = Math.min((atual / max) * 100, 100);

    const barra = document.getElementById(`barra-${tipo}`);
    barra.style.width = `${percent}%`;

    // Ajustar cor
    if(percent <= 30) barra.style.background = '#555';
    else if(percent <= 70) barra.style.background = '#888';
    else barra.style.background = tipo === 'pv' ? 'red' : tipo === 'san' ? 'purple' : 'green';
}

function updateEquilibrio() {
    const val = +document.getElementById('equilibrio').value;
    document.getElementById('barra-equilibrio').style.setProperty('--pos', `${(val+10)*5}%`);
}

function updateExposicao() {
    updateCalculos();
}

// ======= SALVAR FICHA =======
function salvarFicha() {
  const user = auth.currentUser;
  if (!user) return alert("Usuário não logado");

  const campos = [
    'nome','idade','origem','ocupacao','marca','motivacao',
    'cor-val','men-val','ins-val','pre-val','con-val',
    'pv-atual','pv-max','san-atual','san-max',
    'pe-atual','pe-max','def-equip','def-bonus',
    'equilibrio','exposicao'
  ];

  const data = {};
  campos.forEach(id => {
    const el = document.getElementById(id);
    if(el) data[id] = el.value;
  });

  setDoc(doc(db, 'fichas', user.uid), data)
    .then(() => alert("Ficha salva com sucesso!"))
    .catch(err => alert("Erro ao salvar ficha: " + err.message));
}

// ======= ABAS =======
function showTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const tab = document.getElementById(tabId);
    if(tab) tab.classList.add('active');
}

function showFicha() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('ficha').style.display = 'block';
}

/* ========= EVENTOS ========= */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('btn-login').addEventListener('click', login);
  document.getElementById('btn-signup').addEventListener('click', signup);
});
