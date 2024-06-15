import { getToken } from "../../utils/get-token.js";
import { BACKEND_URL } from "../../components/wcGlobal.js";
import { sendWaitMatchedMessage } from "../../components/wcGlobal-funcions-send-message.js";

export async function Matching_js() {
    const jwt = getToken();

    if (!jwt)
    {
      window.location.replace("/#");
    }
    if (!jwt) {
        return;
    }
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
    
    const existingGame_accept = games.find(
        (game) =>
            game.invitationStatus === "ACCEPTED" &&
            (game.invitee.id === userId || game.inviter.id === userId)
    );

    let currentTournamentId = localStorage.getItem("currentTournamentId");

    if (currentTournamentId)
    {
        button.disabled = true;
        statusDiv.innerHTML = '<p class="text-warning">You already have a Tournament invitation.</p>';
        return;
    }

    if (existingGame || existingGame_accept) {
        button.disabled = true;
        statusDiv.innerHTML = '<p class="text-warning">You already have a pending game invitation.</p>';
    } else {
        button.disabled = false;
        statusDiv.innerHTML = '';

        button.addEventListener('click', async () => {
            sendWaitMatchedMessage(userId);
            // console.log("Wait for match message sent");

            // Mostrar mensaje de búsqueda
            statusDiv.innerHTML = '<p class="text-info">Looking for a match...</p>';
            button.disabled = true;
        });
    }
}
