import { getHash } from '../../utils/getHash.js';

// Extract the IP address from the URL used to access the frontend
const frontendURL = new URL(window.location.href);
const serverIPAddress = frontendURL.hostname;
const serverPort = 8000; // Specify the port your backend server is running on
const BACKEND_URL = `http://${serverIPAddress}:${serverPort}`;

let users = [];
let userId = null;

function calculateWinsAndLosses(gameResults) {
  const userStats = {};

  gameResults.forEach(game => {
      const { inviter, invitee, winner } = game;

      // Initialize stats for inviter and invitee if not already present
      if (!userStats[inviter.id]) {
          userStats[inviter.id] = { wins: 0, losses: 0, username: inviter.username };
      }
      if (!userStats[invitee.id]) {
          userStats[invitee.id] = { wins: 0, losses: 0, username: invitee.username };
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
    losses: 0
  };

  gameResults.forEach(game => {
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

export async function Profile_js() {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) return null;

userId = getHash() || null;
if (userId === '/') userId = null;
  
const responseUsers = await fetch(`${BACKEND_URL}/api/users/`);
users = await responseUsers.json();
let myUser;
if (userId) {
    myUser = users.find(user => user.id === parseInt(userId));
} else {
    const responseMyUser = await fetch(`${BACKEND_URL}/api/me-full/`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    myUser = await responseMyUser.json();
}
  
  const responseGames = await fetch(`${BACKEND_URL}/api/games/`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const games = await responseGames.json();
  if (!games) return null;

  const user_stat = calculateWinsAndLosses(games);
  const myUserStats = calculateMyUserStats(myUser, games);

  users = users.map(user => ({
    ...user,
    wins: user_stat[user.id] ? user_stat[user.id].wins : 0,
    losses: user_stat[user.id] ? user_stat[user.id].losses : 0
  }));
  users.sort((a, b) => b.wins - a.wins);

  document.getElementById('selfstats').style.display = 'block';
  document.getElementById('avatarImageURL').src = myUser.avatarImageURL;
  document.getElementById('username').innerText = myUser.username;
  document.getElementById('first_name').innerText = myUser.first_name;
  document.getElementById('last_name').innerText = myUser.last_name;
  document.getElementById('played').innerText = myUserStats.played;
  document.getElementById('wins').innerText = myUserStats.wins;
  document.getElementById('losses').innerText = myUserStats.losses;
}

// Call the Profile_js function to display user statistics
//Profile_js();
