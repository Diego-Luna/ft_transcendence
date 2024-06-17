import { getUserIdFromJWT } from "../pages/Chat/funcions-js.js";
import { getToken } from "../utils/get-token.js";
import { WSsocket, BACKEND_URL, WS_URL, connectWebSocketGlobal } from "./wcGlobal.js";

// Función para enviar un mensaje específico al WebSocket
export function sendAcceptedGameNotifications(userId, userName, destUserId, game_id) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.log('WebSocket is not connected');
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

export function sendTournamentNotifications(userId, userName, destUserId, tournament_id, tournament_name) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.error('WebSocket is not connected');
        return;
    }

    const message = {
        type: 'tournament_invite',
        message: 'You have been invited to join the tournament!',
        user_id: userId,
        user_name: userName,
        dest_user_id: destUserId,
        tournament_id: tournament_id,
        tournament_name: tournament_name
    };

    WSsocket.send(JSON.stringify(message));
}

// Función para enviar un mensaje específico al WebSocket
export function sendFriendRequestNotifications(userId, userName, destUserId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.log('WebSocket is not connected');
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

export function sendUpdateList_of_tournament_Notifications(userId, userName, destUserId, text) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.log('WebSocket is not connected');
        return;
    }

    const message = {
        type: "notify",
        message: text,
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };

    WSsocket.send(JSON.stringify(message));
}

// Función para enviar un mensaje específico al WebSocket
export function sendFriendAcceptdNotifications(userId, userName, destUserId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.log('WebSocket is not connected');
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
        //console.log('WebSocket is not connected');
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
        //console.log('WebSocket is not connected');
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
        //console.log('WebSocket is not connected');
        return;
    }

    const message = {
        type: "wait_matched",
        message: "You are now waiting for a match.",
        user_id: String(userId)
    };

    WSsocket.send(JSON.stringify(message));
    localStorage.setItem("Im_in_the_Matching", true);
}

export function sendDeleteMatchedMessage(userId, otherId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.log('WebSocket is not connected');
        return;
    }

    const message = {
        "type": "delete_matched",
        "matched_user_ids": [String(userId), String(otherId)]
    }

    WSsocket.send(JSON.stringify(message));
    localStorage.removeItem("Im_in_the_Matching");
}

export function sendDeleteMeForMatchedMessage() {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.log('WebSocket is not connected');
        return;
    }

    const message = {
        "type": "delete_matched",
        "matched_user_ids": [getUserIdFromJWT()]
    }

    WSsocket.send(JSON.stringify(message));
    localStorage.removeItem('update_waiting_list');
}



export async function sendGameInitiate_Waiting(userId, inviteId) {
    const jwt = localStorage.getItem('jwt');

    const response = await fetch(`${BACKEND_URL}/api/games/`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            playMode: 2,
            invitationStatus: "PENDING",
            inviter: userId,
            invitee: inviteId,
        }),
    });

    return response;
}


