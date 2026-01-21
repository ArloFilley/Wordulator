function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function count(word, char) {
    let count = 0;
    for (let letter of word) {
        if (letter === char) { count++ }
    }

    return count
}

function calculatePosFreq(words) {
    let positional_frequencies = Array.from({length: 5}, () => ({}));

    for (const word of words) {
        for (let i = 0; i < 5; i++) {
            const char = word[i];
            positional_frequencies[i][char] = (positional_frequencies[i][char] || 0) + 1;
        }
    }

    return positional_frequencies;
}

module.exports = { getRandomInt, count, calculatePosFreq }