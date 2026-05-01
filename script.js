let currentUser=null, editingPartId=null;
const $=id=>document.getElementById(id);
const defaultPhoto="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' rx='50' fill='%237c3aed'/%3E%3Ctext x='50' y='60' font-size='42' text-anchor='middle' fill='white'%3EA%3C/text%3E%3C/svg%3E";

let users=JSON.parse(localStorage.getItem("dp_users"));
if(!users){
  users=[{username:"Admin",code:"ADMIN-0001",pin:"",role:"admin",active:true,online:false,lastSeen:"-",photo:defaultPhoto,device:"-",friends:[],requests:[]}];
  for(let i=1;i<=9999;i++){
    users.push({username:"",code:"ATLY-"+String(i).padStart(4,"0"),pin:"",role:"user",active:true,online:false,lastSeen:"-",photo:defaultPhoto,device:"-",friends:[],requests:[]});
  }
}

let categories=JSON.parse(localStorage.getItem("dp_categories"))||["Elektronik","Mekanik","Kıyafet","Sensör","Motor","Kablolar","Kartlar","Diğer"];
let locations=JSON.parse(localStorage.getItem("dp_locations"))||["A1 - 01","B2 - 03","C1 - 02","D1 - 01"];
let parts=JSON.parse(localStorage.getItem("dp_parts"))||[];
let projects=JSON.parse(localStorage.getItem("dp_projects"))||[];
let orders=JSON.parse(localStorage.getItem("dp_orders"))||[];
let messages=JSON.parse(localStorage.getItem("dp_messages"))||[];
let exchanges=JSON.parse(localStorage.getItem("dp_exchanges"))||[];
let updateInfo=JSON.parse(localStorage.getItem("dp_update"))||{version:"v1.0",message:"DepoPanel AI aktif edildi."};

function save(){
  localStorage.setItem("dp_users",JSON.stringify(users));
  localStorage.setItem("dp_categories",JSON.stringify(categories));
  localStorage.setItem("dp_locations",JSON.stringify(locations));
  localStorage.setItem("dp_parts",JSON.stringify(parts));
  localStorage.setItem("dp_projects",JSON.stringify(projects));
  localStorage.setItem("dp_orders",JSON.stringify(orders));
  localStorage.setItem("dp_messages",JSON.stringify(messages));
  localStorage.setItem("dp_exchanges",JSON.stringify(exchanges));
  localStorage.setItem("dp_update",JSON.stringify(updateInfo));
}
save();

window.onload=()=>{
  renderOptions();
  const session=JSON.parse(localStorage.getItem("dp_session")||"null");
  if(session){
    $("loginUsername").value=session.username;
    $("loginCode").value=session.code;
    $("rememberMe").checked=true;
  }
};

function toast(t){
  $("toast").innerText=t;
  $("toast").classList.remove("hidden");
  setTimeout(()=>$("toast").classList.add("hidden"),2200);
}

function deviceInfo(){
  return navigator.userAgent+" | "+screen.width+"x"+screen.height;
}

function login(){
  const username=$("loginUsername").value.trim();
  const code=$("loginCode").value.trim().toUpperCase();
  const pin=$("loginPin").value;

  if(!username||!code)return alert("Kullanıcı adı ve kod yaz.");

  const user=users.find(u=>u.code===code);
  if(!user)return alert("Kod bulunamadı.");
  if(!user.active)return alert("Bu kod iptal edilmiş.");

  if(!user.username)user.username=username;
  if(user.username!==username)return alert("Bu kod başka kullanıcıya ait.");

  if(user.pin && user.pin!==pin)return alert("PIN yanlış.");
  if(!user.pin && pin)user.pin=pin;

  user.online=true;
  user.lastSeen=new Date().toLocaleString("tr-TR");
  user.device=deviceInfo();

  currentUser=user;

  if($("rememberMe").checked)localStorage.setItem("dp_session",JSON.stringify({username:user.username,code:user.code}));
  else localStorage.removeItem("dp_session");

  save();

  $("loginScreen").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("adminBtn").style.display=user.role==="admin"?"block":"none";

  renderAll();
  showPage("dashboard");
  showUpdate();
  toast("Giriş başarılı");
}

function logout(){
  if(currentUser){
    const u=users.find(x=>x.code===currentUser.code);
    if(u)u.online=false;
    save();
  }
  localStorage.removeItem("dp_session");
  location.reload();
}

function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  $(id).classList.remove("hidden");
  renderAll();
}

