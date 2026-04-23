package server

import (
	"github.com/konstantin/booking-backend/internal/api"
)

// problem builds an api.Problem with status mirrored in the body, matching
// the RFC 7807 shape declared in tsp/errors.tsp.
func problem(status int, code, title, detail string) api.Problem {
	p := api.Problem{
		Status: int32(status),
		Title:  title,
	}
	if code != "" {
		p.Code = &code
	}
	if detail != "" {
		p.Detail = &detail
	}
	return p
}
