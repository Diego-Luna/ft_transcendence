import { BACKEND_URL, WS_URL } from "../wcGlobal.js";

// import image from "../../assets/logo.svg";
let image = "assets/logo.svg";

// Extract the IP address from the URL used to access the frontend
// const frontendURL = new URL(window.location.href);
// const serverIPAddress = frontendURL.hostname;
// const serverPort = 8000; // Specify the port your backend server is running on
// const BACKEND_URL = `http://${serverIPAddress}:${serverPort}`;
// const WS_URL = `ws://${serverIPAddress}:${serverPort}`;

let myUser = null;

export async function Header_html() {
  const jwt = localStorage.getItem("jwt");
  const isAuthenticated = Boolean(jwt);

  if (isAuthenticated) {
    // Handle user data
    const responseMyUser = await fetch(`${BACKEND_URL}/api/me/`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (!responseMyUser.ok)
    {
      localStorage.clear();
      window.location.href = `/#`;
      return;
    }

    myUser = await responseMyUser.json();

    if ( !responseMyUser.ok || myUser.code === "user_not_found" || myUser.code === "token_not_valid") {
      window.location.replace("/#logout");
    }

  //   // Handle user notification
  //   const userNotificationSocket = new WebSocket(
  //     `${WS_URL}/ws/users/${myUser.id}/?token=${jwt}`
  //   );

  //   userNotificationSocket.onopen = function (event) {
  //     // console.log("User notification socket connected");
  //   };

  //   userNotificationSocket.onmessage = function (event) {
  //     const data = JSON.parse(event.data);
  //     // console.log("Message from server ", data);

  //     const userNotificationElement =
  //       document.getElementById("user-notification");

  //     if (data.status === "GAME_ACCEPTED" || data.status === "GAME_INVITED") {
  //       userNotificationElement.innerHTML = `
  //       <div class="d-flex gap-2">
  //         <span>${data.message}</span>
  //         <a href="/#game/${data.game_id}" class="btn btn-sm btn-secondary">
  //           Go to the game
  //         </a>
  //       </div>
  //       `;
  //     } else {
  //       userNotificationElement.innerText = data.message;
  //     }
  //   };

  //   userNotificationSocket.onclose = function (event) {
  //     if (event.wasClean) {
  //       console.log(`Disconnected, code=${event.code}, reason=${event.reason}`);
  //     } else {
  //       console.log("Connection died");
  //     }
  //   };

  //   userNotificationSocket.onerror = function (error) {
  //     console.log(`WebSocket error: ${error.message}`);
  //   };
  }

  const view = `
  <header id="nav" class="d-flex justify-content-between align-items-center p-3 bg-light">
    <nav class="navbar navbar-expand-lg navbar-light">
      <a class="navbar-brand" href="#">
        <img src="${image}" alt="Logo" style="height: 50px;">
      </a>
      
      <button class="navbar-toggler" type="button" id="navbarToggle">
        <span class="navbar-toggler-icon"></span>
      </button>
      
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav">
          ${
            isAuthenticated
              ? `
            <li class="nav-item"><a class="nav-link" href="#users">Users</a></li>
            <li class="nav-item"><a class="nav-link" href="#friends">Friends</a></li>
            <li class="nav-item"><a class="nav-link" href="#chat">Chats</a></li>
            <li class="nav-item"><a class="nav-link" href="#game">Games</a></li>
            <li class="nav-item"><a class="nav-link" href="#tournament">Tournament</a></li>
            <li class="nav-item"><a class="nav-link" href="#stats">Dashboard</a></li>
            <li class="nav-item"><a class="nav-link" href="#profile">Profile</a></li>
          ` : ""}
        </ul>
      </div>
    </nav>

    <div>
      ${
        isAuthenticated
          ? `
        <div class="d-flex gap-4">
          <div id="user-notification">
            <!-- -->
          </div>

          <a href="/#user" class="me-3 text-decoration-none text-dark">
            <b>${myUser.username}</b>
          </a>
          <a href="/#logout" class="btn btn-primary" id="logoutButton">Logout</a>
        </div>
      `
          : `<a href="/#auth" class="btn btn-primary">Login</a>`
      }
    </div>
  </header>

     `;

  return view;
}
