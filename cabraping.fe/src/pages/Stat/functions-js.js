import { Stat_html } from "./html.js";

const BACKEND_URL = "http://localhost:8000";
let users = [];

function calculateWinsAndLosses(gameResults) {
  const userStats = {};

  gameResults.forEach((game) => {
    const { inviter, invitee, winner } = game;

    // Initialize stats for inviter and invitee if not already present
    if (!userStats[inviter.id]) {
      userStats[inviter.id] = {
        wins: 0,
        losses: 0,
        username: inviter.username,
      };
    }
    if (!userStats[invitee.id]) {
      userStats[invitee.id] = {
        wins: 0,
        losses: 0,
        username: invitee.username,
      };
    }

    // Update stats
    if (winner.id === inviter.id) {
      userStats[inviter.id].wins += 1;
      userStats[invitee.id].losses += 1;
    } else if (winner.id === invitee.id) {
      userStats[invitee.id].wins += 1;
      userStats[inviter.id].losses += 1;
    }
  });

  return userStats;
}

function calculateMyUserStats(myUser, gameResults) {
  let myUserStats = {
    played: 0,
    wins: 0,
    losses: 0,
  };

  gameResults.forEach((game) => {
    const { inviter, invitee, winner } = game;
    if (inviter.id === myUser.id || invitee.id === myUser.id) {
      myUserStats.played += 1;
      if (winner.id === myUser.id) {
        myUserStats.wins += 1;
      } else {
        myUserStats.losses += 1;
      }
    }
  });

  return myUserStats;
}

// Function to fetch and display user statistics
export async function Stat_js() {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) return null;

  const responseMyUser = await fetch(`${BACKEND_URL}/api/me/`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const myUser = await responseMyUser.json();
  if (!myUser) return null;

  const responseUsers = await fetch(`${BACKEND_URL}/api/users/`);
  users = await responseUsers.json();
  if (!users) return null;

  const responseGames = await fetch(`${BACKEND_URL}/api/games/`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const games = await responseGames.json();
  if (!games) return null;

  const user_stat = calculateWinsAndLosses(games);
  const myUserStats = calculateMyUserStats(myUser, games);

  users = users.map((user) => ({
    ...user,
    wins: user_stat[user.id] ? user_stat[user.id].wins : 0,
    losses: user_stat[user.id] ? user_stat[user.id].losses : 0,
  }));
  users.sort((a, b) => b.wins - a.wins);

  populateLeaderBoard(users, user_stat);
  populateMatch(games);

  document.querySelectorAll(".stat-nav-link").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const target = button.getAttribute("data-target");
      document.querySelectorAll(".stat-block").forEach((block) => {
        block.style.display = "none";
      });
      document.getElementById(target).style.display = "block";
      document
        .querySelectorAll(".stat-nav-link")
        .forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
    });
  });

  // Display the default stat block
  // document.getElementById('wins-losses').style.display = 'block';
  // document.querySelector('.stat-nav-link[data-target="wins-losses"]').classList.add('active');
  // document.getElementById('avatarImageURL').src = myUser.avatarImageURL;
  // document.getElementById('username').innerText = myUser.username;
  // document.getElementById('first_name').innerText = myUser.first_name;
  // document.getElementById('last_name').innerText = myUser.last_name;
  // document.getElementById('played').innerText = myUserStats.played;
  // document.getElementById('wins').innerText = myUserStats.wins;
  // document.getElementById('losses').innerText = myUserStats.losses;
}

function populateLeaderBoard(users, userStats) {
  const usersListElement = document.getElementById("users-list");
  if (usersListElement) {
    usersListElement.innerHTML = `
            <tr class="table-dark">
              <td class="col-1">Rank</th>
              <td class="table-dark">Username</th>
              <td class="table-dark">Wins</th>
              <td class="table-dark">Losses</th>
              <td class="table-dark">Tournament Wins</th>
          </tr>
        `;

    users.forEach((user, index) => {
      const stats = userStats[user.id] || { wins: 0, losses: 0 };
      const rank = index + 1;

      usersListElement.innerHTML += `
          <tr class="table-dark">
            <td class="col-1"># ${rank}</td>
            <td class="table-info">${user.username}</td>
            <td class="table-success">${stats.wins}</td>
            <td class="table-warning">${stats.losses}</td>
            <td class="table-danger">waitin for Rachel</td>
          </tr>
        `;
    });
  }
}

function populateMatch(gameResults) {
  const tableBody = document.getElementById("history-list");
  if (tableBody) {
    tableBody.innerHTML = gameResults
      .map((game) => {
        const winner = game.winner.username;
        const loser =
          game.winner.id === game.inviter.id
            ? game.invitee.username
            : game.inviter.username;
        const date = new Date(game.createdAt).toLocaleDateString();
        const time = new Date(game.createdAt).toLocaleTimeString();
        return `
          <tr>
            <td class="table-success">${winner}</th>
            <td class="table-warning">${loser}</th>
            <td class="table-light">${time}</th>
            <td class="table-light">${date}</th>
          </tr>
        `;
      })
      .join("");
  }
}

// Call the Stat_js function to display user statistics
Stat_js();
