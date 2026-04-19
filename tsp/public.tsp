import "@typespec/http";
import "@typespec/openapi";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace BookingService;

@route("/api/v1")
@tag("Public")
namespace Public {
  @route("/event-types")
  namespace EventTypes {
    @operationId("listEventTypes")
    @summary("Публичный список типов событий")
    @doc("Публичный список типов событий, доступных гостю для записи.")
    @get
    op list(): EventType[];

    @operationId("getEventType")
    @summary("Детали типа события")
    @doc("Детали типа события: название, описание, длительность.")
    @get
    op read(@path id: string): EventType | NotFoundError;

    @operationId("listSlots")
    @summary("Свободные слоты")
    @doc("""
      Свободные слоты для выбранного типа события в окне ближайших 14 дней.

      Шаг сетки равен durationMinutes типа события; возвращаются только незанятые
      интервалы с учётом всех бронирований по всем типам событий. Параметры from/to
      позволяют сузить диапазон, но должны укладываться в окно [now, now + 14 дней].
      """)
    @route("/{id}/slots")
    @get
    op listSlots(
      @path id: string,

      @doc("Начало диапазона (UTC). По умолчанию — текущий момент.")
      @query
      from?: utcDateTime,

      @doc("Конец диапазона (UTC). По умолчанию — now + 14 дней.")
      @query
      to?: utcDateTime,
    ): Slot[] | NotFoundError | BadRequestError;
  }

  @route("/bookings")
  namespace Bookings {
    @operationId("createBooking")
    @summary("Создать бронирование")
    @doc("""
      Создать бронирование на указанный слот.

      Сервер проверяет, что start попадает в сетку слотов типа события, лежит в окне
      ближайших 14 дней и что интервал [start, start + durationMinutes) не пересекается
      ни с одним существующим бронированием (по любому типу события).

      Несуществующий eventTypeId в теле запроса трактуется как бизнес-ошибка
      и возвращается как 422 с code="event_type_not_found", а не как 404.
      """)
    @post
    op create(@body body: BookingCreate): {
      @statusCode statusCode: 201;
      @body body: Booking;
    } | ConflictError | UnprocessableError | BadRequestError;
  }
}
