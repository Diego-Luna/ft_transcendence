import { getHash } from '../../utils/getHash.js';
import { getToken } from "../../utils/get-token.js";
import { showNotification, showNotificationPopup } from '../../components/showNotification.js';
import { handleTournamentWebSocketMessage, activeWebSockets, connectWebSocketGlobal, BACKEND_URL } from '../../components/wcGlobal.js';
import { connectTournamentWebSocket } from "../Tournament/funcions-js.js";
import { getUserIdFromJWT } from '../Chat/funcions-js.js';
import { handle_Tournament_game_invite } from './game-logic.js';
import { getTournamentForId, update_cancel_of_tournament } from '../Tournament/cancel.js';


// Check if all participants have accepted the invitation
function allParticipantsAccepted(participants) {
    return participants.every(participant => participant.accepted_invite);
}

// Enable or disable the start button based on participant status
function updateStartButton(participants) {
    const tournamentId = getHash() || null;
    if (!tournamentId) {
        // console.error("Tournament ID is null or invalid");
        return;
    }
    const startButton = document.getElementById('startTournamentButton');
    if (!startButton) {
        // console.error("startTournamentButton element not found");
        return;
    }

    if (allParticipantsAccepted(participants)) {
        startButton.disabled = false;
        if (!startButton.dataset.listenerAttached) {
            startButton.addEventListener('click', async function() {
                // const userId = localStorage.getItem('userId'); // Ensure userId is defined
                const userId = getUserIdFromJWT(); // Ensure userId is defined
                if (!userId) {
                    // console.error("userId is not defined");
                    return;
                }

                let check_tournament = await getTournamentForId(tournamentId);

                if (!check_tournament)
                {
                    showNotification("Sorry, Error in cokies, login again.", "error");
                    return;
                }

                // console.log("run -if check_tournament.participants[0].id:", (check_tournament.participants[0].id));
                // console.log("run -if userId:", (userId));
                // console.log("run -if check_tournament.participants[0].id !== userId:", (check_tournament.participants[0].id !== userId));
                if (check_tournament.participants[0].user.id !== userId)
                {
                    showNotification("Sorry, friend. Only the creator can start the tournament.", "error");
                    return;
                }

                startButton.disabled = true;
                const cancelButton = document.getElementById('cancelTournamentButton');
                if (cancelButton) cancelButton.disabled = true
                try {
                    const response = await fetch(`${BACKEND_URL}/api/tournaments/${tournamentId}/update_status/`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${getToken()}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            status: "in_progress"
                        })
                    });

                    if (response.ok) {
                        // Clear the waiting participants list
                        const participantsList = document.getElementById('waitingParticipantsList');
                        if (participantsList) {
                            participantsList.innerHTML = '';
                        }
                        // Diego to do - logic game - update everyone
                        handle_Tournament_game_invite(tournamentId);
                    } else {
                        // console.error('Failed to notify the server about readiness');
                    }
                } catch (error) {
                    // console.error('Error notifying the server about readiness:', error);
                }
            });
            startButton.dataset.listenerAttached = true;
        }
    } else {
        startButton.disabled = true;
    }
}

// Fetch the list of participants from the server
export async function fetchParticipantsRSVPs(tournamentId) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/participants/status/?tournament_id=${tournamentId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const participants = await response.json(); 
            return participants.map(participant => ({
                username: participant.user.username, 
                accepted_invite: participant.accepted_invite
            }));
        } else {
            // console.error('Failed to fetch participants status');
            return [];
        }
    } catch (error) {
        // console.error('Error fetching participants:', error);
        return [];
    }
}

// Update the participant list in the UI
export function updateWaitingParticipantsList(participants) {
    const participantsList = document.getElementById('waitingParticipantsList');
    if (participantsList) {
        participantsList.innerHTML = ''; // Clear the current list

        participants.forEach(participant => {
            const participantName = participant.username || 'Unknown';
            const status = participant.accepted_invite ? 'Joined' : 'Waiting';
            const listItem = document.createElement('li');
            listItem.textContent = `${participantName} - ${status}`;
            participantsList.appendChild(listItem);
        });

        updateStartButton(participants);
    }
}

