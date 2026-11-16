import { fc } from "../deps.js";
import { randomSplitArray } from "../randomSplitArray.js";
/**
 * Split an array into an array of multiple arrays. Does not modify the input array.
 * Based on https://stackoverflow.com/a/22752932/1887892, but converted to TypeScript
 * @param arbitrary {@link fc.Arbitrary} that produces arrays of values
 * @param maxChunkSize Optional: Minimum number of chunks to create (default 1)
 */
export function makeChunks(arbitrary, maxChunkSize) {
    return fc.tuple(arbitrary, maxChunkSize).map(([arrToChunk, maxSize]) => {
        return randomSplitArray(arrToChunk, 1, maxSize);
    });
}
//# sourceMappingURL=makeChunks.js.map