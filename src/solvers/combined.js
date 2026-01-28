// Lib Imports
const { calculatePosFreq, pfHeuristicScore: posFreqScore, createOverlap, overlapScore } = require('../lib/heuristic.js');
const { calculateGuessEntropy: entropy_score, genEntropyTable, loadFeedbackMatrix }   = require('../lib/entropy.js');
const { ask, normalise } = require('../lib/lib.js');
const { Wordle, patternFromUserInput } = require('../lib/wordle.js')

// Load Required Data
const words = require('../../data/filter/words.json');
const answers = require('../../data/filter/solution_words.json');
const feedback_matrix = loadFeedbackMatrix('./data/proc/feedback_matrix.bin');
const word_index = new Map();
words.forEach((w, i) => word_index.set(w, i));

async function solve(opt) {
    let log = opt.log;

    // evaluation and feedback
    /** @type {Wordle} */
    let wordle;
    if (opt.answer !== undefined) {
        wordle = new Wordle(true, opt.answer);
    } else {
        wordle = new Wordle(false);
    }

    // Guessing and scoring
    let possible_words = answers;
    let pos_frequencies;
    let previous_guess_feedback = null;
    const scores = { entropy: new Array(words.length), pos_freq: new Array(words.length), overlap: new Array(words.length) }
    let word_indecies = answers.map((v, i) => word_index.get(v));
    let overlapBin = "";

    // Stats and tracking
    let guesses = 0;
    const word_numbers = []

    while (true) {
        // Strategize & Guess
        let progress =  1 - (words.length - possible_words.length / words.length)
        let best_guess = '!@??*';
        let best_score = -Infinity;

        if (guesses === 0) {
            best_guess = 'dares'; // First guess is predefined based on entropy
            overlapBin = createOverlap('dares');
        } else if (possible_words.length === 1) {
            // Optimisation for When Only 1 Possible Guess is Left
            best_guess = possible_words[0]; 
        } else {
            // Weights
            const entropy_weight = 80;
            const pos_frequency_weight = 8;
            const possible_answer_weight = 400 * (progress ** 2);
            const overlap_weight = 8 * -progress;

            pos_frequencies = calculatePosFreq(possible_words);
            word_indecies = word_indecies.filter(v => wordle.meetsConditions(words[v]));
            const ent_table = genEntropyTable(possible_words.length);

            for (let g = 0; g < words.length; g++) {
                let guess = words[g];
                scores.entropy[g] = entropy_score(g, words, feedback_matrix, word_indecies, ent_table);
                scores.pos_freq[g] = posFreqScore(guess, pos_frequencies);
                scores.overlap[g] = overlapScore(guess, overlapBin);
            }

            scores.pos_freq = normalise(scores.pos_freq);
            scores.overlap = normalise(scores.overlap);

            for (let guess = 0; guess < words.length; guess++) {
                let score = 0;
                score += (1 - Math.pow(2, -scores.entropy[guess])) * entropy_weight;
                score += scores.pos_freq[guess] * pos_frequency_weight;
                score += scores.overlap[guess] * overlap_weight;
                if (wordle.meetsConditions(words[guess])) {
                    score += 1 * possible_answer_weight;
                }
                if (opt.rand !== undefined && opt.rand === true) {
                    score += 0.001 * Math.random();
                }

                if (score > best_score) {
                    best_score = score;
                    best_guess = words[guess];
                }
            }

            createOverlap(best_guess, overlapBin);
        }
        
        word_numbers.push(possible_words.length);
        guesses += 1;

        log(`Possible Words Left: ${possible_words.length}`);
        log(`Best Guess ${guesses}: ${best_guess}`);
        if (possible_words.length < 50) {
            log(`Other Guesses ${guesses}: ${possible_words}`);
        }
        
        // Feedback & Conditions updating
        if (opt.type === 'benchmark') {
            const feedback = wordle.evaluateGuess(best_guess);
            previous_guess_feedback = feedback;
            wordle.updateConditions(best_guess, feedback);
        } else if (opt.type === 'user') {
            best_guess   = await ask("What Word Did You Guess: ");
            const green  = await ask("Green Letters  - Use '.' for any blanks: ");
            const yellow = await ask("Yellow Letters - Use '.' for any blanks: ");
            
            const feedback = patternFromUserInput(green, yellow);
            previous_guess_feedback = feedback;
            wordle.updateConditions(best_guess, feedback);
        }

        possible_words = possible_words.filter((word) => { 
            return wordle.meetsConditions(word)
        })

        if (guesses > 6) {
            log("Couldn't Solve in 6 guesses");
            return { solved: false };
        } else if (previous_guess_feedback === 682) {
            log(`Solution: ${best_guess}`);
            log(`Guess ${guesses} - Yippeee!`);
            log(`Word Numbers By Guess: ${word_numbers}`);
            return { solved: true, answer: best_guess, guesses: guesses, word_count: word_numbers };
        } else if (possible_words.length === 0) {
            log("ERROR: No Correct Word Could Be Found");
            return { solved: false };
        }
        log('\n---|---|---|---')
    }
}

module.exports = { solve }