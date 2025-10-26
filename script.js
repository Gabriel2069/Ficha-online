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

/* ======*
