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

func contactSchemaWithPhone() json.RawMessage {
	return json.RawMessage(`{
		"$schema": "https://json-schema.org/draft/2020-12/schema",
		"type": "object",
		"required": ["phone"],
		"properties": {
			"phone": { "type": "string", "pattern": "^\\+[1-9]\\d{6,14}$" }
		},
		"additionalProperties": false
	}`)
}

func TestValidatePayload_validE164Phone(t *testing.T) {
	payload := json.RawMessage(`{"phone":"+447700900123"}`)
	errs, err := validation.ValidatePayload(contactSchemaWithPhone(), payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(errs) != 0 {
		t.Fatalf("expected no errors, got %v", errs)
	}
}

func TestValidatePayload_invalidE164Phone(t *testing.T) {
	payload := json.RawMessage(`{"phone":"07700900123"}`)
	errs, err := validation.ValidatePayload(contactSchemaWithPhone(), payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(errs) == 0 {
		t.Fatal("expected validation errors")
	}
}

func TestValidatePayload_rejectsUnknownFields(t *testing.T) {
	schema := json.RawMessage(`{
		"type": "object",
		"required": ["name"],
		"properties": {
			"name": { "type": "string", "minLength": 1 }
		},
		"additionalProperties": false
	}`)
	payload := json.RawMessage(`{"name":"Ada","extra":"nope"}`)
	errs, err := validation.ValidatePayload(schema, payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(errs) == 0 {
		t.Fatal("expected validation errors")
	}
}

func TestValidateUUID(t *testing.T) {
	if err := validation.ValidateUUID("11111111-1111-1111-1111-111111111111"); err != nil {
		t.Fatalf("expected valid uuid, got %v", err)
	}
	if err := validation.ValidateUUID("not-a-uuid"); err == nil {
		t.Fatal("expected invalid uuid error")
	}
}

func TestValidateSchemaDefinition_valid(t *testing.T) {
	if err := validation.ValidateSchemaDefinition(contactSchema()); err != nil {
		t.Fatalf("expected valid schema, got %v", err)
	}
}

func TestValidateSchemaDefinition_invalid(t *testing.T) {
	schema := json.RawMessage(`{"type":"object","properties":{"x":{"type":"unsupported"}}}`)
	if err := validation.ValidateSchemaDefinition(schema); err == nil {
		t.Fatal("expected invalid schema error")
	}
}
