import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// === Firebase config ===
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

// === Login / Signup ===
function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => { alert("Conta criada com sucesso!"); showFicha(); })
    .catch(e => alert("Erro ao cadastrar: " + e.message));
}

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => { alert("Login bem-sucedido!"); showFicha(); })
    .catch(e => alert("Erro ao fazer login: " + e.message));
}

// === Mostrar ficha ===
function showFicha() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('ficha').style.display = 'block';
}

// === Exposição / Níveis ===
const exposicaoNiveis = [
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

// === Atualiza cálculos principais ===
function updateCalculos() {
  const cor = parseInt(document.getElementById('cor-val').value)||0;
  const men = parseInt(document.getElementById('men-val').value)||0;
  const ins = parseInt(document.getElementById('ins-val').value)||0;
  const con = parseInt(document.getElementById('con-val').value)||0;
  const exposicao = parseInt(document.getElementById('exposicao').value)||0;

  const nivel = exposicaoNiveis[exposicao] || exposicaoNiveis[0];

  // PV / SAN / PE / DEF
  document.getElementById('pv-max').value = nivel.pv + 2*cor;
  document.getElementById('san-max').value = nivel.san + 2*men;
  document.getElementById('pe-max').value = nivel.pe + 2*con;

  // Defesa
  const equip = parseInt(document.getElementById('def-equip').value)||0;
  const bonus = parseInt(document.getElementById('def-bonus').value)||0;
  document.getElementById('defesa-val').innerText = (nivel.def + ins + equip + bonus);

  // Atualiza barras
  updateBarras();
}

// === Atualiza barras coloridas ===
function updateBarra(tipo) {
  const atual = parseInt(document.getElementById(`${tipo}-atual`).value)||0;
  const max = parseInt(document.getElementById(`${tipo}-max`).value)||1;
  const barra = document.getElementById(`barra-${tipo}`);
  barra.style.background = barra.classList.contains('vermelha') ? 'linear-gradient(90deg,#440000,#ff4040)' :
                           barra.classList.contains('roxa') ? 'linear-gradient(90deg,#4a0072,#b84dff)' :
                           'linear-gradient(90deg,#055,#1f8)';

  barra.innerHTML = `<span class="barra-num">${atual}/${max}</span>`;
  barra.style.width = '100%';
  barra.querySelector('.barra-num').style.left = `${Math.min((atual/max)*100,100)}%`;
}

function updateBarras() {
  ['pv','san','pe'].forEach(t => updateBarra(t));
}

// === Equilíbrio e Exposição ===
function updateEquilibrio() {
  const val = parseInt(document.getElementById('equilibrio').value)||0;
  const barra = document.getElementById('barra-equilibrio');
  const percent = ((val+10)/20)*100;
  barra.style.background = `linear-gradient(to right,#550000 0%, #555 ${percent}%, #f0e68c 100%)`;
}

function updateExposicao() {
  updateCalculos();
  const val = parseInt(document.getElementById('exposicao').value)||0;
  const barra = document.getElementById('barra-exposicao');
  const percent = (val/10)*100;
  barra.style.background = `repeating-linear-gradient(to right, #111 0% ${percent}%, #333 ${percent}% ${percent+10}%, #6f00ff ${percent+10}% ${percent+20}%)`;
}

// === Salvar ficha no Firestore ===
function salvarFicha() {
  const user = auth.currentUser;
  if(!user) return alert("Usuário não logado!");

  const data = {
    nome: document.getElementById('nome').value,
    idade: document.getElementById('idade').value,
    origem: document.getElementById('origem').value,
    ocupacao: document.getElementById('ocupacao').value,
    marca: document.getElementById('marca').value,
    motivacao: document.getElementById('motivacao').value,
    atributos: {
      COR: document.getElementById('cor-val').value,
      MEN: document.getElementById('men-val').value,
      INS: document.getElementById('ins-val').value,
      PRE: document.getElementById('pre-val').value,
      CON: document.getElementById('con-val').value,
    },
    pv: document.getElementById('pv-atual').value,
    san: document.getElementById('san-atual').value,
    pe: document.getElementById('pe-atual').value,
    defesa_equip: document.getElementById('def-equip').value,
    defesa_bonus: document.getElementById('def-bonus').value,
    equilibrio: document.getElementById('equilibrio').value,
    exposicao: document.getElementById('exposicao').value,
  };

  setDoc(doc(db,'fichas',user.uid), data)
    .then(()=> alert("Ficha salva com sucesso!"))
    .catch(e=> alert("Erro ao salvar ficha: " + e.message));
}

// === Firebase onAuth ===
onAuthStateChanged(auth, user => {
  if(user) {
    const fichaRef = doc(db,'fichas',user.uid);
    getDoc(fichaRef).then(docSnap => {
      if(docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('nome').value = data.nome || '';
        document.getElementById('idade').value = data.idade || '';
        document.getElementById('origem').value = data.origem || '';
        document.getElementById('ocupacao').value = data.ocupacao || '';
        document.getElementById('marca').value = data.marca || '';
        document.getElementById('motivacao').value = data.motivacao || '';
        if(data.atributos) {
          document.getElementById('cor-val').value = data.atributos.COR || 0;
          document.getElementById('men-val').value = data.atributos.MEN || 0;
          document.getElementById('ins-val').value = data.atributos.INS || 0;
          document.getElementById('pre-val').value = data.atributos.PRE || 0;
          document.getElementById('con-val').value = data.atributos.CON || 0;
        }
      }
      showFicha();
      updateCalculos();
      updateEquilibrio();
      updateExposicao();
    });
  }
});

// === Eventos ===
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('btn-login').addEventListener('click', login);
  document.getElementById('btn-signup').addEventListener('click', signup);
  document.getElementById('btn-salvar').addEventListener('click', salvarFicha);

  ['cor-val','men-val','ins-val','pre-val','con-val'].forEach(id =>
    document.getElementById(id).addEventListener('input', updateCalculos)
  );

  ['pv-atual','san-atual','pe-atual','def-equip','def-bonus'].forEach(id =>
    document.getElementById(id).addEventListener('input', updateCalculos)
  );

  document.getElementById('equilibrio').addEventListener('input', updateEquilibrio);
  document.getElementById('exposicao').addEventListener('input', updateExposicao);
});
