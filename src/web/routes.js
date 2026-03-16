const path = require('path');

const express = require('express');
const app = express();

const app_events = require(path.join(__dirname, '../lib/events.js'))
const { patternFromUserInput } = require(path.join(__dirname, '../lib/wordle.js'));
const log = require(path.join(__dirname, '../lib/log.js'));
const { create, advance } = require(path.join(__dirname, '../solvers/combined.js'))

/** @type {Map<String, State>} */
const games = new Map();
/** @type {Set<String>} */
const game_ids = new Set();

function webServer() {
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
        const id = req.body.id;
        
        if (game_ids.has(id)) { 
            log.error(`Game ${id} Already exists`); 
            return res.status(403).send({ error: `Game ${id} Already exists` }); 
        }
        
        games.set(id, create());
        game_ids.add(id);
        log.info(`Game ${id}: Created`);
        
        app_events.emit(`web.start.game`, id);
        setTimeout(() => app_events.emit(`web.stop.game`, id), 300_000);

        res.sendStatus(200);
    });

    // Server setup
    app.listen(3000, () => {
        log.info(`web server running at localhost:3000`);
    });
}

app_events.on(`solver.guess`, ({ id, guess, answers_left }) => { 
    log.info(`Game ${id}: Solver guess - ${guess}`);
    games.get(id).guesses.push(guess);
    games.get(id).answers_left.push(answers_left);
    games.get(id).guess_no += 1;
    log.debug(`Game ${id}: Waiting for feedback`);
})

module.exports = webServer;