function showUpdate(){
  const key="seen_"+currentUser.code;
  if(localStorage.getItem(key)!==updateInfo.version){
    $("updateTitle").innerText=updateInfo.version;
    $("updateDesc").innerText=updateInfo.message;
    $("updatePopup").classList.remove("hidden");
  }
}

function closeUpdatePopup(){
  localStorage.setItem("seen_"+currentUser.code,updateInfo.version);
  $("updatePopup").classList.add("hidden");
}

function renderOptions(){
  if($("partCategory"))$("partCategory").innerHTML=categories.map(c=>`<option>${c}</option>`).join("");
  if($("stockSearchCategory"))$("stockSearchCategory").innerHTML=`<option value="">Tüm Kategoriler</option>`+categories.map(c=>`<option>${c}</option>`).join("");
}

function myParts(){return currentUser?.role==="admin"?parts:parts.filter(p=>p.owner===currentUser.code)}

function addCategory(){
  const n=$("categoryName").value.trim();
  if(!n)return;
  if(categories.includes(n))return alert("Bu kategori var.");
  categories.push(n);
  $("categoryName").value="";
  save();renderAll();toast("Kategori eklendi");
}

function deleteCategory(n){
  categories=categories.filter(c=>c!==n);
  parts=parts.map(p=>p.category===n?{...p,category:"Diğer"}:p);
  save();renderAll();
}

function addLocation(){
  const n=$("locationName").value.trim();
  if(!n)return;
  if(locations.includes(n))return alert("Bu reyon var.");
  locations.push(n);
  $("locationName").value="";
  save();renderAll();toast("Reyon eklendi");
}

function deleteLocation(n){
  locations=locations.filter(l=>l!==n);
  save();renderAll();
}

function savePart(){
  const name=$("partName").value.trim();
  if(!name)return alert("Malzeme adı yaz.");

  const p={
    id:editingPartId||Date.now(),
    owner:currentUser.code,
    name,
    code:$("partCode").value.trim(),
    category:$("partCategory").value,
    location:$("partLocation").value.trim(),
    count:+$("partCount").value||0,
    min:+$("partMin").value||0,
    value:+$("partValue").value||0,
    photo:$("partPhoto").value.trim(),
    note:$("partNote").value.trim()
  };

  if(editingPartId)parts=parts.map(x=>x.id===editingPartId?p:x);
  else parts.push(p);

  editingPartId=null;
  clearPartForm();
  save();renderAll();toast("Malzeme kaydedildi");
}

function editPart(id){
  const p=parts.find(x=>x.id===id);
  if(!p)return;
  editingPartId=id;
  $("partName").value=p.name;
  $("partCode").value=p.code||"";
  $("partCategory").value=p.category||"Diğer";
  $("partLocation").value=p.location||"";
  $("partCount").value=p.count||0;
  $("partMin").value=p.min||0;
  $("partValue").value=p.value||0;
  $("partPhoto").value=p.photo||"";
  $("partNote").value=p.note||"";
  showPage("stock");
}

function deletePart(id){
  if(!confirm("Silinsin mi?"))return;
  parts=parts.filter(p=>p.id!==id);
  save();renderAll();
}

function clearPartForm(){
  editingPartId=null;
  ["partName","partCode","partLocation","partCount","partMin","partValue","partPhoto","partNote"].forEach(id=>$(id).value="");
}

function statusOf(p){
  if(p.count<=0)return ["Eksik","bad"];
  if(p.count<p.min)return ["Az Kaldı","warn"];
  return ["Yeterli","ok"];
}

function stockCard(p,withActions=false){
  const [st,cls]=statusOf(p);
  return `<div class="item">
    ${p.photo?`<img class="product-img" src="${p.photo}">`:""}
    <div class="item-text">
      <b>${p.name}</b><br>
      Kod: ${p.code||"-"} | Kategori: ${p.category}<br>
      Reyon: ${p.location||"-"} | Adet: ${p.count}<br>
      Değer: ${p.value} TL | <span class="badge ${cls}">${st}</span>
    </div>
    ${withActions?`<div><button class="small-btn success" onclick="editPart(${p.id})">Düzenle</button><button class="small-btn danger" onclick="deletePart(${p.id})">Sil</button></div>`:""}
  </div>`;
}

