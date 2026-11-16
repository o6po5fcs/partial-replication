import { SecPol } from "../deps.js";
import { makePlainPrivilege } from "./makePlainPrivilege.js";
function addWildcardToPath(path, numberGenerator, insertTowardsRearProbabilityDecay) {
    if (path.length > 0) {
        const randomPosition = Math.floor(Math.log(1 - numberGenerator() * (1 - Math.pow(insertTowardsRearProbabilityDecay, path.length))) / Math.log(insertTowardsRearProbabilityDecay)) + 1;
        const pathCopy = path.slice();
        // make it increasingly likely that the wildcard is inserted at the back of the path selector instead of at the front
        pathCopy[path.length - randomPosition] = SecPol.Wildcard;
        return pathCopy;
    }
    else {
        return path;
    }
}
export function makeWildcardPrivilege(possibleRoles, possiblePaths, options = {}) {
    const rng = options.numberGenerator ?? Math.random;
    const probabilityDecay = options.numberOfWildcardsProbabilityDecay ?? 0.2;
    const numberOfWildcards = Math.floor(Math.log(1 - rng() * (1 - Math.pow(probabilityDecay, options.maxWildcardsPerPathSelector ?? 1))) / Math.log(probabilityDecay)) + 1;
    return makePlainPrivilege(possibleRoles, possiblePaths, { includedAccessLevels: options.includedAccessLevels })
        .map((generatedPrivilege) => {
        const privilege = generatedPrivilege.privilege;
        for (let i = 0; i < numberOfWildcards; i++) {
            const pathSelector = SecPol.getPathSelector(privilege);
            const newPathSelector = addWildcardToPath(pathSelector, rng, options.insertTowardsRearProbabilityDecay ?? 0.2);
            SecPol.setPathSelector(privilege, newPathSelector);
        }
        return {
            privilege: privilege,
            userEnvPatches: generatedPrivilege.userEnvPatches
        };
    });
}
//# sourceMappingURL=makeWildcardPrivilege.js.map