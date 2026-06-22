package db

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	contactFormID = uuid.MustParse("11111111-1111-1111-1111-111111111111")
	requestFormID = uuid.MustParse("22222222-2222-2222-2222-222222222222")
)

func Seed(ctx context.Context, pool *pgxpool.Pool) error {
	var count int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM form_configs`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	contactV1Schema := json.RawMessage(`{
		"$schema": "https://json-schema.org/draft/2020-12/schema",
		"type": "object",
		"required": ["name", "email"],
		"properties": {
			"name": { "type": "string", "minLength": 1 },
			"email": { "type": "string", "format": "email" },
			"message": { "type": "string" }
		},
		"additionalProperties": false
	}`)
	contactV1UI := json.RawMessage(`{
		"order": ["name", "email", "message"],
		"labels": { "name": "Full name", "email": "Email address", "message": "Message" }
	}`)

	contactV2Schema := json.RawMessage(`{
		"$schema": "https://json-schema.org/draft/2020-12/schema",
		"type": "object",
		"required": ["name", "email", "phone"],
		"properties": {
			"name": { "type": "string", "minLength": 1 },
			"email": { "type": "string", "format": "email" },
			"phone": { "type": "string", "minLength": 5 },
			"message": { "type": "string" }
		},
		"additionalProperties": false
	}`)
	contactV2UI := json.RawMessage(`{
		"order": ["name", "email", "phone", "message"],
		"labels": { "name": "Full name", "email": "Email", "phone": "Phone", "message": "Message" }
	}`)

	requestSchema := json.RawMessage(`{
		"$schema": "https://json-schema.org/draft/2020-12/schema",
		"type": "object",
		"required": ["title", "category", "amount", "requestDate"],
		"properties": {
			"title": { "type": "string", "minLength": 1 },
			"category": { "type": "string", "enum": ["travel", "equipment", "training", "other"] },
			"amount": { "type": "number", "minimum": 0 },
			"requestDate": { "type": "string", "format": "date" },
			"urgent": { "type": "boolean" }
		},
		"additionalProperties": false
	}`)
	requestUI := json.RawMessage(`{
		"order": ["title", "category", "amount", "requestDate", "urgent"],
		"labels": {
			"title": "Request title",
			"category": "Category",
			"amount": "Amount (USD)",
			"requestDate": "Date needed",
			"urgent": "Mark as urgent"
		}
	}`)

	forms := []struct {
		id          uuid.UUID
		version     int
		title       string
		description string
		schema      json.RawMessage
		ui          json.RawMessage
	}{
		{contactFormID, 1, "Contact us", "Reach the team — version 1 (no phone field).", contactV1Schema, contactV1UI},
		{contactFormID, 2, "Contact us", "Reach the team — version 2 adds a required phone field.", contactV2Schema, contactV2UI},
		{requestFormID, 1, "Expense request", "Submit a simple expense or purchase request.", requestSchema, requestUI},
	}

	for _, f := range forms {
		_, err := pool.Exec(ctx, `
			INSERT INTO form_configs (id, version, title, description, schema, ui_schema)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, f.id, f.version, f.title, f.description, f.schema, f.ui)
		if err != nil {
			return err
		}
	}

	demoSubmission := json.RawMessage(`{"name":"Alex Reviewer","email":"alex@example.com","message":"Seeded v1 submission"}`)
	_, err := pool.Exec(ctx, `
		INSERT INTO form_submissions (form_config_id, form_config_version, answers)
		VALUES ($1, 1, $2)
	`, contactFormID, demoSubmission)
	return err
}
