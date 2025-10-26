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

// ==== Carregar ficha ====
onAuthStateChanged(auth, async user => {
  if (user) {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('ficha').style.display = 'block';
    const fichaRef = doc(db, 'fichas', user.uid);
    const docSnap = await getDoc(fichaRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      for (let key in data) {
        const el = document.getElementById(key);
        if (el) el.value = data[key];
        if (key.startsWith("pericia-")) {
          const p = document.querySelector(`[data-pericia="${key}"]`);
          if (p) p.value = data[key];
        }
      }
      updateAll();
    }
  }
});

// ==== Funções de cálculo ====
function updateAll() {
  updateAtributos();
  updateBarras();
  updateEquilibrioVisual();
  updateExposicaoVisual();
}

function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

function updateAtributos() {
  const cor = clamp(+document.getElementById('cor').value || 0, 0, 6);
  const men = clamp(+document.getElementById('men').value || 0, 0, 6);
  const ins = clamp(+document.getElementById('ins').value || 0, 0, 6);
  const pre = clamp(+document.getElementById('pre').value || 0, 0, 6);
  const con = clamp(+document.getElementById('con').value || 0, 0, 6);

  document.getElementById('cor').value = cor;
  document.getElementById('men').value = men;
  document.getElementById('ins').value = ins;
  document.getElementById('pre').value = pre;
  document.getElementById('con').value = con;

  const exp = +document.getElementById('exposicao').value || 0;
  const mults = [15,20,25,30,35,40,45,50,55,60,60];
  document.getElementById('pv-max').value = mults[exp] + 2*cor;
  document.getElementById('san-max').value = mults[exp] + 2*men;
  document.getElementById('pe-max').value = (5 + 10*exp) + 2*con;
  document.getElementById('defesa-val').innerText = 10 + ins + (+document.getElementById('def-equip').value || 0) + (+document.getElementById('def-bonus').value || 0);

  updateBarras();
}

function updateBarras() {
  ["pv","san","pe"].forEach(tipo => {
    const atualEl = document.getElementById(`${tipo}-atual`);
    const maxEl = document.getElementById(`${tipo}-max`);
    atualEl.value = clamp(+atualEl.value || 0, 0, +maxEl.value);
    const percent = (+atualEl.value / +maxEl.value) * 100;
    const barra = document.getElementById(`barra-${tipo}`);
    barra.style.width = percent + "%";

    // cor mais clara quando vazio, mais intensa quando cheio
    if (tipo=="pv") barra.style.background = `linear-gradient(90deg, #800000 ${percent}%, #555 ${percent}%)`;
    if (tipo=="san") barra.style.background = `linear-gradient(90deg, #4a0072 ${percent}%, #555 ${percent}%)`;
    if (tipo=="pe") barra.style.background = `linear-gradient(90deg, #0d5 ${percent}%, #555 ${percent}%)`;
  });
}

// ==== Equilíbrio / Exposição ====
function updateEquilibrioVisual() {
  const val = +document.getElementById('equilibrio').value;
  const barra = document.getElementById('barra-equilibrio');
  const perc = ((val+10)/20)*100; // -10 a 10 -> 0 a 100%
  barra.style.background = `linear-gradient(to right, #b30000 0%, #b30000 ${perc}%, #444 ${perc}%, #f0e68c 100%)`;
}

function updateExposicaoVisual() {
  const val = +document.getElementById('exposicao').value;
  const barra = document.getElementById('barra-exposicao');
  const perc = (val/10)*100;
  barra.style.background = `repeating-linear-gradient(45deg, #111 0%, #333 10%, #6f00ff 10%, #6f00ff ${perc}%)`;
}

// ==== Salvar ficha ====
async function salvarFicha() {
  const user = auth.currentUser;
  if (!user) return alert("Faça login primeiro!");
  const data = {};

  // atributos
  ["nome","idade","origem","ocupacao","marca","motivacao","cor","men","ins","pre","con","pv-atual","pv-max","san-atual","san-max","pe-atual","pe-max","def-equip","def-bonus","equilibrio","exposicao"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) data[id] = el.value;
  });

  // perícias
  document.querySelectorAll(".pericia-input").forEach(input=>{
    data[input.dataset.pericia] = input.value;
  });

  try {
    await setDoc(doc(db,'fichas',user.uid), data);
    alert("Ficha salva!");
  } catch(e) {
    alert("Erro ao salvar: "+e.message);
  }
}

// ==== Listeners ====
document.addEventListener("DOMContentLoaded", () => {
  ["pv-atual","san-atual","pe-atual","cor","men","ins","pre","con","def-equip","def-bonus","equilibrio","exposicao"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener("input", updateAll);
  });

  document.getElementById('btn-login').addEventListener('click', login);
  document.getElementById('btn-signup').addEventListener('click', signup);
  document.getElementById('btn-salvar').addEventListener('click', salvarFicha);
});
