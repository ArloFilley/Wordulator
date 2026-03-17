#!/usr/bin/env node

// NodeJS Imports
const path = require('path');

// Internal Imports
const CreateWebServer = require('./src/web/routes.js');
const { create, advanceEasy } = require('./src/solvers/combined.js');
const log = require("./src/lib/log.js");
const { getUserFeedback } = require("./src/lib/input.js");

// Data Imports
let test_data = require('./data/test/tests.json');

main();
async function main() {
    try {
        const args          = process.argv.slice(2);
        const type          = typeof(args[0]) === 'string'  ? args[0] : 'user';
        const num           = args[1] > 0                   ? Number.parseInt(args[1]) : 100;
    
        switch (type) {
            case 'bench'     : await benchmark(solve, num, test_data, console.log); break;
            case 'benchmark' : await benchmark(solve, num, test_data, console.log); break;                                       
            case 'user'      : await userGame(); break;
            case 'web'       : CreateWebServer(); break;
            default: throw `Invalid Mode Selected ${type}`
        }
    
        if (type !== 'web') process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1)
    }
}

async function userGame() {
    let game = create();

    while (game.answers.length > 1 && game.turn < game.max_turns) {
        console.log(`Best Guess: ${game.computed_guess} - ${game.answers.length}`);
        let { guess, feedback } = await getUserFeedback()
        game = advanceEasy(game, guess, feedback)
    }

    console.log(`Best Guess: ${game.computed_guess} - ${game.answers.length}`);
}