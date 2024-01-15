# Generated by Django 4.1 on 2024-01-15 02:03

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Channel',
            fields=[
                ('id', models.CharField(default=uuid.uuid4, editable=False, max_length=255, primary_key=True, serialize=False)),
                ('ownerId', models.CharField(max_length=255)),
                ('status', models.CharField(max_length=255)),
                ('hash', models.CharField(blank=True, max_length=255, null=True)),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                ('password', models.CharField(blank=True, max_length=255, null=True)),
                ('admins', models.ManyToManyField(related_name='administered_channels', to=settings.AUTH_USER_MODEL)),
                ('members', models.ManyToManyField(related_name='channels', to=settings.AUTH_USER_MODEL)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='owned_channels', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
