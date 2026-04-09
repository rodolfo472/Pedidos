/*
Behaviour:
- Reads sabores_gelatina and horarios_gelatina from localStorage
  - sabores_gelatina: array of strings, e.g. ["Morango","Limão","Uva"]
  - horarios_gelatina: array of objects: { id: "09:00", label: "09:00 - 09:30", limit: 5, taken: 0 }
- If missing, creates example data (so demo works).
- Shows modal form to create order with name, multiple flavors, and one horario selection.
- Enforces per-horario limit. Saves orders in pedidos_gelatina (array).
- Shows "Pedido enviado com sucesso 🍧" toast.
*/

const LS_FLAVORS = "sabores_gelatina";
const LS_TIMES = "horarios_gelatina";
const LS_ORDERS = "pedidos_gelatina";

function $(q){return document.querySelector(q)}
function $all(q){return Array.from(document.querySelectorAll(q))}

function ensureDemoData(){
  if(!localStorage.getItem(LS_FLAVORS)){
    const demo = ["Morango","Limão","Maracujá","Uva","Abacaxi","Coco"];
    localStorage.setItem(LS_FLAVORS, JSON.stringify(demo));
  }
  if(!localStorage.getItem(LS_TIMES)){
    const demoTimes = [
      {id:"09:00", label:"09:00", limit:4, taken:0},
      {id:"10:00", label:"10:00", limit:3, taken:0},
      {id:"11:00", label:"11:00", limit:5, taken:0},
      {id:"13:00", label:"13:00", limit:2, taken:0},
      {id:"15:00", label:"15:00", limit:4, taken:0}
    ];
    localStorage.setItem(LS_TIMES, JSON.stringify(demoTimes));
  }
  if(!localStorage.getItem(LS_ORDERS)){
    localStorage.setItem(LS_ORDERS, JSON.stringify([]));
  }
}

function loadFlavors(){
  const raw = localStorage.getItem(LS_FLAVORS);
  try{
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return [] }
}

function loadTimes(){
  const raw = localStorage.getItem(LS_TIMES);
  try{
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return [] }
}

function saveTimes(times){
  localStorage.setItem(LS_TIMES, JSON.stringify(times));
}

function loadOrders(){
  const raw = localStorage.getItem(LS_ORDERS);
  try{ return raw ? JSON.parse(raw) : [] }catch(e){ return [] }
}

function saveOrder(order){
  const orders = loadOrders();
  orders.unshift(order);
  localStorage.setItem(LS_ORDERS, JSON.stringify(orders));
}

function formatRecent(){
  const ul = $("#recentOrders");
  ul.innerHTML = "";
  const orders = loadOrders();
  if(orders.length === 0){
    const li = document.createElement("li");
    li.className = "item";
    li.textContent = "Nenhum pedido ainda";
    ul.appendChild(li);
    return;
  }
  orders.slice(0,6).forEach(o => {
    const li = document.createElement("li");
    li.className = "item";
    const left = document.createElement("div");
    left.innerHTML = `<strong>${escapeHtml(o.name)}</strong><div style="font-size:12px;color:var(--muted)">${o.flavors.join(", ")}</div>`;
    const right = document.createElement("div");
    right.style.textAlign = "right";
    right.innerHTML = `<div style="font-size:13px">${escapeHtml(o.time)}</div><div style="font-size:12px;color:var(--muted)">${o.status}</div>`;
    li.appendChild(left); li.appendChild(right);
    ul.appendChild(li);
  })
}

