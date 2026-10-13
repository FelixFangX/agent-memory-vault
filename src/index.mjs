import { registerLineRules } from "./check.mjs";
import { PRIVACY_RULES } from "./privacy.mjs";

registerLineRules(PRIVACY_RULES);

export { checkVault, SCOPES, SOURCES, REQUIRED } from "./check.mjs";
export { PRIVACY_RULES } from "./privacy.mjs";
