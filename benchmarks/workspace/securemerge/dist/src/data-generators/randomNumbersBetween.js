/**
 * Create an array of n random integers between a min (inclusive) and max (exclusive)
 * @param min The lowest possible number to include
 * @param max The first high integer that is no longer include
 * @param howMany How many integers to generate
 * @param numberGenerator A lambda that returns a random number between 0 and 1 to determine the outcome of the randomness
 * @returns An array of integers
 */
export function randomNumbersBetween(min, max, howMany, numberGenerator) {
    if (numberGenerator === undefined) {
        numberGenerator = Math.random;
    }
    const numbers = [];
    for (let index = 0; index < howMany; index++) {
        numbers.push(Math.floor(numberGenerator() * (max - min)) + min);
    }
    return numbers;
}
//# sourceMappingURL=randomNumbersBetween.js.map