let currentUser=null, editingPartId=null;
let users=JSON.parse(localStorage.getItem("users"));
if(!users){
  users=[{username:"Admin",code:"ADMIN-0001",role:"admin",active:true,lastSeen:"-"}];
  for(let i=1;i<=9999;i++) users.push({username:"",code:"ATLY-"+String(i).padStart(4,"0"),role:"user",active:true,lastSeen:"-"});
  localStorage.setItem("users",JSON.stringify(users));
}
let parts=JSON.parse(localStorage.getItem("parts"))||[];
let projects=JSON.parse(localStorage.getItem("projects"))||[];
let orders=JSON.parse(localStorage.getItem("orders"))||[];
let messages=JSON.parse(localStorage.getItem("messages"))||[];
if(localStorage.getItem("theme")==="dark")document.body.classList.add("dark");

function saveData(){localStorage.setItem("users",JSON.stringify(users));localStorage.setItem("parts",JSON.stringify(parts));localStorage.setItem("projects",JSON.stringify(projects));localStorage.setItem("orders",JSON.stringify(orders));localStorage.setItem("messages",JSON.stringify(messages))}
function toast(t){let e=document.getElementById("toast");e.innerText=t;e.classList.remove("hidden");setTimeout(()=>e.classList.add("hidden"),2200)}
function login(){
  let username=document.getElementById("loginUsername").value.trim();
  let code=document.getElementById("loginCode").value.trim().toUpperCase();
  if(!username||!code)return alert("Kullanıcı adı ve kod yaz.");
  let user=users.find(u=>u.code===code);
  if(!user)return alert("Kod bulunamadı.");
  if(!user.active)return alert("Kod iptal edilmiş.");
  if(!user.username)user.username=username;
  if(user.username!==username)return alert("Bu kod başka kullanıcıya ait.");
  user.lastSeen=new Date().toLocaleString("tr-TR");currentUser=user;saveData();
  loginScreen.classList.add("hidden");app.classList.remove("hidden");
  welcomeTitle.innerText="Hoş geldin, "+user.username+" 👋";
  userInfo.innerText=user.username+" | "+user.role;userCodeInfo.innerText=user.code;
  adminBtn.style.display=user.role==="admin"?"block":"none";
  showPage("dashboard");toast("Giriş başarılı 🚀");
}
function logout(){location.reload()}
function showPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));document.getElementById(id).classList.remove("hidden");renderAll()}
function toggleTheme(){document.body.classList.toggle("dark");localStorage.setItem("theme",document.body.classList.contains("dark")?"dark":"light");renderAll()}

function savePart(){
  let name=partName.value.trim(); if(!name)return alert("Ürün adı boş.");
  let part={id:editingPartId||Date.now(),name,code:partCode.value.trim(),category:partCategory.value.trim(),count:+partCount.value||0,min:+partMin.value||0,box:partBox.value.trim(),shelf:partShelf.value.trim(),photo:partPhoto.value.trim(),note:partNote.value.trim()};
  editingPartId?parts=parts.map(p=>p.id===editingPartId?part:p):parts.push(part);
  editingPartId=null;clearPartForm();saveData();renderAll();toast("Ürün kaydedildi");
}
function editPart(id){let p=parts.find(x=>x.id===id);if(!p)return;editingPartId=id;partName.value=p.name;partCode.value=p.code||"";partCategory.value=p.category||"";partCount.value=p.count;partMin.value=p.min;partBox.value=p.box||"";partShelf.value=p.shelf||"";partPhoto.value=p.photo||"";partNote.value=p.note||"";showPage("stock")}
function deletePart(id){if(confirm("Silinsin mi?")){parts=parts.filter(p=>p.id!==id);saveData();renderAll()}}
function clearPartForm(){editingPartId=null;["partName","partCode","partCategory","partCount","partMin","partBox","partShelf","partPhoto","partNote"].forEach(id=>document.getElementById(id).value="")}

function addProject(){if(!projectName.value.trim())return alert("Proje adı yaz.");projects.push({id:Date.now(),name:projectName.value.trim(),status:projectStatus.value,parts:projectParts.value.trim(),note:projectNote.value.trim()});projectName.value=projectParts.value=projectNote.value="";saveData();renderAll()}
function changeProjectStatus(id,status){let p=projects.find(x=>x.id===id);if(p){p.status=status;saveData();renderAll()}}
function deleteProject(id){projects=projects.filter(p=>p.id!==id);saveData();renderAll()}

