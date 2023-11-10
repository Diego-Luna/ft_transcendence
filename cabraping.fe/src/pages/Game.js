import { io } from "socket.io-client";

export function Game() {
  return `
    <div class="w-100 h-100 d-flex gap-4">
      <h1>game</h1>
      <div class="game-board">
        <canvas width="750" height="585" id="game"></canvas>
      </div>
    </div>
  `;
}

export function GameInit() {
  console.log("Start code in Game");

  const socket = io("http://localhost:3000");

  const canvasElement = document.getElementById("game");
  const context = canvasElement.getContext("2d");

  const grid = 15;
  const paddleHeight = grid * 5;
  const maxPaddleY = canvasElement.height - grid - paddleHeight;

  var paddleSpeed = 6;
  var ballSpeed = 5;

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
    dx: ballSpeed,
    dy: -ballSpeed,
  };

  function collides(obj1, obj2) {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }

  function loop() {
    requestAnimationFrame(loop);
    context.clearRect(0, 0, canvasElement.width, canvasElement.height);

    leftPaddle.y += leftPaddle.dy;
    rightPaddle.y += rightPaddle.dy;

    if (leftPaddle.y < grid) {
      leftPaddle.y = grid;
    } else if (leftPaddle.y > maxPaddleY) {
      leftPaddle.y = maxPaddleY;
    }

    if (rightPaddle.y < grid) {
      rightPaddle.y = grid;
    } else if (rightPaddle.y > maxPaddleY) {
      rightPaddle.y = maxPaddleY;
    }

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

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y < grid) {
      ball.y = grid;
      ball.dy *= -1;
    } else if (ball.y + grid > canvasElement.height - grid) {
      ball.y = canvasElement.height - grid * 2;
      ball.dy *= -1;
    }

    if ((ball.x < 0 || ball.x > canvasElement.width) && !ball.resetting) {
      ball.resetting = true;

      setTimeout(() => {
        ball.resetting = false;
        ball.x = canvasElement.width / 2;
        ball.y = canvasElement.height / 2;
      }, 400);
    }

    if (collides(ball, leftPaddle)) {
      ball.dx *= -1;
      ball.x = leftPaddle.x + leftPaddle.width;
    } else if (collides(ball, rightPaddle)) {
      ball.dx *= -1;
      ball.x = rightPaddle.x - ball.width;
    }

    context.fillRect(ball.x, ball.y, ball.width, ball.height);
    context.fillStyle = "lightgrey";
    context.fillRect(0, 0, canvasElement.width, grid);
    context.fillRect(
      0,
      canvasElement.height - grid,
      canvasElement.width,
      canvasElement.height
    );

    for (let i = grid; i < canvasElement.height - grid; i += grid * 2) {
      context.fillRect(canvasElement.width / 2 - grid / 2, i, grid, grid);
    }
  }

  function handleKeyDown(e) {
    if (e.which === 38) {
      rightPaddle.dy = -paddleSpeed;
    } else if (e.which === 40) {
      rightPaddle.dy = paddleSpeed;
    }
    if (e.which === 87) {
      leftPaddle.dy = -paddleSpeed;
    } else if (e.which === 83) {
      leftPaddle.dy = paddleSpeed;
    }

    updateGameState();
  }

  function handleKeyUp(e) {
    if (e.which === 38 || e.which === 40) {
      rightPaddle.dy = 0;
    }
    if (e.which === 83 || e.which === 87) {
      leftPaddle.dy = 0;
    }

    updateGameState();
  }

  function updateGameState() {
    socket.emit("game-state", {
      rightPaddlePosition: rightPaddle.y,
      leftPaddlePosition: leftPaddle.y,
      ballPositon: { x: ball.x, y: ball.y },
    });
  }

  function handleGameState(data) {
    rightPaddle.y = data.rightPaddlePosition;
    leftPaddle.y = data.leftPaddlePosition;
    ball.x = data.ballPositon.x;
    ball.y = data.ballPositon.y;
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  requestAnimationFrame(loop);

  setInterval(() => {
    socket.on("game-state", handleGameState);
  }, 1000 / 60);
}
