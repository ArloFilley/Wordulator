const EventEmitter = require('events');

class AppEvents extends EventEmitter {}
const events = new AppEvents();

module.exports = events;