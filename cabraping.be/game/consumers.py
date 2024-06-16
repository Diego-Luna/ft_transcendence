import json
import asyncio
import math

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from urllib.parse import parse_qs


class Game:
    def __init__(self, game_id, play_mode):
        self.game_id = game_id
        self.play_mode = play_mode
        self.left_paddle_x = 0  # Adjusted for edge position
        self.left_paddle_y = 50
        self.right_paddle_x = 100  # Adjusted for edge position
        self.right_paddle_y = 50
        self.ball_x = 50
        self.ball_y = 50
        angle = math.radians(35)  # Convert 35 degrees to radians
        self.ball_dx = math.cos(angle) * 0.7  # Adjust speed here
        self.ball_dy = math.sin(angle) * 0.7  # Adjust speed here
        self.left_score = 0
        self.right_score = 0
        self.winner = None
        self.players = {"left": None, "right": None}  # Track players
        self.loop_running = False  # Flag to indicate if the game loop is running
        self.left_paddle_movement = 0
        self.right_paddle_movement = 0
        self.MOVEMENT_SPEED = 1

    def detect_collisions(self):
        # Check collision with left paddle
        if self.ball_dx < 0 and self.ball_x <= self.left_paddle_x + 1 and abs(self.left_paddle_y - self.ball_y) <= 12:
            self.ball_x = self.left_paddle_x + 1  # Prevent ball from going inside paddle
            self.ball_dx *= -1
        
        # Check collision with right paddle
        if self.ball_dx > 0 and self.ball_x >= self.right_paddle_x - 1 and abs(self.right_paddle_y - self.ball_y) <= 12:
            self.ball_x = self.right_paddle_x - 1  # Prevent ball from going inside paddle
            self.ball_dx *= -1

        # Check collision with top and bottom walls
        if self.ball_y <= 4 or self.ball_y >= 94:
            self.ball_dy *= -1

    def update_state(self):
        self.ball_x += self.ball_dx
        self.ball_y += self.ball_dy

        self.left_paddle_y += self.left_paddle_movement
        self.right_paddle_y += self.right_paddle_movement

        self.left_paddle_y = max(0, min(self.left_paddle_y, 100))
        self.right_paddle_y = max(0, min(self.right_paddle_y, 100))

        # Check and handle ball collisions with the paddles and walls
        self.detect_collisions()

        # Handle scoring
        if self.ball_x <= 0:
            self.right_score += 1
            self.ball_x = 50
            self.ball_y = 50
        elif self.ball_x >= 100:
            self.left_score += 1
            self.ball_x = 50
            self.ball_y = 50

        # Check for winner
        if self.left_score == 3:
            self.winner = "left"
        elif self.right_score == 3:
            self.winner = "right"

    def paddle_move_left(self, direction):
        if direction == "left_up":
            self.left_paddle_movement = -self.MOVEMENT_SPEED
        elif direction == "left_down":
            self.left_paddle_movement = self.MOVEMENT_SPEED
        elif direction == "left_stop":
            self.left_paddle_movement = 0
        
        # Ensure the left paddle does not move beyond the top and bottom borders
        if self.left_paddle_y + self.left_paddle_movement < 2:
            self.left_paddle_y = 2
            self.left_paddle_movement = 0
        elif self.left_paddle_y + self.left_paddle_movement > 92:
            self.left_paddle_y = 92
            self.left_paddle_movement = 0

    def paddle_move_right(self, direction):
        if direction == "right_up":
            self.right_paddle_movement = -self.MOVEMENT_SPEED
        elif direction == "right_down":
            self.right_paddle_movement = self.MOVEMENT_SPEED
        elif direction == "right_stop":
            self.right_paddle_movement = 0
        
        # Ensure the right paddle does not move beyond the top and bottom borders
        if self.right_paddle_y + self.right_paddle_movement < 2:
            self.right_paddle_y = 2
            self.right_paddle_movement = 0
        elif self.right_paddle_y + self.right_paddle_movement > 92:
            self.right_paddle_y = 92
            self.right_paddle_movement = 0

    def get_state(self):
        return {
            "left_paddle_y": self.left_paddle_y,
            "right_paddle_y": self.right_paddle_y,
            "ball_x": self.ball_x,
            "ball_y": self.ball_y,
            "left_score": self.left_score,
            "right_score": self.right_score,
            "winner": self.winner,
        }


class GameConsumer(AsyncWebsocketConsumer):
    games = {}  # Temporary games list being played as a cache

    async def connect(self):
        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        self.game_group_name = f"game_{self.game_id}"

        # Parse query string to get playMode
        query_string = self.scope["query_string"].decode()
        query_params = parse_qs(query_string)
        self.play_mode = int(
            query_params.get("playMode", [0])[0]
        )  # Default to 0 if not provided

        # Game loop for computation
        if self.game_id not in self.games:
            self.games[self.game_id] = Game(self.game_id, self.play_mode)

        # Join game group for communication/connection on WebSocket
        await self.channel_layer.group_add(self.game_group_name, self.channel_name)

        await self.accept()

        # Assign player to left or right paddle
        game = self.games[self.game_id]

        if game.players["left"] is None:
            game.players["left"] = self.channel_name
        elif game.players["right"] is None:
            game.players["right"] = self.channel_name

        # Notify the game group that a player joined
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                "type": "game_state_message",
                "sender_channel_name": self.channel_name,
                "message": "A player joined the game",
            },
        )

        # Check if both players have joined
        if (
            game.play_mode == 1 or (game.players["left"] and game.players["right"])
        ) and not game.loop_running:
            # Notify players that the game is starting
            game.loop_running = True  # Mark the game loop as running
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    "type": "game_state_message",
                    "message": "Both players have joined. The game is starting!",
                },
            )
            # Start the game loop
            asyncio.create_task(self.game_loop(self.game_id))

    async def disconnect(self, close_code):
        # Leave game group
        await self.channel_layer.group_discard(self.game_group_name, self.channel_name)

        # Pause the game / Remove the player from the game
        game = self.games[self.game_id]
        if game.players["left"] == self.channel_name:
            game.players["left"] = None
        elif game.players["right"] == self.channel_name:
            game.players["right"] = None

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        game = self.games[self.game_id]

        # Handle paddle movement
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

    # Receive message from game group
    async def game_state_message(self, event):
        message = event["message"]

        # Send message to WebSocket
        await self.send(
            text_data=json.dumps(
                {
                    "message": message,
                }
            )
        )

    @staticmethod
    async def game_loop(game_id):
        game = GameConsumer.games.get(game_id)  # Not from database

        while True:
            await asyncio.sleep(1 / 90)  # 90 FPS

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
