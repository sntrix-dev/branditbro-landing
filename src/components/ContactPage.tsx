"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useContent } from "@/components/ContentProvider";
import { PRICING_ENABLED } from "@/lib/flags";

const SERVICES: [string, string][] = [
  ["website", "Website"],
  ["app", "Mobile app"],
  ["branding", "Branding"],
  ["marketing", "Marketing"],
  ["video", "Video editing"],
  ["unsure", "Not sure yet"],
];
const LABELS = Object.fromEntries(SERVICES);

export default function ContactPage() {
  const { contact } = useContent();
  const params = useSearchParams();
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [est, setEst] = useState("");
  const [scope, setScope] = useState("");

  // prefill from the pricing estimator hand-off
  useEffect(() => {
    const svc = (params.get("svc") || "").split(",").filter(Boolean);
    if (svc.length) setPicked(Object.fromEntries(svc.map((k) => [k, true])));
    setEst(params.get("est") || "");
    setScope(params.get("scope") || "");
    if (params.get("when") === "soon") setNote("Looking to start as soon as possible.");
  }, [params]);

  const wa = contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : "";
  const canSubmit = name.trim().length > 1 && (phone.trim().length > 5 || /.+@.+\..+/.test(email));

  const toggle = (k: string) =>
    setPicked((p) => {
      const next = { ...p };
      if (next[k]) delete next[k];
      else next[k] = true;
      return next;
    });

  const services = useMemo(() => Object.keys(picked).filter((k) => picked[k]).map((k) => LABELS[k] || k), [picked]);

  const waMessage = () => {
    const parts = [
      `Hi ${contact.dmKeyword ? "" : ""}branditbro — new enquiry`,
      `Name: ${name}`,
      email ? `Email: ${email}` : "",
      company ? `Business: ${company}` : "",
      services.length ? `Need: ${services.join(", ")}` : "",
      est ? `Estimate: ${est}` : "",
      scope ? `Scope: ${scope}` : "",
      note ? `Note: ${note}` : "",
    ].filter(Boolean);
    return encodeURIComponent(parts.join("\n"));
  };

  const submit = async () => {
    if (!canSubmit || busy) return;
    setErr("");
    setBusy(true);

    // WhatsApp "also" — open within the click gesture so it isn't popup-blocked
    if (wa) {
      window.open(`${wa}?text=${waMessage()}`, "_blank", "noopener");
    }

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, company, note, services, est, scope }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !json.ok) throw new Error(json.error || "failed");
      setSent(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // Email failed, but if WhatsApp is configured the enquiry still went through there.
      if (wa) {
        setSent(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setErr("Something went wrong sending that. Please email us directly — the address is in the footer.");
      }
    } finally {
      setBusy(false);
    }
  };

  const firstName = name.trim().split(" ")[0];
  const inputCls =
    "font-sans text-[16px] text-ink py-[15px] px-[17px] rounded-[14px] border-[1.5px] border-ink/15 bg-[#FFFDFA] outline-none transition-colors focus:border-mango";

  return (
    <div className="font-sans bg-cream text-ink w-full min-h-screen overflow-x-clip">
      <div className="px-5 sm:px-10 pt-[116px] pb-[100px] flex justify-center">
        <div className="w-full max-w-[1120px] grid gap-10 lg:gap-[60px] items-start lg:grid-cols-[0.72fr_1.28fr]">
          {/* rail */}
          <aside className="lg:sticky lg:top-[110px] flex flex-col gap-7">
            <div className="flex flex-col gap-4">
              <span className="text-[12.5px] tracking-[0.3em] uppercase font-bold text-brown">Get in touch</span>
              <h1 className="font-display font-extrabold text-[clamp(34px,3.6vw,56px)] leading-[0.95] tracking-[-0.045em] m-0 balance">Tell us what you&apos;re trying to fix.</h1>
              <p className="m-0 text-[16.5px] leading-[1.55] text-brown-ink max-w-[34ch] pretty">One person reads every message that comes through here — no bot, no ticket queue, no sales sequence afterwards.</p>
            </div>
            <div className="flex flex-col gap-4 border-t-[1.5px] border-ink/12 pt-[26px]">
              <span className="text-[12px] tracking-[0.2em] uppercase font-bold text-brown-mid">What happens next</span>
              {[["01", "We reply on WhatsApp within one working day."], ["02", "A 30-minute call, no deck, to confirm what you actually need."], ["03", "Your itemised scope and final price, in writing, in 2–3 days."]].map(([n, b]) => (
                <div key={n} className="flex gap-[14px] items-start">
                  <span className="shrink-0 font-display font-extrabold text-[15px] text-mango">{n}</span>
                  <span className="text-[15px] leading-[1.45] text-brown-ink">{b}</span>
                </div>
              ))}
            </div>
            {wa && (
              <div className="flex flex-col gap-[10px] bg-sand rounded-[20px] p-[22px]">
                <span className="text-[12px] tracking-[0.2em] uppercase font-bold text-brown-mid">Rather just talk?</span>
                <span className="text-[15px] leading-[1.5]">Message us directly. Same person, faster.</span>
                <a href={wa} className="self-start mt-1 text-[14.5px] font-bold py-3 px-5 rounded-full bg-ink text-cream">WhatsApp us</a>
              </div>
            )}
          </aside>

          {/* card */}
          <div className="bg-white rounded-[32px] p-6 sm:p-10 shadow-[0_30px_60px_-40px_rgba(22,16,13,0.4)] flex flex-col gap-6">
            {est && !sent && PRICING_ENABLED && (
              <div className="flex flex-col gap-[14px] bg-ink text-cream rounded-[22px] p-[26px]" style={{ animation: "bibRise 520ms cubic-bezier(.16,.84,.28,1) both" }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12px] tracking-[0.2em] uppercase font-bold text-mango-soft">Your estimate came with you</span>
                  <span className="text-[12.5px] font-bold py-[6px] px-3 rounded-full text-mango-soft" style={{ background: "rgba(255,122,0,0.18)" }}>30% first-project discount held</span>
                </div>
                <span className="font-display font-extrabold text-[clamp(28px,3vw,40px)] leading-none tracking-[-0.045em] text-mango">{est}</span>
                <span className="text-[15px] leading-[1.5] text-cream/70">{scope ? `Scope you built: ${scope}` : "Scope carried over from the estimator"}</span>
                <span className="text-[13.5px] leading-[1.5] text-cream/50">An estimate, not a quote. We&apos;ll confirm the scope with you and send the firm number in writing.</span>
              </div>
            )}

            {!sent ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h2 className="font-display font-extrabold text-[clamp(24px,2.4vw,34px)] leading-[1.02] tracking-[-0.04em] m-0">{est && PRICING_ENABLED ? "Confirm your details and we’ll firm up the number" : "Tell us where you’re starting from"}</h2>
                  <p className="m-0 text-[15.5px] leading-[1.5] text-brown-mid">Takes about a minute. All we really need is your name and one way to reach you.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[13px] font-bold text-brown-mid">What do you need? <span className="font-medium text-[#A8907F]">Pick any</span></span>
                  <div className="flex flex-wrap gap-[9px]">
                    {SERVICES.map(([k, label]) => {
                      const on = !!picked[k];
                      return (
                        <button key={k} type="button" onClick={() => toggle(k)}
                          className={`cursor-pointer font-sans py-[11px] px-[18px] rounded-full text-[14.5px] font-bold border-[1.5px] transition-all duration-150 active:scale-[0.97] ${on ? "bg-ink text-cream border-ink" : "bg-white text-ink border-ink/20 hover:border-ink"}`}>{label}</button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-[14px]">
                  <label className="flex flex-col gap-[7px]">
                    <span className="text-[13px] font-bold text-brown-mid">Your name</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" className={inputCls} />
                  </label>
                  <div className="grid gap-[14px] sm:grid-cols-2">
                    <label className="flex flex-col gap-[7px]">
                      <span className="text-[13px] font-bold text-brown-mid">WhatsApp number <span className="font-medium text-[#A8907F]">Optional</span></span>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" inputMode="tel" className={inputCls} />
                    </label>
                    <label className="flex flex-col gap-[7px]">
                      <span className="text-[13px] font-bold text-brown-mid">Email <span className="font-medium text-[#A8907F]">Or WhatsApp, either works</span></span>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@work.com" inputMode="email" className={inputCls} />
                    </label>
                  </div>
                  <label className="flex flex-col gap-[7px]">
                    <span className="text-[13px] font-bold text-brown-mid">Business or brand name <span className="font-medium text-[#A8907F]">Optional</span></span>
                    <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="So we can look you up before we call" className={inputCls} />
                  </label>
                  <label className="flex flex-col gap-[7px]">
                    <span className="text-[13px] font-bold text-brown-mid">What are you trying to do? <span className="font-medium text-[#A8907F]">Optional</span></span>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="What's not working right now, what you've already tried, a link you like — whatever helps us come prepared." className={`${inputCls} leading-[1.45] resize-y`} />
                  </label>
                </div>

                {err && <span className="text-[14px] text-chili font-semibold">{err}</span>}

                <div className="flex flex-col gap-3">
                  <button type="button" onClick={submit} disabled={!canSubmit || busy}
                    className={`font-sans text-[16.5px] font-bold py-[18px] px-[30px] rounded-full border-0 transition-all duration-200 ${canSubmit && !busy ? "bg-mango text-ink cursor-pointer hover:-translate-y-[2px]" : "bg-[#F1E4D4] text-[#A8907F] cursor-not-allowed"}`}>
                    {busy ? "Sending…" : canSubmit ? (est ? "Send this and get my final price" : "Send it over") : "Add your name and one contact"}
                  </button>
                  <span className="text-center text-[13.5px] text-[#8A6B5B]">Sending this books nothing and costs nothing.</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-6 py-14 px-2">
                <div className="relative w-[88px] h-[88px] flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-[#E9F3F0]" style={{ animation: "bibPop 620ms cubic-bezier(.16,.84,.28,1) both" }} />
                  <span className="relative text-[34px]" style={{ animation: "bibPop 620ms 120ms cubic-bezier(.16,.84,.28,1) both" }}>✅</span>
                </div>
                <div className="flex flex-col gap-3 max-w-[44ch]">
                  <h2 className="font-display font-extrabold text-[clamp(26px,2.8vw,40px)] leading-[1.02] tracking-[-0.04em] m-0">{firstName ? `Got it, ${firstName}.` : "Got it."}</h2>
                  <p className="m-0 text-[16px] leading-[1.55] text-brown-ink">One of our team will get in touch with you shortly — usually on WhatsApp, within one working day. They&apos;ll confirm what you need and send your final price in writing.</p>
                  <p className="m-0 text-[14.5px] leading-[1.5] text-[#8A6B5B]">Nothing is booked and nothing is owed. If the quote doesn&apos;t work for you, just say so.</p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link href="/services" className="text-[15px] font-bold py-[15px] px-[26px] rounded-full bg-ink text-cream">See what we build</Link>
                  {wa && <a href={wa} className="text-[15px] font-bold py-[15px] px-[26px] rounded-full border-[1.5px] border-ink/20 text-ink hover:border-ink transition-colors">Message us now instead</a>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* pre-send FAQ */}
      <section className="bg-sand px-5 sm:px-10 py-20">
        <div className="max-w-[1120px] mx-auto grid gap-14 items-start lg:grid-cols-[0.8fr_1.2fr]">
          <h2 className="font-display font-extrabold text-[clamp(28px,3vw,44px)] leading-[0.98] tracking-[-0.04em] m-0 balance">Before you send it.</h2>
          <div className="flex flex-col gap-5">
            {[["I don't know what I need yet.", "That's a normal message to send. Describe the problem, not the solution — working out what to build is part of the first call."], ["Will I get chased with follow-ups?", "No. One reply, and one polite nudge if you go quiet. You're not entering a funnel."], ["Is my budget too small?", "Say the number in the message. We'll either cut scope until it fits or tell you honestly that it doesn't — both answers come free."]].map(([q, a], i, arr) => (
              <div key={q} className={`flex flex-col gap-[6px] ${i < arr.length - 1 ? "border-b border-ink/15 pb-[18px]" : ""}`}>
                <span className="text-[16.5px] font-bold">{q}</span>
                <span className="text-[15.5px] leading-[1.5] text-brown-ink">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
