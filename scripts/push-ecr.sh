#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   AWS_PROFILE=my-profile ./push-backend-ecr.sh
#   ./push-backend-ecr.sh --profile my-profile
#   ./push-backend-ecr.sh --profile my-profile --tag v1.0.0

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_PROFILE="${AWS_PROFILE:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
ECR_REPOSITORY="${ECR_REPOSITORY:-security-guardian-backend}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      AWS_PROFILE="$2"
      shift 2
      ;;
    --region)
      AWS_REGION="$2"
      shift 2
      ;;
    --tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# AWS CLI args when profile is set
AWS_ARGS=()
if [[ -n "$AWS_PROFILE" ]]; then
  AWS_ARGS=(--profile "$AWS_PROFILE")
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/security-guardian"
DOCKERFILE="$PROJECT_ROOT/devops/docker/backend/Dockerfile"

echo "Using AWS profile: ${AWS_PROFILE:-default}"
echo "Region: $AWS_REGION"

AWS_ACCOUNT_ID="$(aws "${AWS_ARGS[@]}" sts get-caller-identity --query Account --output text)"
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}"

echo "Account: $AWS_ACCOUNT_ID"
echo "ECR URI: $ECR_URI:$IMAGE_TAG"

# Ensure repo exists (creates if missing)
aws "${AWS_ARGS[@]}" ecr describe-repositories \
  --repository-names "$ECR_REPOSITORY" \
  --region "$AWS_REGION" >/dev/null 2>&1 || \
aws "${AWS_ARGS[@]}" ecr create-repository \
  --repository-name "$ECR_REPOSITORY" \
  --region "$AWS_REGION"

# Use an isolated Docker config so login does not depend on credsStore/pass/desktop.
DOCKER_AUTH_DIR="$(mktemp -d)"
trap 'rm -rf "$DOCKER_AUTH_DIR"' EXIT
export DOCKER_CONFIG="$DOCKER_AUTH_DIR"
printf '{}' > "$DOCKER_AUTH_DIR/config.json"

# Temp config has no Docker context; point at Docker Desktop when system socket is unavailable.
if [[ -z "${DOCKER_HOST:-}" ]] && [[ -S "$HOME/.docker/desktop/docker.sock" ]]; then
  export DOCKER_HOST="unix://${HOME}/.docker/desktop/docker.sock"
fi

if ! docker info >/dev/null 2>&1; then
  echo "Cannot connect to Docker." >&2
  echo "Start Docker Desktop, or add your user to the docker group and re-login:" >&2
  echo "  sudo usermod -aG docker \"\$USER\"" >&2
  exit 1
fi

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Login to ECR
aws "${AWS_ARGS[@]}" ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$ECR_REGISTRY"

# Build and push
cd "$BACKEND_DIR"
docker build -f "$DOCKERFILE" -t "${ECR_URI}:${IMAGE_TAG}" .
docker push "${ECR_URI}:${IMAGE_TAG}"

echo "Done: ${ECR_URI}:${IMAGE_TAG}"