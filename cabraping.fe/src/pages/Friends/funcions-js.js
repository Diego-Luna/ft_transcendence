import {
  sendFriendAcceptdNotifications,
  sendFriendDeletedNotifications,
} from "../../components/wcGlobal.js";
import { getToken } from "../../utils/get-token.js";
import { showActiveFriends } from "../Chat/funcions-js.js";

// Extract the IP address from the URL used to access the frontend
const frontendURL = new URL(window.location.href);
const serverIPAddress = frontendURL.hostname;
const serverPort = 8000; // Specify the port your backend server is running on
const BACKEND_URL = `http://${serverIPAddress}:${serverPort}`;

let myUserData = {};
let friendRequests = [];

// export async function FriendsInit() {

export async function Friends_js() {
  const jwt = getToken();

  await fetchMyUserData();
  FriendsRender();
  FriendRequestsRender();
}

export async function fetchMyUserData() {
  const jwt = getToken();

  const responseMe = await fetch(`${BACKEND_URL}/api/me/`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  myUserData = await responseMe.json();
  if (!myUserData) {
    return null;
  }
}

export async function FriendsRender() {
  const jwt = getToken();
  await fetchMyUserData();

  const friendsListElement = document.getElementById("friends-list");
  if (!friendsListElement) {
    return null;
  }
  friendsListElement.innerHTML = "";

  const friends = myUserData.friends || []; // Define friends here

  if (!Array.isArray(friends)) {
    return null;
  }

  if (friends.length <= 0) {
    friendsListElement.innerHTML = "<p>No friends yet</p>";
    return null;
  }

  const responseGames = await fetch(`${BACKEND_URL}/api/games/`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });

  const games = await responseGames.json();

  friendsListElement.innerHTML = friends
    .map((friend) => {
      // Check for unfinished games
      const unfinishedGame = games.find((game) => {
        return (
          ((game.inviter.id === myUserData.id &&
            game.invitee.id === friend.id) ||
            (game.invitee.id === myUserData.id &&
              game.inviter.id === friend.id)) &&
          game.invitationStatus !== "FINISHED"
        );
      });

      // Check for games that the user can join or continue
      const canGoToGame = games.find((game) => {
        return (
          game.inviter.id === myUserData.id &&
          game.invitee.id === friend.id &&
          game.invitationStatus !== "FINISHED"
        );
      });

      const canAccceptGame = games.find(
        (game) =>
          game.invitee.id === myUserData.id &&
          game.inviter.id === friend.id &&
          game.invitationStatus !== "FINISHED" &&
          (game.invitationStatus === "PENDING" ||
            game.invitationStatus === "ACCEPTED")
      );

      const hideInviteButton = Boolean(unfinishedGame);

      let friendActive = showActiveFriends(myUserData.friends, friend.id);
      let HTML_friendActive = "";

      if (typeof friendActive === "boolean" && friendActive === true) {
        HTML_friendActive = `<p class="mb-0 ms-3 rounded-circle bg-success" style="height: 20px; width: 20px;"></p>`;
      }
      if (typeof friendActive === "boolean" && friendActive === false) {
        HTML_friendActive = `<p class="mb-0 ms-3 rounded-circle bg-secondary" style="height: 20px; width: 20px;" ></p>`;
      }

      return `<li id="${friend.id}"
        class="list-group-item d-flex gap-4 align-items-center">
        <h3>${friend.username}</h3>
        <span>${HTML_friendActive}</span>

        ${
          !hideInviteButton
            ? `<button type="button" class="btn btn-sm btn-primary" data-action="invite-game"
        data-id="${friend.id}">Invite to a game</button>`
            : ""
        }

        ${
          canGoToGame
            ? `<a
            href="/#game/${canGoToGame.id}"
            class="btn btn-sm btn-primary"
          >
            Go to the game
          </a>`
            : ""
        }

       ${
         canAccceptGame
           ? `<button type="button"
        class="btn btn-sm btn-primary"
        data-action="accept-game"
        data-id="${canAccceptGame.id}">Accept to join the game</button>`
           : ""
       }
    </li>`;
    })
    .join("");

  const inviteGameButtonElements = document.querySelectorAll(
    '[data-action="invite-game"]'
  );

  const acceptGameButtonElements = document.querySelectorAll(
    '[data-action="accept-game"]'
  );

  inviteGameButtonElements.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const friendId = Number(event.target.getAttribute("data-id"));

      const result = await fetch(`${BACKEND_URL}/api/games/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invitationStatus: "PENDING",
          inviter: myUserData.id,
          invitee: friendId,
        }),
      });

      FriendsRender();
      FriendRequestsRender();
    });
  });

  acceptGameButtonElements.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const gameId = Number(event.target.getAttribute("data-id"));

      const result = await fetch(
        `${BACKEND_URL}/api/games/${gameId}/accept_game/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      window.location.href = `/#game/${gameId}`;

      FriendsRender();
      FriendRequestsRender();
    });
  });
}

