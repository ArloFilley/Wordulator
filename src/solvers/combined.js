// NodeJS Imports
const path = require('path');
const { once } = require('events');

// Shared App State
let current_best_guess = null;

// Lib Imports
const { calculatePosFreq, pfHeuristicScore: posFreqScore, createOverlap, overlapScore } = require(path.join(__dirname, '../lib/heuristic.js'));
const { 
    calculateGuessEntropy: entropyScore, separationScore, patternDiversityScore, minmaxScore,
    loadFeedbackMatrix, genEntropyTable
} = require(path.join(__dirname, '../lib/entropy.js'));
const { ask /*, normalise */ } = require(path.join(__dirname, '../lib/lib.js'));
const { Wordle, patternFromUserInput } = require(path.join(__dirname, '../lib/wordle.js'));
const app_events = require(path.join(__dirname, '../lib/events.js'));

// Load Required Data
const guesses = require(path.join(__dirname, '../../data/filter/words.json'));
const answers = require(path.join(__dirname, '../../data/filter/solutions.json'));
const fbm = loadFeedbackMatrix(path.join(__dirname, '../../data/proc/feedback_matrix.bin'));
const guess_index = new Map();
guesses.forEach((w, i) => guess_index.set(w, i));

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
    let word_indecies = answers.map((v, i) => guess_index.get(v));
    let overlap_bin = "";

    // Stats and tracking
    let guess_no = 0;
    const word_numbers = []

    while (true) {
        // Strategize & Guess
        let progress =  1 - (possible_words.length / guesses.length);
        let best_guess = '!@??*';

        if (guess_no === 0) {
            best_guess = 'dares'; // First guess is predefined based on entropy
            overlap_bin = createOverlap('dares');
        } else if (possible_words.length === 1) {
            // Optimisation for When Only 1 Possible Guess is Left
            best_guess = possible_words[0]; 
        } else {
            // Weights
            const entropy_weight = 80 + 80 * -progress;

            word_indecies = word_indecies.filter(v => wordle.meetsConditions(guesses[v]));
            const ent_table = genEntropyTable(possible_words.length);

            // Cull the set of possible guesses. Most guesses will not give meaningful
            // information and a number of heuristics can approximate this
            // returns ~200 or so 'good' guesses to be evaluated further
            let good_guesses = cull_bad_guesses(guesses, possible_words, wordle, overlap_bin);

            // Use more expensive entropy|minmax scoring once 'good' guesses have been found
            if (possible_words.length > 20) {
                for (let i = 0; i < good_guesses.length; i++) {
                    const g = good_guesses[i].guess_index;
                    const ent_score = entropyScore(g, guesses.length, fbm, word_indecies, ent_table);
                    good_guesses[i].entropy_score = ent_score;
                    good_guesses[i].total_score += (1 - Math.pow(2, -ent_score)) * entropy_weight;
                    if (possible_words.length < 20) good_guesses[i].total_score += good_guesses[i].cheap_score;
                    if (opt.rand !== undefined && opt.rand === true) {
                        good_guesses[i].total_score += 0.001 * Math.random();
                    }
                }

                good_guesses.sort((a, b) => b.total_score - a.total_score);
            } else {
                for (let i = 0; i < good_guesses.length; i++) {
                    const g = good_guesses[i].guess_index;
                    const mm_score = minmaxScore(g, guesses.length, fbm, word_indecies, ent_table);
                    good_guesses[i].total_score = mm_score;
                }

                good_guesses.sort((a, b) => a.total_score - b.total_score);
            }

            
            best_guess = good_guesses[0].guess_word;

            overlap_bin = createOverlap(best_guess, overlap_bin);
        }
        
        word_numbers.push(possible_words.length);
        guess_no += 1;

        log(`Possible Words Left: ${possible_words.length}`);
        log(`Best Guess ${guess_no}: ${best_guess}`);
        if (possible_words.length < 50) log(`Possible Answers: ${possible_words}`);
        current_best_guess = best_guess;

        let { guess, feedback } = await getFeedback(opt.type, wordle, current_best_guess);
        wordle.updateConditions(guess, feedback);

        possible_words = possible_words.filter(word => wordle.meetsConditions(word));

        if (guess_no > 6) {
            log("Couldn't Solve in 6 guesses");
            return { solved: false };
        } else if (feedback === 682) {
            log(`Solved on Guess ${guess_no} => ${best_guess} | Word Numbers By Guess: ${word_numbers}`);
            return { solved: true, answer: best_guess, guesses: guess_no, word_count: word_numbers };
        } else if (possible_words.length === 0) {
            log("ERROR: No Correct Word Could Be Found");
            return { solved: false };
        }
        log('\n---|---|---|---')
    }
}

