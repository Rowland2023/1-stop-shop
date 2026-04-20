from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('super_mart', '0001_initial'), # Ensure this matches your previous migration filename
    ]

    operations = [
        migrations.RemoveField(
            model_name='product',
            name='image_display',
        ),
    ]