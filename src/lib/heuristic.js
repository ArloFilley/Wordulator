const { normalise } = require('./lib.js')

/**
 * Calculates the positional frequencies of letters based on a list of words
 * @param {Array<Array<string>>} words 
 * @returns 
 */
function calculatePosFreq(words) {
    const wl = words[0].length;
    const pf = Array.from({length: wl}, () => new Array(26).fill(0));

    for (let i=0; i < words.length; i++) {
        const word = words[i];
        for (let j=0; j < wl; j++) {
            const char_code = word.charCodeAt(j) - 97;
            pf[j][char_code] += 1;
        }
    }

    for (let i=0; i < wl; i++) {
        pf[i] = normalise(pf[i]);
    }

    return pf;
}

/**
 * Scores a word based on positional frequencies of letters
 * @param {string} word 
 * @param {Array<Array<number>>} pf 
 * @returns {number}
*/
function pfHeuristicScore(word, pf) {
    let score = 0;
    const seen = new Array(26);
    const wl = word.length;

    for (let i=0; i < wl; i++) {
        let char_code = word.charCodeAt(i) - 97;
        if (seen[char_code] === 0) {
            score += pf[i][char_code];
            seen[char_code] = 1;
        } else {
            const s = pf[i][char_code];
            score += s / 2;
        }
    }

    return score;
}

/**
 * Scores a word between 1-word.length based on how many unique letters it contains
 * @param {string} word 
 * @returns {number}
*/
function uniquenessHeuristicScore(word) {
    let score = 0;
    const seen = new Set();
    for (let i=0; i<word.length; i++) {
        let c = word[i];
        if (!seen.has(c)) {
            score += 1;
        }
    }
    return score;
}

module.exports = { calculatePosFreq, pfHeuristicScore, uniquenessHeuristicScore }