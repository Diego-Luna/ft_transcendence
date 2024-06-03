import { showNotificationPopup } from "./showNotification.js";
import { Chat_Update_js, getUserIdFromJWT } from "../pages/Chat/funcions-js.js";
import { Friends_js } from "../pages/Friends/funcions-js.js";
import { Users_js } from "../pages/Users/funcions-js.js";

const BACKEND_URL = "http://localhost:8000";
let WSsocket = null;  // Global variable for the main WebSocket instance
let myUser = null;
export let activeWebSockets = {}; // Track multiple WebSocket connections

// Filter messages based on the dest_user_id
function filterMessagesForUser(message, userId) {
    return message.dest_user_id === userId.toString();
}

function handleWebSocketMessage(message, userId) {
    if (filterMessagesForUser(message, userId)) {
        execute_processes_by_category(message, myUser);
    }

    switch (message.event) {
        case 'update_user_list':
            localStorage.setItem('id_active_users', JSON.stringify(message.user_ids));
            Chat_Update_js();
            Friends_js();
            Users_js();
            break;
        case 'update_waiting_list':
            localStorage.setItem('update_waiting_list', JSON.stringify(message.user_ids));
            let id = getUserIdFromJWT(localStorage.getItem('jwt'));
            handleUpdateWaitingList(message, String(id), myUser);
            break;
        case 'accepted_invite':
            handleAcceptedInvite(message);
            break;
        case 'rejected_invite':
            handleRejectedInvite(message);
            break;
        default:
            console.log('Unknown event type:', message.event);
    }
}

function handleAcceptedInvite(message) {
    console.log(`Invitation accepted by ${message.user_name}`);
    updateParticipantsList(message.user_name, 'accepted');
    const tournamentId = sessionStorage.getItem('currentTournamentId');
    checkAllParticipantsAccepted(tournamentId).then(allAccepted => {
        if (allAccepted) {
            document.getElementById('startTournamentButton').disabled = false;
        }
    });
}

function handleRejectedInvite(message) {
    console.log(`Invitation rejected by ${message.user_name}`);
    updateParticipantsList(message.user_name, 'rejected');
    showNotification(`Invitation rejected by ${message.user_name}. Invite someone else or delete the tournament.`, 'error');
}

function checkStartTournament() {
    const startTournamentButton = document.getElementById('startTournamentButton');
    if (acceptedParticipants.length === 3) { // rachel - check if this needs to be 4 to include creator
        startTournamentButton.disabled = false;
    } else {
        startTournamentButton.disabled = true;
    }
}

function execute_processes_by_category(message, myUser) {
    switch (message.event) {
        case "channel_created":
            showNotificationPopup(message.user_name, message.message);
            Chat_Update_js();
            break;
        case "game_invite":
            if (message.message !== 'system') {
                showNotificationPopup(message.user_name, message.message);
            } else {
                sendGameAccept_Waiting(message.dest_user_id, message.user_id, myUser);
            }
            break;
        case "accepted_game":
            Chat_Update_js();
            window.location.href = `/#game/${message.message}`;
            break;
        default:
            run_processes_per_message(message);
            break;
    }
}

function run_processes_per_message(message) {
    switch (message.message) {
        case "Send friend request":
            Friends_js();
            Users_js();
            Chat_Update_js();
            break;
        case "Send accept friend":
            Friends_js();
            Users_js();
            Chat_Update_js();
            break;
        case "Send delete friend":
            Friends_js();
            Users_js();
            Chat_Update_js();
            break;
        default:
            break;
    }
}

