const fs = require('fs');

const { calculatePosFreq, pfHeuristicScore: posFreqScore } = require('../lib/heuristic.js');
const { calculateGuessEntropy: entropy_score, genEntropyTable, loadFeedbackMatrix }   = require('../lib/entropy.js');
const { ask, normalise, patternToIndex } = require('../lib/lib.js');
const { Wordle, patternFromUserInput } = require('../lib/wordle.js')

const words = require('../../data/filter/words.json');
const feedback_matrix = loadFeedbackMatrix('./data/proc/feedback_matrix.bin');
const second_guesses = new Uint8Array(fs.readFileSync('./data/proc/second_guesses.bin'));
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
    let possible_words = words;
    let pos_frequencies;
    let previous_guess_feedback = null;
    const scores = { entropy: new Array(words.length), pos_freq: new Array(words.length) }
    let word_indecies = words.map((v, i) => i);

    // Stats and tracking
    let guesses = 0;
    const word_numbers = []

    // Weights
    /** @type {number[]} */
    let entropy_weights = [];
    /** @type {number[]} */
    let pos_frequency_weights = [];
    /** @type {number[]} */
    let possible_answer_weights = [];
    /** @type {number[]} */
    let phases = [];
    if (opt.weights === undefined) {
        entropy_weights.push(0.7361);
        pos_frequency_weights.push(13.5323);
        possible_answer_weights.push(6.8423);
        phases.push(words.length);
    } else if (opt.weights.phases === undefined) {
        entropy_weights.push(words.length);
        pos_frequency_weights.push(opt.weights.pw);
        possible_answer_weights.push(opt.weights.cw);
        phases.push(2000);
    } else {
        entropy_weights = opt.weights.ew;
        pos_frequency_weights = opt.weights.pw;
        possible_answer_weights = opt.weights.cw;
        phases = opt.weights.phases;
    }

    while (true) {
        // Strategize & Guess
        let best_guess = '!@??*';
        let best_score = -Infinity;

        if (guesses === 0) best_guess = 'dares'; // First guess is predefined based on entropy
        else if (possible_words.length === 1) best_guess = possible_words[0];
        else {
            let phase = 0;
            for (let i = 0; i < phases.length; i++) {
                if (possible_words.length < phases[i]) phase = i;
            }

            const entropy_weight = entropy_weights[phase];
            const pos_frequency_weight = pos_frequency_weights[phase];
            const possible_answer_weight = possible_answer_weights[phase];

            pos_frequencies = calculatePosFreq(possible_words);
            word_indecies = word_indecies.filter(v => wordle.meetsConditions(words[v]));
            const ent_table = genEntropyTable(possible_words.length);

            for (let g = 0; g < words.length; g++) {
                let guess = words[g];
                scores.entropy[g] = entropy_score(g, words, feedback_matrix, word_indecies, ent_table);
                scores.pos_freq[g] = posFreqScore(guess, pos_frequencies);
            }

            scores.pos_freq = normalise(scores.pos_freq);

            for (let guess = 0; guess < words.length; guess++) {
                let score = 0;
                score += (1 - Math.pow(2, -scores.entropy[guess])) * entropy_weight;
                score += scores.pos_freq[guess] * pos_frequency_weight;
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