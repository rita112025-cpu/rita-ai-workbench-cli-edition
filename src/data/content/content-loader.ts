/**
 * Content loader — imports README excerpts for research projects so they
 * can be served by the virtual filesystem without bloating the manifest.
 *
 * Stored as .ts modules exporting verbatim strings (no markdown loader
 * or declaration file required).
 */
import { SCRAPLING_MD } from "./scrapling.md";
import { AGENT_REACH_MD } from "./agent-reach.md";

export { SCRAPLING_MD, AGENT_REACH_MD };
