// NodeJS Imports
const path = require('path');

// Lib Imports
const { calculatePosFreq, pfHeuristicScore: posFreqScore, createOverlap, overlapScore } = require(path.join(__dirname, '../lib/heuristic.js'));
const { 
    calculateGuessEntropy: entropyScore, separationScore, patternDiversityScore, minmaxScore,
    loadFeedbackMatrix, genEntropyTable
} = require(path.join(__dirname, '../lib/entropy.js'));
const { randomInt } = require(path.join(__dirname, '../lib/lib.js'));
const { Wordle } = require(path.join(__dirname, '../lib/wordle.js'));
const log = require(path.join(__dirname, '../lib/log.js'));

// Load Required Data
const good_first_guesses = require(path.join(__dirname, '../../data/proc/first_guesses.json'));
const guesses = require(path.join(__dirname, '../../data/filter/guesses.json'));
const answers = require(path.join(__dirname, '../../data/filter/solutions.json'));
const fbm = loadFeedbackMatrix(path.join(__dirname, '../../data/proc/feedback_matrix.bin'));
const gi = new Map();
guesses.forEach((w, i) => gi.set(w, i));

/**
 * @typedef {Object} Guess
 * @property {String} word
 * @property {Number} score
 */

/**
 * @typedef {Object} State
 * @property {String} [computed_guess]
 * @property {String} [guess]
 * @property {Number} [feedback]
 * @property {String[]} guesses
 * @property {String[]} answers
 * @property {Boolean} likely_answers
 * @property {Array<Boolean>} [overlap]
 * @property {Number} turn
 * @property {Number} max_turns
 * @property {Wordle} wordle
 */


/**
 * 
 * @returns {State}
 */
function create() {
    return {
        computed_guess: good_first_guesses[randomInt(good_first_guesses.length)],
        guesses: guesses,
        answers: answers,
        likely_answers: true,
        overlap: createOverlap(""),
        turn: 1,
        max_turns: 6,
        wordle: new Wordle()
    }
}

/**
 * 
 * @param {State} state
 * @returns {State} next_state
 */
function advance(state) {
    let next_state = {...state}
    next_state.wordle.updateConditions(state.guess, state.feedback)
    next_state.answers = state.answers.filter(ans => state.wordle.meetsConditions(ans))
    next_state.turn += 1

    if (next_state.answers < 20)
        next_state.computed_guess = computeGuess(next_state, defaultCuller, minmaxScorer);
    else
        next_state.computed_guess = computeGuess(next_state);
    
    return next_state
}

/**
 * 
 * @param {State} state
 * @param {String} guess 
 * @param {Number} feedback 
 * @returns {State} next_state
 */
function advanceEasy(state, guess, feedback) {
    let next_state = {
        ...state,
        guess,
        feedback
    }
    return advance(next_state)
}

/**
 * 
 * @param {State} state 
 * @param {Function} cull 
 * @param {Function} score 
 * @returns 
 */
function computeGuess(
    state, 
    cull = defaultCuller, 
    score = defaultScorer,
) {
    if (state.turn === 1) return good_first_guesses[randomInt(good_first_guesses.length)];
    if (state.answers.length === 1) return state.answers[0];

    let progress = 1 - (state.answers.length / guesses.length);

    const guess_candidates = cull(guesses, state.answers, progress, state.overlap);
    const scored_guesses = score(guess_candidates, state.answers, progress, guesses.length);
    return scored_guesses
        .sort((a, b) => b.score - a.score)[0].word;
}

/**
 * Most guesses will not give meaningful information but take **significant computation**
 * to score accurately. Heuristics can approximate how useful a guess is much faster
 * returns <=200 'best' guesses to be evaluated further
 * 
 * @param {String[]} guesses
 * @param {String[]} answers 
 * @param {Number} progress 
 * value 0-1 based on how many answers there are left of the total. 
 * values close to 1 mean few answers are left
 * values close to 0 represent a large number of possible answers
 * @param {Array<Boolean>} overlap_bin
 * 
 * @returns { Array<Guess> }
 */
function defaultCuller(guesses, answers, progress, overlap_bin) {
    const pf = calculatePosFreq(answers);
    const ans_idxs = answers.map(ans => gi.get(ans));

    let scored_guesses = guesses.map(guess => { 
        let score = 0;

        score += posFreqScore(guess, pf) 
            * ( 25 * (1 - progress) ); // pf_weight (25 -> 0)
        score += overlapScore(guess, overlap_bin) 
            * ( 25 * (1 - progress) ); // overlap weight (25 -> 0)
        score += patternDiversityScore(
            gi.get(guess), ans_idxs, 
            fbm, guesses.length
        ) * ( 15 * progress ); // pattern diversity weight (0 -> 15)
        
        return { word: guess, score } 
    });

    return scored_guesses
        .sort((a, b) => b.score - a.score)
        .slice(0, 100)
}

/**
 * @param {Array<Guess>} guesses
 * @param {String[]} answers  
 * @param {Number} progress
 * @param {Number} stride
 * @returns {Array<Guess>}
 */
function defaultScorer(guesses, answers, progress, stride) {
    const ent_table = genEntropyTable(answers.length);
    const ans_idxs = answers.map(ans => gi.get(ans));

    guesses.forEach(guess => {
        const cheap_score = guess.score;
        guess.score = entropyScore(gi.get(guess.word), stride, fbm, ans_idxs, ent_table)
            * (80 * (1 - progress)); // Entropy Weight 80 -> 0
        if (answers.length < 20) guess.score += cheap_score;
        guess.score += 0.001 * Math.random(); // Vary guesses slightly to prevent worst cases
    })

    return guesses
}

/**
 * @param {Array<Guess>} guesses
 * @param {String[]} answers  
 * @param {null} [_progress]
 * @param {Number} stride 
 * @returns {Array<Guess>}
 */
function minmaxScorer(guesses, answers, _progress = null, stride) {
    const ans_idxs = answers.map(ans => gi.get(ans));

    guesses.forEach(guess => 
        guess.score = minmaxScore(gi.get(guess.word), stride, fbm, ans_idxs)
    );

    return guesses
}

module.exports = { create, advance, advanceEasy }