function checkStock(){
  const q=$("stockSearchInput").value.trim().toLowerCase();
  const cat=$("stockSearchCategory").value;
  const found=myParts().filter(p=>{
    const text=!q||p.name.toLowerCase().includes(q)||(p.code||"").toLowerCase().includes(q)||(p.category||"").toLowerCase().includes(q)||(p.location||"").toLowerCase().includes(q);
    const c=!cat||p.category===cat;
    return text&&c;
  });
  $("stockCheckResult").innerHTML=found.length?found.map(p=>stockCard(p)).join(""):"<div class='item'>Sonuç bulunamadı.</div>";
}

function clearStockCheck(){
  $("stockSearchInput").value="";
  $("stockSearchCategory").value="";
  $("stockCheckResult").innerHTML="";
}

function addProject(){
  if(!$("projectName").value.trim())return;
  projects.push({id:Date.now(),owner:currentUser.code,name:$("projectName").value.trim(),status:$("projectStatus").value,parts:$("projectParts").value.trim(),note:$("projectNote").value.trim()});
  $("projectName").value=$("projectParts").value=$("projectNote").value="";
  save();renderAll();
}

function changeProjectStatus(id,s){
  const p=projects.find(x=>x.id===id);
  if(p){p.status=s;save();renderAll();}
}

function deleteProject(id){
  projects=projects.filter(p=>p.id!==id);
  save();renderAll();
}

function addOrder(){
  if(!$("orderName").value.trim())return;
  orders.push({id:Date.now(),owner:currentUser.code,name:$("orderName").value.trim(),count:+$("orderCount").value||0,price:+$("orderPrice").value||0,link:$("orderLink").value.trim(),status:$("orderStatus").value});
  ["orderName","orderCount","orderPrice","orderLink"].forEach(id=>$(id).value="");
  save();renderAll();
}

function changeOrderStatus(id,s){
  const o=orders.find(x=>x.id===id);
  if(o){o.status=s;save();renderAll();}
}

function deleteOrder(id){
  orders=orders.filter(o=>o.id!==id);
  save();renderAll();
}

function sendMessage(){
  const text=$("messageText").value.trim();
  const type=$("messageType").value;
  const to=$("messageTo").value.trim();

  if(!text)return;
  if(type==="private"&&!to)return alert("Kullanıcı adı yaz.");

  messages.push({id:Date.now(),user:currentUser.username,to,type,text,date:new Date().toLocaleString("tr-TR")});
  $("messageText").value="";
  save();renderAll();
}

function deleteMessage(id){
  messages=messages.filter(m=>m.id!==id);
  save();renderAll();
}

function saveProfile(){
  const n=$("profileName").value.trim();
  const pin=$("profilePin").value;
  const photo=$("profilePhoto").value.trim();

  if(n)currentUser.username=n;
  if(pin)currentUser.pin=pin;
  if(photo)currentUser.photo=photo;

  const u=users.find(x=>x.code===currentUser.code);
  Object.assign(u,currentUser);
  save();renderAll();toast("Profil güncellendi");
}

function sendFriendRequest(){
  const target=users.find(u=>u.username===$("friendName").value.trim());
  if(!target||target.code===currentUser.code)return alert("Kullanıcı bulunamadı.");
  target.requests=target.requests||[];
  if(!target.requests.includes(currentUser.code))target.requests.push(currentUser.code);
  save();renderAll();toast("İstek gönderildi");
}

function acceptFriend(code){
  const me=users.find(u=>u.code===currentUser.code);
  const other=users.find(u=>u.code===code);
  me.requests=(me.requests||[]).filter(x=>x!==code);
  me.friends=[...new Set([...(me.friends||[]),code])];
  other.friends=[...new Set([...(other.friends||[]),me.code])];
  save();renderAll();
}

function sendExchangeRequest(){
  const toUser=users.find(u=>u.username===$("exchangeTo").value.trim());
  if(!toUser)return alert("Kullanıcı yok.");
  exchanges.push({id:Date.now(),from:currentUser.code,to:toUser.code,type:$("exchangeType").value,want:$("exchangeWant").value,offer:$("exchangeOffer").value,status:"Bekliyor"});
  save();renderAll();toast("İstek gönderildi");
}

function setExchange(id,status){
  const e=exchanges.find(x=>x.id===id);
  if(e){e.status=status;save();renderAll();}
}

function publishUpdate(){
  if(currentUser.role!=="admin")return;
  updateInfo={version:$("updateVersionInput").value||("v"+Date.now()),message:$("updateMessageInput").value||"Sistem güncellendi."};
  save();toast("Duyuru yayınlandı");
}