function addOrder(){if(!orderName.value.trim())return alert("Ürün adı yaz.");orders.push({id:Date.now(),name:orderName.value.trim(),count:+orderCount.value||0,price:+orderPrice.value||0,link:orderLink.value.trim(),status:orderStatus.value});["orderName","orderCount","orderPrice","orderLink"].forEach(id=>document.getElementById(id).value="");saveData();renderAll()}
function changeOrderStatus(id,status){let o=orders.find(x=>x.id===id);if(o){o.status=status;saveData();renderAll()}}
function deleteOrder(id){orders=orders.filter(o=>o.id!==id);saveData();renderAll()}

function sendMessage(){let text=messageText.value.trim(),type=messageType.value,to=messageTo.value.trim();if(!text)return;if(type==="private"&&!to)return alert("Kullanıcı adı yaz.");messages.push({id:Date.now(),user:currentUser.username,to,type,text,date:new Date().toLocaleString("tr-TR")});messageText.value="";saveData();renderAll()}
function deleteMessage(id){messages=messages.filter(m=>m.id!==id);saveData();renderAll()}
function cancelCode(code){let u=users.find(x=>x.code===code);if(u){u.active=false;saveData();renderAdmin()}}
function resetCode(code){let u=users.find(x=>x.code===code);if(u){u.username="";u.active=true;saveData();renderAdmin()}}

function getMaterialStatus(name){
  let c=name.trim().toLowerCase();
  let f=parts.find(p=>p.name.toLowerCase().includes(c)||(p.code||"").toLowerCase().includes(c));
  if(!f)return `<span class="badge bad">❌ ${name} yok</span>`;
  if(f.count<=0)return `<span class="badge bad">❌ ${name} bitti</span>`;
  if(f.count<f.min)return `<span class="badge warn">⚠️ ${name} az (${f.count})</span>`;
  return `<span class="badge ok">✅ ${name} var (${f.count})</span>`;
}
function renderProjectMaterials(p){return p.parts?p.parts.split(",").map(x=>x.trim()).filter(Boolean).map(getMaterialStatus).join(" "):"Malzeme yazılmamış."}

function askAI(){
  let q=aiInput.value.trim().toLowerCase(); if(!q)return;
  aiChat.innerHTML+=`<div class="ai-msg ai-user"><b>Sen:</b> ${aiInput.value}</div>`;
  let low=parts.filter(p=>p.count<p.min), buy=orders.filter(o=>o.status==="Alınacak");
  let answer="Bunu şöyle yapabiliriz: ";
  if(q.includes("eksik")||q.includes("az")) answer=low.length?low.map(p=>`⚠️ ${p.name} az: ${p.count}/${p.min}`).join("<br>"):"✅ Eksik/az stok görünmüyor.";
  else if(q.includes("proje")) answer=projects.length?projects.map(p=>`🛠️ ${p.name}: ${p.status}<br>${renderProjectMaterials(p)}`).join("<hr>"):"Henüz proje yok.";
  else if(q.includes("sipariş")||q.includes("sepet")) answer=buy.length?buy.map(o=>`🛒 ${o.name} - ${o.count} adet`).join("<br>"):"Sepette ürün yok.";
  else if(q.includes("harcama")) answer=`💸 Toplam: ${orders.reduce((s,o)=>s+o.price*o.count,0)} TL`;
  else answer="Ben şu an yerel çalışan basit AI'yim. Eksik stok, proje, sipariş ve harcama analizi yapabilirim.";
  aiChat.innerHTML+=`<div class="ai-msg"><b>AtölyeAI:</b><br>${answer}</div>`;
  aiInput.value="";
}

