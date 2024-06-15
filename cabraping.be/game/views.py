from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from .models import Game
from .serializers import GameSerializer

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# Create your views here.

class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer

    # When creating a new game
    # Send a notification to the invitee
    def perform_create(self, serializer):
        game = serializer.save()
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'user_{game.invitee.id}',
            {
                'type': 'user_notification_message',
                'message': 'You are being invited to a game',
                'status': 'GAME_INVITED',
                'user_id': game.invitee.id,
                'game_id': game.id
            }
        )


    # Delete a specific game
    def destroy(self, request, *args, **kwargs):
        game_id = kwargs.get('pk')
        try:
            game = Game.objects.get(pk=game_id)
            if game:
                self.perform_destroy(game)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Game.DoesNotExist:
            return Response(status=status.HTTP_200_OK)

    # Delete all games
    @action(detail=False, methods=["delete"])
    def delete_all(self, request):
        self.get_queryset().delete()
        return Response(status=204)

    # Accept game as the invitee
    # /api/games/:gameId/accept_game/`
    @action(detail=True, methods=["put"])
    def accept_game(self, request, pk=None):
        game = self.get_object()
        # Check if the user making the request is the invitee
        if request.user == game.invitee:
            game.invitationStatus = "ACCEPTED"
            game.save()

            # Send a notification to the inviter
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'user_{game.inviter.id}',
                {
                    'type': 'user_notification_message',
                    'message': 'A game being accepted',
                    'status': 'GAME_ACCEPTED',
                    'user_id': game.inviter.id,
                    'game_id': game.id
                }
            )

            serializer = self.get_serializer(game)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(
            {"error": "You are not the invitee of this game."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # /api/games/:gameId/reject_game/`
    @action(detail=True, methods=["put"])
    def reject_game(self, request):
        game = self.get_object()

        if request.user == game.invitee:
            game.invitationStatus = "REJECTED"
            game.save()
            serializer = self.get_serializer(game)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(
            {"error": "You are not the invitee of this game."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # /api/games/:gameId/finish_game/`
    @action(detail=True, methods=["put"])
    def finish_game(self, request, pk=None):
        game = self.get_object()

        # Check if the user making the request is part of the game
        if request.user in [game.inviter, game.invitee]:
            data = request.data
            # Update the game with the provided data
            game.invitationStatus = "FINISHED"
            game.winner_id = data.get("winnerId", game.winner_id)
            game.inviterScore = data.get("inviterScore", game.inviterScore)
            game.inviteeScore = data.get("inviteeScore", game.inviteeScore)
            game.save()
            serializer = self.get_serializer(game)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(
            {"error": "You are not a participant of this game."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Add more custom actions or overrides for other CRUD operations as needed