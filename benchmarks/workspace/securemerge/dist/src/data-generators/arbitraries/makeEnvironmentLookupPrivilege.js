import { fc, SecPol, SeedRandom } from "../deps.js";
import { makePlainPrivilege } from "./makePlainPrivilege.js";
import { makeNonExistantPath } from "./makeNonExistantPath.js";
import { makeAutomergeCompatibleObjectKey } from "./makeAutomergeCompatibleObjectKey.js";
function getMutationCandidateIndices(pathSelector) {
    const indices = [];
    for (let i = 0; i < pathSelector.length; i++) {
        const pathExp = pathSelector[i];
        if (SecPol.isPathExpressionKey(pathExp)) {
            indices.push(i);
        }
    }
    return indices;
}
function addEnvironmentLookupToPath(path, seed) {
    const myRng = SeedRandom(seed.toString());
    const pathCopy = path.slice();
    const mutationCandidateIndices = getMutationCandidateIndices(path);
    if (mutationCandidateIndices.length === 0) {
        return {
            pathSelector: pathCopy,
            userEnvPatch: false
        };
    }
    else {
        const randomPosition = mutationCandidateIndices[Math.floor(myRng() * mutationCandidateIndices.length)];
        const originalPathExpression = pathCopy[randomPosition];
        if (!SecPol.isPathExpressionKey(originalPathExpression)) {
            throw new Error(`Something went wrong while selecting suitable path expressions to replace`);
        }
        const randomPath = fc.sample(makeNonExistantPath(), { seed: seed })[0];
        const envPredicateType = Math.floor(myRng() * 2);
        if (envPredicateType === 0) {
            const newPathExpression = [SecPol.EnvPredicates.equal, [SecPol.Home, ...randomPath]];
            pathCopy[randomPosition] = newPathExpression;
            return {
                pathSelector: pathCopy,
                userEnvPatch: { path: randomPath, value: originalPathExpression }
            };
        }
        else if (envPredicateType === 1) {
            const newPathExpression = [SecPol.EnvPredicates.includes, [SecPol.Home, ...randomPath]];
            pathCopy[randomPosition] = newPathExpression;
            const randomArray = fc.sample(makeAutomergeCompatibleObjectKey(), { seed: seed, numRuns: 6 });
            randomArray[Math.floor(myRng() * (randomArray.length - 1))] = originalPathExpression;
            return {
                pathSelector: pathCopy,
                userEnvPatch: { path: randomPath, value: randomArray }
            };
        }
        else {
            throw new Error("Unhandled rng");
        }
    }
}
export function makeEnvironmentLookupPrivilege(possibleRoles, possiblePaths, options = {}) {
    const seed = options.seed ?? Math.random();
    return makePlainPrivilege(possibleRoles, possiblePaths, { includedAccessLevels: options.includedAccessLevels })
        .map((generatedPrivilege) => {
        const privilege = generatedPrivilege.privilege;
        const pathSelector = SecPol.getPathSelector(privilege);
        const result = addEnvironmentLookupToPath(pathSelector, seed);
        SecPol.setPathSelector(privilege, result.pathSelector);
        const patches = result.userEnvPatch ? [result.userEnvPatch] : [];
        return {
            privilege: privilege,
            userEnvPatches: patches
        };
    });
}
//# sourceMappingURL=makeEnvironmentLookupPrivilege.js.map