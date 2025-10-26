// Config Firebase (substitua pelas suas chaves)
const firebaseConfig = {  apiKey: "AIzaSyD3Qssht7axuM8aE4gQL965EBZJo-qzmsU",
    authDomain: "fichas-e87fd.firebaseapp.com",
    projectId: "fichas-e87fd",
    storageBucket: "fichas-e87fd.firebasestorage.app",
    messagingSenderId: "496979447757",
    appId: "1:496979447757:web:dc54dfdc358c558bc53e84",
    measurementId: "G-VM3BG54LNE" };
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Login/Signup
function login() { auth.signInWithEmailAndPassword(document.getElementById('email').value, document.getElementById('password').value).then(() => showFicha()); }
function signup() { auth.createUserWithEmailAndPassword(document.getElementById('email').value, document.getElementById('password').value); }

// Carregar ficha
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('fichas').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                // Preencher campos com data
                document.getElementById('nome').value = data.nome || '';
                // ... preencher outros
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
