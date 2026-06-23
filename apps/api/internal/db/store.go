package db

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"formbuilder/api/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

func (s *Store) ListForms(ctx context.Context) ([]models.FormSummary, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, title, MAX(version) AS latest_version
		FROM form_configs
		GROUP BY id, title
		ORDER BY title
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var forms []models.FormSummary
	for rows.Next() {
		var f models.FormSummary
		if err := rows.Scan(&f.ID, &f.Title, &f.LatestVersion); err != nil {
			return nil, err
		}
		forms = append(forms, f)
	}
	return forms, rows.Err()
}

func (s *Store) GetLatestFormConfig(ctx context.Context, formID uuid.UUID) (*models.FormConfig, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, version, title, description, schema, ui_schema
		FROM form_configs
		WHERE id = $1
		ORDER BY version DESC
		LIMIT 1
	`, formID)
	return scanFormConfig(row)
}

func (s *Store) GetFormConfigVersion(ctx context.Context, formID uuid.UUID, version int) (*models.FormConfig, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, version, title, description, schema, ui_schema
		FROM form_configs
		WHERE id = $1 AND version = $2
	`, formID, version)
	return scanFormConfig(row)
}

func scanFormConfig(row pgx.Row) (*models.FormConfig, error) {
	var f models.FormConfig
	var id uuid.UUID
	if err := row.Scan(&id, &f.Version, &f.Title, &f.Description, &f.Schema, &f.UISchema); err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	f.ID = id.String()
	return &f, nil
}

func (s *Store) ListFormVersions(ctx context.Context, formID uuid.UUID) ([]models.FormVersionSummary, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT version, created_at
		FROM form_configs
		WHERE id = $1
		ORDER BY version ASC
	`, formID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var versions []models.FormVersionSummary
	for rows.Next() {
		var v models.FormVersionSummary
		var createdAt time.Time
		if err := rows.Scan(&v.Version, &createdAt); err != nil {
			return nil, err
		}
		v.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		versions = append(versions, v)
	}
	return versions, rows.Err()
}

func (s *Store) ListSubmissions(ctx context.Context, formID uuid.UUID) ([]models.SubmissionSummary, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, form_config_version, answers, created_at
		FROM form_submissions
		WHERE form_config_id = $1
		ORDER BY created_at DESC
	`, formID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subs []models.SubmissionSummary
	for rows.Next() {
		var sub models.SubmissionSummary
		var id uuid.UUID
		var createdAt time.Time
		if err := rows.Scan(&id, &sub.FormConfigVersion, &sub.Answers, &createdAt); err != nil {
			return nil, err
		}
		sub.ID = id.String()
		sub.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		subs = append(subs, sub)
	}
	return subs, rows.Err()
}

func (s *Store) CreateSubmission(ctx context.Context, formID uuid.UUID, version int, answers json.RawMessage) (*models.SubmissionSummary, error) {
	var sub models.SubmissionSummary
	var id uuid.UUID
	var createdAt time.Time
	err := s.pool.QueryRow(ctx, `
		INSERT INTO form_submissions (form_config_id, form_config_version, answers)
		VALUES ($1, $2, $3)
		RETURNING id, form_config_version, answers, created_at
	`, formID, version, answers).Scan(&id, &sub.FormConfigVersion, &sub.Answers, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("insert submission: %w", err)
	}
	sub.ID = id.String()
	sub.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	return &sub, nil
}

func (s *Store) CreateForm(
	ctx context.Context,
	title string,
	description string,
	schema json.RawMessage,
	uiSchema json.RawMessage,
) (*models.FormConfig, error) {
	formID := uuid.New()
	return s.insertFormConfig(ctx, formID, 1, title, description, schema, uiSchema)
}

func (s *Store) PublishFormVersion(
	ctx context.Context,
	formID uuid.UUID,
	schema json.RawMessage,
	uiSchema json.RawMessage,
) (*models.FormConfig, error) {
	latest, err := s.GetLatestFormConfig(ctx, formID)
	if err != nil {
		return nil, err
	}
	if latest == nil {
		return nil, nil
	}
	return s.insertFormConfig(ctx, formID, latest.Version+1, latest.Title, latest.Description, schema, uiSchema)
}

func (s *Store) insertFormConfig(
	ctx context.Context,
	formID uuid.UUID,
	version int,
	title string,
	description string,
	schema json.RawMessage,
	uiSchema json.RawMessage,
) (*models.FormConfig, error) {
	row := s.pool.QueryRow(ctx, `
		INSERT INTO form_configs (id, version, title, description, schema, ui_schema)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, version, title, description, schema, ui_schema
	`, formID, version, title, description, schema, uiSchema)
	return scanFormConfig(row)
}

func (s *Store) GetIntegrityView(ctx context.Context, formID uuid.UUID) (*models.FormIntegrityView, error) {
	latest, err := s.GetLatestFormConfig(ctx, formID)
	if err != nil || latest == nil {
		return nil, err
	}

	versions, err := s.ListFormVersions(ctx, formID)
	if err != nil {
		return nil, err
	}

	subs, err := s.ListSubmissions(ctx, formID)
	if err != nil {
		return nil, err
	}

	byVersion := make([]models.SubmissionsByVersion, 0, len(versions))
	for _, v := range versions {
		group := models.SubmissionsByVersion{Version: v.Version, Submissions: []models.SubmissionSummary{}}
		for _, sub := range subs {
			if sub.FormConfigVersion == v.Version {
				group.Submissions = append(group.Submissions, sub)
			}
		}
		byVersion = append(byVersion, group)
	}

	return &models.FormIntegrityView{
		FormID:    latest.ID,
		Title:     latest.Title,
		Versions:  versions,
		ByVersion: byVersion,
	}, nil
}
