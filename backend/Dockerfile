FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x scripts/docker-entrypoint.sh

ENTRYPOINT ["scripts/docker-entrypoint.sh"]
