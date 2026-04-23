package domain

import (
	"errors"
	"time"

	"github.com/konstantin/booking-backend/internal/storage"
)

var (
	ErrOutOfWindow = errors.New("start outside booking window")
	ErrNotOnGrid   = errors.New("start not aligned to slot grid")
)

// ValidateNewBooking checks all booking pre-conditions except the slot-taken
// conflict, which the storage layer checks atomically with the insert.
func ValidateNewBooking(et storage.EventType, start, now time.Time) error {
	start = start.UTC()
	now = now.UTC()
	if start.Before(now) || start.After(now.Add(BookingWindow)) {
		return ErrOutOfWindow
	}
	if !IsAlignedSlot(et, start) {
		return ErrNotOnGrid
	}
	return nil
}
