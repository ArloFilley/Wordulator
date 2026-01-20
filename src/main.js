let words = require('../data/filtered_words.json');
const { getRandomInt } = require('./lib.js')
const readline = require('node:readline/promises');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
    let dnc = "";   
    let got_word = 'f'; 
    let pnppl = [];
    let guesses = 1;
    
    while (got_word.toLowerCase() === 'f') {    
        const ppl = await rl.question("Perfect positions, use '.' for blanks: ");
        const nppl = await rl.question("Wrong position letters, use '.' for blanks: ");
        dnc += await rl.question('Not in word: ');
        
        let filtered_words = []

        for (let word of words) {
            let cbw = true;
            for (let idx in ppl) {
                if (ppl[idx] !== '.') {
                    cbw = cbw && (word[idx] === ppl[idx])
                }
            }

            for (let lttr of nppl) {
                if (lttr !== '.') {
                    cbw = cbw && word.includes(lttr)
                }
            }

            for (let idx in nppl) {
                if (nppl[idx] !== '.') {
                    cbw = cbw && (word[idx] !== nppl[idx])
                }
            }

            for (let n of pnppl) {
                for (let idx in n) {
                    if (n[idx] !== '.') {
                        cbw = cbw && (word[idx] !== n[idx])
                    }
                }
            }

            for (let lttr of dnc) {
                cbw = cbw && !word.includes(lttr)
            }

            if (cbw) {
                filtered_words.push(word)
            }
        }

        console.log(
            `Possible Words Left: ${filtered_words.length}\n`, 
            `Random Guess: ${filtered_words[getRandomInt(filtered_words.length)]}\n`,
            `List: ${filtered_words}`
        )

        pnppl.push(nppl)
        got_word = await rl.question('Got Word T/F: ');
        guesses += 1
    }
    
    console.log(`${guesses} Guesses - Yippeee!`);
    rl.close();
}

main();