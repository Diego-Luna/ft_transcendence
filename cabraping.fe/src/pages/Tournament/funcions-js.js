import { getToken } from "../../utils/get-token.js";
import { showNotification, showNotificationPopup } from '../../components/showNotification.js';
import { sendTournamentInvitation, activeWebSockets, handleTournamentWebSocketMessage, getUserIdByUsername, BACKEND_URL, WS_URL } from '../../components/wcGlobal.js';
import { getUserIdFromJWT } from "../Chat/funcions-js.js";
import { fetchParticipantsRSVPs } from "../TournamentWaitingArea/functions-js.js";
import { checkUsers_is_part_of_valid_tournament, getTournamentForId } from "./cancel.js";
import { validateAndSanitizeInput } from "../../components/security.js";

export async function WS_check_the_torunament_pending() {
    
    if(!getToken()){
        return null
    }

    const userId = getUserIdFromJWT();
    
    if (!userId)
        return null
    const tournaments = await fetchTournaments();

    const pendingTournament = tournaments.find(t => t.status === 'pending' && t.participants.some(p => p.user.id === userId));
    const progressTournament = tournaments.find(t => t.status === 'in_progress' && t.participants.some(p => p.user.id === userId));

    if (pendingTournament) {
        localStorage.setItem('currentTournamentId', pendingTournament.id);
        localStorage.setItem(`system_Tournament_status_${pendingTournament.id}`, "in");
    }
    else if (progressTournament) {
        localStorage.setItem('currentTournamentId', progressTournament.id);
        localStorage.setItem(`system_Tournament_status_${progressTournament.id}`, "in");
    }else{
        localStorage.setItem(`system_Tournament_status`, "no");
    }
    return true;
}

export async function Check_if_im_the_creator_to_reload() {
    const userId = getUserIdFromJWT();
    const tournaments = await fetchTournaments();

    const pendingTournament = tournaments.find(t => t.status === 'pending' && t.participants.some(p => p.user.id === userId));
    const procesTournament = tournaments.find(t => t.status === 'in_progress' && t.participants.some(p => p.user.id === userId));

    if (pendingTournament) {

        // console.log("--> pendingTournament:", pendingTournament);
        const isCreator = pendingTournament.participants[0].user.id === userId;
        // console.log("---> isCreator:", isCreator);
        if (isCreator) {
            await loadTournamentData(pendingTournament.id);
        } 
    }
}

async function TournamentInit() {

    const jwt = getToken();
    if (!jwt)
    {
      window.location.replace("/#");
      return;
    }
    // console.log("Initializing Tournament Page");

    WS_check_the_torunament_pending();

    const userId = getUserIdFromJWT();
    const tournaments = await fetchTournaments();

    const pendingTournament = tournaments.find(t => t.status === 'pending' && t.participants.some(p => p.user.id === userId));
    const procesTournament = tournaments.find(t => t.status === 'in_progress' && t.participants.some(p => p.user.id === userId));

    if (pendingTournament) {

        // console.log("--> pendingTournament:", pendingTournament);
        const isCreator = pendingTournament.participants[0].user.id === userId;
        // console.log("---> isCreator:", isCreator);
        if (isCreator) {
            // console.log("Found pending tournament as creator:", pendingTournament);
            localStorage.setItem('currentTournamentId', pendingTournament.id);
            await loadTournamentData(pendingTournament.id);
            connectTournamentWebSocket(pendingTournament.id);
            checkGoToWaitingAreaButton(pendingTournament);
            checkCancelCreateButton(pendingTournament);
        } else {
            // console.log("Found pending tournament as participant:", pendingTournament);
            window.location.href = `/#waitroom/${pendingTournament.id}`;
            return;
        }
    }
    if (procesTournament) {
        // console.log("--> procesTournament:", procesTournament);
        window.location.href = `/#waitroom/${procesTournament.id}`;
        return;
    }

    const tournamentForm = document.getElementById('tournamentForm');
    if (tournamentForm) {
        tournamentForm.addEventListener('submit', handleCreateTournament);
        // console.log("Event listener added to tournament form");
    } else {
        // console.error("Tournament form not found");
    }

    const addParticipantButton = document.getElementById('addParticipantButton');
    if (addParticipantButton) {
        addParticipantButton.addEventListener('click', checkAddParticipantButton);
        // console.log("Event listener added to add participant button");
    } else {
        // console.error("Add participant button not found");
    }

    const participantNameInput = document.getElementById('participantNameInput');
    if (participantNameInput) {
        participantNameInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                checkAddParticipantButton(event);
            }
        });
        // console.log("Event listener added for enter key on participant name input");
    } else {
        // console.error("Participant name input not found");
    }

    const cancelCreateButton = document.getElementById('cancelCreateButton');
    if (cancelCreateButton) {
        checkCancelCreateButton(pendingTournament);
        // console.log("Event listener added to cancel create button");
    } else {
        // console.error("Cancel create button not found");
    }
}

