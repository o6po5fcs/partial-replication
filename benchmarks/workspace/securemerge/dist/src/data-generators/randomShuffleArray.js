/**
 * Randomly shuffle the elements of an array (destructively)
 * Based on https://stackoverflow.com/a/2450976/1887892
 * @param array Array to shuffle
 * @param numberGenerator A lambda that returns a random number to determine the outcome of the shuffle process
 */
export function randomShuffleArray(array, numberGenerator) {
    const myRng = numberGenerator ? numberGenerator : Math.random;
    let currentIndex = array.length;
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        let randomIndex = Math.floor(myRng() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
}
//# sourceMappingURL=randomShuffleArray.js.map