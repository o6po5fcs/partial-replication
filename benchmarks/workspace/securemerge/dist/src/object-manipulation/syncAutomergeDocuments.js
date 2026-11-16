import { Automerge } from "../deps.js";
/**
 * Keep 2 automerge documents fully in sync with each other. The 2 objects given as input will be mutated.
 * @param docA An object which specifies a {@link Automerge.Doc} and a {@link Automerge.SyncState}
 * @param docB An object which specifies a {@link Automerge.Doc} and a {@link Automerge.SyncState}
 */
export function syncAutomergeDocuments(docA, docB) {
    let syncMsg;
    let fullySynced = false;
    while (!fullySynced) {
        // assume that everything is synced before executing this turn, and if it turns out that it isn't,
        // then the flag will be set to "false" to try again in another turn
        fullySynced = true;
        [docA.syncState, syncMsg] = Automerge.generateSyncMessage(docA.doc, docA.syncState);
        if (syncMsg !== null) {
            fullySynced = false;
            [docB.doc, docB.syncState] = Automerge.receiveSyncMessage(docB.doc, docB.syncState, syncMsg);
        }
        [docB.syncState, syncMsg] = Automerge.generateSyncMessage(docB.doc, docB.syncState);
        if (syncMsg !== null) {
            fullySynced = false;
            [docA.doc, docA.syncState] = Automerge.receiveSyncMessage(docA.doc, docA.syncState, syncMsg);
        }
    }
}
//# sourceMappingURL=syncAutomergeDocuments.js.map