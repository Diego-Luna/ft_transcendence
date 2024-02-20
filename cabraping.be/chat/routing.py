# chat/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_name>[0-9a-fA-F\-]+)/$', consumers.MyWebSocketConsumerChat.as_asgi()),
]
# websocket_urlpatterns = [
#     re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.MyWebSocketConsumerChat.as_asgi()),
# ]


# old
# websocket_urlpatterns = [
#     re_path(r'ws/chat/$', consumers.MyWebSocketConsumerChat.as_asgi()),
# ]
