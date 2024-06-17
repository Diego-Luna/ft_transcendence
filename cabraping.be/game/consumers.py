import json
import asyncio
import math
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from urllib.parse import parse_qs

class Paddle:
    WIDTH = 2
    HEIGHT = 20
    MOVEMENT_SPEED = 2.5

    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.movement = 0

    def move(self, direction):
        if direction == "up":
            self.movement = -Paddle.MOVEMENT_SPEED
        elif direction == "down":
            self.movement = Paddle.MOVEMENT_SPEED
        elif direction == "stop":
            self.movement = 0

    def update(self, max_height):
        self.y += self.movement

        # Ensure the paddle does not move above the top boundary
        if self.y < 2:
            self.y = 0

        # Ensure the paddle does not move below the bottom boundary
        if self.y > max_height - Paddle.HEIGHT - 2:
            self.y = max_height - Paddle.HEIGHT

class Ball:
    RADIUS = 2
    SPEED = 1.2

    def __init__(self, x, y):
        self.x = x
        self.y = y
        angle = math.radians(35)
        self.dx = math.cos(angle) * Ball.SPEED
        self.dy = math.sin(angle) * Ball.SPEED

    def update(self):
        self.x += self.dx
        self.y += self.dy

    def reset(self, width, height):
        self.x = width // 2
        self.y = height // 2
        angle = math.radians(35)
        self.dx = math.cos(angle) * Ball.SPEED
        self.dy = math.sin(angle) * Ball.SPEED

    def detect_collision(self, paddle_left, paddle_right, width, height):
        if self.y - Ball.RADIUS <= 0 or self.y + Ball.RADIUS >= height:
            self.dy *= -1

        if self.dx < 0 and self.x - Ball.RADIUS <= paddle_left.x + Paddle.WIDTH:
            if paddle_left.y - 3 <= self.y <= paddle_left.y + Paddle.HEIGHT:
                self.x = paddle_left.x + Paddle.WIDTH + Ball.RADIUS
                self.dx *= -1

        if self.dx > 0 and self.x + Ball.RADIUS >= paddle_right.x:
            if paddle_right.y - 3 <= self.y <= paddle_right.y + Paddle.HEIGHT:
                self.x = paddle_right.x - Ball.RADIUS
                self.dx *= -1

class Game:
    WIDTH = 100
    HEIGHT = 100

    def __init__(self, game_id, play_mode):
        self.game_id = game_id
        self.play_mode = play_mode
        self.paddle_left = Paddle(1, 50 - Paddle.HEIGHT // 2)
        self.paddle_right = Paddle(Game.WIDTH - Paddle.WIDTH - 1, 50 - Paddle.HEIGHT // 2)
        self.ball = Ball(Game.WIDTH // 2, Game.HEIGHT // 2)
        self.left_score = 0
        self.right_score = 0
        self.winner = None
        self.players = {"left": None, "right": None}
        self.loop_running = False

    def update_state(self):
        self.ball.update()
        self.paddle_left.update(Game.HEIGHT)
        self.paddle_right.update(Game.HEIGHT)
        self.ball.detect_collision(self.paddle_left, self.paddle_right, Game.WIDTH, Game.HEIGHT)

        if self.ball.x - Ball.RADIUS + 1 <= 0:
            self.right_score += 1
            self.ball.reset(Game.WIDTH, Game.HEIGHT)
        elif self.ball.x + Ball.RADIUS - 1>= Game.WIDTH:
            self.left_score += 1
            self.ball.reset(Game.WIDTH, Game.HEIGHT)

        if self.left_score == 3:
            self.winner = "left"
        elif self.right_score == 3:
            self.winner = "right"

    def paddle_move_left(self, direction):
        if direction == "left_up":
            self.paddle_left.move("up")
        elif direction == "left_down":
            self.paddle_left.move("down")
        elif direction == "left_stop":
            self.paddle_left.move("stop")

    def paddle_move_right(self, direction):
        if direction == "right_up":
            self.paddle_right.move("up")
        elif direction == "right_down":
            self.paddle_right.move("down")
        elif direction == "right_stop":
            self.paddle_right.move("stop")

    def get_state(self):
        return {
            "left_paddle_y": self.paddle_left.y,
            "right_paddle_y": self.paddle_right.y,
            "ball_x": self.ball.x,
            "ball_y": self.ball.y,
            "left_score": self.left_score,
            "right_score": self.right_score,
            "winner": self.winner,
        }

class GameConsumer(AsyncWebsocketConsumer):
    games = {}

    async def connect(self):
        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        self.game_group_name = f"game_{self.game_id}"

        query_string = self.scope["query_string"].decode()
        query_params = parse_qs(query_string)
        self.play_mode = int(query_params.get("playMode", [0])[0])

        if self.game_id not in self.games:
            self.games[self.game_id] = Game(self.game_id, self.play_mode)

        await self.channel_layer.group_add(self.game_group_name, self.channel_name)
        await self.accept()

        game = self.games[self.game_id]
        if game.players["left"] is None:
            game.players["left"] = self.channel_name
        elif game.players["right"] is None:
            game.players["right"] = self.channel_name

        await self.channel_layer.group_send(
            self.game_group_name,
            {
                "type": "game_state_message",
                "sender_channel_name": self.channel_name,
                "message": "A player joined the game",
            },
        )

        if (game.play_mode == 1 or (game.players["left"] and game.players["right"])) and not game.loop_running:
            game.loop_running = True
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    "type": "game_state_message",
                    "message": "Both players have joined. The game is starting!",
                },
            )
            await asyncio.sleep(2)
            asyncio.create_task(self.game_loop(self.game_id))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.game_group_name, self.channel_name)
        game = self.games[self.game_id]
        if game.players["left"] == self.channel_name:
            game.players["left"] = None
        elif game.players["right"] == self.channel_name:
            game.players["right"] = None

    async def receive(self, text_data):
        data = json.loads(text_data)
        game = self.games[self.game_id]

        if data["action"] == "move":
            direction = data["direction"]
            if "left" in direction:
                game.paddle_move_left(direction)
            elif "right" in direction:
                game.paddle_move_right(direction)

        state = game.get_state()

        await self.channel_layer.group_send(
            self.game_group_name,
            {
                "type": "game_state_message",
                "message": state,
            },
        )

    async def game_state_message(self, event):
        message = event["message"]
        await self.send(
            text_data=json.dumps(
                {
                    "message": message,
                }
            )
        )

    @staticmethod
    async def game_loop(game_id):
        game = GameConsumer.games.get(game_id)

        while True:
            await asyncio.sleep(1 / 100)  # 60 FPS

            if game.winner:
                state = game.get_state()
                channel_layer = get_channel_layer()
                await channel_layer.group_send(
                    f"game_{game_id}",
                    {"type": "game_state_message", "message": state},
                )
                break

            if game:
                game.update_state()
                state = game.get_state()
                channel_layer = get_channel_layer()
                await channel_layer.group_send(
                    f"game_{game_id}",
                    {"type": "game_state_message", "message": state},
                )
