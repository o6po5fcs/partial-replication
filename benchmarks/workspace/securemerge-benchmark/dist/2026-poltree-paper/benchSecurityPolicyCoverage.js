import { SRDT } from "../deps.js";
import { Command, Option } from "commander";
import { generateData } from "./generateData.js";
import { printOutput } from "./printOutput.js";
import * as util from "node:util";
export function benchSecurityPolicyCoverage(size, depthSize, securityPolicySize, minimumObjectPathsSize, seed) {
    const { obj, paths, privileges, userEnv } = generateData(size, depthSize, securityPolicySize, minimumObjectPathsSize, seed);
    console.log(util.inspect(privileges, { depth: null }));
    return {
        sourceObjectStats: {
            sizeIndication: Buffer.byteLength(JSON.stringify(obj)),
            numberOfPaths: paths.length,
            maxDepth: paths.reduce((acc, path) => Math.max(acc, path.length), 0),
            topLevelBreadth: Object.keys(obj).length
        },
        numberOfPrivileges: privileges.length,
        coverage: SRDT.DataGenerators.calcSecurityPolicyCoverage(privileges, userEnv, paths),
        userEnvSize: `${SRDT.ObjectManipulation.getAllObjectPaths(userEnv, { leavesOnly: true }).length} paths`
    };
}
const program = new Command();
program.addOption(new Option('--size <size>', "fast-check size of the generated object, will be increased when it is not possible to generate a large enough object for the requested number of privileges (or eventually error)").choices(["xsmall", "small", "medium", "large", "xlarge"]).makeOptionMandatory());
program.requiredOption("--depth-size <number>", "fast-check depth size for the generated object, suggested range 1-50, will be increased when it is not possible to generate a large enough object for the requested number of privileges (or eventually error)", parseInt);
program.requiredOption("--number-of-privileges <number>", "number of privileges to derive from the generated object", parseInt);
program.requiredOption("--minimum-object-paths <number>", "Minimum number of paths that a generated object should have (e.g., to accommodate a future security policy)", parseInt);
program.option("--seed <number>", "a number between 0 and 1 that serves as the seed for random generation.", parseFloat);
program.parse();
const options = program.opts();
console.log('Options: ', options);
printOutput(benchSecurityPolicyCoverage(options.size, options.depthSize, options.numberOfPrivileges, options.minimumObjectPaths, options.seed));
//# sourceMappingURL=benchSecurityPolicyCoverage.js.map