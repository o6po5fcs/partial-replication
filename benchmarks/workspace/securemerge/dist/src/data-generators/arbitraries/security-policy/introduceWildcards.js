import { SecPol } from "../../deps.js";
import { randomNumbersBetween } from "../../randomNumbersBetween.js";
function addWildcardToPath(path, numberGenerator) {
    if (path.length > 0) {
        const randomPosition = Math.floor(numberGenerator() * path.length);
        const pathCopy = path.slice();
        pathCopy[randomPosition] = SecPol.Wildcard;
        return pathCopy;
    }
    else {
        return path;
    }
}
export function introduceWildcards(privileges, options) {
    const myRng = options?.numberGenerator ? options.numberGenerator : Math.random;
    const maxWildcardsPerPathSelectors = options?.maxWildcardsPerPathSelector ?? 2;
    const privilegesCopy = privileges.map((priv) => priv.slice());
    const percentageOfTouchedPrivileges = options && options.percentageOfTouchedPrivileges ? options.percentageOfTouchedPrivileges : 10;
    const privilegIndicesToModify = randomNumbersBetween(0, privileges.length, Math.round(privileges.length / 100 * percentageOfTouchedPrivileges), myRng);
    for (const idx of privilegIndicesToModify) {
        const privilege = privilegesCopy[idx];
        const pathSelector = SecPol.getPathSelector(privilege);
        const newPathSelector = addWildcardToPath(pathSelector, myRng);
        SecPol.setPathSelector(privilege, newPathSelector);
    }
    return privilegesCopy;
}
//# sourceMappingURL=introduceWildcards.js.map