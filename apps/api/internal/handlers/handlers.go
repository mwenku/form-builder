package handlers

import (
	"encoding/json"
	"net/http"

	"formbuilder/api/internal/db"
	"formbuilder/api/internal/models"
	"formbuilder/api/internal/validation"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

type API struct {
	store *db.Store
}

func New(store *db.Store) *API {
	return &API{store: store}
}

func (a *API) Router() *mux.Router {
	r := mux.NewRouter()
	r.HandleFunc("/health", a.health).Methods(http.MethodGet)
	r.HandleFunc("/forms", a.listForms).Methods(http.MethodGet)
	r.HandleFunc("/forms", a.createForm).Methods(http.MethodPost)
	r.HandleFunc("/forms/{id}", a.getForm).Methods(http.MethodGet)
	r.HandleFunc("/forms/{id}", a.deleteForm).Methods(http.MethodDelete)
	r.HandleFunc("/forms/{id}/archive", a.archiveForm).Methods(http.MethodPost)
	r.HandleFunc("/forms/{id}/restore", a.restoreForm).Methods(http.MethodPost)
	r.HandleFunc("/forms/{id}/submissions", a.listSubmissions).Methods(http.MethodGet)
	r.HandleFunc("/forms/{id}/submissions", a.createSubmission).Methods(http.MethodPost)
	r.HandleFunc("/forms/{id}/integrity", a.getIntegrity).Methods(http.MethodGet)
	r.HandleFunc("/forms/{id}/versions", a.publishFormVersion).Methods(http.MethodPost)
	return r
}

func (a *API) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (a *API) listForms(w http.ResponseWriter, r *http.Request) {
	includeArchived := r.URL.Query().Get("archived") == "true"
	forms, err := a.store.ListForms(r.Context(), includeArchived)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error")
		return
	}
	if forms == nil {
		forms = []models.FormSummary{}
	}
	writeJSON(w, http.StatusOK, forms)
}

func (a *API) getForm(w http.ResponseWriter, r *http.Request) {
	formID, err := parseUUID(mux.Vars(r)["id"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request")
		return
	}

	form, err := a.store.GetLatestFormConfig(r.Context(), formID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error")
		return
	}
	if form == nil {
		writeError(w, http.StatusNotFound, "not_found")
		return
	}

	archived, err := a.store.IsFormArchived(r.Context(), formID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error")
		return
	}
	if archived {
		writeError(w, http.StatusNotFound, "not_found")
		return
	}
	writeJSON(w, http.StatusOK, form)
}

func (a *API) getIntegrity(w http.ResponseWriter, r *http.Request) {
	formID, err := parseUUID(mux.Vars(r)["id"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request")
		return
	}

	view, err := a.store.GetIntegrityView(r.Context(), formID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error")
		return
	}
	if view == nil {
		writeError(w, http.StatusNotFound, "not_found")
		return
	}
	writeJSON(w, http.StatusOK, view)
}

func (a *API) createSubmission(w http.ResponseWriter, r *http.Request) {
	formID, err := parseUUID(mux.Vars(r)["id"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request")
		return
	}

	form, err := a.store.GetLatestFormConfig(r.Context(), formID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error")
		return
	}
	if form == nil {
		writeError(w, http.StatusNotFound, "not_found")
		return
	}

	archived, err := a.store.IsFormArchived(r.Context(), formID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error")
		return
	}
	if archived {
		writeError(w, http.StatusNotFound, "not_found")
		return
	}

	defer r.Body.Close()
	var raw json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&raw); err != nil {
		writeValidationErrors(w, []models.ValidationError{{Field: "", Message: "invalid JSON body"}})
		return
	}

	validationErrors, err := validation.ValidatePayload(form.Schema, raw)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error")
		return
	}
	if len(validationErrors) > 0 {
		writeValidationErrors(w, validationErrors)
		return
	}

	sub, err := a.store.CreateSubmission(r.Context(), formID, form.Version, raw)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error")
		return
	}
	writeJSON(w, http.StatusCreated, sub)
}

func parseUUID(s string) (uuid.UUID, error) {
	if err := validation.ValidateUUID(s); err != nil {
		return uuid.Nil, err
	}
	return uuid.Parse(s)
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, code string) {
	writeJSON(w, status, map[string]string{"code": code})
}

func writeValidationErrors(w http.ResponseWriter, errors []models.ValidationError) {
	writeJSON(w, http.StatusBadRequest, models.ErrorResponse{Errors: errors})
}
