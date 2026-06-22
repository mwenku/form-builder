package validation

import (
	"encoding/json"
	"fmt"

	"formbuilder/api/internal/models"
)

func ValidatePayload(schemaJSON json.RawMessage, payload json.RawMessage) ([]models.ValidationError, error) {
	schema, err := parseJSONSchema(schemaJSON)
	if err != nil {
		return nil, fmt.Errorf("parse schema: %w", err)
	}

	var data map[string]any
	if err := json.Unmarshal(payload, &data); err != nil {
		return []models.ValidationError{{Field: "", Message: "invalid JSON body"}}, nil
	}

	validators := make(map[string]fieldValidator, len(schema.Properties))
	for field, property := range schema.Properties {
		validator, err := compileFieldValidator(property, schema.isRequired(field))
		if err != nil {
			return nil, fmt.Errorf("compile field %q: %w", field, err)
		}
		validators[field] = validator
	}

	var validationErrors []models.ValidationError

	if schema.rejectsAdditionalProperties() {
		for field := range data {
			if _, ok := schema.Properties[field]; !ok {
				validationErrors = append(validationErrors, models.ValidationError{
					Field:   field,
					Message: unknownFieldMessage(field),
				})
			}
		}
	}

	for _, field := range schema.Required {
		if isMissingRequiredValue(data[field]) {
			validationErrors = append(validationErrors, models.ValidationError{
				Field:   field,
				Message: requiredFieldMessage(field),
			})
		}
	}

	for field, validator := range validators {
		value, present := data[field]
		if !present {
			continue
		}
		for _, message := range validator(value) {
			validationErrors = append(validationErrors, models.ValidationError{
				Field:   field,
				Message: message,
			})
		}
	}

	if len(validationErrors) > 0 {
		return validationErrors, nil
	}
	return nil, nil
}
