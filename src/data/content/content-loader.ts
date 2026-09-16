/**
 * Content loader — imports README excerpts for research projects so they
 * can be served by the virtual filesystem without bloating the manifest.
 *
 * These are verbatim excerpts transcribed from the cloned repo's
 * research/{scrapling,agent-reach}/README.md files.
 */
import SCRAPLING from "@/data/content/scrapling.md";
import AGENT_REACH from "@/data/content/agent-reach.md";

export const SCRAPLING_MD = SCRAPLING;
export const AGENT_REACH_MD = AGENT_REACH;
