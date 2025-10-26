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

// ======= NOTIFICAÇÃO =======
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

      setDoc(doc(db, "usuarios", user.uid), {
        email: user.email,
        role: "jogador"
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
    `;
    card.onclick = () => openFicha(docSnap.id);
    cardsContainer.appendChild(card);
  });

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
}

// ======= ABRIR FICHA =======
async function openFicha(fichaId) {
  const fichaRef = doc(db, "fichas", fichaId);
  const docSnap = await getDoc(fichaRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    Object.keys(data).forEach(key => {
      const el = document.getElementById(key);
      if (el) el.value = data[key];
    });

    // Preenche as perícias
    if (data.COR) preencherPericias('COR', data.COR);
    if (data.MEN) preencherPericias('MEN', data.MEN);
    if (data.INS) preencherPericias('INS', data.INS);
    if (data.PRE) preencherPericias('PRE', data.PRE);
    if (data.CON) preencherPericias('CON', data.CON);
  }

  document.getElementById('fichas-list')?.remove();
  showFicha();
  updateCalculos();
}

// ======= PERÍCIAS =======
function preencherPericias(categoria, valores) {
  const coluna = Array.from(document.querySelectorAll('.coluna-pericia'))
                      .find(c => c.querySelector('h3').innerText.includes(categoria));
  if (!coluna) return;

  Object.keys(valores).forEach(nome => {
    const label = Array.from(coluna.querySelectorAll('label'))
                       .find(l => l.childNodes[0].textContent.trim().replace(':','') === nome);
    if (label) label.querySelector('input').value = valores[nome];
  });
}

// ======= CALCULOS =======
function limitarAtributo(valor) {
  if (valor > 6) return 6;
  if (valor < 0) return 0;
  return valor;
}

function updateCalculos() {
  const cor = limitarAtributo(+document.getElementById('cor-val').value);
  const men = limitarAtributo(+document.getElementById('men-val').value);
  const ins = limitarAtributo(+document.getElementById('ins-val').value);
  const pre = limitarAtributo(+document.getElementById('pre-val').value);
  const con = limitarAtributo(+document.getElementById('con-val').value);
  const exp = Math.min(+document.getElementById('exposicao').value, 10); // Limita a 10
  document.getElementById('exposicao').value = exp; // Garante no slider

  document.getElementById('cor-val').value = cor;
  document.getElementById('men-val').value = men;
  document.getElementById('ins-val').value = ins;
  document.getElementById('pre-val').value = pre;
  document.getElementById('con-val').value = con;

  // Sincroniza os valores das bolas do pentágono com os inputs extras
  document.getElementById('cor-input').value = cor;
  document.getElementById('men-input').value = men;
  document.getElementById('ins-input').value = ins;
  document.getElementById('pre-input').value = pre;
  document.getElementById('con-input').value = con;

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
  const pvMod = +document.getElementById('pv-mod').value || 0;
  const sanMod = +document.getElementById('san-mod').value || 0;
  const peMod = +document.getElementById('pe-mod').value || 0;
  document.getElementById('pv-max').value = maxVals.pv + 2*cor + pvMod;
  document.getElementById('san-max').value = maxVals.san + 2*men + sanMod;
  document.getElementById('pe-max').value = maxVals.pe + 2*con + peMod;

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

// === Atualiza barras coloridas (agora com limite atual <= max) ===
function updateBarraVisual(tipo) {
  const atualInput = document.getElementById(`${tipo}-atual`);
  const maxInput = document.getElementById(`${tipo}-max`);
  let atual = parseInt(atualInput.value) || 0;
  const max = parseInt(maxInput.value) || 1;
  
  // Limita atual a <= max
  if (atual > max) atual = max;
  atualInput.value = atual;
  
  const barra = document.getElementById(`barra-${tipo}`);
  const percent = (atual / max) * 100;
  barra.style.width = `${percent}%`;
  
  // Adiciona número na barra
  barra.innerHTML = `<span class="barra-num">${atual}/${max}</span>`;
}

function updateBarras() {
  ['pv','san','pe'].forEach(t => updateBarraVisual(t));
}

// === Equilíbrio e Exposição ===
function updateEquilibrio() {
  const val = parseInt(document.getElementById('equilibrio').value) || 0;
  const barra = document.getElementById('barra-equilibrio');
  const percent = ((val + 10) / 20) * 100;  // 0% no centro (-10), 100% na direita (+10)
  barra.style.background = `linear-gradient(to right, #550000 0%, #000 ${50 - percent/2}%, #fffacd ${50 + percent/2}%, #ffff00 100%)`;  // Vermelho esquerda, amarelo direita, meio a meio no centro
}

function updateExposicao() {
  updateCalculos();
  const val = Math.min(parseInt(document.getElementById('exposicao').value) || 0, 10); // Limita a 10
  document.getElementById('exposicao').value = val;
  const barra = document.getElementById('barra-exposicao');
  barra.innerHTML = '';  // Limpa
  for (let i = 0; i < 10; i++) {
    const level = document.createElement('div');
    level.className = 'exposicao-level';
    if (i <= val) level.classList.add('active');  // Destaca até o nível atual
    barra.appendChild(level);
  }
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

  // Salva todas as perícias
  const periciasDiv = document.querySelectorAll('.pericias .coluna-pericia');
  periciasDiv.forEach(coluna => {
    const categoria = coluna.querySelector('h3').innerText.match(/\$(\w+)\$/)[1];
    const labels = coluna.querySelectorAll('label');
    data[categoria] = {};
    labels.forEach(label => {
      const input = label.querySelector('input');
      if(input){
        const nome = label.childNodes[0].textContent.trim().replace(':','');
        data[categoria][nome] = input.value;
      }
    });
  });

  data.owner = user.uid;
  const fichaId = `${user.uid}-${data.nome || "semnome"}`;
  setDoc(doc(db, "fichas", fichaId), data)
    .then(() => showNotification("Ficha salva com sucesso!", "success"))
    .catch(err => showNotification("Erro ao salvar: " + err.message, "error"));
}

// ======= FUNÇÕES AUXILIARES =======
function voltarParaSelecao() {
  document.getElementById('ficha').style.display = 'none';
  showFichaList();
}

function showFicha() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('ficha').style.display = 'block';
}

// ======= MOSTRAR ABA =======
function showTab(tabId) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
}