export async function FriendRequestsRender() {
  const jwt = getToken();

  const friendRequestsListElement = document.getElementById(
    "friend-requests-list"
  );
  if (!friendRequestsListElement) {
    return null;
  }
  friendRequestsListElement.innerHTML = "";

  const responseFriendRequests = await fetch(
    `${BACKEND_URL}/api/friend_requests/me`,
    {
      headers: { Authorization: `Bearer ${jwt}` },
    }
  );
  friendRequests = await responseFriendRequests.json();

  friendRequests = friendRequests.filter((friendRequest) => {
    const toOurUser = friendRequest.to_user.id === myUserData.id;
    if (toOurUser) return friendRequest;
  });

  if (friendRequests.length <= 0) {
    friendRequestsListElement.innerHTML = "<p>No Friend Requests Yet</p>";
    return null;
  }

  const friendRequestsDataString = friendRequests
    .map((friendRequest) => {
      return `
  <li id="${friendRequest.id}" class="list-group-item d-flex gap-4 align-items-center">
      <h3>${friendRequest.from_user.username}</h3>
    <div className="d-flex gap-4">
      <button
        type="button"
        class="btn btn-sm btn-primary"
        data-action="confirm"
        data-from-id="${friendRequest.from_user.id}"
        data-id="${friendRequest.id}">Confirm</button>
        <button
        type="button"
        class="btn btn-sm btn-secondary "
        data-action="delete"
        data-from-id="${friendRequest.from_user.id}"
        data-id="${friendRequest.id}">Delete</button>
    </div>
  </li>`;
    })
    .join("");

  // render all the friend requests first
  friendRequestsListElement.innerHTML = friendRequestsDataString;

  // add the event listeners
  const confirmButtonElements = document.querySelectorAll(
    '[data-action="confirm"]'
  );
  const deleteButtonElements = document.querySelectorAll(
    '[data-action="delete"]'
  );

  confirmButtonElements.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const friendRequestId = event.target.getAttribute("data-id");
      const fromiId = event.target.getAttribute("data-from-id");

      await fetch(`${BACKEND_URL}/api/friend_requests/${friendRequestId}/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ intent: "confirm" }),
      });

      FriendsRender();
      FriendRequestsRender();
      sendFriendAcceptdNotifications(
        myUserData.id,
        myUserData.username,
        fromiId
      );
    });
  });

  deleteButtonElements.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const friendRequestId = event.target.getAttribute("data-id");
      const fromiId = event.target.getAttribute("data-from-id");

      const response = await fetch(
        `${BACKEND_URL}/api/friend_requests/${friendRequestId}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      FriendsRender();
      FriendRequestsRender();
      sendFriendDeletedNotifications(
        myUserData.id,
        myUserData.username,
        fromiId
      );
    });
  });
}
