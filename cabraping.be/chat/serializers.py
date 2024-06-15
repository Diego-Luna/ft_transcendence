from rest_framework import serializers
from .models import Channel, CustomUser
from django.contrib.auth import get_user_model



class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'firstName', 'lastName', 'avatarImageURL']
        # fields = ['id', 'username', 'email', 'firstName']

class ChannelSerializer(serializers.ModelSerializer):
    owner = CustomUserSerializer(read_only=True)
    # admins = CustomUserSerializer(read_only=True, many=True)
    members = CustomUserSerializer(read_only=True, many=True)

    class Meta:
        model = Channel
        fields = ['id', 'name', 'owner', 'members', 'status' ]

User = get_user_model()

class ChannelCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Channel
        fields = '__all__'

    def create(self, validated_data):
        # Extracts the channel name and the members of the validated_data
        print("++> en el Serializer");
        # name = validated_data.get('name')
        # members = validated_data.get('members')

        # Checks if a channel with the same name and members already exists
        # if Channel.objects.filter(name=name, members__in=members).exists():
        # if Channel.objects.filter(members__in=members).exists() == False:
        #     raise serializers.ValidationError("A channel with this name and members already exists.")

        print("++> Pasar el if ");
        # If it does not exist, proceed with the creation
        return super().create(validated_data)
