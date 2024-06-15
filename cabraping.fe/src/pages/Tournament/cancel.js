import { showNotification, showNotificationPopup } from "../../components/showNotification.js";
import { BACKEND_URL } from "../../components/wcGlobal.js";
import { getToken } from "../../utils/get-token.js";
import { getUserIdFromJWT } from "../Chat/funcions-js.js";
import { fetchTournaments } from "./funcions-js.js";


export async function update_cancel_of_tournament(tournamentId) {

    // getTournamentForId
    let my_tournamet = await getTournamentForId(tournamentId)

    // console.log("/////////// update_cancel_of_tournament: my_tournamet:", my_tournamet);

    if (my_tournamet.status === "completed"){
        return;
    }

    const response = await fetch(`${BACKEND_URL}/api/tournaments/${tournamentId}/update_status/`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: "canceled"
        })
    });

    let data = await response.json();

    // Diego, I don't think we need it since it is normal behaviour and it is covered by other notifications
    //if (!data.ok)
    //    showNotification("Error in the backend", "error");
}

export async function getTournamentForId(tournament_id) {

    const response = await fetch(`${BACKEND_URL}/api/tournaments/${tournament_id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        }
    });

    if (!response.ok){
        return null;
    }

    const data = await response.json();

    return data;

}

export async function checkUsers_is_part_of_valid_tournament(Check_id) {
    let tournaments = await fetchTournaments()

    if (tournaments.length == 0){
        showNotificationPopup("problems in the backend", "error");
        return null
    }

    // console.log("🚨 🚨? 🚨> Check_id:", Check_id);
    // console.log("🚨 🚨? 🚨> tournaments:",tournaments);

    const pendingTournament = tournaments.find(t => t.status === 'pending' && t.participants.some(p => p.user.id === Check_id));
    const progressTournament = tournaments.find(t => t.status === 'in_progress' && t.participants.some(p => p.user.id === Check_id));

    // console.log("🚨 🚨? 🚨> pendingTournament:",pendingTournament);
    // console.log("🚨 🚨? 🚨> progressTournament:",progressTournament);

    if (pendingTournament) {
        return false;
    }
    else if (progressTournament) {
        return false;
    }else{
        return true;
    }
}

