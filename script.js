let currentUser=null;
let editingPartId=null;

let users=JSON.parse(localStorage.getItem("users"));

if(!users){
  users=[{username:"Admin",code:"ADMIN-0001",role:"admin",active:true,lastSeen:"-"}];

  for(let i=1;i<=9999;i++){
    users.push({
      username:"",
      code:"ATLY-"+String(i).padStart(4,"0"),
      role:"user",
      active:true,
      lastSeen:"-"
    });
  }

  localStorage.setItem("users",JSON.stringify(users));
}

let parts=JSON.parse(localStorage.getItem("parts"))||[];
let projects=JSON.parse(localStorage.getItem("projects"))||[];
let orders=JSON.parse(localStorage.getItem("orders"))||[];
let messages=JSON.parse(localStorage.getItem("messages"))||[];

if(localStorage.getItem("theme")==="dark"){
  document.body.classList.add("dark");
}

function saveData(){
  localStorage.setItem("users",JSON.stringify(users));
  localStorage.setItem("parts",JSON.stringify(parts));
  localStorage.setItem("projects",JSON.stringify(projects));
  localStorage.setItem("orders",JSON.stringify(orders));
  localStorage.setItem("messages",JSON.stringify(messages));
}

function toast(text){
  const t=document.getElementById("toast");
  t.innerText=text;
  t.classList.remove("hidden");
  setTimeout(()=>t.classList.add("hidden"),2200);
}

function login(){
  const username=document.getElementById("loginUsername").value.trim();
  const code=document.getElementById("loginCode").value.trim().toUpperCase();

  if(!username||!code)return alert("Kullanıcı adı ve kod yaz.");

  const user=users.find(u=>u.code===code);
  if(!user)return alert("Kod bulunamadı.");
  if(!user.active)return alert("Bu kod iptal edilmiş.");

  if(!user.username)user.username=username;
  if(user.username!==username)return alert("Bu kod başka kullanıcıya ait.");

  user.lastSeen=new Date().toLocaleString("tr-TR");
  currentUser=user;
  saveData();

  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  document.getElementById("welcomeTitle").innerText="Hoş geldin, "+user.username+" 👋";
  document.getElementById("userInfo").innerText=user.username+" | "+user.role;
  document.getElementById("userCodeInfo").innerText=user.code;
  document.getElementById("adminBtn").style.display=user.role==="admin"?"block":"none";

  showPage("dashboard");
  toast("Giriş başarılı 🚀");
}

function logout(){
  currentUser=null;
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}

function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  renderAll();
}

function toggleTheme(){
  document.body.classList.toggle("dark");
  localStorage.setItem("theme",document.body.classList.contains("dark")?"dark":"light");
  toast("Tema değiştirildi");
}

function savePart(){
  const name=document.getElementById("partName").value.trim();
  if(!name)return alert("Ürün adı boş olamaz.");

  const part={
    id:editingPartId||Date.now(),
    name,
    code:document.getElementById("partCode").value.trim(),
    category:document.getElementById("partCategory").value.trim(),
    count:Number(document.getElementById("partCount").value)||0,
    min:Number(document.getElementById("partMin").value)||0,
    box:document.getElementById("partBox").value.trim(),
    shelf:document.getElementById("partShelf").value.trim(),
    photo:document.getElementById("partPhoto").value.trim(),
    note:document.getElementById("partNote").value.trim()
  };

  if(editingPartId){
    parts=parts.map(p=>p.id===editingPartId?part:p);
    editingPartId=null;
    toast("Ürün güncellendi");
  }else{
    parts.push(part);
    toast("Ürün eklendi");
  }

  clearPartForm();
  saveData();
  renderAll();
}

function editPart(id){
  const p=parts.find(x=>x.id===id);
  if(!p)return;

  editingPartId=id;
  document.getElementById("partName").value=p.name;
  document.getElementById("partCode").value=p.code||"";
  document.getElementById("partCategory").value=p.category||"";
  document.getElementById("partCount").value=p.count||0;
  document.getElementById("partMin").value=p.min||0;
  document.getElementById("partBox").value=p.box||"";
  document.getElementById("partShelf").value=p.shelf||"";
  document.getElementById("partPhoto").value=p.photo||"";
  document.getElementById("partNote").value=p.note||"";
  showPage("stock");
}

function deletePart(id){
  if(!confirm("Bu parçayı silmek istiyor musun?"))return;
  parts=parts.filter(p=>p.id!==id);
  saveData();
  renderAll();
  toast("Ürün silindi");
}

function clearPartForm(){
  editingPartId=null;
  ["partName","partCode","partCategory","partCount","partMin","partBox","partShelf","partPhoto","partNote"]
    .forEach(id=>document.getElementById(id).value="");
}

function addProject(){
  const name=document.getElementById("projectName").value.trim();
  if(!name)return alert("Proje adı yaz.");

  projects.push({
    id:Date.now(),
    name,
    status:document.getElementById("projectStatus").value,
    parts:document.getElementById("projectParts").value.trim(),
    note:document.getElementById("projectNote").value.trim()
  });

  document.getElementById("projectName").value="";
  document.getElementById("projectParts").value="";
  document.getElementById("projectNote").value="";

  saveData();
  renderAll();
  toast("Proje eklendi");
}

