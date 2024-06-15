from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import FriendRequest
from .models import CustomUser
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError


User = get_user_model()

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'avatarImageURL', 'friends')

class BlockUserSerializer(serializers.Serializer):
    blocked_user_id = serializers.IntegerField()

    def validate_blocked_user_id(self, value):
        from .models import CustomUser

        try:
            CustomUser.objects.get(id=value)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("El usuario bloqueado no existe.")
        
        return value

class UserSerializerUpdate(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "username", "first_name", "last_name", "nick_name", "avatarImageURL"]

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "username", "email", "password", "nickname", "first_name", "last_name", "avatarImageURL"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate_avatarImageURL(self, value):
        validator = URLValidator()
        try:
            validator(value)
        except ValidationError:
            raise serializers.ValidationError("Invalid URL format")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "friends", "avatarImageURL", "first_name", "last_name"]
# class UserDataSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ["id", "username", "email", "friends"]


class MeDataSerializer(serializers.ModelSerializer):
    friends = UserDataSerializer(many=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "friends", "nickname", "first_name", "last_name", "avatarImageURL"]
        # fields = ["id", "username", "avatarImageURL", "nickname", "first_name", "last_name", "avatarImageURL"]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["friends"] = UserDataSerializer(instance.friends, many=True).data
        return representation


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = UserSerializer()
    to_user = UserSerializer()

    class Meta:
        model = FriendRequest
        fields = ["id", "from_user", "to_user"]


class FriendRequestDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendRequest
        fields = ["id", "from_user", "to_user"]
