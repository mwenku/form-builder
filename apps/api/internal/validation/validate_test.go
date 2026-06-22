package validation_test

import (
	"encoding/json"
	"testing"

	"formbuilder/api/internal/validation"
)

func contactSchema() json.RawMessage {
	return json.RawMessage(`{
		"$schema": "https://json-schema.org/draft/2020-12/schema",
		"type": "object",
		"required": ["name", "email"],
		"properties": {
			"name": { "type": "string", "minLength": 1 },
			"email": { "type": "string", "format": "email" }
		},
		"additionalProperties": false
	}`)
}

func TestValidatePayload_valid(t *testing.T) {
	payload := json.RawMessage(`{"name":"Ada","email":"ada@example.com"}`)
	errs, err := validation.ValidatePayload(contactSchema(), payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(errs) != 0 {
		t.Fatalf("expected no errors, got %v", errs)
	}
}

func TestValidatePayload_missingRequired(t *testing.T) {
	payload := json.RawMessage(`{"name":"Ada"}`)
	errs, err := validation.ValidatePayload(contactSchema(), payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(errs) == 0 {
		t.Fatal("expected validation errors")
	}
}

func TestValidatePayload_invalidEmail(t *testing.T) {
	payload := json.RawMessage(`{"name":"Ada","email":"not-an-email"}`)
	errs, err := validation.ValidatePayload(contactSchema(), payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(errs) == 0 {
		t.Fatal("expected validation errors")
	}
}

func TestValidatePayload_invalidJSON(t *testing.T) {
	payload := json.RawMessage(`{`)
	errs, err := validation.ValidatePayload(contactSchema(), payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(errs) != 1 || errs[0].Message != "invalid JSON body" {
		t.Fatalf("expected invalid JSON error, got %v", errs)
	}
}
