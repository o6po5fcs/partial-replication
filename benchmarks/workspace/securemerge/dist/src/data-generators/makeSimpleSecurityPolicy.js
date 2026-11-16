import { SecPol, SeedRandom } from "./deps.js";
import { randomShuffleArray } from "./mod.js";
export function makeSimpleSecurityPolicy(allPaths, length, options = {}) {
    const initialRngSeed = options.seed ? options.seed : Math.random();
    const mySeededRng = SeedRandom(initialRngSeed.toString());
    const shuffledArray = allPaths.slice();
    randomShuffleArray(shuffledArray, mySeededRng);
    const takenPaths = shuffledArray.slice(0, length);
    const securityPolicy = takenPaths.map((path) => [SecPol.Permission.ALLOW, SecPol.Wildcard, SecPol.READ(), path]);
    return {
        privileges: securityPolicy,
        userEnv: {}
    };
}
//# sourceMappingURL=makeSimpleSecurityPolicy.js.map