// Fetch all tournaments from the server
export async function fetchTournaments() {
    try {
        if (!getToken()){
            return;
        }
        const response = await fetch(`${BACKEND_URL}/api/tournaments/`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            return await response.json();
        } else {
            // console.error('Failed to fetch tournaments');
            return [];
        }
    } catch (error) {
        // console.error('Error fetching tournaments:', error);
        return [];
    }
}

// Load tournament data from the backend
let number_invites = 0;
async function loadTournamentData(tournamentId) {
    try {
        const addParticipantButton = document.getElementById('addParticipantButton');
        addParticipantButton.style.display = 'none';

        const response = await fetch(`${BACKEND_URL}/api/tournaments/${tournamentId}/`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            // console.log("🥶 loadTournamentData:", data);

            localStorage.setItem('currentTournamentId', data.id);

            const tournamentNameInput = document.getElementById('tournamentNameInput');
            const tournamentFormButton = document.getElementById('tournamentForm').querySelector('button');
            const participantsList = document.getElementById('participantsList');
            const addParticipantButton = document.getElementById('addParticipantButton');

            const  input_name = document.getElementById('participantNameInput')

            // Set and disable the tournament name input
            tournamentNameInput.value = data.name;
            tournamentNameInput.disabled = true;

            // Disable the tournament form button
            tournamentFormButton.disabled = true;

            // Clear the current participants list and update with stored participants
            participantsList.innerHTML = '';

            input_name.disabled = true;

           // console.log();
            let i = 0;
            data.participants.forEach(participant => {
                const listItem = document.createElement('li');
                // console.log("-------> participant:", participant);
                if (participant.status) {
                    listItem.textContent = `${participant.user.username} - ${participant.status}`;
                } else{
                    // console.log("-------> participant else:", participant);
                    // console.log("-------> participant participant.accepted_invite:", participant.accepted_invite);
                    if (i === 0)
                        listItem.textContent = `You (Creator)`;
                    else {
                        if (participant.accepted_invite === false)
                            listItem.textContent = `${participant.user.username} - invited`;
                        else
                            listItem.textContent = `${participant.user.username} - accepted`;
                    }
                }
                participantsList.appendChild(listItem);
                i++;
            });

            if (i < 4)
            {
                input_name.disabled = false;
            }

            if (data.participants.length >= 4){
                if ((number_invites + 1) === i ) {
                    showNotification("You can only invite three other users.", "error")
                } else {
                    number_invites = i;
                }

                // console.log("addParticipantButton.style.display:", addParticipantButton.style.display);
                addParticipantButton.style.display = 'none';
                } else{
                // console.log("addParticipantButton.style.display:", addParticipantButton.style.display);
                addParticipantButton.style.display = 'inline';
            }

            // Enable the add participant button
            addParticipantButton.disabled = false;

            checkGoToWaitingAreaButton(data);
            // console.log("🥶 loadTournamentData: Tournament data loaded successfully from backend");
        } else {
            // console.error('Failed to load tournament data from backend');
        }
    } catch (error) {
        // console.error('Error loading tournament data:', error);
    }

}

// Establecer conexión WebSocket
// export function connectTournamentWebSocket(tournamentId) {
export async function connectTournamentWebSocket(tournamentId) {
    if (!activeWebSockets[tournamentId] || activeWebSockets[tournamentId].readyState === WebSocket.CLOSED) {
        let jwt = getToken();
        // const wsUrl = `ws://localhost:8000/ws/tournament/${tournamentId}/?token=${jwt}`;
        const wsUrl = `${WS_URL}/ws/tournament/${tournamentId}/?token=${jwt}`;
        const tournamentSocket = new WebSocket(wsUrl);

        tournamentSocket.onopen = function() {
            // console.log(`WebSocket connection opened for tournament ${tournamentId}`);
            activeWebSockets[tournamentId] = tournamentSocket;
        };

        tournamentSocket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            handleTournamentWebSocketMessage(data, tournamentId);
        };

        tournamentSocket.onclose = function(event) {
            // console.log(`WebSocket connection closed for tournament ${tournamentId}:`, event);
            delete activeWebSockets[tournamentId];
        };

        tournamentSocket.onerror = function(error) {
            // console.error(`WebSocket error for tournament ${tournamentId}:`, error);
        };
        activeWebSockets[tournamentId] = tournamentSocket;
    }
}

