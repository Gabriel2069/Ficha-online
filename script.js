// === Alternar abas ===
function showTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.style.display='none');
    const t = document.getElementById(tabId);
    if(t) t.style.display='block';
}

// === Limitar atributos e barras ===
function limitarAtributo(inputId) {
    const el = document.getElementById(inputId);
    if(!el) return;
    let val = parseInt(el.value) || 0;
    if(val > 6) val = 6;
    if(val < 0) val = 0;
    el.value = val;
}

function limitarBarra(atualId, maxId) {
    const atual = document.getElementById(atualId);
    const max = parseInt(document.getElementById(maxId).value)||1;
    let val = parseInt(atual.value)||0;
    if(val > max) val = max;
    if(val < 0) val = 0;
    atual.value = val;
}

// === Atualizar cores das barras PV, SAN, PE ===
function updateBarra(tipo){
    const atual = parseInt(document.getElementById(`${tipo}-atual`).value)||0;
    const max = parseInt(document.getElementById(`${tipo}-max`).value)||1;
    limitarBarra(`${tipo}-atual`, `${tipo}-max`);
    const percent = Math.min((atual/max)*100,100);

    const barra = document.getElementById(`barra-${tipo}`);
    let cor = '#888'; // default acinzentado
    if(tipo==='pv') cor = `linear-gradient(90deg,#800000 ${percent}%,#ff4040 100%)`;
    if(tipo==='san') cor = `linear-gradient(90deg,#4a0072 ${percent}%,#b84dff 100%)`;
    if(tipo==='pe') cor = `linear-gradient(90deg,#055 ${percent}%,#1f8 100%)`;

    barra.style.background = cor;
    barra.innerHTML = `<span class="barra-num" style="position:absolute;left:${percent}%;transform:translateX(-50%);color:#fff;font-weight:bold;">${atual}/${max}</span>`;
}

// === Equilíbrio e Exposição com passador e número ===
function updateEquilibrio() {
    const val = parseInt(document.getElementById('equilibrio').value)||0;
    const barra = document.getElementById('barra-equilibrio');
    const percent = ((val+10)/20)*100;
    barra.innerHTML = `<div class="passador" style="position:absolute;left:${percent}%;top:-5px;width:15px;height:15px;background:#fff;border-radius:50%;transform:translateX(-50%);"></div>
                       <span style="position:absolute;left:${percent}%;top:20px;transform:translateX(-50%);color:#fff;font-size:12px;">${val}</span>`;
}

function updateExposicao() {
    updateCalculos();
    const val = parseInt(document.getElementById('exposicao').value)||0;
    const barra = document.getElementById('barra-exposicao');
    const percent = (val/10)*100;
    barra.innerHTML = `<div class="passador" style="position:absolute;left:${percent}%;top:-5px;width:15px;height:15px;background:#fff;border-radius:50%;transform:translateX(-50%);"></div>
                       <span style="position:absolute;left:${percent}%;top:20px;transform:translateX(-50%);color:#fff;font-size:12px;">${val}</span>`;
}

// === Atualizar todos cálculos ===
function updateCalculos() {
    ['cor-val','men-val','ins-val','pre-val','con-val'].forEach(id=>limitarAtributo(id));

    const cor = parseInt(document.getElementById('cor-val').value)||0;
    const men = parseInt(document.getElementById('men-val').value)||0;
    const ins = parseInt(document.getElementById('ins-val').value)||0;
    const con = parseInt(document.getElementById('con-val').value)||0;
    const exposicao = parseInt(document.getElementById('exposicao').value)||0;

    const nivel = exposicaoNiveis[exposicao] || exposicaoNiveis[0];

    document.getElementById('pv-max').value = nivel.pv + 2*cor;
    document.getElementById('san-max').value = nivel.san + 2*men;
    document.getElementById('pe-max').value = nivel.pe + 2*con;

    const equip = parseInt(document.getElementById('def-equip').value)||0;
    const bonus = parseInt(document.getElementById('def-bonus').value)||0;
    document.getElementById('defesa-val').innerText = nivel.def + ins + equip + bonus;

    ['pv','san','pe'].forEach(t=>updateBarra(t));
    updateEquilibrio();
    updateExposicao();
}

// === Salvar ficha incluindo Equilíbrio e Exposição ===
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
            if(docSnap.exists()){
                const data = docSnap.data();
                document.getElementById('nome').value = data.nome || '';
                document.getElementById('idade').value = data.idade || '';
                document.getElementById('origem').value = data.origem || '';
                document.getElementById('ocupacao').value = data.ocupacao || '';
                document.getElementById('marca').value = data.marca || '';
                document.getElementById('motivacao').value = data.motivacao || '';
                if(data.atributos){
                    document.getElementById('cor-val').value = data.atributos.COR||0;
                    document.getElementById('men-val').value = data.atributos.MEN||0;
                    document.getElementById('ins-val').value = data.atributos.INS||0;
                    document.getElementById('pre-val').value = data.atributos.PRE||0;
                    document.getElementById('con-val').value = data.atributos.CON||0;
                }
                document.getElementById('pv-atual').value = data.pv||0;
                document.getElementById('san-atual').value = data.san||0;
                document.getElementById('pe-atual').value = data.pe||0;
                document.getElementById('def-equip').value = data.defesa_equip||0;
                document.getElementById('def-bonus').value = data.defesa_bonus||0;
                document.getElementById('equilibrio').value = data.equilibrio||0;
                document.getElementById('exposicao').value = data.exposicao||0;
            }
            showFicha();
            updateCalculos();
        });
    }
});

// === Eventos ===
document.addEventListener("DOMContentLoaded",()=>{
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