// Function to connect to the WebSocket and listen for messages
export async function connectWebSocketGlobal() {
    if (WSsocket && WSsocket.readyState === WebSocket.OPEN) {
        console.log('WebSocket is already connected');
        return;
    }

    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
        console.error('No JWT token found in localStorage');
        return;
    }

    if (!myUser) {
        const responseMyUser = await fetch(`${BACKEND_URL}/api/me/`, {
            headers: { Authorization: `Bearer ${jwt}` },
        });
        myUser = await responseMyUser.json();
    }

    const payload = jwt.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    const id = decodedPayload.user_id;

    console.log(`--> 👋 User id:${id}`);

    const wsUrl = `ws://localhost:8000/ws/notifications/${id}/`;
    WSsocket = new WebSocket(wsUrl);

    WSsocket.onopen = function () {
        console.log('WebSocket connection opened');
    };

    WSsocket.onmessage = function (event) {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message, id);
    };

    WSsocket.onerror = function (error) {
        console.error('WebSocket error:', error);
    };

    WSsocket.onclose = function (event) {
        console.log('WebSocket connection closed:', event);
        WSsocket = null;
    };
}

async function sendGameAccept_Waiting(userId, dest_user_id, myUser) {
    let find_me = false;
    const jwt = localStorage.getItem('jwt');
    const update_waiting_list = localStorage.getItem('update_waiting_list');
    if (!jwt || !update_waiting_list) {
        return;
    }

    const waitingIds = JSON.parse(update_waiting_list);
    if (waitingIds.length >= 2) {
        for (let i = 0; i + 1 < waitingIds.length; i += 2) {
            if (Number(waitingIds[i]) === Number(userId) && Number(waitingIds[i + 1]) === Number(dest_user_id)) {
                find_me = true;
                break;
            }
        }
    }

    if (find_me) {
        return;
    }

    const payload = jwt.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    let my_id = decodedPayload.user_id;

    const responseGames = await fetch(`${BACKEND_URL}/api/games/`, {
        headers: { Authorization: `Bearer ${jwt}` },
    });
    const games = await responseGames.json();

    const game = games.find(
        (game) =>
            game.invitee.id === Number(userId) &&
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
            console.error("error in system");
        }
        sendAcceptedGameNotifications(userId, myUser.userName, dest_user_id, game.id);
        sendDelleteMatchedMessage(userId, dest_user_id);
        window.location.href = `/#game/${game.id}`;
    }
}

async function sendGameInitate_Waiting(userId, inviteId) {
    const jwt = localStorage.getItem('jwt');

    const response = await fetch(`${BACKEND_URL}/api/games/`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            invitationStatus: "PENDING",
            inviter: userId,
            invitee: inviteId,
        }),
    });

    return response;
}

// Función para manejar el evento "update_waiting_list"
async function handleUpdateWaitingList(message, userId, myUser) {
    const waitingIds = message.waiting_ids;
    if (waitingIds.length >= 2) {
        for (let i = 1; i < waitingIds.length; i += 2) {
            if (waitingIds[i] === userId) {
                let status = await sendGameInitate_Waiting(userId, waitingIds[i - 1]);
                if (status.ok) {
                    sendGameInvataeNotifications(userId, myUser.userName, waitingIds[i - 1], "system");
                }
                break;
            }
        }
    }
}

// Función para enviar un mensaje específico al WebSocket
export function sendChannelCreatedNotifications(userId, userName, destUserId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: "channel_created",
        message: "has created a new channel.",
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };

    WSsocket.send(JSON.stringify(message));
}

// Función para enviar un mensaje específico al WebSocket
export function sendGameInvataeNotifications(userId, userName, destUserId, text) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: "game_invite",
        message: text,
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };

    WSsocket.send(JSON.stringify(message));
}

