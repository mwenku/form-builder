package handlers

import (
	"net/http"

	"github.com/gorilla/mux"
)

func (a *API) listSubmissions(w http.ResponseWriter, r *http.Request) {
	formID, err := parseUUID(mux.Vars(r)["id"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request")
		return
	}

	view, err := a.store.GetSubmissionsView(r.Context(), formID)
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

func (a *API) archiveForm(w http.ResponseWriter, r *http.Request) {
	formID, err := parseUUID(mux.Vars(r)["id"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request")
		return
	}

	ok, err := a.store.ArchiveForm(r.Context(), formID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error")
		return
	}
	if !ok {
		writeError(w, http.StatusNotFound, "not_found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "archived"})
}

func (a *API) restoreForm(w http.ResponseWriter, r *http.Request) {
	formID, err := parseUUID(mux.Vars(r)["id"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request")
		return
	}

	ok, err := a.store.RestoreForm(r.Context(), formID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error")
		return
	}
	if !ok {
		writeError(w, http.StatusNotFound, "not_found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "restored"})
}

func (a *API) deleteForm(w http.ResponseWriter, r *http.Request) {
	formID, err := parseUUID(mux.Vars(r)["id"])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request")
		return
	}

	ok, err := a.store.DeleteForm(r.Context(), formID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error")
		return
	}
	if !ok {
		writeError(w, http.StatusNotFound, "not_found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
