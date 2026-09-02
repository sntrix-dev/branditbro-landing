/**
 * Site feature flags.
 *
 * PRICING_ENABLED — the whole pricing experience (the /pricing builder, its nav
 * + footer links, the homepage "typical bands" section, and every "get an
 * estimate / price this build" CTA across the site) is switched OFF for the v1
 * release. The pricing CODE is untouched — the builder component, the quote
 * endpoint and the learned model all still live in the repo. Flip this back to
 * `true` to bring the entire pricing UI back in one move; nothing else needs to
 * change.
 */
export const PRICING_ENABLED = false;
