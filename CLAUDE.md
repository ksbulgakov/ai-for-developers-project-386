# CLAUDE.md

Этот файл содержит инструкции для Claude Code (claude.ai/code) при работе с кодом в этом репозитории.

## Обзор проекта

Учебный проект Hexlet (скаффолд для курса). В репозитории две части:

1. **Контракт API в TypeSpec** — `tsp/`, единственный источник правды для API.
2. **React-фронтенд** — `frontend/` (Vite + TS + React 19 + React Router v7 + Mantine v9 с `@mantine/dates` + `dayjs`).

Домен: упрощённый сервис бронирования времени (по мотивам Cal.com) с одним заранее заданным владельцем календаря и безымянными гостями.

## Архитектура

### TypeSpec → OpenAPI → сгенерированный клиент

```
tsp/*.tsp  ──tsp compile──▶  tsp-output/openapi.yaml  ──openapi-typescript──▶  frontend/src/api/schema.d.ts
                                        │
                                        └─── Prism mock (:4010)
```

- `tsp/main.tsp` собирает вместе `models.tsp` (доменные модели), `errors.tsp` (ошибки в формате RFC 7807 Problem Details), `admin.tsp` (`/api/v1/admin/*`), `public.tsp` (`/api/v1/*`).
- `tsp-output/openapi.yaml` генерируется и не коммитится. Регенерировать после любой правки `.tsp`.
- Фронтенд использует сгенерированные типы через `openapi-fetch` — **нельзя писать API-клиент руками или дублировать доменные типы**. Использовать `EventType`, `EventTypeCreate` и прочие из `frontend/src/api/client.ts`, где они реэкспортятся из сгенерированной схемы.
- После правок TypeSpec: `make build-tsp && make generate-api` — иначе типы на фронте устареют.

### Mock API

Prism отдаёт OpenAPI-спеку как mock на `http://127.0.0.1:4010`. Vite dev проксирует туда `/api/*` (`frontend/vite.config.ts:8-13`), поэтому фронтенд вызывает `/api/v1/admin/event-types` и прозрачно попадает в Prism. Prism запускается с `--dynamic`, чтобы ответы варьировались на каждый запрос; при этом он **stateless** — POST и DELETE не сохраняют состояние, это надо учитывать при ручной проверке UI.

### Ошибки API

Бэкенд отвечает в формате RFC 7807 Problem Details — общая схема `Problem` в `tsp/errors.tsp` с полями `title`, `status`, `detail`, `code`. Производные модели: `NotFoundError` (404), `BadRequestError` (400), `ConflictError` (409, слот уже занят — уникальность времени действует по всем типам событий), `UnprocessableError` (422, выход за 14-дневное окно или промах мимо сетки слотов). На фронте это уже обрабатывается в `ChooseSlot.tsx`; новые страницы должны единообразно читать `error.title` / `error.detail` вместо собственного формата ошибок.

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
| `make clean` | Удаляет `tsp-output/` и `frontend/dist/` |

Типичный цикл разработки: `make install` → `make build-tsp` → `make generate-api` → `make start`.

Отдельного таргета для тестов нет — Hexlet CI (`.github/workflows/hexlet-check.yml`) запускает свою проверку через `hexlet/project-action`.

## Ограничения

- **Не удаляй, не редактируй и не переименовывай** `.github/workflows/hexlet-check.yml` — этого требует платформа Hexlet. Репозиторий нельзя переименовывать, CI привязан к его имени. Секрет `HEXLET_ID` сконфигурирован в настройках репозитория.
- `frontend/.npmrc` задаёт `legacy-peer-deps=true`. Это обязательно: `openapi-typescript@7.x` peer-депендит на `typescript@^5.x`, а фронтенд использует `typescript ~6.0.2`. Не удаляй файл — иначе установка зависимостей упадёт.
- На фронтенде только Mantine v9 — иконочной библиотеки нет. Использовать текстовый «×» вместо того, чтобы тянуть `@tabler/icons-react`, если иконки не входят в задачу явно.
- Валидация на фронте должна зеркалить ограничения TypeSpec из `tsp/models.tsp` (например, `durationMinutes`: 5–480, кратно 5). TypeSpec — источник правды; формы на фронте дублируют правила ради UX.
- Локаль дат задана глобально в `main.tsx`: `dayjs.locale('ru')` + `DatesProvider` с `locale: 'ru'`, `firstDayOfWeek: 1` (неделя с понедельника), `consistentWeeks: true`. Не переопределять локаль и первый день недели на уровне компонентов — иначе расходится оформление и логика формирования дат в бронировании.

## Роутинг

Провайдеры в `frontend/src/main.tsx` (снаружи внутрь): `BrowserRouter` → `MantineProvider defaultColorScheme="dark"` → `DatesProvider` → `ModalsProvider`. Тёмная тема и русская локаль календаря — глобальные решения.

Маршруты в `frontend/src/App.tsx` делят приложение на два потока:

- **Админ-поток** (владелец календаря): `/event-types` — список и создание типов событий (`EvntTypesList.tsx` + модалка `EventTypeForm.tsx`).
- **Публичный поток** (гость бронирует встречу): `/choose-event-type` → `/event-types/:id/calendar` (`ChooseEventType.tsx` → `ChooseSlot.tsx`). В `ChooseSlot` живёт календарь и форма бронирования.
- `/` редиректит на `/event-types`.
