package githubactions

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
)

// maxDiffBytes bounds how much of one commit's diff is read. A larger diff is an error, not a
// silent truncation: cutting it short could hide a secret past the cut.
const maxDiffBytes = 4 << 20

var commitSHA = regexp.MustCompile(`^[0-9a-fA-F]{7,64}$`)

// FetchCommitAdditions returns the lines one commit added, as "+"-prefixed diff lines ready for
// the secret scanner. A GitHub push webhook carries no diff, so this is how a real push gets
// scanned.
//
// Only the head commit of a push is fetched, so earlier commits in the same push are not
// scanned. Only added lines are returned: the scanner reads every line it is given, and a
// secret being removed, or sitting in unchanged context, is not a new leak.
//
// token may be empty for public repositories, at a much lower GitHub rate limit. A private
// repository needs a token that can read it; the personal token used for the Actions secret
// update only covers repositories its owner can reach.
func FetchCommitAdditions(ctx context.Context, owner, repo, sha, token string) (string, error) {
	return fetchCommitAdditions(ctx, http.DefaultClient, apiBase, owner, repo, sha, token)
}

func fetchCommitAdditions(ctx context.Context, client *http.Client, base, owner, repo, sha, token string) (string, error) {
	if owner == "" || repo == "" {
		return "", fmt.Errorf("fetch commit diff: owner and repo are required")
	}
	if !commitSHA.MatchString(sha) {
		return "", fmt.Errorf("fetch commit diff: %q is not a commit sha", sha)
	}

	endpoint := fmt.Sprintf("%s/repos/%s/%s/commits/%s", base, url.PathEscape(owner), url.PathEscape(repo), sha)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return "", fmt.Errorf("fetch commit diff: %w", err)
	}
	req.Header.Set("Accept", "application/vnd.github.diff")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("fetch commit diff: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("fetch commit diff for %s/%s@%s: unexpected status %d", owner, repo, shortSHA(sha), resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, maxDiffBytes+1))
	if err != nil {
		return "", fmt.Errorf("fetch commit diff: read body: %w", err)
	}
	if len(body) > maxDiffBytes {
		return "", fmt.Errorf("fetch commit diff for %s/%s@%s: diff is larger than %d bytes", owner, repo, shortSHA(sha), maxDiffBytes)
	}
	return addedLines(string(body)), nil
}

// addedLines keeps the lines a diff adds. "+++" file headers are not additions.
func addedLines(diff string) string {
	var out []string
	for _, line := range strings.Split(diff, "\n") {
		if strings.HasPrefix(line, "+") && !strings.HasPrefix(line, "+++") {
			out = append(out, line)
		}
	}
	return strings.Join(out, "\n")
}

func shortSHA(sha string) string {
	if len(sha) > 7 {
		return sha[:7]
	}
	return sha
}
