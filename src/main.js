let words = require('../data/filtered_words.json');
let global_pf = require('../data/positional_frequencies.json')
const { ask, calculatePosFreq, count, meetsConditions, score } = require('./lib.js')

let word_numbers = []

async function main() {
    let fw = words;
    let pf = global_pf;
    let guesses = 0;

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
        let best_score = 0;
        let best_guess = 0;
        let best_guesses = [];
        if (fw.length < 500) {
            pf = calculatePosFreq(fw);
            for (const w of fw) {
                let s = score(w, guesses, pf)
                if (s > best_score) {
                    best_score = s;
                    best_guess = w;
                    best_guesses.push(best_guess);
                }
            }
        } else {
            for (const w of words) {
                let s = score(w, guesses, pf)
                if (s > best_score) {
                    best_score = s;
                    best_guess = w;
                    best_guesses.push(best_guess);
                }
            }
        }
        
        // Guess
        console.log(`Possible Words Left: ${fw.length}\n`);
        word_numbers.push(fw.length);
        if (fw.length < 50) {
            console.log(`Best Guess ${guesses+1}: ${best_guess}`);
            console.log(`Other Guesses ${guesses+1}: ${fw}`);
        } else {
            console.log(`Best Guess ${guesses+1}: ${best_guesses}`);
        }
        guesses += 1;
        
        // Input
        
        const green  = await ask("Green Letters. - use '.' for blanks: ");
        const yellow = await ask("Yellow letters - use '.' for blanks: ");
        const grey   = await ask("Grey letters   - use '.' for blanks: ");

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

        if (fw.length === 0) {
            console.log("ERROR: No Correct Word Could Be Found");
            process.exit();
        } 
        
        if (fw.length === 1) {
            console.log(`Solution: ${filtered_words}`);
            console.log(`Guess ${guesses} - Yippeee!`);
            console.log(`Word Numbers By Guess: ${word_numbers}`);
            process.exit();
        }
    }
}

main();