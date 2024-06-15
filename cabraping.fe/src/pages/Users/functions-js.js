import { BACKEND_URL } from "../../components/wcGlobal.js";
import { sendFriendRequestNotifications } from "../../components/wcGlobal-functions-send-message.js";
import { showActiveFriends } from "../Chat/functions-js.js";
import { Users_html } from "./html.js";

let myUser = null;
let users = [];
let friendRequests = [];

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
    if (hasSent) return { ...user, isSentFriendRequest: true };
    else return user;
  });

  const usersListElement = document.getElementById("users-list");
  if (!usersListElement) {
    return;
  }

  usersListElement.innerHTML = users
    .map((user) => {
      const isSameUser = user.id === myUser.id;
      const isOurFriend = user.friends.find(
        (friendId) => friendId === myUser.id
      );

      let friendActive = showActiveFriends(myUser.friends, user.id);
      let HTML_friendActive = "";

      if (typeof friendActive === "boolean" && friendActive === true) {
        HTML_friendActive = `<p class="mb-0 ms-3 rounded-circle bg-success" style="height: 20px; width: 20px;"></p>`;
      }
      if (typeof friendActive === "boolean" && friendActive === false) {
        HTML_friendActive = `<p class="mb-0 ms-3 rounded-circle bg-secondary" style="height: 20px; width: 20px;" ></p>`;
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

      ${
        !isSameUser
          ? `<button type="button" class="btn btn-primary btn-sm"
          data-action="play-game"
          data-id="${user.id}"
          >
          Play on 1 Computer</button>`
          : ""
      }
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

  const playGameButtonElements = document.querySelectorAll(
    '[data-action="play-game"]'
  );

  playGameButtonElements.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const userId = Number(event.target.getAttribute("data-id"));

      const requestBody = {
        playMode: 1,
        invitationStatus: "ACCEPTED",
        inviter: myUser.id,
        invitee: userId,
      };
      // console.log({ requestBody });

      const response = await fetch(`${BACKEND_URL}/api/games/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const newGame = await response.json();
      // console.log({ newGame });

      if (newGame) {
        window.location.href = `/#game/${newGame.id}`;
      }

      Users_html();
      Users_js();
    });
  });
}
