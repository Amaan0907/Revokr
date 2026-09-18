package bedrock

import (
	"os"
	"testing"

	"github.com/joho/godotenv"
)

func TestMain(m *testing.M) {
	// go test's working directory is this package's own folder, not the repo
	// root, so .env needs an explicit relative path here — unlike cmd/api and
	// cmd/worker, which run from the repo root and can call godotenv.Load()
	// with no argument.
	_ = godotenv.Load("../../.env")
	os.Exit(m.Run())
}
