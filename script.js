import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3Qssht7axuM8aE4gQL965EBZJo-qzmsU",
  authDomain: "fichas-e87fd.firebaseapp.com",
  projectId: "fichas-e87fd",
  storageBucket: "fichas-e87fd.firebasestorage.app",
  messagingSenderId: "496979447757",
  appId: "1:496979447757:web:dc54dfdc358c558bc53e84",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Login/Signup
function signup() {
  createUserWithEmailAndPassword(auth, email.value, password.value);
}

function login() {
  signInWithEmailAndPassword(auth, email.value, password.value).then(() => showFicha());
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
        db.collection('fichas').doc(user.uid).set(data);
    }
}

function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
}

function showFicha() { document.getElementById('auth').style.display = 'none'; document.getElementById('ficha').style.display = 'block'; }
