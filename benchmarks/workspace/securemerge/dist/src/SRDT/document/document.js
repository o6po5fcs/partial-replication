import { Automerge, fromBase64, toBase64 } from "../../deps.js";
import { validatePatches } from "./validatePatches.js";
import { SECURITY_POLICY, USER_ENVIRONMENT } from "../types.js";
/**
 * Get the metadata of a {@link Document}
 * @param data a {@link Document}
 */
function getMetadata(data) {
    if (!Reflect.has(data, SECURITY_POLICY) || !Reflect.has(data, USER_ENVIRONMENT))
        throw RangeError("Malformed SRDT object");
    else
        return [
            Reflect.get(data, SECURITY_POLICY),
            Reflect.get(data, USER_ENVIRONMENT)
        ];
}
/**
 * Add a {@link SecurityPolicy} to the metadata of a {@link Document}
 * @param data The {@link Document} to store the security policy in
 * @param securityPolicy The {@link SecurityPolicy} to store in the document
 */
function setSecurityPolicy(data, securityPolicy) {
    /*    if (!Reflect.has(data, SECURITY_POLICY)) {
            Object.defineProperty(data, SECURITY_POLICY, {
                enumerable: false,
                writable: true,
            });
        }*/
    Reflect.set(data, SECURITY_POLICY, securityPolicy);
}
/**
 * Add a {@link UserEnvironment} to the metadata of a {@link Document}
 * @param data The {@link Document} to store the security policy in
 * @param userEnv The {@link UserEnvironment} to store in the document
 */
function setUserEnvironment(data, userEnv) {
    /*if (!Reflect.has(data, USER_ENVIRONMENT)) {
        Object.defineProperty(data, USER_ENVIRONMENT, {
            configurable: false,
            enumerable: false,
            writable: true,
        });
    }*/
    Reflect.set(data, USER_ENVIRONMENT, userEnv);
}
/**
 * Convert an Automerge {@link Automerge.Doc} document to an SRDT. This adds the necessary metadata to the document.
 * @param securityPolicy A {@link SecurityPolicy} for the SRDT
 * @param userEnv A {@link UserEnvironment} for the SRDT
 * @param automergeDoc The {@link Automerge.Doc} to transform
 */
export function automergeToSRDT(securityPolicy, userEnv, automergeDoc) {
    setSecurityPolicy(automergeDoc, securityPolicy);
    setUserEnvironment(automergeDoc, userEnv);
    return automergeDoc;
}
/**
 * Transform an SRDT {@link Document} back to an Automerge {@link Automerge.Doc} document.
 * Since SRDT docs are supposed to be fully compatible with Automerge documents, this only does a type conversion to
 * make the typesystem happy.
 *
 * @param doc The SRDT {@link Document} to transform into a normal Automerge doc.
 */
function SRDTToAutomerge(doc) {
    return doc;
}
/**
 * Transform {@link LoadOptions} to {@link Automerge.InitOptions}
 * @param srdtInitOpts SRDT Init options
 * @returns Automerge init options
 */
function SRDTInitOptionsToAutomergeInitOptions(srdtInitOpts) {
    const initOptions = {};
    if (srdtInitOpts?.actorId) {
        initOptions.actor = srdtInitOpts.actorId;
    }
    return initOptions;
}
/**
 * Initialize a new (empty) SRDT {@link Document}.
 *
 * @param securityPolicy A {@link SecurityPolicy} enforced by the SRDT
 * @param userEnv A {@link UserEnvironment} to correctly evaluate the given security policy
 * @param opts Initialisation options
 * @returns an empty SRDT document
 */
export function init(securityPolicy, userEnv, opts) {
    const initOptions = SRDTInitOptionsToAutomergeInitOptions(opts);
    const automergeDoc = Automerge.init(initOptions);
    return automergeToSRDT(securityPolicy, userEnv, automergeDoc);
}
/**
 * Initialize an SRDT {@link Document} with an existing JavaScript object.
 *
 * @param securityPolicy A {@link SecurityPolicy} enforced by the SRDT
 * @param userEnv A {@link UserEnvironment} to correctly evaluate the given security policy
 * @param data The JavaScript object which holds the data with which the document should be initialized
 * @returns an SRDT document
 */
export function from(securityPolicy, userEnv, data) {
    const automergeDoc = Automerge.from(data);
    return automergeToSRDT(securityPolicy, userEnv, automergeDoc);
}
/**
 * Save an SRDT document to a serialised format. Restore the SRDT document using {@link load}.
 * @param doc A document to serialise.
 */
export function save(doc) {
    if (typeof doc !== "object") {
        throw new RangeError("Expected a document");
    }
    const [secPol, userEnv] = getMetadata(doc);
    return saveAutomerge(doc, secPol, userEnv);
}
/**
 * Get the security policy of a {@link Document}.
 * @param doc The document to get the security policy from.
 */
export function getSecurityPolicy(doc) {
    const [securityPolicy, _] = getMetadata(doc);
    return securityPolicy;
}
/**
 * Get the user environment of a {@link Document}.
 * @param doc The document to get the user environment from.
 */
