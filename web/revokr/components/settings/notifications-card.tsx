"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Btn, Card, Eyebrow } from "@/components/ds/primitives";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ds/dialog";
import type { NotifyChannel } from "@/lib/types";
import { cn } from "@/lib/utils";

const CHANNELS: Record<NotifyChannel, { label: string; prefixes: string[]; placeholder: string }> = {
  slack: {
    label: "Slack",
    prefixes: ["https://hooks.slack.com/"],
    placeholder: "https://hooks.slack.com/services/…",
  },
  discord: {
    label: "Discord",
    prefixes: ["https://discord.com/api/webhooks/", "https://discordapp.com/api/webhooks/"],
    placeholder: "https://discord.com/api/webhooks/…",
  },
};

// Webhook URLs are credentials: anyone holding one can post as the app. Once saved, only the host
// and the first path segment are shown.
function maskWebhook(url: string): string {
  try {
    const { origin, pathname } = new URL(url);
    const [first] = pathname.split("/").filter(Boolean);
    return `${origin}/${first ?? ""}/••••••••`;
  } catch {
    return "••••••••";
  }
}

interface Saved {
  channel: NotifyChannel;
  masked: string;
}

export function NotificationsCard() {
  const [channel, setChannel] = useState<NotifyChannel>("slack");
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const inputId = useId();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = (message: string) => {
    setStatus(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(null), 4000);
  };

  const save = () => {
    const url = draft.trim();
    const { label, prefixes } = CHANNELS[channel];
    if (!prefixes.some((prefix) => url.startsWith(prefix))) {
      setError(`That doesn't look like a ${label} webhook URL. It should start with ${prefixes[0]}`);
      return;
    }
    setError(null);
    setSaved({ channel, masked: maskWebhook(url) });
    setDraft("");
    flash(`Saved. Alerts will go to ${label}.`);
  };

  const remove = () => {
    setSaved(null);
    setDraft("");
    setError(null);
    setConfirmingRemove(false);
    flash("Channel removed.");
  };

  const showing = saved && saved.channel === channel ? saved.masked : CHANNELS[channel].placeholder;

  return (
    <Card as="section" aria-labelledby="notifications-heading" className="flex flex-col gap-3.5 p-5">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 id="notifications-heading" className="m-0 text-[14px] font-medium">
          Notifications
        </h2>
        <Eyebrow className="tracking-[.12em]">optional · one channel</Eyebrow>
      </div>

      <div role="radiogroup" aria-label="Channel" className="flex gap-1.5 self-start rounded-full border border-white/8 bg-white/4 p-1">
        {(Object.keys(CHANNELS) as NotifyChannel[]).map((id) => {
          const selected = channel === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setChannel(id);
                setError(null);
              }}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-1.5 text-[12px] font-medium",
                selected ? "bg-white/10 text-[#f5f5f7]" : "text-muted-foreground",
              )}
            >
              {CHANNELS[id].label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-[7px]">
        <label htmlFor={inputId}>
          <Eyebrow className="tracking-[.12em]">webhook url</Eyebrow>
        </label>
        <input
          id={inputId}
          type="url"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          placeholder={showing}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${inputId}-hint`}
          className="w-full rounded-[10px] border border-white/12 bg-black px-[13px] py-[11px] font-mono text-[12px] text-[#f5f5f7] outline-none placeholder:text-muted-foreground focus:border-white/30 aria-invalid:border-failed/60"
        />
        <span id={`${inputId}-hint`} className={cn("text-[12px]", error ? "text-failed" : "text-muted-foreground")}>
          {error ?? "Notifications never include the secret value — only repo, provider, severity and a link."}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Btn variant="primary" onClick={save} disabled={!draft.trim()}>
          Save channel
        </Btn>
        <Btn
          disabled={!saved}
          onClick={() => saved && flash(`Test message queued for ${CHANNELS[saved.channel].label}.`)}
        >
          Send test message
        </Btn>
        <Btn variant="danger" disabled={!saved} onClick={() => setConfirmingRemove(true)}>
          Remove
        </Btn>
        <span aria-live="polite" className="font-mono text-[11px] text-resolved">
          {status}
        </span>
      </div>

      <Dialog open={confirmingRemove} onOpenChange={setConfirmingRemove}>
        <DialogContent>
          <Eyebrow>Confirm removal</Eyebrow>
          <DialogTitle>Remove this channel?</DialogTitle>
          <DialogDescription>
            Revokr will stop posting to {saved ? CHANNELS[saved.channel].label : "it"}. Incidents and the audit
            log are not affected, and you can add a channel again at any time.
          </DialogDescription>
          <div className="flex flex-wrap gap-2">
            <Btn variant="danger" size="lg" onClick={remove}>
              Remove channel
            </Btn>
            <Btn size="lg" onClick={() => setConfirmingRemove(false)}>
              Cancel
            </Btn>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
