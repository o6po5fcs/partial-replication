import { fc, setObjectValue, SeedRandom } from "../deps.js";
import { makeWildcardPrivilege } from "./makeWildcardPrivilege.js";
import { makeEnvironmentLookupPrivilege } from "./makeEnvironmentLookupPrivilege.js";
import { makePlainPrivilege } from "./makePlainPrivilege.js";
export function makeSecurityPolicy2(data, roles, allPaths, options = {}) {
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
    const includedArbitraries = [{ arbitrary: makePlainPrivilege(roles, allPaths, opts), weight: 10 }];
    if (options.introduceWildcards ?? false) {
        includedArbitraries.push({ arbitrary: makeWildcardPrivilege(roles, allPaths, opts), weight: 1 });
    }
    if (options.introduceEnvironmentLookups ?? false) {
        includedArbitraries.push({ arbitrary: makeEnvironmentLookupPrivilege(roles, allPaths, opts), weight: 2 });
    }
    return fc.array(fc.oneof(...includedArbitraries), {
        minLength: options.minLength,
        maxLength: options.maxLength
    }).map((generatedPrivileges) => {
        const privileges = generatedPrivileges.map((obj) => obj.privilege);
        const userEnv = {};
        for (const obj of generatedPrivileges) {
            const patches = obj.userEnvPatches;
            for (const patch of patches) {
                setObjectValue(userEnv, patch.path, patch.value);
            }
        }
        return {
            privileges: privileges,
            userEnv: userEnv
        };
    });
}
//# sourceMappingURL=makeSecurityPolicy2.js.map