async function handleAddParticipant(e) {
    e.preventDefault();

    const participantName = document.getElementById('participantNameInput').value.trim();

    // console.log("🪵 participantName:", participantName);
    if (!participantName) {
        showNotification('Participant name cannot be empty.');
        return;
    }

    const currentUser = localStorage.getItem('username');
    // console.log("🪵 currentUser:", currentUser);
    if (participantName === currentUser) {
        showNotification('You cannot invite yourself to the party. Have some manners!');
        return;
    }

    const tournamentId = localStorage.getItem('currentTournamentId');
    // console.log("🪵 tournamentId:", tournamentId)
    if (!tournamentId) {
        showNotification('No tournament ID found. Please create a tournament first.');
        return;
    }

    const participants = await fetchParticipantsRSVPs(tournamentId);

    // Cap the number of participants to 4 (including the creator)
    if (participants.length >= 4) {
        showNotification('You can only invite up to three participants.');
        return;
    }

    const isOnline = await checkUserOnlineStatus(participantName);



    // console.log("🪵 isOnline:", isOnline)
    if (isOnline === null) {
        showNotification("User not found. Please double-check their username.");
    } else if (isOnline) {
        const participantId = await getUserIdByUsername(participantName, tournamentId);
        // console.log("🪵 participantId:", participantId)

        if (participantId) {

            let tournamentId = localStorage.getItem('currentTournamentId');

            let response_checkuser_repeat = await checkUsers_is_part_of_valid_tournament(participantId);

            if (response_checkuser_repeat === null)
                return;
            else if (response_checkuser_repeat === false)
            {
                showNotification("This user is currently engaged in a tournament.")
                return;
            }

            await addParticipantToTournament(tournamentId, participantId);

            sendTournamentInvitation(tournamentId, participantName, participantId);

            // console.log("🪵🪵🪵 participantName:", participantName);
            await loadTournamentData(tournamentId);
        } else {
            showNotification("Failed to get participant ID.");
        }
    } else {
        showNotification("Participant is not online.");
        // console.log("Participant is not online.");
    }
    document.getElementById('participantNameInput').value = ''; // Clear input after adding
    // saveTournamentData();

    // console.log("🪵 🪵 finish 🪵 🪵 :")
}


function checkAddParticipantButton(e) {
    if (e.type === 'keydown' && e.key !== 'Enter') {
        return; // handles only enter key for keydown events
    }

    const participantNameInput = document.getElementById('participantNameInput');
    if (!validateAndSanitizeInput(participantNameInput.value)){
        return;
    }

    const addParticipantButton = document.getElementById('addParticipantButton');
    if (addParticipantButton.disabled) {
        // console.log("--> addParticipantButton.disabled");
        e.preventDefault();
        showNotification('Please create the tournament first before adding participants.');
        return;
    }
    // console.log("-> handleAddParticipant");
    handleAddParticipant(e);
    // addParticipantToTournament(tournamentId, userId);
}

async function addParticipantToTournament(tournamentId, userId) {
    const url = `${BACKEND_URL}/api/tournaments/${tournamentId}/addparticipant/`;
    const body = JSON.stringify({ user_id: userId });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: body
        });

        if (!response.ok) {
            const errorText = await response.text();
            // console.error('Error adding participant:', errorText);
            showNotification('Error adding participant: ' + errorText);
            return false;
        }

        const data = await response.json();
        // console.log('Participant added successfully:', data);
        //showNotification('Participant added successfully 🇲🇽', 'success');
        return true;

    } catch (error) {
        // console.error('Network error:', error);
        showNotification('Network error: ' + error.message);
        return false;
    }
}


// async function checkAllParticipantsAccepted(tournamentId) {
//     try {
//         if (!tournamentId) {
//             console.error('Tournament ID is null or undefined');
//             return;
//         }
//         const response = await fetch(`${BACKEND_URL}/api/participants/status/?tournament_id=${tournamentId}`, {
//             headers: {
//                 'Authorization': `Bearer ${getToken()}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         if (response.ok) {
//             const participants = await response.json();
//             const allAccepted = participants.every(participant => participant.accepted_invite);
//             //updategoToWaitingAreaButtonState(participants);
//             return allAccepted;
//         } else {
//             console.error('Failed to fetch participants status');
//             return false;
//         }
//     } catch (error) {
//         console.error('Error checking participants acceptance:', error);
//         return false;
//     }
// }