function renderAll(){renderDashboard();renderStock();renderProjects();renderOrders();renderMessages();renderReports();if(currentUser&&currentUser.role==="admin")renderAdmin()}
function renderDashboard(){
  let low=parts.filter(p=>p.count<p.min), active=projects.filter(p=>p.status!=="Bitti"), pending=orders.filter(o=>o.status!=="Teslim edildi"&&o.status!=="İptal edildi");
  let cart=orders.filter(o=>o.status==="Alınacak").reduce((s,o)=>s+o.price*o.count,0);
  let delivered=orders.filter(o=>o.status==="Teslim edildi").reduce((s,o)=>s+o.price*o.count,0);
  let waiting=pending.reduce((s,o)=>s+o.price*o.count,0);
  totalProducts.innerText=parts.length;lowStockCount.innerText=low.length;activeProjectCount.innerText=active.length;pendingOrderCount.innerText=pending.length;totalSpend.innerText=(cart+delivered+waiting)+" TL";
  cartTotal.innerText=cart+" TL";deliveredTotal.innerText=delivered+" TL";waitingTotal.innerText=waiting+" TL";drawChart(cart,delivered,waiting);
  notifications.innerHTML=low.length?low.slice(0,5).map(p=>`<p>⚠️ ${p.name} az.</p>`).join(""):"<p>✅ Bildirim yok.</p>";
  buyList.innerHTML=orders.filter(o=>o.status==="Alınacak").slice(0,5).map(o=>`<p>🛒 ${o.name} - ${o.count} adet</p>`).join("")||"<p>✅ Alınacak yok.</p>";
  stockMini.innerHTML=parts.slice(-4).reverse().map(p=>`<p>🔧 ${p.name} — ${p.count}</p>`).join("")||"<p>Ürün yok.</p>";
  projectMini.innerHTML=active.slice(0,3).map(p=>`<p>🛠️ ${p.name} — ${p.status}</p>`).join("")||"<p>Aktif proje yok.</p>";
  activeUsers.innerHTML=users.filter(u=>u.username&&u.active).slice(0,8).map(u=>`<p>🟢 ${u.username}<br><small>${u.lastSeen}</small></p>`).join("");
  lastMessages.innerHTML=messages.slice(-5).reverse().map(m=>`<p>💬 <b>${m.user}</b>: ${m.text}</p>`).join("")||"<p>Mesaj yok.</p>";
  if(currentUser){accountName.innerText=currentUser.username;accountRole.innerText=currentUser.role==="admin"?"👑 Admin":"👤 Üye";accountLastSeen.innerText="Son giriş: "+currentUser.lastSeen}
}
function renderStock(){stockList.innerHTML=parts.length?parts.map(p=>`<div class="item">${p.photo?`<img class="product-img" src="${p.photo}">`:""}<div class="item-text"><b>🔧 ${p.name}</b><br>🏷️ ${p.code||"-"}<br>📁 ${p.category||"-"}<br>📦 ${p.count} | ⚠️ ${p.min}<br>🗃️ ${p.box||"-"} / ${p.shelf||"-"}<br>📝 ${p.note||"-"}</div><div><button class="small-btn success" onclick="editPart(${p.id})">✏️ Düzenle</button><button class="small-btn danger" onclick="deletePart(${p.id})">🗑️ Sil</button></div></div>`).join(""):"<p>📦 Ürün yok.</p>"}
function renderProjects(){projectList.innerHTML=projects.length?projects.map(p=>`<div class="item"><div class="item-text"><b>🛠️ ${p.name}</b><br>Durum: ${p.status}<br>Not: ${p.note||"-"}<div class="project-materials"><b>Malzeme:</b><br>${renderProjectMaterials(p)}</div></div><div><select onchange="changeProjectStatus(${p.id},this.value)"><option ${p.status==="Planlandı"?"selected":""}>Planlandı</option><option ${p.status==="Devam ediyor"?"selected":""}>Devam ediyor</option><option ${p.status==="Bitti"?"selected":""}>Bitti</option></select><button class="small-btn danger" onclick="deleteProject(${p.id})">🗑️ Sil</button></div></div>`).join(""):"<p>🛠️ Proje yok.</p>"}
function renderOrders(){orderList.innerHTML=orders.length?orders.map(o=>`<div class="item"><div class="item-text"><b>🛒 ${o.name}</b><br>🔢 ${o.count}<br>💸 Birim: ${o.price} TL<br>🧾 Toplam: ${o.price*o.count} TL<br>🚚 ${o.status}<br>🔗 ${o.link?`<a href="${o.link}" target="_blank">Aç</a>`:"-"}</div><div><select onchange="changeOrderStatus(${o.id},this.value)"><option ${o.status==="Alınacak"?"selected":""}>Alınacak</option><option ${o.status==="Sipariş verildi"?"selected":""}>Sipariş verildi</option><option ${o.status==="Kargoda"?"selected":""}>Kargoda</option><option ${o.status==="Teslim edildi"?"selected":""}>Teslim edildi</option><option ${o.status==="İptal edildi"?"selected":""}>İptal edildi</option></select><button class="small-btn danger" onclick="deleteOrder(${o.id})">🗑️ Sil</button></div></div>`).join(""):"<p>🛒 Sipariş yok.</p>"}
function renderMessages(){let visible=messages.filter(m=>m.type==="general"||m.user===currentUser?.username||m.to===currentUser?.username||currentUser?.role==="admin");messageList.innerHTML=visible.length?visible.map(m=>`<div class="item ${m.type==="private"?"private-bubble":"message-bubble"}"><div class="item-text"><b>👤 ${m.user}</b> ${m.type==="private"?`➡️ <b>${m.to}</b>`:"🌍 Genel"} <small>🕒 ${m.date}</small><br>💬 ${m.text}</div>${currentUser?.role==="admin"?`<button class="small-btn danger" onclick="deleteMessage(${m.id})">🗑️ Sil</button>`:""}</div>`).join(""):"<p>💬 Mesaj yok.</p>"}
function renderReports(){
  let cats={};parts.forEach(p=>cats[p.category||"Diğer"]=(cats[p.category||"Diğer"]||0)+1);
  categoryReport.innerHTML=Object.keys(cats).map(k=>`<p>📁 ${k}: <b>${cats[k]}</b></p>`).join("")||"<p>Rapor yok.</p>";
  orderReport.innerHTML=`<p>🧾 Toplam sipariş: <b>${orders.length}</b></p><p>💸 Toplam tutar: <b>${orders.reduce((s,o)=>s+o.price*o.count,0)} TL</b></p>`;
}
function renderAdmin(){let search=searchCode.value.trim().toUpperCase();let list=search?users.filter(u=>u.code.includes(search)||u.username.toUpperCase().includes(search)):users.slice(0,50);codeList.innerHTML=list.map(u=>`<div class="item"><div class="item-text"><b>${u.code}</b><br>Kullanıcı: ${u.username||"Boşta"}<br>Rol: ${u.role}<br>Son giriş: ${u.lastSeen}<br>Durum: ${u.active?"Aktif":"İptal"}</div>${u.role!=="admin"?`<div><button class="small-btn danger" onclick="cancelCode('${u.code}')">İptal</button><button class="small-btn success" onclick="resetCode('${u.code}')">Sıfırla</button></div>`:""}</div>`).join("")}
function drawChart(cart,delivered,waiting){
  let c=document.getElementById("spendChart");if(!c)return;let ctx=c.getContext("2d"),w=c.width=c.offsetWidth,h=c.height=180;ctx.clearRect(0,0,w,h);
  let arr=[["Sepet",cart,"#2563eb"],["Teslim",delivered,"#22c55e"],["Bekleyen",waiting,"#f59e0b"]],max=Math.max(cart,delivered,waiting,1),bw=w/3-35;
  arr.forEach((a,i)=>{let x=i*(bw+35)+20,bh=a[1]/max*105,y=h-bh-35;ctx.fillStyle=a[2];ctx.roundRect(x,y,bw,bh,12);ctx.fill();ctx.fillStyle=document.body.classList.contains("dark")?"#fff":"#111827";ctx.font="bold 13px Arial";ctx.fillText(a[0],x,h-12);ctx.fillText(a[1]+" TL",x,y-8)})
}
function checkStock(){
  const text = document.getElementById("stockSearchInput").value.trim().toLowerCase();
  const result = document.getElementById("stockCheckResult");

  if(!text){
    result.innerHTML = "<p>Önce ürün adı veya kod yaz.</p>";
    return;
  }

  const found = parts.filter(p =>
    p.name.toLowerCase().includes(text) ||
    (p.code || "").toLowerCase().includes(text) ||
    (p.category || "").toLowerCase().includes(text)
  );

  if(found.length === 0){
    result.innerHTML = `
      <div class="item">
        <div class="item-text">
          ❌ Ürün bulunamadı.<br>
          İstersen bunu sipariş listesine ekleyebilirsin.
        </div>
      </div>
    `;
    return;
  }

  result.innerHTML = found.map(p => {
    let status = "✅ Stok yeterli";
    let badgeClass = "ok";

    if(p.count <= 0){
      status = "❌ Stok bitti";
      badgeClass = "bad";
    } else if(p.count < p.min){
      status = "⚠️ Minimum stok altında";
      badgeClass = "warn";
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
          <span class="badge ${badgeClass}">${status}</span>
        </div>
      </div>
    `;
  }).join("");
}
