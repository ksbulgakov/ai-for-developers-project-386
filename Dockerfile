# syntax=docker/dockerfile:1.7

# ─── Stage 1: Node — TypeSpec compile + frontend build ──────────────────────
FROM node:22-alpine AS node-builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY frontend/package.json frontend/package-lock.json frontend/.npmrc frontend/
RUN npm ci --prefix frontend

COPY tspconfig.yaml ./
COPY tsp/ tsp/
RUN npm run build

COPY frontend/ frontend/
RUN npm run generate:api --prefix frontend && npm run build --prefix frontend

# ─── Stage 2: Go — codegen + compile с вшитым фронтом ───────────────────────
FROM golang:1.26-alpine AS go-builder
ENV GOTOOLCHAIN=auto
WORKDIR /app

COPY backend/go.mod backend/go.sum backend/
RUN cd backend && go mod download

COPY --from=node-builder /app/tsp-output/ tsp-output/
COPY backend/ backend/

# Перезаписываем стаб реальным фронтом, чтобы его подхватил //go:embed
COPY --from=node-builder /app/frontend/dist/ backend/internal/web/dist/

RUN cd backend && go run github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen \
        -config oapi-codegen.yaml ../tsp-output/openapi.yaml

RUN cd backend && CGO_ENABLED=0 GOOS=linux \
        go build -ldflags="-s -w" -o /server ./cmd/server

# ─── Stage 3: Runtime — distroless static, non-root, один бинарь ────────────
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=go-builder /server /server
ENV GIN_MODE=release
EXPOSE 8080
USER nonroot
ENTRYPOINT ["/server"]
