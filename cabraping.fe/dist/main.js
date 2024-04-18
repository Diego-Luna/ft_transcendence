(()=>{"use strict";var e={};e.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),(()=>{var n;e.g.importScripts&&(n=e.g.location+"");var t=e.g.document;if(!n&&t&&(t.currentScript&&(n=t.currentScript.src),!n)){var a=t.getElementsByTagName("script");if(a.length)for(var s=a.length-1;s>-1&&!n;)n=a[s--].src}if(!n)throw new Error("Automatic publicPath is not supported in this browser");n=n.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^\/]+$/,"/"),e.p=n})();const n=()=>'\n    <div class="d-flex justify-content-center align-items-center p-3 bg-dark">\n        <span class="text-white">CabraPing. All rights reserved © 2023</span>\n    </div>\n  ',t=e.p+"f98c465cdaa51319739eadd988c0a8eb.png";function a(e,n){const t=document.getElementById("notification-container"),a=document.createElement("div");a.classList.add("text-white","p-2","rounded-3","m-2","shadow","d-inline-block","notification"),"success"===n?a.classList.add("bg-success"):a.classList.add("bg-danger"),a.textContent=e,t.appendChild(a),setTimeout((()=>{t.removeChild(a)}),3e3)}function s(){const e=localStorage.getItem("jwt");return e||(window.location.replace("/#auth"),null)}function i(){s();return'\n    <div class="container-sm min-vh-100">\n      <h2>List of Users</h2>\n      <ul id="users-list" class="list-group">\n        \x3c!-- userData --\x3e\n      </ul>\n    </div>\n  '}const o="http://localhost:8000";let r=[],l=[];const c=e.p+"bfdb41f3a4dfb0f1bc4688b51ebe9838.svg";let d=null;let u={};const m="http://localhost:8000";let h={},f=[];async function g(){s();const e=document.getElementById("friends-list");return e.innerHTML="",f=h.friends,Array.isArray(f)?f.length<=0?(e.innerHTML="<p>No friends yet</p>",null):void(e.innerHTML=f.map((e=>`<li id="${e.id}" class="list-group-item d-flex gap-4 align-items-center">\n  <h3>${e.username}</h3>\n</li>`)).join("")):null}async function p(){const e=s(),n=document.getElementById("friend-requests-list");n.innerHTML="";const t=await fetch(`${m}/api/friend_requests/me`,{headers:{Authorization:`Bearer ${e}`}});if(f=await t.json(),f=f.filter((e=>{if(e.to_user.id===h.id)return e})),f.length<=0)return n.innerHTML="<p>No Friend Requests Yet</p>",null;const a=f.map((e=>`<li id="${e.id}" class="list-group-item d-flex gap-4 align-items-center">\n    <h3>${e.from_user.username}</h3>\n    <div className="d-flex gap-4">\n      <button\n        type="button"\n        class="btn btn-sm btn-primary"\n        data-action="confirm"\n        data-id="${e.id}">Confirm</button>\n      <button\n        type="button"\n        class="btn btn-sm btn-secondary "\n        data-action="delete"\n        data-id="${e.id}">Delete</button>\n    </div>\n  </li>`)).join("");n.innerHTML=a}const y=()=>location.hash.slice(1).toLocaleLowerCase().split("/")[1]||"/",v="http://localhost:8000";let b,w={},x=[],E="default",L=null,B=-1,$="general",C="general",I=null;async function S(){const e=localStorage.getItem("jwt");if(!e)return void(window.location.href="/#");const n=e.split(".")[1],t=JSON.parse(atob(n));B=t.user_id;let a=y();$=a,"/"!=a&&(L=a);const s=await fetch(`${v}/api/me/`,{headers:{Authorization:`Bearer ${e}`}});I=await s.json(),"user_not_found"!==I.code&&"token_not_valid"!==I.code||window.location.replace("/#logout"),E=I.username;const i=document.getElementById("addChannel");i&&i.addEventListener("click",P);const o=document.getElementById("sendButton");o&&o.addEventListener("click",j);const r=document.getElementById("saveChannelButton");r&&r.addEventListener("click",N);let l=A(e);const c=await M(l);c.length>0&&(k(c),L=c[0].id);const d=document.getElementById("channelsDropdown");d&&d.addEventListener("click",(async()=>{let e=A(localStorage.getItem("jwt"));k(await M(e))}))}function j(){const e=document.getElementById("messageTextarea");if(e&&w[$]){const n=e.value;if(""!==n.trim()){let t={message:n,channel:$,UserName:E};w[$].send(JSON.stringify(t)),e.value="",T(t)}}}function T(e){if(e.channel===$){const n=document.getElementById("messageList");if(n){const t=document.createElement("div");t.className="mb-3 d-flex align-items-start";const a=document.createElement("img");a.src=`${c}`,a.alt="User Image",a.className="rounded-circle mr-2",a.width=40;const s=document.createElement("div"),i=document.createElement("strong");i.textContent=e.UserName;const o=document.createElement("p");o.textContent=e.message,s.appendChild(i),s.appendChild(o),t.appendChild(a),t.appendChild(s),n.appendChild(t)}}}function P(){const e=document.getElementById("channelModal"),n=document.getElementById("channelMembers");e&&(e.style.display="block",fetch(`${v}/api/users/`).then((e=>e.json())).then((e=>{x=e,n.innerHTML="",e.forEach((e=>{if(e.username!=E){const t=document.createElement("option");t.textContent=e.username,t.value=e.id,n.appendChild(t)}}))})).catch((e=>{})));const t=document.getElementById("closeModalButton");t&&t.addEventListener("click",(()=>{e.style.display="none"}))}function k(e){const n=document.getElementById("channelsDropdown");n.innerHTML="";const t=document.createElement("option");t.value=-1,t.textContent="Select a person for messages",n.appendChild(t),b=e,e.forEach((e=>{const t=document.createElement("option");if(t.value=e.id,e.name===E){const n=e.members.find((e=>e.username!==E));t.textContent=n?n.username:"No disponible"}else t.textContent=e.name;n.appendChild(t)})),n.addEventListener("change",(e=>{!function(e){$=e;document.getElementById("messageList").innerHTML="",w[e]||function(e){const n=new WebSocket(`ws://127.0.0.1:8000/ws/chat/${e}/`);n.addEventListener("message",(e=>{T(JSON.parse(e.data))})),w[e]=n}(e);for(let n=0;n<b.length;n++)b[n].id==e&&q(b[n])}(e.target.value)}))}function A(e){const n=e.split(".")[1];return JSON.parse(atob(n)).user_id}async function M(e){const n=await fetch(`${v}/user-channels/${e}/?format=json`);return await n.json()}function q(e){if(e.name===E){const n=e.members.find((e=>e.username!==E));C=n.username}else C=e.name;const n=document.getElementById("channel-title");n&&(n.textContent=`${C}`)}function N(){let e=document.getElementById("channelMembers").selectedOptions,n=Array.from(e).map((e=>parseInt(e.value,10)));n.push(B);const t=x.find((e=>e.id==n[0]))?.username||"Unknown User",s={owner:B,ownerId:B,name:t,status:"working",members:n},i=`${v}/channels/create/`,o={method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)};fetch(i,o).then((e=>e.json())).then((e=>{e.name?(a("Channel successfully created","success"),M(B).then(k)):a("Error there is already a chat","error");const n=document.getElementById("channelModal");n&&(n.style.display="none")})).catch((e=>{a("Error there is already a chat","error")}))}function _(){if(localStorage.getItem("jwt"))return`\n  <div class="container-fluid h-100 d-flex flex-column flex-md-row">\n    \x3c!-- Panel Izquierdo: Chat List --\x3e\n    <div class="bg-light p-3 d-md-block vh-100" style="flex: 0 0 25%;">\n      <h3>Chat</h3>\n      <div class="mb-4">\n        <h4 class="d-flex justify-content-between fs-5">\n          Messages with all\n          <button id="addChannel" class="btn btn-primary btn-sm">Add Channel</button>\n        </h4>\n        <select id="channelsDropdown" class="form-control">\n          <option value="-1">Select a person for messages</option>\n        </select>\n      </div>\n      <div class="mt-4 d-flex align-items-center">\n        <img src="${c}" alt="User Image" class="rounded-circle mr-2" width="40">\n        <div>\n          <strong>username</strong>\n          <button class="btn btn-link p-0">Logout</button>\n        </div>\n      </div>\n    </div>\n\n    \x3c!-- Panel Medio: Chat Messages --\x3e\n    <div class="bg-white p-3 overflow-auto" style="flex-grow: 1;">\n      <h3 id="channel-title" class="mb-4">#channel-alpha</h3>\n      \x3c!-- Messages go here --\x3e\n      <ul id="messageList" class="list-unstyled">\n        \x3c!-- Aquí se agregarán los mensajes --\x3e\n      </ul>\n      \x3c!-- Textarea for new messages --\x3e\n      <div class="mt-3">\n        <textarea id="messageTextarea" class="form-control" rows="3"></textarea>\n        <button id="sendButton" class="btn btn-primary mt-2">Enviar</button>\n      </div>\n    </div>\n  </div>\n\n\n    \x3c!-- Modal para crear un nuevo canal --\x3e\n    <div class="modal" tabindex="-1" role="dialog" id="channelModal">\n      <div class="modal-dialog" role="document">\n        <div class="modal-content">\n          <div class="modal-header">\n            <h5 class="modal-title">Create Channel</h5>\n            <button id="closeModalButton" type="button" class="close" data-dismiss="modal" aria-label="Close">\n              <span aria-hidden="true">&times;</span>\n            </button>\n          </div>\n          <div class="modal-body">\n\n            <p>Members</p>\n            <select multiple class="form-control" id="channelMembers"></select>\n\n          </div>\n          <div class="modal-footer">\n            <button type="button" id="saveChannelButton" class="btn btn-primary">Save Channel</button>\n          </div>\n        </div>\n      </div>\n    </div>\n    `;window.location.href="/#"}const F=(e,n)=>{let t,a;return a="/"!=y()?`/${n[0]}/:id`:`/${n[0]}`,t=e[a]&&n.length>=1&&n.length<=2?e[`/${n[0]}`]:e["/404"],t},O={"/":[function(){return`\n  <div class="container mt-5 min-vh-100">\n    <div class="row align-items-center">\n      \x3c!-- Imagen de Pong --\x3e\n      <div class="col-md-6">\n        <img src="${t}" alt="Pong Game" class="img-fluid">\n      </div>\n\n      \x3c!-- Descripción y Botón --\x3e\n      <div class="col-md-6">\n        <h1>CabraPing</h1>\n        <p class="lead">Classic Pong: Bounce to Victory! Can you outmatch your opponent in this timeless arcade game of skill and reflexes?</p>\n        <a href="path-to-authentication" class="btn btn-warning">42 Auth</a>\n        <a href="/#auth" class="btn btn-warning">Iniciar Sesión / Registrarse</a>\n      </div>\n    </div>\n  </div>\n  `},function(){return null}],"/auth":[function(){if(!localStorage.getItem("jwt"))return'\n    <div class="container mt-5">\n      <div class="row">\n        <div class="col-md-6">\n          \x3c!-- Login Form --\x3e\n          <form id="login-form">\n            <h2>Login</h2>\n            <div class="mb-3">\n              <label for="username" class="form-label">Email</label>\n              <input type="email" class="form-control" id="username" required>\n            </div>\n            <div class="mb-3">\n              <label for="password" class="form-label">Password</label>\n              <input type="password" class="form-control" id="password" required>\n            </div>\n            <button type="submit" class="btn btn-primary">Login</button>\n          </form>\n        </div>\n        <div class="col-md-6">\n          \x3c!-- Registration Form --\x3e\n\n          <form id="signup-form">\n          <h2>Create Account</h2>\n          \x3c!-- Add additional fields as per your user model --\x3e\n          <div class="mb-3">\n          <label for="new-username" class="form-label">Email</label>\n          <input type="email" class="form-control" id="new-username" required>\n          </div>\n          <div class="mb-3">\n          <label for="new-password" class="form-label">Password</label>\n          <input type="password" class="form-control" id="new-password" required>\n          </div>\n          <button type="submit" class="btn btn-success">Create Account</button>\n          </form>\n\n        </div>\n      </div>\n    </div>\n  ';window.location.href="/#"},function(){if(localStorage.getItem("jwt"))return void(window.location.href="/#");const e=document.getElementById("login-form"),n=document.getElementById("signup-form");e.addEventListener("submit",(e=>{e.preventDefault();!function(e,n){fetch("http://127.0.0.1:8000/api/token/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:e,password:n})}).then((e=>{if(e.ok)return a("successful login","success"),e.json();throw a("Incorrect username or password","error"),new Error("Login failed")})).then((e=>{localStorage.setItem("jwt",e.access),setTimeout((()=>{window.location.href="/#"}),500)})).catch((e=>{}))}(document.getElementById("username").value,document.getElementById("password").value)})),n.addEventListener("submit",(e=>{e.preventDefault();!function(e,n){const t=e.split("@")[0];fetch("http://127.0.0.1:8000/api/users/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:t,email:e,password:n})}).then((e=>{if(200===e.status||201===e.status)return e.json();throw new Error(`Server responded with status: ${e.status}`)})).then((e=>{a("User created successfully","success")})).catch((e=>{a("Error creating user! "+e.message,"error")}))}(document.getElementById("new-username").value,document.getElementById("new-password").value)}))}],"/logout":[function(){return localStorage.removeItem("jwt"),window.location.replace(""),""}],"/game":[function(){return'\n    <div class="container-fluid d-flex align-items-center justify-content-center mb-5 mt-5">\n      <div class="row w-100">\n        <div class="col-12 d-flex justify-content-center">\n          <div class="bg-dark w-100 h-100 d-flex align-items-center justify-content-center p-5" >\n            <canvas id="game" class="w-100 h-100"></canvas>  \x3c!-- Canvas se ajusta al espacio disponible después del padding --\x3e\n          </div>\n        </div>\n      </div>\n    </div>\n  '},function(){const e=new WebSocket("ws://127.0.0.1:8000/ws/game/");e.onopen=function(e){},e.onmessage=function(e){!function(e){e&&void 0!==e.rightPaddlePosition&&void 0!==e.leftPaddlePosition&&e.ballPosition&&(i.y=e.rightPaddlePosition,s.y=e.leftPaddlePosition,void 0!==e.ballPosition.x&&void 0!==e.ballPosition.y&&(o.x=e.ballPosition.x,o.y=e.ballPosition.y))}(JSON.parse(e.data).message)},e.onclose=function(e){e.wasClean},e.onerror=function(e){};const n=document.getElementById("game"),t=n.getContext("2d"),a=n.height-5-25;let s={x:10,y:n.height/2-12.5,width:5,height:25,dy:0},i={x:n.width-15,y:n.height/2-12.5,width:5,height:25,dy:0},o={x:n.width/2,y:n.height/2,width:5,height:5,resetting:!1,dx:.5,dy:-.5};function r(e,n){return e.x<n.x+n.width&&e.x+e.width>n.x&&e.y<n.y+n.height&&e.y+e.height>n.y}function l(){const n={rightPaddlePosition:i.y,leftPaddlePosition:s.y,ballPosition:{x:o.x,y:o.y}};e.send(JSON.stringify(n))}document.addEventListener("keydown",(function(e){38===e.which?i.dy=-3:40===e.which&&(i.dy=3),87===e.which?s.dy=-3:83===e.which&&(s.dy=3),l()})),document.addEventListener("keyup",(function(e){38!==e.which&&40!==e.which||(i.dy=0),83!==e.which&&87!==e.which||(s.dy=0),l()})),requestAnimationFrame((function e(){requestAnimationFrame(e),t.clearRect(0,0,n.width,n.height),s.y+=s.dy,i.y+=i.dy,s.y<5?s.y=5:s.y>a&&(s.y=a),i.y<5?i.y=5:i.y>a&&(i.y=a),t.fillStyle="white",t.fillRect(s.x,s.y,s.width,s.height),t.fillRect(i.x,i.y,i.width,i.height),o.x+=o.dx,o.y+=o.dy,o.y<5?(o.y=5,o.dy*=-1):o.y+5>n.height-5&&(o.y=n.height-10,o.dy*=-1),(o.x<0||o.x>n.width)&&!o.resetting&&(o.resetting=!0,setTimeout((()=>{o.resetting=!1,o.x=n.width/2,o.y=n.height/2}),400)),r(o,s)?(o.dx*=-1,o.x=s.x+s.width):r(o,i)&&(o.dx*=-1,o.x=i.x-o.width),t.fillRect(o.x,o.y,o.width,o.height),t.fillStyle="lightgrey",t.fillRect(0,0,n.width,5),t.fillRect(0,n.height-5,n.width,n.height);for(let e=5;e<n.height-5;e+=10)t.fillRect(n.width/2-2.5,e,5,5)}))}],"/chat":[_,S],"/chat/:id":[_,S],"/user":[function(){return'\n    <div class="User" >\n        <h2> User </h2>\n    </div>\n  '},function(){}],"/users":[i,async function e(){const n=localStorage.getItem("jwt");if(!n)return null;const t=await fetch(`${o}/api/me/`,{headers:{Authorization:`Bearer ${n}`}}),a=await t.json();if(!a)return null;const s=await fetch(`${o}/api/users/`);if(r=await s.json(),!r)return null;const c=await fetch(`${o}/api/friend_requests/me`,{headers:{Authorization:`Bearer ${n}`}});l=await c.json(),r=r.map((e=>{const n=l.find((n=>n.to_user.id===e.id));return Boolean(n)?{...e,isSentFriendRequest:!0}:e})),document.getElementById("users-list").innerHTML=r.map((e=>{const n=e.id===a.id,t=e.friends.find((e=>e===a.id));return`\n  <li class="list-group-item d-flex gap-4 align-items-center">\n      <h3>${e.username}</h3>\n      ${n||t||e.isSentFriendRequest?"":`<button\n              type="button"\n              class="btn btn-primary btn-sm"\n              data-action="create-friend-request"\n              data-id="${e.id}"\n              >Add Friend</button>`}\n\n      ${e.isSentFriendRequest?'<button\n              disabled\n              type="button"\n              class="btn btn-primary btn-sm"\n              >Added Friend</button>':""}\n\n      ${t?"<span>Your friend</span>":""}\n  </li>\n  `})).join(""),document.querySelectorAll('[data-action="create-friend-request"]').forEach((t=>{t.addEventListener("click",(async t=>{const a=Number(t.target.getAttribute("data-id"));await fetch(`${o}/api/friend_requests/`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${n}`},body:JSON.stringify({to_user:a})}),i(),e()}))}))}],"/friends":[async function(){const e=s(),n=await fetch("http://localhost:8000/api/me/",{headers:{Authorization:`Bearer ${e}`}});return u=await n.json(),u?'\n    <div class="container-sm min-vh-100">\n      <h2>All of My Friends</h2>\n      <ul id="friends-list" class="list-group">\n        \x3c!-- friendsData --\x3e\n        <p>No Friends Yet</p>\n      </ul>\n\n      <h2>Friend Requests</h2>\n      <p>We are the invitee</p>\n      <ul id="friend-requests-list" class="list-group">\n        \x3c!-- friendsData --\x3e\n        <p>No Friend Requests Yet</p>\n      </ul>\n    </div>\n  ':null},g,p,async function(){const e=s(),n=document.querySelectorAll('[data-action="confirm"]'),t=document.querySelectorAll('[data-action="delete"]');n.forEach((n=>{n.addEventListener("click",(async n=>{const t=n.target.getAttribute("data-id");await fetch(`${m}/api/friend_requests/${t}/`,{method:"PUT",headers:{Authorization:`Bearer ${e}`,"Content-Type":"application/json"},body:JSON.stringify({intent:"confirm"})}),Friends(),g(),p()}))})),t.forEach((n=>{n.addEventListener("click",(async n=>{const t=n.target.getAttribute("data-id");await fetch(`${m}/api/friend_requests/${t}/`,{method:"DELETE",headers:{Authorization:`Bearer ${e}`}});Friends(),g(),p()}))}))}],"/404":[function(){return'\n    <div class="Error404 min-vh-100">\n      <h2>Error 404</h2>\n    </div>\n  '},function(){}]},R=async()=>{let e;const t=document.getElementById("header"),a=document.getElementById("footer"),s=document.getElementById("content");a.innerHTML=await n(),t.innerHTML=await async function(){const e=localStorage.getItem("jwt"),n=Boolean(e);if(n){const n=await fetch("http://localhost:8000/api/me/",{headers:{Authorization:`Bearer ${e}`}});d=await n.json(),"user_not_found"!==d.code&&"token_not_valid"!==d.code||window.location.replace("/#logout")}return`\n  <header id="nav" class="d-flex justify-content-between align-items-center p-3 bg-light">\n    <nav class="navbar navbar-expand-lg navbar-light">\n      <a class="navbar-brand" href="#">\n        <img src="${c}" alt="Logo" style="height: 50px;">\n      </a>\n      <button class="navbar-toggler" type="button" id="navbarToggle">\n        <span class="navbar-toggler-icon"></span>\n      </button>\n      <div class="collapse navbar-collapse" id="navbarNav">\n        <ul class="navbar-nav">\n          ${n?'\n            <li class="nav-item"><a class="nav-link" href="#users">Users</a></li>\n            <li class="nav-item"><a class="nav-link" href="#friends">Friends</a></li>\n            <li class="nav-item"><a class="nav-link" href="#chat">Chats</a></li>\n            <li class="nav-item"><a class="nav-link" href="#game">Games</a></li>\n          ':""}\n        </ul>\n      </div>\n    </nav>\n\n    <div>\n      ${n?`\n        <div>\n          <span class="me-3">${d.username}</span>\n          <a href="/#logout" class="btn btn-primary">Logout</a>\n        </div>\n      `:'<a href="/#auth" class="btn btn-primary">Login</a>'}\n    </div>\n  </header>\n\n     `}(),function(){const e=document.getElementById("navbarToggle"),n=document.getElementById("navbarNav"),t=document.getElementById("nav");e&&n&&t&&e.addEventListener("click",(function(){n.classList.toggle("collapse"),t.classList.contains("d-flex")?t.classList.replace("d-flex","d-block"):t.classList.replace("d-block","d-flex")}))}();let i=location.hash.slice(1).toLocaleLowerCase().split("/");e=F(O,i),s.innerHTML=await e[0]();for(let n=1;n<e.length;n++)await e[n]()};window.addEventListener("load",R),window.addEventListener("hashchange",R)})();