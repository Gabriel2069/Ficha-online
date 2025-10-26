import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

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

// === LOGIN / SIGNUP ===
function signup() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(() => {
      alert("Conta criada com sucesso!");
      showFicha();
    })
    .catch(error => {
      alert("Erro ao cadastrar: " + error.message);
    });
}

function login() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(() => {
      alert("Login bem-sucedido!");
      showFicha();
    })
    .catch(error => {
      alert("Erro ao fazer login: " + error.message);
    });
}

// === CARREGAR FICHA ===
onAuthStateChanged(auth, user => {
  if (user) {
    const fichaRef = doc(db, 'fichas', user.uid);
    getDoc(fichaRef).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('nome').value = data.nome || '';
        updateCalculos();
      }
    });
    showFicha();
  }
});

// === FUNÇÕES DE CÁLCULO ===
function updateCalculos() {
  const cor = +document.getElementById('cor-val').value || 0;
  const men = +document.getElementById('men-val').value || 0;
  const ins = +document.getElementById('ins-val').value || 0;
  const con = +document.getElementById('con-val').value || 0;
  const exp = +document.getElementById('exposicao').value || 0;

  const mult = [15,20,25,30,35,40,45,50,55,60][exp] || 15;

  document.getElementById('pv-max').value = mult + 2*cor;
  document.getElementById('san-max').value = mult + 2*men;
  document.getElementById('pe-max').value = (5 + 10*exp) + 2*con;

  updateDefesa();
  updateBarras();
  updateEquilibrioBar();
  updateExposicaoBar();
}

// === DEFESA ===
function updateDefesa() {
  const ins = +document.getElementById('ins-val').value || 0;
  const equip = +document.getElementById('def-equip').value || 0;
  const bonus = +document.getElementById('def-bonus').value || 0;
  document.getElementById('defesa-val').innerText = 10 + ins + equip + bonus;
}

// === BARRAS DE PV / PE / SAN ===
function updateBarra(tipo) {
  const atual = +document.getElementById(`${tipo}-atual`).value || 0;
  const max = +document.getElementById(`${tipo}-max`).value || 1;
  const percent = Math.min((atual / max) * 100, 100);
  document.getElementById(`barra-${tipo}`).style.width = `${percent}%`;
}

// === BARRA EQUILÍBRIO ===
function updateEquilibrioBar() {
  const val = +document.getElementById('equilibrio').value;
  const barra = document.getElementById('barra-equilibrio');
  const percent = ((val + 10) / 20) * 100; // -10 a +10 → 0% a 100%
  barra.style.width = percent + '%';
}

// === BARRA EXPOSIÇÃO ===
function updateExposicaoBar() {
  const val = +document.getElementById('exposicao').value;
  const barra = document.getElementById('barra-exposicao');
  const percent = (val / 10) * 100; // 0 a 10
  barra.style.width = percent + '%';
}

// === SALVAR FICHA ===
function salvarFicha() {
  const user = auth.currentUser;
  if (user) {
    const data = {
      nome: document.getElementById('nome').value,
      idade: document.getElementById('idade').value,
      origem: document.getElementById('origem').value,
      ocupacao: document.getElementById('ocupacao').value,
      marca: document.getElementById('marca').value,
      motivacao: document.getElementById('motivacao').value,
      atributos: {
        cor: document.getElementById('cor-val').value,
        men: document.getElementById('men-val').value,
        ins: document.getElementById('ins-val').value,
        pre: document.getElementById('pre-val').value,
        con: document.getElementById('con-val').value
      },
      barras: {
        pv: document.getElementById('pv-atual').value,
        san: document.getElementById('san-atual').value,
        pe: document.getElementById('pe-atual').value,
        defesa: document.getElementById('defesa-val').innerText,
        equilibrio: document.getElementById('equilibrio').value,
        exposicao: document.getElementById('exposicao').value
      }
    };
    setDoc(doc(db, 'fichas', user.uid), data)
      .then(() => alert("Ficha salva com sucesso!"))
      .catch(error => alert("Erro ao salvar ficha: " + error.message));
  }
}

// === MOSTRAR FICHA ===
function showFicha() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('ficha').style.display = 'block';
}

// === INICIALIZAÇÃO DOS BOTÕES ===
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('btn-login').addEventListener('click', login);
  document.getElementById('btn-signup').addEventListener('click', signup);
  document.getElementById('btn-salvar').addEventListener('click', salvarFicha);

  // Atualizar barras iniciais
  updateCalculos();
});
