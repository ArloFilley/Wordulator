const path = require("path");

const express = require("express");
const { randomInt } = require("crypto");
const app = express();

const { patternFromUserInput } = require("../lib/wordle.js");
const log = require("../lib/log.js");
const { create, advance, play } = require("../solvers/combined.js");

/** @typedef {String} GameID */
/** @type {Map<GameID, State>} */
const games = new Map();

const PORT = Math.max(3000, randomInt(65525));
const URL = "http://localhost";

function Serve() {
  app.listen(PORT, log.info(`Web Server Hosted -> ${URL}:${PORT}`));
  app.use(express.static("public"));

  app.post("/guess/:id", express.json(), (req, res) => {
    const { id } = req.params;
    const { guess, green, yellow } = req.body;
    if (!games.has(id))
      return res.status(404).send({ error: `Couldn't Find Game ${id}` });

    games.set(
      id,
      advance(games.get(id), guess, patternFromUserInput(green, yellow)),
    );

    res.sendStatus(200);
  });

  app.get("/guess/:id", express.json(), (req, res) => {
    const id = req.params.id;
    const game = games.get(id);

    if (games.get(id) === undefined)
      return res.status(404).send({ error: `Couldn't Find Guesses For ${id}` });

    if (game.guesses.length === undefined)
      return res.status(404).send({ error: `Couldn't Find Guesses For ${id}` });

    const turn = play(game);
    res.send({
      guess: turn.word,
      answers_left: turn.answersLeft,
      guess_no: game.turns[0],
    });
  });

  app.post("/game", express.json(), async (req, res) => {
    const { id } = req.body;
    if (games.has(id)) return res.status(403).send(`Game ${id} Already exists`);

    games.set(id, create());
    log.info(`Game ${id}: Created`);

    res.sendStatus(200);
  });
}

module.exports = Serve;
