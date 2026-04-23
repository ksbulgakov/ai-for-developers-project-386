package server

import (
	"context"
	"errors"
	"net/mail"
	"strings"
	"time"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"

	"github.com/konstantin/booking-backend/internal/api"
	"github.com/konstantin/booking-backend/internal/domain"
	"github.com/konstantin/booking-backend/internal/storage"
)

type Server struct {
	store *storage.Store
	now   func() time.Time
}

func New(store *storage.Store, now func() time.Time) *Server {
	if now == nil {
		now = func() time.Time { return time.Now().UTC() }
	}
	return &Server{store: store, now: now}
}

var _ api.StrictServerInterface = (*Server)(nil)

// ===== Admin: event types =====

func (s *Server) AdminListEventTypes(_ context.Context, _ api.AdminListEventTypesRequestObject) (api.AdminListEventTypesResponseObject, error) {
	ets := s.store.ListEventTypes()
	out := make(api.AdminListEventTypes200JSONResponse, 0, len(ets))
	for _, et := range ets {
		out = append(out, eventTypeToAPI(et))
	}
	return out, nil
}

func (s *Server) AdminCreateEventType(_ context.Context, req api.AdminCreateEventTypeRequestObject) (api.AdminCreateEventTypeResponseObject, error) {
	if req.Body == nil {
		return api.AdminCreateEventType400JSONResponse(problem(400, "invalid_request", "Invalid request", "Request body is required")), nil
	}
	name := strings.TrimSpace(req.Body.Name)
	description := trimOptional(req.Body.Description)
	if err := validateEventTypeCreateFields(name, description, req.Body.DurationMinutes); err != nil {
		return api.AdminCreateEventType400JSONResponse(problem(400, "validation_failed", "Validation failed", err.Error())), nil
	}
	created := s.store.CreateEventType(storage.EventType{
		Name:            name,
		Description:     description,
		DurationMinutes: req.Body.DurationMinutes,
	})
	return api.AdminCreateEventType201JSONResponse(eventTypeToAPI(created)), nil
}

func (s *Server) AdminGetEventType(_ context.Context, req api.AdminGetEventTypeRequestObject) (api.AdminGetEventTypeResponseObject, error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return api.AdminGetEventType404JSONResponse(notFoundProblem("Event type not found")), nil
	}
	et, err := s.store.GetEventType(id)
	if errors.Is(err, storage.ErrNotFound) {
		return api.AdminGetEventType404JSONResponse(notFoundProblem("Event type not found")), nil
	}
	return api.AdminGetEventType200JSONResponse(eventTypeToAPI(et)), nil
}

func (s *Server) AdminUpdateEventType(_ context.Context, req api.AdminUpdateEventTypeRequestObject) (api.AdminUpdateEventTypeResponseObject, error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return api.AdminUpdateEventType404JSONResponse(notFoundProblem("Event type not found")), nil
	}
	if req.Body == nil {
		return api.AdminUpdateEventType400JSONResponse(problem(400, "invalid_request", "Invalid request", "Request body is required")), nil
	}
	name := trimOptional(req.Body.Name)
	description := trimOptional(req.Body.Description)
	if err := validateEventTypeUpdateFields(name, description, req.Body.DurationMinutes); err != nil {
		return api.AdminUpdateEventType400JSONResponse(problem(400, "validation_failed", "Validation failed", err.Error())), nil
	}
	updated, err := s.store.UpdateEventType(id, storage.EventTypePatch{
		Name:            name,
		Description:     description,
		DurationMinutes: req.Body.DurationMinutes,
	})
	if errors.Is(err, storage.ErrNotFound) {
		return api.AdminUpdateEventType404JSONResponse(notFoundProblem("Event type not found")), nil
	}
	return api.AdminUpdateEventType200JSONResponse(eventTypeToAPI(updated)), nil
}

func (s *Server) AdminDeleteEventType(_ context.Context, req api.AdminDeleteEventTypeRequestObject) (api.AdminDeleteEventTypeResponseObject, error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return api.AdminDeleteEventType404JSONResponse(notFoundProblem("Event type not found")), nil
	}
	if err := s.store.DeleteEventType(id); errors.Is(err, storage.ErrNotFound) {
		return api.AdminDeleteEventType404JSONResponse(notFoundProblem("Event type not found")), nil
	}
	return api.AdminDeleteEventType204Response{}, nil
}

// ===== Admin: bookings =====