async function hasPendingOrAcceptedGames(userId) {
    const response = await fetch(`${BACKEND_URL}/api/games/`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (!response.ok) {
        //console.error('Error fetching games:', response.statusText);
        return false;
    }

    const games = await response.json();
    return games.some(game =>
        game.playMode === 2 &&
        (game.invitee.id === userId || game.inviter.id === userId) &&
        (game.invitationStatus === "PENDING" || game.invitationStatus === "ACCEPTED")
    );
}

// Función para manejar el evento "update_waiting_list"
export async function handleUpdateWaitingList(message, userId, myUser) {
    const waitingIds = message.waiting_ids;
    //console.log("---> Matching: waitingIds:", waitingIds, ",userId:", userId, ", myUser:", myUser);
    if (waitingIds.length >= 2) {
        for (let i = 1; i < waitingIds.length; i += 2) {
            if (waitingIds[i] === userId) {

                //console.log("---> Matching: sendGameInitiate_Waiting:", userId, waitingIds[i - 1]);

                // let status_id_1 = await hasPendingOrAcceptedGames(userId);
                // let status_id_2 = await hasPendingOrAcceptedGames(waitingIds[i - 1]);

                // console.log(">> status_id_1:", status_id_1);
                // console.log(">> status_id_2:", status_id_2);
                // if (status_id_2 || status_id_1){
                //     return;
                // }

                // let status = await sendGameInitiate_Waiting(userId, waitingIds[i - 1]);
                let status = await sendGameInitiate_Waiting(userId, waitingIds[i - 1]);
                //console.log("<--- Matching: status:", status);
                if (status.ok) {
                    //console.log("---> Matching: Se mando la invitacion a l juego:", userId, myUser.username, waitingIds[i - 1], "system");
                    sendGameInviteNotifications(userId, myUser.username, waitingIds[i - 1], "system");
                //     // WSsocket.close();
                //     // connectWebSocketGlobal()
                }
                break;
            }
        }
    }
}


// Función para enviar un mensaje específico al WebSocket
export function sendChannelCreatedNotifications(userId, userName, destUserId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        // console.log('WebSocket is not connected');
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

// Función para enviar un mensaje específico al WebSocket Diego
export function sendGameInviteNotifications(userId, userName, destUserId, text) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.log('WebSocket is not connected');
        return;
    }

    const message = {
        type: "game_invite",
        message: text,
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };

    //console.log("???");
    //console.log("sendGameInviteNotifications",message);

    WSsocket.send(JSON.stringify(message));
}

// Función para enviar un mensaje específico al WebSocket
export function sendGameInviteTournamentNotifications(userId, userName, destUserId, text) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.log('WebSocket is not connected');
        return;
    }

    const message = {
        type: "notify",
        message: text,
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };

    WSsocket.send(JSON.stringify(message));
}

// Función para enviar un mensaje específico al WebSocket
export function sendGameAcceptTournamentNotifications(userId, userName, destUserId, text) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.log('WebSocket is not connected');
        return;
    }

    const message = {
        type: "notify",
        message: text,
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };

    WSsocket.send(JSON.stringify(message));
}

export function sendFinalOftTournamentNotifications(userId, userName, destUserId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.log('WebSocket is not connected');
        return;
    }

    const message = {
        type: "notify",
        message: `final_of_the_tournament_${localStorage.getItem("currentTournamentId")}`,
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };

    WSsocket.send(JSON.stringify(message));
}

export function sendFinishTournamentNotifications(userId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.log('WebSocket is not connected');
        return;
    }

    const message = {
        type: "notify",
        message: `system_Tournament_${localStorage.getItem("currentTournamentId")}_finish`,
        user_id: String(userId),
        user_name: "name",
        dest_user_id: 0
    };

    WSsocket.send(JSON.stringify(message));
}

// Función para enviar un mensaje específico al WebSocket
export function sendGameCancelTournamentNotifications(userId, userName, destUserId) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.log('WebSocket is not connected');
        return;
    }

    const message = {
        type: "notify",
        message: "Cancel Game",
        user_id: String(userId),
        user_name: userName,
        dest_user_id: String(destUserId)
    };

    WSsocket.send(JSON.stringify(message));
}

// Función para enviar un mensaje específico al WebSocket
export function sendWinnerOfGameTournamentNotifications(userId, userName, text) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.log('WebSocket is not connected');
        return;
    }

    const message = {
        type: "notify",
        message: text,
        user_id: String(userId),
        user_name: userName,
        dest_user_id: 0
    };

    WSsocket.send(JSON.stringify(message));
}

export function userUpdateNotifications(userName) {
    if (!WSsocket || WSsocket.readyState !== WebSocket.OPEN) {
        //console.log('WebSocket is not connected');
        return;
    }

    const message = {
        type: "notify",
        message: "user_update",
        user_id: String(getUserIdFromJWT()),
        user_name: userName,
        dest_user_id: 0
    };

    WSsocket.send(JSON.stringify(message));
}