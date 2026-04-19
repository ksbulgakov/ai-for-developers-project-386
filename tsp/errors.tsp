import "@typespec/http";

using TypeSpec.Http;

namespace BookingService;

@doc("Представление ошибки в формате RFC 7807 Problem Details.")
@error
model Problem {
  @doc("URI-идентификатор типа ошибки (необязательный).")
  type?: string;

  @doc("Краткое человекочитаемое название проблемы.")
  title: string;

  @doc("HTTP-статус ответа, продублированный в теле.")
  status: int32;

  @doc("Подробное описание конкретного случая ошибки.")
  detail?: string;

  @doc("Стабильный machine-readable код ошибки, пригодный для ветвления клиентом.")
  code?: string;
}

@doc("Ресурс не найден: отсутствует тип события или бронирование с указанным id.")
model NotFoundError is Problem {
  @statusCode statusCode: 404;
}

@doc("Некорректный запрос: нарушен формат email, длительность вне допустимого диапазона и т.п.")
model BadRequestError is Problem {
  @statusCode statusCode: 400;
}

@doc("""
  Конфликт: запрошенный слот уже занят другим бронированием.
  Правило уникальности времени действует по всем типам событий одновременно.
  """)
model ConflictError is Problem {
  @statusCode statusCode: 409;
}

@doc("""
  Запрос валиден синтаксически, но нарушает бизнес-инварианты:
  start лежит вне окна 14 дней или не совпадает ни с одним слотом сетки.
  """)
model UnprocessableError is Problem {
  @statusCode statusCode: 422;
}