function changeProjectStatus(id,status){
  const p=projects.find(x=>x.id===id);
  if(!p)return;
  p.status=status;
  saveData();
  renderAll();
}

function deleteProject(id){
  projects=projects.filter(p=>p.id!==id);
  saveData();
  renderAll();
  toast("Proje silindi");
}

function addOrder(){
  const name=document.getElementById("orderName").value.trim();
  if(!name)return alert("Ürün adı yaz.");

  orders.push({
    id:Date.now(),
    name,
    count:Number(document.getElementById("orderCount").value)||0,
    price:Number(document.getElementById("orderPrice").value)||0,
    link:document.getElementById("orderLink").value.trim(),
    status:document.getElementById("orderStatus").value
  });

  ["orderName","orderCount","orderPrice","orderLink"].forEach(id=>document.getElementById(id).value="");

  saveData();
  renderAll();
  toast("Sipariş eklendi");
}

function changeOrderStatus(id,status){
  const o=orders.find(x=>x.id===id);
  if(!o)return;
  o.status=status;
  saveData();
  renderAll();
}

function deleteOrder(id){
  orders=orders.filter(o=>o.id!==id);
  saveData();
  renderAll();
  toast("Sipariş silindi");
}

function sendMessage(){
  const text=document.getElementById("messageText").value.trim();
  const type=document.getElementById("messageType").value;
  const to=document.getElementById("messageTo").value.trim();

  if(!text)return;
  if(type==="private"&&!to)return alert("Özel mesaj için kullanıcı adı yaz.");

  messages.push({
    id:Date.now(),
    user:currentUser.username,
    to,
    type,
    text,
    date:new Date().toLocaleString("tr-TR")
  });

  document.getElementById("messageText").value="";
  saveData();
  renderAll();
  toast("Mesaj gönderildi");
}

function deleteMessage(id){
  messages=messages.filter(m=>m.id!==id);
  saveData();
  renderAll();
}

function cancelCode(code){
  const u=users.find(x=>x.code===code);
  if(!u)return;
  u.active=false;
  saveData();
  renderAdmin();
}

function resetCode(code){
  const u=users.find(x=>x.code===code);
  if(!u)return;
  u.username="";
  u.active=true;
  saveData();
  renderAdmin();
}

function getMaterialStatus(name){
  const clean=name.trim().toLowerCase();
  const found=parts.find(p=>
    p.name.toLowerCase().includes(clean) ||
    (p.code||"").toLowerCase().includes(clean)
  );

  if(!found)return `<span class="badge bad">❌ ${name} yok</span>`;
  if(found.count<=0)return `<span class="badge bad">❌ ${name} bitti</span>`;
  if(found.count<found.min)return `<span class="badge warn">⚠️ ${name} az (${found.count})</span>`;
  return `<span class="badge ok">✅ ${name} var (${found.count})</span>`;
}

function renderProjectMaterials(project){
  if(!project.parts)return "<p>Malzeme yazılmamış.</p>";
  return project.parts.split(",").map(x=>x.trim()).filter(Boolean).map(getMaterialStatus).join(" ");
}

function renderAll(){
  renderDashboard();
  renderStock();
  renderProjects();
  renderOrders();
  renderMessages();
  if(currentUser&&currentUser.role==="admin")renderAdmin();
}

function renderDashboard(){
  const low=parts.filter(p=>p.count<p.min);
  const activeProjects=projects.filter(p=>p.status!=="Bitti");
  const pendingOrders=orders.filter(o=>o.status!=="Teslim edildi"&&o.status!=="İptal edildi");

  document.getElementById("totalProducts").innerText=parts.length;
  document.getElementById("lowStockCount").innerText=low.length;
  document.getElementById("activeProjectCount").innerText=activeProjects.length;
  document.getElementById("pendingOrderCount").innerText=pendingOrders.length;
  document.getElementById("totalSpend").innerText=orders.reduce((s,o)=>s+o.price,0)+" TL";

  document.getElementById("notifications").innerHTML=
    low.length?low.slice(0,5).map(p=>`<p>⚠️ ${p.name} minimum stok altında.</p>`).join(""):"<p>✅ Bildirim yok.</p>";

  const buy=orders.filter(o=>o.status==="Alınacak");
  document.getElementById("buyList").innerHTML=
    buy.length?buy.slice(0,5).map(o=>`<p>🛒 ${o.name} - ${o.count} adet</p>`).join(""):"<p>✅ Alınacak ürün yok.</p>";

  document.getElementById("stockMini").innerHTML=
    parts.length?parts.slice(-4).reverse().map(p=>`<p>🔧 ${p.name} — ${p.count} adet</p>`).join(""):"<p>Ürün yok.</p>";

  document.getElementById("projectMini").innerHTML=
    activeProjects.length?activeProjects.slice(0,3).map(p=>`<p>🛠️ ${p.name} — ${p.status}</p>`).join(""):"<p>Aktif proje yok.</p>";

  const active=users.filter(u=>u.username&&u.active).slice(0,8);
  document.getElementById("activeUsers").innerHTML=
    active.length?active.map(u=>`<p>🟢 ${u.username}<br><small>${u.lastSeen||"-"}</small></p>`).join(""):"<p>Aktif kullanıcı yok.</p>";

  document.getElementById("lastMessages").innerHTML=
    messages.length?messages.slice(-5).reverse().map(m=>`<p>💬 <b>${m.user}</b>: ${m.text}</p>`).join(""):"<p>Mesaj yok.</p>";

  if(currentUser){
    document.getElementById("accountName").innerText=currentUser.username;
    document.getElementById("accountRole").innerText=currentUser.role==="admin"?"👑 Admin":"👤 Üye";
    document.getElementById("accountLastSeen").innerText="Son giriş: "+currentUser.lastSeen;
  }
}

