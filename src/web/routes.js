const path = require('path');

const express = require('express');
const app = express();

const app_events = require(path.join(__dirname, '../lib/events.js'))
const { solve } = require(path.join(__dirname, '../solvers/combined.js'))
const game_data = new Map();
const game_ids = new Set();

function webServer() {
    app.use(express.static('public'));

    app.post("/guess/:id", express.json(), (req, res) => {
        const game_id = req.params.id;
        console.log(`Game: ${game_id} | State - Guess Feedback Recieved: ${req.body.guess} ${req.body.green} ${req.body.yellow}`)
        app_events.emit(`web.guess`, game_id, req.body);
        res.sendStatus(200);
    });

    app.get('/current_guess/:id', express.json(), (req, res) => {
        const game_id = req.params.id;
        const game_id_data = game_data.get(game_id);

        if (game_data.get(game_id) === undefined) return res.status(404).send({ error: `Couldn't Find Guesses For ${game_id}` })
        const guesses = game_id_data.guesses;
        if (game_data.get(game_id).guesses === undefined) return res.status(404).send({ error: `Couldn't Find Guesses For ${game_id}` })
        const guess = guesses[guesses.length - 1];
        const answers_left = game_id_data.answers_left[guesses.length - 1];
        const guess_no = game_id_data.guess_no;

        if (guess === undefined) return res.status(404).send({ error: `No Guesses Yet For ${game_id}` });

        res.send({ guess, answers_left, guess_no });
    });

    app.post('/start_new_game', express.json(), async (req, res) => {
        const game_id = req.body.id;
        
        if (game_ids.has(game_id)) { 
            console.log(`Game: ${game_id} | ERROR - Already Started`); 
            res.sendStatus(403); 
            return 
        }

        console.log(`Game: ${game_id} | State - Started`);
        game_data.set(game_id, { guesses: [], answers_left: [], guess_no: 0 });
        game_ids.add(game_id);
        solve({ type: "web", rand: false, log: () => {}, game_id });
        app_events.emit(`web.start.game`, game_id);
        setTimeout(() => app_events.emit(`web.stop.game`, game_id), 300_000);

        res.sendStatus(200);
    });

    // Server setup
    app.listen(3000, () => {
        console.log("Server is Running");
    });
}

app_events.on(`solver.guess`, ({ id, guess, answers_left }) => { 
    console.log(`Game: ${id} | State - New Solver Guess: ${guess}`);
    game_data.get(id).guesses.push(guess);
    game_data.get(id).answers_left.push(answers_left);
    game_data.get(id).guess_no += 1;
})

app_events.on(`solver.waiting`, (id) => { 
    console.log(`Game: ${id} | State - Waiting for Feedback`);
})

module.exports = webServer;