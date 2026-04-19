import "@typespec/http";
import "@typespec/openapi";
import "./models.tsp";
import "./errors.tsp";
import "./admin.tsp";
import "./public.tsp";

using TypeSpec.Http;

@service(#{ title: "Booking Service" })
@server("http://localhost:3000", "Local development")
@doc("""
  Упрощённый сервис бронирования времени (по мотивам Cal.com).

  Домен: один заранее заданный владелец календаря и безымянные гости.
  Регистрации и авторизации нет — admin- и public-эндпоинты публично доступны.
  Гость выбирает свободный слот в окне ближайших 14 дней; на одно и то же время
  нельзя создать два бронирования, даже если они относятся к разным типам событий.
  Все поля времени передаются в UTC; таймзона владельца считается фиксированной
  вне API.
  """)
namespace BookingService;
