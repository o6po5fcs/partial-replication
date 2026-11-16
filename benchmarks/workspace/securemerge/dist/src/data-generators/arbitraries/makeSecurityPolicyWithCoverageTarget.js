import { fc, SecPol, setObjectValue, SeedRandom } from "../deps.js";
import { makeWildcardPrivilege } from "./makeWildcardPrivilege.js";
import { makeEnvironmentLookupPrivilege } from "./makeEnvironmentLookupPrivilege.js";
import { makePlainPrivilege } from "./makePlainPrivilege.js";
import { calcSecurityPolicyCoverage } from "../mod.js";
import { calcPathsCovered } from "../calcPathsCovered.js";
export function makeSecurityPolicyWithCoverageTarget(data, roles, allPaths, coverageTargetPercent, options = {}) {
    if (allPaths.length === 0) {
        throw new Error(`At least one path must be provided.`);
    }
    const initialRngSeed = options.seed ? options.seed : Math.random();
    const mySeededRng = SeedRandom(initialRngSeed.toString());
    const opts = {
        includedAccessLevels: options.includedAccessLevels,
        maxWildcardsPerPathSelector: 1,
        /**
         * Number between 0 and 1, where higher numbers are more likely to generate a higher number of wildcards (e.g., 0.2 = 80%, 16%, 3.2%, ...)
         */
        numberOfWildcardsProbabilityDecay: 0.1,
        /**
         * Number between 0 and 1, where higher numbers are more likely that the wildcard is inserted at the back of the path selector (e.g., 0.2 = 80%, 16%, 3.2%, ...)
         */
        insertTowardsRearProbabilityDecay: 0.9,
        numberGenerator: mySeededRng,
        // ENVIRONMENT LOOKUP privilege options
        seed: initialRngSeed
    };
    const nbCoveredPathsTarget = Math.round(allPaths.length * (coverageTargetPercent / 100));
    const allowedCoverageMargin = 0; // nb. of paths
    const includedArbitraries = [{ arbitrary: makePlainPrivilege(roles, allPaths, opts), weight: 10 }];
    if (options.introduceWildcards ?? false) {
        includedArbitraries.push({ arbitrary: makeWildcardPrivilege(roles, allPaths, opts), weight: 1 });
    }
    if (options.introduceEnvironmentLookups ?? false) {
        includedArbitraries.push({ arbitrary: makeEnvironmentLookupPrivilege(roles, allPaths, opts), weight: 2 });
    }
    // generate a list of privileges to draw entries from
    return fc.array(fc.oneof(...includedArbitraries), {
        minLength: allPaths.length,
        maxLength: allPaths.length * 2
    }).map((generatedPrivileges) => {
        const privileges = generatedPrivileges.map((obj) => obj.privilege);
        const userEnv = {};
        for (const obj of generatedPrivileges) {
            const patches = obj.userEnvPatches;
            for (const patch of patches) {
                setObjectValue(userEnv, patch.path, patch.value);
            }
        }
        const currentSecurityPolicy = [];
        let currentCoveredPaths = [];
        const recalibrateCoveredPathsEvery = 1000;
        let coverageRecalculationCounter = recalibrateCoveredPathsEvery;
        while (privileges.length > 0) {
            const selectedPrivilege = privileges.shift();
            // store the number of covered paths before the array is extended, such that the array
            // can be restored to this length to remove the added paths.
            const coveredPathsLen = currentCoveredPaths.length;
            if (coverageRecalculationCounter > 0) {
                const pathsCovered = calcPathsCovered(data, selectedPrivilege, userEnv);
                const newlyCoveredPaths = pathsCovered.filter((path) => {
                    return !SecPol.isReadable(path, currentSecurityPolicy, userEnv);
                });
                currentCoveredPaths.push(...newlyCoveredPaths);
            }
            currentSecurityPolicy.push(selectedPrivilege);
            if (coverageRecalculationCounter === 0) {
                coverageRecalculationCounter = recalibrateCoveredPathsEvery;
                currentCoveredPaths = calcSecurityPolicyCoverage(currentSecurityPolicy, userEnv, allPaths).allowedPaths;
            }
            else {
                coverageRecalculationCounter -= 1;
            }
            const newCoveredPathsLen = currentCoveredPaths.length;
            if (newCoveredPathsLen > nbCoveredPathsTarget + allowedCoverageMargin) {
                // if the measured coverage is larger than the coverage target by a too big margin,
                // remove the privilege and try another one
                currentSecurityPolicy.pop();
                // restore the length of the array to remove the last n items
                currentCoveredPaths.length = coveredPathsLen;
            }
            else if (newCoveredPathsLen >= nbCoveredPathsTarget) {
                // if the coverage exceeds the coverage target, but within the margin of error, accept it
                break;
            }
        }
        const finalCoverageStats = calcSecurityPolicyCoverage(currentSecurityPolicy, userEnv, allPaths);
        return {
            privileges: currentSecurityPolicy,
            userEnv: userEnv,
            coverage: finalCoverageStats.coveragePercent,
            allowedPaths: finalCoverageStats.allowedPaths,
            disallowedPaths: finalCoverageStats.disallowedPaths
        };
    });
}
//# sourceMappingURL=makeSecurityPolicyWithCoverageTarget.js.map