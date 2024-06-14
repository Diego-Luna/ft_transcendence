import Footer_html from "../components/footer/html.js";
import { Header_js } from "../components/header/funcions-js.js";
import { Header_html } from "../components/header/html.js";
import { Home_js } from "../pages/home/funcions-js.js";
import { Home_html } from "../pages/home/html.js";
import { AuthPage_js } from "../pages/AuthPage/funcions-js.js";
import { AuthPage_html } from "../pages/AuthPage/html.js";
import { User_js } from "../pages/User/funcions-js.js";
import { User_html } from "../pages/User/html.js";
import { Error404_js } from "../pages/Error404/funcions-js.js";
import { Error404_html } from "../pages/Error404/html.js";
// import { LogoutPage_js, initializeLogoutButtons } from "../pages/Logout/funcions-js.js";
import { LogoutPage_js } from "../pages/Logout/funcions-js.js";
import { Users_js } from "../pages/Users/funcions-js.js";
import { Users_html } from "../pages/Users/html.js";
import { Game_js } from "../pages/Game/funcions-js.js";
import { Game_html } from "../pages/Game/html.js";
import { Friends_html } from "../pages/Friends/html.js";
import { Tournament_html } from "../pages/Tournament/html.js";
import {
  TournamentInit,
  WS_check_the_torunament_pending,
} from "../pages/Tournament/funcions-js.js";
import { TournamentWaitingArea_html } from "../pages/TournamentWaitingArea/html.js";
import { initializeTournamentWaitingArea } from "../pages/TournamentWaitingArea/functions-js.js";
import { Friends_js } from "../pages/Friends/funcions-js.js";
import { Chat_js, Chat_Update_js } from "../pages/Chat/funcions-js.js";
import { Chat_html } from "../pages/Chat/html.js";
import { Stat_js } from "../pages/Stat/functions-js.js";
import { Stat_html } from "../pages/Stat/html.js";
import { Profile_js } from "../pages/Profile/functions-js.js";
import { Profile_html } from "../pages/Profile/html.js";
import resolveRoutes from "../utils/resolveRoutes.js";
import { BACKEND_URL, connectWebSocketGlobal } from "../components/wcGlobal.js";
import { Matching_html } from "../pages/Matching/html.js";
import { Matching_js } from "../pages/Matching/funcions-js.js";
import { getToken } from "../utils/get-token.js";
import { getTournamentForId } from "../pages/Tournament/cancel.js";

const routes = {
  "/": [Home_html, Home_js],
  "/auth": [AuthPage_html, AuthPage_js],
  "/logout": [LogoutPage_js],
  "/matching": [Matching_html, Matching_js], // Nueva ruta para la página de matching
  "/game": [Matching_html, Matching_js],
  "/game/:id": [Game_html, Game_js],
  "/chat": [Chat_html, Chat_js],
  "/chat/:id": [Chat_html, Chat_js],
  "/user": [User_html, User_js],
  "/users": [Users_html, Users_js],
  "/tournament": [Tournament_html, TournamentInit],
  "/waitroom/:id": [
    TournamentWaitingArea_html,
    initializeTournamentWaitingArea,
  ],
  "/logout": [LogoutPage_js],
  "/friends": [Friends_html, Friends_js],
  "/stats": [Stat_html, Stat_js],
  "/profile": [Profile_html, Profile_js],
  "/user/:id": [Profile_html, Profile_js],
  "/404": [Error404_html, Error404_js],
};

const router = async () => {
  const header = document.getElementById("header");
  const footer = document.getElementById("footer");
  const content = document.getElementById("content");

  footer.innerHTML = await Footer_html();
  header.innerHTML = await Header_html();
  Header_js();

  let user_location = location.hash.slice(1).toLocaleLowerCase().split("/");
  let render = resolveRoutes(routes, user_location);

  await WS_check_the_torunament_pending();

  if (getToken()) {
    if (!localStorage.getItem("username") || !localStorage.getItem("userId")) {
      const responseMyUser = await fetch(`${BACKEND_URL}/api/me/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      let myUser = await responseMyUser.json();

      localStorage.setItem("username", myUser.username);
      localStorage.setItem("userId", myUser.id);
    }
  }

  // console.log("--> Route: localStorage.getItem(currentTournamentId):", localStorage.getItem("currentTournamentId"));
  if (localStorage.getItem("currentTournamentId")) {
    let tournament_id = localStorage.getItem("currentTournamentId");
    let check_tournament = await getTournamentForId(tournament_id);
    if (
      check_tournament.status === "canceled" ||
      check_tournament.status === "completed"
    ) {
      localStorage.removeItem("currentTournamentId");
    }
  }

  content.innerHTML = await render[0]();
  if (render.length > 1) {
    for (let i = 1; i < render.length; i++) {
      if (render[i]) {
        await render[i]();
      }
    }
  }

  if (user_location[0] !== "chat") {
    await Chat_Update_js();
  }
  await connectWebSocketGlobal();
};

export default router;
