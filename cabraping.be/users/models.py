import uuid

from django.db import models
from django.contrib.auth.models import AbstractUser

# from django.utils.translation import ugettext_lazy as _
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone
# from chat.models import Channel

# class User(AbstractUser):
class CustomUser(AbstractUser):
    ftId = models.CharField(max_length=100, blank=True, null=True)
    nickname = models.CharField(max_length=100, blank=True)
    firstName = models.CharField(_("first name"), max_length=150, blank=True)
    lastName = models.CharField(_("last name"), max_length=150, blank=True)
    avatarImageURL = models.URLField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(_("email address"), unique=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    friends = models.ManyToManyField("self", symmetrical=True, blank=True)
    has_chevre_verte_award = models.BooleanField(default=False)
    trophies = models.IntegerField(default=0)
    is_online = models.BooleanField(default=False)
    blocked_users = models.ManyToManyField('self', symmetrical=False, related_name='blocked_by', blank=True)
    # game
    # games = models.ManyToManyField('Game', related_name='games')
    # gamesAsInviter = models.ManyToManyField('Game', related_name='invitations_sent')
    # gamesAsInvitee = models.ManyToManyField('Game', related_name='invitations_received')
    # gamesAsWinner = models.ManyToManyField('Game', related_name='won_games')

    def __str__(self):
        return self.username

    def games_as_inviter(self):
        return self.gamesAsInviter.all()

    def games_as_invitee(self):
        return self.gamesAsInvitee.all()


class FriendRequest(models.Model):
    from_user = models.ForeignKey(
        CustomUser, related_name="from_user", on_delete=models.CASCADE
    )
    to_user = models.ForeignKey(
        CustomUser, related_name="to_user", on_delete=models.CASCADE
    )

    class Meta:
        # Ensure that there is no duplicate friend request
        # for the same from_user and to_user
        unique_together = ["from_user", "to_user"]