/**
 * 
 * @param {Number[]} all_possible_guesses 
 * @param {*} possible_answers 
 * @param {Wordle} wordle 
 * @returns {[{ guess_index: Number, guess_word: String, cheap_score: Number, entropy_score: Number, total_score: Number}]}
 */
function cull_bad_guesses(all_possible_guesses, possible_answers, wordle, overlap_bin) {
    const answers_left = possible_answers.length;
    const fbm_stride = all_possible_guesses.length;
    const pos_frequencies = calculatePosFreq(possible_answers);
    const answer_indecies = possible_answers.map(a => guess_index.get(a));

    const progress = 1 - (answers_left / all_possible_guesses.length);

    // Early Game Heuristics
    const pf_weight = 25 + -progress * 25; // 25 -> 0
    const overlap_weight = 25 + -progress * 25; // 25 -> 0
    // Late Game Heuristics
    const pattern_diversity_weight = 15 * progress; // 0 -> 15
    const possible_answer_weight = 8 * progress; // 0 -> 8
    const separation_weight = 25 * progress; // 0 -> 25

    let good_guesses = new Array();

    // Calculate a cheap score for each guess
    // Use cheap scores to evaluate which guesses to use full entropy feedback
    // scoring for
    for (let g = 0; g < all_possible_guesses.length; g++) {
        let guess = all_possible_guesses[g];
        let cheap_score = -Infinity;

        const pf_score = posFreqScore(guess, pos_frequencies) * pf_weight;
        const overlap_score = overlapScore(guess, overlap_bin) * overlap_weight;
        const possible_answer_score = wordle.meetsConditions(guess) ? 1 * possible_answer_weight : 0;
        const pattern_diversity_score = patternDiversityScore(g, answer_indecies, fbm, fbm_stride) * pattern_diversity_weight;

        cheap_score = pf_score + overlap_score + possible_answer_score + pattern_diversity_score;
        
        good_guesses.push({ 
            guess_index: g, guess_word: guess, 
            cheap_score, entropy_score: null, total_score: null
        });
    }

    good_guesses.sort((a, b) => b.cheap_score - a.cheap_score);

    if (answers_left > 20) good_guesses = good_guesses.splice(0, 100);
    else {
        good_guesses = good_guesses.splice(0, 100);
        for (let i = 0; i < good_guesses.length; i++) {
            const g = good_guesses[i].guess_index;
            good_guesses[i].cheap_score += separationScore(g, answer_indecies, fbm, fbm_stride) * separation_weight;
        }
        good_guesses = good_guesses.splice(0, 50);
    }

    return good_guesses;
}

/**
 * 
 * @param {String} type 
 * @param {Wordle} wordle 
 * @returns 
 */
async function getFeedback(type, wordle, guess) {
    // Feedback & Conditions updating
    if (type === 'benchmark') {
        const feedback = wordle.evaluateGuess(guess);
        return { guess, feedback };
    } else if (type === 'user') {
        let guess = await ask("What Word Did You Guess: ");
        const green = await ask("Green Letters  - Use '.' for any blanks: ");
        if (guess === green) return { guess, feedback: 682 };

        const yellow = await ask("Yellow Letters - Use '.' for any blanks: ");
        
        
        const feedback = patternFromUserInput(green, yellow);
        return { guess, feedback };

    } else if (type === 'web') {
        const data = await once(app_events, 'web.guess');
        const guess = data[0].guess;
        const green = data[0].green;
        const yellow = data[0].yellow;

        if (guess === green) return { guess, feedback: 682 };

        // console.log(`Web Guess Recieved
        //     ${guess}
        //     ${green}
        //     ${yellow}
        // `);

        const feedback = patternFromUserInput(green, yellow);
        return { guess, feedback };
    }
}

/**
 * 
 * @returns {String}
 */
function getCurrentBestGuess() {
    return current_best_guess;
}

module.exports = { solve, getCurrentBestGuess }