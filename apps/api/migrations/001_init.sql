-- +goose Up
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE form_configs (
    id UUID NOT NULL,
    version INT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    schema JSONB NOT NULL,
    ui_schema JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, version)
);

CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_config_id UUID NOT NULL,
    form_config_version INT NOT NULL,
    answers JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (form_config_id, form_config_version) REFERENCES form_configs (id, version)
);

CREATE INDEX idx_form_submissions_form ON form_submissions (form_config_id, form_config_version);

-- +goose Down
DROP TABLE IF EXISTS form_submissions;
DROP TABLE IF EXISTS form_configs;
