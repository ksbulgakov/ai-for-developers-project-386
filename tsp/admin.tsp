import "@typespec/http";
import "@typespec/openapi";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace BookingService;

@route("/api/v1/admin")
@tag("Admin")
namespace Admin {
  @route("/event-types")
  namespace EventTypes {
    @operationId("adminListEventTypes")
    @summary("Список типов событий")
    @doc("Получить все типы событий, созданные владельцем.")
    @get
    op list(): EventType[];

    @operationId("adminCreateEventType")
    @summary("Создать тип события")
    @doc("Создать новый тип события.")
    @post
    op create(@body body: EventTypeCreate): {
      @statusCode statusCode: 201;
      @body body: EventType;
    } | BadRequestError;

    @operationId("adminGetEventType")
    @summary("Получить тип события")
    @doc("Получить тип события по идентификатору.")
    @get
    op read(@path id: string): EventType | NotFoundError;

    @operationId("adminUpdateEventType")
    @summary("Обновить тип события")
    @doc("Обновить произвольное подмножество полей типа события.")
    @patch(#{ implicitOptionality: false })
    op update(@path id: string, @body body: EventTypeUpdate):
      | EventType
      | NotFoundError
      | BadRequestError;

    @operationId("adminDeleteEventType")
    @summary("Удалить тип события")
    @doc("Удалить тип события. Существующие бронирования на этот тип события не удаляются.")
    @delete
    op remove(@path id: string): NoContentResponse | NotFoundError;
  }

  @route("/bookings")
  namespace Bookings {
    @operationId("adminListBookings")
    @summary("Список предстоящих бронирований")
    @doc("""
      Список предстоящих бронирований всех типов событий, отсортированный по start по возрастанию.
      По умолчанию возвращаются бронирования от текущего момента и далее.
      Если переданы оба параметра, требуется from <= to — иначе возвращается 400.
      """)
    @get
    op list(
      @doc("Нижняя граница выборки (UTC). По умолчанию — текущий момент.")
      @query
      from?: utcDateTime,

      @doc("Верхняя граница выборки (UTC). По умолчанию — без верхней границы.")
      @query
      to?: utcDateTime,
    ): Booking[] | BadRequestError;

    @operationId("adminDeleteBooking")
    @summary("Удалить бронирование")
    @doc("Удалить бронирование по идентификатору.")
    @delete
    op remove(@path id: string): NoContentResponse | NotFoundError;
  }
}