function askAI(){
  const q=$("aiInput").value.toLowerCase();
  $("aiChat").innerHTML+=`<div class="ai-msg"><b>Sen:</b> ${$("aiInput").value}</div>`;

  let ans="Stok, proje, sipariş, arkadaş ve takas analizi yapabilirim.";
  const mp=myParts();
  const low=mp.filter(p=>p.count<p.min);

  if(q.includes("eksik")||q.includes("az"))ans=low.length?low.map(p=>`${p.name}: ${p.count}/${p.min}`).join("<br>"):"Az stok yok.";
  else if(q.includes("kategori"))ans=categories.map(c=>`${c}: ${mp.filter(p=>p.category===c).length}`).join("<br>");
  else if(q.includes("proje"))ans=projects.filter(p=>p.owner===currentUser.code).map(p=>`${p.name}: ${p.status}`).join("<br>")||"Proje yok.";
  else if(q.includes("harcama"))ans="Toplam: "+orders.filter(o=>o.owner===currentUser.code).reduce((s,o)=>s+o.price*o.count,0)+" TL";

  $("aiChat").innerHTML+=`<div class="ai-msg"><b>AI:</b><br>${ans}</div>`;
  $("aiInput").value="";
}

function quickAI(q){
  $("miniAiChat").innerHTML=`<p>${q}</p>`;
  showPage("ai");
  $("aiInput").value=q;
  askAI();
}

function getMaterialStatus(n){
  const f=myParts().find(p=>p.name.toLowerCase().includes(n.trim().toLowerCase()));
  if(!f)return `<span class="badge bad">${n} yok</span>`;
  if(f.count<f.min)return `<span class="badge warn">${n} az</span>`;
  return `<span class="badge ok">${n} var</span>`;
}

function renderProjectMaterials(p){
  return p.parts?p.parts.split(",").map(x=>x.trim()).filter(Boolean).map(getMaterialStatus).join(" "):"-";
}

function globalSearchRun(){
  const q=$("globalSearch").value.trim().toLowerCase();
  if(!q)return;
  showPage("stockCheck");
  $("stockSearchInput").value=q;
  checkStock();
}

function renderAll(){
  renderOptions();
  renderDashboard();
  renderStock();
  renderCategories();
  renderLocations();
  renderProjects();
  renderOrders();
  renderMessages();
  renderFriends();
  renderExchange();
  renderReports();
  if(currentUser?.role==="admin")renderAdmin();
}

function renderDashboard(){
  const mp=myParts();
  const low=mp.filter(p=>p.count<p.min);
  const missing=mp.filter(p=>p.count<=0);
  const po=projects.filter(p=>currentUser.role==="admin"||p.owner===currentUser.code);
  const oo=orders.filter(o=>currentUser.role==="admin"||o.owner===currentUser.code);

  const cart=oo.filter(o=>o.status==="Alınacak").reduce((s,o)=>s+o.price*o.count,0);
  const del=oo.filter(o=>o.status==="Teslim edildi").reduce((s,o)=>s+o.price*o.count,0);
  const wait=oo.filter(o=>o.status!=="Teslim edildi"&&o.status!=="İptal edildi").reduce((s,o)=>s+o.price*o.count,0);
  const value=mp.reduce((s,p)=>s+p.value*p.count,0);

  $("totalProducts").innerText=mp.length;
  $("lowStockCount").innerText=low.length;
  $("missingCount").innerText=missing.length;
  $("totalSpend").innerText=value+" TL";
  $("cartTotal").innerText=cart+" TL";
  $("deliveredTotal").innerText=del+" TL";
  $("waitingTotal").innerText=wait+" TL";
  drawChart(cart,del,wait);

  $("dashboardStockTable").innerHTML=renderTable(mp.slice(0,6));
  $("notifications").innerHTML=low.map(p=>`<p>${p.name} az kaldı.</p>`).join("")||"<p>Duyuru yok.</p>";
  $("projectMini").innerHTML=po.slice(0,3).map(p=>`<p>${p.name} - ${p.status}</p>`).join("")||"<p>Proje yok.</p>";
  $("activeUsers").innerHTML=users.filter(u=>u.username&&u.online).map(u=>`<p>🟢 ${u.username}<br><small>${u.lastSeen}</small></p>`).join("")||"<p>Aktif kullanıcı yok.</p>";
  $("lastMessages").innerHTML=messages.slice(-5).map(m=>`<p><b>${m.user}</b>: ${m.text}</p>`).join("")||"<p>Mesaj yok.</p>";

  $("welcomeTitle").innerText="Hoş geldin, "+currentUser.username;
  $("userInfo").innerText=currentUser.username+" | "+currentUser.role;
  $("userCodeInfo").innerText=currentUser.code;
  $("sideUser").innerText=currentUser.username;
  $("sideRole").innerText=currentUser.role;
  $("miniPhoto").src=currentUser.photo||defaultPhoto;
  $("accountPhoto").src=currentUser.photo||defaultPhoto;
  $("accountName").innerText=currentUser.username;
  $("accountRole").innerText=currentUser.role;
  $("accountLastSeen").innerText=currentUser.lastSeen;
}

