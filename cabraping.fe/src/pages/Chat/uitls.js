import { userUpdateNotifications } from "../../components/wcGlobal-funcions-send-message.js";
import { Cancel_a_Game } from "../Game/cancel.js";
import { Chat_Update_js } from "./funcions-js.js";


export async function CancelGame_selecte(gameid) {
    await Cancel_a_Game(gameid)
    await Chat_Update_js();
    userUpdateNotifications()
    const cancelGameButton = document.getElementById('cancelGameButton');
    if (cancelGameButton) {
      cancelGameButton.disabled = true;
    }
}