import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 COLE SUA CONFIG AQUI (substitua tudo abaixo)
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

// ELEMENTOS
const form = document.getElementById("form");
const lista = document.getElementById("lista");
const filtroMes = document.getElementById("filtroMes");

let gastos = [];
let editId = null;

// MÊS ATUAL
const hoje = new Date();
filtroMes.value = hoje.toISOString().slice(0, 7);

// FUNÇÕES
function tratarValor(valor) {
  return parseFloat(valor.replace(",", "."));
}

function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

// 🔄 CARREGAR DADOS
async function carregar() {
  const snapshot = await getDocs(collection(db, "gastos"));

  gastos = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  renderizar();
}

// ➕ SALVAR
async function salvarFirebase(gasto) {
  if (editId) {
    await updateDoc(doc(db, "gastos", editId), gasto);
    editId = null;
  } else {
    await addDoc(collection(db, "gastos"), gasto);
  }
}

// ❌ EXCLUIR
async function excluir(id) {
  if (confirm("Deseja excluir?")) {
    await deleteDoc(doc(db, "gastos", id));
    carregar();
  }
}

// ✏️ EDITAR
function editar(id) {
  const g = gastos.find(g => g.id === id);

  categoria.value = g.categoria;
  valor.value = g.valor;
  dataPagamento.value = g.dataPagamento;
  competencia.value = g.competencia;
  comentario.value = g.comentario;

  editId = id;
}

// 🎯 RENDER
function renderizar() {
  lista.innerHTML = "";

  let filtrados = gastos.filter(g => g.competencia === filtroMes.value);

  filtrados.forEach(g => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${g.categoria}</strong>
      <div>R$ ${g.valor.toFixed(2)}</div>
      <div>Pagamento: ${formatarData(g.dataPagamento)}</div>
      <div>${g.comentario || ""}</div>

      <div class="actions">
        <button onclick="editar('${g.id}')">Editar</button>
        <button onclick="excluir('${g.id}')">X</button>
      </div>
    `;

    lista.appendChild(li);
  });

  atualizarTotal(filtrados);
  gerarGrafico(filtrados);
}

// 💰 TOTAL
function atualizarTotal(listaFiltrada) {
  const total = listaFiltrada.reduce((acc, g) => acc + g.valor, 0);
  document.getElementById("total").innerText = `R$ ${total.toFixed(2)}`;
}

// 📊 GRÁFICO
let chart;

function gerarGrafico(lista) {
  const categorias = {};

  lista.forEach(g => {
    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.valor;
  });

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("grafico"), {
    type: "doughnut",
    data: {
      labels: Object.keys(categorias),
      datasets: [{ data: Object.values(categorias) }]
    }
  });
}

// SUBMIT
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const gasto = {
    categoria: categoria.value,
    valor: tratarValor(valor.value),
    dataPagamento: dataPagamento.value,
    competencia: competencia.value,
    comentario: comentario.value
  };

  await salvarFirebase(gasto);

  form.reset();
  carregar();
});

filtroMes.addEventListener("change", renderizar);

// INICIAR
carregar();