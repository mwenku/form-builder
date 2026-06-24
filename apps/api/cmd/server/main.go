package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	"formbuilder/api/internal/db"
	"formbuilder/api/internal/handlers"
	"formbuilder/api/migrations"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("connect db: %v", err)
	}
	defer pool.Close()

	if err := runMigrations(databaseURL); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	if err := db.Seed(ctx, pool); err != nil {
		log.Fatalf("seed: %v", err)
	}

	store := db.NewStore(pool)
	api := handlers.New(store)

	port := os.Getenv("API_PORT")
	if port == "" {
		port = "9787"
	}

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           withCORS(api.Router()),
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("api listening on :%s", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server: %v", err)
	}
}

func runMigrations(databaseURL string) error {
	goose.SetBaseFS(migrations.FS)
	if err := goose.SetDialect("postgres"); err != nil {
		return err
	}
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return err
	}
	defer db.Close()
	return goose.Up(db, ".")
}

func withCORS(next http.Handler) http.Handler {
	allowedOrigin := os.Getenv("CORS_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "*"
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
