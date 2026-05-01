let currentUser = null;
let editingPartId = null;

let users = JSON.parse(localStorage.getItem("users"));

if (!users) {
  users = [{ username:"Admin", code:"ADMIN-0001", role:"admin", active:true }];

  for (let i = 1; i <= 9999; i++) {
    let num = String(i).padStart(4, "0");
    users.push({ username:"", code:"ATLY-" + num, role:"user", active:true });
  }

  localStorage.setItem("users", JSON.stringify(users));
}

let parts = JSON.parse(localStorage.getItem("parts")) || [];
let projects = JSON.parse(localStorage.getItem("projects")) || [];
let orders = JSON.parse(localStorage.getItem("orders")) || [];
let messages = JSON.parse(localStorage.getItem("messages")) || [];

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

function saveData(){
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("parts", JSON.stringify(parts));
  localStorage.setItem("projects", JSON.stringify(projects));
  localStorage.setItem("orders", JSON.stringify(orders));
  localStorage.setItem("messages", JSON.stringify(messages));
}

function login(){
  const username = document.getElementById("loginUsername").value.trim();
  const code = document.getElementById("loginCode").value.trim().toUpperCase();

  if(!username || !code) return alert("Kullanıcı adı ve kod yaz.");

  const user = users.find(u => u.code === code);
  if(!user) return alert("Kod bulunamadı.");
  if(!user.active) return alert("Bu kod iptal edilmiş.");

  if(!user.username) user.username = username;
  if(user.username !== username) return alert("Bu kod başka kullanıcıya ait.");

  currentUser = user;
  saveData();

  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("userInfo").innerText = "👤 " + user.username + " | " + user.role;
  document.getElementById("adminMenuBtn").style.display = user.role === "admin" ? "block" : "none";

  showPage("dashboard");
}

function logout(){
  currentUser = null;
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}

function showPage(pageId){
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");
  renderAll();
}

function toggleTheme(){
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}

function savePart(){
  const name = document.getElementById("partName").value.trim();
  if(!name) return alert("Ürün adı boş olamaz.");

  const part = {
    id: editingPartId || Date.now(),
    name,
    code: document.getElementById("partCode").value.trim(),
    category: document.getElementById("partCategory").value.trim(),
    count: Number(document.getElementById("partCount").value) || 0,
    min: Number(document.getElementById("partMin").value) || 0,
    box: document.getElementById("partBox").value.trim(),
    shelf: document.getElementById("partShelf").value.trim(),
    note: document.getElementById("partNote").value.trim()
  };

  if(editingPartId){
    parts = parts.map(p => p.id === editingPartId ? part : p);
    editingPartId = null;
  }else{
    parts.push(part);
  }

  clearPartForm();
  saveData();
  renderAll();
}

function editPart(id){
  const p = parts.find(x => x.id === id);
  if(!p) return;

  editingPartId = id;
  document.getElementById("partName").value = p.name;
  document.getElementById("partCode").value = p.code;
  document.getElementById("partCategory").value = p.category;
  document.getElementById("partCount").value = p.count;
  document.getElementById("partMin").value = p.min;
  document.getElementById("partBox").value = p.box;
  document.getElementById("partShelf").value = p.shelf;
  document.getElementById("partNote").value = p.note;
}

function deletePart(id){
  if(!confirm("Bu parçayı silmek istiyor musun?")) return;
  parts = parts.filter(p => p.id !== id);
  saveData();
  renderAll();
}

function clearPartForm(){
  editingPartId = null;
  ["partName","partCode","partCategory","partCount","partMin","partBox","partShelf","partNote"]
    .forEach(id => document.getElementById(id).value = "");
}

function addProject(){
  const name = document.getElementById("projectName").value.trim();
  if(!name) return alert("Proje adı yaz.");

  projects.push({
    id: Date.now(),
    name,
    status: document.getElementById("projectStatus").value,
    parts: document.getElementById("projectParts").value.trim(),
    note: document.getElementById("projectNote").value.trim()
  });

  document.getElementById("projectName").value = "";
  document.getElementById("projectParts").value = "";
  document.getElementById("projectNote").value = "";

  saveData();
  renderAll();
}

