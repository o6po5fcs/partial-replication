import { fc, SecPol, SeedRandom } from "../../deps.js";
import { makeNonExistantPath } from "../makeNonExistantPath.js";
import { makeAutomergeCompatibleObjectKey } from "../makeAutomergeCompatibleObjectKey.js";
import { randomNumbersBetween } from "../../randomNumbersBetween.js";
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
        return false;
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
export function introduceEnvironmentLookups(privileges, seed) {
    const userEnvPatches = [];
    const myRng = SeedRandom(seed.toString());
    const privilegesCopy = privileges.map((priv) => priv.slice());
    const percentageOfTouchedPrivileges = 10;
    const privilegIndicesToModify = randomNumbersBetween(0, privileges.length, Math.round(privileges.length / 100 * percentageOfTouchedPrivileges), myRng);
    for (const idx of privilegIndicesToModify) {
        const privilege = privilegesCopy[idx];
        const pathSelector = SecPol.getPathSelector(privilege);
        const permutation = addEnvironmentLookupToPath(pathSelector, seed + 1);
        if (permutation) {
            userEnvPatches.push(permutation.userEnvPatch);
            SecPol.setPathSelector(privilege, permutation.pathSelector);
        }
    }
    /*

    // randomly split the privileges into multiple arrays, and sort them from the longest array to the smallest array
    const splitPrivileges = randomSplitArray(privileges, 1, 5, myRng).sort((priv1: SecPol.Privilege[], priv2: SecPol.Privilege[]) => priv2.length - priv1.length);
    for (let i = 0; i < splitPrivileges.length; i++) {
        let nrOfPermutationPasses = i;
        let privilegesToModify = splitPrivileges[i];
        for (let mutationPass = 0; mutationPass < nrOfPermutationPasses; mutationPass++) {
            privilegesToModify = privilegesToModify.map((priv: SecPol.Privilege) => {
                const copiedPriv = priv.slice() as SecPol.Privilege;
                const pathSelector = SecPol.getPathSelector(priv);
                const permutation = addEnvironmentLookupToPath(pathSelector, seed + 1);
                if (permutation) {
                    userEnvPatches.push(permutation.userEnvPatch);
                    SecPol.setPathSelector(copiedPriv, permutation.pathSelector);
                    return copiedPriv;
                } else {
                    return priv;
                }
            });
        }
        splitPrivileges[i] = privilegesToModify;
    }*/
    return {
        // remove one level of array nesting that was introduced by randomly splitting the array.
        privileges: privilegesCopy,
        userEnvPatches: userEnvPatches
    };
}
//# sourceMappingURL=introduceEnvironmentLookups.js.map