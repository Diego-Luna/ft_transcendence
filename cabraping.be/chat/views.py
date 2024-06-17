from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from django.db.models import Count  # Asegúrate de tener esta línea al inicio de tu archivo

from .models import Channel

from .serializers import ChannelSerializer, ChannelCreateSerializer


class ChannelListView(ListAPIView):
    queryset = Channel.objects.all()
    serializer_class = ChannelSerializer

class ChannelCreateView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = ChannelCreateSerializer(data=request.data)
        if serializer.is_valid():
            members = serializer.validated_data.get('members')  # Esto debería ser una lista de instancias de CustomUser
            
            if len(members) == 1:
                return Response({"error": "You need to select a person."}, status=status.HTTP_201_CREATED)

            # Paso 1: Encuentra canales que tengan alguno de los miembros dados
            potential_duplicate_channels = Channel.objects.filter(members__in=members).distinct()

            # Paso 2: Verifica si algún canal tiene exactamente los mismos miembros
            for channel in potential_duplicate_channels:
                # Obtiene los IDs de los miembros del canal y los compara con los IDs dados
                channel_member_ids = set(channel.members.values_list('id', flat=True))
                given_member_ids = set(member.id for member in members)

                if channel_member_ids == given_member_ids:
                    # Encontramos un canal duplicado
                    return Response({"error": "A channel with the exact same members already exists."}, status=status.HTTP_201_CREATED)

            # Si no se encuentra un canal duplicado, procede a crear el nuevo canal
            channel = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_201_CREATED)


class UserChannelsView(ListAPIView):
    serializer_class = ChannelSerializer

    def get_queryset(self):
        """
        This view should return a list of all channels
        for the user as determined by the userID portion of the URL.
        """
        user_id = self.kwargs['user_id']
        return Channel.objects.filter(members__id=user_id)