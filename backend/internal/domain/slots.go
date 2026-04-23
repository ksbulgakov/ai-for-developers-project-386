package domain

import (
	"time"

	"github.com/konstantin/booking-backend/internal/storage"
)

// Owner work hours, fixed at 09:00–18:00 UTC, every day. Slots are generated
// inside this window with step = EventType.DurationMinutes. The last slot of
// the day is the one whose end equals WorkDayEndUTC:00.
const (
	WorkDayStartUTC = 9
	WorkDayEndUTC   = 18
	BookingWindow   = 14 * 24 * time.Hour
)

type Slot struct {
	Start time.Time
	End   time.Time
}

// GenerateSlots returns the list of free slots for the event type in the
// effective window [max(from, now), min(to, now+14d)]. Slots that overlap any
// existing booking (any event type, per the global uniqueness rule) are
// excluded.
func GenerateSlots(et storage.EventType, from, to, now time.Time, bookings []storage.Booking) []Slot {
	from = from.UTC()
	to = to.UTC()
	now = now.UTC()
	windowEnd := now.Add(BookingWindow)

	if from.Before(now) {
		from = now
	}
	if to.After(windowEnd) {
		to = windowEnd
	}
	if !from.Before(to) {
		return []Slot{}
	}

	step := time.Duration(et.DurationMinutes) * time.Minute
	out := make([]Slot, 0)

	day := time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, time.UTC)
	for day.Before(to) {
		dayStart := time.Date(day.Year(), day.Month(), day.Day(), WorkDayStartUTC, 0, 0, 0, time.UTC)
		dayEnd := time.Date(day.Year(), day.Month(), day.Day(), WorkDayEndUTC, 0, 0, 0, time.UTC)
		for slotStart := dayStart; !slotStart.Add(step).After(dayEnd); slotStart = slotStart.Add(step) {
			slotEnd := slotStart.Add(step)
			if slotStart.Before(from) || slotEnd.After(to) {
				continue
			}
			if hasOverlap(slotStart, slotEnd, bookings) {
				continue
			}
			out = append(out, Slot{Start: slotStart, End: slotEnd})
		}
		day = day.AddDate(0, 0, 1)
	}
	return out
}

// IsAlignedSlot reports whether start is on the slot grid for the event type:
// 09:00 UTC + k * durationMinutes, with the resulting end <= 18:00 UTC of the
// same day. Sub-minute precision is rejected.
func IsAlignedSlot(et storage.EventType, start time.Time) bool {
	start = start.UTC()
	if start.Second() != 0 || start.Nanosecond() != 0 {
		return false
	}
	if start.Hour() < WorkDayStartUTC {
		return false
	}
	minutesFromStart := (start.Hour()-WorkDayStartUTC)*60 + start.Minute()
	if minutesFromStart%int(et.DurationMinutes) != 0 {
		return false
	}
	endMinutes := minutesFromStart + int(et.DurationMinutes)
	maxMinutes := (WorkDayEndUTC - WorkDayStartUTC) * 60
	return endMinutes <= maxMinutes
}

func hasOverlap(start, end time.Time, bookings []storage.Booking) bool {
	for _, b := range bookings {
		if start.Before(b.End) && b.Start.Before(end) {
			return true
		}
	}
	return false
}
