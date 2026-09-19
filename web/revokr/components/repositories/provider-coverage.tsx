import { Card, Cell, StatusCell, TableHead, TableRow, TableScroller } from "@/components/ds/primitives";
import { PROVIDER_COVERAGE, REMEDIATION_SUPPORT_META } from "@/lib/incident-meta";

const COLUMNS = ".9fr 1.1fr .8fr 1.1fr 1.6fr";

// Detection is the same for every provider. What differs is whether Revokr can also fix it.
export function ProviderCoverage() {
  return (
    <Card as="section" aria-labelledby="coverage-heading" className="overflow-hidden">
      <div className="flex flex-col gap-1 border-b border-white/8 px-[18px] py-4">
        <h2 id="coverage-heading" className="m-0 text-[14px] font-medium">
          Provider coverage
        </h2>
        <span className="text-[12px] text-muted-foreground">
          What Revokr detects versus what it can actually remediate for you.
        </span>
      </div>

      <TableScroller minWidth={620} label="Provider coverage">
        <TableHead columns={COLUMNS} labels={["Provider", "Secret types", "Detection", "Remediation", "What that means"]} />
        {PROVIDER_COVERAGE.map((row) => {
          const support = REMEDIATION_SUPPORT_META[row.remediation];
          return (
            <TableRow key={row.provider} columns={COLUMNS} className="py-3">
              <Cell className="text-[13px] font-medium">{row.name}</Cell>
              <Cell className="font-mono text-[11px] text-muted-foreground">{row.secretTypes}</Cell>
              <StatusCell className="text-resolved">Detected</StatusCell>
              <StatusCell className={support.text}>{support.label}</StatusCell>
              <Cell className="text-[12px] leading-[1.5] text-muted-foreground">{row.note}</Cell>
            </TableRow>
          );
        })}
      </TableScroller>

      <p className="m-0 px-[18px] py-3.5 text-[12px] leading-[1.55] text-approval">
        Detected does not mean remediated. Where remediation is manual, Revokr opens an incident with
        numbered steps and never claims the credential was rotated.
      </p>
    </Card>
  );
}
