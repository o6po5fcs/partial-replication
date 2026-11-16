/**
 * Deep copy a privilege
 * @param privilege The privilege to duplicate
 */
export function shallowCopyPrivilege(privilege) {
    return [
        privilege[0],
        privilege[1],
        privilege[2],
        privilege[3]
    ];
}
//# sourceMappingURL=shallowCopyPrivilege.js.map