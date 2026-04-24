# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Этот файл содержит инструкции для Claude Code (claude.ai/code) при работе с кодом в этом репозитории.

## Обзор проекта

Учебный проект Hexlet (скаффолд для курса). В репозитории три части:

1. **Контракт API в TypeSpec** — `tsp/`, единственный источник правды для API.
2. **React-фронтенд** — `frontend/` (Vite + TS + React 19 + React Router v7 + Mantine v9 с `@mantine/dates` + `dayjs`).
3. **Go-бэкенд** — `backend/` (Gin + `oapi-codegen` strict-server, in-memory storage). Альтернатива Prism-моку; реализует тот же контракт.

Домен: упрощённый сервис бронирования времени (по мотивам Cal.com) с одним заранее заданным владельцем календаря и безымянными гостями.

## Архитектура

### TypeSpec как источник правды

```
tsp/*.tsp  ──tsp compile──▶  tsp-output/openapi.yaml  ──┬── openapi-typescript ──▶  frontend/src/api/schema.d.ts
                                                        ├── Prism mock (:4010)
                                                        └── oapi-codegen ──▶ backend/internal/api/api.gen.go
```

- `tsp/main.tsp` собирает вместе `models.tsp` (доменные модели), `errors.tsp` (ошибки в формате RFC 7807 Problem Details), `admin.tsp` (`/api/v1/admin/*`), `public.tsp` (`/api/v1/*`).
- `tsp-output/openapi.yaml` и `backend/internal/api/api.gen.go` генерируются и не коммитятся (см. `.gitignore`). Регенерировать после любой правки `.tsp`.
- Фронтенд использует сгенерированные типы через `openapi-fetch` — **нельзя писать API-клиент руками или дублировать доменные типы**. Использовать `EventType`, `EventTypeCreate` и прочие из `frontend/src/api/client.ts`, где они реэкспортятся из сгенерированной схемы.
- Бэкенд реализует `api.StrictServerInterface` — **нельзя писать хендлеры в обход сгенерированного интерфейса**. Новые эндпоинты добавляются правкой `.tsp` → регенерацией → реализацией нового метода на `*server.Server`.
- После правок TypeSpec: `make build-tsp && make generate-api` (для фронта) и/или `make generate-backend` (для бэка) — иначе типы/интерфейсы устареют.

### Mock API vs. Go-бэкенд

Фронтенд один и тот же, но может ходить в два разных источника API через переменную `VITE_API_TARGET` (`frontend/vite.config.ts:8-13`):

- **Prism-мок** (`make start`, по умолчанию `http://127.0.0.1:4010`): генерит ответы из OpenAPI-спеки с `--dynamic`. **Stateless** — POST и DELETE не сохраняют состояние, это надо учитывать при ручной проверке UI.
- **Go-бэкенд** (`make start-go`, `VITE_API_TARGET=http://127.0.0.1:8080`): реальная реализация контракта с in-memory стораджем. Состояние живёт до рестарта процесса, поэтому UI-сценарии с созданием/удалением работают полноценно.

### Go-бэкенд: структура

- `backend/cmd/server/main.go` — точка входа. Поднимает Gin на `:8080` (или `$PORT`), регистрирует strict-handlers, обрабатывает graceful shutdown.
- `backend/internal/api/` — сгенерированный код `oapi-codegen` (`api.gen.go`, в git не коммитится). Конфиг — `backend/oapi-codegen.yaml`: `gin-server` + `strict-server` + `embedded-spec`.
- `backend/internal/server/` — реализация `api.StrictServerInterface`. Маппинг доменных ошибок в Problem Details живёт в `problem.go`. Валидация полей — в том же пакете, должна зеркалить ограничения TypeSpec (см. «Ограничения»).
- `backend/internal/storage/` — потокобезопасное in-memory хранилище (`sync.RWMutex`). Уникальность слота по всем типам событий обеспечивает `CreateBookingIfFree` — атомарная проверка пересечения + вставка под одним локом.
- `backend/internal/domain/` — доменные правила, не зависящие от транспорта: генерация сетки слотов (`WorkDayStartUTC=9`, `WorkDayEndUTC=18`, `BookingWindow=14d`), валидация «слот на сетке» и «слот в окне». Эти константы — зеркало правил из `tsp/`; менять их только вместе с TypeSpec и фронтом.
- `backend/tools/tools.go` — tools-паттерн, чтобы `go mod` не выкидывал `oapi-codegen` как неиспользуемую зависимость.

### Ошибки API

Бэкенд отвечает в формате RFC 7807 Problem Details — общая схема `Problem` в `tsp/errors.tsp` с полями `title`, `status`, `detail`, `code`. Производные модели: `NotFoundError` (404), `BadRequestError` (400), `ConflictError` (409, слот уже занят — уникальность времени действует по всем типам событий), `UnprocessableError` (422, выход за 14-дневное окно или промах мимо сетки слотов). На фронте это уже обрабатывается в `ChooseSlot.tsx`; новые страницы должны единообразно читать `error.title` / `error.detail` вместо собственного формата ошибок. На Go-бэкенде все ответы-ошибки идут через `server.problem(...)` (`backend/internal/server/problem.go`), чтобы форма оставалась единой.

## Команды (через Makefile)

