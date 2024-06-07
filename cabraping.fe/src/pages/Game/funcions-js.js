import { getToken } from "../../utils/get-token.js";
import { getHash } from "../../utils/getHash.js";


// Extract the IP address from the URL used to access the frontend
const frontendURL = new URL(window.location.href);
const serverIPAddress = frontendURL.hostname;
const serverPort = 8000; // Specify the port your backend server is running on
const BACKEND_URL = `http://${serverIPAddress}:${serverPort}`;
const WS_URL = `ws://${serverIPAddress}:${serverPort}`;

export async function Game_js() {
  const jwt = getToken();
  const gameId = getHash();
  if (gameId === "/") return;

  // Fetch initial game data
  const responseGame = await fetch(`${BACKEND_URL}/api/games/${gameId}/`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const game = await responseGame.json();

  // Fetch the current user's ID
  const responseUser = await fetch(`${BACKEND_URL}/api/me/`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const myUserData = await responseUser.json();

  document.getElementById("game-id").innerText = game.id;

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

  const gameSocket = new WebSocket(`${WS_URL}/ws/game/${game.id}/`);

  gameSocket.onopen = function (event) {
    console.info("Game socket connected");
  };

  // game loop, 60 FPS because the backend sent that much
  gameSocket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    renderGameState(data.message);
  };

  gameSocket.onclose = function (event) {
    if (event.wasClean) {
      console.info(
        `Connection closed cleanly, code=${event.code}, reason=${event.reason}`
      );
    } else {
      console.info("Game socket connection died");
    }
  };

  gameSocket.onerror = function (error) {
    console.error(`WebSocket error: ${error.message}`);
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

  let leftPaddle = {
    x: grid * 2,
    y: canvasElement.height / 2 - paddleHeight / 2,
    width: grid,
    height: paddleHeight,
    dy: 0,
  };
  let rightPaddle = {
    x: canvasElement.width - grid * 3,
    y: canvasElement.height / 2 - paddleHeight / 2,
    width: grid,
    height: paddleHeight,
    dy: 0,
  };
  let ball = {
    x: canvasElement.width / 2,
    y: canvasElement.height / 2,
    width: grid,
    height: grid,
    resetting: false,
  };

  // Check collision between two objects
  function collides(obj1, obj2) {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj2.height > obj2.y
    );
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  function handleKeyDown(e) {
    if (isLeftPlayer) {
      if (e.which === 87) {
        // W key
        gameSocket.send(JSON.stringify({ paddle_move: "up", side: "left" }));
      } else if (e.which === 83) {
        // S key
        gameSocket.send(JSON.stringify({ paddle_move: "down", side: "left" }));
      }
    }
    if (isRightPlayer) {
      if (e.which === 38) {
        // Up key
        gameSocket.send(JSON.stringify({ paddle_move: "up", side: "right" }));
      } else if (e.which === 40) {
        // Down key
        gameSocket.send(JSON.stringify({ paddle_move: "down", side: "right" }));
      }
    }
  }

  function handleKeyUp(e) {
    if (isLeftPlayer) {
      if (e.which === 87 || e.which === 83) {
        // W or S key
        gameSocket.send(JSON.stringify({ paddle_move: "stop", side: "left" }));
      }
    }
    if (isRightPlayer) {
      if (e.which === 38 || e.which === 40) {
        // Up or Down key
        gameSocket.send(JSON.stringify({ paddle_move: "stop", side: "right" }));
      }
    }
  }

  async function renderGameState(state) {
    // Update scores
    leftPaddleScoreElement.innerText = state.left_score || 0;
    rightPaddleScoreElement.innerText = state.right_score || 0;

    if (state.winner) {
      console.log({ state });
      // Announce the winner and stop the game
      // alert(`Game finished.`);

      // Close the WebSocket connection
      gameSocket.close();

      // Optionally remove event listeners to prevent further key inputs
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);

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

      const result = response.json;

      return; // Stop further rendering
    }

    context.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Calculate actual pixel positions based on canvas dimensions
    const canvasWidth = canvasElement.width;
    const canvasHeight = canvasElement.height;
    const paddleHeight = grid * 5;

    const leftPaddleY =
      (state.left_paddle_y / 100) * (canvasHeight - paddleHeight);
    const rightPaddleY =
      (state.right_paddle_y / 100) * (canvasHeight - paddleHeight);

    const ballX = (state.ball_x / 100) * canvasWidth;
    const ballY = (state.ball_y / 100) * canvasHeight;

    // Draw paddles
    context.fillStyle = "white";
    context.fillRect(leftPaddle.x, leftPaddleY, leftPaddle.width, paddleHeight);
    context.fillRect(
      rightPaddle.x,
      rightPaddleY,
      rightPaddle.width,
      paddleHeight
    );

    // Draw ball
    context.fillRect(ballX, ballY, ball.width, ball.height);

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
