import { Automerge } from "../../deps.js";
import { change } from "./document.js";
/**
 * Patch a document. Returns a new document with the patch applied.
 * @param doc The document to patch
 * @param patch The patch to apply to the document.
 */
export function patch(doc, patch) {
    return change(doc, (d) => {
        Automerge.applyPatch(d, patch);
    });
}
//# sourceMappingURL=documentPatcher.js.map