function changeProjectStatus(id,status){
  const p = projects.find(x => x.id === id);
  if(!p) return;
  p.status = status;
  saveData();
  renderAll();
}

function deleteProject(id){
  projects = projects.filter(p => p.id !== id);
  saveData();
  renderAll();
}

function addOrder(){
  const name = document.getElementById("orderName").value.trim();
  if(!name) return alert("Ürün adı yaz.");

  orders.push({
    id: Date.now(),
    name,
    count: Number(document.getElementById("orderCount").value) || 0,
    price: Number(document.getElementById("orderPrice").value) || 0,
    link: document.getElementById("orderLink").value.trim(),
    status: document.getElementById("orderStatus").value
  });

  document.getElementById("orderName").value = "";
  document.getElementById("orderCount").value = "";
  document.getElementById("orderPrice").value = "";
  document.getElementById("orderLink").value = "";

  saveData();
  renderAll();
}

function changeOrderStatus(id,status){
  const o = orders.find(x => x.id === id);
  if(!o) return;
  o.status = status;
  saveData();
  renderAll();
}

function deleteOrder(id){
  orders = orders.filter(o => o.id !== id);
  saveData();
  renderAll();
}

function sendMessage(){
  const text = document.getElementById("messageText").value.trim();
  if(!text) return;

  messages.push({
    id: Date.now(),
    user: currentUser.username,
    text,
    date: new Date().toLocaleString("tr-TR")
  });

  document.getElementById("messageText").value = "";
  saveData();
  renderAll();
}

function deleteMessage(id){
  messages = messages.filter(m => m.id !== id);
  saveData();
  renderAll();
}

function cancelCode(code){
  const u = users.find(x => x.code === code);
  if(!u) return;
  u.active = false;
  saveData();
  renderAdmin();
}

function resetCode(code){
  const u = users.find(x => x.code === code);
  if(!u) return;
  u.username = "";
  u.active = true;
  saveData();
  renderAdmin();
}

function renderAll(){
  renderDashboard();
  renderStock();
  renderProjects();
  renderOrders();
  renderMessages();
  if(currentUser && currentUser.role === "admin") renderAdmin();
}

function renderDashboard(){
  const low = parts.filter(p => p.count < p.min);

  document.getElementById("totalProducts").innerText = parts.length;
  document.getElementById("lowStockCount").innerText = low.length;
  document.getElementById("activeProjectCount").innerText = projects.filter(p => p.status !== "Bitti").length;
  document.getElementById("pendingOrderCount").innerText = orders.filter(o => o.status !== "Teslim edildi" && o.status !== "İptal edildi").length;
  document.getElementById("totalSpend").innerText = orders.reduce((s,o) => s + o.price, 0) + " TL";

  document.getElementById("notifications").innerHTML =
    low.length ? low.map(p => `<p>⚠️ ${p.name} minimum stok altında.</p>`).join("") : "<p>✅ Bildirim yok.</p>";

  const buy = orders.filter(o => o.status === "Alınacak");
  document.getElementById("buyList").innerHTML =
    buy.length ? buy.map(o => `<p>🛒 ${o.name} - ${o.count} adet</p>`).join("") : "<p>✅ Alınacak ürün yok.</p>";
}

function renderStock(){
  const area = document.getElementById("stockList");
  if(!parts.length){ area.innerHTML = "<p>📦 Henüz ürün yok.</p>"; return; }

  area.innerHTML = parts.map(p => `
    <div class="item">
      <div class="item-text">
        <b>🔧 ${p.name}</b><br>
        🏷️ Kod: ${p.code || "-"}<br>
        📁 Kategori: ${p.category || "-"}<br>
        📦 Adet: ${p.count} | ⚠️ Minimum: ${p.min}<br>
        🗃️ Konum: ${p.box || "-"} / ${p.shelf || "-"}<br>
        📝 Not: ${p.note || "-"}
      </div>
      <div>
        <button class="small-btn success" onclick="editPart(${p.id})">✏️ Düzenle</button>
        <button class="small-btn danger" onclick="deletePart(${p.id})">🗑️ Sil</button>
      </div>
    </div>
  `).join("");
}

