-- +goose Up
UPDATE form_configs
SET
    schema = '{
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "required": ["name", "email", "phone"],
        "properties": {
            "name": { "type": "string", "minLength": 1, "maxLength": 120 },
            "email": { "type": "string", "format": "email" },
            "phone": { "type": "string", "pattern": "^\\+[1-9]\\d{6,14}$" },
            "message": { "type": "string", "maxLength": 2000 }
        },
        "additionalProperties": false
    }'::jsonb,
    ui_schema = '{
        "order": ["name", "email", "phone", "message"],
        "labels": {
            "name": "Full name",
            "email": "Email address",
            "phone": "Phone number",
            "message": "How can we help?"
        },
        "widgets": { "phone": "phone", "message": "textarea" },
        "placeholders": {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "message": "Tell us what you need help with…"
        },
        "help": {
            "phone": "Select your country code and enter your number without the leading zero.",
            "message": "Optional: share as much detail as you like."
        }
    }'::jsonb
WHERE id = '11111111-1111-1111-1111-111111111111' AND version = 2;

UPDATE form_configs
SET
    schema = '{
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "required": ["title", "category", "amount", "requestDate"],
        "properties": {
            "title": { "type": "string", "minLength": 1, "maxLength": 120 },
            "category": { "type": "string", "enum": ["travel", "equipment", "training", "other"] },
            "amount": { "type": "number", "minimum": 0.01, "multipleOf": 0.01 },
            "requestDate": { "type": "string", "format": "date" },
            "urgent": { "type": "boolean" }
        },
        "additionalProperties": false
    }'::jsonb,
    ui_schema = '{
        "order": ["title", "category", "amount", "requestDate", "urgent"],
        "labels": {
            "title": "Request title",
            "category": "Category",
            "amount": "Amount (USD)",
            "requestDate": "Date needed",
            "urgent": "Mark as urgent"
        },
        "placeholders": {
            "title": "e.g. Conference travel to Nairobi"
        },
        "help": {
            "amount": "Enter the estimated cost in US dollars.",
            "requestDate": "When do you need this approved by?"
        },
        "enumLabels": {
            "category": {
                "travel": "Travel",
                "equipment": "Equipment",
                "training": "Training",
                "other": "Other"
            }
        }
    }'::jsonb
WHERE id = '22222222-2222-2222-2222-222222222222' AND version = 1;

-- +goose Down
UPDATE form_configs
SET
    schema = '{
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
    }'::jsonb,
    ui_schema = '{
        "order": ["name", "email", "phone", "message"],
        "labels": { "name": "Full name", "email": "Email", "phone": "Phone", "message": "Message" }
    }'::jsonb
WHERE id = '11111111-1111-1111-1111-111111111111' AND version = 2;

UPDATE form_configs
SET
    schema = '{
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
    }'::jsonb,
    ui_schema = '{
        "order": ["title", "category", "amount", "requestDate", "urgent"],
        "labels": {
            "title": "Request title",
            "category": "Category",
            "amount": "Amount (USD)",
            "requestDate": "Date needed",
            "urgent": "Mark as urgent"
        }
    }'::jsonb
WHERE id = '22222222-2222-2222-2222-222222222222' AND version = 1;
