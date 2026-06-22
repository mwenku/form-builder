package validation

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"regexp"

	z "github.com/Oudwins/zog"
)

var (
	errUnsupportedSchemaType = errors.New("unsupported schema type")
	datePattern              = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
)

type fieldValidator func(value any) []string

func compileFieldValidator(property JSONSchemaProperty, required bool) (fieldValidator, error) {
	switch property.Type {
	case "string":
		return compileStringValidator(property, required)
	case "number", "integer":
		return compileNumberValidator(property, required)
	case "boolean":
		return compileBoolValidator(required)
	default:
		return nil, fmt.Errorf("unsupported property type %q", property.Type)
	}
}

func compileStringValidator(property JSONSchemaProperty, required bool) (fieldValidator, error) {
	schema := z.String()
	if required {
		schema = schema.Required()
	}
	if len(property.Enum) > 0 {
		schema = schema.OneOf(property.Enum)
	}
	if property.MinLength != nil {
		schema = schema.Min(*property.MinLength)
	}
	if property.MaxLength != nil {
		schema = schema.Max(*property.MaxLength)
	}
	switch property.Format {
	case "email":
		schema = schema.Email()
	case "date":
		schema = schema.Match(datePattern)
	}
	if property.Pattern != "" {
		pattern, err := regexp.Compile(property.Pattern)
		if err != nil {
			return nil, fmt.Errorf("compile pattern: %w", err)
		}
		schema = schema.Match(pattern)
	}

	return func(value any) []string {
		var dest string
		return issueMessages(schema.Parse(value, &dest))
	}, nil
}

func compileNumberValidator(property JSONSchemaProperty, required bool) (fieldValidator, error) {
	schema := z.Float64()
	if required {
		schema = schema.Required()
	}
	if property.Minimum != nil {
		schema = schema.GTE(*property.Minimum)
	}
	if property.Maximum != nil {
		schema = schema.LTE(*property.Maximum)
	}
	if property.MultipleOf != nil && *property.MultipleOf > 0 {
		step := *property.MultipleOf
		schema = schema.TestFunc(func(value *float64, ctx z.Ctx) bool {
			if value == nil {
				return true
			}
			quotient := *value / step
			return math.Abs(quotient-math.Round(quotient)) < 0.000001
		}, z.Message(fmt.Sprintf("must be a multiple of %g", step)))
	}

	return func(value any) []string {
		var dest float64
		return issueMessages(schema.Parse(value, &dest))
	}, nil
}

func compileBoolValidator(required bool) (fieldValidator, error) {
	schema := z.Bool()
	if required {
		schema = schema.Required()
	}

	return func(value any) []string {
		var dest bool
		return issueMessages(schema.Parse(value, &dest))
	}, nil
}

func issueMessages(issues z.ZogIssueList) []string {
	if len(issues) == 0 {
		return nil
	}
	messages := make([]string, len(issues))
	for index, issue := range issues {
		message := issue.Message
		if message == "" {
			message = issue.Code
		}
		messages[index] = message
	}
	z.Issues.Collect(issues)
	return messages
}

func unmarshalJSON(raw []byte, dest any) error {
	if len(raw) == 0 {
		return errors.New("empty schema")
	}
	if err := json.Unmarshal(raw, dest); err != nil {
		return fmt.Errorf("decode schema: %w", err)
	}
	return nil
}

func isMissingRequiredValue(value any) bool {
	if value == nil {
		return true
	}
	if text, ok := value.(string); ok && text == "" {
		return true
	}
	return false
}

func unknownFieldMessage(field string) string {
	return fmt.Sprintf(`unrecognized field %q`, field)
}

func requiredFieldMessage(field string) string {
	return fmt.Sprintf(`missing required field %q`, field)
}
