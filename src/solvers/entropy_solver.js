let words = require('../../data/filtered_words.json');
let global_pf = require('../../data/positional_frequencies.json');
const { ask, count, feedback, meetsConditions, } = require('../lib.js');

const fs = require('fs')
const feedback_matrix = new Uint8Array(
    fs.readFileSync('./data/feedback.bin')
)

const word_index = new Map()
words.forEach((w, i) => word_index.set(w, i))

async function solve(opt) {
    let log;
    if (opt.type === 'benchmark') {
        log = () => {};
    } else {
        log = console.log;
    }

    let fw = words;
    let guesses = 0;
    const word_numbers = []

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

    while (true) {
        // Strategize & Score
        let best_guess = 'bears'
        let best_entropy = -Infinity
        if (fw.length < 500) {
            for (let guess of fw) {
                let h = calculateGuessEntropy(guess, fw)

                if (h > best_entropy) {
                    best_entropy = h
                    best_guess = guess
                }
            }
        } else {
            for (let guess of words) {
                let h = calculateGuessEntropy(guess, fw)

                if (h > best_entropy) {
                    best_entropy = h
                    best_guess = guess
                }
            }
        }
        
        // Guess
        log(`Possible Words Left: ${fw.length}\n`);
        word_numbers.push(fw.length);
        if (fw.length < 50) {
            log(`Best Guess ${guesses+1}: ${best_guess}`);
            log(`Other Guesses ${guesses+1}: ${fw}`);
        } else {
            log(`Best Guess ${guesses+1}: ${best_guess}`);
        }
        guesses += 1;
        
        // Input
        let green, yellow, grey;
        if (opt.type === 'benchmark') {
            const fb = feedback(best_guess, opt.answer);
            green    = fb.green;
            yellow   = fb.yellow;
            grey     = fb.grey;
        } else if (opt.type === 'user') {
            green    = await ask("Green Letters  - Use '.' for any blanks: ");
            yellow   = await ask("Yellow Letters - Use '.' for any blanks: ");
            grey     = await ask("Grey Letters   - Use '.' for any blanks: ");
        }

        // Constraints
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
        
        // Filter
        const filtered_words = [];
        const cond = [...conditions].map((e) => e)
        for (let word of fw) {
            if (meetsConditions(word, cond)) {
                filtered_words.push(word)
            }
        }

        fw = filtered_words;

        if (fw.length === 0 || guesses > 6) {
            log("ERROR: No Correct Word Could Be Found");
            return { solved: false };
        } 
        
        if (fw.length === 1) {
            log(`Solution: ${filtered_words}`);
            log(`Guess ${guesses} - Yippeee!`);
            log(`Word Numbers By Guess: ${word_numbers}`);
            return { solved: true, answer: filtered_words[0], guesses: guesses, word_count: word_numbers };
        }
    }
}

function calculateGuessEntropy(guess, words) {
    let buckets = new Map();

    for (let answer of words) {
        const pattern = feedback_matrix[word_index.get(guess) * words.length + word_index.get(answer)];
        buckets.set(pattern, (buckets.get(pattern) || 0) + 1);
    }

    let total = words.length;
    let entropy = 0;

    for (let count of buckets.values()) {
        let p = count / total;
        entropy -= p * Math.log2(p);
    }

    return entropy;
}

module.exports = { solve }