import { fc } from "../deps.js";
/**
 * From https://www.w3schools.com/js/js_reserved.asp ("JavaScript Objects, Properties, and Methods")
 */
const reservedWords = [
    "constructor",
    "toString",
    "valueOf",
    "__proto__" // https://github.com/automerge/automerge/issues/860
];
export function makeAutomergeCompatibleObjectKey() {
    return fc.string({ minLength: 1 })
        .filter((str) => {
        const trimmedString = str.trim();
        return trimmedString.length > 1
            && reservedWords.indexOf(str) === -1
            && trimmedString.indexOf("/") === -1 // https://github.com/automerge/automerge/issues/825
        ;
    });
}
//# sourceMappingURL=makeAutomergeCompatibleObjectKey.js.map