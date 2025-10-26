import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { query, where } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
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

// ======= SISTEMA DE NOTIFICAÇÃO =======
function showNotification(msg, type = "info") {
  const div = document.createElement("div");
  div.className = `notification ${type}`;
  div.innerText = msg;
  document.body.appendChild(div);
  setTimeout(() => div.classList.add("show"), 10);
  setTimeout(() => {
    div.classList.remove("show");
    setTimeout(() => div.remove(), 300);
  }, 3000);
}

// ======= LOGIN / SIGNUP =======
function signup() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
  .then((userCredential) => {
    const user = userCredential.user;

    // Cria documento de perfil com role "jogador"
    setDoc(doc(db, "usuarios", user.uid), {
      email: user.email,
      role: "jogador" // ou "mestre" se for você
    });

    showNotification("Conta criada com sucesso!", "success");
  })
  .catch(error => showNotification("Erro ao cadastrar: " + error.message, "error"));
}

function login() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
  signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(() => showNotification("Login bem-sucedido!", "success"))
    .catch(error => showNotification("Erro ao fazer login: " + error.message, "error"));
}

// ======= MOSTRAR LISTA DE FICHAS =======
async function showFichaList() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('ficha').style.display = 'none';

  let listDiv = document.getElementById('fichas-list');
  if (!listDiv) {
    listDiv = document.createElement('div');
    listDiv.id = 'fichas-list';
    listDiv.className = 'fichas-list';
    document.body.appendChild(listDiv);
  }

  listDiv.innerHTML = `<h2>Suas fichas</h2><div class="ficha-cards"></div>`;
  const cardsContainer = listDiv.querySelector(".ficha-cards");

  const user = auth.currentUser;
  if (!user) return;

  const fichasRef = collection(db, "fichas");
  const q = query(fichasRef, where("owner", "==", user.uid));
  const snapshot = await getDocs(q);
  let hasFicha = false;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    hasFicha = true;
    const card = document.createElement("div");
    card.className = "ficha-card";
    card.innerHTML = `
      <h3>${data.nome || "Sem nome"}</h3>
      <p>ID: ${docSnap.id}</p>
    `;
    card.onclick = () => openFicha(docSnap.id);
    cardsContainer.appendChild(card);
  });

  // Botão para criar nova ficha
  const newCard = document.createElement("div");
  newCard.className = "ficha-card add-card";
  newCard.innerHTML = "+ Nova Ficha";
  newCard.onclick = createNewFicha;
  cardsContainer.appendChild(newCard);

  if (!hasFicha) showNotification("Nenhuma ficha encontrada. Crie uma nova!", "info");
}

async function createNewFicha() {
  const user = auth.currentUser;
  if (!user) return;

  const fichaId = `${user.uid}-${Date.now()}`;
  await setDoc(doc(db, "fichas", fichaId), {
    nome: "Novo Personagem",
    owner: user.uid
  });

  showNotification("Nova ficha criada!", "success");
  openFicha(fichaId);
} // ← esta é a chave correta


async function openFicha(fichaId) {
  const fichaRef = doc(db, "fichas", fichaId);
  const docSnap = await getDoc(fichaRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    Object.keys(data).forEach(key => {
      const el = document.getElementById(key);
      if (el) el.value = data[key];
    });
  }

  document.getElementById('fichas-list').remove();
  showFicha();
}

// ======= ESTADO DO USUÁRIO =======
onAuthStateChanged(auth, user => {
  if (user) showFichaList();
});

// ======= CÁLCULOS (mantidos do original) =======
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
}

// ======= SALVAR =======
function salvarFicha() {
  const user = auth.currentUser;
  if (!user) {
    showNotification("Usuário não logado", "error");
    return;
  }

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
    if (el) data[id] = el.value;
  });

  // Adiciona o campo owner para controle de acesso
  data.owner = user.uid;

  const fichaId = `${user.uid}-${data.nome || "semnome"}`;
  setDoc(doc(db, "fichas", fichaId), data)
    .then(() => showNotification("Ficha salva com sucesso!", "success"))
    .catch(err => showNotification("Erro ao salvar: " + err.message, "error"));
}

function showFicha() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('ficha').style.display = 'block';
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('btn-login').addEventListener('click', login);
  document.getElementById('btn-signup').addEventListener('click', signup);
  document.getElementById('btn-salvar').addEventListener('click', salvarFicha);
});
