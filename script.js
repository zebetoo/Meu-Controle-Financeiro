const form = document.getElementById("form");
const lista = document.getElementById("lista");
const filtroMes = document.getElementById("filtroMes");

let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
let editIndex = null;

const hoje = new Date();
filtroMes.value = hoje.toISOString().slice(0, 7);

function salvar() {
  localStorage.setItem("gastos", JSON.stringify(gastos));
}

// 💰 CONVERTE VÍRGULA PRA NÚMERO
function tratarValor(valor) {
  return parseFloat(valor.replace(",", "."));
}

function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function atualizarTotal(listaFiltrada) {
  const total = listaFiltrada.reduce((acc, g) => acc + g.valor, 0);
  document.getElementById("total").innerText = `R$ ${total.toFixed(2)}`;
}

function renderizar() {
  lista.innerHTML = "";

  let filtrados = gastos.filter(g => g.competencia === filtroMes.value);

  filtrados.forEach((gasto, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${gasto.categoria}</strong>
      <div>R$ ${gasto.valor.toFixed(2)}</div>
      <div>Pagamento: ${formatarData(gasto.dataPagamento)}</div>
      <div>Competência: ${gasto.competencia}</div>
      <div>${gasto.comentario || ""}</div>

      <div class="actions">
        <button class="btn-small" onclick="editar(${index})">Editar</button>
        <button class="btn-small btn-delete" onclick="confirmarExclusao(${index})">X</button>
      </div>
    `;

    lista.appendChild(li);
  });

  atualizarTotal(filtrados);
  gerarGrafico(filtrados);
  gerarDashboard();
}

function confirmarExclusao(index) {
  if (confirm("Deseja excluir?")) {
    gastos.splice(index, 1);
    salvar();
    renderizar();
  }
}

function editar(index) {
  const g = gastos[index];

  categoria.value = g.categoria;
  valor.value = g.valor;
  dataPagamento.value = g.dataPagamento;
  competencia.value = g.competencia;
  comentario.value = g.comentario;

  editIndex = index;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const novo = {
    categoria: categoria.value,
    valor: tratarValor(valor.value),
    dataPagamento: dataPagamento.value,
    competencia: competencia.value,
    comentario: comentario.value
  };

  if (editIndex !== null) {
    gastos[editIndex] = novo;
    editIndex = null;
  } else {
    gastos.push(novo);
  }

  salvar();
  renderizar();
  form.reset();
});

filtroMes.addEventListener("change", renderizar);

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

// 📋 DASHBOARD POR COMPETÊNCIA
function gerarDashboard() {
  const dashboard = document.getElementById("dashboard");
  dashboard.innerHTML = "";

  const agrupado = {};

  gastos.forEach(g => {
    if (!agrupado[g.competencia]) agrupado[g.competencia] = [];
    agrupado[g.competencia].push(g);
  });

  Object.keys(agrupado).sort().reverse().forEach(mes => {
    const bloco = document.createElement("div");
    bloco.className = "mes-bloco";

    const total = agrupado[mes].reduce((acc, g) => acc + g.valor, 0);

    bloco.innerHTML = `
      <h4>${mes} - R$ ${total.toFixed(2)}</h4>
      ${agrupado[mes].map(g => `
        <div>
          ${formatarData(g.dataPagamento)} - 
          ${g.categoria} - 
          R$ ${g.valor.toFixed(2)}
        </div>
      `).join("")}
    `;

    dashboard.appendChild(bloco);
  });
}

renderizar();