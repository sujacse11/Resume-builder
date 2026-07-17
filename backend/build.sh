#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
pip install psycopg2-binary==2.9.9
python manage.py collectstatic --no-input
python manage.py migrate
