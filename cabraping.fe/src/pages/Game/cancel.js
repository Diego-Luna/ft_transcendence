

// https://localhost/api/games/21/

import { sendGameCancelTournamentNotifications } from "../../components/wcGlobal-funcions-send-message.js";
import { BACKEND_URL } from "../../components/wcGlobal.js";
import { getToken } from "../../utils/get-token.js";
import { getUserIdFromJWT } from "../Chat/funcions-js.js";

export async function Cancel_a_Game(gameId) {

    gameId = Number(gameId)

    // console.log("🐹🐹 Cancel_a_Game:", gameId);

    const responseGame = await fetch(`${BACKEND_URL}/api/games/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

    let existe = await responseGame.json();


    // console.log("🐹🐹 existe:", existe);

    if (!(existe.some((game) => game.id === gameId)))
    {
        return null;
    }

    // console.log("🐹🐹 yes");
    const response = await fetch(
        `${BACKEND_URL}/api/games/${gameId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          }
        }
    );

    let status = await response;

    // sendGameCancelTournamentNotifications();

    let user_id = getUserIdFromJWT();
    let user_name = localStorage.getItem("username");

    let chec_game_info = existe.find((game) => game.id === gameId);

    let send_notificaque;
    if (chec_game_info.inviter.id ===user_id)
    {
        send_notificaque = chec_game_info.invitee.id
    }
    else
    {
        send_notificaque = chec_game_info.inviter.id
    }

    return send_notificaque;
    // console.log("🐹🐹 yes");
}


export async function checkAcceptedGames(userId) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/games/`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            // console.error('Error fetching games:', response.statusText);
            return;
        }

        const games = await response.json();
        const acceptedGame = games.find(game =>
            (game.invitee.id === userId || game.inviter.id === userId) &&
            game.invitationStatus === "ACCEPTED"
        );

        if (acceptedGame) {
            // console.log("Accepted game found:", acceptedGame);
            return acceptedGame
        } else {
            // console.log("No accepted games found for user:", userId);
            return null
        }

    } catch (error) {
        // console.error('Network error fetching games:', error);
        return null
    }
}

export function getDifference_in_array(arr1, arr2) {
    // Convert the second array to a Set for faster lookup
    const set2 = new Set(arr2);
    
    // Filter arr1 to include only elements not present in set2
    return arr1.filter(element => !set2.has(element));
}