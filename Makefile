.PHONY: run-all run-backend

.ONESHELL:
SHELL := /bin/sh

run-all:
	@if [ ! -d frontend/node_modules ]; then npm --prefix frontend install; fi
	@(cd frontend && npm run dev -- --host 0.0.0.0) &
	frontend_pid=$$!
	trap 'kill "$$frontend_pid" 2>/dev/null || true' EXIT INT TERM
	docker compose up --build

run-backend:
	docker compose up --build