function renderStock(){
  const area=document.getElementById("stockList");
  if(!parts.length){area.innerHTML="<p>📦 Henüz ürün yok.</p>";return;}

  area.innerHTML=parts.map(p=>`
    <div class="item">
      ${p.photo?`<img class="product-img" src="${p.photo}" alt="${p.name}">`:""}
      <div class="item-text">
        <b>🔧 ${p.name}</b><br>
        🏷️ Kod: ${p.code||"-"}<br>
        📁 Kategori: ${p.category||"-"}<br>
        📦 Adet: ${p.count} | ⚠️ Minimum: ${p.min}<br>
        🗃️ Konum: ${p.box||"-"} / ${p.shelf||"-"}<br>
        📝 Not: ${p.note||"-"}
      </div>
      <div>
        <button class="small-btn success" onclick="editPart(${p.id})">✏️ Düzenle</button>
        <button class="small-btn danger" onclick="deletePart(${p.id})">🗑️ Sil</button>
      </div>
    </div>
  `).join("");
}

function renderProjects(){
  const area=document.getElementById("projectList");
  if(!projects.length){area.innerHTML="<p>🛠️ Henüz proje yok.</p>";return;}

  area.innerHTML=projects.map(p=>`
    <div class="item">
      <div class="item-text">
        <b>🛠️ ${p.name}</b><br>
        Durum: ${p.status}<br>
        Not: ${p.note||"-"}
        <div class="project-materials">
          <b>Malzeme Durumu:</b><br>
          ${renderProjectMaterials(p)}
        </div>
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
  const area=document.getElementById("orderList");
  if(!orders.length){area.innerHTML="<p>🛒 Henüz sipariş yok.</p>";return;}

  area.innerHTML=orders.map(o=>`
    <div class="item">
      <div class="item-text">
        <b>🛒 ${o.name}</b><br>
        🔢 Adet: ${o.count}<br>
        💸 Fiyat: ${o.price} TL<br>
        🚚 Durum: ${o.status}<br>
        🔗 Link: ${o.link?`<a href="${o.link}" target="_blank">Aç</a>`:"-"}
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
  const area=document.getElementById("messageList");
  if(!messages.length){area.innerHTML="<p>💬 Henüz mesaj yok.</p>";return;}

  const visible=messages.filter(m=>{
    if(!currentUser)return false;
    if(m.type==="general")return true;
    return m.user===currentUser.username||m.to===currentUser.username||currentUser.role==="admin";
  });

  area.innerHTML=visible.map(m=>`
    <div class="item ${m.type==="private"?"private-bubble":"message-bubble"}">
      <div class="item-text">
        <b>👤 ${m.user}</b>
        ${m.type==="private"?`➡️ <b>${m.to}</b>`:"🌍 Genel"}
        <small>🕒 ${m.date}</small><br>
        💬 ${m.text}
      </div>
      ${currentUser&&currentUser.role==="admin"?`<button class="small-btn danger" onclick="deleteMessage(${m.id})">🗑️ Sil</button>`:""}
    </div>
  `).join("");
}

function renderAdmin(){
  const area=document.getElementById("codeList");
  const search=document.getElementById("searchCode").value.trim().toUpperCase();

  let list=search
    ? users.filter(u=>u.code.includes(search)||u.username.toUpperCase().includes(search))
    : users.slice(0,50);

  area.innerHTML=list.map(u=>`
    <div class="item">
      <div class="item-text">
        <b>${u.code}</b><br>
        Kullanıcı: ${u.username||"Boşta"}<br>
        Rol: ${u.role}<br>
        Son giriş: ${u.lastSeen||"-"}<br>
        Durum: ${u.active?"Aktif":"İptal"}
      </div>
      ${u.role!=="admin"?`
        <div>
          <button class="small-btn danger" onclick="cancelCode('${u.code}')">İptal</button>
          <button class="small-btn success" onclick="resetCode('${u.code}')">Sıfırla</button>
        </div>
      `:""}
    </div>
  `).join("");
}
