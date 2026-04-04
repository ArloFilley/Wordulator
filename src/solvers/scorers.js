// Imports
const path = require("node:path");

const log = require("../lib/log.js");

const {
  calculatePosFreq,
  pfHeuristicScore: posFreqScore,
  createOverlap,
  overlapScore,
} = require("../lib/heuristic.js");

const {
  calculateGuessEntropy: entropyScore,
  separationScore,
  patternDiversityScore,
  minmaxScore,
  loadFeedbackMatrix,
  genEntropyTable,
} = require("../lib/entropy.js");

/**
 * @typedef {import('./combined.js').GameState} GameState
 */

// State
const fbm = loadFeedbackMatrix(
  path.join(__dirname, "../../data/proc/feedback_matrix.bin"),
);

/**
 * Object Representing a scored guess
 * @typedef {Object} Guess
 * @property {String} word
 * @property {Number} score
 */

/**
 * # Parameters
 *
 * @param {GameState} state - current state of the game
 * @param {Guess[]} guesses - guesses that should be scored
 * @param {String[]} answers - valid answers
 *
 * # Return
 *
 * Array of guesses with score
 *
 * @returns {Array<Guess>}
 */
function defaultScorer(state, guesses, answers) {
  guesses = cheapScorer(state, [...guesses], [...answers]);
  const entropy_table = genEntropyTable(guesses.length);
  const answer_indecies = answers.map((answer) =>
    state.valid_guesses.indexOf(answer),
  );

  for (let i = 0; i < guesses.length; i++) {
    guesses[i].score =
      guesses[i].score +
      entropyScore(
        state.valid_guesses.indexOf(guesses[i].word),
        state.valid_guesses.length,
        fbm,
        answer_indecies,
        entropy_table,
      );
  }

  return guesses;
}

/**
 * # Parameters
 *
 * @param {GameState} state - The current state of the game
 * @param {Guess[]} guesses - A list of guesses to score
 * @param {String[]} answers - valid answers
 *
 * # Returns
 *
 * Array of guesses with score
 *
 * @returns {Guess[]}
 */
function minmaxScorer(state, guesses, answers) {
  guesses = [...guesses];
  const answer_indecies = answers.map((answer) => {
    state.valid_guesses.indexOf(answer);
  });

  for (let i = 0; i < guesses.length; i++) {
    guesses[i].score = minmaxScore(
      state.valid_guesses.indexOf(guesses[i].word),
      state.likely_answers.length,
      fbm,
      answer_indecies,
    );
  }

  return guesses;
}

/**
 * Culls a list of guesses providing a list of better guesses
 *
 * Most guesses will not give meaningful information but take **significant computation**
 * to score accurately. Heuristics can approximate how useful a guess is much faster
 * returns <=200 'best' guesses to be evaluated further
 *
 * # Parameters
 *
 * @param {GameState} state - Current state of the game
 * @param {Guess[]} guesses - Guesses to score
 * @param {String[]} answers - The possible answers
 *
 * # Returns
 *
 * Array of guesses with score
 *
 * @returns {Guess[]}
 */
function cheapScorer(state, guesses, answers) {
  guesses = [...guesses];

  const pf = calculatePosFreq(answers);
  const ans_idxs = answers.map((answer) => {
    return state.valid_guesses.indexOf(answer);
  });
  let overlap_bin = new Array(26).fill(false);
  for (let i = 0; i < state.guesses.length; i++) {
    overlap_bin = createOverlap(state.guesses[i], overlap_bin);
  }

  for (let i = 0; i < guesses.length; i++) {
    let score = 0;
    score += posFreqScore(guesses[i].word, pf) * 15; // pf_weight (25 -> 0)
    score += overlapScore(guesses[i].word, overlap_bin) * 15; // overlap weight (25 -> 0)
    score +=
      patternDiversityScore(
        state.valid_guesses.indexOf(guesses[i].word),
        ans_idxs,
        fbm,
        state.valid_guesses.length,
      ) * 8;
    guesses[i].score = score;
  }

  return guesses;
}

module.exports = { cheapScorer, minmaxScorer, defaultScorer };
