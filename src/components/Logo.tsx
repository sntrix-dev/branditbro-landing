import Link from "next/link";

/** The wordmark: brandit·bro·. — "bro" in mango, the period in chili.
 *  Lowercase always, no container. (Brand-kit rule.) */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-[-0.045em] leading-none ${className}`}>
      brandit<span className="text-mango">bro</span>
      <span className="text-chili">.</span>
    </span>
  );
}

/** The mark: b. — period is mango on ink/cream, chili on sand.
 *  Below 16px the period is dropped (handled by caller via `bare`). */
export function Mark({
  className = "",
  dotColor = "text-mango",
  bare = false,
}: {
  className?: string;
  dotColor?: string;
  bare?: boolean;
}) {
  return (
    <span className={`font-display font-extrabold tracking-[-0.05em] leading-none inline-flex items-baseline ${className}`}>
      b{!bare && <span className={dotColor}>.</span>}
    </span>
  );
}

/** Nav lockup — links home. */
export function NavMark() {
  return (
    <Link
      href="/"
      aria-label="branditbro — home"
      className="font-display font-extrabold text-[22px] tracking-[-0.05em] leading-none text-cream"
    >
      b<span className="text-mango">.</span>
    </Link>
  );
}
