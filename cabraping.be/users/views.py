from django.contrib.auth import authenticate, login, logout
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status
from .models import CustomUser, FriendRequest
from .serializers import (
    UserSerializer,
    UserDataSerializer,
    MeDataSerializer,
    FriendRequestDataSerializer,
    FriendRequestSerializer,
    UserSerializerUpdate,
)
from rest_framework.decorators import action, api_view, permission_classes
from game.serializers import GameSerializer
from rest_framework.response import Response
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.parsers import JSONParser
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework.views import APIView
from .models import CustomUser

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Suponiendo que la autenticación ya está manejada correctamente
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)


class UserUpdate(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
            serializer = UserSerializer(user, data=request.data, partial=True)  # Allow partial updates
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()

    # /api/users
    def get_serializer_class(self):
        # GET /api/users/
        # GET /api/users/<pk>
        if self.action in ["list", "retrieve"]:
            return UserDataSerializer
        # POST /api/users/
        # PUT /api/users/<pk>
        # DELETE /api/users/<pk>
        else:
            return UserSerializer
    
     # Delete all users
    # DELETE /api/users/
    @action(detail=False, methods=["delete"])
    def delete_all(self, request):
        self.get_queryset().delete()
        return Response(status=204)

    # Get user's games as inviter
    # GET /api/users/<pk>/games_as_inviter/
    @action(detail=True, methods=["get"])
    def games_as_inviter(self, request, pk=None):
        user = self.get_object()
        inviter_games = user.games_as_inviter.all()
        serializer = GameSerializer(inviter_games, many=True)
        return Response(serializer.data)

    # Get user's games as invitee
    # GET /api/users/<pk>/games_as_invitee/
    @action(detail=True, methods=["get"])
    def games_as_invitee(self, request, pk=None):
        user = self.get_object()
        invitee_games = user.games_as_invitee.all()
        serializer = GameSerializer(invitee_games, many=True)
        return Response(serializer.data)


class MeViewSet(RetrieveUpdateAPIView):
    serializer_class = MeDataSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class FriendRequestViewSet(viewsets.ModelViewSet):
    # queryset = FriendRequest.objects.all()
    # serializer_class = FriendRequestSerializer

    @csrf_exempt
    def friend_request_me(request):
        authorization_header = request.headers.get("Authorization", "").split()
        jwt = authorization_header[1]
        access_token = AccessToken(jwt)
        user_id = access_token["user_id"]
        # user_id = get_user_id(request)

        if request.method == "GET":
            # Just getting the one we related to
            my_friend_requests = FriendRequest.objects.filter(
                Q(to_user=user_id) | Q(from_user=user_id)
            ).select_related()
            serializer = FriendRequestSerializer(my_friend_requests, many=True)
            return JsonResponse(serializer.data, safe=False)

    # /api/friend_requests/
    @csrf_exempt
    def friend_request_list(request):
        # Get all friend requests
        if request.method == "GET":
            friend_requests = FriendRequest.objects.select_related()
            serializer = FriendRequestSerializer(friend_requests, many=True)
            return JsonResponse(serializer.data, safe=False)

        # Create new friend request
        elif request.method == "POST":
            authorization_header = request.headers.get("Authorization", "").split()
            jwt = authorization_header[1]
            access_token = AccessToken(jwt)
            user_id = access_token["user_id"]

            data = JSONParser().parse(request)
            data["from_user"] = user_id

            serializer = FriendRequestDataSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return JsonResponse(serializer.data, status=201)
            return JsonResponse(serializer.errors, status=400)

    @csrf_exempt
    def friend_request_detail(request, pk):
        """
        Retrieve, update or delete a code Friend Request.
        """
        try:
            friend_request = FriendRequest.objects.get(pk=pk)
        except friend_request.DoesNotExist:
            return HttpResponse(status=404)

        if request.method == "GET":
            serializer = FriendRequestSerializer(friend_request)
            return JsonResponse(serializer.data)

        elif request.method == "PUT":
            serializer = FriendRequestDataSerializer(friend_request)

            data = JSONParser().parse(request)
            intent = data["intent"]

            if intent == "confirm":
                print(intent)

                # Add logic to confirm the friend request
                from_user = friend_request.from_user
                to_user = friend_request.to_user

                # Perform actions to confirm the friend request
                # e.g., add users to each other's friends list
                from_user.friends.add(to_user)
                to_user.friends.add(from_user)

                # Delete the friend request
                friend_request.delete()
                return HttpResponse(status=200)
            else:
                return HttpResponse(status=400, content="Invalid intent")

        elif request.method == "DELETE":
            friend_request.delete()
            return HttpResponse(status=204)

@api_view(['POST'])
def custom_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        user.is_online = True
        user.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Logged in successfully'
        })

    return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def custom_logout(request):
    print("Logout request received") 
    print(f"Request method: {request.method}")
    print(f"Request user: {request.user}")
    if request.user.is_authenticated:
        try:
            request.user.is_online = False
            request.user.save()
            logout(request)
            print("Logout successful")
            return Response({'message': 'Logged out successfully'})
        except Exception as e:
            print(f"Error during logout: {str(e)}")
            return Response({'error': 'Error logging out'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        print("User not authenticated")
        return Response({'error': 'Not logged in'}, status=status.HTTP_400_BAD_REQUEST)

#@api_view(['GET'])
#def check_user_status(request, username):
#    user = get_object_or_404(CustomUser, username=username)
#    return Response({'isOnline': user.is_online})

@api_view(['GET'])
def check_user_status(request, username):
    print(f"Checking status for user: {username}")  # Add logging  
    try:
        user = CustomUser.objects.get(username=username)
        print(f"User {username} found with online status: {user.is_online}")
        return Response({'isOnline': user.is_online})
    except CustomUser.DoesNotExist:
        print(f"User {username} does not exist")  # Log if user does not exist
        return Response({'error': 'User not found'}, status=404)
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")
        return Response({'error': 'An unexpected error occurred'}, status=500)