func (s *Server) AdminListBookings(_ context.Context, req api.AdminListBookingsRequestObject) (api.AdminListBookingsResponseObject, error) {
	from := req.Params.From
	to := req.Params.To
	if from != nil && to != nil && from.After(*to) {
		return api.AdminListBookings400JSONResponse(problem(400, "invalid_range", "Invalid range", "Parameter 'from' must be <= 'to'")), nil
	}
	if from == nil {
		now := s.now().UTC()
		from = &now
	}
	bookings := s.store.ListBookings(from, to)
	out := make(api.AdminListBookings200JSONResponse, 0, len(bookings))
	for _, b := range bookings {
		out = append(out, bookingToAPI(b))
	}
	return out, nil
}

func (s *Server) AdminDeleteBooking(_ context.Context, req api.AdminDeleteBookingRequestObject) (api.AdminDeleteBookingResponseObject, error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return api.AdminDeleteBooking404JSONResponse(notFoundProblem("Booking not found")), nil
	}
	if err := s.store.DeleteBooking(id); errors.Is(err, storage.ErrNotFound) {
		return api.AdminDeleteBooking404JSONResponse(notFoundProblem("Booking not found")), nil
	}
	return api.AdminDeleteBooking204Response{}, nil
}

// ===== Public: event types =====

func (s *Server) ListEventTypes(_ context.Context, _ api.ListEventTypesRequestObject) (api.ListEventTypesResponseObject, error) {
	ets := s.store.ListEventTypes()
	out := make(api.ListEventTypes200JSONResponse, 0, len(ets))
	for _, et := range ets {
		out = append(out, eventTypeToAPI(et))
	}
	return out, nil
}

func (s *Server) GetEventType(_ context.Context, req api.GetEventTypeRequestObject) (api.GetEventTypeResponseObject, error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return api.GetEventType404JSONResponse(notFoundProblem("Event type not found")), nil
	}
	et, err := s.store.GetEventType(id)
	if errors.Is(err, storage.ErrNotFound) {
		return api.GetEventType404JSONResponse(notFoundProblem("Event type not found")), nil
	}
	return api.GetEventType200JSONResponse(eventTypeToAPI(et)), nil
}

func (s *Server) ListSlots(_ context.Context, req api.ListSlotsRequestObject) (api.ListSlotsResponseObject, error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return api.ListSlots404JSONResponse(notFoundProblem("Event type not found")), nil
	}
	et, err := s.store.GetEventType(id)
	if errors.Is(err, storage.ErrNotFound) {
		return api.ListSlots404JSONResponse(notFoundProblem("Event type not found")), nil
	}
	now := s.now().UTC()
	from := now
	if req.Params.From != nil {
		from = req.Params.From.UTC()
	}
	to := now.Add(domain.BookingWindow)
	if req.Params.To != nil {
		to = req.Params.To.UTC()
	}
	if from.After(to) {
		return api.ListSlots400JSONResponse(problem(400, "invalid_range", "Invalid range", "Parameter 'from' must be <= 'to'")), nil
	}
	slots := domain.GenerateSlots(et, from, to, now, s.store.AllBookings())
	out := make(api.ListSlots200JSONResponse, 0, len(slots))
	for _, sl := range slots {
		out = append(out, api.Slot{Start: sl.Start, End: sl.End})
	}
	return out, nil
}

// ===== Public: bookings =====

