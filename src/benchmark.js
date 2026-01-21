let { solve } = require('./main.js')
let { randomInt } = require('./lib.js')
let words = require('../data/filtered_words.json');

async function main() {
    const results = [];
    for (let i=0; i<100; i++) {
        const ans = words[randomInt(words.length)];
        results.push(
            await solve({ type: 'benchmark', answer: ans })
        );
    }

    let correct = 0;
    let total_guesses = 0;
    let no_of_guesses = [0, 0, 0, 0, 0, 0]
    for (result of results) {
        if (result.solved === true) { 
            correct++;
            total_guesses += result.guesses;
            no_of_guesses[result.guesses] += 1;
        }
    }

    console.log(`correct: ${correct}/100 - ${correct}%`);
    console.log(`avg guess: ${total_guesses/correct}`);
    console.log(no_of_guesses);
}   

main();