Makefile — основная точка входа; отдельные `npm run *` скрипты лежат в корневом `package.json` (инструменты TypeSpec) и в `frontend/package.json` (Vite/React).

| Команда | Что делает |
|---|---|
| `make install` | Устанавливает зависимости корня и фронтенда |
| `make build` | Компилирует TypeSpec + собирает прод-бандл фронтенда |
| `make build-tsp` | Компилирует TypeSpec → `tsp-output/openapi.yaml` |
| `make generate-api` | Регенерирует `frontend/src/api/schema.d.ts` из `tsp-output/openapi.yaml` |
| `make watch` | `tsp compile --watch` |
| `make mock` | Запускает Prism-mock на :4010 (нужен `tsp-output/`) |
| `make dev` | Запускает Vite dev на :5173 |
| `make start` | Параллельно поднимает `mock` и `dev` (`make -j2`) |
| `make lint` | Redocly lint (OpenAPI) + ESLint (фронтенд) |
| `make preview` | Превью собранного бандла фронтенда |
| `make clean` | Удаляет `tsp-output/`, `frontend/dist/`, `backend/internal/api/api.gen.go` |
| `make backend-deps` | `go mod download` для бэкенда |
| `make generate-backend` | `build-tsp` + регенерация `backend/internal/api/api.gen.go` |
| `make backend` | Регенерирует код и поднимает Go-сервер на :8080 |
| `make start-go` | Параллельно поднимает `backend` и `dev` с `VITE_API_TARGET=http://127.0.0.1:8080` |
| `make test-e2e-install` | Ставит Chromium для Playwright |
| `make test-e2e` | Регенерирует код и гоняет Playwright e2e-сьюты |
| `make test-e2e-ui` | То же, но в UI-режиме Playwright |

Типичные циклы разработки:
- с Prism-моком: `make install` → `make build-tsp` → `make generate-api` → `make start`.
- с Go-бэкендом: `make install` → `make backend-deps` → `make generate-backend` → `make generate-api` → `make start-go`.

E2E-тесты (`tests/e2e/*`, Playwright) поднимают настоящий Go-бэкенд через `webServer` в `playwright.config.ts`. Запуск только через `make test-e2e` — прямой `npx playwright test` упадёт без свежесгенерированного `api.gen.go`. Локально используется `reuseExistingServer`, поэтому in-memory состояние живёт между прогонами. Фикстура `api` в `tests/e2e/fixtures.ts` чистит свои event-types/bookings по id, плюс `safetyNet` добивает всё с префиксом `e2e-`; если видите `ConflictError` на слотах — перезапустите бэкенд руками.

Hexlet CI (`.github/workflows/hexlet-check.yml`) запускает свою проверку через `hexlet/project-action`.

## Ограничения

- **Не удаляй, не редактируй и не переименовывай** `.github/workflows/hexlet-check.yml` — этого требует платформа Hexlet. Репозиторий нельзя переименовывать, CI привязан к его имени. Секрет `HEXLET_ID` сконфигурирован в настройках репозитория.
- `frontend/.npmrc` задаёт `legacy-peer-deps=true`. Это обязательно: `openapi-typescript@7.x` peer-депендит на `typescript@^5.x`, а фронтенд использует `typescript ~6.0.2`. Не удаляй файл — иначе установка зависимостей упадёт.
- На фронтенде только Mantine v9 — иконочной библиотеки нет. Использовать текстовый «×» вместо того, чтобы тянуть `@tabler/icons-react`, если иконки не входят в задачу явно.
- Валидация на фронте должна зеркалить ограничения TypeSpec из `tsp/models.tsp` (например, `durationMinutes`: 5–480, кратно 5). TypeSpec — источник правды; формы на фронте дублируют правила ради UX. Те же правила продублированы в `backend/internal/server/server.go` (`validateEventTypeCreateFields`, `validateBookingFields`, …) — при правке TypeSpec проверяй все три места.
- Локаль дат задана глобально в `main.tsx`: `dayjs.locale('ru')` + `DatesProvider` с `locale: 'ru'`, `firstDayOfWeek: 1` (неделя с понедельника), `consistentWeeks: true`. Не переопределять локаль и первый день недели на уровне компонентов — иначе расходится оформление и логика формирования дат в бронировании.
- Все времена на Go-бэкенде хранятся и сравниваются в UTC (`storage`, `domain`, маппинг в API). Рабочий день владельца жёстко зафиксирован 09:00–18:00 UTC (`domain/slots.go`). Если понадобится часовой пояс владельца — это правка контракта в TypeSpec, а не локальный хак в хендлере.

## Роутинг

Провайдеры в `frontend/src/main.tsx` (снаружи внутрь): `BrowserRouter` → `MantineProvider defaultColorScheme="dark"` → `DatesProvider` → `ModalsProvider`. Тёмная тема и русская локаль календаря — глобальные решения.

Маршруты в `frontend/src/App.tsx` делят приложение на два потока:

- **Админ-поток** (владелец календаря): `/event-types` — список и создание типов событий (`EvntTypesList.tsx` + модалка `EventTypeForm.tsx`).
- **Публичный поток** (гость бронирует встречу): `/choose-event-type` → `/event-types/:id/calendar` (`ChooseEventType.tsx` → `ChooseSlot.tsx`). В `ChooseSlot` живёт календарь и форма бронирования.
- `/` редиректит на `/event-types`.