function escapeHtml(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* UI wiring */
const openBtn = $("#openOrderBtn");
const overlay = $("#overlay");
const closeBtn = $("#closeBtn");
const cancelBtn = $("#cancelBtn");
const flavorsContainer = $("#flavorsContainer");
const timesContainer = $("#timesContainer");
const noFlavors = $("#noFlavors");
const noTimes = $("#noTimes");
const orderForm = $("#orderForm");
const clientNameInput = $("#clientName");
const toast = $("#toast");
const submitBtn = $("#submitBtn");

let selectedFlavors = new Set();
let selectedTimeId = null;
let timesState = [];

function renderFlavors(){
  const flavors = loadFlavors();
  flavorsContainer.innerHTML = "";
  if(!flavors || flavors.length === 0){
    noFlavors.style.display = "block";
    return;
  }
  noFlavors.style.display = "none";
  flavors.forEach(fl => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "chip";
    el.textContent = fl;
    el.addEventListener("click", () => {
      if(selectedFlavors.has(fl)){
        selectedFlavors.delete(fl); el.classList.remove("selected");
      }else{
        selectedFlavors.add(fl); el.classList.add("selected");
      }
    });
    flavorsContainer.appendChild(el);
  })
}

function renderTimes(){
  timesContainer.innerHTML = "";
  const times = loadTimes();
  timesState = times;
  if(!times || times.length === 0){
    noTimes.style.display = "block";
    return;
  }
  noTimes.style.display = "none";
  times.forEach(t => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "time-btn";
    btn.textContent = `${t.label}`;
    const taken = t.taken || 0;
    const left = t.limit - taken;
    const badge = document.createElement("div");
    badge.className = "badge";
    badge.style.marginTop = "6px";
    badge.style.fontSize = "12px";
    badge.textContent = `${left} vagas`;
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "6px";
    wrapper.appendChild(btn);
    wrapper.appendChild(badge);

    // If full
    if(left <= 0){
      btn.disabled = true;
      badge.textContent = "LOTADO";
      badge.style.background = "linear-gradient(90deg,var(--danger), #ff8b8b)";
      badge.style.color = "white";
    }

    btn.addEventListener("click", () => {
      // unselect others
      $all(".time-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedTimeId = t.id;
    });

    timesContainer.appendChild(wrapper);
  })
}

function openModal(){
  selectedFlavors.clear();
  selectedTimeId = null;
  clientNameInput.value = "";
  renderFlavors();
  renderTimes();
  overlay.classList.remove("hidden");
  // focus first input after small delay
  setTimeout(()=>clientNameInput.focus(),80);
}

function closeModal(){
  overlay.classList.add("hidden");
}

function showToast(text, timeout = 2200){
  toast.textContent = text;
  toast.classList.remove("hidden");
  setTimeout(()=>toast.classList.add("hidden"), timeout);
}

/* submission logic with vacancy control */
orderForm.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const name = (clientNameInput.value || "").trim();
  if(!name){
    clientNameInput.focus();
    return;
  }
  if(selectedFlavors.size === 0){
    showToast("Escolha pelo menos um sabor 🍧");
    return;
  }
  if(!selectedTimeId){
    showToast("Selecione um horário");
    return;
  }

  // reload times to ensure fresh counts
  const times = loadTimes();
  const idx = times.findIndex(t => t.id === selectedTimeId);
  if(idx === -1){
    showToast("Horário inválido");
    return;
  }
  const chosen = times[idx];
  const taken = chosen.taken || 0;
  if(taken >= chosen.limit){
    showToast("Horário LOTADO — escolha outro");
    renderTimes();
    return;
  }

  // create order
  const order = {
    id: `p_${Date.now()}`,
    name,
    flavors: Array.from(selectedFlavors),
    time: chosen.label,
    status: "Pendente",
    createdAt: new Date().toISOString()
  };

  // increment taken and save
  times[idx] = {...chosen, taken: taken + 1};
  saveTimes(times);

  saveOrder(order);
  formatRecent();
  closeModal();
  showToast("Pedido enviado com sucesso 🍧");
});

openBtn.addEventListener("click", openModal);
closeBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

// close modal by clicking overlay outside sheet
overlay.addEventListener("click", (e) => {
  if(e.target === overlay) closeModal();
});

// initialize
(function init(){
  ensureDemoData();
  renderFlavors();
  renderTimes();
  formatRecent();
    