export function getUserEnvironment(doc) {
    const [_, userEnv] = getMetadata(doc);
    return userEnv;
}
/**
 * Save an Automerge document to a serialised format which can be restored as an SRDT document using {@link load}.
 * @param doc An Automerge document to serialise.
 * @param securityPolicy A security policy
 * @param userEnvironment A user environment
 */
export function saveAutomerge(doc, securityPolicy, userEnvironment) {
    if (typeof doc !== "object") {
        throw new RangeError("Expected a document");
    }
    const serialisedDoc = Automerge.save(doc);
    return JSON.stringify({
        securityPolicy: securityPolicy,
        userEnvironment: userEnvironment,
        serialisedDoc: toBase64(serialisedDoc)
    });
}
/**
 * Given a serialized SRDT document (i.e., data), turn it into a proper SRDT {@link Document}
 * @param data Serialized data, generated via the {@link save} function.
 * @param opts Initialisation options
 */
export function load(data, opts) {
    const deserialisedData = JSON.parse(data);
    if (typeof deserialisedData === "object"
        && Reflect.has(deserialisedData, "securityPolicy")
        && Reflect.has(deserialisedData, "userEnvironment")
        && Reflect.has(deserialisedData, "serialisedDoc")) {
        const securityPolicy = deserialisedData.securityPolicy;
        const userEnv = deserialisedData.userEnvironment;
        const serialisedDoc = fromBase64(deserialisedData.serialisedDoc);
        const initOptions = SRDTInitOptionsToAutomergeInitOptions(opts);
        const restoredAutomergeDoc = Automerge.load(serialisedDoc, initOptions);
        return automergeToSRDT(securityPolicy, userEnv, restoredAutomergeDoc);
    }
    else {
        throw new RangeError("Deserialised data is not as expected");
    }
}
/**
 * Wrap the Automerge {@link Automerge.ChangeOptions} with additional functionality required by an SRDT {@link Document}
 * @param doc An SRDT {@link Document}
 * @param options Automerge's {@link Automerge.ChangeOptions} to wrap
 */
function wrapAutomergeChangeOptions(doc, options) {
    // check what the original options are.
    // if they are undefined, return empty object
    if (options === undefined) {
        return {};
    }
    else if (typeof options === "string") {
        // if the options are just a string, return the message
        return {
            message: options
        };
    }
    else {
        // else they must be an object. Copy over the present values.
        const wrappedOptions = {};
        if (Reflect.has(options, "message"))
            wrappedOptions.message = options.message;
        if (Reflect.has(options, "time"))
            wrappedOptions.time = options.time;
        if (Reflect.has(options, "patchCallback")) {
            // Wrap the patchCallback such that it appears to be a patchCallback for SRDT documents
            // instead of a patchCallback for plain Automerge documents
            const [securityPolicy, userEnv] = getMetadata(doc);
            wrappedOptions.patchCallback =
                (automergePatches, automergeInfo) => {
                    const wrappedPatchInfo = wrapPatchInfo(automergeInfo, securityPolicy, userEnv);
                    if (typeof options.patchCallback === "function")
                        return options.patchCallback(automergePatches, wrappedPatchInfo);
                    else
                        throw new RangeError("patchCallback must be a function");
                };
        }
        return wrappedOptions;
    }
}
/**
 * Wrap the Automerge {@link Automerge.PatchInfo} such that it appears to be SRDT {@link PatchInfo}.
 * @param patchInfo Automerge's PatchInfo to wrap
 * @param securityPolicy The {@link SecurityPolicy} of the SRDT
 * @param userEnv The {@link UserEnvironment} of the SRDT
 */
function wrapPatchInfo(patchInfo, securityPolicy, userEnv) {
    return {
        before: automergeToSRDT(securityPolicy, userEnv, patchInfo.before),
        after: automergeToSRDT(securityPolicy, userEnv, patchInfo.after),
        source: patchInfo.source
    };
}
/**
 * Update the contents of an SRDT {@link Document}.
 * @param doc The {@link Document} to update
 * @param callback A callback that contains the updates that should occur to the document
 * @param options Optional {@link ChangeOptions}
 * @returns doc an updated document
 * @throws SecurityError when the changes are forbidden.
 */
export function change(doc, callback, options) {
    const [securityPolicy, userEnv] = getMetadata(doc);
    const wrappedOptions = wrapAutomergeChangeOptions(doc, options);
    const originalPatchCallback = wrappedOptions.patchCallback;
    wrappedOptions.patchCallback = (patches, info) => {
        validatePatches(patches, info.before, securityPolicy, userEnv);
        if (originalPatchCallback !== undefined) {
            originalPatchCallback(patches, info);
        }
    };
    const automergeDoc = SRDTToAutomerge(doc);
    const updatedDoc = Automerge.change(automergeDoc, wrappedOptions, callback);
    return automergeToSRDT(securityPolicy, userEnv, updatedDoc);
}
/**
 * Initialise the {@link SyncState} of a document
 */
