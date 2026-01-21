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


function feedback(guess, answer) {
    const green  = ['.', '.', '.', '.', '.'];
    const yellow = ['.', '.', '.', '.', '.'];
    const grey   = ['.', '.', '.', '.', '.'];

    const counts = {};

    // Greens
    for (let i = 0; i < 5; i++) {
        if (guess[i] === answer[i]) {
            green[i] = guess[i];
        } else {
            counts[answer[i]] = (counts[answer[i]] || 0) + 1;
        }
    }

    // Yellows / Greys
    for (let i = 0; i < 5; i++) {
        if (green[i] !== '.') continue;

        const c = guess[i];
        if (counts[c] > 0) {
            yellow[i] = c;
            counts[c]--;
        } else {
            grey[i] = c;
        }
    }

    return {
        green: green.join(''),
        yellow: yellow.join(''),
        grey: grey.join('')
    };
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

/**
 * Normalises an array of data
 * @param {int[]} arr 
 * @returns {int[]}
 */
function normalise(arr) {
    let max = -Infinity;
    let min =  Infinity;

    for (const e of arr) {
        max = Math.max(e, max);
        min = Math.min(e, min);
    }

    const range = Math.abs(max - min);
    if (range === 0) return arr.map(() => 0);
    return arr.map(v => { return (v - min) / range })
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

module.exports = { ask, count, feedback, meetsConditions, normalise, randomInt }