export async function updateParticipantsList(participantNameOrObject, status, isCreator = false) {

    // console.log("🚨 🚨participantNameOrObject:", participantNameOrObject);
    const participantName = typeof participantNameOrObject === 'object' ? participantNameOrObject.username || participantNameOrObject.name : participantNameOrObject;
    const currentUser = localStorage.getItem('username');

    if (participantName === currentUser && !isCreator) {
        showNotification('You cannot invite yourself to the party. Have some manners!');
        return;
    }

    const participantsList = document.getElementById('participantsList');
    if (participantsList) {
        // Check if the participant is already in the list to avoid duplication
        const existingParticipant = Array.from(participantsList.children).find(item => item.textContent.includes(participantName));
        if (existingParticipant) {
            existingParticipant.textContent = participantName + ' - ' + status;
            if (!isCreator) showNotification('This user has been invited already. Don\'t be pushy.');
        } else {
            const listItem = document.createElement('li');
            listItem.textContent = isCreator ? participantName : participantName + ' - ' + "invited";
            participantsList.appendChild(listItem);
            if (!isCreator) showNotification('Invitation successfully sent to ' + participantName + '.', 'success');
        }

        const participants = await fetchParticipantsRSVPs(tournamentId);
        if (participants.length > 4) {
            //showNotification('You can only invite up to 3 participants.');
            return;
        }

        // Check the number of invited participants and enable the button if there are at least three (excluding the creator)
        const invitedParticipants = participantsList.children.length - 1; // Exclude the creator
        const goToWaitingAreaButton = document.getElementById('goToWaitingAreaButton');
        if (goToWaitingAreaButton) {
            // console.log("Navigating to tournament waiting area.");
            const isEnabled = invitedParticipants >= 3;
            goToWaitingAreaButton.disabled = !isEnabled;

            // Save the button state to local storage
            localStorage.setItem('goToWaitingAreaButtonEnabled', isEnabled);

            // Remove any existing event listeners to avoid duplicates
            const newButton = goToWaitingAreaButton.cloneNode(true);
            goToWaitingAreaButton.parentNode.replaceChild(newButton, goToWaitingAreaButton);

            if (isEnabled && newButton) {
                newButton.addEventListener('click', () => {
                    const tournamentId = localStorage.getItem('currentTournamentId');
                    // console.log("Navigating to tournament waiting area with ID:", tournamentId);
                    // saveTournamentData();
                    window.location.href = `/#waitroom/${tournamentId}`;
                });
                // console.log("Event listener added to go to waiting area button");
            }
        } else {
            // console.error("Go to waiting area button not found");
        }
    }
}


async function checkUserOnlineStatus(username) {
    // console.log(`Checking online status for user: ${username}`);
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // console.error(`Error fetching users: ${response.status} ${response.statusText}`);
            showNotification("An error occurred while fetching users.");
            return null;
        }

        const users = await response.json();
        // Check if the username exists in the users list
        const user = users.find(user => user.username === username);

        if (!user) {
           // showNotification("User not found. Please double-check their username.");
            return null; // User does not exist
        }

        // Check if the user ID is in the list of active users from localStorage
        const activeUsers = JSON.parse(localStorage.getItem('id_active_users')) || [];
        const isActive = activeUsers.includes(String(user.id));

        // console.log(`User ${username} is ${isActive ? 'online' : 'offline'}`);
        return isActive;

    } catch (error) {
        // console.error('Error checking user online status:', error);
        showNotification("An error occurred while checking the user's online status.");
        return null;
    }
}