// rachel - function to send tournament invitation
export function sendTournamentInvitation(tournamentId, username) {
    if (!activeWebSockets[tournamentId] || activeWebSockets[tournamentId].readyState === WebSocket.CLOSED) {
        const wsUrl = `ws://localhost:8000/ws/tournament/${tournamentId}/`;
        const tournamentSocket = new WebSocket(wsUrl);

        tournamentSocket.onopen = function() {
            console.log(`WebSocket connection opened for tournament ${tournamentId}`);
            activeWebSockets[tournamentId] = tournamentSocket;
            sendMessage();
        };

        tournamentSocket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            handleTournamentWebSocketMessage(data, tournamentId);
        };

        tournamentSocket.onclose = function(event) {
            console.log(`WebSocket connection closed for tournament ${tournamentId}:`, event);
            delete activeWebSockets[tournamentId];
        };

        tournamentSocket.onerror = function(error) {
            console.error(`WebSocket error for tournament ${tournamentId}:`, error);
        };
    } else {
        sendMessage();
    }

    function sendMessage() {
        const message = {
            type: 'tournament',
            event: 'game_invite',
            message: `You are invited to join the tournament ${tournamentId}. Do you think you have what it takes to win the prestigious Chèvre Verte Award?`,
            user_id: localStorage.getItem('userId'),
            user_name: localStorage.getItem('username'),
            dest_user_id: username,
            tournament_id: tournamentId
        };
        activeWebSockets[tournamentId].send(JSON.stringify(message));
    }
}

function handleTournamentWebSocketMessage(data, tournamentId) {
    switch (data.event) {
        case 'game_invite':
            if (data.type === 'tournament') {
                handleTournamentInvite(data);
            } else {
                handleGameInvite(data);
            }
            break;
        case 'accepted_game':
            handleAcceptedGame(data);
            break;
        case 'user_connected':
            updateParticipantsList(data.user_id, 'connected');
            break;
        case 'user_disconnected':
            updateParticipantsList(data.user_id, 'disconnected');
            break;
        case 'update_user_list':
            updateParticipantsList(data.user_ids, 'updated');
            break;
        default:
            console.log('Unknown event type:', data.event);
    }
}

// Función para enviar un mensaje específico al WebSocket
export function sendAcceptedGameNotifications(userId, userName, destUserId, game_id) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: "accepted_game",
        message: String(game_id),
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };

    WSsocket.send(JSON.stringify(message));
}

// Función para enviar un mensaje específico al WebSocket
export function sendFriendRequestNotifications(userId, userName, destUserId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: "notify",
        message: "Send friend request",
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };

    WSsocket.send(JSON.stringify(message));
}

// Función para enviar un mensaje específico al WebSocket
export function sendFriendAcceptdNotifications(userId, userName, destUserId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: "notify",
        message: "Send accept friend",
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };

    WSsocket.send(JSON.stringify(message));
}

export function sendFriendDeletedNotifications(userId, userName, destUserId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: "notify",
        message: "Send accept friend",
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };

    WSsocket.send(JSON.stringify(message));
}

// Function to join the matchmaking queue
export function joinMatchmakingQueue(userId, userName) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: "join_queue",
        user_id: String(userId),
        user_name: userName,
    };

    WSsocket.send(JSON.stringify(message));
}

// Función para enviar el mensaje de espera de coincidencia
export function sendWaitMatchedMessage(userId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: "wait_matched",
        message: "You are now waiting for a match.",
        user_id: String(userId)
    };

    WSsocket.send(JSON.stringify(message));
}

export function sendDelleteMatchedMessage(userId, otherId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        "type": "delete_matched",
        "matched_user_ids": [String(userId), String(otherId)]
    }

    WSsocket.send(JSON.stringify(message));
}


