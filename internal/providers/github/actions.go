package githubactions

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"golang.org/x/crypto/nacl/box"
)

const apiBase = "https://api.github.com"

// AWSAccessKeyIDSecretName and AWSSecretAccessKeySecretName are the fixed
// GitHub Actions secret names an AWS credential rotation writes into. v1
// scope is AWS-only remediation (see providers.Select's own v1 scope note),
// so these are the only secret names defined for now.
const (
	AWSAccessKeyIDSecretName     = "AWS_ACCESS_KEY_ID"
	AWSSecretAccessKeySecretName = "AWS_SECRET_ACCESS_KEY"
)

// Client talks to the GitHub Actions secrets API for one repo.
type Client struct {
	owner string
	repo  string
	token string
	http  *http.Client
}

func NewClient(owner, repo, token string) *Client {
	return &Client{owner: owner, repo: repo, token: token, http: &http.Client{}}
}

func (c *Client) do(ctx context.Context, method, path string, body io.Reader) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, method, apiBase+path, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	return c.http.Do(req)
}

type publicKeyResp struct {
	KeyID string `json:"key_id"`
	Key   string `json:"key"`
}

// getPublicKey is step 1: GitHub gives us its repo's libsodium box public
// key. We encrypt against this locally; GitHub never sees the plaintext
// until it decrypts server-side with the matching private key.
func (c *Client) getPublicKey(ctx context.Context) (*publicKeyResp, error) {
	path := fmt.Sprintf("/repos/%s/%s/actions/secrets/public-key", c.owner, c.repo)
	resp, err := c.do(ctx, http.MethodGet, path, nil)
	if err != nil {
		return nil, fmt.Errorf("get public key: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("get public key: unexpected status %d", resp.StatusCode)
	}
	var pk publicKeyResp
	if err := json.NewDecoder(resp.Body).Decode(&pk); err != nil {
		return nil, fmt.Errorf("decode public key response: %w", err)
	}
	return &pk, nil
}

// encryptSecret is step 2: libsodium sealed-box anonymous encryption,
// which box.SealAnonymous implements. This is a one-way encryption to the
// repo's public key - only GitHub can decrypt it.
func encryptSecret(publicKeyB64, plaintext string) (string, error) {
	rawKey, err := base64.StdEncoding.DecodeString(publicKeyB64)
	if err != nil {
		return "", fmt.Errorf("decode repo public key: %w", err)
	}
	if len(rawKey) != 32 {
		return "", fmt.Errorf("unexpected public key length %d, want 32", len(rawKey))
	}
	var pubKeyArr [32]byte
	copy(pubKeyArr[:], rawKey)

	sealed, err := box.SealAnonymous(nil, []byte(plaintext), &pubKeyArr, rand.Reader)
	if err != nil {
		return "", fmt.Errorf("seal secret: %w", err)
	}
	return base64.StdEncoding.EncodeToString(sealed), nil
}

// PutSecret is steps 2+3 combined: encrypt, then PUT the ciphertext.
// GitHub returns 201 for a brand-new secret, 204 for an update to an
// existing one - both mean success.
func (c *Client) PutSecret(ctx context.Context, secretName, plaintext string) error {
	pk, err := c.getPublicKey(ctx)
	if err != nil {
		return err
	}
	encrypted, err := encryptSecret(pk.Key, plaintext)
	if err != nil {
		return err
	}

	payload, _ := json.Marshal(map[string]string{
		"encrypted_value": encrypted,
		"key_id":          pk.KeyID,
	})

	path := fmt.Sprintf("/repos/%s/%s/actions/secrets/%s", c.owner, c.repo, secretName)
	resp, err := c.do(ctx, http.MethodPut, path, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("put secret: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("put secret: unexpected status %d", resp.StatusCode)
	}
	return nil
}

type SecretMeta struct {
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

// GetSecretMeta is the only "verification" GitHub allows: it will never
// return the plaintext value, only metadata. We compare UpdatedAt
// before/after PutSecret to confirm the write actually took effect.
// Returns (nil, nil) if the secret doesn't exist yet.
func (c *Client) GetSecretMeta(ctx context.Context, secretName string) (*SecretMeta, error) {
	path := fmt.Sprintf("/repos/%s/%s/actions/secrets/%s", c.owner, c.repo, secretName)
	resp, err := c.do(ctx, http.MethodGet, path, nil)
	if err != nil {
		return nil, fmt.Errorf("get secret meta: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return nil, nil
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("get secret meta: unexpected status %d", resp.StatusCode)
	}
	var meta SecretMeta
	if err := json.NewDecoder(resp.Body).Decode(&meta); err != nil {
		return nil, fmt.Errorf("decode secret meta: %w", err)
	}
	return &meta, nil
}
