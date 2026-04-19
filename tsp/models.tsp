import "@typespec/http";
import "@typespec/openapi";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace BookingService;

@doc("Тип события, которым владеет единственный предопределённый владелец календаря.")
model EventType {
  @doc("Идентификатор типа события.")
  @visibility(Lifecycle.Read)
  @format("uuid")
  id: string;

  @doc("Краткое название типа события, показывается гостю.")
  @minLength(1)
  @maxLength(120)
  name: string;

  @doc("Подробное описание — опционально.")
  @maxLength(1000)
  description?: string;

  @doc("""
    Длительность события в минутах. Одновременно определяет шаг сетки слотов:
    свободные слоты генерируются каждые durationMinutes минут в рабочих часах владельца.
    Должна быть кратна 5 — проверяется сервером на запись (ограничение не выражено в схеме JSON Schema).
    """)
  @minValue(5)
  @maxValue(480)
  durationMinutes: int32;
}

@doc("Тело запроса на создание типа события.")
model EventTypeCreate {
  ...OmitProperties<EventType, "id">;
}

@doc("Тело запроса на частичное обновление типа события. Все поля опциональны.")
model EventTypeUpdate is OptionalProperties<OmitProperties<EventType, "id">>;

@doc("Свободный слот: интервал времени, на который гость может записаться.")
model Slot {
  @doc("Начало слота (UTC). Кратно durationMinutes относительно начала рабочего дня владельца.")
  start: utcDateTime;

  @doc("Конец слота (UTC). Равен start + durationMinutes типа события.")
  end: utcDateTime;
}

@doc("Тело запроса на создание бронирования гостем.")
model BookingCreate {
  @doc("Идентификатор выбранного гостем типа события.")
  @format("uuid")
  eventTypeId: string;

  @doc("""
    Начало бронирования (UTC). Должно совпадать со start одного из свободных слотов,
    возвращённых GET /event-types/{id}/slots на момент запроса.
    """)
  start: utcDateTime;

  @doc("Имя гостя.")
  @minLength(1)
  @maxLength(120)
  guestName: string;

  @doc("Email гостя — используется для подтверждения встречи.")
  @format("email")
  @maxLength(320)
  guestEmail: string;

  @doc("Опциональная заметка от гостя (повестка, пожелания).")
  @minLength(1)
  @maxLength(1000)
  notes?: string;
}

@doc("Созданное бронирование.")
model Booking {
  @doc("Идентификатор бронирования.")
  @visibility(Lifecycle.Read)
  @format("uuid")
  id: string;

  @doc("Идентификатор типа события, к которому относится бронирование.")
  @format("uuid")
  eventTypeId: string;

  @doc("Название типа события, денормализовано для удобного отображения в админском списке.")
  eventTypeName: string;

  @doc("Начало бронирования (UTC).")
  start: utcDateTime;

  @doc("Конец бронирования (UTC). Равен start + durationMinutes типа события.")
  end: utcDateTime;

  @doc("Имя гостя.")
  guestName: string;

  @doc("Email гостя.")
  @format("email")
  guestEmail: string;

  @doc("Заметка от гостя, если была предоставлена.")
  @minLength(1)
  @maxLength(1000)
  notes?: string;

  @doc("Момент создания бронирования (UTC).")
  @visibility(Lifecycle.Read)
  createdAt: utcDateTime;
}
