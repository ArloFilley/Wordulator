const readline = require('node:readline/promises');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function ask(q) {
    let a = await rl.question(q);
    return a.toLowerCase();
}

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
 * Counts the number of a given character in a word
 * @param {*} word 
 * @param {*} char 
 * @returns 
 */
function count(word, character) {
    let count = 0;
    for (let letter of word) {
        if (letter === character) { count++ }
    }

    return count
}


/**
 * Scores a word based on positional frequencies of letters
 * @param {string} word 
 * @param {number} guesses 
 * @param {Array<[char,number]>} positional_frequencies 
 * @returns 
 */
function score(word, guesses, positional_frequencies) {
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

/**
 * Checks if a word meets conditions with the min, max, fixed, and banned position of characters
 * @param {string} word 
 * @param {Array<[char, object]>} conditions 
 */
function meetsConditions(word, letter_conditions) {
    for (const l of letter_conditions) {
        const letter = l[0];
        const conditions = l[1];
        const c = count(word, letter);

        if (c > conditions.max) { return false; }
        if (c < conditions.min) { return false; }
        for (const i of conditions.fixed_positions) {
            if (word[i] !== letter) { return false; }
        }
        for (const i of conditions.banned_positions) {
            if (word[i] === letter) { return false; }
        }
    }

    return true;
}


module.exports = { ask, calculatePosFreq, count, meetsConditions, score }