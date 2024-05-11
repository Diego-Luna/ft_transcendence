import Footer_html from "../components/footer/html.js";
import { Home_js } from "../pages/home/funcions-js.js";
import { Home_html } from "../pages/home/html.js";
import { AuthPage_js } from "../pages/AuthPage/funcions-js.js";
import { AuthPage_html } from "../pages/AuthPage/html.js";
import { Error404_js } from "../pages/Error404/funcions-js.js";
import { Error404_html } from "../pages/Error404/html.js";
import { User_js } from "../pages/User/funcions-js.js";
import { User_html } from "../pages/User/html.js";
import { LogoutPage_js } from "../pages/Logout/funcions-js.js";
import { Users_js } from "../pages/Users/funcions-js.js";
import { Users_html } from "../pages/Users/html.js";
import { Header_js } from "../components/header/funcions-js.js";
import { Header_html } from "../components/header/html.js";
import { Game_js } from "../pages/Game/funcions-js.js";
import { Game_html } from "../pages/Game/html.js";
import { Friends_html } from "../pages/Friends/html.js";
import {
  FriendsRender,
  FriendRequestsRender,
  Friends_js,
} from "../pages/Friends/funcions-js.js";
import { Chat_js } from "../pages/Chat/funcions-js.js";
import { Chat_html } from "../pages/Chat/html.js";
import resolveRoutes from "../utils/resolveRoutes.js";

const routes = {
  "/": [Home_html, Home_js],
  "/auth": [AuthPage_html, AuthPage_js],
  "/logout": [LogoutPage_js],
  "/game": [Game_html, Game_js],
  "/game/:id": [Game_html, Game_js],
  "/chat": [Chat_html, Chat_js],
  "/chat/:id": [Chat_html, Chat_js],
  "/user": [User_html, User_js],
  "/user/:id": [User_html, User_js],
  "/users": [Users_html, Users_js],
  "/friends": [Friends_html, Friends_js],
  "/404": [Error404_html, Error404_js],
};

const router = async () => {
  // The variable where it is stored, the array of the functions that will be executed
  let render;

  // The HTML component selectors where our components will be rendered
  const header = document.getElementById("header");
  const footer = document.getElementById("footer");
  const content = document.getElementById("content");

  footer.innerHTML = await Footer_html();
  header.innerHTML = await Header_html();
  Header_js();

  // We take our fruit and divide it into "/", we obtain a lowercase array, to work with the paths
  let user_location = location.hash.slice(1).toLocaleLowerCase().split("/");

  // We check that the route exists.
  render = resolveRoutes(routes, user_location);

  // We render our html and execute the js
  content.innerHTML = await render[0]();
  for (let index = 1; index < render.length; index++) {
    await render[index]();
  }
};

export default router;