function updateCancelButton(isCreator) {
    const cancelButton = document.getElementById('cancelTournamentButton');
    if (cancelButton) {
        cancelButton.disabled = false; // Enable the button for all participants
        if (!cancelButton.dataset.listenerAttached) {
            cancelButton.addEventListener('click', async function() {
                const tournamentId = localStorage.getItem('currentTournamentId');
                let user_id = getUserIdFromJWT();

                // console.log("-> tournamentId:", tournamentId);
                let tournament = await getTournamentForId(tournamentId)

                // console.log("-> tournament:", tournament);

                if (tournament.participants[0].user.id === user_id) {
                    // console.log("Creator canceled the tournament.");
                    const message = {
                        type: 'tournament_canceled',
                        event: 'tournament_canceled',
                        message: 'The tournament has been canceled by the creator.',
                        tournament_id: tournamentId
                    };
                    if (activeWebSockets[tournamentId]) {
                        activeWebSockets[tournamentId].send(JSON.stringify(message));
                    } else {
                        // console.error("WebSocket connection not found for tournament", tournamentId);
                    }

                    await update_cancel_of_tournament(tournamentId);
                } else {
                    showNotification("Cancellation failed. Only the creator can cancel the tournament.", "error");
                }
            });
            cancelButton.dataset.listenerAttached = true;
        }
    }
}

// Diego
export async function CancelTournament_for_descconecte_() {
    const tournamentId = localStorage.getItem('currentTournamentId');
    const message = {
        type: 'tournament_canceled',
        event: 'tournament_canceled',
        message: 'The tournament has been canceled by the creator.',
        tournament_id: tournamentId
    };
    if (activeWebSockets[tournamentId]) {
        activeWebSockets[tournamentId].send(JSON.stringify(message));
    } else {
        // console.error("WebSocket connection not found for tournament", tournamentId);
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    // Set up the event listener for the start button
    const startButton = document.getElementById('startTournamentButton');
    if (startButton) {

        const userId = getUserIdFromJWT();
        if (!userId) {
            // console.error("userId is not defined");
            return;
        }

        let check_tournament = await getTournamentForId(tournamentId);

        if (check_tournament.participants[0].user.id !== userId)
        {
            // startButton.style.display = 'none';
            startButton.disabled = true;
            return;
        }

        startButton.addEventListener('click', async function() {
            const tournamentId = getHash() || null;
            if (!tournamentId) {
                // console.error("Tournament ID is null or invalid");
                return;
            }

            // const userId = localStorage.getItem('userId');
            const userId = getUserIdFromJWT();
            if (!userId) {
                // console.error("userId is not defined");
                return;
            }

            let check_tournament = await getTournamentForId(tournamentId);

            // console.log("run -if check_tournament.participants[0].id:", (check_tournament.participants[0].id));
            // console.log("run -if userId:", (userId));
            // console.log("run -if check_tournament.participants[0].id !== userId:", (check_tournament.participants[0].id !== userId));
            if (check_tournament.participants[0].user.id !== userId)
            {
                showNotification("only the created one can start it", "error");
                return;
            }


            // try {
            //     const response = await fetch(`${BACKEND_URL}/api/tournaments/${tournamentId}/set_ready/`, {
            //         method: 'POST',
            //         headers: {
            //             'Authorization': `Bearer ${getToken()}`,
            //             'Content-Type': 'application/json'
            //         },
            //         body: JSON.stringify({
            //             tournament_id: tournamentId,
            //             user_id: userId
            //         })
            //     });

            //     if (response.ok) {
            //         console.log('User is ready for the tournament');
            //     } else {
            //         console.error('Failed to notify the server about readiness');
            //     }
            // } catch (error) {
            //     console.error('Error notifying the server about readiness:', error);
            // }
        });
    }

    // Set up the event listener for the cancel button
    const cancelButton = document.getElementById('cancelTournamentButton');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            const tournamentId = localStorage.getItem('currentTournamentId');
            const message = {
                type: 'tournament_canceled',
                event: 'tournament_canceled',
                message: 'The tournament has been canceled by the creator.',
                tournament_id: tournamentId
            };
            if (activeWebSockets[tournamentId]) {
                activeWebSockets[tournamentId].send(JSON.stringify(message));
            } else {
                // console.error("WebSocket connection not found for tournament", tournamentId);
            }
        });
    }
});


