package validation

import (
	z "github.com/Oudwins/zog"
)

var pathUUIDSchema = z.String().UUID()

func ValidateUUID(value string) error {
	issues := pathUUIDSchema.Parse(value, new(string))
	defer z.Issues.Collect(issues)
	if len(issues) > 0 {
		return errInvalidUUID
	}
	return nil
}
