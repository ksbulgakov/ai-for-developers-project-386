.PHONY: install install-root install-frontend \
        build build-tsp build-frontend \
        dev lint lint-tsp lint-frontend \
        watch mock preview clean \
        generate-api start \
        backend-deps generate-backend backend start-go \
        test-e2e-install test-e2e test-e2e-ui

install: install-root install-frontend

install-root:
	npm install

install-frontend:
	npm install --prefix frontend

build: build-tsp build-frontend

build-tsp:
	npm run build

build-frontend:
	npm run build --prefix frontend

watch:
	npm run watch

mock:
	npm run mock

dev:
	npm run dev --prefix frontend

generate-api:
	npm run generate:api --prefix frontend

start:
	$(MAKE) -j2 mock dev

preview:
	npm run preview --prefix frontend

lint: lint-tsp lint-frontend

lint-tsp:
	npm run lint

lint-frontend:
	npm run lint --prefix frontend

clean:
	rm -rf tsp-output frontend/dist backend/internal/api/api.gen.go

backend-deps:
	cd backend && go mod download

generate-backend: build-tsp backend-deps
	cd backend && go run github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen -config oapi-codegen.yaml ../tsp-output/openapi.yaml

backend: generate-backend
	cd backend && go run ./cmd/server

start-go:
	VITE_API_TARGET=http://127.0.0.1:8080 $(MAKE) -j2 backend dev

test-e2e-install:
	npx playwright install chromium

test-e2e: generate-backend generate-api test-e2e-install
	npx playwright test

test-e2e-ui: generate-backend generate-api test-e2e-install
	npx playwright test --ui
