import { BACKEND_URL, WS_URL } from "../../components/wcGlobal.js";
import { getToken } from "../../utils/get-token.js";
import { getHash } from "../../utils/getHash.js";
import { getUserIdFromJWT } from "../Chat/funcions-js.js";
import { Send_data_bacnd_the_winner } from "./tournament-logic.js";

export let gameSocket;

export async function Game_js() {
  const jwt = getToken();
  if (!jwt) {
    window.location.replace("/#");
  }

  const gameId = getHash();
  if (gameId === "/") return;

  // Fetch the current user's ID
  const responseUser = await fetch(`${BACKEND_URL}/api/me/`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const myUserData = await responseUser.json();

  // Fetch initial game data/details
  const responseGame = await fetch(`${BACKEND_URL}/api/games/`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const games_data = await responseGame.json();

  if (games_data.detail || games_data.length === 0) {
    window.location.replace("/#");
    return;
  }

  let game = games_data.find((game) => String(game.id) === gameId);

  let checMyId = getUserIdFromJWT();
  if (
    !game ||
    !(game.inviter.id === checMyId || game.invitee.id === checMyId) ||
    game.invitationStatus !== "ACCEPTED"
  ) {
    window.location.replace("/#");
    return;
  }

  if (!game.playMode) {
    window.location.replace("/#");
    return;
  }

  localStorage.setItem("system_game_id", game.id);

  document.getElementById("game-id").innerText = game.id;
  document.getElementById("game-play-mode-text").innerText =
    game.playMode === 1 ? "Play on 1 Computer" : "Play on 2 Computers";
  document.getElementById("game-winner-text").innerText = game.winner.username
    ? `${game.winner.username} is the winner! 🎉`
    : "";

  // Determine if the current user is the inviter or invitee
  const isLeftPlayer = myUserData.id === game.inviter.id;
  const isRightPlayer = myUserData.id === game.invitee.id;

  // Update player names
  const leftPaddleNameElement = document.getElementById("left-paddle-name");
  const rightPaddleNameElement = document.getElementById("right-paddle-name");
  leftPaddleNameElement.innerText = game.inviter.username || "";
  rightPaddleNameElement.innerText = game.invitee.username || "";

  // Update player scores
  const leftPaddleScoreElement = document.getElementById("left-paddle-score");
  const rightPaddleScoreElement = document.getElementById("right-paddle-score");
  leftPaddleScoreElement.innerText = game.inviterScore || 0;
  rightPaddleScoreElement.innerText = game.inviteeScore || 0;

  // Don't do anything if the game is finished
  if (responseGame.status !== 200 || game.invitationStatus === "FINISHED")
    return;

  /**
   * The game real-time connection
   */

  gameSocket = new WebSocket(
    `${WS_URL}/ws/game/${game.id}/?token=${jwt}&playMode=${game.playMode}`
  );
  // Also provide the play_mode

  gameSocket.onopen = function (event) {
    // console.info("Game socket connected");
  };

  // game loop, 60 FPS because the backend sent that much
  gameSocket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    console.log(data.message);
    renderGameState(data.message);
  };

  gameSocket.onclose = function (event) {
    if (event.wasClean) {
      // console.info(
      //   `Connection closed cleanly, code=${event.code}, reason=${event.reason}`
      // );
    } else {
      // console.info("Game socket connection died");
    }
  };

  gameSocket.onerror = function (error) {
    // console.log(`WebSocket error: ${error.message}`);
  };

  /**
   * The actual game visuals here
   */

  const canvasElement = document.getElementById("game");
  const context = canvasElement.getContext("2d");

  // Drawings on the canvas
  const grid = 5;
  const paddleHeight = grid * 5;
  const maxPaddleY = canvasElement.height - grid - paddleHeight;

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  const KEYS = {
    W: 87,
    S: 83,
    UP: 38,
    DOWN: 40,
  };

  function handleKeyDown(e) {
    let direction = null;

    if (game.playMode === 1) {
      // W key
      if (e.which === KEYS.W) {
        direction = "left_up";
      }
      // S key
      if (e.which === KEYS.S) {
        direction = "left_down";
      }
      // Up arrow key
      if (e.which === KEYS.UP) {
        direction = "right_up";
      }
      // Down arrow key
      if (e.which === KEYS.DOWN) {
        direction = "right_down";
      }
    } else if (game.playMode === 2) {
      if (isLeftPlayer) {
        // W key
        if (e.which === KEYS.W) {
          direction = "left_up";
        }
        // S key
        if (e.which === KEYS.S) {
          direction = "left_down";
        }
      } else if (isRightPlayer) {
        // Up arrow key
        if (e.which === KEYS.UP) {
          direction = "right_up";
        }
        // Down arrow key
        if (e.which === KEYS.DOWN) {
          direction = "right_down";
        }
      }
    }

    if (direction && gameSocket) {
      gameSocket.send(
        JSON.stringify({
          action: "move",
          direction: direction,
        })
      );
    }
  }

  function handleKeyUp(e) {
    let direction = null;

    if (game.playMode === 1) {
      // W or S key
      if (e.which === KEYS.W || e.which === KEYS.S) {
        direction = "left_stop";
      }
      // Up or Down arrow key
      if (e.which === KEYS.UP || e.which === KEYS.DOWN) {
        direction = "right_stop";
      }
    } else if (game.playMode === 2) {
      if (isLeftPlayer) {
        // W or S key
        if (e.which === KEYS.W || e.which === KEYS.S) {
          direction = "left_stop";
        }
      } else if (isRightPlayer) {
        // Up or Down arrow key
        if (e.which === KEYS.UP || e.which === KEYS.DOWN) {
          direction = "right_stop";
        }
      }
    }

    if (direction && gameSocket) {
      gameSocket.send(
        JSON.stringify({
          action: "move",
          direction: direction,
        })
      );
    }
  }

  async function renderGameState(state) {
    // Update scores
    leftPaddleScoreElement.innerText = state.left_score || 0;
    rightPaddleScoreElement.innerText = state.right_score || 0;

    if (!localStorage.getItem("system_game_id")) {
      gameSocket.close();

      // Optionally remove event listeners to prevent further key inputs
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      return;
    }

    if (state.winner) {
      // Close the WebSocket connection
      gameSocket.close();

      // Optionally remove event listeners to prevent further key inputs
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);

      // Announce the winner and stop the game
      const winner =
        state.winner === "left"
          ? game.inviter
          : state.winner === "right"
          ? game.invitee
          : "";

      document.getElementById(
        "game-winner-text"
      ).innerText = `${winner.username} is the winner! 🎉`;

      let winnerId = null;
      if (state.winner === "left") {
        winnerId = game.inviter.id;
      } else if (state.winner === "right") {
        winnerId = game.invitee.id;
      }

      const response = await fetch(
        `${BACKEND_URL}/api/games/${gameId}/finish_game/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            winnerId: winnerId,
            inviterScore: state.left_score,
            inviteeScore: state.right_score,
          }),
        }
      );

      const result = await response.json();
      localStorage.removeItem("system_game_id");

      // Save data in the backend
      setTimeout(async () => {
        await Send_data_bacnd_the_winner(
          game.inviter.id,
          game.invitee.id,
          winnerId
        );
      }, Math.floor(Math.random() * 300));

      return; // Stop further rendering
    }

    context.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Calculate actual pixel positions based on canvas dimensions
    const canvasWidth = canvasElement.width;
    const canvasHeight = canvasElement.height;
    const paddleHeight = grid * 5;

    const leftPaddleX = grid * 2;
    const rightPaddleX = canvasElement.width - grid * 3;

    const leftPaddleY =
      (state.left_paddle_y / 100) * (canvasHeight - paddleHeight);
    const rightPaddleY =
      (state.right_paddle_y / 100) * (canvasHeight - paddleHeight);

    const ballX = (state.ball_x / 100) * canvasWidth;
    const ballY = (state.ball_y / 100) * canvasHeight;

    // Draw paddles
    context.fillStyle = "white";
    context.fillRect(leftPaddleX, leftPaddleY, grid, paddleHeight);
    context.fillRect(rightPaddleX, rightPaddleY, grid, paddleHeight);

    // Draw ball
    context.fillRect(ballX, ballY, grid, grid);

    // Draw the field borders
    context.fillStyle = "lightgrey";
    context.fillRect(0, 0, canvasWidth, grid);
    context.fillRect(0, canvasHeight - grid, canvasWidth, canvasHeight);

    // Draw the middle dotted line
    for (let i = grid; i < canvasHeight - grid; i += grid * 2) {
      context.fillRect(canvasWidth / 2 - grid / 2, i, grid, grid);
    }
  }
}
