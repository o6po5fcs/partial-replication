import { SecPol } from "./deps.js";
export class PlainSecurityPolicy {
    privileges;
    constructor(privileges) {
        this.privileges = privileges;
    }
    isCreateable(writtenToPath, writtenValue, beforeDoc, userEnv) {
        return SecPol.isCreateable(writtenToPath, writtenValue, beforeDoc, this.privileges, userEnv);
    }
    isDeletable(pathToDeletedField, beforeDoc, userEnv) {
        return SecPol.isDeletable(pathToDeletedField, beforeDoc, this.privileges, userEnv);
    }
    isReadable(path, userEnv) {
        return SecPol.isReadable(path, this.privileges, userEnv);
    }
    isUpdateable(writtenToPath, writtenValue, beforeDoc, userEnv) {
        return SecPol.isUpdateable(writtenToPath, writtenValue, beforeDoc, this.privileges, userEnv);
    }
}
//# sourceMappingURL=PlainSecurityPolicy.js.map