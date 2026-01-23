
const fs = require('fs');

const { calculatePosFreq, pfHeuristicScore } = require('../lib/heuristic.js');
const { calculateGuessEntropy, genEntropyTable }   = require('../lib/entropy.js');
const { ask, count, feedback, meetsConditions, normalise } = require('../lib/lib.js');

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
        const progress = 1 - fw.length / words.length;
        let best_guess = '!@??*';
        let best_score = -Infinity;
        let scores = { ent: new Array(words.length), pfh: new Array(words.length) }
        let cond = [...conditions].map((e) => e)

        if (fw.length !== words.length) pf = calculatePosFreq(fw);

        if (guesses === 0) {
            best_guess = 'tares';
        } else {
            pf = calculatePosFreq(fw);
            const fwi = words.map(v => word_index.get(v));
            const ent_table = genEntropyTable(fw.length);

            for (let g=0; g<words.length; g++) {
                let guess = words[g];
                scores.ent[g] = calculateGuessEntropy(word_index.get(guess), fw, feedback_matrix, fwi, ent_table);
                scores.pfh[g] = pfHeuristicScore(guess, pf);
            }

            scores.pfh = normalise(scores.pfh);

            let ew =  0.7361;
            let pw = 13.5323;
            let cw =  6.8423;
            if (opt.weights !== undefined && opt.weights.mc !== undefined) {
                mc = opt.weights.mc;
                ec = opt.weights.ec;

                if (fw.length <= ec) {
                    ew = opt.weights.ew[2];
                    pw = opt.weights.pw[2];
                    cw = opt.weights.cw[2];
                } else if (fw.length <= mc) {
                    ew = opt.weights.ew[1];
                    pw = opt.weights.pw[1];
                    cw = opt.weights.cw[1];
                } else {
                    ew = opt.weights.ew[0];
                    pw = opt.weights.pw[0];
                    cw = opt.weights.cw[0];
                }
            } else if (opt.weights !== undefined) {
                ew = opt.weights.ew;
                pw = opt.weights.pw;
                cw = opt.weights.cw;
            }

            for (let i=0; i<words.length; i++) {
                const s = new Array(4).fill(0);

                s[0] = scores.pfh[i] * pw;
                s[1] = (1 - Math.pow(2, -scores.ent[i])) * ew;
                s[2] = (meetsConditions(words[i], cond) ? 1 : 0) * cw;
                if (opt.rand !== undefined && opt.rand === true) {
                    const rand = 0.001 * Math.random();
                    s[3] = rand;
                }

                let score = s.reduce((acc, v) => acc + v, 0);

                if (score > best_score) {
                    best_score = score;
                    best_guess = words[i];
                }
            }
        }
        guesses += 1;

        // Guess
        log(`Possible Words Left: ${fw.length}\n`);
        word_numbers.push(fw.length);
        log(`Best Guess ${guesses}: ${best_guess}`);
        if (fw.length < 50) {
            log(`Other Guesses ${guesses}: ${fw}`);
        }
        
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
        cond = [...conditions].map((e) => e)
        for (let word of fw) {
            if (meetsConditions(word, cond)) {
                filtered_words.push(word)
            }
        }

        fw = filtered_words;

        if (guesses > 6) {
            log("Couldn't Solve in 6 guesses");
            return { solved: false };
        } else if (green === best_guess) {
            log(`Solution: ${filtered_words}`);
            log(`Guess ${guesses} - Yippeee!`);
            log(`Word Numbers By Guess: ${word_numbers}`);
            return { solved: true, answer: filtered_words[0], guesses: guesses, word_count: word_numbers };
        } else if (fw.length === 0) {
            log("ERROR: No Correct Word Could Be Found");
            return { solved: false };
        }
    }
}

module.exports = { solve }