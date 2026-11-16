export function makeDelPatch(paths) {
    return paths.map((path) => {
        return {
            action: "del",
            path: path,
        };
    });
}
//# sourceMappingURL=makeDelPatch.js.map