/*
import { showNotificationPopup } from "./showNotification.js";
import { Chat_Update_js, getUserIdFromJWT } from "../pages/Chat/funcions-js.js"
import { Friends_js } from "../pages/Friends/funcions-js.js";
import { Users_js } from "../pages/Users/funcions-js.js";

const BACKEND_URL = "http://localhost:8000";
let WSsocket = null;  // Variable global para almacenar la instancia del WebSocket
let myUser = null;

// Función para filtrar mensajes según el dest_user_id
function filterMessagesForUser(message, userId) {
    return message.dest_user_id === userId.toString();
}

function executeProcessesByCategory(message, myUser) {
    switch (message.event) {
        case "channel_created":
            showNotificationPopup(message.user_name, message.message);
            Chat_Update_js();
            break;
        case "game_invite":
            if (message.message !== 'system')
                showNotificationPopup(message.user_name, message.message);
            else
            {
                sendGameAcceptWaiting(message.dest_user_id, message.user_id, myUser);
            }
            // Chat_Update_js();
            break;
        case "accepted_game":
            // showNotificationPopup(message.user_name, "Accept the Game. let's go");
            Chat_Update_js();
            window.location.href = `/#game/${message.message}`;
            break;

        default:
            runProcessesPerMessage(message);
            break;
    }
}


function runProcessesPerMessage(message) {
    switch (message.message) {
        case "Send friend request":
            Friends_js();
            Users_js();
            Chat_Update_js();
            break;
        case "Send accept friend":
            Friends_js();
            Users_js();
            Chat_Update_js();
            break;
        case "Send delete friend":
            Friends_js();
            Users_js();
            Chat_Update_js();
            break;

        default:
            break;
    }
}

// Función para conectar al WebSocket y escuchar mensajes
export async function connectWebSocketGlobal() {


    if (WSsocket && WSsocket.readyState === WebSocket.OPEN) {
        console.log('WebSocket is already connected');
        return;
    }

    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
        console.error('No JWT token found in localStorage');
        return;
    }

    if (!myUser)
    {
        const responseMyUser = await fetch(`${BACKEND_URL}/api/me/`, {
            headers: { Authorization: `Bearer ${jwt}` },
        });
        myUser = await responseMyUser.json();
    }

    const payload = jwt.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    const id = decodedPayload.user_id;

    console.log(`--> 👋 User id:${id}`);

    // Conectarse al WebSocket
    const wsUrl = `ws://localhost:8000/ws/notifications/${id}/`;
    WSsocket = new WebSocket(wsUrl);

    // Manejar la conexión abierta
    WSsocket.onopen = function () {
        console.log('WebSocket connection opened');
    };

    // Manejar mensajes recibidos
    WSsocket.onmessage = function (event) {
        const message = JSON.parse(event.data);

        // message
        if (filterMessagesForUser(message, id)){
            executeProcessesByCategory(message, myUser)
        }

        if (message.event === "update_user_list"){
            localStorage.setItem('id_active_users', JSON.stringify(message.user_ids));
            Chat_Update_js();
            Friends_js();
            Users_js();
        }

        if(message.event === "update_waiting_list"){
            localStorage.setItem('update_waiting_list', JSON.stringify(message.user_ids));
            // getUserIdFromJWT
            let id = getUserIdFromJWT(jwt);
            handleUpdateWaitingList(message, String(id), myUser);
        }
    };

    // Manejar errores
    WSsocket.onerror = function (error) {
        console.error('WebSocket error:', error);
    };

    // Manejar el cierre de la conexión
    WSsocket.onclose = function (event) {
        console.log('WebSocket connection closed:', event);
        WSsocket = null;  // Reset the socket instance to allow reconnection if needed
    };
}



async function sendGameAcceptWaiting(userId, dest_user_id, myUser) {


    let find_me = false;
    const jwt = localStorage.getItem('jwt');
    const update_waiting_list = localStorage.getItem('update_waiting_list');
    if (!jwt || !update_waiting_list) {
        return;
    }

    const waitingIds = update_waiting_list;
    if (waitingIds.length >= 2) {
        for (let i = 0; i + 1 < waitingIds.length; i += 2) {
            if (Number(waitingIds[i]) === Number(userId) && Number(waitingIds[i + 1]) === Number(dest_user_id) ) {
                find_me = true;
                break;
            }
        }
    }

    if (find_me === true)
    {
        return;
    }

    const payload = jwt.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    let my_id = decodedPayload.user_id; // Update user_id variable with the user ID extracted from the JWT

    const responseGames = await fetch(`${BACKEND_URL}/api/games/`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const games = await responseGames.json();

    const game = games.find(
      (game) =>
        game.invitee.id === Number(userId) &&
        game.inviter.id === Number(dest_user_id) &&
        game.invitationStatus === "PENDING"
    );

    if(game){
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
        if (!response.ok)
        {
            console.error("error in system");
        }
        sendAcceptedGameNotifications(userId, myUser.userName, dest_user_id, game.id);
        sendDelleteMatchedMessage(userId, dest_user_id);
        window.location.href = `/#game/${game.id}`;
    }

}

async function sendGameInitateWaiting(userId, inviteId) {

    const jwt = localStorage.getItem('jwt');

    const response = await fetch(`${BACKEND_URL}/api/games/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invitationStatus: "PENDING",
        inviter: userId,
        invitee: inviteId,
      }),
    });

    return response;
}

// Función para manejar el evento "update_waiting_list"
async function handleUpdateWaitingList(message, userId, myUser) {
    const waitingIds = message.waiting_ids;
    if (waitingIds.length >= 2) {
        for (let i = 1; i < waitingIds.length; i += 2) {
            if (waitingIds[i] === userId) {
                let status = await sendGameInitateWaiting(userId, waitingIds[i - 1]);
                if (status.ok){
                    sendGameInvataeNotifications(userId, myUser.userName, waitingIds[i - 1], "system");
                }
                break;
            }
        }
    }
}


// Función para enviar un mensaje específico al WebSocket
export function sendChannelCreatedNotifications(userId, userName, destUserId) {

    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }
    
    const message = {
        type: "channel_created",
        message: "has created a new channel.",
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };

    WSsocket.send(JSON.stringify(message));
}

// Función para enviar un mensaje específico al WebSocket
export function sendGameInvataeNotifications(userId, userName, destUserId, text) {

    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }
    
    const message = {
        type: "game_invite",
        message: text,
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };
    ;
    WSsocket.send(JSON.stringify(message));
}

// rachel - function to send tournament invitation
export function sendTournamentInvitation(tournamentId, username) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: 'tournament',
        event: 'game_invite',
        message: `You are invited to join the tournament ${tournamentId}. Do you think you have what it takes to win the prestigious Chèvre Verte Award?`,
        user_id: localStorage.getItem('userId'),
        user_name: localStorage.getItem('username'),
        dest_user_id: username,
        tournament_id: tournamentId
    };

    WSsocket.send(JSON.stringify(message));
}

// Función para enviar un mensaje específico al WebSocket
export function sendAcceptedGameNotifications(userId, userName, destUserId, game_id) {

    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }
    
    const message = {
        type: "accepted_game",
        message: String(game_id),
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };
    ;
    WSsocket.send(JSON.stringify(message));
}

// Función para enviar un mensaje específico al WebSocket
export function sendFriendRequestNotifications(userId, userName, destUserId) {

    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: "notify",
        message: "Send friend request",
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };
    ;
    WSsocket.send(JSON.stringify(message));
}

// Función para enviar un mensaje específico al WebSocket
export function sendFriendAcceptdNotifications(userId, userName, destUserId) {

    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: "notify",
        message: "Send accept friend",
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };
    ;
    WSsocket.send(JSON.stringify(message));
}

export function sendFriendDeletedNotifications(userId, userName, destUserId) {

    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: "notify",
        message: "Send accept friend",
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };
    ;
    WSsocket.send(JSON.stringify(message));
}


// Function to join the matchmaking queue
export function joinMatchmakingQueue(userId, userName) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: "join_queue",
        user_id: String(userId),
        user_name: userName,
    };

    WSsocket.send(JSON.stringify(message));
}


// Función para enviar el mensaje de espera de coincidencia
export function sendWaitMatchedMessage(userId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: "wait_matched",
        message: "You are now waiting for a match.",
        user_id: String(userId)
    };

    WSsocket.send(JSON.stringify(message));
}

export function sendDelleteMatchedMessage(userId, otherId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    const message = {
        "type": "delete_matched",
        "matched_user_ids": [String(userId), String(otherId)]
    }

    WSsocket.send(JSON.stringify(message));
}
*/