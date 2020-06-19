# Generated by Django 3.0.5 on 2020-04-22 18:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='role',
            field=models.CharField(blank=True, choices=[('0', '일반 유저'), ('10', '관리자')], max_length=2),
        ),
        migrations.AlterField(
            model_name='profile',
            name='status',
            field=models.CharField(blank=True, choices=[('0', '가입대기'), ('1', '가입활성화'), ('8', '블랙리스트'), ('9', '탈퇴')], max_length=2),
        ),
    ]