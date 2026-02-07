#!/usr/bin/env node

// NodeJS Imports
const path = require('path');

// Internal Web Server Imports
const webServer = require(path.join(__dirname, 'src/web/routes.js'));

// Internal Library Imports
let { solve : combinedSolver } = require(path.join(__dirname, 'src/solvers/combined.js'));
let { randomInt } = require(path.join(__dirname, 'src/lib/lib.js'))
const app_events = require(path.join(__dirname, 'src/lib/events.js'));
exports.app_events = app_events;

// Data Imports
let words = require(path.join(__dirname, 'data/filter/words.json'));
let test_data = require(path.join(__dirname, 'data/test/tests.json'))

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
            case 'user'      : await solve({ type: "user", rand: true, log: console.log }); break;
            case 'web'       : webServer(); await solve({ type: "web", rand: false, log: console.log }); break;
            default: throw `Invalid Mode Selected ${type}`
        }
    
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1)
    }
}

/**
 * @param {function} solve 
 * @param {num} benchmark_num 
 * @param {object} weights 
 * @param {string[]} tests 
 * @param {function} log
 */
async function benchmark(solve, benchmark_num = 100, tests, log) {
    const results = [];
    let total_guesses = 0;
    let correct = 0;
    let no_of_guesses = [0, 0, 0, 0, 0, 0];
    let avg = 0;

    for (let i=0; i < benchmark_num; i++) {
        let ans = words[randomInt(words.length)];
        let result;

        if (tests !== undefined) ans = tests[i];
        result = await solve({ type: 'benchmark', answer: ans, log: () => {} });

        if (result.solved === true) {
            total_guesses += result.guesses;
            correct++;
            no_of_guesses[result.guesses-1]++;
            avg = total_guesses/(i+1);
        } else {
            avg = total_guesses/(i+1);
            total_guesses += 8;
        }

        if (i % (benchmark_num / 100) === 0 && result.solved) {
            log(`Solved ${correct}/${i+1} | guesses:  ${result.guesses} | accuracy ${(correct / (i+1) * 100).toFixed(1)} | running avg: ${avg.toFixed(2)}`);
        } else if (i % (benchmark_num / 100) === 0) {
            log(`Solved ${correct}/${i+1} | guesses: >6 | accuracy ${(correct / (i+1) * 100).toFixed(1)} | running avg: ${avg.toFixed(2)}`);
        }

        results.push(result);
    }

    log(`Correct   - ${correct}/${benchmark_num} - ${correct / benchmark_num * 100}%`);
    log(`Avg Guess - ${avg.toFixed(3)}`);
    log('Guess Breakdown:')
    for (let i=0; i<no_of_guesses.length; i++) {
        if (i === 0) {
            log(`\t${i+1} guess   - ${no_of_guesses[0]}`);
        } else {
            log(`\t${i+1} guesses - ${no_of_guesses[i]}`);
        }
    }
}
