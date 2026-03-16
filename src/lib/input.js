const path = require('path');

const { ask } = require(path.join(__dirname, '../lib/lib.js'));
const { patternFromUserInput } = require(path.join(__dirname, '../lib/wordle.js'));
const app_events = require(path.join(__dirname, '../lib/events.js'));

/**
 * 
 * @returns {{ guess: String, feedback: Number }}
 */
async function getUserFeedback() {
    let guess = await ask("What Word Did You Guess: ");
    const green = await ask("Green Letters  - Use '.' for any blanks: ");

    // If Guess is Full Green Exit Early Because Answer Found
    if (guess === green) return { guess, feedback: 682 };
    const yellow = await ask("Yellow Letters - Use '.' for any blanks: ");
    
    return { 
        guess: guess, 
        feedback: patternFromUserInput(green, yellow) 
    };
}

/**
 * 
 * @param {String} guess
 * @param {String} id
 * @returns {{ guess: String, feedback: Number }}
 */
async function getWebFeedback(id) {
    const feedback_message = new Promise((resolve) => { 
        const handler = (msg_id, data) => {
            if (msg_id !== id) return;

            app_events.off('web.guess', handler);
            resolve(data);
        };

        app_events.on('web.guess', handler)
    });

    const feedback = await feedback_message;

    return {
        guess: feedback.guess, 
        feedback: patternFromUserInput(feedback.green, feedback.yellow) 
    };
}

/**
 * 
 * @param {String} guess
 * @param {String} id
 * @param {Wordle} wordle
 * @returns {{ guess: String, feedback: Number }}
 */
async function getBenchFeedback(guess, wordle) {
    const feedback = wordle.evaluateGuess(guess);
    return { guess, feedback };
}

module.exports = { getUserFeedback, getWebFeedback, getBenchFeedback }