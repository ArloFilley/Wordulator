# WORDULATOR
## An Automated Entropy Based Wordle Guessing Bot

**Do you average 6 guesses at Wordle like I do?**
**If so then this is the repository you've been looking for!**

This is a Node.js implementation of a Wordle guessing bot. Uses entropy and several
heuristics to average 3.83 guesses per answer with 99% accuracy! *Tested over 
100 different cases, accuracy is defined as getting the answer within the 6 allowed
guesses*

This project was built over the course of 4 days so don't expect it to be fast
or optimal. It was however an interesting dive into entropy, bitwise optimisation, 
and implementing the Wordle ruleset!

## Installation
- Clone repo
- Navigate to `./` in terminal
- Run `npm run install-wordulator` - and wait to finish
  - Installs base Wordle solutions and guesses
  - Precomputes feedback matrix - This step might take a while
  - Creates 5000 benchmark test cases from the solution list
- All Done

### Usage
- Run in **user** mode using `node .`
- Run a standard **benchmark** using `npm run benchmark`
- Run a custom **benchmark** using `node . combo bench (# of tests)`
- Enjoy

### Example Usage
![](./docs/Example%20Usage.png)

### Example Benchmark
![](./docs/Example%20Benchmark.png)

## Features
- Implements full Wordle ruleset - with automated feedback for efficient benchmarking
- Entropy guess scoring with several adjusting heuristics including
  - Positional letter frequencies
  - Non-overlapping letters
  - Guess being a possible remaining answer
- Capable of using most\* 5 letter word lists (\*with A-Z charset)
- Precomputation of feedback matrix
- Memory mapping of feedback matrix allowing parallel program execution
- Automated benchmarking for running up to thousands of tests
  
## Known Issues
- Feedback matrix consumes significant disk and memory space
- Limited to 5-letter Wordle variants
- Missing many possible runtime performance optimisations
- Assumes only ASCII characters a-z in wordlist

## Ideas for Future Improvement
- Weighting heuristics scores based on possible words left
- Precomputed second guesses
- Massive Performance optimisations
- User-friendly web interface
- Rewrite in rust?

# How it Works
## Feedback Modeling
This program models Wordle feedback per letter as green, yellow or grey and encodes 
that into an 8 bit integer, using ~2 bits per letter position. Because Wordle has 
5 positions which each have 3 possibilities this means there are 243 possible feedbacks. 
Each guess and answer pair is mapped into a deterministic feedback pattern represented 
by the feedback matrix. The feedback matrix is precomputed before running the problem 
as it significantly speeds up runtime performance at the cost of greater disk and 
memory usage. The matrix allows simulating potential outcomes from each guess-answer 
pair to model expected information gain

## Scoring
Each possible guess in the total word list is evaluate based on its entropy. This
entropy in turn is based on simulating how the remaining possible answers would
be partitioned be a given feedback. Guesses with higher entropy eliminate more potential
answers than guesses with lower entropy\* (\*In the vast majority of cases). Each
score is then adjusted based on the positional frequency of each letter in the guess
based on the positional frequencies of remaining possible answers. The score is
also adjusted based on whether letters in the guess have already been seen before
in a previous guess. And finally the score is higher for guesses that are also contained
in the possible answer set. These heuristics are great for picking more optimal
guesses that still have high entropy.

## Solving
To solve a given Wordle problem, the program:
  1. Makes a first predetermined guess (currently 'dares')
  2. Receives user or simulated feedback
  3. Create conditions the solution must fulfil
  4. Filters possible answers based on currently known solution conditions
  5. Makes another guess

This loop repeats steps 2-5 until:
- a) There is only one possible answer, the solution
- b) The program has used up its 6 guesses
- c) There is no possible answer that meets the solution conditions