// ======= BOLINHAS MORRENDO/ENLOUQUECENDO =======
function toggleBolinha(type, index) {
  const bolinhas = document.querySelectorAll(`.${type}-bolinha`);
  for (let i = 0; i <= index; i++) {
    bolinhas[i].classList.add('active');
  }
  for (let i = index + 1; i < bolinhas.length; i++) {
    bolinhas[i].classList.remove('active');
  }
}

// ======= ESTADO DO USUÁRIO =======
onAuthStateChanged(auth, user => {
  if (user) showFichaList();
});

// ======= LISTENERS =======
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('btn-login').addEventListener('click', login);
  document.getElementById('btn-signup').addEventListener('click', signup);
  document.getElementById('btn-salvar').addEventListener('click', salvarFicha);
  document.getElementById('voltarSelecaoBtn').addEventListener('click', voltarParaSelecao);

  // Atualiza atributos ao digitar na linha de baixo
  ['cor-val','men-val','ins-val','pre-val','con-val','cor-input','men-input','ins-input','pre-input','con-input'].forEach(id => {
    const input = document.getElementById(id);
    if(input){
      input.addEventListener('input', updateCalculos);
    }
  });
  
  // Listeners para modificadores
  ['pv-mod','san-mod','pe-mod','def-equip','def-bonus'].forEach(id => {
    const input = document.getElementById(id);
    if(input){
      input.addEventListener('input', updateCalculos);
    }
  });
  
  // Listeners para atualizar barras quando atual muda
  ['pv-atual','san-atual','pe-atual'].forEach(id => {
    const input = document.getElementById(id);
    if(input){
      input.addEventListener('input', () => updateBarraVisual(id.split('-')[0]));
    }
  });
  
  // Adiciona listeners para equilíbrio e exposição
  document.getElementById('equilibrio').addEventListener('input', updateEquilibrio);
  document.getElementById('exposicao').addEventListener('input', updateExposicao);
  
  // Listeners para bolinhas
  document.querySelectorAll('.morrendo-bolinha').forEach((bolinha, index) => {
    bolinha.addEventListener('click', () => toggleBolinha('morrendo', index));
  });
  document.querySelectorAll('.enlouquecendo-bolinha').forEach((bolinha, index) => {
    bolinha.addEventListener('click', () => toggleBolinha('enlouquecendo', index));
  });
  
  // Inicializa barras
  updateEquilibrio();
  updateExposicao();
});
