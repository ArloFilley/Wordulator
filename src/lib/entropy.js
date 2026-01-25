const buckets = new Uint16Array(243).fill(0);
/**
 * @param {number} guess_index
 * @param {Array<string>} word_list 
 * @param {UInt8Array} feedback_matrix 
 * @param {number[]} answer_indecies 
 * @param {Float64Array} ent_table 
 * @returns Number
 */
function calculateGuessEntropy(guess_index, word_list, feedback_matrix, answer_indecies, ent_table) {
    buckets.fill(0);
    const wl = word_list.length;
    const base = guess_index*wl;

    for (let ai=0; ai < wl; ai++) {
        const pattern = feedback_matrix[base + answer_indecies[ai]];
        buckets[pattern] += 1;
    }

    let entropy = 0;
    if (ent_table !== undefined) {
        for (let i = 0; i < 243; i++) {
            const count = buckets[i];
            entropy += ent_table[count];
        }
    } else {
        for (let i = 0; i < 243; i++) {
            const count = buckets[i];
            if (count === 0) continue;
            const p = count / wl;
            entropy -= p * Math.log2(p);
        }
    }

    return entropy;
}

/**
 * @param {number} pattern 
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
    let used = 0
    let result = 0

    // greens
    for (let i = 0; i < 5; i++) {
        if (guess[i] === answer[i]) {
            result += 2 * Math.pow(3, 4 - i)
            used |= 1 << i
        }
    }

    // yellows
    for (let i = 0; i < 5; i++) {
        if ((result / Math.pow(3, 4 - i) | 0) % 3 !== 0) continue

        for (let j = 0; j < 5; j++) {
            if (!(used & (1 << j)) && guess[i] === answer[j]) {
                result += 1 * Math.pow(3, 4 - i)
                used |= 1 << j
                break
            }
        }
    }

    return result
}

/**
 * 
 * @param {number} length 
 * @returns {Float64Array}
 */
function genEntropyTable(length) {
    const table = new Float64Array(length + 1);

    for (let c = 1; c <= length; c++) {
        const p = c / length;
        table[c] = -p * Math.log2(p);
    }

    return table;
}


const mmap = require('@luminati-io/mmap-io');
const fs = require('fs');

/**
 * Lazily maps the feedback matrix file and returns a Uint8Array view
 */
function loadFeedbackMatrix(path) {
    const fd = fs.openSync(path, 'r');
    const stats = fs.fstatSync(fd);

    const buffer = mmap.map(
        stats.size,
        mmap.PROT_READ,
        mmap.MAP_SHARED,
        fd,
        0
    );

    // Uint8Array view over the memory-mapped file
    const feedbackMatrix = new Uint8Array(buffer.buffer, buffer.byteOffset, stats.size / 2);
    return feedbackMatrix;
}

module.exports = { calculateGuessEntropy, encodePattern, entropyFeedback, genEntropyTable, loadFeedbackMatrix };