import { Automerge } from "../../deps.js";
import { validatePatches } from "./validatePatches.js";
import { SecurityError } from "../../mod.js";
function sanitizeCommits(secureDoc, sharedBase, insecureDocToMerge, securityPolicy, userEnv) {
    const securityCheck = (patches, insecureBeforeDoc) => {
        // check the validity of the patches against both the leader's secure doc and the client's doc
        // this ensures that we check that the client was allowed to make the changes locally, and that
        // the changes are still allowed in the main (secure) doc.
        validatePatches(patches, secureDoc, securityPolicy, userEnv);
        validatePatches(patches, insecureBeforeDoc, securityPolicy, userEnv);
    };
    const sanitizedCommits = [];
    const securityViolations = [];
    /**
     *  There have been problems in the past where the Automerge API did not return the expected changes or change hashes
     *  that should be sanitized. For verbose debugging reasons, we will collect stats about exactly which change hashes
     *  should be included in the sanitized fork, and the hashes that come afterwards are not included in the commit.
     *
     *  To get an array of hashes (of changes that happened in the insecure doc) that should be included in the commit:
     *    (1) Collect the entire history of the insecure doc from old to new.
     *    (2) Remove all history that occurred before the hash of the shared base, {@link options.from}
     *    (3) Remove all history that occurred after the hash of the insecure doc that was used in the commit, {@link options.to}
     *
     *  To get an array of hashes (of changes that happened in the insecure doc) that happened after the commit:
     *    (1) Collect the entire history of the insecure doc from old to new.
     *    (2) Remove all history that occurred before (and including) the hash of the insecure doc that was used in the commit, {@link options.to}
     *  */
    const entireHistory = Automerge.topoHistoryTraversal(insecureDocToMerge);
    let fromHeads = Automerge.getHeads(sharedBase);
    const changesSince = Automerge.getChangesSince(insecureDocToMerge, fromHeads);
    /**
     * Automerge Heads is an array because there can be two separate "branches" that are merged.
     * They can be thought of as each head as being the last element of a linked list.
     * Yet, {@link Automerge.topoHistoryTraversal} returns a flat list of hashes.
     * This can be tested as follows:
     *
     * let doc1 = Automerge.init();
     * let doc2 = Automerge.clone(doc1);
     * doc1 = Automerge.change(doc1, (d: any)=> d.x = 1);
     * doc1 = Automerge.change(doc1, (d: any)=> d.x = 2);
     * doc2 = Automerge.change(doc2, (d: any)=> d.y = 1);
     * doc2 = Automerge.change(doc2, (d: any)=> d.y = 2);
     * const doc3 = Automerge.merge(doc1, doc2);
     * console.log(Automerge.getHeads(doc3));
     * console.log(Automerge.topoHistoryTraversal(doc3));
     *
     * Thus, to get the part of the history between two points, we need to start from the earliest
     */
    const insecureChanges = Automerge.getChanges(sharedBase, insecureDocToMerge);
    console.debug(`secureMerge sanitizeCommits stats:
secureDoc latest heads: ${Automerge.getHeads(secureDoc)}
sharedBase heads: ${Automerge.getHeads(sharedBase)}
insecureDocToMerge heads: ${Automerge.getHeads(insecureDocToMerge)}
number of changes to process: ${insecureChanges.length}
hashes of those changes: ${JSON.stringify(insecureChanges.map((val) => Automerge.decodeChange(val).hash))}
entire history: ${JSON.stringify(entireHistory)}
entire history (clone): ${JSON.stringify(Automerge.topoHistoryTraversal(Automerge.clone(insecureDocToMerge)))}
changes since: ${JSON.stringify(changesSince.map(Automerge.decodeChange).map((v) => v.hash))}
changes since (clone): ${JSON.stringify(Automerge.getChangesSince(Automerge.clone(insecureDocToMerge), fromHeads).map(Automerge.decodeChange).map((v) => v.hash))}
`);
    console.debug(``);
    for (const change of insecureChanges) {
        const decodedChange = Automerge.decodeChange(change);
        const changeHash = decodedChange.hash;
        const nextHeads = [changeHash];
        const diff = Automerge.diff(insecureDocToMerge, fromHeads, nextHeads);
        console.debug("Sanitizing diff between heads %j and %j: ", fromHeads, nextHeads, diff);
        try {
            securityCheck(diff, Automerge.view(insecureDocToMerge, fromHeads));
            sanitizedCommits.push(diff);
        }
        catch (error) {
            if (error instanceof SecurityError) {
                securityViolations.push(diff);
            }
            else {
                // if it's not a security error, re-throw as to not accidentally catch it.
                throw error;
            }
        }
        finally {
            fromHeads = nextHeads;
        }
    }
    return [sanitizedCommits, securityViolations];
}
/**
 * This function takes care of securely merging two documents that depart from a shared base.
 * It follows the diagram below, where commits A, B and C are the secure document,
 * commit A is the shared base, and commits D and E are added in the insecure document and are potentially in
 * violation of the security policy.
 *
 * The SecureMerge algorithm establishes a sanitized fork of the document that departs from commit A, and that
 * applies only the commits which are not violating. In the diagram below (right), commit D was found to be violating,
 * so it was not applied to the sanitized document.
 *
 * Then, the sanitized fork and the secure fork are merged in order to establish a new (secure) shared base in commit F.
 *
 *                                       secure fork (= new shared base)
 *                                        ┌───┐
 *                                        │ F ◄────┐
 *                                        └─▲─┘    │
 *        secure                            │      │
 *        fork                              │      │
 *         ┌───┐  ┌───┐                   ┌─┴─┐  ┌─┴─┐
 *         │ C │  │ E │                   │ C │  │ E │
 *         └─▲─┘  └─▲─┘                   └─▲─┘  └─▲─┘
 *           │      │                       │      │
 *           │      │                       │      │
 *         ┌─┴─┐  ┌─┴─┐    securemerge    ┌─┴─┐  ┌───┐ sanitized
 *         │ B │  │ D │        ───►       │ B │  │ x │ commit
 *         └─▲─┘  └─▲─┘                   └─▲─┘  └───┘
 *           │      │                       │      │
 *           │      │                       │      │
 *         ┌─┴─┐    │                     ┌─┴─┐    │
 *         │ A ├────┘ insecure fork       │ A ├────┘ sanitized fork
 *         └───┘                          └───┘
 *      shared base                    shared base
 *
 *
 *
 * It is important that the actor ids of the secure and insecure documents are known, such that the sanitized fork
 * can be built using the actor id that was originally used to build the insecure document.
 * From the server's perspective, this essentially impersonates the client such that it yields the same result as the client.
 * This is important such that the outcome of SecureMerge yields exactly the same result, up to the level of how the
 * documents are stored in memory.
 *
 * Actor ids left vs. right-side of the diagram:
 *   - The secure fork always ends up with the same actor id:
 *     (left) secure fork = actor-id X, (right) secure fork = actor-id X
 *   - The insecure fork on the client has the same actor id that will be used to create the sanitized fork:
 *     (left) insecure fork = actor-id Y, (right) sanitized fork = actor-id Y
 *
 * @param secureDoc The secure document
 * @param insecureDoc The insecure document
 * @param securityPolicy The security policy that determines whether operations from the insecure document are allowed or not
 * @param userEnv The user environment needed to correctly evaluate the security policy
 * @param options Mandatory options to configure where the algorithm starts and stops, as well as actor ids.
 */
