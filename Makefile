SHELL := /bin/bash
COMPOSE := docker compose --env-file compose.env
API_DIR := apps/api
GO_FILES := $(shell find $(API_DIR) -name '*.go' -not -path '*/vendor/*')

.PHONY: setup install install-deps install-go install-hooks env up down dev reviewer \
	generate-types generate-api-docs check-api-docs check-types format-check fmt lint build test ci compose-build compose-up dokploy-env wait-api

setup: install env up wait-api generate-types generate-api-docs
	@echo "Setup complete. Run: make dev"

install: install-deps install-go install-hooks generate-types generate-api-docs

install-deps:
	corepack enable
	pnpm install

install-go:
	cd $(API_DIR) && go mod download

install-hooks:
	pnpm prepare

env:
	cp -n compose.env.example compose.env || true

up:
	$(COMPOSE) up -d --remove-orphans postgres
	$(COMPOSE) up -d --build --remove-orphans api

down:
	$(COMPOSE) down --remove-orphans

compose-build:
	$(COMPOSE) build

compose-up:
	$(COMPOSE) up -d --build --remove-orphans

reviewer: compose-up
	@echo ""
	@echo "Reviewer quick start"
	@echo "===================="
	@echo "App:        http://localhost:$${APP_PORT:-9999}"
	@echo "Playground: http://localhost:$${APP_PORT:-9999}/playground"
	@echo "API:        http://localhost:$${API_PORT:-9787}"
	@echo "API docs:   http://localhost:$${APP_PORT:-9999}/api-docs/"
	@echo ""
	@echo "1. Open Playground → load a template"
	@echo "2. Edit in UI or JSON mode, preview live"
	@echo "3. Publish → fill the form → View history on the form list"
	@echo ""
	@echo "Live demo:  https://form-builder-app-lmqi0t-feee02-51-81-223-183.traefik.me/playground"

dev: up wait-api
	pnpm dev

wait-api:
	@echo "Waiting for API health..."
	@for i in {1..30}; do \
		if curl -sf http://localhost:$${API_PORT:-9787}/health >/dev/null; then \
			echo "API is ready"; \
			exit 0; \
		fi; \
		sleep 1; \
	done; \
	echo "API did not become healthy in time"; \
	exit 1

generate-types:
	@if command -v typeshare >/dev/null 2>&1; then \
		typeshare . ; \
	else \
		echo "typeshare not installed; using committed apps/web/src/generated/api-types.ts"; \
	fi

generate-api-docs:
	pnpm generate-api-docs

check-api-docs:
	pnpm generate-api-docs
	git diff --exit-code docs/api/index.html apps/web/public/api-docs/index.html

check-types:
	@if [ -n "$$CI" ] && ! command -v typeshare >/dev/null 2>&1; then \
		echo "typeshare is required in CI"; \
		exit 1; \
	fi
	@if command -v typeshare >/dev/null 2>&1; then \
		typeshare . ; \
		git diff --exit-code apps/web/src/generated/api-types.ts; \
	else \
		echo "typeshare not installed, skipping drift check"; \
	fi

format-check:
	@test -z "$$(gofmt -l $(GO_FILES))"
	pnpm --filter web format:check

fmt:
	gofmt -w $(GO_FILES)
	@if command -v goimports >/dev/null 2>&1; then goimports -w $(GO_FILES); fi
	pnpm --filter web format:write
	pnpm --filter web lint:fix

lint:
	@if command -v golangci-lint >/dev/null 2>&1; then cd $(API_DIR) && golangci-lint run ./...; else echo "golangci-lint not installed, running go vet"; cd $(API_DIR) && go vet ./...; fi
	pnpm --filter web lint

build:
	cd $(API_DIR) && go build -o /dev/null ./cmd/server
	$(MAKE) generate-api-docs
	pnpm --filter web build

test:
	cd $(API_DIR) && go test ./...
	pnpm --filter web test

ci: check-types check-api-docs format-check lint build test

dokploy-env:
	@cat compose.env.example
	@echo ""
	@echo "Copy these variables into your Dokploy Compose service environment panel."