function check_if_i_am_part_of__tournament(tournament) {

    if (!(tournament.status === 'pending' || tournament.status === 'in_progress'))
    {
        // console.log("Tournament ID is null or invalid");
        //showNotificationPopup("Tournament ID is null or invalid", 'error');
        return false;
    }

    let userId = getUserIdFromJWT();

    // console.log("userId:", userId);
    // console.log("pendingTournament:", tournament.participants[0]);

    const pendingTournament = tournament.participants.some(p => p.user.id === userId);

    // console.log("pendingTournament:", pendingTournament);
    if (pendingTournament) {
        if(pendingTournament.id)
        {
            localStorage.setItem('currentTournamentId', pendingTournament.id);
            localStorage.setItem(`system_Tournament_status_${pendingTournament.id}`, "in");
        }
        // console.log("siiiiiiiii");
        return true;
    }

    // console.log("noooooooooo");
    return false;
}

// Initialize the Tournament Launch Area
async function initializeTournamentWaitingArea() {

    let jwt = localStorage.getItem('jwt');

    if (!jwt) {
      window.location.href = '/#';
      return;
    }

    const tournamentId = getHash() || null;
    if (!tournamentId) {
        // // console.log("Tournament ID is null or invalid");
        return;
    }

    let tournament_data = await getTournamentForId(tournamentId);

    // console.log("🚨🚨🚨🚨 tournament_data:", tournament_data);

    if (!tournament_data) {
        // console.log("Tournament ID is null or invalid");
        //showNotificationPopup("Tournament ID is null or invalid. Reloading page.");
        window.location.href = '/#';
        return;
    }

    let zstatus = check_if_i_am_part_of__tournament(tournament_data);
    // console.log("--? : check_if_i_am_part_of__tournament:", zstatus);
    if (zstatus === false){

        // console.log("por que");
        window.location.href = '/#';
        return;
    }

    const creatorUsername = localStorage.getItem('creatorUsername_' + tournamentId);
    const isCreator = localStorage.getItem('username') === creatorUsername;

    // Ensure WebSocket connection
    if (!activeWebSockets[tournamentId] || activeWebSockets[tournamentId].readyState === WebSocket.CLOSED) {
        connectTournamentWebSocket(tournamentId);
    }

    // setInterval(async () => {
    //     console.log(">> setInterval tournamentId:", tournamentId);
    //     const participants = await fetchParticipantsRSVPs(tournamentId);
    //     updateWaitingParticipantsList(participants);
    //     updateCancelButton(isCreator);
    // }, 5000);

    update_list_tournamet();


}


export async function update_list_tournamet() {

    let tournamentId_update_list_tournamet = localStorage.getItem("currentTournamentId");

    if (!tournamentId_update_list_tournamet)
    {
        return;
    }

    const creatorUsername = localStorage.getItem('creatorUsername_' + tournamentId_update_list_tournamet);
    const isCreator = localStorage.getItem('username') === creatorUsername;

    // console.log(">> setInterval tournamentId:", tournamentId_update_list_tournamet);
    const participants = await fetchParticipantsRSVPs(tournamentId_update_list_tournamet);
    updateWaitingParticipantsList(participants);
    updateCancelButton(isCreator);
}


export function startTournament() {
    // console.log('All participants are ready. Starting the tournament...');
    // window.location.href = `/tournament/${tournamentId}/remote-users`;
}

export async function handleTournamentCanceled(data) {

    const { message, tournament_id } = data;

    let my_tournamet = await getTournamentForId(tournament_id)

    // console.log("/////////// my_tournamet:", my_tournamet);

    if (my_tournamet.status === "completed"){
        return;
    }

    showNotificationPopup('Tournament canceled.', message);
    
    // Remove tournament data from local storage
    localStorage.removeItem('pageTournament');
    localStorage.removeItem(`creatorUsername_${tournament_id}`);
    localStorage.removeItem('currentTournamentId');
    
    // Clear the participants list in the waiting area
    const participantsList = document.getElementById('waitingParticipantsList');
    if (participantsList) {
        participantsList.innerHTML = '';
    }
    
    // Clear form inputs
    const tournamentNameInput = document.getElementById('tournamentNameInput');
    if (tournamentNameInput) {
        tournamentNameInput.value = '';
    }
    const participantNameInput = document.getElementById('participantNameInput');
    if (participantNameInput) {
        participantNameInput.value = '';
    }

    // Close WebSocket connections
    if (activeWebSockets[tournament_id]) {
        activeWebSockets[tournament_id].close();
        delete activeWebSockets[tournament_id];
    }

    // update_cancel_of_tournament
    await update_cancel_of_tournament(tournament_id);

    setTimeout(() => {
        window.location.href = '/#';
    }, 3000);
}

export { initializeTournamentWaitingArea };
