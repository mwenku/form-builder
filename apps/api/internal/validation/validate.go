package validation

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"

	"formbuilder/api/internal/models"

	"github.com/santhosh-tekuri/jsonschema/v5"
)

func ValidatePayload(schemaJSON json.RawMessage, payload json.RawMessage) ([]models.ValidationError, error) {
	compiler := jsonschema.NewCompiler()
	compiler.Draft = jsonschema.Draft2020
	compiler.AssertFormat = true

	if err := compiler.AddResource("schema.json", bytes.NewReader(schemaJSON)); err != nil {
		return nil, fmt.Errorf("compile schema: %w", err)
	}

	schema, err := compiler.Compile("schema.json")
	if err != nil {
		return nil, fmt.Errorf("compile schema: %w", err)
	}

	var data any
	if err := json.Unmarshal(payload, &data); err != nil {
		return []models.ValidationError{{Field: "", Message: "invalid JSON body"}}, nil
	}

	if err := schema.Validate(data); err != nil {
		ve, ok := err.(*jsonschema.ValidationError)
		if !ok {
			return []models.ValidationError{{Field: "", Message: err.Error()}}, nil
		}
		return mapValidationErrors(ve), nil
	}

	return nil, nil
}

func mapValidationErrors(err *jsonschema.ValidationError) []models.ValidationError {
	var out []models.ValidationError
	collectErrors(err, &out)
	if len(out) == 0 {
		return []models.ValidationError{{Field: "", Message: err.Message}}
	}
	return out
}

func collectErrors(err *jsonschema.ValidationError, out *[]models.ValidationError) {
	if err.InstanceLocation != "" && err.Message != "" {
		field := strings.TrimPrefix(err.InstanceLocation, "/")
		field = strings.ReplaceAll(field, "/", ".")
		*out = append(*out, models.ValidationError{
			Field:   field,
			Message: err.Message,
		})
	}
	for _, child := range err.Causes {
		collectErrors(child, out)
	}
}
