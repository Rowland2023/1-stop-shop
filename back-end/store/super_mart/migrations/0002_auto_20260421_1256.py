from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('super_mart', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
    ]