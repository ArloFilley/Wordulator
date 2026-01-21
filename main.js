const { solve } = require('./src/solvers/entropy_solver.js');

async function main() {
    console.clear();
    await solve({type: "user"});
    process.exit(1);
}

main();