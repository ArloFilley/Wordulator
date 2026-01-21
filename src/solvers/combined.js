
const fs = require('fs');

const { calculatePosFreq, heuristicScore } = require('../lib/heuristic.js');
const { calculateGuessEntropy }   = require('../lib/entropy.js');
const { ask, count, feedback, meetsConditions, randomInt } = require('../lib/lib.js');

const words = require('../../data/filter/words.json');
const pos_freq = require('../../data/proc/pos_freq.json');
const feedback_matrix = new Uint8Array( fs.readFileSync('./data/proc/feedback_matrix.bin'));
const first_guesses = require('../../data/proc/first_guesses.json');
const word_index = new Map();
words.forEach((w, i) => word_index.set(w, i));

async function solve(opt) {
    let log;
    if (opt.type === 'benchmark') {
        log = () => {};
    } else {
        log = console.log;
    }

    let fw = words;
    let pf = pos_freq;
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
        let best_guess = '!@??*';
        let best_score = -Infinity;
        if (guesses == 0) {
            let rand_idx = randomInt(100);
            best_guess = first_guesses[rand_idx].word;
        } else if (fw.length < 2000) {
            let pf = calculatePosFreq(fw);
            for (let guess of fw) {
                const s = calculateGuessEntropy(guess, words, feedback_matrix, word_index) + (heuristicScore(guess, 0, pf) * 0.0002 * guesses);

                if (s > best_score) {
                    best_score = s
                    best_guess = guess
                }
            }
        } else {
            for (let guess of words) {
                let s = calculateGuessEntropy(guess, fw, feedback_matrix, word_index) + (heuristicScore(guess, guesses, pf) * (0.0001 * guesses));

                if (s > best_score) {
                    best_score = s
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

module.exports = { solve }