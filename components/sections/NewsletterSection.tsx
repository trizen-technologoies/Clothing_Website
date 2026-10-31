"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { btnArrow } from "@/components/ui/buttons";
import { SectionLabel } from "@/components/ui/SectionLabel";

type Status = "idle" | "pending" | "done" | "error";

/** Scene 7 — newsletter. Demo only: nothing is stored or sent. */
export function NewsletterSection() {
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");
  const inputId = useId();
  const messageId = useId();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      return;
    }
    setStatus("pending");
    // Simulated latency — connect an email provider here (see README).
    window.setTimeout(() => setStatus("done"), 700);
  }

  return (
    <section aria-labelledby="newsletter-title" className="relative overflow-hidden border-t border-line py-24 md:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(60%_70%_at_70%_100%,black,transparent)]"
      />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 right-[10%] h-80 w-[40rem] rounded-full bg-cyan/10 blur-[120px]" />

      <div className="relative mx-auto grid max-w-[1600px] gap-12 px-4 sm:px-6 md:grid-cols-12 lg:px-10">
        <div className="md:col-span-7">
          <SectionLabel index="08">Signal</SectionLabel>
          <h2 id="newsletter-title" className="font-display-x mt-6 text-[clamp(4rem,10vw,10rem)]">
            Join the
            <br />
            signal.
          </h2>
        </div>

        <div className="self-end md:col-span-5">
          <p className="max-w-sm leading-relaxed text-fg/75">
            Early access to drops, restocks and events. One email a month — no noise.
          </p>

          {status === "done" ? (
            <p role="status" className="mt-8 flex items-start gap-3 border border-line p-5 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-cyan" />
              <span>
                You&apos;re on the list.
                <span className="mt-1 block text-muted">Demo store — your email was not stored or sent anywhere.</span>
              </span>
            </p>
          ) : (
            <form onSubmit={submit} noValidate className="mt-8">
              <label htmlFor={inputId} className="eyebrow text-muted">
                Email address
              </label>
              <div className="mt-3 flex border-b border-line-strong transition-colors focus-within:border-fg">
                <input
                  id={inputId}
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  aria-invalid={status === "error"}
                  aria-describedby={messageId}
                  placeholder="you@domain.com"
                  className="h-14 min-w-0 flex-1 bg-transparent text-lg placeholder:text-muted/50 focus:outline-none"
                />
                <button type="submit" disabled={status === "pending"} className="group/btn eyebrow inline-flex items-center gap-2 pl-4 text-fg transition-colors hover:text-cyan">
                  {status === "pending" ? <Loader2 className="size-4 animate-spin" /> : <>Subscribe <ArrowRight className={btnArrow} /></>}
                </button>
              </div>
              <p id={messageId} aria-live="polite" className={`mt-3 text-xs ${status === "error" ? "text-danger" : "text-muted"}`}>
                {status === "error" ? "Enter a valid email address." : "By subscribing you agree to the privacy policy. Unsubscribe anytime."}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
