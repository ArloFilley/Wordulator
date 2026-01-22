let { solve : combinedSolver  } = require('./src/solvers/combined.js')
let { solve : entropySolver   } = require('./src/solvers/entropy.js')
let { solve : heuristicSolver } = require('./src/solvers/heuristic.js')
let { randomInt } = require('./src/lib/lib.js')

let words = require('./data/filter/words.json');

main();

async function main() {
    try {
        const args          = process.argv.slice(2);
        const solver        = typeof(args[0]) === 'string'  ? args[0] : () => { throw "No solver selected" };
        const is_benchmark  = args[1] === 'true'            ? true : false;
        const benchmark_num = args[2] > 0                   ? Number.parseInt(args[2]) : 100;
    
        let solve;
        if (solver === 'combined') {
            solve = combinedSolver;
        } else if (solver === 'entropy') {
            solve = entropySolver;
        } else if (solver === 'heuristic') {
            solve = heuristicSolver;
        } else {
            throw `Invalid Solver Selected ${solver}`
        }

        console.clear();
        if (is_benchmark) {
            await benchmark(solve, benchmark_num);
        } else {
            await solve({ type: "user" });
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1)
    }
}

async function benchmark(solve, benchmark_num = 100) {
    const results = [];
    let total_guesses = 0;
    let correct = 0;
    let no_of_guesses = [0, 0, 0, 0, 0, 0];
    let avg = 0;

    for (let i=0; i < benchmark_num; i++) {
        const ans = words[randomInt(words.length)];
        const result = await solve({ type: 'benchmark', answer: ans });
        if (result.solved === true) {
            total_guesses += result.guesses;
            correct++;
            no_of_guesses[result.guesses-1]++;
            avg = total_guesses/(i+1);
            console.clear();
            console.log(`Solved ${i+1}/${benchmark_num} | guesses:  ${result.guesses} | running avg: ${avg.toFixed(2)}`);
        } else {
            avg = total_guesses/(i+1);
            total_guesses += 7;
            console.clear();
            console.log(`Solved ${i+1}/${benchmark_num} | guesses: >6`);
        }
        results.push(result);
        
    }

    console.clear();
    console.log(`Correct   - ${correct}/${benchmark_num} - ${correct / benchmark_num * 100}%`);
    console.log(`Avg Guess - ${avg.toFixed(3)}`);
    console.log('Guess Breakdown:')
    for (let i=0; i<no_of_guesses.length; i++) {
        if (i === 0) {
            console.log(`\t${i+1} guess   - ${no_of_guesses[0]}`);
        } else {
            console.log(`\t${i+1} guesses - ${no_of_guesses[i]}`);
        }
    }

    process.exit(0);
}