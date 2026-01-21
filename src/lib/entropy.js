/**
 * @param {string} guess 
 * @param {Array<string>} words 
 * @param {UInt8Array} feedback_matrix 
 * @returns Number
 */
function calculateGuessEntropy(guess, words, feedback_matrix, word_index) {
    let buckets = new Map();

    for (let answer of words) {
        const pattern = feedback_matrix[word_index.get(guess) * words.length + word_index.get(answer)];
        buckets.set(pattern, (buckets.get(pattern) || 0) + 1);
    }

    let total = words.length;
    let entropy = 0;

    for (let count of buckets.values()) {
        let p = count / total;
        entropy -= p * Math.log2(p);
    }

    return entropy;
}

/**
 * @param {string} pattern 
 * @returns 
 */
function encodePattern(pattern) {
    let value = 0
    for (let i = 0; i < 5; i++) {
        value = value * 3 + (pattern.charCodeAt(i) - 48)
    }
    return value
}

/**
 * @param {string} guess 
 * @param {string} answer 
 * @returns 
 */
function entropyFeedback(guess, answer) {
    let result = Array(5).fill(0)
    let used = Array(5).fill(false)

    // greens first
    for (let i = 0; i < 5; i++) {
        if (guess[i] === answer[i]) {
        result[i] = 2
        used[i] = true
        }
    }

    // then yellows
    for (let i = 0; i < 5; i++) {
        if (result[i] !== 0) continue

        for (let j = 0; j < 5; j++) {
        if (!used[j] && guess[i] === answer[j]) {
            result[i] = 1
            used[j] = true
            break
        }
        }
    }

    return result.join("")
}



module.exports = { calculateGuessEntropy, encodePattern, entropyFeedback };