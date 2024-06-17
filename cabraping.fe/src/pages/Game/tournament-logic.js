import { showNotification, showNotificationPopup } from "../../components/showNotification.js";
import { timeout } from "../../components/utils.js";
import { sendFinishTournamentNotifications, sendGameInitiate_Waiting, sendGameInviteNotifications, sendGameInviteTournamentNotifications, sendWinnerOfGameTournamentNotifications } from "../../components/wcGlobal-funcions-send-message.js";
import { BACKEND_URL } from "../../components/wcGlobal.js";
import { getToken } from "../../utils/get-token.js";
import { getUserIdFromJWT } from "../Chat/funcions-js.js";
import { update_cancel_of_tournament } from "../Tournament/cancel.js";
import { fetchTournaments, loadTournamentData } from "../Tournament/funcions-js.js";
// import { handle_Tournament_game_invite } from "../TournamentWaitingArea/game-logic.js";


async function update_winner_of_tournament(tournamentId, winner) {


    const response = await fetch(`${BACKEND_URL}/api/tournaments/${tournamentId}/update_status/`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: "completed",
            champion: Number(winner)
        })
    });

    showNotification("You won the tournament. Congratulations!", "success");
    // console.log("The tournament is finished!");
    window.location.href = `/#`;


}

export async function Send_data_bacnd_the_winner(first_player, secong_player, winner) {

    // localStorage.setItem('currentTournamentId', pendingTournament.id);
    let tournament_id = localStorage.getItem("currentTournamentId");
    // console.log("-----------------------------");
    // console.log("-> tournament_id:", tournament_id);

    if (!tournament_id)
        return;

    const tournaments = await fetchTournaments();
    // console.log("-> tournaments:", tournaments);
    if (!tournaments)
        return;

    let userId = getUserIdFromJWT();
    const pendingTournament = tournaments.find(t => t.status === 'in_progress' && t.participants.some(p => p.user.id === userId));

    // console.log("-> pendingTournament:", pendingTournament);
    // console.log("-----------------------------");

    if (!pendingTournament) {
        return;
    }


    let user_id = getUserIdFromJWT();

    if (winner !== user_id ){
        showNotification("You lost. Better luck next time.", "error");
        // console.log("🥻🥻🥻>> winner:", winner, ", user_id:", user_id);
        window.location.href = `/#`;
        return;
    }

    showNotification("You won. Congratulations!", "success");

    let myUserName = localStorage.getItem("username");

    const response = await fetch(
        `${BACKEND_URL}/api/matches/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tournament: tournament_id,
            participant1: first_player,
            participant2: secong_player,
            winner: winner
          }),
        }
    );

    if ((response.ok && response.json().error) || !response.ok)
    {
        showNotification("Error in the Tournament, tournament cancel", "error");
        await update_cancel_of_tournament(tournament_id);
        return;
    }


    if (response.ok){

        sendWinnerOfGameTournamentNotifications(user_id, "null",  `system_Tournament_${tournament_id}:${winner}`);
    }else{
        showNotification("Error in the tournament", "error");
        // console.log("Error in the tournament");
        return;
    }

    if (winner === user_id) {
        const matchesResponse = await fetch(`${BACKEND_URL}/api/tournaments/${tournament_id}/`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            }
        });

        const data = await matchesResponse.json();
        const matches = data.matches;
        // console.log("------------------------> matches:", matches);
        if (matches.length <= 2 && !localStorage.getItem(`final_tournametn_${localStorage.getItem("currentTournamentId")}`)) {
            let system_winner = localStorage.getItem(`system_Tournament_${tournament_id}_winner`);
            if (!system_winner){
                system_winner = winner;
            }

            if (!system_winner || system_winner === "no") {
                return;
            }
            let system_final = localStorage.getItem(`system_Tournament_status_${tournament_id}`);
            let system_final_final = localStorage.getItem(`system_Tournament_status_${tournament_id}_final`);

            if (system_winner !== user_id) {
                localStorage.removeItem(`final_tournametn_${localStorage.getItem("currentTournamentId")}`);
                let status = await sendGameInitiate_Waiting(user_id, system_winner);
                // console.log("🧶🧶🧶🧶>> user_id:", status);
                if (status.ok) {
                    // console.log("---> Tournament_game (system_winner): Se mando la invitacion del juego con:", user_id, " de ", myUserName, ", a ", system_winner, "system-tournament-final");
                    sendGameInviteNotifications(user_id, myUserName, system_winner, "system-tournament-final");
                    localStorage.setItem(`system_Tournament_status_${tournament_id}`, "final");
                    window.location.href = `/#waitroom/${tournament_id}`;
                    return true;
                }
            }
        }
        else{
            console.log("finish");
            // console.log("soy el ganador y voy a terminar el tournament");
            localStorage.setItem(`system_Tournament_status_${tournament_id}`, "no");
            update_winner_of_tournament(tournament_id, winner);
            sendFinishTournamentNotifications(getUserIdFromJWT());
        }


    }


    if (localStorage.getItem("currentTournamentId"))
    {
        if (!localStorage.getItem(`final_tournametn_${localStorage.getItem("currentTournamentId")}`))
        {
            console.log("run");
            showNotification("You are going to be in the grand final. Waiting for the competitor...", "info");
        }
        localStorage.setItem(`final_tournametn_${localStorage.getItem("currentTournamentId")}`, true);
        await timeout(1000);
    }

    return false;
}
