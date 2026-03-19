<div align="center">
  <h3>🤖 Wordulator</h3>
  <p>An Automated Entropy Based Wordle Guessing Bot</p>

  <img src="docs/assets/March 14th 2026 NYT Wordle (Example) Result.png" alt="Project demo" width="700"/>
</div>

#### Table of Contents
- [About The Project](#about-the-project)
  - [Limitations](#limitations)
- [How it Works](#how-it-works)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [NPM Package Installation](#npm-package-installation)
  - [Manual Installation](#manual-installation)
- [Usage](#usage)
  - [Run in Web Mode](#run-in-web-mode)
    - [In Action](#in-action)
  - [Run in CLI Mode](#run-in-cli-mode)
    - [In Action](#in-action-1)
- [License](#license)
- [Author](#author)
- [Acknowledgments](#acknowledgments)

## About The Project

This is a Node.js implementation of a Wordle guessing bot. Uses entropy and several
heuristics to average 3.514 guesses per answer with 100% accuracy! *Tested over 
5000 test cases, accuracy is defined as getting the answer within the 6 allowed
guesses*

This project was built over the course of 4 days so don't expect it to be fast
or optimal. It was however an interesting dive into entropy, bitwise optimisation, 
and implementing the Wordle ruleset!

**Key Features:**
* Full Wordle ruleset implementation
* Efficient guess culling with heuristics
  * Positional letter frequency
  * Previous guess overlaps
* Capable of using most\* 5 letter word lists (\*with ascii a-z/A-Z charset)
* Precomputed feedback matrix with memory mapped reading
* Automated benchmarking capable of thousands of tests

### Limitations
* Feedback matrix consumes significant disk and memory space
* Limited to 5-letter Wordle variants
* Assumes only ASCII characters a-z in wordlist

## How it Works
Interested in the technical details behind this project? Check out [how-it-works.md](docs/how-it-works.md)

## Getting Started
### Prerequisites
* [Node.js + npm](https://nodejs.org) 
* Update npm
  ```sh
  npm install npm@latest -g
  ```

### NPM Package Installation
- Run `npm install -g wordulator`
  - Installs base Wordle solutions and guesses
  - Precomputes feedback matrix - This step might take a while
  - Creates 5000 benchmark test cases from the solution list

### Manual Installation
1. Clone [This Repo](https://github.com/ArloFilley/Wordulator)
    ```sh
    git clone https://github.com/ArloFilley/Wordulator
    ```
2. Navigate to repo folder
    ```sh
    cd Wordulator
    ```
3. Create Data Folder
    ```sh
    mkdir data
    ```
4. Install library packages
    ```sh
    npm i
    ```
5. Run `scripts/postinstall.js`
    ```sh
    node ./scripts/postinstall.js
    ```

## Usage
### Run in Web Mode
1. Lanuch the web server and solvers
    ```sh
    node . web
    ```
2. Visit [localhost:3000](http://localhost:3000) in the browser

#### In Action
<img src="docs/assets/March 14th 2026 NYT Wordle (Example) Result.png" alt="Example website useage" width="700" align="center"/>

### Run in CLI Mode
```sh
node .
```

#### In Action
<img src="docs/assets/Example Usage.png" alt="Example user usage" width="700" align="center"/>


## License

Distributed under the MIT License. See [`LICENSE.txt`](/License.txt) for more information.

## Author

**Arlo Filley** — [Contact](https://github.com/ArloFilley/ArloFilley#-contact-me)

## Acknowledgments

* [Choose an Open Source License](https://choosealicense.com)
* [Click Sound Effect](https://pixabay.com/sound-effects/film-special-effects-click-sound-432501/)
* [Win Sound Effect](https://pixabay.com/sound-effects/technology-correct-answer-toy-bi-bling-476370/) 
* [Balloon Pop Sound Effect](https://pixabay.com/sound-effects/film-special-effects-party-balloon-pop-323588/)