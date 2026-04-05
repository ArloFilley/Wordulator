const fs = require("node:fs");

const express = require("express");
const { randomInt } = require("crypto");
const app = express();

const { patternFromUserInput } = require("../lib/wordle.js");
const log = require("../lib/log.js");
const { Game } = require("../solvers/combined.js");

/** @typedef {String} GameID */
/** @type {Map<GameID, Game>} */
const games = new Map();
for (const file of fs.readdirSync("data/srv")) {
  let gameJson = fs.readFileSync(`data/srv/${file}`, { encoding: "utf8" });
  let gameState = JSON.parse(gameJson);
  let game = new Game();
  game.setState(gameState);
  games.set(file.split(".")[0], game);
}

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

    let game = games.get(id);
    game.advance(guess, patternFromUserInput(green, yellow));

    fs.writeFile(`data/srv/${id}.json`, JSON.stringify(game.state), (err) => {
      if (err) log.error(err);
      else log.info(`Saved game to ${id}.json`);
    });

    res.sendStatus(200);
  });

  app.get("/guess/:id", express.json(), (req, res) => {
    const id = req.params.id;
    const game = games.get(id);

    if (games.get(id) === undefined)
      return res.status(404).send({ error: `Couldn't Find Guesses For ${id}` });

    res.send({
      guess: game.guess.word,
      answers_left: game.guess.answersLeft,
      guess_no: game.currentTurn,
    });
  });

  app.post("/game", express.json(), async (req, res) => {
    const { id } = req.body;
    if (games.has(id)) return res.status(403).send(`Game ${id} Already exists`);

    games.set(id, new Game());
    log.info(`Game ${id}: Created`);

    res.sendStatus(200);
  });
}

module.exports = Serve;
