import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// SUA CONFIG AQUI
  const firebaseConfig = {
    apiKey: "AIzaSyC2aUpnODiQKBVttHLiSOZUcKpz5Q9Qcl4",
    authDomain: "controle-financeiro-b56e4.firebaseapp.com",
    projectId: "controle-financeiro-b56e4",
    storageBucket: "controle-financeiro-b56e4.firebasestorage.app",
    messagingSenderId: "290516225699",
    appId: "1:290516225699:web:8f708c08c2f2d9ca287916",
    measurementId: "G-PS7H04Q1BR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const lista = document.getElementById("lista");
const filtroMes = document.getElementById("filtroMes");

const campoCompetencia = document.getElementById("competencia");

// inicializa
campoCompetencia.value = filtroMes.value;

// sincroniza com filtro
filtroMes.addEventListener("change", () => {
  campoCompetencia.value = filtroMes.value;
});

let gastos = [];

const hoje = new Date();
filtroMes.value = hoje.toISOString().slice(0, 7);

// CARREGAR
async function carregar() {
  const snapshot = await getDocs(collection(db, "gastos"));

  gastos = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  renderizar();
}

// FORMATOS
function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

// RENDER
function renderizar() {
  lista.innerHTML = "";

  const filtrados = gastos.filter(g => g.competencia === filtroMes.value);

  filtrados.forEach(g => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${g.categoria}</strong>
      <div>R$ ${g.valor.toFixed(2)}</div>
      <div>${formatarData(g.dataPagamento)}</div>
    `;
    lista.appendChild(li);
  });

  atualizarTotal(filtrados);
  graficoCategoria(filtrados);
  graficoMensal();
}

// TOTAL
function atualizarTotal(lista) {
  const total = lista.reduce((acc, g) => acc + g.valor, 0);
  document.getElementById("total").innerText = `R$ ${total.toFixed(2)}`;
}

// 📊 CATEGORIA
let chart1;
function graficoCategoria(lista) {
  const dados = {};

  lista.forEach(g => {
    dados[g.categoria] = (dados[g.categoria] || 0) + g.valor;
  });

  if (chart1) chart1.destroy();

  chart1 = new Chart(document.getElementById("graficoCategoria"), {
    type: "doughnut",
    data: {
      labels: Object.keys(dados),
      datasets: [{ data: Object.values(dados) }]
    }
  });
}

// 📈 EVOLUÇÃO
let chart2;
function graficoMensal() {
  const dados = {};

  gastos.forEach(g => {
    dados[g.competencia] = (dados[g.competencia] || 0) + g.valor;
  });

  const meses = Object.keys(dados).sort();

  if (chart2) chart2.destroy();

  chart2 = new Chart(document.getElementById("graficoMensal"), {
    type: "line",
    data: {
      labels: meses,
      datasets: [{ data: meses.map(m => dados[m]) }]
    }
  });
}

// 📤 EXPORTAR CSV
window.exportar = function () {
  let csv = "categoria,valor,dataPagamento,competencia,comentario\n";

  gastos.forEach(g => {
    csv += `${g.categoria},${g.valor},${g.dataPagamento},${g.competencia},${g.comentario || ""}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "backup.csv";
  a.click();
};

// 📥 IMPORTAR
window.importar = async function () {
  const file = document.getElementById("importarArquivo").files[0];
  if (!file) return alert("Selecione um arquivo");

  const text = await file.text();
  const linhas = text.split("\n").slice(1);

  for (let linha of linhas) {
    if (!linha) continue;

    const [categoria, valor, dataPagamento, competencia, comentario] = linha.split(",");

    await addDoc(collection(db, "gastos"), {
      categoria,
      valor: parseFloat(valor),
      dataPagamento,
      competencia,
      comentario
    });
  }

  alert("Importado!");
  carregar();
};

filtroMes.addEventListener("change", renderizar);

carregar();

// MODAL
window.abrirModal = function () {
  document.getElementById("modal").style.display = "block";
};

window.fecharModal = function () {
  document.getElementById("modal").style.display = "none";
};

// TOAST
function mostrarToast() {
  const toast = document.getElementById("toast");
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

// FORMATAÇÃO DE VALOR
const campoValor = document.getElementById("valor");

campoValor.addEventListener("input", () => {
  let v = campoValor.value.replace(/\D/g, "");

  v = (v / 100).toFixed(2) + "";
  v = v.replace(".", ",");

  campoValor.value = v;
});

// AO SALVAR
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const gasto = {
    categoria: categoria.value,
    valor: parseFloat(valor.value.replace(",", ".")),
    dataPagamento: dataPagamento.value,
    competencia: competencia.value,
    comentario: comentario.value
  };

  await salvarFirebase(gasto);

  form.reset();
  fecharModal();
  mostrarToast();
  carregar();
});