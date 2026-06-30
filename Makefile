SHELL := /bin/bash
COMPOSE := docker compose -f docker-compose.yml -f docker-compose.dev.yml
API_DIR := apps/api
GO_FILES := $(shell find $(API_DIR) -name '*.go' -not -path '*/vendor/*')

.PHONY: setup install install-deps install-go up down dev \
	generate-types generate-api-docs check-api-docs check-types format-check fmt lint build test ci wait-api

setup: install-deps up wait-api

install: install-deps install-go

install-deps:
	corepack enable
	pnpm install

install-go:
	cd $(API_DIR) && go mod download

up:
	$(COMPOSE) up -d --build --remove-orphans

down:
	$(COMPOSE) down --remove-orphans

dev: up wait-api
	@echo "App: http://localhost:$${WEB_PORT:-5173}"

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

lint: install-deps
	@if command -v golangci-lint >/dev/null 2>&1; then cd $(API_DIR) && golangci-lint run ./...; else echo "golangci-lint not installed, running go vet"; cd $(API_DIR) && go vet ./...; fi
	pnpm --filter web lint

build: install-deps install-go
	cd $(API_DIR) && go build -o /dev/null ./cmd/server
	$(MAKE) generate-api-docs
	pnpm --filter web build

test: install-deps install-go
	cd $(API_DIR) && go test ./...
	pnpm --filter web test

ci: install check-types check-api-docs format-check lint build test
