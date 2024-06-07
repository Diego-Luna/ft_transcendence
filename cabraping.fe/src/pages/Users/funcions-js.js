import { sendFriendRequestNotifications } from "../../components/wcGlobal.js";
import { showActiveFriends } from "../Chat/funcions-js.js";
import { Users_html } from "./html.js";

// Extract the IP address from the URL used to access the frontend
const frontendURL = new URL(window.location.href);
const serverIPAddress = frontendURL.hostname;
const serverPort = 8000; // Specify the port your backend server is running on
const BACKEND_URL = `http://${serverIPAddress}:${serverPort}`;

let users = [];
let friendRequests = [];
let  myUser = null;

// export async function UsersInit() {
export async function Users_js() {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) return null;


  const responseMyUser = await fetch(`${BACKEND_URL}/api/me/`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  // const myUser = await responseMyUser.json();
  myUser = await responseMyUser.json();
  if (!myUser) return null;

  const responseUsers = await fetch(`${BACKEND_URL}/api/users/`);
  users = await responseUsers.json();
  if (!users) return null;

  const responseFriendRequests = await fetch(
    `${BACKEND_URL}/api/friend_requests/me`,
    { headers: { Authorization: `Bearer ${jwt}` } }
  );
  friendRequests = await responseFriendRequests.json();

  users = users.map((user) => {
    const hasSent = friendRequests.find(
      (friendRequest) => friendRequest.to_user.id === user.id
    );
    if (Boolean(hasSent)) return { ...user, isSentFriendRequest: true };
    else return user;
  });

  const usersListElement = document.getElementById("users-list");
  if (!usersListElement)
  {
    return
  }


  usersListElement.innerHTML = users
    .map((user) => {
      const isSameUser = user.id === myUser.id;
      const isOurFriend = user.friends.find(
        (friendId) => friendId === myUser.id
      );

      let friendActive =  showActiveFriends(myUser.friends, user.id);
      let HTML_friendActive = "";
    
      if (typeof(friendActive) === "boolean" && friendActive === true){
        HTML_friendActive = `<p class="mb-0 ms-3 rounded-circle bg-success" style="height: 20px; width: 20px;"></p>`
      }
      if (typeof(friendActive) === "boolean" &&  friendActive === false){
        HTML_friendActive = `<p class="mb-0 ms-3 rounded-circle bg-secondary" style="height: 20px; width: 20px;" ></p>`
      }

      return `
  <li class="list-group-item d-flex gap-4 align-items-center">
      <h3>${user.username}</h3>
      ${HTML_friendActive}
      ${
        !isSameUser && !isOurFriend && !user.isSentFriendRequest
          ? `<button
              type="button"
              class="btn btn-primary btn-sm"
              data-action="create-friend-request"
              data-id="${user.id}"
              >Add Friend</button>`
          : ""
      }

      ${
        user.isSentFriendRequest
          ? `<button
              disabled
              type="button"
              class="btn btn-primary btn-sm"
              >Added Friend</button>`
          : ""
      }

      ${isOurFriend ? `<span>Your friend</span>` : ""}
  </li>
  `;
    })
    .join("");

  const addFriendButtonElements = document.querySelectorAll(
    '[data-action="create-friend-request"]'
  );

  addFriendButtonElements.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const toUserId = Number(event.target.getAttribute("data-id"));

      await fetch(`${BACKEND_URL}/api/friend_requests/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ to_user: toUserId }),
      });

      Users_html();
      Users_js();
      sendFriendRequestNotifications(myUser.id, myUser.username, toUserId);
    });
  });
}
