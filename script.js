let currentUser = null;
let editingPartId = null;

let users = JSON.parse(localStorage.getItem("users"));
if (!users) {
  users = [{ username: "Admin", code: "ADMIN-0001", role: "admin", active: true, lastSeen: "-" }];
  for (let i = 1; i <= 9999; i++) {
    users.push({
      username: "",
      code: "ATLY-" + String(i).padStart(4, "0"),
      role: "user",
      active: true,
      lastSeen: "-"
    });
  }
}

let categories = JSON.parse(localStorage.getItem("categories")) || [
  "Elektronik",
  "Mekanik",
  "Sensör",
  "Motor",
  "Kablo",
  "Modül",
  "Kıyafet",
  "Diğer"
];

let parts = JSON.parse(localStorage.getItem("parts")) || [];
let projects = JSON.parse(localStorage.getItem("projects")) || [];
let orders = JSON.parse(localStorage.getItem("orders")) || [];
let messages = JSON.parse(localStorage.getItem("messages")) || [];

let updateInfo = JSON.parse(localStorage.getItem("updateInfo")) || {
  version: "v1.0",
  message: "AtölyeAI Prestige sistemi aktif edildi."
};

function saveData() {
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("categories", JSON.stringify(categories));
  localStorage.setItem("parts", JSON.stringify(parts));
  localStorage.setItem("projects", JSON.stringify(projects));
  localStorage.setItem("orders", JSON.stringify(orders));
  localStorage.setItem("messages", JSON.stringify(messages));
  localStorage.setItem("updateInfo", JSON.stringify(updateInfo));
}

saveData();

window.onload = function () {
  renderCategoryOptions();

  const savedCode = localStorage.getItem("rememberCode");
  const savedUsername = localStorage.getItem("rememberUsername");

  if (savedCode && savedUsername) {
    loginUsername.value = savedUsername;
    loginCode.value = savedCode;
    rememberMe.checked = true;
  }
};

function toast(text) {
  const box = document.getElementById("toast");
  box.innerText = text;
  box.classList.remove("hidden");

  setTimeout(() => {
    box.classList.add("hidden");
  }, 2200);
}

function login() {
  const username = loginUsername.value.trim();
  const code = loginCode.value.trim().toUpperCase();

  if (!username || !code) {
    alert("Kullanıcı adı ve kod yaz.");
    return;
  }

  const user = users.find(u => u.code === code);

  if (!user) {
    alert("Kod bulunamadı.");
    return;
  }

  if (!user.active) {
    alert("Bu kod iptal edilmiş.");
    return;
  }

  if (!user.username) {
    user.username = username;
  }

  if (user.username !== username) {
    alert("Bu kod başka kullanıcıya ait.");
    return;
  }

  currentUser = user;
  user.lastSeen = new Date().toLocaleString("tr-TR");

  if (rememberMe.checked) {
    localStorage.setItem("rememberUsername", username);
    localStorage.setItem("rememberCode", code);
  } else {
    localStorage.removeItem("rememberUsername");
    localStorage.removeItem("rememberCode");
  }

  saveData();

  loginScreen.classList.add("hidden");
  app.classList.remove("hidden");

  welcomeTitle.innerText = "Hoş geldin, " + user.username + " 👋";
  userInfo.innerText = user.username + " | " + user.role;
  userCodeInfo.innerText = user.code;

  adminBtn.style.display = user.role === "admin" ? "block" : "none";

  renderAll();
  showPage("dashboard");
  showUpdatePopupIfNeeded();

  toast("Giriş başarılı");
}

function logout() {
  currentUser = null;
  app.classList.add("hidden");
  loginScreen.classList.remove("hidden");
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  document.getElementById(pageId).classList.remove("hidden");
  renderAll();
}

function toggleTheme() {
  document.body.classList.toggle("light-mode");
  localStorage.setItem("themeMode", document.body.classList.contains("light-mode") ? "light" : "dark");
  toast("Tema değiştirildi");
}

if (localStorage.getItem("themeMode") === "light") {
  document.body.classList.add("light-mode");
}

