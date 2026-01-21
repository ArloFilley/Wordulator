// Precomuputes Frequencies of Letters in Words
const fs = require('node:fs');

let words = require('../data/filtered_words.json');
let positional_frequencies = Array.from({length: 5}, () => ({}));

for (const word of words) {
    for (let i = 0; i < 5; i++) {
        const char = word[i];
        positional_frequencies[i][char] = (positional_frequencies[i][char] || 0) + 1;
    }
}

positional_frequencies = JSON.stringify(positional_frequencies);

fs.writeFileSync('./positional_frequencies.json', positional_frequencies)
console.log(positional_frequencies);