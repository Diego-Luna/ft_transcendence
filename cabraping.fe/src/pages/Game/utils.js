import { BACKEND_URL } from "../../components/wcGlobal.js";
import { getToken } from "../../utils/get-token.js";
import { getUserIdFromJWT } from "../Chat/funcions-js.js";
import { showNotification } from "../Tournament/funcions-js.js";


export async function next_game() {
    let number_of_games = getLocalhostSystem_game_on();

    if (number_of_games - 1 === 0 )
    {
        localStorage.removeItem("system_game_on");
    }
    else
    {
        setLocalhostSystem_game_on(number_of_games - 1);
    }

    if (number_of_games > 1)
    {
        let next_game = await Get_next_game();
        if (next_game)
        {
            window.location.href = `/#game/${next_game}`;
        }
        else
        {
            showNotification("Error in game", "error")
            window.location.href = `/#`;
        }
    }
}


async function Get_next_game() {

    let my_user_id = getUserIdFromJWT();

    const responseGames = await fetch(`${BACKEND_URL}/api/games/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const games = await responseGames.json();

      const game = games.find(
        (game) =>
          game.playMode === 2 &&
          game.invitationStatus === "ACCEPTED" &&
          (game.invitee.id === my_user_id ||
          game.inviter.id === my_user_id)
      );

      if (game) {
        return game.id
      }
    return false;
}

export async function GetSpecificGame(game_id) {
    const responseGame = await fetch(`${BACKEND_URL}/api/games/${game_id}/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

    return responseGame.json();
}

export function getLocalhostSystem_game_on() {
    return Number(localStorage.getItem("system_game_on"))
}

export function setLocalhostSystem_game_on(new_value) {
    localStorage.setItem("system_game_on", Number(new_value))
}