import { getToken } from "../../utils/get-token.js";

// Extract the IP address from the URL used to access the frontend
const frontendURL = new URL(window.location.href);
const serverIPAddress = frontendURL.hostname;
const serverPort = 8000; // Specify the port your backend server is running on
const BACKEND_URL = `http://${serverIPAddress}:${serverPort}`;

export async function Friends_html() {

  const jwt = localStorage.getItem('jwt');
  if (!jwt) {
      window.location.href = '/#';
      return;
  }

  return `
    <div class="container-sm min-vh-100">
      <h2>All of My Friends</h2>
      <ul id="friends-list" class="list-group">
        <!-- friendsData -->
        <p>No Friends Yet</p>
      </ul>

      <h2>Friend Requests</h2>
      <p>We are the invitee</p>
      <ul id="friend-requests-list" class="list-group">
        <!-- friendsData -->
        <p>No Friend Requests Yet</p>
      </ul>
    </div>
  `;
}
