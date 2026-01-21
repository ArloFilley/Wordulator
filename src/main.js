let words = require('../data/filtered_words.json');
const { getRandomInt, count } = require('./lib.js')
const readline = require('node:readline/promises');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let word_numbers = [words.length]

async function main() {
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

    console.log(`First Guess: ${words[getRandomInt(words.length)]}`)
    
    while (got_word.toLowerCase() === 'f') {
        guesses += 1;
        const filtered_words = [];
        const green = (await rl.question("Green letters - use '.' for blanks: ")).toLowerCase();
        const yellow = (await rl.question("Yellow letters - use '.' for blanks: ")).toLowerCase();
        const grey = (await rl.question("Grey letters - use '.' for blanks: ")).toLowerCase();

        // Set Min Using Green Input
        for (const letter of green) {
            if (letter !== '.') { conditions.get(letter).min += 1 }
        }

        // Set Min Using Yellow Input
        for (const letter of yellow) {
            if (letter !== '.') { conditions.get(letter).min += 1 }
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

        console.log(
            `Possible Words Left: ${filtered_words.length}\n`, 
            `Random Guess: ${filtered_words[getRandomInt(filtered_words.length)]}\n`,
            `words: ${filtered_words}`
        )
        
        for (let c = 97; c <= 122; c++) {
            conditions.get(String.fromCharCode(c)).min = 0
        }
 
        let n = await rl.question('Another Guess T/F: ');
        while (n.toLowerCase() === 't') {
            const guess = getRandomInt(filtered_words.length);
            console.log(`Random Guess: ${filtered_words[guess]}`);
            n = await rl.question('Another Guess T/F: ');
        }

        got_word = await rl.question('Got Word T/F: ');
        word_numbers.push(filtered_words.length)
    }
    
    guesses += 1
    console.log(`${guesses} Guesses - Yippeee!`);
    console.log(`Word Numbers By Guessing: ${word_numbers}`);
    rl.close();
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