async function userExists(username) {
    // console.log(`Checking if user exists: ${username}`);
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/${username}/exists/`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        // console.log(`Response status: ${response.status}`);

        if (response.status === 404) {
            // console.log(`User ${username} not found.`);
            return false;
        }

        if (!response.ok) {
            // console.error(`Error checking user existence: ${response.status} ${response.statusText}`);
            return false;
        }

        const data = await response.json();
        // if (data.exists) {
        //     // console.log(`User ${username} exists.`);
        // } else {
        //     // console.log(`User ${username} does not exist.`);
        // }
        return data.exists;

    } catch (error) {
        // console.error('Error checking if user exists:', error);
        return false;
    }
}

/*function displayNotification(message) {
    const modal = document.getElementById('notificationModal');
    const modalMessage = document.getElementById('modalMessage');
    const closeButton = document.getElementById('closeModalButton');

    if (!modal || !modalMessage || !closeButton) {
        console.error('Notification modal elements not found');
        return;
    }

    modalMessage.textContent = message;
    modal.style.display = 'block';

    closeButton.onclick = function() {
        modal.style.display = 'none';
    };
}*/

//function displayErrorMessage(message) {
//    displayNotification(message);
//}

// async function getParticipantId(username, tournamentId) {
//     try {
//         const response = await fetch(`${BACKEND_URL}/api/participants/`, {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${getToken()}`,
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ username: username, tournament: tournamentId })
//         });

//         if (response.ok) {
//             const data = await response.json();
//             return data.id;
//         } else {
//             console.error('Failed to get participant ID');
//             return null;
//         }
//     } catch (error) {
//         console.error('Error getting participant ID:', error);
//         return null;
//     }
// }

async function handleCreateTournament(e) {
    e.preventDefault();

    const tournamentNameInput_check = document.getElementById('tournamentNameInput');
    if (!validateAndSanitizeInput(tournamentNameInput_check.value)){
        return;
    }

    // console.log("🍀 Create Tournament form submitted");
    const tournamentName = document.getElementById('tournamentNameInput').value.trim();
    if (!tournamentName) {
        showNotification('Tournament name cannot be empty.');
        return;
    }
    try {
        const response = await createTournament(tournamentName);
        // console.log('Response status:', response.status);
        if (response.ok) {
            const data = await response.json();
            showNotification("Tournament created successfully", "success");
            document.getElementById('tournamentNameInput').value = tournamentName;
            document.getElementById('tournamentNameInput').disabled = true;
            document.getElementById('tournamentForm').querySelector('button').disabled = true;
            localStorage.setItem('currentTournamentId', data.id);
            localStorage.setItem(`tournamentName_${data.id}`, tournamentName); 
            localStorage.setItem('creatorUsername_' + data.id, localStorage.getItem('username')); // Store creator's username
            // updateParticipantsList('You (Creator)', 'invited', true); // Automatically adds the creator as a participant
            
            connectTournamentWebSocket(data.id);

            const addParticipantButton = document.getElementById('addParticipantButton');
            addParticipantButton.disabled = false;
        } else {
            const errorMessage = await response.text();
            // console.error('Error from server:', errorMessage);
            throw new Error('Failed to create tournament. Server responded with an error.');
        }
    } catch (error) {
        // console.error('Caught error:', error);
        showNotification(error.message);
    }
}

async function createTournament(tournamentName) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/tournaments/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ name: tournamentName })
        });

        if (!response.ok) {
            const errorText = await response.text();
            // console.error('Response text:', errorText);
            throw new Error('Network response was not ok');
        }
        return response;

    } catch (error) {
        // console.error('Network error:', error);
        throw error;
    }
}


export function acceptTournamentInvitation(tournamentId, username) {
    if (!activeWebSockets[tournamentId] || activeWebSockets[tournamentId].readyState !== WebSocket.OPEN) {
    //   console.error('WebSocket is not connected or already closed for tournament:', tournamentId);
      connectTournamentWebSocket(tournamentId);
      activeWebSockets[tournamentId].onopen = () => {
        sendAcceptMessage(tournamentId, username);
      };
    } else {
      sendAcceptMessage(tournamentId, username);
    }
  }
  
  function sendAcceptMessage(tournamentId, username) {
    const message = {
      type: 'tournament',
      event: 'accepted_tournament',
      message: `User ${username} accepted the tournament invitation for tournament ${tournamentId}`,
      user_id: localStorage.getItem('userId'),
      user_name: localStorage.getItem('username'),
      dest_user_id: username,
      tournament_id: tournamentId
    };
  
    activeWebSockets[tournamentId].send(JSON.stringify(message));
    
    // Save data only if elements are available
    const tournamentNameInput = document.getElementById('tournamentNameInput');
    const participantsList = document.getElementById('participantsList');
    if (tournamentNameInput && participantsList) {
        // saveTournamentData();
    } else {
        // console.log("Skipping saveTournamentData as elements are not available.");
    }

    window.location.href = `/#waitroom/${tournamentId}`;
  }
  
  export function rejectTournamentInvitation(tournamentId, username) {
    if (!activeWebSockets[tournamentId] || activeWebSockets[tournamentId].readyState !== WebSocket.OPEN) {
    //   console.error('WebSocket is not connected or already closed for tournament:', tournamentId);
      connectTournamentWebSocket(tournamentId);
      activeWebSockets[tournamentId].onopen = () => {
        sendRejectMessage(tournamentId, username);
      };
    } else {
      sendRejectMessage(tournamentId, username);
    }
  }
  
  function sendRejectMessage(tournamentId, username) {
    const message = {
      type: 'tournament',
      event: 'rejected_tournament',
      message: `User ${username} rejected the tournament invitation for tournament ${tournamentId}`,
      user_id: localStorage.getItem('userId'),
      user_name: localStorage.getItem('username'),
      dest_user_id: username,
      tournament_id: tournamentId
    };
  
    // console.log("Tournament invitation rejected.");
  
    activeWebSockets[tournamentId].send(JSON.stringify(message));
  
    // Hide the modal
    // const modalElement = document.getElementById('tournamentInviteModal');
    // modalElement.style.display = 'none';
  }
  

