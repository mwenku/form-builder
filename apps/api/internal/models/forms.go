package models

import "encoding/json"

//typeshare:typescript
type FormSummary struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	LatestVersion int    `json:"latestVersion"`
}

//typeshare:typescript
type FormVersionSummary struct {
	Version   int    `json:"version"`
	CreatedAt string `json:"createdAt"`
}

//typeshare:typescript
type FormConfig struct {
	ID          string          `json:"id"`
	Version     int             `json:"version"`
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Schema      json.RawMessage `json:"schema"`
	UISchema    json.RawMessage `json:"uiSchema"`
}

//typeshare:typescript
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

//typeshare:typescript
type ErrorResponse struct {
	Errors []ValidationError `json:"errors"`
}

//typeshare:typescript
type SubmissionSummary struct {
	ID                string          `json:"id"`
	FormConfigVersion int             `json:"formConfigVersion"`
	Answers           json.RawMessage `json:"answers"`
	CreatedAt         string          `json:"createdAt"`
}

//typeshare:typescript
type SubmissionsByVersion struct {
	Version     int                 `json:"version"`
	Submissions []SubmissionSummary `json:"submissions"`
}

//typeshare:typescript
type FormIntegrityView struct {
	FormID    string                 `json:"formId"`
	Title     string                 `json:"title"`
	Versions  []FormVersionSummary   `json:"versions"`
	ByVersion []SubmissionsByVersion `json:"byVersion"`
}

//typeshare:typescript
type PublishFormRequest struct {
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Schema      json.RawMessage `json:"schema"`
	UISchema    json.RawMessage `json:"uiSchema"`
}

//typeshare:typescript
type PublishFormVersionRequest struct {
	Schema   json.RawMessage `json:"schema"`
	UISchema json.RawMessage `json:"uiSchema"`
}
