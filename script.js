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

// Login/Signup
function signup() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

console.log("Tentando cadastrar:", emailInput.value);
  
  createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(() => {
      alert("Conta criada com sucesso!");
      showFicha(); // mostra a ficha após cadastro
    })
    .catch(error => {
      console.error("Erro ao cadastrar:", error.message);
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
      console.error("Erro ao fazer login:", error.message);
      alert("Erro ao fazer login: " + error.message);
    });
}
// Carregar ficha
onAuthStateChanged(auth, user => {
  if (user) {
    const fichaRef = doc(db, 'fichas', user.uid);
    getDoc(fichaRef).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        nome.value = data.nome || '';
        updateCalculos();
      }
    });
    showFicha();
  }
});

// Funções de cálculo
function updateCalculos() {
    const cor = +document.getElementById('cor-val').value || 0;
    const men = +document.getElementById('men-val').value || 0;
    const ins = +document.getElementById('ins-val').value || 0;
    const con = +document.getElementById('con-val').value || 0;
    const exp = +document.getElementById('exposicao').value || 0;
    
    // Cálculos baseados em Exposição
    const mult = [15,20,25,30,35,40,45,50,55,60][exp] || 15;
    document.getElementById('pv-max').value = mult + 2*cor;
    document.getElementById('san-max').value = mult + 2*men;
    document.getElementById('pe-max').value = (5 + 10*exp) + 2*con; // Ajustado para níveis
    updateDefesa();
    updateBarras();
}

function updateDefesa() {
    const ins = +document.getElementById('ins-val').value || 0;
    const equip = +document.getElementById('def-equip').value || 0;
    const bonus = +document.getElementById('def-bonus').value || 0;
    document.getElementById('defesa-val').innerText = 10 + ins + equip + bonus;
}

function updateBarra(tipo) {
    const atual = +document.getElementById(`${tipo}-atual`).value || 0;
    const max = +document.getElementById(`${tipo}-max`).value || 1;
    const percent = Math.min((atual / max) * 100, 100);
    document.getElementById(`barra-${tipo}`).style.width = `${percent}%`;
}

function updateEquilibrio() {
    const val = +document.getElementById('equilibrio').value;
    // Atualizar visual da barra (ex.: mover indicador)
}

function updateExposicao() {
    updateCalculos(); // Recalcula tudo
}

function salvarFicha() {
    const user = auth.currentUser;
    if (user) {
        const data = {
            nome: document.getElementById('nome').value,
            // ... coletar todos os campos
        };
      setDoc(doc(db, 'fichas', user.uid), data)
       .then(() => {
        alert("Ficha salva com sucesso!");
      })
      .catch(error => {
        console.error("Erro ao salvar ficha:", error.message);
        alert("Erro ao salvar ficha: " + error.message);
      });
  }
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
