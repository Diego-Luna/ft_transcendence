import { sendDeleteMatchedMessage,  sendGameInitiate_Waiting, sendGameInviteTournamentNotifications, sendGameInviteNotifications, sendAcceptedGameNotifications } from "../../components/wcGlobal-funcions-send-message.js";
import { BACKEND_URL } from "../../components/wcGlobal.js";
import { getUserIdFromJWT } from "../Chat/funcions-js.js";
import { fetchTournaments } from "../Tournament/funcions-js.js";

let userId;
let myUserName;
let list_players_id;
let send_id;


export async function sendGameAcceptTournament_Waiting(new_userId, dest_user_id, new_myUserName) {

    // console.log("?????????????????????????");
    // console.log("??> sendGameAcceptTournament_Waiting:");
    let find_me = false;
    const jwt = localStorage.getItem('jwt');
    const update_waiting_list = await list_of_Tournament(getUserIdFromJWT(jwt));
    if (!jwt || !update_waiting_list) {
        return;
    }

    // console.log("----> Tournament: in sendGameAccept_Waiting:", update_waiting_list);
    // console.log("----> Tournament: in new_userId:", new_userId);
    // console.log("----> Tournament: in dest_user_id:", dest_user_id);

    // const waitingIds = JSON.parse(update_waiting_list);
    const waitingIds = update_waiting_list;
    if (waitingIds.length >= 2) {
        for (let i = 1; i < waitingIds.length; i += 2) {
            // console.log("-----> Matching: i:",i, ", waitingIds[i]:", waitingIds[i]);
            // console.log("-----> Matching: if 1:", (waitingIds[i] === Number(new_userId)) );
            // console.log("-----> Matching: if 2:", (waitingIds[i - 1] === Number(dest_user_id)) );
            if (waitingIds[i] === Number(new_userId) && waitingIds[i - 1] === Number(dest_user_id)) {
                find_me = true;
                break;
            }
        }
    }

    // console.log("----> Tournament: find_me:", find_me);
    if (!find_me) {
        return;
    }

    // console.log("----> Tournament: userId:", new_userId, ", dest_user_id:", dest_user_id);
    const responseGames = await fetch(`${BACKEND_URL}/api/games/`, {
        headers: { Authorization: `Bearer ${jwt}` },
    });
    const games = await responseGames.json();

    const game = games.find(
        (game) =>
            game.invitee.id === Number(new_userId) &&
            game.inviter.id === Number(dest_user_id) &&
            game.invitationStatus === "PENDING"
    );

    if (game) {
        const response = await fetch(
            `${BACKEND_URL}/api/games/${game.id}/accept_game/`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    "Content-Type": "application/json",
                },
            }
        );
        if (!response.ok) {
            // console.log("error in system");
        }
        // sendAcceptedGameNotifications(new_userId, new_myUserName, dest_user_id, game.id);
        sendAcceptedGameNotifications(new_userId, new_myUserName, dest_user_id, game.id);
        sendDeleteMatchedMessage(new_userId, dest_user_id);
        window.location.href = `/#game/${game.id}`;
    }
}

export async function sendGameAcceptTournament_final_Waiting(new_userId, dest_user_id, new_myUserName) {

    // console.log("?????????????????????????");
    // console.log("??> sendGameAcceptTournament_final_Waiting:");
    let find_me = false;
    const jwt = localStorage.getItem('jwt');
    const update_waiting_list = await list_of_Tournament(getUserIdFromJWT(jwt));
    if (!jwt || !update_waiting_list) {
        return;
    }

    // console.log("----> final: in sendGameAccept_Waiting:", update_waiting_list);
    // console.log("----> final: in new_userId:", new_userId);
    // console.log("----> final: in dest_user_id:", dest_user_id);

    // Verificar si ambos IDs existen en `waitingIds`
    const waitingIds = update_waiting_list;
    if (waitingIds.includes(Number(new_userId)) && waitingIds.includes(Number(dest_user_id))) {
        find_me = true;
    }

    // console.log("----> final: find_me:", find_me);
    if (!find_me) {
        return;
    }

    // console.log("----> final: userId:", new_userId, ", dest_user_id:", dest_user_id);
    const responseGames = await fetch(`${BACKEND_URL}/api/games/`, {
        headers: { Authorization: `Bearer ${jwt}` },
    });
    const games = await responseGames.json();

    const game = games.find(
        (game) =>
            game.invitee.id === Number(new_userId) &&
            game.inviter.id === Number(dest_user_id) &&
            game.invitationStatus === "PENDING"
    );

    if (game) {
        const response = await fetch(
            `${BACKEND_URL}/api/games/${game.id}/accept_game/`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    "Content-Type": "application/json",
                },
            }
        );
        if (!response.ok) {
            // console.log("error in system");
        }
        // sendAcceptedGameNotifications(new_userId, new_myUserName, dest_user_id, game.id);
        sendAcceptedGameNotifications(new_userId, new_myUserName, dest_user_id, game.id);
        sendDeleteMatchedMessage(new_userId, dest_user_id);
        window.location.href = `/#game/${game.id}`;
    }
}

async function list_of_Tournament(id) {

    let tem_list = []

    let tournaments = await fetchTournaments();

    // console.log("Tournament: id:", id);
    // console.log("Tournament: tournaments:", tournaments);

    if (!tournaments) {
        return null;
    }
    const pendingTournament = tournaments.find(t => t.status === 'in_progress' && t.participants.some(p => p.user.id === id));

    // console.log("in_progressTournament:", pendingTournament);
    if (!pendingTournament)
    {
        // alert("2 - Problem with the backend. Reload page."); // Diego, do we really want the user to see this and the other?
        return null;
    }


    pendingTournament.participants.map((participant) => tem_list.push(participant.user.id))

    return tem_list;
}

export async function system_invite_game_Tournament() {

    userId = getUserIdFromJWT();
    myUserName = localStorage.getItem("username");

    // console.log("🤖---> system_invite_game_Tournament");


    list_players_id = await list_of_Tournament(userId);

    // pendingTournament.participants.map((participant) => list_players_id.push(participant.user.id))

    // console.log("---> Tournament_game: list_players_id:", list_players_id);
    // console.log("---> Tournament_game: list_players_id:", list_players_id, ",userId:", userId, ", myUserName:", myUserName);
    if (list_players_id.length >= 2) {
        for (let i = 0; i < list_players_id.length; i += 2) {
            if (list_players_id[i] === userId) {
                // console.log("---> Tournament_game: sendGameInitiate_Waiting:", userId, list_players_id[i + 1]);
                let status = await sendGameInitiate_Waiting(userId, list_players_id[i + 1]);
                if (status.ok) {
                    // console.log("---> Tournament_game: Se mando la invitacion del juego con:", userId," de ", myUserName, ", a ",list_players_id[i + 1], "system-tournament");
                    sendGameInviteNotifications(userId, myUserName, list_players_id[i + 1], "system-tournament");
                    return true;
                }
                return false;
            }
        }
    }

}


export async function handle_Tournament_game_invite(tournament_id) {

    let status = await system_invite_game_Tournament()

    if ( status === true)
    {
        // console.log("----> _Tournament handle_Tournament_game_invite");
        sendGameInviteTournamentNotifications(userId, myUserName, 0, `system_Tournament_${tournament_id}`);
        localStorage.setItem(`system_Tournament_status_${tournament_id}`, "in");
    }
}