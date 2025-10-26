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

/* ===== CARREGAR FICHA ===== */
onAuthStateChanged(auth, async user => {
  if (user) {
    const fichaRef = doc(db, 'fichas', user.uid);
    const docSnap = await getDoc(fichaRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      for (let key in data) {
        const el = document.getElementById(key);
        if (el) el.value = data[key];
      }
      updateCalculos();
      updateBarras();
      updateLinhas();
    }
    showFicha();
  }
});

/* ===== CALCULOS ===== */
function updateCalculos() {
  const cor = Math.min(+document.getElementById('cor-val').value || 0, 6);
  const men = Math.min(+document.getElementById('men-val').value || 0, 6);
  const ins = Math.min(+document.getElementById('ins-val').value || 0, 6);
  const pre = Math.min(+document.getElementById('pre-val').value || 0, 6);
  const con = Math.min(+document.getElementById('con-val').value || 0, 6);
  const exp = +document.getElementById('exposicao').value || 0;

  const mults = [15,20,25,30,35,40,45,50,55,60];
  const mult = mults[exp] || 15;

  document.getElementById('pv-max').value = mult + 2*cor;
  document.getElementById('san-max').value = mult + 2*men;
  document.getElementById('pe-max').value = (5 + 10*exp) + 2*con;

  updateDefesa();
  updateBarras();
}

function updateDefesa() {
  const ins = +document.getElementById('ins-val').value || 0;
  const equip = +document.getElementById('def-equip').value || 0;
  const bonus = +document.getElementById('def-bonus').value || 0;
  document.getElementById('defesa-val').innerText = 10 + ins + equip + bonus;
}

/* ===== BARRAS ===== */
function updateBarra(id) {
  const atualInput = document.getElementById(`${id}-atual`);
  const maxInput = document.getElementById(`${id}-max`);
  let atual = Math.min(+atualInput.value || 0, +maxInput.value);
  atualInput.value = atual;

  const barra = document.getElementById(`barra-${id}`);
  const perc = (atual / +maxInput.value) * 100;
  barra.style.background = id==='pv' ? `linear-gradient(90deg, #800000 ${perc}%, #333 ${perc}%)`
                  : id==='san' ? `linear-gradient(90deg, #4a0072 ${perc}%, #333 ${perc}%)`
                  : `linear-gradient(90deg, #0d5 ${perc}%, #333 ${perc}%)`;

  barra.querySelector('span')?.remove();
  const span = document.createElement('span');
  span.innerText = `${atual}/${maxInput.value}`;
  barra.appendChild(span);
}

function updateBarras() {
  updateBarra('pv');
  updateBarra('san');
  updateBarra('pe');
}

/* ===== LINHAS CARTESIANAS ===== */
function updateLinhas() {
  const eq = +document.getElementById('equilibrio').value;
  const exp = +document.getElementById('exposicao').value;

  const barraEq = document.getElementById('barra-equilibrio');
  barraEq.style.background = `linear-gradient(to right, #b30000 0%, #b30000 ${50+eq*5}%, #444 ${50+eq*5}%, #f0e68c 100%)`;

  const barraExp = document.getElementById('barra-exposicao');
  barraExp.style.background = `repeating-linear-gradient(45deg, #111 0%, #333 10%, #6f00ff 10%, #6f00ff ${(exp+1)*10}%)`;
}

/* ===== INPUTS DE PERÍCIAS ===== */
document.querySelectorAll('.pericias input').forEach(inp=>{
  inp.setAttribute('type','number');
  inp.setAttribute('min','0');
});

/* ===== EXIBIR ABAS ===== */
function showTab(id) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ===== SALVAR FICHA ===== */
async function salvarFicha() {
  const user = auth.currentUser;
  if (!user) return alert('Nenhum usuário logado!');

  const data = {};
  document.querySelectorAll('#ficha input').forEach(inp=>{
    if(inp.id) data[inp.id] = inp.value;
  });

  try {
    await setDoc(doc(db, 'fichas', user.uid), data);
    alert('Ficha salva com sucesso!');
  } catch(err) {
    console.error(err);
    alert('Erro ao salvar ficha: '+err.message);
  }
}

/* ===== EVENTOS ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('btn-login').addEventListener('click', login);
  document.getElementById('btn-signup').addEventListener('click', signup);
  document.getElementById('btn-salvar').addEventListener('click', salvarFicha);

  document.querySelectorAll('input[id$="-atual"]').forEach(inp=>{
    inp.addEventListener('input', ()=>updateBarras());
  });

  document.getElementById('equilibrio').addEventListener('input', updateLinhas);
  document.getElementById('exposicao').addEventListener('input', ()=>{updateCalculos(); updateLinhas();});
  document.querySelectorAll('.atributo-input').forEach(inp=>{
    inp.addEventListener('input', ()=>{
      if(+inp.value>6) inp.value=6;
      updateCalculos();
      updateBarras();
    });
  });
});
