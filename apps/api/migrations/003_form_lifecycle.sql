-- +goose Up
CREATE TABLE forms (
    id UUID PRIMARY KEY,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO forms (id, created_at)
SELECT id, MIN(created_at)
FROM form_configs
GROUP BY id;

-- +goose Down
DROP TABLE IF EXISTS forms;
