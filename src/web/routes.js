const path = require('path');

const express = require('express');
const app = express();

const app_events = require(path.join(__dirname, '../lib/events.js'))
const { getCurrentBestGuess } = require(path.join(__dirname, '../solvers/combined.js'))

function webServer() {
    app.get("/", (req, res) => {
        res.send("Hello World!");
    });

    app.post("/guess", express.json(), (req, res) => {
        app_events.emit('web.guess', req.body);
        res.sendStatus(200);
    });

    app.use(express.static('public'));

    app.get('/current_guess', (_req, res) => {
        const guess = getCurrentBestGuess();

        if (guess === null) return res.status(404).send({ error: 'No guess yet' });

        res.send({ guess });
    });

    // Server setup
    app.listen(3000, () => {
        console.log("Server is Running");
    });
}

module.exports = webServer;