export function secureMerge(secureDoc, insecureDoc, securityPolicy, userEnv, options) {
    console.debug(`SecureMerge: start`);
    const sharedBase = Automerge.view(insecureDoc, options.from);
    // get the insecure document to merge, which is not necessarily the entire document insecureDoc.
    // at this time, it is necessary to make a clone since certain operations to query the history of a document
    // will still operate on the full document, rather than the view at the heads that we want to merge at.
    const insecureDocToMerge = Automerge.clone(Automerge.view(insecureDoc, options.to));
    // Collect the commits that will not be included in the new secure document
    const unappliedChanges = Automerge.getChangesSince(insecureDoc, options.to);
    // ignore the first included change because this includes changes that were already included in the merged doc
    /*if (unappliedChanges.length > 0) {
        const [head, ...tail] = unappliedChanges;
        unappliedChanges = tail;
    }*/
    const unappliedCommits = [];
    let fromHeads = options.to;
    for (const change of unappliedChanges) {
        const decodedChange = Automerge.decodeChange(change);
        const changeHash = decodedChange.hash;
        const nextHeads = [changeHash];
        const diff = Automerge.diff(insecureDocToMerge, fromHeads, nextHeads);
        unappliedCommits.push(diff);
        fromHeads = nextHeads;
    }
    console.debug(`SecureMerge: starting sync of documents from shared heads: `, options.from, "to insecureDoc's heads:", options.to);
    console.debug(`SecureMerge: Secure doc: `, secureDoc, "with history (from old to new): ", Automerge.topoHistoryTraversal(secureDoc));
    console.debug(`SecureMerge: Insecure doc: `, insecureDoc, "with history (from old to new): ", Automerge.topoHistoryTraversal(insecureDocToMerge));
    const [sanitizedCommits, violatingCommits] = sanitizeCommits(secureDoc, sharedBase, insecureDocToMerge, securityPolicy, userEnv);
    if (sanitizedCommits.length === 0) {
        return {
            newSecureDoc: secureDoc,
            includedCommits: sanitizedCommits,
            securityViolatingCommits: violatingCommits,
            notIncludedCommits: unappliedCommits,
        };
    }
    let sanitizedFork = Automerge.clone(sharedBase, { actor: options.sanitizedForkActorId });
    console.debug(`SecureMerge: applying sanitized commits to shared base using actor id:`, Automerge.getActorId(sanitizedFork));
    for (const commit of sanitizedCommits) {
        if (commit.length > 0) {
            sanitizedFork = Automerge.change(sanitizedFork, {
                patchCallback: (patches, info) => {
                    console.debug("SecureMerge: built sanitized fork (= shared base + sanitized patches), patches were: ", patches);
                }
            }, (d) => {
                Automerge.applyPatches(d, commit);
            });
        }
    }
    const merged = Automerge.merge(secureDoc, sanitizedFork);
    console.debug(`SecureMerge: Client sanitized commits: `, JSON.stringify(sanitizedCommits));
    console.debug(`SecureMerge: Client violating commits: `, JSON.stringify(violatingCommits));
    //console.debug(`SecureMerge: binary changes: `, Automerge.getChanges(sharedBase, merged).map(Automerge.decodeChange));
    console.debug(`SecureMerge: merged branches`, merged);
    console.debug(`SecureMerge actor id stats:
 - requested Actor id for secure doc: ${options.secureDocActorId}
 - current actor id of secure doc    : ${Automerge.getActorId(secureDoc)}
 - requested actor id for secure fork: ${options.sanitizedForkActorId}
 - actual actor id for secure fork   : ${Automerge.getActorId(sanitizedFork)}
 - secure fork actor id, i.e., new shared base actor id: ${Automerge.getActorId(merged)}`);
    return {
        newSecureDoc: merged,
        includedCommits: sanitizedCommits,
        securityViolatingCommits: violatingCommits,
        notIncludedCommits: unappliedCommits,
    };
}
//# sourceMappingURL=secureMerge.js.map