function showUpdatePopupIfNeeded() {
  if (!currentUser) return;

  const seenKey = "seenUpdate_" + currentUser.code;
  const seenVersion = localStorage.getItem(seenKey);

  if (seenVersion !== updateInfo.version) {
    updateTitle.innerText = updateInfo.version;
    updateDesc.innerText = updateInfo.message;
    updatePopup.classList.remove("hidden");
  }
}

function closeUpdatePopup() {
  if (!currentUser) return;

  localStorage.setItem("seenUpdate_" + currentUser.code, updateInfo.version);
  updatePopup.classList.add("hidden");
}

function publishUpdate() {
  if (!currentUser || currentUser.role !== "admin") {
    alert("Sadece admin güncelleme yayınlayabilir.");
    return;
  }

  const version = updateVersionInput.value.trim();
  const message = updateMessageInput.value.trim();

  if (!version || !message) {
    alert("Sürüm ve açıklama yaz.");
    return;
  }

  updateInfo = {
    version: version,
    message: message
  };

  saveData();

  updateVersionInput.value = "";
  updateMessageInput.value = "";

  toast("Güncelleme duyurusu yayınlandı");
}

function renderCategoryOptions() {
  if (!document.getElementById("partCategory")) return;

  partCategory.innerHTML = categories.map(cat => `<option>${cat}</option>`).join("");

  if (document.getElementById("stockSearchCategory")) {
    stockSearchCategory.innerHTML =
      `<option value="">Tüm Kategoriler</option>` +
      categories.map(cat => `<option>${cat}</option>`).join("");
  }
}

function addCategory() {
  const name = categoryName.value.trim();

  if (!name) {
    alert("Kategori adı yaz.");
    return;
  }

  if (categories.includes(name)) {
    alert("Bu kategori zaten var.");
    return;
  }

  categories.push(name);
  categoryName.value = "";

  saveData();
  renderAll();
  toast("Kategori eklendi");
}

function deleteCategory(name) {
  if (!confirm(name + " kategorisi silinsin mi?")) return;

  categories = categories.filter(c => c !== name);

  parts = parts.map(p => {
    if (p.category === name) {
      return { ...p, category: "Diğer" };
    }
    return p;
  });

  saveData();
  renderAll();
  toast("Kategori silindi");
}

function savePart() {
  const name = partName.value.trim();

  if (!name) {
    alert("Ürün adı boş olamaz.");
    return;
  }

  const part = {
    id: editingPartId || Date.now(),
    name: name,
    code: partCode.value.trim(),
    category: partCategory.value,
    count: Number(partCount.value) || 0,
    min: Number(partMin.value) || 0,
    box: partBox.value.trim(),
    shelf: partShelf.value.trim(),
    photo: partPhoto.value.trim(),
    note: partNote.value.trim()
  };

  if (editingPartId) {
    parts = parts.map(p => p.id === editingPartId ? part : p);
    editingPartId = null;
  } else {
    parts.push(part);
  }

  clearPartForm();
  saveData();
  renderAll();
  toast("Ürün kaydedildi");
}

function editPart(id) {
  const p = parts.find(x => x.id === id);
  if (!p) return;

  editingPartId = id;

  partName.value = p.name;
  partCode.value = p.code || "";
  partCategory.value = p.category || "Diğer";
  partCount.value = p.count;
  partMin.value = p.min;
  partBox.value = p.box || "";
  partShelf.value = p.shelf || "";
  partPhoto.value = p.photo || "";
  partNote.value = p.note || "";

  showPage("stock");
}

function deletePart(id) {
  if (!confirm("Bu ürün silinsin mi?")) return;

  parts = parts.filter(p => p.id !== id);

  saveData();
  renderAll();
  toast("Ürün silindi");
}

