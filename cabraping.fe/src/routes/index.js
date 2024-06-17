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
import { Game_js, gameSocket } from "../pages/Game/funcions-js.js";
import { Game_html } from "../pages/Game/html.js";
import { Friends_html } from "../pages/Friends/html.js";
import { Tournament_html } from "../pages/Tournament/html.js";
import { TournamentInit, WS_check_the_torunament_pending } from "../pages/Tournament/funcions-js.js";
import { TournamentWaitingArea_html } from "../pages/TournamentWaitingArea/html.js";
import { CancelTournament_for_descconecte_, initializeTournamentWaitingArea } from "../pages/TournamentWaitingArea/functions-js.js";
import { Friends_js } from "../pages/Friends/funcions-js.js";
import { Chat_js, Chat_Update_js, getUserIdFromJWT } from "../pages/Chat/funcions-js.js";
import { Chat_html } from "../pages/Chat/html.js";
import { Stat_js } from "../pages/Stat/functions-js.js";
import { Stat_html } from "../pages/Stat/html.js";
import { Profile_js } from "../pages/Profile/functions-js.js";
import { Profile_html } from "../pages/Profile/html.js";
import resolveRoutes from "../utils/resolveRoutes.js";
import { BACKEND_URL, checNotifi, connectWebSocketGlobal, handleTournamentInvite, Tournament_check_notificacion  } from "../components/wcGlobal.js";
import { Matching_html } from "../pages/Matching/html.js";
import { Matching_js } from "../pages/Matching/funcions-js.js";
import { getToken } from "../utils/get-token.js";
import { getTournamentForId } from "../pages/Tournament/cancel.js";
import { Cancel_a_Game } from "../pages/Game/cancel.js";
import { sendDeleteMeForMatchedMessage, sendGameCancelTournamentNotifications } from "../components/wcGlobal-funcions-send-message.js";
import { getLocalhostSystem_game_on, GetSpecificGame, setLocalhostSystem_game_on } from "../pages/Game/utils.js";

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
  "/waitroom/:id": [TournamentWaitingArea_html, initializeTournamentWaitingArea],
  "/logout": [LogoutPage_js],
  "/friends": [Friends_html, Friends_js],
  "/stats": [Stat_html, Stat_js],
  "/profile": [Profile_html, Profile_js],
  "/user/:id": [Profile_html, Profile_js],
  "/404": [Error404_html, Error404_js],
};

let user_location;

const router = async () => {

  const jwt = localStorage.getItem("jwt");

  // Check the JWT
  if (jwt) {
    try {
       let response = await fetch(`${BACKEND_URL}/api/me/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok)
        localStorage.clear();
    } catch (error) {
      localStorage.clear();
    }
  }

  const header = document.getElementById("header");
  const footer = document.getElementById("footer");
  const content = document.getElementById("content");

  footer.innerHTML = await Footer_html();
  header.innerHTML = await Header_html();
  Header_js();

  user_location = location.hash.slice(1).toLocaleLowerCase().split("/");
  
  await check_global_before();
  
  if (location.pathname !== "/")
  {
    window.location.pathname = '/';
  }

  let render = resolveRoutes(routes, user_location);


  content.innerHTML = await render[0]();
  if (render.length > 1) {
    for (let i = 1; i < render.length; i++) {
      if (render[i]) {
        await render[i]();
      }
    }
  }

  await check_global_after();
};

async function check_global_before(params) {

  await WS_check_the_torunament_pending();

  if (checNotifi !== 0)
  {
    Tournament_check_notificacion();
  }

  if (getToken())
  {
    if (!localStorage.getItem('username') || !localStorage.getItem('userId')){
      const responseMyUser = await fetch(`${BACKEND_URL}/api/me/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        });
      let myUser = await responseMyUser.json();

      localStorage.setItem('username', myUser.username)
      localStorage.setItem('userId', myUser.id);
    }
  }

  if(localStorage.getItem("currentTournamentId"))
  {
    let tournament_id =localStorage.getItem("currentTournamentId")
    let check_tournament = await getTournamentForId(tournament_id);
    if (check_tournament.status === "canceled" || check_tournament.status === "completed")
    {
      localStorage.removeItem("currentTournamentId");
    }
  }

  // console.log("🐹 localStorage.getItem(system_game_id):", localStorage.getItem("system_game_id"));
  if (user_location[0] !== "game" && (localStorage.getItem("system_game_id") || (localStorage.getItem("currentTournamentId") && localStorage.getItem("system_game_id"))) )
    {
      if (localStorage.getItem("currentTournamentId"))
      {
        CancelTournament_for_descconecte_();
      }else{
        let game_specific = await GetSpecificGame(localStorage.getItem("system_game_id"));
        if (game_specific.playMode === 2)
        {
          if (gameSocket)
          {
            gameSocket.close()
          }
          // setLocalhostSystem_game_on(getLocalhostSystem_game_on() - 1)
          let send_notificaque = await Cancel_a_Game(localStorage.getItem("system_game_id"));
          sendGameCancelTournamentNotifications(getUserIdFromJWT(), localStorage.getItem('username'), send_notificaque);
        }
        localStorage.removeItem("system_game_id");
      }
  }

  if (localStorage.getItem("Im_in_the_Matching"))
  {
    // sendDeleteMeForMatchedMessage
    sendDeleteMeForMatchedMessage();
  }
}

async function check_global_after(params) {

  if (user_location[0] !== 'chat') {
    await Chat_Update_js();
  }
  await connectWebSocketGlobal();
}



export default router;

