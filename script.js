const form = document.getElementById("form");
const lista = document.getElementById("lista");

let gastos = JSON.parse(localStorage.getItem("gastos")) || [];

function salvar() {
  localStorage.setItem("gastos", JSON.stringify(gastos));
}

function renderizar() {
  lista.innerHTML = "";

  gastos.forEach((gasto, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span>
        ${gasto.conta} - R$ ${gasto.valor} - ${gasto.data}
      </span>
      <button onclick="remover(${index})">❌</button>
    `;

    lista.appendChild(li);
  });
}

function remover(index) {
  gastos.splice(index, 1);
  salvar();
  renderizar();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const conta = document.getElementById("conta").value;
  const valor = document.getElementById("valor").value;
  const data = document.getElementById("data").value;

  gastos.push({ conta, valor, data });

  salvar();
  renderizar();

  form.reset();
});

renderizar();