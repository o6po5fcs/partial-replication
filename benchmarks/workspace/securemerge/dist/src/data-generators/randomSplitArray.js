/**
 * Randomly split an array into an array of multiple arrays. Does not modify the input array.
 * Based on https://stackoverflow.com/a/22752932/1887892, but converted to TypeScript
 * @param arrayToSplit Array to split into chunks
 * @param min Optional: Minimum number of chunks to create (default 1)
 * @param max Optional: Maximum number of chunks to create (default = {@link min})
 * @param numberGenerator Optional: A lambda that, when called, returns a random number that is used to split the array
 */
export function randomSplitArray(arrayToSplit, min = 1, max, numberGenerator) {
    const clonedArray = arrayToSplit.slice();
    const chunks = [];
    let size = 1;
    if (max === undefined) {
        max = min;
    }
    const myRng = numberGenerator ? numberGenerator : () => Math.random();
    while (clonedArray.length > 0) {
        size = Math.min(max, Math.floor((myRng() * max) + min));
        const chunk = clonedArray.splice(0, size);
        chunks.push(chunk);
    }
    return chunks;
}
//# sourceMappingURL=randomSplitArray.js.map