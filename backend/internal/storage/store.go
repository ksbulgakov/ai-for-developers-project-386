package storage

import (
	"errors"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"
)

type EventType struct {
	ID              uuid.UUID
	Name            string
	Description     *string
	DurationMinutes int32
}

type EventTypePatch struct {
	Name            *string
	Description     *string
	DurationMinutes *int32
}

type Booking struct {
	ID            uuid.UUID
	EventTypeID   uuid.UUID
	EventTypeName string
	Start         time.Time
	End           time.Time
	GuestName     string
	GuestEmail    string
	Notes         *string
	CreatedAt     time.Time
}

var (
	ErrNotFound  = errors.New("not found")
	ErrSlotTaken = errors.New("slot taken")
)

type Store struct {
	mu         sync.RWMutex
	eventTypes map[uuid.UUID]EventType
	bookings   map[uuid.UUID]Booking
}

func New() *Store {
	return &Store{
		eventTypes: make(map[uuid.UUID]EventType),
		bookings:   make(map[uuid.UUID]Booking),
	}
}

func (s *Store) ListEventTypes() []EventType {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]EventType, 0, len(s.eventTypes))
	for _, et := range s.eventTypes {
		out = append(out, et)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}

func (s *Store) GetEventType(id uuid.UUID) (EventType, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	et, ok := s.eventTypes[id]
	if !ok {
		return EventType{}, ErrNotFound
	}
	return et, nil
}

func (s *Store) CreateEventType(et EventType) EventType {
	s.mu.Lock()
	defer s.mu.Unlock()
	et.ID = uuid.New()
	s.eventTypes[et.ID] = et
	return et
}

func (s *Store) UpdateEventType(id uuid.UUID, patch EventTypePatch) (EventType, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	et, ok := s.eventTypes[id]
	if !ok {
		return EventType{}, ErrNotFound
	}
	if patch.Name != nil {
		et.Name = *patch.Name
	}
	if patch.Description != nil {
		et.Description = patch.Description
	}
	if patch.DurationMinutes != nil {
		et.DurationMinutes = *patch.DurationMinutes
	}
	s.eventTypes[id] = et
	return et, nil
}

func (s *Store) DeleteEventType(id uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.eventTypes[id]; !ok {
		return ErrNotFound
	}
	delete(s.eventTypes, id)
	return nil
}

func (s *Store) ListBookings(from, to *time.Time) []Booking {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]Booking, 0, len(s.bookings))
	for _, b := range s.bookings {
		if from != nil && b.Start.Before(*from) {
			continue
		}
		if to != nil && b.Start.After(*to) {
			continue
		}
		out = append(out, b)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Start.Before(out[j].Start) })
	return out
}

func (s *Store) AllBookings() []Booking {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]Booking, 0, len(s.bookings))
	for _, b := range s.bookings {
		out = append(out, b)
	}
	return out
}

// CreateBookingIfFree atomically checks that [b.Start, b.End) does not overlap
// any existing booking and inserts it. The uniqueness rule is global across
// every event type, per the contract in tsp/errors.tsp:36-42.
func (s *Store) CreateBookingIfFree(b Booking, createdAt time.Time) (Booking, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, existing := range s.bookings {
		if b.Start.Before(existing.End) && existing.Start.Before(b.End) {
			return Booking{}, ErrSlotTaken
		}
	}
	b.ID = uuid.New()
	b.CreatedAt = createdAt
	s.bookings[b.ID] = b
	return b, nil
}

func (s *Store) DeleteBooking(id uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.bookings[id]; !ok {
		return ErrNotFound
	}
	delete(s.bookings, id)
	return nil
}