// Nueva función para verificar y habilitar el botón
function checkGoToWaitingAreaButton(tournament) {
    const goToWaitingAreaButton = document.getElementById('goToWaitingAreaButton');
    const acceptedParticipants = tournament.participants.filter(p => p.accepted_invite).length;

    // console.log("🤯🤯🤯 acceptedParticipants:", acceptedParticipants);
    // console.log("🤯🤯🤯 tournament:", tournament);

    if (acceptedParticipants >= 4) {
        goToWaitingAreaButton.disabled = false;
        goToWaitingAreaButton.addEventListener('click', () => {
            // console.log("Diego -------------------------  nos movemos:", tournament.id);
            window.location.href = `/#waitroom/${tournament.id}`;
        });
    } else {
        goToWaitingAreaButton.disabled = true;
    }
}


async function checkCancelCreateButton(tournament) {
    const cancelCreateButton = document.getElementById('cancelCreateButton');

    if (cancelCreateButton) {
        // Remove any existing event listeners to avoid duplicates
        const newButton = cancelCreateButton.cloneNode(true);
        cancelCreateButton.parentNode.replaceChild(newButton, cancelCreateButton);

        newButton.addEventListener('click', async () => {

            let tournament_id = localStorage.getItem("currentTournamentId");

            // console.log(">> tournament_id:", tournament_id);
            
            // Diego, I am removing this since we want the user to be redirected to the homepage in case they cancel tournament creation
            //if (!tournament_id){
            //    return
            //}

            tournament = await getTournamentForId(tournament_id)

            // console.log('Aborting tournament creation.:', tournament);


            if (tournament && tournament.id) {
                try {
                    // Call the destroy endpoint to delete the tournament
                    const response = await fetch(`${BACKEND_URL}/api/tournaments/${tournament.id}/cancel/`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${getToken()}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        // console.log(`Tournament ${tournament.id} canceled successfully`);

                        // Send tournament_canceled event to WebSocket
                        const message = {
                            type: 'tournament',
                            event: 'tournament_canceled',
                            message: `The tournament ${tournament.id} has been canceled.`,
                            tournament_id: tournament.id
                        };

                        if (activeWebSockets[tournament.id] && activeWebSockets[tournament.id].readyState === WebSocket.OPEN) {
                            activeWebSockets[tournament.id].send(JSON.stringify(message));
                            activeWebSockets[tournament.id].close(); // Close the WebSocket connection
                            delete activeWebSockets[tournament.id]; // Remove it from the active websockets list
                        }

                        // Remove the local storage items
                        localStorage.removeItem('pageTournament');
                        localStorage.removeItem('currentTournamentId');
                        localStorage.removeItem(`tournamentName_${tournament.id}`);
                        localStorage.removeItem(`creatorUsername_${tournament.id}`);
                    } else {
                        // console.error(`Failed to cancel tournament ${tournament.id}`);
                    }
                } catch (error) {
                    // console.error(`Error canceling tournament ${tournament.id}:`, error);
                }
            } else {
                // Remove the local storage items
                localStorage.removeItem('pageTournament');
                localStorage.removeItem('currentTournamentId');
            }

            window.location.href = `/#`;
        });
    } else {
        // console.error("Cancel create button not found");
    }
}




  export {
    createTournament,
    handleCreateTournament,
    handleAddParticipant,
    //displayNotification,
    showNotification,
    checkUserOnlineStatus,
    TournamentInit,
    loadTournamentData,
    };