function renderProjects(){
  const area = document.getElementById("projectList");
  if(!projects.length){ area.innerHTML = "<p>🛠️ Henüz proje yok.</p>"; return; }

  area.innerHTML = projects.map(p => `
    <div class="item">
      <div class="item-text">
        <b>🛠️ ${p.name}</b><br>
        Durum: ${p.status}<br>
        Parçalar: ${p.parts || "-"}<br>
        Not: ${p.note || "-"}
      </div>
      <div>
        <select onchange="changeProjectStatus(${p.id}, this.value)">
          <option ${p.status==="Planlandı"?"selected":""}>Planlandı</option>
          <option ${p.status==="Devam ediyor"?"selected":""}>Devam ediyor</option>
          <option ${p.status==="Bitti"?"selected":""}>Bitti</option>
        </select>
        <button class="small-btn danger" onclick="deleteProject(${p.id})">🗑️ Sil</button>
      </div>
    </div>
  `).join("");
}

function renderOrders(){
  const area = document.getElementById("orderList");
  if(!orders.length){ area.innerHTML = "<p>🛒 Henüz sipariş yok.</p>"; return; }

  area.innerHTML = orders.map(o => `
    <div class="item">
      <div class="item-text">
        <b>🛒 ${o.name}</b><br>
        🔢 Adet: ${o.count}<br>
        💸 Fiyat: ${o.price} TL<br>
        🚚 Durum: ${o.status}<br>
        🔗 Link: ${o.link ? `<a href="${o.link}" target="_blank">Aç</a>` : "-"}
      </div>
      <div>
        <select onchange="changeOrderStatus(${o.id}, this.value)">
          <option ${o.status==="Alınacak"?"selected":""}>Alınacak</option>
          <option ${o.status==="Sipariş verildi"?"selected":""}>Sipariş verildi</option>
          <option ${o.status==="Kargoda"?"selected":""}>Kargoda</option>
          <option ${o.status==="Teslim edildi"?"selected":""}>Teslim edildi</option>
          <option ${o.status==="İptal edildi"?"selected":""}>İptal edildi</option>
        </select>
        <button class="small-btn danger" onclick="deleteOrder(${o.id})">🗑️ Sil</button>
      </div>
    </div>
  `).join("");
}

function renderMessages(){
  const area = document.getElementById("messageList");
  if(!messages.length){ area.innerHTML = "<p>💬 Henüz mesaj yok.</p>"; return; }

  area.innerHTML = messages.map(m => `
    <div class="item message-bubble">
      <div class="item-text">
        <b>👤 ${m.user}</b> <small>🕒 ${m.date}</small><br>
        💬 ${m.text}
      </div>
      ${currentUser && currentUser.role === "admin" ? `<button class="small-btn danger" onclick="deleteMessage(${m.id})">🗑️ Sil</button>` : ""}
    </div>
  `).join("");
}

function renderAdmin(){
  const area = document.getElementById("codeList");
  const search = document.getElementById("searchCode").value.trim().toUpperCase();

  let list = search ? users.filter(u => u.code.includes(search) || u.username.toUpperCase().includes(search)) : users.slice(0,50);

  area.innerHTML = list.map(u => `
    <div class="item">
      <div class="item-text">
        <b>${u.code}</b><br>
        Kullanıcı: ${u.username || "Boşta"}<br>
        Rol: ${u.role}<br>
        Durum: ${u.active ? "Aktif" : "İptal"}
      </div>
      ${u.role !== "admin" ? `
        <div>
          <button class="small-btn danger" onclick="cancelCode('${u.code}')">İptal</button>
          <button class="small-btn success" onclick="resetCode('${u.code}')">Sıfırla</button>
        </div>
      ` : ""}
    </div>
  `).join("");
}
