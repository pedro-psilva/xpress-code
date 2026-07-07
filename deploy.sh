#!/usr/bin/env bash
set -euo pipefail

# Deploy do backend Xpress Code na VM OCI.
# Uso: ./deploy.sh   (rodar como usuario ubuntu, com sudo disponivel)
# Faz: git pull -> rebuild imagem Docker -> recria container -> health check
#      com rollback automatico para a imagem :prev se o health falhar.

cd /home/ubuntu/xpress-code

IMAGE=xpress-code-api
NAME=xpress-code-api
ENV_FILE=/home/ubuntu/deploy.env
PORT_BIND=127.0.0.1:8000:8000

# Env vars da aplicacao (nao inclui as da imagem base: PATH/LANG/PYTHON_* etc).
APP_ENV_KEYS='^(INFINITEPAY_WEBHOOK_TOKEN|INFINITEPAY_HANDLE|INFINITEPAY_REDIRECT_URL|META_WEBHOOK_VERIFY_TOKEN|META_GRAPH_API_VERSION|META_PHONE_NUMBER_ID|META_ACCESS_TOKEN|META_APP_SECRET|PUBLIC_API_URL|ENVIRONMENT|MONGO_URI|MONGO_DB_NAME|JWT_SECRET|JWT_EXPIRE_MINUTES|CORS_ORIGINS|API_V1_PREFIX|BREVO_API_KEY|BREVO_SENDER_EMAIL|BREVO_SENDER_NAME)='

trap 'sudo rm -f "$ENV_FILE"' EXIT

run_container() {
  local tag="$1"
  sudo docker stop "$NAME" >/dev/null 2>&1 || true
  sudo docker rm "$NAME" >/dev/null 2>&1 || true
  sudo docker run -d --name "$NAME" --restart unless-stopped \
    -p "$PORT_BIND" --env-file "$ENV_FILE" "$IMAGE:$tag" >/dev/null
}

echo ">> git pull"
git pull --ff-only origin main
git --no-pager log --oneline -1

echo ">> snapshot env vars do container atual -> $ENV_FILE (600)"
sudo docker inspect "$NAME" --format '{{range .Config.Env}}{{println .}}{{end}}' \
  | grep -E "$APP_ENV_KEYS" | sudo tee "$ENV_FILE" >/dev/null
sudo chmod 600 "$ENV_FILE"
echo "   vars: $(sudo cut -d= -f1 "$ENV_FILE" | tr '\n' ' ')"

echo ">> tag rollback :prev"
sudo docker tag "$IMAGE:latest" "$IMAGE:prev" || true

echo ">> build $IMAGE:latest"
sudo docker build -t "$IMAGE:latest" .

echo ">> recria container (nova imagem)"
run_container latest

echo ">> health check"
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/health || true)
  if [ "$code" = "200" ]; then
    echo "   health OK apos ${i}s"
    curl -s -o /dev/null -w "   health_db=%{http_code}\n" http://127.0.0.1:8000/health/db
    echo ">> deploy concluido: $(git rev-parse --short HEAD)"
    exit 0
  fi
  sleep 1
done

echo "!! HEALTH FALHOU — rollback para :prev"
run_container prev
exit 1
