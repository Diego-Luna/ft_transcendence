import { BACKEND_URL } from "../../components/wcGlobal.js";
import { getToken } from "../../utils/get-token.js";
import { Stat_html } from "./html.js";

export async function Stat_js() {
  const jwt = getToken();

  if (!jwt) {
    window.location.replace("/#");
    return;
  }
  
  try {
    const [myUser, users, games, champ] = await Promise.all([
      fetchData(`${BACKEND_URL}/api/me/`, { headers: { Authorization: `Bearer ${jwt}` } }),
      fetchData(`${BACKEND_URL}/api/users/`),
      fetchData(`${BACKEND_URL}/api/games/`, { headers: { Authorization: `Bearer ${jwt}` } }),
      fetchData(`${BACKEND_URL}/api/tournaments/`, { headers: { Authorization: `Bearer ${jwt}` } })
    ]);
    
    const user_stat = calculateWinsAndLosses(games);
    const myUserStats = calculateMyUserStats(myUser, games, champ);
    const userChamp = countChampionships(champ);
    
    populateLeaderBoard(users, user_stat, userChamp);
    populateMatch(games);
    displayUserStats(myUser, myUserStats);

    setupNavigation();
  } catch (error) {
    // console.log('Error fetching data:', error);
  }
}

function setupNavigation() {
  document.querySelectorAll('.stat-nav-link').forEach(button => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const target = button.getAttribute('data-target');
      document.querySelectorAll('.stat-block').forEach(block => {
        block.style.display = 'none';
      });
      document.getElementById(target).style.display = 'block';
      document.querySelectorAll('.stat-nav-link').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });

  document.getElementById('wins-losses').style.display = 'block';
  document.querySelector('.stat-nav-link[data-target="wins-losses"]').classList.add('active');
}


function populateLeaderBoard(users, userStats, userChamp) {
  const usersListElement = document.getElementById("leaderboard");
  if (usersListElement) {
    let leaderboardHTML = `
      <tr class="table-dark">
        <th class="col-1">Rank</th>
        <th class="table-dark">Username</th>
        <th class="table-dark">Wins</th>
        <th class="table-dark">Losses</th>
        <th class="table-dark">Tournament Wins</th>
      </tr>
    `;
    
    const sortedUsers = users.map(user => {
      const stats = userStats[user.id] || { wins: 0, losses: 0 };
      return {
        ...user,
        wins: stats.wins,
        losses: stats.losses,
        championWins: userChamp[user.id] || 0
      };
    }).sort((a, b) => b.wins - a.wins || a.losses - b.losses);

    sortedUsers.forEach((user, index) => {
      const rank = index + 1;
      leaderboardHTML += `
        <tr class="table-dark">
          <td class="col-1"># ${rank}</td>
          <td class="table-info">${user.username}</td>
          <td class="table-success">${user.wins}</td>
          <td class="table-warning">${user.losses}</td>
          <td class="table-danger">${user.championWins}</td>
        </tr>
      `;
    });

    usersListElement.innerHTML = leaderboardHTML;
  }
}

function populateMatch(gameResults) {
  const tableBody = document.getElementById("history-list");
  if (tableBody) {
    tableBody.innerHTML = gameResults.map((game) => {
      const winner = game.winner.username;
      const loser = game.winner.id === game.inviter.id ? game.invitee.username : game.inviter.username;
      const date = new Date(game.createdAt).toLocaleDateString();
      const time = new Date(game.createdAt).toLocaleTimeString();
      const score_invitee = game.inviteeScore;
      const score_inviter = game.inviterScore;
      return `
        <tr>
          <td class="table-success">${winner}</td>
          <td class="table-warning">${loser}</td>
          <td class="table-warning">${score_invitee} - ${score_inviter}</td>
          <td class="table-light">${time}</td>
          <td class="table-light">${date}</td>
        </tr>
      `;
    }).join("");
  }
}

function calculateWinsAndLosses(gameResults) {
  const userStats = {};
  gameResults.forEach(game => {
    const { inviter, invitee, winner } = game;
    if (!userStats[inviter.id]) userStats[inviter.id] = { wins: 0, losses: 0, username: inviter.username };
    if (!userStats[invitee.id]) userStats[invitee.id] = { wins: 0, losses: 0, username: invitee.username };
    if (winner.id === inviter.id) {
      userStats[inviter.id].wins += 1;
      userStats[invitee.id].losses += 1;
    } else {
      userStats[invitee.id].wins += 1;
      userStats[inviter.id].losses += 1;
    }
  });
  return userStats;
}

function countChampionships(tournaments) {
  const userChampionships = {};
  tournaments.forEach(tournament => {
    const championId = tournament.champion;
    if (championId) {
      if (!userChampionships[championId]) userChampionships[championId] = 0;
      userChampionships[championId]++;
    }
  });
  return userChampionships;
}

function calculateMyUserStats(myUser, gameResults, tournaments) {
  let myUserStats = { played: 0, wins: 0, losses: 0, championships: 0 };
  gameResults.forEach(game => {
    const { inviter, invitee, winner } = game;
    if (inviter.id === myUser.id || invitee.id === myUser.id) {
      myUserStats.played += 1;
      if (winner.id === myUser.id) myUserStats.wins += 1;
      else myUserStats.losses += 1;
    }
  });
  tournaments.forEach(tournament => {
    if (tournament.champion === myUser.id) myUserStats.championships += 1;
  });
  return myUserStats;
}

async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    // console.log(`Failed to fetch ${url}: ${error}`);
    return null;
  }
}

function displayUserStats(myUser, myUserStats) {
  document.getElementById('avatarImageURL').src = myUser.avatarImageURL;
  document.getElementById('username').innerText = myUser.username;
  document.getElementById('first_name').innerText = myUser.first_name;
  document.getElementById('last_name').innerText = myUser.last_name;
  document.getElementById('played').innerText = myUserStats.played;
  document.getElementById('wins').innerText = myUserStats.wins;
  document.getElementById('losses').innerText = myUserStats.losses;
  document.getElementById('championships').innerText = myUserStats.championships;
}

  
  
  
  
  