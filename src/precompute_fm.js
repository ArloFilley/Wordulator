const fs = require('fs')
const words = require('../data/filtered_words.json')
const { entropyFeedback } = require('./lib.js')

const matrix = new Uint8Array(words.length**2)

for (const guess_idx in words) {
    const guess = words[guess_idx]

    for (const answer_idx in words) {
        const answer = words[answer_idx]
        const pattern = entropyFeedback(guess, answer)
        matrix[guess_idx * words.length + answer_idx] = encodePattern(pattern)
    }

    if (guess_idx % 100 === 0) {
        console.log(`Computed ${guess_idx}/${words.length}`)
    }
}

function encodePattern(pattern) {
    let value = 0
    for (let i = 0; i < 5; i++) {
        value = value * 3 + (pattern.charCodeAt(i) - 48)
    }
    return value
}

fs.writeFileSync('./data/feedback.bin', matrix)
console.log('Feedback matrix written')