function clearPartForm() {
  editingPartId = null;

  [
    "partName",
    "partCode",
    "partCount",
    "partMin",
    "partBox",
    "partShelf",
    "partPhoto",
    "partNote"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function checkStock() {
  const text = stockSearchInput.value.trim().toLowerCase();
  const cat = stockSearchCategory.value;

  let found = parts.filter(p => {
    const textMatch =
      !text ||
      p.name.toLowerCase().includes(text) ||
      (p.code || "").toLowerCase().includes(text) ||
      (p.category || "").toLowerCase().includes(text);

    const catMatch = !cat || p.category === cat;

    return textMatch && catMatch;
  });

  if (found.length === 0) {
    stockCheckResult.innerHTML = `
      <div class="item">
        <div class="item-text">
          ❌ Sonuç bulunamadı.
        </div>
      </div>
    `;
    return;
  }

  stockCheckResult.innerHTML = found.map(p => stockCard(p)).join("");
}

function clearStockCheck() {
  stockSearchInput.value = "";
  stockSearchCategory.value = "";
  stockCheckResult.innerHTML = "";
}

function stockCard(p) {
  let status = "✅ Stok yeterli";
  let cls = "ok";

  if (p.count <= 0) {
    status = "❌ Stok bitti";
    cls = "bad";
  } else if (p.count < p.min) {
    status = "⚠️ Minimum altında";
    cls = "warn";
  }

  return `
    <div class="item">
      ${p.photo ? `<img class="product-img" src="${p.photo}" alt="${p.name}">` : ""}
      <div class="item-text">
        <b>🔧 ${p.name}</b><br>
        🏷️ Kod: ${p.code || "-"}<br>
        📁 Kategori: ${p.category || "-"}<br>
        📦 Adet: ${p.count}<br>
        ⚠️ Minimum: ${p.min}<br>
        🗃️ Konum: ${p.box || "-"} / ${p.shelf || "-"}<br>
        📝 Not: ${p.note || "-"}<br>
        <span class="badge ${cls}">${status}</span>
      </div>
    </div>
  `;
}

function addProject() {
  const name = projectName.value.trim();

  if (!name) {
    alert("Proje adı yaz.");
    return;
  }

  projects.push({
    id: Date.now(),
    name: name,
    status: projectStatus.value,
    parts: projectParts.value.trim(),
    note: projectNote.value.trim()
  });

  projectName.value = "";
  projectParts.value = "";
  projectNote.value = "";

  saveData();
  renderAll();
  toast("Proje eklendi");
}

function changeProjectStatus(id, status) {
  const project = projects.find(p => p.id === id);
  if (!project) return;

  project.status = status;
  saveData();
  renderAll();
}

function deleteProject(id) {
  projects = projects.filter(p => p.id !== id);
  saveData();
  renderAll();
  toast("Proje silindi");
}

function addOrder() {
  const name = orderName.value.trim();

  if (!name) {
    alert("Ürün adı yaz.");
    return;
  }

  orders.push({
    id: Date.now(),
    name: name,
    count: Number(orderCount.value) || 0,
    price: Number(orderPrice.value) || 0,
    link: orderLink.value.trim(),
    status: orderStatus.value
  });

  orderName.value = "";
  orderCount.value = "";
  orderPrice.value = "";
  orderLink.value = "";

  saveData();
  renderAll();
  toast("Sipariş eklendi");
}

function changeOrderStatus(id, status) {
  const order = orders.find(o => o.id === id);
  if (!order) return;

  order.status = status;
  saveData();
  renderAll();
}

function deleteOrder(id) {
  orders = orders.filter(o => o.id !== id);
  saveData();
  renderAll();
  toast("Sipariş silindi");
}

function sendMessage() {
  const text = messageText.value.trim();
  const type = messageType.value;
  const to = messageTo.value.trim();

  if (!text) return;

  if (type === "private" && !to) {
    alert("Özel mesaj için kullanıcı adı yaz.");
    return;
  }

  messages.push({
    id: Date.now(),
    user: currentUser.username,
    to: to,
    type: type,
    text: text,
    date: new Date().toLocaleString("tr-TR")
  });

  messageText.value = "";

  saveData();
  renderAll();
  toast("Mesaj gönderildi");
}

function deleteMessage(id) {
  messages = messages.filter(m => m.id !== id);
  saveData();
  renderAll();
}

function askAI() {
  const question = aiInput.value.trim().toLowerCase();
  if (!question) return;

  aiChat.innerHTML += `<div class="ai-msg ai-user"><b>Sen:</b> ${aiInput.value}</div>`;

  const lowStock = parts.filter(p => p.count < p.min);
  let answer = "";

  if (question.includes("eksik") || question.includes("az")) {
    answer = lowStock.length
      ? lowStock.map(p => `⚠️ ${p.name}: ${p.count}/${p.min}`).join("<br>")
      : "✅ Eksik veya az stok görünmüyor.";
  } else if (question.includes("kategori")) {
    answer = categories.map(c => `🏷️ ${c}: ${parts.filter(p => p.category === c).length} ürün`).join("<br>");
  } else if (question.includes("harcama")) {
    const total = orders.reduce((s, o) => s + o.price * o.count, 0);
    answer = `💸 Toplam harcama: ${total} TL`;
  } else if (question.includes("proje")) {
    answer = projects.length
      ? projects.map(p => `🛠️ ${p.name} - ${p.status}<br>${renderProjectMaterials(p)}`).join("<hr>")
      : "Henüz proje yok.";
  } else if (question.includes("sipariş")) {
    answer = orders.length
      ? orders.map(o => `🛒 ${o.name}: ${o.count} adet - ${o.status}`).join("<br>")
      : "Sipariş yok.";
  } else {
    answer = "Stok, kategori, proje, sipariş ve harcama analizi yapabilirim.";
  }

  aiChat.innerHTML += `<div class="ai-msg"><b>AtölyeAI:</b><br>${answer}</div>`;
  aiInput.value = "";
}

function getMaterialStatus(name) {
  const clean = name.trim().toLowerCase();

  const found = parts.find(p =>
    p.name.toLowerCase().includes(clean) ||
    (p.code || "").toLowerCase().includes(clean)
  );

  if (!found) return `<span class="badge bad">❌ ${name} yok</span>`;
  if (found.count <= 0) return `<span class="badge bad">❌ ${name} bitti</span>`;
  if (found.count < found.min) return `<span class="badge warn">⚠️ ${name} az (${found.count})</span>`;

  return `<span class="badge ok">✅ ${name} var (${found.count})</span>`;
}

function renderProjectMaterials(project) {
  if (!project.parts) return "Malzeme yazılmamış.";

  return project.parts
    .split(",")
    .map(x => x.trim())
    .filter(Boolean)
    .map(getMaterialStatus)
    .join(" ");
}

function miniSearch() {
  const q = webSearchInput.value.trim();

  if (!q) {
    alert("Aranacak şey yaz.");
    return;
  }

  const url = "https://www.google.com/search?igu=1&q=" + encodeURIComponent(q);
  miniBrowser.src = url;
}

function openSearchNewTab() {
  const q = webSearchInput.value.trim();

  if (!q) {
    alert("Aranacak şey yaz.");
    return;
  }

  window.open("https://www.google.com/search?q=" + encodeURIComponent(q), "_blank");
}

function cancelCode(code) {
  const user = users.find(u => u.code === code);
  if (!user) return;

  user.active = false;
  saveData();
  renderAdmin();
}

function resetCode(code) {
  const user = users.find(u => u.code === code);
  if (!user) return;

  user.username = "";
  user.active = true;
  saveData();
  renderAdmin();
}

function renderAll() {
  renderCategoryOptions();
  renderDashboard();
  renderCategories();
  renderStock();
  renderProjects();
  renderOrders();
  renderMessages();
  renderReports();

  if (currentUser && currentUser.role === "admin") {
    renderAdmin();
  }
}

function renderDashboard() {
  const low = parts.filter(p => p.count < p.min);
  const activeProjects = projects.filter(p => p.status !== "Bitti");
  const pendingOrders = orders.filter(o => o.status !== "Teslim edildi" && o.status !== "İptal edildi");

  const cart = orders
    .filter(o => o.status === "Alınacak")
    .reduce((s, o) => s + o.price * o.count, 0);

  const delivered = orders
    .filter(o => o.status === "Teslim edildi")
    .reduce((s, o) => s + o.price * o.count, 0);

  const waiting = pendingOrders.reduce((s, o) => s + o.price * o.count, 0);

  totalProducts.innerText = parts.length;
  lowStockCount.innerText = low.length;
  categoryCount.innerText = categories.length;
  activeProjectCount.innerText = activeProjects.length;
  totalSpend.innerText = cart + delivered + waiting + " TL";

  cartTotal.innerText = cart + " TL";
  deliveredTotal.innerText = delivered + " TL";
  waitingTotal.innerText = waiting + " TL";

  drawChart(cart, delivered, waiting);

  notifications.innerHTML = low.length
    ? low.slice(0, 5).map(p => `<p>⚠️ ${p.name} az stokta.</p>`).join("")
    : "<p>✅ Bildirim yok.</p>";

  buyList.innerHTML = orders.filter(o => o.status === "Alınacak").length
    ? orders.filter(o => o.status === "Alınacak").slice(0, 5).map(o => `<p>🛒 ${o.name} - ${o.count} adet</p>`).join("")
    : "<p>✅ Alınacak ürün yok.</p>";

  stockMini.innerHTML = parts.length
    ? parts.slice(-4).reverse().map(p => `<p>🔧 ${p.name} — ${p.count} adet</p>`).join("")
    : "<p>Ürün yok.</p>";

  projectMini.innerHTML = activeProjects.length
    ? activeProjects.slice(0, 3).map(p => `<p>🛠️ ${p.name} — ${p.status}</p>`).join("")
    : "<p>Aktif proje yok.</p>";

  activeUsers.innerHTML = users
    .filter(u => u.username && u.active)
    .slice(0, 8)
    .map(u => `<p>🟢 ${u.username}<br><small>${u.lastSeen}</small></p>`)
    .join("");

  lastMessages.innerHTML = messages.length
    ? messages.slice(-5).reverse().map(m => `<p>💬 <b>${m.user}</b>: ${m.text}</p>`).join("")
    : "<p>Mesaj yok.</p>";

  if (currentUser) {
    accountName.innerText = currentUser.username;
    accountRole.innerText = currentUser.role === "admin" ? "👑 Admin" : "👤 Üye";
    accountLastSeen.innerText = "Son giriş: " + currentUser.lastSeen;
  }
}

function renderCategories() {
  categoryList.innerHTML = categories.map(c => `
    <div class="item">
      <div class="item-text">
        <b>🏷️ ${c}</b><br>
        ${parts.filter(p => p.category === c).length} ürün
      </div>
      <button class="small-btn danger" onclick="deleteCategory('${c}')">Sil</button>
    </div>
  `).join("");
}

function renderStock() {
  stockList.innerHTML = parts.length
    ? parts.map(p => `
      <div class="item">
        ${p.photo ? `<img class="product-img" src="${p.photo}" alt="${p.name}">` : ""}
        <div class="item-text">
          <b>🔧 ${p.name}</b><br>
          🏷️ Kod: ${p.code || "-"}<br>
          📁 Kategori: ${p.category || "-"}<br>
          📦 Adet: ${p.count} | ⚠️ Minimum: ${p.min}<br>
          🗃️ ${p.box || "-"} / ${p.shelf || "-"}<br>
          📝 ${p.note || "-"}
        </div>
        <div>
          <button class="small-btn success" onclick="editPart(${p.id})">Düzenle</button>
          <button class="small-btn danger" onclick="deletePart(${p.id})">Sil</button>
        </div>
      </div>
    `).join("")
    : "<p>📦 Ürün yok.</p>";
}

function renderProjects() {
  projectList.innerHTML = projects.length
    ? projects.map(p => `
      <div class="item">
        <div class="item-text">
          <b>🛠️ ${p.name}</b><br>
          Durum: ${p.status}<br>
          Not: ${p.note || "-"}
          <div class="project-materials">
            <b>Malzeme Durumu:</b><br>
            ${renderProjectMaterials(p)}
          </div>
        </div>
        <div>
          <select onchange="changeProjectStatus(${p.id}, this.value)">
            <option ${p.status === "Planlandı" ? "selected" : ""}>Planlandı</option>
            <option ${p.status === "Devam ediyor" ? "selected" : ""}>Devam ediyor</option>
            <option ${p.status === "Bitti" ? "selected" : ""}>Bitti</option>
          </select>
          <button class="small-btn danger" onclick="deleteProject(${p.id})">Sil</button>
        </div>
      </div>
    `).join("")
    : "<p>🛠️ Proje yok.</p>";
}

function renderOrders() {
  orderList.innerHTML = orders.length
    ? orders.map(o => `
      <div class="item">
        <div class="item-text">
          <b>🛒 ${o.name}</b><br>
          🔢 Adet: ${o.count}<br>
          💸 Birim: ${o.price} TL<br>
          🧾 Toplam: ${o.price * o.count} TL<br>
          🚚 Durum: ${o.status}<br>
          🔗 ${o.link ? `<a href="${o.link}" target="_blank">Aç</a>` : "-"}
        </div>
        <div>
          <select onchange="changeOrderStatus(${o.id}, this.value)">
            <option ${o.status === "Alınacak" ? "selected" : ""}>Alınacak</option>
            <option ${o.status === "Sipariş verildi" ? "selected" : ""}>Sipariş verildi</option>
            <option ${o.status === "Kargoda" ? "selected" : ""}>Kargoda</option>
            <option ${o.status === "Teslim edildi" ? "selected" : ""}>Teslim edildi</option>
            <option ${o.status === "İptal edildi" ? "selected" : ""}>İptal edildi</option>
          </select>
          <button class="small-btn danger" onclick="deleteOrder(${o.id})">Sil</button>
        </div>
      </div>
    `).join("")
    : "<p>🛒 Sipariş yok.</p>";
}

function renderMessages() {
  const visibleMessages = messages.filter(m => {
    if (!currentUser) return false;
    if (m.type === "general") return true;
    return m.user === currentUser.username || m.to === currentUser.username || currentUser.role === "admin";
  });

  messageList.innerHTML = visibleMessages.length
    ? visibleMessages.map(m => `
      <div class="item ${m.type === "private" ? "private-bubble" : "message-bubble"}">
        <div class="item-text">
          <b>👤 ${m.user}</b>
          ${m.type === "private" ? `➡️ <b>${m.to}</b>` : "🌍 Genel"}
          <small>🕒 ${m.date}</small><br>
          💬 ${m.text}
        </div>
        ${currentUser && currentUser.role === "admin" ? `<button class="small-btn danger" onclick="deleteMessage(${m.id})">Sil</button>` : ""}
      </div>
    `).join("")
    : "<p>💬 Mesaj yok.</p>";
}

function renderReports() {
  categoryReport.innerHTML = categories.map(c => `
    <p>🏷️ ${c}: <b>${parts.filter(p => p.category === c).length}</b> ürün</p>
  `).join("");

  orderReport.innerHTML = `
    <p>🧾 Toplam sipariş: <b>${orders.length}</b></p>
    <p>💸 Toplam tutar: <b>${orders.reduce((s, o) => s + o.price * o.count, 0)} TL</b></p>
  `;
}

function renderAdmin() {
  const search = searchCode.value.trim().toUpperCase();

  const list = search
    ? users.filter(u => u.code.includes(search) || u.username.toUpperCase().includes(search))
    : users.slice(0, 50);

  codeList.innerHTML = list.map(u => `
    <div class="item">
      <div class="item-text">
        <b>${u.code}</b><br>
        Kullanıcı: ${u.username || "Boşta"}<br>
        Rol: ${u.role}<br>
        Son giriş: ${u.lastSeen}<br>
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

function drawChart(cart, delivered, waiting) {
  const canvas = document.getElementById("spendChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.offsetWidth;
  const h = canvas.height = 180;

  ctx.clearRect(0, 0, w, h);

  const data = [
    { label: "Sepet", value: cart, color: "#d4af37" },
    { label: "Teslim", value: delivered, color: "#22c55e" },
    { label: "Bekleyen", value: waiting, color: "#f59e0b" }
  ];

  const max = Math.max(cart, delivered, waiting, 1);
  const barWidth = w / 3 - 35;

  data.forEach((item, i) => {
    const x = i * (barWidth + 35) + 20;
    const barHeight = (item.value / max) * 105;
    const y = h - barHeight - 35;

    ctx.fillStyle = item.color;
    ctx.roundRect(x, y, barWidth, barHeight, 12);
    ctx.fill();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 13px Arial";
    ctx.fillText(item.label, x, h - 12);
    ctx.fillText(item.value + " TL", x, y - 8);
  });
}