func (s *Server) CreateBooking(_ context.Context, req api.CreateBookingRequestObject) (api.CreateBookingResponseObject, error) {
	if req.Body == nil {
		return api.CreateBooking400JSONResponse(problem(400, "invalid_request", "Invalid request", "Request body is required")), nil
	}
	guestName := strings.TrimSpace(req.Body.GuestName)
	guestEmail := strings.TrimSpace(string(req.Body.GuestEmail))
	notes := trimOptional(req.Body.Notes)
	if err := validateBookingFields(guestName, guestEmail, notes); err != nil {
		return api.CreateBooking400JSONResponse(problem(400, "validation_failed", "Validation failed", err.Error())), nil
	}

	et, err := s.store.GetEventType(uuid.UUID(req.Body.EventTypeId))
	if errors.Is(err, storage.ErrNotFound) {
		return api.CreateBooking422JSONResponse(problem(422, "event_type_not_found", "Event type not found", "Referenced eventTypeId does not exist")), nil
	}

	now := s.now().UTC()
	if err := domain.ValidateNewBooking(et, req.Body.Start, now); err != nil {
		switch {
		case errors.Is(err, domain.ErrOutOfWindow):
			return api.CreateBooking422JSONResponse(problem(422, "out_of_window", "Slot is outside the booking window", "Booking start must be within the next 14 days")), nil
		case errors.Is(err, domain.ErrNotOnGrid):
			return api.CreateBooking422JSONResponse(problem(422, "not_on_grid", "Slot is not aligned to the grid", "Booking start must match a slot returned by GET /event-types/{id}/slots")), nil
		default:
			return api.CreateBooking422JSONResponse(problem(422, "invalid_slot", "Invalid slot", err.Error())), nil
		}
	}

	start := req.Body.Start.UTC()
	end := start.Add(time.Duration(et.DurationMinutes) * time.Minute)
	saved, err := s.store.CreateBookingIfFree(storage.Booking{
		EventTypeID:   et.ID,
		EventTypeName: et.Name,
		Start:         start,
		End:           end,
		GuestName:     guestName,
		GuestEmail:    guestEmail,
		Notes:         notes,
	}, now)
	if errors.Is(err, storage.ErrSlotTaken) {
		return api.CreateBooking409JSONResponse(problem(409, "slot_taken", "Slot already taken", "The requested time conflicts with another booking")), nil
	}
	return api.CreateBooking201JSONResponse(bookingToAPI(saved)), nil
}

// ===== validation helpers =====

func validateEventTypeCreateFields(name string, description *string, duration int32) error {
	if err := validateEventTypeName(&name); err != nil {
		return err
	}
	if err := validateEventTypeDescription(description); err != nil {
		return err
	}
	return validateDuration(&duration)
}

func validateEventTypeUpdateFields(name, description *string, duration *int32) error {
	if err := validateEventTypeName(name); err != nil {
		return err
	}
	if err := validateEventTypeDescription(description); err != nil {
		return err
	}
	return validateDuration(duration)
}

func validateEventTypeName(name *string) error {
	if name == nil {
		return nil
	}
	n := len([]rune(*name))
	if n < 1 || n > 120 {
		return errors.New("name length must be 1..120")
	}
	return nil
}

func validateEventTypeDescription(description *string) error {
	if description == nil {
		return nil
	}
	if len([]rune(*description)) > 1000 {
		return errors.New("description length must be <= 1000")
	}
	return nil
}

func validateDuration(duration *int32) error {
	if duration == nil {
		return nil
	}
	if *duration < 5 || *duration > 480 {
		return errors.New("durationMinutes must be in [5, 480]")
	}
	if *duration%5 != 0 {
		return errors.New("durationMinutes must be a multiple of 5")
	}
	return nil
}

func validateBookingFields(guestName, guestEmail string, notes *string) error {
	if n := len([]rune(guestName)); n < 1 || n > 120 {
		return errors.New("guestName length must be 1..120")
	}
	if len([]rune(guestEmail)) > 320 {
		return errors.New("guestEmail too long")
	}
	if _, err := mail.ParseAddress(guestEmail); err != nil {
		return errors.New("guestEmail must be a valid email")
	}
	if notes != nil {
		if n := len([]rune(*notes)); n < 1 || n > 1000 {
			return errors.New("notes length must be 1..1000")
		}
	}
	return nil
}

func trimOptional(s *string) *string {
	if s == nil {
		return nil
	}
	t := strings.TrimSpace(*s)
	return &t
}

// ===== mappers =====

func eventTypeToAPI(et storage.EventType) api.EventType {
	id := openapi_types.UUID(et.ID)
	return api.EventType{
		Id:              &id,
		Name:            et.Name,
		Description:     et.Description,
		DurationMinutes: et.DurationMinutes,
	}
}

func bookingToAPI(b storage.Booking) api.Booking {
	id := openapi_types.UUID(b.ID)
	createdAt := b.CreatedAt
	return api.Booking{
		Id:            &id,
		EventTypeId:   openapi_types.UUID(b.EventTypeID),
		EventTypeName: b.EventTypeName,
		Start:         b.Start,
		End:           b.End,
		GuestName:     b.GuestName,
		GuestEmail:    openapi_types.Email(b.GuestEmail),
		Notes:         b.Notes,
		CreatedAt:     &createdAt,
	}
}

func notFoundProblem(detail string) api.Problem {
	return problem(404, "not_found", "Not found", detail)
}
