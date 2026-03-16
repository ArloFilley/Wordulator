// src/lib/log.js
const LEVEL = process.env.LOG_LEVEL || 'info';
const levels = { debug: 0, info: 1, warn: 2, error: 3 };

const log = {
    debug: (...args) => levels[LEVEL] <= 0 && console.debug('[DEBUG]', ...args),
    info:  (...args) => levels[LEVEL] <= 1 && console.log  ('[INFO] ', ...args),
    warn:  (...args) => levels[LEVEL] <= 2 && console.warn ('[WARN] ', ...args),
    error: (...args) => levels[LEVEL] <= 3 && console.error('[ERROR]', ...args),
};

module.exports = log;