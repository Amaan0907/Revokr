package bedrock

// SanitizeIncident copies only the fields safe to send to Bedrock. Anything
// not explicitly listed here — RawSecretValue above all — is dropped.
func SanitizeIncident(inc Incident) SanitizedIncident {
	return SanitizedIncident{
		Provider:        inc.Provider,
		SecretType:      inc.SecretType,
		Fingerprint:     inc.Fingerprint,
		MaskedValue:     inc.MaskedValue,
		IsLive:          inc.IsLive,
		Severity:        inc.Severity,
		RiskScore:       inc.RiskScore,
		RiskFactors:     inc.RiskFactors,
		Status:          inc.Status,
		Simulated:       inc.Simulated,
		RepositoryOwner: inc.RepositoryOwner,
		RepositoryName:  inc.RepositoryName,
		FilePath:        inc.FilePath,
		LineNumber:      inc.LineNumber,
		CommitSHA:       inc.CommitSHA,
	}
}
