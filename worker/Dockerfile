FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Default: run a worker. The beat service overrides the command (see compose).
CMD ["celery", "-A", "celery_app", "worker", "--loglevel=info", "--concurrency=4"]
