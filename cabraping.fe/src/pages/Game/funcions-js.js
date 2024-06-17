import { BACKEND_URL, WS_URL } from "../../components/wcGlobal.js";
import { getToken } from "../../utils/get-token.js";
import { getHash } from "../../utils/getHash.js";
import { getUserIdFromJWT } from "../Chat/funcions-js.js";
import { Send_data_bacnd_the_winner } from "./tournament-logic.js";
import { getLocalhostSystem_game_on, next_game, setLocalhostSystem_game_on } from "./utils.js";


export let gameSocket;

export async function Game_js() {
  const jwt = getToken();
  if (!jwt) {
    window.location.replace("/#");
  }

  const gameId = getHash();
  if (gameId === "/") return;

  const responseUser = await fetch(`${BACKEND_URL}/api/me/`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const myUserData = await responseUser.json();

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

  const isLeftPlayer = myUserData.id === game.inviter.id;
  const isRightPlayer = myUserData.id === game.invitee.id;

  const leftPaddleNameElement = document.getElementById("left-paddle-name");
  const rightPaddleNameElement = document.getElementById("right-paddle-name");
  leftPaddleNameElement.innerText = game.inviter.username || "";
  rightPaddleNameElement.innerText = game.invitee.username || "";

  const leftPaddleScoreElement = document.getElementById("left-paddle-score");
  const rightPaddleScoreElement = document.getElementById("right-paddle-score");
  leftPaddleScoreElement.innerText = game.inviterScore || 0;
  rightPaddleScoreElement.innerText = game.inviteeScore || 0;

  if (responseGame.status !== 200 || game.invitationStatus === "FINISHED")
    return;

  gameSocket = new WebSocket(
    `${WS_URL}/ws/game/${game.id}/?token=${jwt}&playMode=${game.playMode}`
  );

  gameSocket.onopen = function (event) {
    // console.info("Game socket connected");
  };

  gameSocket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    renderGameState(data.message);
  };

  gameSocket.onclose = function (event) {
    if (event.wasClean) {
      // console.info(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
    } else {
      // console.info("Game socket connection died");
    }
  };

  gameSocket.onerror = function (error) {
    // console.log(`WebSocket error: ${error.message}`);
  };

  const canvasElement = document.getElementById("game");
  const context = canvasElement.getContext("2d");

  const grid = 5;
  const paddleWidth = (grid * 2) / 2;
  const paddleHeight = (grid * 12) / 2;
  const ballRadius = (grid * 1.5) / 2;

  const leftPaddle = {
    x: grid, // Position at the very left edge
    y: canvasElement.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
  };
  const rightPaddle = {
    x: canvasElement.width - paddleWidth - grid, // Position at the very right edge
    y: canvasElement.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
  };
  const ball = {
    x: canvasElement.width / 2,
    y: canvasElement.height / 2,
    radius: ballRadius,
    dx: grid,
    dy: grid,
  };

  const KEYS = {
    W: 87,
    S: 83,
    UP: 38,
    DOWN: 40,
  };

  document.addEventListener("keydown", (e) => {
    if (game.playMode === 1 && gameSocket && gameSocket.readyState === 1) {
      if (e.which === KEYS.W) {
        gameSocket.send(
          JSON.stringify({ action: "move", direction: "left_up" })
        );
      } else if (e.which === KEYS.S) {
        gameSocket.send(
          JSON.stringify({ action: "move", direction: "left_down" })
        );
      } else if (e.which === KEYS.UP) {
        gameSocket.send(
          JSON.stringify({ action: "move", direction: "right_up" })
        );
      } else if (e.which === KEYS.DOWN) {
        gameSocket.send(
          JSON.stringify({ action: "move", direction: "right_down" })
        );
      }
    } else if (game.playMode === 2 && gameSocket && gameSocket.readyState === 1) {
      if (isLeftPlayer) {
        if (e.which === KEYS.W) {
          gameSocket.send(
            JSON.stringify({ action: "move", direction: "left_up" })
          );
        } else if (e.which === KEYS.S) {
          gameSocket.send(
            JSON.stringify({ action: "move", direction: "left_down" })
          );
        }
      } else if (isRightPlayer) {
        if (e.which === KEYS.UP) {
          gameSocket.send(
            JSON.stringify({ action: "move", direction: "right_up" })
          );
        } else if (e.which === KEYS.DOWN) {
          gameSocket.send(
            JSON.stringify({ action: "move", direction: "right_down" })
          );
        }
      }
    }
  });

  document.addEventListener("keyup", (e) => {
    if (game.playMode === 1 && gameSocket && gameSocket.readyState === 1) {
      if (e.which === KEYS.W || e.which === KEYS.S) {
        gameSocket.send(
          JSON.stringify({ action: "move", direction: "left_stop" })
        );
      }
      if (e.which === KEYS.UP || e.which === KEYS.DOWN) {
        gameSocket.send(
          JSON.stringify({ action: "move", direction: "right_stop" })
        );
      }
    } else if (game.playMode === 2 && gameSocket && gameSocket.readyState === 1) {
      if (isLeftPlayer) {
        if (e.which === KEYS.W || e.which === KEYS.S) {
          gameSocket.send(
            JSON.stringify({ action: "move", direction: "left_stop" })
          );
        }
      } else if (isRightPlayer) {
        if (e.which === KEYS.UP || e.which === KEYS.DOWN) {
          gameSocket.send(
            JSON.stringify({ action: "move", direction: "right_stop" })
          );
        }
      }
    }
  });

  async function renderGameState(state) {
    leftPaddleScoreElement.innerText = state.left_score || 0;
    rightPaddleScoreElement.innerText = state.right_score || 0;

    if (!localStorage.getItem("system_game_id")) {
      if (gameSocket && gameSocket.readyState === 1) {
        gameSocket.close();
      }

      // document.removeEventListener("keydown", handleKeyDown);
      // document.removeEventListener("keyup", handleKeyUp);
      return;
    }

    if (state.winner) {
      if (gameSocket && gameSocket.readyState === 1) {
        gameSocket.close();
      }

      // document.removeEventListener("keydown", handleKeyDown);
      // document.removeEventListener("keyup", handleKeyUp);

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

      await Send_data_bacnd_the_winner(
        game.inviter.id,
        game.invitee.id,
        winnerId
      );

      return;
    }

    context.clearRect(0, 0, canvasElement.width, canvasElement.height);

    const canvasWidth = canvasElement.width;
    const canvasHeight = canvasElement.height;

    leftPaddle.y =
      (state.left_paddle_y / 100) * (canvasHeight - paddleHeight) + 8;
    rightPaddle.y =
      (state.right_paddle_y / 100) * (canvasHeight - paddleHeight) + 8;
    ball.x = (state.ball_x / 100) * canvasWidth;
    ball.y = (state.ball_y / 100) * canvasHeight;

    context.fillStyle = "white";
    context.fillRect(
      leftPaddle.x,
      leftPaddle.y,
      leftPaddle.width,
      leftPaddle.height
    );
    context.fillRect(
      rightPaddle.x,
      rightPaddle.y,
      rightPaddle.width,
      rightPaddle.height
    );
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
    context.fill();

    context.fillStyle = "lightgrey";
    context.fillRect(0, 0, canvasWidth, grid);
    context.fillRect(0, canvasHeight - grid, canvasWidth, grid);

    for (let i = grid; i < canvasHeight - grid; i += grid * 3) {
      context.fillRect(canvasWidth / 2 - grid / 2, i, grid, grid * 1.5);
    }
  }
}
