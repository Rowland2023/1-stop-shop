import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('super_mart', '0024_manual_merge'),
    ]

    operations = [
        migrations.CreateModel(
            name='Advertisement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('image', models.ImageField(upload_to='ads/')),
                ('link_url', models.URLField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.RemoveField(
            model_name='attendance',
            name='check_in',
        ),
        migrations.RemoveField(
            model_name='attendance',
            name='check_out',
        ),
        migrations.RemoveField(
            model_name='performancereview',
            name='reviewer',
        ),
        migrations.AddField(
            model_name='product',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='product',
            name='image_display',
            field=models.ImageField(blank=True, null=True, upload_to='products/main/'),
        ),
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.CharField(choices=[('Pending', 'Pending'), ('Processing', 'Processing'), ('Shipped', 'Shipped'), ('Delivered', 'Delivered')], default='Pending', max_length=20),
        ),
    ]