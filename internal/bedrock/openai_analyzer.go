package bedrock

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/shared"
)

// OpenAIAnalyzer calls OpenAI's API directly (gpt-4o-mini) to produce a real
// Analysis. It never fabricates a result — if the call fails or no API key
// is configured, it returns an error so the caller can fall back honestly
// (e.g. to TemplateAnalyzer) instead of showing a fake AI answer.
type OpenAIAnalyzer struct {
	client openai.Client
}

func NewOpenAIAnalyzer() OpenAIAnalyzer {
	return OpenAIAnalyzer{
		client: openai.NewClient(option.WithAPIKey(os.Getenv("OPENAI_API_KEY"))),
	}
}

// analysisSchema is the JSON shape the model is constrained to return.
type analysisSchema struct {
	Summary             string  `json:"summary"`
	WhyItMatters        string  `json:"why_it_matters"`
	RecommendedResponse string  `json:"recommended_response"`
	Confidence          float64 `json:"confidence"`
}

func (a OpenAIAnalyzer) Analyze(inc SanitizedIncident) (Analysis, error) {
	if os.Getenv("OPENAI_API_KEY") == "" {
		return Analysis{}, fmt.Errorf("bedrock: OPENAI_API_KEY not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	incidentJSON, err := json.Marshal(inc)
	if err != nil {
		return Analysis{}, fmt.Errorf("bedrock: marshal incident: %w", err)
	}

	schema := map[string]any{
		"type": "object",
		"properties": map[string]any{
			"summary":              map[string]any{"type": "string"},
			"why_it_matters":       map[string]any{"type": "string"},
			"recommended_response": map[string]any{"type": "string"},
			"confidence":           map[string]any{"type": "number", "minimum": 0, "maximum": 1},
		},
		"required":             []string{"summary", "why_it_matters", "recommended_response", "confidence"},
		"additionalProperties": false,
	}

	completion, err := a.client.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
		Model: openai.ChatModelGPT4oMini,
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage("You are a security incident analyst. You are given sanitized metadata about a leaked-credential incident — you never see the actual secret value. Explain it plainly and respond only in the required JSON schema."),
			openai.UserMessage(string(incidentJSON)),
		},
		ResponseFormat: openai.ChatCompletionNewParamsResponseFormatUnion{
			OfJSONSchema: &shared.ResponseFormatJSONSchemaParam{
				JSONSchema: shared.ResponseFormatJSONSchemaJSONSchemaParam{
					Name:   "incident_analysis",
					Strict: openai.Bool(true),
					Schema: schema,
				},
			},
		},
	})
	if err != nil {
		return Analysis{}, fmt.Errorf("bedrock: openai call failed: %w", err)
	}
	if len(completion.Choices) == 0 {
		return Analysis{}, fmt.Errorf("bedrock: openai returned no choices")
	}

	var parsed analysisSchema
	if err := json.Unmarshal([]byte(completion.Choices[0].Message.Content), &parsed); err != nil {
		return Analysis{}, fmt.Errorf("bedrock: parse openai response: %w", err)
	}

	return Analysis{
		Summary:             parsed.Summary,
		WhyItMatters:        parsed.WhyItMatters,
		RecommendedResponse: parsed.RecommendedResponse,
		Confidence:          parsed.Confidence,
		Source:              "openai",
	}, nil
}
