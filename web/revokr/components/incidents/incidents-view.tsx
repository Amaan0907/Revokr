"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, SearchX, X } from "lucide-react";
import { SeverityBars } from "./badges";
import { IncidentTable } from "./incident-table";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {/* An Apple segmented control; the selected pill slides between segments. */}
        <div
          role="group"
          aria-label="Filter by status"
          className="glass-control flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-full p-1 [scrollbar-width:none]"
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
                  "relative inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-ring",
                  selected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="incident-view-pill"
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-white/[0.16] shadow-[inset_0_1px_0_rgb(255_255_255/0.22),inset_0_-1px_0_rgb(255_255_255/0.05),0_2px_8px_-2px_rgb(0_0_0/0.5)]"
                    transition={{ type: "spring", stiffness: 520, damping: 40 }}
                  />
                )}
                <span className="relative">{view.label}</span>
                <span
                  className={cn(
                    "relative text-xs tabular-nums transition-colors",
                    selected ? "text-foreground/70" : "text-muted-foreground/70",
                  )}
                >
                  {counts[view.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full xl:w-80">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search repo, file or secret type"
            aria-label="Search incidents"
            className="glass-control h-10 w-full rounded-full pl-9 pr-9 text-sm outline-none transition-[background-color,box-shadow] duration-200 placeholder:text-muted-foreground focus:bg-white/[0.12] focus:ring-2 focus:ring-ring/60 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 grid size-5 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/25 text-black transition-colors hover:bg-white/40"
            >
              <X aria-hidden className="size-3" strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[13px] text-muted-foreground">Severity</span>
        {SEVERITY_ORDER.map((severity) => {
          const meta = SEVERITY_META[severity];
          const selected = query.severities.includes(severity);
          return (
            <button
              key={severity}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleSeverity(severity)}
              className={cn(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-[background-color,color,transform] duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-ring",
                selected
                  ? cn(meta.text, meta.bg, "ring-1 ring-inset ring-current/30")
                  : "glass-control text-muted-foreground hover:bg-white/[0.13] hover:text-foreground",
              )}
            >
              <SeverityBars level={meta.level} className={selected ? undefined : meta.text} />
              {meta.label}
            </button>
          );
        })}

        <p aria-live="polite" className="ml-auto text-[13px] tabular-nums text-muted-foreground">
          {results.length} of {incidents.length}
        </p>
        {isFiltered(query) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-link hover:text-link">
            Clear
          </Button>
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
        <div className="surface flex flex-col items-center gap-3 rounded-3xl px-6 py-20 text-center animate-in fade-in zoom-in-95 animation-duration-300">
          <span className="grid size-12 place-items-center rounded-full bg-white/[0.06]">
            <SearchX aria-hidden className="size-5 text-muted-foreground" />
          </span>
          <div>
            <p className="text-[17px] font-semibold">No results</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Try a different status or severity, or clear the search.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
