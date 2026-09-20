"use client";

import { useEffect, useMemo, useState } from "react";
import { Btn, Card, PILL } from "@/components/ds/primitives";
import { IncidentTable } from "./incident-table";
import { SEVERITY_META, SEVERITY_ORDER } from "@/lib/incident-meta";
import {
  applyIncidentQuery,
  countByView,
  DEFAULT_QUERY,
  isFiltered,
  toSearchParams,
  VIEWS,
  type IncidentQuery,
  type SortKey,
} from "@/lib/incident-query";
import type { Incident, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

interface IncidentsViewProps {
  incidents: Incident[];
  initialQuery: IncidentQuery;
}

export function IncidentsView({ incidents, initialQuery }: IncidentsViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery.search);

  // Filtering happens in the browser; the URL is kept in sync so a filtered view can be shared.
  useEffect(() => {
    const params = toSearchParams(query).toString();
    window.history.replaceState(null, "", params ? `?${params}` : window.location.pathname);
  }, [query]);

  const results = useMemo(() => applyIncidentQuery(incidents, query), [incidents, query]);
  const counts = useMemo(() => countByView(incidents, query), [incidents, query]);

  const update = (changes: Partial<IncidentQuery>) => setQuery((q) => ({ ...q, ...changes }));

  const setSearch = (value: string) => {
    setSearchInput(value);
    update({ search: value.trim() });
  };

  const toggleSeverity = (severity: Severity) =>
    update({
      severities: query.severities.includes(severity)
        ? query.severities.filter((s) => s !== severity)
        : SEVERITY_ORDER.filter((s) => s === severity || query.severities.includes(s)),
    });

  const toggleSort = (key: SortKey) =>
    update(
      query.sort === key
        ? { direction: query.direction === "desc" ? "asc" : "desc" }
        : { sort: key, direction: "desc" },
    );

  const clearFilters = () => {
    setSearchInput("");
    update({ view: DEFAULT_QUERY.view, severities: [], search: "" });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <div
          role="group"
          aria-label="Filter by status"
          className="flex max-w-full flex-wrap gap-1.5 rounded-full border border-white/8 bg-white/4 p-1"
        >
          {VIEWS.map((view) => {
            const selected = query.view === view.id;
            return (
              <button
                key={view.id}
                type="button"
                aria-pressed={selected}
                onClick={() => update({ view: view.id })}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium",
                  selected ? "bg-white/10 text-[#f5f5f7]" : "text-muted-foreground hover:text-[#f5f5f7]",
                )}
              >
                {view.label}
                <span className="font-mono text-[11px] font-normal text-muted-foreground">{counts[view.id]}</span>
              </button>
            );
          })}
        </div>

        <label className={cn(PILL, "ml-auto py-1.5 focus-within:border-white/20")}>
          <span aria-hidden className="font-mono text-[11px] text-muted-foreground">
            ⌕
          </span>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search repo, file or secret type"
            aria-label="Search incidents"
            className="w-[210px] bg-transparent text-[12px] text-[#f5f5f7] outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[11px] text-muted-foreground">severity</span>
        {SEVERITY_ORDER.map((severity) => {
          const selected = query.severities.includes(severity);
          return (
            <button
              key={severity}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleSeverity(severity)}
              className={cn(
                "flex cursor-pointer items-center gap-[7px] rounded-full border px-[13px] py-[7px] font-mono text-[10px] font-medium uppercase tracking-[.1em]",
                selected ? "border-white/30 bg-white/10" : "border-white/8 bg-white/4 hover:border-white/16",
                SEVERITY_META[severity].text,
              )}
            >
              <span aria-hidden className="size-1.5 rounded-full bg-current" />
              {severity}
            </button>
          );
        })}

        <span aria-live="polite" className="ml-auto font-mono text-[11px] text-muted-foreground">
          {results.length} of {incidents.length}
        </span>
        {isFiltered(query) && (
          <Btn size="sm" onClick={clearFilters}>
            Clear
          </Btn>
        )}
      </div>

      {results.length > 0 ? (
        <IncidentTable
          key={toSearchParams(query).toString()}
          incidents={results}
          query={query}
          onSort={toggleSort}
        />
      ) : (
        <Card as="section" className="flex max-w-[560px] flex-col items-start gap-3 rounded-[20px] p-8">
          <h2 className="m-0 text-xl font-medium tracking-[-.02em]">No results</h2>
          <p className="m-0 text-[13px] leading-[1.6] text-muted-foreground">
            Nothing matches this status, severity and search. Try a different one, or clear the filters.
          </p>
          <Btn size="sm" onClick={clearFilters}>
            Clear filters
          </Btn>
        </Card>
      )}
    </>
  );
}
