import { Automerge } from "../deps.js";
/**
 * Keep 2 automerge documents fully in sync with each other. The difference with {@link syncAutomergeDocuments} is
 * that the input state is not mutated. This can be especially useful when 1 document (e.g., a server) syncs to multiple
 * clients, in which case they need a different syncState for each client. In that case, the "server document" can be
 * added to an object that serves as the prototype of the objects that keep the syncState. In this case the property
 * server.doc can be accessed, but cannot be written to (as it would be added to the lowest object in the prototype chain,
 * and not the shared object that keeps the document state).
 * @param docA An object which specifies a {@link Automerge.Doc} and a {@link Automerge.SyncState}
 * @param docB An object which specifies a {@link Automerge.Doc} and a {@link Automerge.SyncState}
 */
export function syncAutomergeDocuments2(docA, docB) {
    let syncMsg;
    let docADoc = docA.doc;
    let docASyncState = docA.syncState;
    let docBDoc = docB.doc;
    let docBSyncState = docB.syncState;
    let fullySynced = false;
    while (!fullySynced) {
        // assume that everything is synced before executing this turn, and if it turns out that it isn't,
        // then the flag will be set to "false" to try again in another turn
        fullySynced = true;
        [docASyncState, syncMsg] = Automerge.generateSyncMessage(docADoc, docASyncState);
        if (syncMsg !== null) {
            fullySynced = false;
            [docBDoc, docBSyncState] = Automerge.receiveSyncMessage(docBDoc, docBSyncState, syncMsg);
        }
        [docBSyncState, syncMsg] = Automerge.generateSyncMessage(docBDoc, docBSyncState);
        if (syncMsg !== null) {
            fullySynced = false;
            [docADoc, docASyncState] = Automerge.receiveSyncMessage(docADoc, docASyncState, syncMsg);
        }
    }
    return [docADoc, docASyncState, docBDoc, docBSyncState];
}
//# sourceMappingURL=syncAutomergeDocuments2.js.map