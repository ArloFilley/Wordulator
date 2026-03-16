#!/usr/bin/env node

// NodeJS Imports
const path = require('path');

// Internal Web Server Imports
const webServer = require('./src/web/routes.js');

// Internal Library Imports
let { solve: combinedSolver } = require('./src/solvers/combined.js');

const app_events = require(path.join(__dirname, './src/lib/events.js'));
exports.app_events = app_events;

// Data Imports
let test_data = require('./data/test/tests.json');

main();
async function main() {
    try {
        const args          = process.argv.slice(2);
        const type          = typeof(args[0]) === 'string'  ? args[0] : 'user';
        const num           = args[1] > 0                   ? Number.parseInt(args[1]) : 100;
    
        let solve = combinedSolver;

        switch (type) {
            case 'bench'     : await benchmark(solve, num, test_data, console.log); break;
            case 'benchmark' : await benchmark(solve, num, test_data, console.log); break;                                       
            case 'user'      : await userGame(); break;
            case 'web'       : webServer(); break;
            default: throw `Invalid Mode Selected ${type}`
        }
    
        if (type !== 'web') process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1)
    }
}

async function userGame() {
    // Create a new game
    // Output best guess
    // input new guess
    // advance
    // repeat till answer/out of guesses
}