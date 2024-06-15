# urls.py

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet, CurrentUserView, CustomUserBlockViewSet, FriendRequestViewSet, MeViewSet, custom_login, custom_logout, check_user_status, check_user_exists
from game.views import GameViewSet
from tournament.views import TournamentViewSet, ParticipantViewSet, MatchViewSet
from auth42.views import get_config, callback
from django.contrib import admin
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from chat.views import ChannelListView, ChannelCreateView, UserChannelsView
from django.conf.urls import handler404
from cabraping.views import custom_404
from django.conf import settings
from django.conf.urls.static import static
from users.views import UserUpdate, delete_user
from django.views.decorators.csrf import csrf_exempt


router = DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r'users-blocks', CustomUserBlockViewSet, basename='users-blocks')
router.register(r"games", GameViewSet)
router.register(r"tournaments", TournamentViewSet)
router.register(r'participants', ParticipantViewSet)
router.register(r'matches', MatchViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

    #path('api/tournaments/<int:tournament_id>/set_ready/', TournamentViewSet.set_ready, name='set_ready'), # rachel

    path('api/tournaments/<int:pk>/addparticipant/', TournamentViewSet.as_view({'post': 'add_participant'}), name='add_participant'),
    path('api/participants/<int:pk>/update_accepted_invite/', ParticipantViewSet.as_view({'post': 'update_accepted_invite'}), name='update_accepted_invite'),

   # path('api/login/', custom_login, name='custom_login'), # delete all instances
   # path('api/logout/', custom_logout, name='custom_logout'), # rachel
    path("api/me/", MeViewSet.as_view(), name="my-profile"),
    path('api/me-full/', CurrentUserView.as_view(), name='current-user'),
    path('api/user/update/<int:pk>/', UserUpdate.as_view(), name='user-update'),
    #path('api/users/<str:username>/exists/', check_user_exists, name='check_user_exists'), # rachel (and below)
    #path('api/users/<str:username>/status/', check_user_status, name='check_user_status'),
    path('api/participants/status/', ParticipantViewSet.as_view({'get': 'status'}), name='participant-status'),
    path("api/", include(router.urls)),
    path('api/delete/<str:username>/', delete_user, name='delete_user'),
    path('api/channels/', ChannelListView.as_view(), name='channel-list'),
    path('api/channels/create/', ChannelCreateView.as_view(), name='channel-create'),
    path('api/user-channels/<int:user_id>/', UserChannelsView.as_view(), name='user-channels'),
    path('api/custom_404/', custom_404, name='custom_404'),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/friend_requests/me", FriendRequestViewSet.friend_request_me),
    path("api/friend_requests/", FriendRequestViewSet.friend_request_list),
    path("api/friend_requests/<int:pk>/", FriendRequestViewSet.friend_request_detail),
    path("api/auth42/config", get_config),

    path("api/callback/", callback),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler404 = 'cabraping.views.custom_404'
