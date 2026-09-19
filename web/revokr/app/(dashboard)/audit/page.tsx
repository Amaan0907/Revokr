import type { Metadata } from "next";
import { AuditView, type AuditRow } from "@/components/audit/audit-view";
import { PageHeader } from "@/components/ds/primitives";
import { MOCK_NOW, mockAuditLog, mockIncidents } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Audit log" };

export default function AuditPage() {
  const incidents = new Map(mockIncidents.map((incident) => [incident.id, incident]));

  const rows = [...mockAuditLog]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .flatMap((entry): AuditRow[] => {
      const incident = incidents.get(entry.incidentId);
      if (!incident) return [];
      return [
        {
          entry,
          incident: {
            label: `${incident.provider} · ${incident.secretType} · ${incident.repositoryOwner}/${incident.repositoryName}`,
            provider: incident.provider,
            secretType: incident.secretType,
            fingerprint: incident.fingerprint,
            maskedValue: incident.maskedValue,
            isLive: incident.isLive,
            riskScore: incident.riskScore,
            severity: incident.severity,
            commitSha: incident.commitSha,
            filePath: incident.filePath,
            lineNumber: incident.lineNumber,
            simulated: incident.simulated,
          },
        },
      ];
    });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Audit log · read-only"
        title="Every step, who did it, what happened"
        description="Append-only. Entries cannot be edited or deleted from the product. Metadata holds fingerprints and masked values only."
      />
      <AuditView rows={rows} now={MOCK_NOW} />
    </div>
  );
}
