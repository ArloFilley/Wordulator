// NodeJS Imports
const path = require("path");

// Lib Imports
const { randomInt } = require(path.join(__dirname, "../lib/lib.js"));
const { Wordle } = require(path.join(__dirname, "../lib/wordle.js"));
const log = require(path.join(__dirname, "../lib/log.js"));
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

class Game {
  /**
   * # Parameters
   *
   * @param {Number} maxTurns - Number of turns this game should last | Default: `6`
   *
   * # Returns
   * @returns {Game} game - a new game object
   */
  constructor(maxTurns = 6) {
    /**
     * @typedef {Object} GameState
     * @property {Guess[]} guesses
     * @property {String[]} valid_guesses
     * @property {String[]} likely_answers
     * @property {Turns} turns - `[current, max]`
     */
    /**
     * @typedef {Object} Turns
     * @property {Number} current
     * @property {Number} max
     */
    this.state = {
      guesses: [],
      valid_guesses,
      likely_answers,
      turns: { current: 1, max: maxTurns },
    };

    this.cache = {
      currentTurn: 1,
      word: goodFirstGuesses[randomInt(20)],
      answersLeft: this.state.likely_answers.length,
    };
  }

  /**
   * Sets the current state of the game to what is passed
   * @param {GameState} state
   */
  setState(state) {
    this.state = state;
  }

  /**
   * returns the current turn of this game
   * @returns {Number} currentTurn
   */
  get currentTurn() {
    return this.state.turns.current;
  }

  /**
   * return a copy of the current game state useful for saving a game to be
   * played later
   * @returns {GameState} gameState
   */
  // get state() {
  //  return { ...this.state };
  // }

  /**
   * set the current game state
   * @parameters {GameState} gameState
   */
  // set state(gameState) {
  //  this.state = gameState;
  // }

  /**
   * Advance the game state by providing the details of a guess
   *
   * # Parameters
   *
   * @param {String} word - the guessed word
   * @param {Number} feedback - an integer feedback pattern for the guess
   */
  advance(word, feedback) {
    this.state.guesses.push({ word, feedback });
    this.state.turns.current += 1;
  }

  /**
   * @typedef BestGuess
   * @property word
   * @property answersLeft
   */
  /**
   * Calculates a great guess from the current game state,
   * providing a cached guess if one exists for the current turn
   *
   * @returns {BestGuess} guess
   */
  get guess() {
    // If there's a cached guess for the current turn there's no reason to rescore
    // all possible guesses. Much cheaper to just return the cached guess
    if (this.cache.currentTurn === this.state.turns.current) {
      return { word: this.cache.word, answersLeft: this.cache.answersLeft };
    }

    const state = { ...this.state };

    // We create a new wordle object for each guess to avoid problems with managing
    // state. Any given game state should produce the same guess. Storing a wordle
    // object is difficult without side effects
    let wordle = new Wordle();
    for (const guess of state.guesses) {
      wordle.updateConditions(guess.word, guess.feedback);
    }

    let answers = state.likely_answers.filter((answer) =>
      wordle.meetsConditions(answer),
    );

    // If the likely answers haven't found the answer then it must be somewhere
    // in the list of valid guesses
    if (answers.length <= 0) {
      answers = state.valid_guesses.filter((answer) =>
        wordle.meetsConditions(answer),
      );
    }

    // This is done as `scorer()` functions expect an array of scorable guesses
    const guesses = state.valid_guesses.map((guess) => {
      return { word: guess, score: 0 };
    });

    // Cull guesses by cheap heuristics to avoid scoring potentially thousands
    // of not-so-useful guesses
    let goodGuesses = cheapScorer(state, guesses, answers)
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);

    // Fully score guesses using an appropriate complexity scoring calculation
    let fullyScoreGuesses;
    if (answers.length < 50) {
      fullyScoreGuesses = minmaxScorer(state, goodGuesses, answers);
    } else {
      fullyScoreGuesses = defaultScorer(state, goodGuesses, answers);
    }

    const bestGuess = fullyScoreGuesses.sort((a, b) => b.score - a.score)[0];

    this.cache = {
      word: bestGuess.word,
      answersLeft: answers.length,
      currentTurn: state.turns.current,
    };
    return {
      word: bestGuess.word,
      answersLeft: answers.length,
    };
  }
}

module.exports = { Game };
