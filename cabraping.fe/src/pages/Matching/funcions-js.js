import { getToken } from "../../utils/get-token.js";
import { sendWaitMatchedMessage } from "../../components/wcGlobal.js";
// import { BACKEND_URL } from "../../constants";

const frontendURL = new URL(window.location.href);
const serverIPAddress = frontendURL.hostname;
const serverPort = 8000; // Specify the port your backend server is running on
const BACKEND_URL = `http://${serverIPAddress}:${serverPort}`;

export async function Matching_js() {
    const jwt = getToken();
    const payload = jwt.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    const userId = decodedPayload.user_id;

    const button = document.getElementById('start-matching-button');
    const statusDiv = document.getElementById('matching-status');

    // Verificar el estado de las invitaciones
    const responseGames = await fetch(`${BACKEND_URL}/api/games/`, {
        headers: { Authorization: `Bearer ${jwt}` },
    });
    const games = await responseGames.json();

    const existingGame = games.find(
        (game) =>
            game.invitationStatus === "PENDING" &&
            (game.invitee.id === userId || game.inviter.id === userId)
    );

    if (existingGame) {
        button.disabled = true;
        statusDiv.innerHTML = '<p class="text-warning">You already have a pending game invitation.</p>';
    } else {
        button.disabled = false;
        statusDiv.innerHTML = '';

        button.addEventListener('click', async () => {
            sendWaitMatchedMessage(userId);
            console.log("Wait for match message sent");

            // Mostrar mensaje de búsqueda
            statusDiv.innerHTML = '<p class="text-info">Looking for a match...</p>';
            button.disabled = true;
        });
    }
}




// import { getToken } from "../../utils/get-token.js";
// import { sendWaitMatchedMessage } from "../../components/wcGlobal.js";

// export function Matching_js() {
//     document.getElementById('start-matching-button').addEventListener('click', async () => {
//         const jwt = getToken();
//         const payload = jwt.split('.')[1];
//         const decodedPayload = JSON.parse(atob(payload));
//         const userId = decodedPayload.user_id;

//         sendWaitMatchedMessage(userId);
//         console.log("Wait for match message sent");
//     });
// }
