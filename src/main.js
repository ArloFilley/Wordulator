let words = require('../data/filtered_words.json');
let starting_pos_freq = require('../data/positional_frequencies.json')

const { calculatePosFreq, count } = require('./lib.js')
const readline = require('node:readline/promises');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let word_numbers = [words.length]

async function main() {
    let pos_freq = starting_pos_freq;
    let got_word = 'f'
    let guesses = 0;
    // Conditions 'the word' has to fulfill
    // min              - the word contains at least a certain number of a letter
    // max              - the word contains no more than a certain number of a letter
    // fixed_positions  - a letter shows up at a certain position of the word
    // banned_positions - a letter doesn't show up at a certain position of the word

    /** @type Map<char, object> */
    let conditions = new Map();
    // Set Starting Conditions
    for (let c = 97; c <= 122; c++) {
        conditions.set(String.fromCharCode(c), {
            min: 0,
            max: 5,
            fixed_positions: new Set(),
            banned_positions: new Set()
        })
    }

    console.log(`Guess 1: CLOTH`)
    while (got_word.toLowerCase() !== 't') {
        // Guess
        // Input
        // Constraints
        // Filter
        // Score
        guesses += 1;
        const filtered_words = [];
        const green = (await rl.question("Green letters - use '.' for blanks: ")).toLowerCase();
        const yellow = (await rl.question("Yellow letters - use '.' for blanks: ")).toLowerCase();
        const grey = (await rl.question("Grey letters - use '.' for blanks: ")).toLowerCase();

        
        // Set Min Using Green & Yellow Input
        for (const letter of green + yellow) {
            if (letter !== '.') {
                conditions.get(letter).min = Math.max(
                    conditions.get(letter).min,
                    count(green + yellow, letter)
                );
            }
        }

        // Set Max Using Grey Input
        for (const letter of grey) {
            if (letter !== '.') { 
                conditions.get(letter).max = conditions.get(letter).min
            }
        }

        // Set Fixed Positions Using Green Input
        for (const lttr in green) {
            const letter = green[lttr]
            if (letter !== '.') {
                conditions.get(letter).fixed_positions.add(lttr)
            }
        }

        // Set Banned Positions Using Yellow Input
        for (const lttr in yellow) {
            const letter = yellow[lttr]
            if (letter !== '.') {
                conditions.get(letter).banned_positions.add(lttr)
            }
        }
        
        const cond = [...conditions].map((e) => e)
        for (let word of words) {
            if (fits_conditions(word, cond)) {
                filtered_words.push(word)
            }
        }

        if (filtered_words.length === 0) {
            console.log("ERROR: No Correct Word Could Be Found");
            return;
        } 
        
        if (filtered_words.length === 1) {
            console.log(`Words: ${filtered_words.length}`);
            console.log(`Solution: ${filtered_words}`);
            console.log(`Guess ${guesses+1} - Yippeee!`);
            console.log(`Word Numbers By Guess: ${word_numbers}`);
            rl.close();
            return;
        }

        let best_score = 0;
        let best_guess = "";

        if (filtered_words.length < 500) {
            pos_freq = calculatePosFreq(filtered_words);
        }

        for (const w of words) {
            let s = score(w, guesses, pos_freq)
            if (s > best_score) {
                best_score = s;
                best_guess = w;
            }
        }

        if (guesses === 1) {
            best_guess = "bares"
        }
            
        console.log(`words: ${filtered_words}`);
        console.log(`Possible Words Left: ${filtered_words.length}\n`)
        console.log(`Guess ${guesses+1}: ${best_guess.toUpperCase()}`);
        word_numbers.push(filtered_words.length)
    }
}

main();

/**
 * @param {string} word 
 * @param {Array<[char, object]>} conditions 
 */
function fits_conditions(word, letter_conditions) {
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