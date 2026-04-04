// NodeJS Imports
const path = require("path");

// Lib Imports
const { randomInt } = require(path.join(__dirname, "../lib/lib.js"));
const { Wordle } = require(path.join(__dirname, "../lib/wordle.js"));
const log = require(path.join(__dirname, "../lib/log.js"));
const { defaultCuller } = require("./cullers.js");
const { defaultScorer, minmaxScorer, cheapScorer } = require("./scorers.js");

// Load Required Data
const goodFirstGuesses = require(
  path.join(__dirname, "../../data/proc/first_guesses.json"),
);
const valid_guesses = require(
  path.join(__dirname, "../../data/filter/guesses.json"),
);
const likely_answers = require(
  path.join(__dirname, "../../data/filter/solutions.json"),
);

/**
 * @typedef {Object} Guess
 * @property {String} word
 * @property {Number} feedback
 */

/**
 * @typedef {Object} GameState
 * @property {Guess[]} guesses
 * @property {String[]} valid_guesses
 * @property {String[]} likely_answers
 * @property {[Number, Number]} turns - `[current, max]`
 */

/**
 * @returns {State}
 */
function create() {
  return {
    guesses: [],
    valid_guesses,
    likely_answers,
    turns: [1, 6],
  };
}

/**
 *
 * @param {GameState} state
 * @returns {GameState} next_state
 */
function advance(state, guess, feedback) {
  return {
    ...state,
    guesses: [...state.guesses, { word: guess, feedback }],
    turns: [state.turns[0] + 1, state.turns[1]],
  };
}

/**
 * @typedef BestGuess
 * @property word
 * @property answersLeft
 */

/**
 * # Parameters
 * @param {State} state
 * @param {Function} cull
 * @param {Function} score
 *
 * # Returns
 *
 * @returns {BestGuess} bestGuess
 */
function play(state) {
  if (state.turns[0] === 1) {
    return {
      word: goodFirstGuesses[randomInt(20)],
      answersLeft: state.likely_answers.length,
    };
  }

  let wordle = new Wordle();
  for (const guess of state.guesses) {
    wordle.updateConditions(guess.word, guess.feedback);
  }

  let answers = state.likely_answers.filter((answer) =>
    wordle.meetsConditions(answer),
  );
  if (answers.length <= 0) {
    answers = state.valid_guesses.filter((answer) =>
      wordle.meetsConditions(answer),
    );
  }

  const guesses = state.valid_guesses.map((guess) => {
    return { word: guess, score: 0 };
  });

  let goodGuesses = cheapScorer(state, guesses, answers)
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);

  if (answers.length < 50) {
    return {
      word: minmaxScorer(state, goodGuesses, answers).sort(
        (a, b) => a.score - b.score,
      )[0].word,
      answersLeft: answers.length,
    };
  } else {
    return {
      word: defaultScorer(state, goodGuesses, answers).sort(
        (a, b) => a.score - b.score,
      )[0].word,
      answersLeft: answers.length,
    };
  }
}

module.exports = { create, advance, play };
