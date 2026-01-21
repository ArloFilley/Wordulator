/**
 * Calculates the positional frequencies of letters based on a list of words
 * @param {Array<Array<string>>} words 
 * @returns 
 */
function calculatePosFreq(words) {
    let positional_frequencies = Array.from({length: 5}, () => ({}));

    for (const word of words) {
        for (let i = 0; i < 5; i++) {
            const char = word[i];
            positional_frequencies[i][char] = (positional_frequencies[i][char] || 0) + 1;
        }
    }

    return positional_frequencies;
}

/**
 * Scores a word based on positional frequencies of letters
 * @param {string} word 
 * @param {number} guesses 
 * @param {Array<[char,number]>} positional_frequencies 
 * @returns 
*/
function heuristicScore(word, guesses, positional_frequencies) {
    let score = 0;
    const seen = new Set();
    for (const i in word) {
        let c = word[i];
        if (!seen.has(c)) {
            score += positional_frequencies[i][c];
            seen.add(c);
        } else {
            score += positional_frequencies[i][c] / (6 - guesses);
        }
    }
    return score;
}

module.exports = { calculatePosFreq, heuristicScore }