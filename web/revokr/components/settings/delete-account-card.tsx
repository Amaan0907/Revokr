"use client";

import { useId, useState } from "react";
import { Btn, Card, Eyebrow } from "@/components/ds/primitives";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ds/dialog";
import type { SessionMode } from "@/lib/session";

interface DeleteAccountCardProps {
  // What the person types to confirm: their GitHub username, or their Google email address.
  login: string;
  mode: SessionMode;
}

// The deletion itself is done by POST /api/account/delete, which checks the confirmation again on
// the server. Disabling the button here is only a convenience.
export function DeleteAccountCard({ login, mode }: DeleteAccountCardProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const inputId = useId();
  const confirmed = typed.trim().toLowerCase() === login.toLowerCase();
  const storesData = mode === "github";

  return (
    <Card as="section" aria-labelledby="delete-heading" className="flex flex-wrap items-center gap-3.5 border-[#b8625c]/30 p-5">
      <div className="flex min-w-[220px] flex-1 flex-col gap-[5px]">
        <h2 id="delete-heading" className="m-0 text-[14px] font-medium">
          Delete account
        </h2>
        <span className="text-[12px] leading-[1.6] text-muted-foreground">
          {storesData
            ? "Permanently removes your account and everything Revokr stored for it: connected repositories, incidents, remediation steps and audit entries."
            : "Signs you out and ends this session. Revokr stores nothing else for a Google account."}
        </span>
      </div>
      <Btn
        variant="danger"
        onClick={() => {
          setTyped("");
          setOpen(true);
        }}
      >
        Delete account…
      </Btn>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <Eyebrow>Confirm deletion</Eyebrow>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            {storesData ? (
              <>
                This can&apos;t be undone. Your connected repositories, their incidents, remediation steps and
                audit entries are deleted, and you are signed out. It doesn&apos;t undo anything already done
                to a credential, such as a key that was rotated.
              </>
            ) : (
              <>You will be signed out. Nothing else is stored for this account, so there is nothing more to delete.</>
            )}
          </DialogDescription>
          {storesData && (
            <DialogDescription>
              It also doesn&apos;t uninstall the GitHub App. To stop GitHub sending your pushes to Revokr, remove
              it at{" "}
              <a
                href="https://github.com/settings/installations"
                target="_blank"
                rel="noreferrer"
                className="text-[#f5f5f7] underline"
              >
                github.com/settings/installations
              </a>
              .
            </DialogDescription>
          )}

          <form action="/api/account/delete" method="post" className="flex flex-col gap-3.5">
            <label htmlFor={inputId} className="flex flex-col gap-1.5 text-[12px] text-muted-foreground">
              Type <span className="font-mono text-[#f5f5f7]">{login}</span> to confirm
              <input
                id={inputId}
                name="confirm"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full rounded-[12px] border border-white/12 bg-black px-3.5 py-2.5 font-mono text-[13px] text-[#f5f5f7] outline-none focus:border-white/30"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Btn type="submit" variant="danger" size="lg" disabled={!confirmed}>
                {storesData ? "Delete my account" : "Sign out"}
              </Btn>
              <Btn size="lg" onClick={() => setOpen(false)}>
                Cancel
              </Btn>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
