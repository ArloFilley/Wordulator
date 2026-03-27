const path = require('path');

const express = require('express');
const { randomInt } = require('crypto');
const app = express();

const { patternFromUserInput } = require('../lib/wordle.js');
const log = require('../lib/log.js');
const { create, advance } = require('../solvers/combined.js');

/** @typedef {String} GameID */
/** @type {Map<GameID, State>} */
const games = new Map();

const PORT = Math.min(3000, randomInt(65525));
const URL = "http://localhost"

function Serve() {
    app.listen(PORT, log.info(`Web Server Hosted -> ${URL}:${PORT}`));
    app.use(express.static('public'));

    app.post("/guess/:id", express.json(), (req, res) => {
        const id = req.params.id;
        const state = games.get(id);
        if (!state) return res.sendStatus(404);

        const next_state = advance({ ...state, guess: req.body.guess, feedback: patternFromUserInput(req.body.green, req.body.yellow) })
        games.set(id, next_state);

        res.sendStatus(200);
    });

    app.get('/current_guess/:id', express.json(), (req, res) => {
        const id = req.params.id;
        const game = games.get(id);

        if (games.get(id) === undefined) 
            return res.status(404).send({ error: `Couldn't Find Guesses For ${id}` })
        
        if (game.guesses === undefined) 
            return res.status(404).send({ error: `Couldn't Find Guesses For ${id}` })

        if (game.computed_guess === undefined) return res.status(404).send({ error: `No Guesses Yet For ${id}` });

        res.send({ 
            guess: game.computed_guess, 
            answers_left: game.answers.length, 
            guess_no: game.turn
        });
    });

    app.post('/start_new_game', express.json(), async (req, res) => {
        if (games.has(req.body.id)) {
            let error = `Game ${id} Already exists`;
            log.error(error);
            return res.status(403).send({error});
        }
        
        games.set(id, create());
        log.info(`Game ${id}: Created`);

        res.sendStatus(200);
    });
}

module.exports = Serve;