function renderTable(arr){
  if(!arr.length)return "<p>Malzeme yok.</p>";
  return `<div class="table-row table-head"><span>Foto</span><span>Malzeme</span><span>Kategori</span><span>Reyon</span><span>Adet</span><span>Durum</span><span>İşlem</span></div>`+
  arr.map(p=>{
    const [s,c]=statusOf(p);
    return `<div class="table-row">
      <span>${p.photo?`<img class="product-img" src="${p.photo}">`:"-"}</span>
      <span>${p.name}</span>
      <span><span class="badge">${p.category}</span></span>
      <span>${p.location||"-"}</span>
      <span>${p.count}</span>
      <span><span class="badge ${c}">${s}</span></span>
      <span><button class="small-btn" onclick="editPart(${p.id})">✎</button></span>
    </div>`;
  }).join("");
}

function renderStock(){
  $("stockList").innerHTML=myParts().length?myParts().map(p=>stockCard(p,true)).join(""):"<p>Malzeme yok.</p>";
}

function renderCategories(){
  $("categoryList").innerHTML=categories.map(c=>`<div class="item"><div><b>${c}</b><br>${myParts().filter(p=>p.category===c).length} malzeme</div><button class="small-btn danger" onclick="deleteCategory('${c}')">Sil</button></div>`).join("");
}

function renderLocations(){
  $("locationList").innerHTML=locations.map(l=>`<div class="item"><div><b>${l}</b></div><button class="small-btn danger" onclick="deleteLocation('${l}')">Sil</button></div>`).join("");
}

function renderProjects(){
  const arr=projects.filter(p=>currentUser.role==="admin"||p.owner===currentUser.code);
  $("projectList").innerHTML=arr.length?arr.map(p=>`<div class="item"><div class="item-text"><b>${p.name}</b><br>${p.status}<div class="project-materials">${renderProjectMaterials(p)}</div></div><div><select onchange="changeProjectStatus(${p.id},this.value)"><option ${p.status==="Planlandı"?"selected":""}>Planlandı</option><option ${p.status==="Devam ediyor"?"selected":""}>Devam ediyor</option><option ${p.status==="Bitti"?"selected":""}>Bitti</option></select><button class="small-btn danger" onclick="deleteProject(${p.id})">Sil</button></div></div>`).join(""):"<p>Proje yok.</p>";
}

function renderOrders(){
  const arr=orders.filter(o=>currentUser.role==="admin"||o.owner===currentUser.code);
  $("orderList").innerHTML=arr.length?arr.map(o=>`<div class="item"><div><b>${o.name}</b><br>${o.count} x ${o.price} TL = ${o.count*o.price} TL<br>${o.status}</div><div><select onchange="changeOrderStatus(${o.id},this.value)"><option ${o.status==="Alınacak"?"selected":""}>Alınacak</option><option ${o.status==="Sipariş verildi"?"selected":""}>Sipariş verildi</option><option ${o.status==="Kargoda"?"selected":""}>Kargoda</option><option ${o.status==="Teslim edildi"?"selected":""}>Teslim edildi</option><option ${o.status==="İptal edildi"?"selected":""}>İptal edildi</option></select><button class="small-btn danger" onclick="deleteOrder(${o.id})">Sil</button></div></div>`).join(""):"<p>Sipariş yok.</p>";
}

function renderMessages(){
  const arr=messages.filter(m=>m.type==="general"||m.user===currentUser.username||m.to===currentUser.username||currentUser.role==="admin");
  $("messageList").innerHTML=arr.length?arr.map(m=>`<div class="item ${m.type==="private"?"private-bubble":"message-bubble"}"><div><b>${m.user}</b> ${m.type==="private"?"→ "+m.to:""}<br>${m.text}</div>${currentUser.role==="admin"?`<button class="small-btn danger" onclick="deleteMessage(${m.id})">Sil</button>`:""}</div>`).join(""):"<p>Mesaj yok.</p>";
}