export function initSyncState() {
    return Automerge.initSyncState();
}
/**
 * Merge two documents. The resulting document will have the security policy and user environment of the first argument ({@link local}).
 * Both arguments to merge are frozen after the call, so these documents can no longer be mutated (e.g., through {@link change}).
 * The symptom of this will be an error which says "Attempting to change an out of date document".
 * To overcome, you can use {@link clone} before passing the documents to merge.
 * @param local The document to merge changes into
 * @param remote The document to merge changes from
 */
export function merge(local, remote) {
    const [secPol, userEnv] = getMetadata(local);
    const mergedDoc = Automerge.merge(local, remote);
    const localHeads = getHeads(local);
    const updatedHeads = getHeads(mergedDoc);
    const patches = diff(local, localHeads, updatedHeads);
    validatePatches(patches, local, secPol, userEnv);
    return automergeToSRDT(secPol, userEnv, mergedDoc);
}
/**
 * Generate a {@link SyncMessage} for a document
 * @param doc The {@link Document} to generate the syncMessage for
 * @param syncState The {@link SyncState} which is used to determine which parts of the document to include in
 * the sync message
 * @returns 2-tuple with an updated {@link SyncState}, and a {@link SyncMessage}
 */
export function generateSyncMessage(doc, syncState) {
    return Automerge.generateSyncMessage(doc, syncState);
}
/**
 * Make an immutable view of an SRDT document at the version given by {@link heads}.
 * The document returned from this function cannot be passed to {@link change} because it points to the history in exactly the same doucment (it is not a copy).
 * @param doc The document to view the history of.
 * @param heads The hashes of the heads to create a view at.
 * @throws error when the heads are not in the document
 */
export function view(doc, heads) {
    const [securityPolicy, userEnvironment] = getMetadata(doc);
    const automergeDoc = Automerge.view(doc, heads);
    return automergeToSRDT(securityPolicy, userEnvironment, automergeDoc);
}
/**
 * Create a set of patches that represent the changes between two versions of the document, identified by the document heads.
 * If either of the heads does not exist in the document, returns empty array.
 * @param doc The document to diff
 * @param before The heads of the older version of {@link doc} from which to start the diff
 * @param after The heads of the newer version of {@link doc} at which to end the diff.
 */
export function diff(doc, before, after) {
    return Automerge.diff(doc, before, after);
}
/**
 * Get the hashes of the heads of the given document.
 * @param doc The document to get the heads of.
 */
export function getHeads(doc) {
    return Automerge.getHeads(doc);
}
/**
 * Update a {@link Document} based on a synchronisation message ({@link SyncMessage}).
 * @param doc The document to update
 * @param inState The current synchronisation state ({@link SyncState}) of the document
 * @param message The {@SyncMessage} received from the communication partner
 * @param opts Optional {@link ApplyOptions}
 * @returns 3-tuple that contains an updated document, a new SyncState, and a new message which should be sent back
 * if it is not null.
 */
export function receiveSyncMessage(doc, inState, message, opts) {
    const [updatedAutomergeDoc, newSyncState, newSyncMessage] = Automerge.receiveSyncMessage(doc, inState, message, opts);
    const [securityPolicy, userEnvironment] = getMetadata(doc);
    const updatedSRDT = automergeToSRDT(securityPolicy, userEnvironment, updatedAutomergeDoc);
    return [updatedSRDT, newSyncState, newSyncMessage];
}
/**
 * Get the changes between 2 {@link Document}s, assuming that {@link oldState} is a predecessor of {@link newState}
 * @param oldState An old document which precedes {@link newState}
 * @param newState A new document
 * @returns array of {@link Change} objects
 */
export function getChanges(oldState, newState) {
    return Automerge.getChanges(oldState, newState);
}
/**
 * Given a set of operations returned by {@link getChanges}, apply these changes to the given document.
 * Also see {@link Automerge.applyChanges}.
 * @param doc The document to apply the changes to
 * @param changes The changes to apply to the document
 * @param options Optional arguments
 */
export function applyChanges(doc, changes, options) {
    const [secPol, userEnv] = getMetadata(doc);
    // new doc is returned by Automerge in a singleton array which is kept for backwards compatibility reasons, which we don't care about
    const updatedDoc = Automerge.applyChanges(doc, changes, options)[0];
    return automergeToSRDT(secPol, userEnv, updatedDoc);
}
/**
 * Clone a document, returns a (deep) copy of the given document.
 * @param doc The document to clone
 * @param opts Options to initialise the cloned document
 */
export function clone(doc, opts) {
    const [secPol, userEnv] = getMetadata(doc);
    const automergeOptions = {};
    if (opts && opts.actorId) {
        automergeOptions.actor = opts.actorId;
    }
    const clonedDoc = Automerge.clone(doc, automergeOptions);
    return automergeToSRDT(secPol, userEnv, clonedDoc);
}
/**
 * Retrieve the actor id of the document
 * @param doc The document to retrieve the actor id from.
 */
export function getActorId(doc) {
    return Automerge.getActorId(doc);
}
/**
 * Make a random actor id.
 */
export function makeActorId() {
    return Automerge.getActorId(Automerge.init());
}
//# sourceMappingURL=document.js.map