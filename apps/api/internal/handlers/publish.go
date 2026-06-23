package handlers

import (
	"encoding/json"
	"net/http"

	"formbuilder/api/internal/models"
	"formbuilder/api/internal/validation"

	"github.com/gorilla/mux"
)

func (a *API) createForm(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	var body models.PublishFormRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeValidationErrors(w, []models.ValidationError{{Field: "", Message: "invalid JSON body"}})
		return
	}

	validationErrors := validatePublishForm(body.Title, body.Schema, body.UISchema)
	if len(validationErrors) > 0 {
		writeValidationErrors(w, validationErrors)
		return
	}

	uiSchema := normalizeUISchema(body.UISchema)
	form, err := a.store.CreateForm(r.Context(), body.Title, body.Description, body.Schema, uiSchema)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error")
		return
	}
	writeJSON(w, http.StatusCreated, form)
}

func (a *API) publishFormVersion(w http.ResponseWriter, r *http.Request) {
	formID, err := parseUUID(mux.Vars(r)["id"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request")
		return
	}

	defer r.Body.Close()
	var body models.PublishFormVersionRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeValidationErrors(w, []models.ValidationError{{Field: "", Message: "invalid JSON body"}})
		return
	}

	validationErrors := validatePublishVersion(body.Schema, body.UISchema)
	if len(validationErrors) > 0 {
		writeValidationErrors(w, validationErrors)
		return
	}

	uiSchema := normalizeUISchema(body.UISchema)
	form, err := a.store.PublishFormVersion(r.Context(), formID, body.Schema, uiSchema)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error")
		return
	}
	if form == nil {
		writeError(w, http.StatusNotFound, "not_found")
		return
	}
	writeJSON(w, http.StatusCreated, form)
}

func validatePublishForm(title string, schema json.RawMessage, uiSchema json.RawMessage) []models.ValidationError {
	if title == "" {
		return []models.ValidationError{{Field: "title", Message: "title is required"}}
	}
	return validatePublishVersion(schema, uiSchema)
}

func validatePublishVersion(schema json.RawMessage, uiSchema json.RawMessage) []models.ValidationError {
	if len(schema) == 0 {
		return []models.ValidationError{{Field: "schema", Message: "schema is required"}}
	}
	if err := validation.ValidateSchemaDefinition(schema); err != nil {
		return []models.ValidationError{{Field: "schema", Message: "schema is not supported by the validation engine"}}
	}
	if len(uiSchema) > 0 {
		var ui map[string]any
		if err := json.Unmarshal(uiSchema, &ui); err != nil {
			return []models.ValidationError{{Field: "uiSchema", Message: "uiSchema must be valid JSON"}}
		}
	}
	return nil
}

func normalizeUISchema(uiSchema json.RawMessage) json.RawMessage {
	if len(uiSchema) == 0 {
		return json.RawMessage(`{}`)
	}
	return uiSchema
}
