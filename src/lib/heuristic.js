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
 * @returns {number}
*/
function pfHeuristicScore(word, guesses, positional_frequencies, list_length) {
    let score = 0;
    const seen = new Set();
    for (let i=0; i<word.length; i++) {
        let c = word[i];
        if (!seen.has(c)) {
            score += positional_frequencies[i][c] ?? 0;
            seen.add(c);
        } else {
            score += positional_frequencies[i][c] ?? 0;
        }
    }

    return score / (list_length / 5);
}

/**
 * Scores a word between 1-word.length based on how many unique letters it contains
 * @param {string} word 
 * @returns {number}
*/
function uniquenessHeuristicScore(word) {
    let score = 0;
    const seen = new Set();
    for (const i in word) {
        let c = word[i];
        if (!seen.has(c)) {
            score += 1;
        }
    }
    return score;
}

module.exports = { calculatePosFreq, pfHeuristicScore, uniquenessHeuristicScore }