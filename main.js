let { solve : combinedSolver   } = require('./src/solvers/combined.js')
let { solve : entropySolver    } = require('./src/solvers/entropy.js')
let { solve : heuristicSolver  } = require('./src/solvers/heuristic.js')
let { randomInt, randomUniform } = require('./src/lib/lib.js')


let words = require('./data/filter/words.json');
let test_data = require('./data/test/tests.json')
let pre_weights = require("./data/proc/optimised_end_weights.json")


main();
async function main() {
    try {
        const args          = process.argv.slice(2);
        const solver        = typeof(args[0]) === 'string'  ? args[0] : () => { throw "No solver selected" };
        const type          = typeof(args[1]) === 'string'  ? args[1] : 'user';
        const num           = args[2] > 0                   ? Number.parseInt(args[2]) : 100;
        const num2          = args[3] > 0                   ? Number.parseInt(args[3]) : 100;
    
        let solve;
        switch (solver) {
            case 'combo'     : solve = combinedSolver;    break;
            case 'combined'  : solve = combinedSolver;    break;
            case 'ent'       : solve = entropySolver;     break;
            case 'entropy'   : solve = entropySolver;     break;
            case 'heur'      : solve = heuristicSolver;   break;
            case 'heuristic' : solve = heuristicSolver;   break;
            default: throw `Invalid Solver Selected ${solver}`
        }

        switch (type) {
            case 'bench'     : await benchmark(solve, num, pre_weights, test_data, console.log);            break;
            case 'benchmark' : await benchmark(solve, num, pre_weights, test_data, console.log);            break;
            case 'wt'        : await weight_test(solve, num, num2);                                           break;
            case 'wtest'     : await weight_test(solve, num, num2);                                         break;
            case 'user'      : await solve({ type: "user", weights: pre_weights, rand: true, log: true });  break;
            default: throw `Invalid Mode Selected ${type}`
        }
    
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1)
    }
}

/**
 * 
 * @param {function} solve 
 * @param {num} benchmark_num 
 * @param {object} weights 
 * @param {string[]} tests 
 * @param {function} log
 * @returns 
 */
async function benchmark(solve, benchmark_num = 100, weights, tests , log) {
    const results = [];
    let total_guesses = 0;
    let correct = 0;
    let no_of_guesses = [0, 0, 0, 0, 0, 0];
    let avg = 0;

    for (let i=0; i < benchmark_num; i++) {
        let ans = words[randomInt(words.length)];
        let result;

        if (tests !== undefined) ans = tests[i];
        if (weights !== undefined) result = await solve({ type: 'benchmark', answer: ans, weights, rand: false, log: () => {} });
        else result = await solve({ type: 'benchmark', answer: ans });

        if (result.solved === true) {
            total_guesses += result.guesses;
            correct++;
            no_of_guesses[result.guesses-1]++;
            avg = total_guesses/(i+1);
        } else {
            avg = total_guesses/(i+1);
            total_guesses += 8;
        }

        if (i % 20 === 0 && result.solved) {
            log(`Solved ${correct}/${i+1} | guesses:  ${result.guesses} | accuracy ${(correct / (i+1) * 100).toFixed(1)} | running avg: ${avg.toFixed(2)}`);
        } else if (i % 20 === 0) {
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

    return { avg: avg, acc: correct/benchmark_num }
}

/**
 * @param {function} solve
 * @param {number} trials 
 * @param {number} evaluations
 */
async function weight_test(solve, trials, evaluations) {
    let bestScore = Infinity;
    let bestWeights = null;
    let bestScores = {avg: 8, acc: 0};
    let weights;

    for (let t = 0; t < trials; t++) {
        // Sample in log space
        let eu1 = randomUniform(0, 3);
        let pu1 = randomUniform(-2, 1);
        let cu1 = randomUniform(-2, 2);

        let eu2 = randomUniform(-2, 2);
        let pu2 = randomUniform(-2, 2);
        let cu2 = randomUniform(-2, 2);

        let eu3 = randomUniform(-2, 1);
        let pu3 = randomUniform(0, 2);
        let cu3 = randomUniform(0, 2);
        let mcu = 200;
        let ecu = 25;
        
        // Beginning Weights
            // let ew1 = Math.pow(10, wu1);
            // let pw1 = Math.pow(10, pu1);
            // let cw1 = Math.pow(10, cu1);
            let ew1 = 80.08531;
            let pw1 =  0.58367;
            let cw1 =  1.60958;

        // Middle Weights
            let ew2 = Math.pow(10, eu2);
            let pw2 = Math.pow(10, pu2);
            let cw2 = Math.pow(10, cu2);
            // let ew2 =  0.03572;
            // let pw2 = 27.22678;
            // let cw2 = 93.23757;

        // End Weights
            // let ew3 = Math.pow(10, eu3);
            // let pw3 = Math.pow(10, pu3);
            // let cw3 = Math.pow(10, cu3);
            let ew3 =  0.67722;
            let pw3 =  1.84866;
            let cw3 = 14.50852;
        
        weights = { 
            ew: [ew1, ew2, ew3], 
            pw: [pw1, pw2, pw3], 
            cw: [cw1, cw2, cw3], 
            mc: mcu, 
            ec: ecu 
        }

        // Evaluate
        let result = await benchmark(solve, evaluations, weights, test_data, () => {});
        let score = result.avg;

        // Keep the best result
        if (score < bestScore) {
            console.log(`New Best Score - Avg:${score.toFixed(8)} - Avg Imp: ${bestScores.avg - result.avg} - Acc Dff: ${result.acc - bestScores.acc} | ew: ${ew2.toFixed(5)} pw: ${pw2.toFixed(5)} cw: ${cw2.toFixed(5)}`),
            bestScore = score;
            bestScores = result;
            bestWeights = weights;
        }

        console.log(`${t+1}/${trials} - ${(t+1)*evaluations}/${evaluations*trials}\n`, 
            `\t-> This Score ${result.avg.toFixed(6)} - ${result.acc.toFixed(4)} | ew: ${ew3.toFixed(5)} pw: ${pw3.toFixed(5)} cw: ${cw3.toFixed(5)}\n`,
            `\t-> Best Score ${bestScores.avg.toFixed(6)} - ${bestScores.acc.toFixed(4)} | ew: ${bestWeights.ew[1].toFixed(5)} pw: ${bestWeights.pw[1].toFixed(5)} cw: ${bestWeights.cw[1].toFixed(5)}\n`
        );
    }

    console.log(JSON.stringify(bestWeights, null, 4));
}