function renderFriends(){
  const me=users.find(u=>u.code===currentUser.code);
  $("friendList").innerHTML=(me.friends||[]).map(c=>users.find(u=>u.code===c)).filter(Boolean).map(u=>`<p><b>${u.username}</b> (${u.code})</p>`).join("")||"<p>Arkadaş yok.</p>";
  $("friendRequests").innerHTML=(me.requests||[]).map(c=>{let u=users.find(x=>x.code===c);return `<div class="item"><span>${u?.username||c}</span><button class="small-btn success" onclick="acceptFriend('${c}')">Kabul Et</button></div>`}).join("")||"<p>İstek yok.</p>";
  $("friendInventories").innerHTML=(me.friends||[]).map(c=>{let u=users.find(x=>x.code===c),inv=parts.filter(p=>p.owner===c);return `<div class="item"><div><b>${u?.username}</b><br>${inv.map(p=>p.name+" ("+p.count+")").join(", ")||"Envanter boş"}</div></div>`}).join("");
}

function renderExchange(){
  $("exchangeList").innerHTML=exchanges.filter(e=>e.from===currentUser.code||e.to===currentUser.code||currentUser.role==="admin").map(e=>{
    let f=users.find(u=>u.code===e.from),t=users.find(u=>u.code===e.to);
    return `<div class="item"><div><b>${e.type}</b><br>${f?.username} → ${t?.username}<br>İstenen: ${e.want}<br>Teklif: ${e.offer}<br>Durum: ${e.status}</div>${e.to===currentUser.code?`<div><button class="small-btn success" onclick="setExchange(${e.id},'Kabul')">Kabul</button><button class="small-btn danger" onclick="setExchange(${e.id},'Red')">Red</button></div>`:""}</div>`;
  }).join("")||"<p>İstek yok.</p>";
}

function renderReports(){
  $("categoryReport").innerHTML=categories.map(c=>`<p>${c}: ${myParts().filter(p=>p.category===c).length}</p>`).join("");
  $("orderReport").innerHTML=`<p>Toplam sipariş: ${orders.length}</p>`;
}

function renderAdmin(){
  const s=$("searchCode").value.trim().toUpperCase();
  const list=s?users.filter(u=>u.code.includes(s)||u.username.toUpperCase().includes(s)):users.slice(0,100);
  $("codeList").innerHTML=list.map(u=>`<div class="item"><div><b>${u.code}</b><br>${u.username||"Boşta"} | ${u.role}<br>Aktif: ${u.online?"Evet":"Hayır"}<br>Cihaz: ${u.device||"-"}</div><div><button class="small-btn danger" onclick="cancelCode('${u.code}')">İptal</button><button class="small-btn success" onclick="resetCode('${u.code}')">Sıfırla</button></div></div>`).join("");
  $("adminInventories").innerHTML=users.filter(u=>u.username).map(u=>`<div class="item"><div><b>${u.username}</b><br>${parts.filter(p=>p.owner===u.code).map(p=>p.name+" ("+p.count+")").join(", ")||"Envanter boş"}</div></div>`).join("");
}

function cancelCode(c){let u=users.find(x=>x.code===c);if(u){u.active=false;save();renderAdmin()}}
function resetCode(c){let u=users.find(x=>x.code===c);if(u){u.username="";u.pin="";u.active=true;u.friends=[];u.requests=[];save();renderAdmin()}}

function statusOf(p){
  if(p.count<=0)return ["Eksik","bad"];
  if(p.count<p.min)return ["Az Kaldı","warn"];
  return ["Yeterli","ok"];
}

function drawChart(cart,del,wait){
  const c=$("spendChart"); if(!c)return;
  const ctx=c.getContext("2d"),w=c.width=c.offsetWidth,h=c.height=170;
  ctx.clearRect(0,0,w,h);
  const arr=[["Sepet",cart,"#7c3aed"],["Teslim",del,"#22c55e"],["Bekleyen",wait,"#f59e0b"]];
  const max=Math.max(cart,del,wait,1),bw=w/3-35;
  arr.forEach((a,i)=>{
    const x=i*(bw+35)+20,bh=a[1]/max*95,y=h-bh-30;
    ctx.fillStyle=a[2];ctx.roundRect(x,y,bw,bh,10);ctx.fill();
    ctx.fillStyle="#eef3ff";ctx.font="bold 12px Arial";
    ctx.fillText(a[0],x,h-8);ctx.fillText(a[1]+" TL",x,y-8);
  });
}
