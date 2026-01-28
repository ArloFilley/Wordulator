#!/bin/bash

mkdir data
mkdir data/filter
mkdir data/proc
mkdir data/raw
mkdir data/test
mkdir bench

echo "Copying Files Into Correct Places"
cp run/wordle.txt data/raw/wordle.txt
cp run/solutions.txt data/raw/solutions.txt

sleep 0.5

echo "Filtering List For Valid Words"
node src/pre/filter_words.js data/raw/wordle.txt data/filter/words.json 5
node src/pre/filter_words.js data/raw/solutions.txt data/filter/solutions.json 5

sleep 0.5

echo "Generating Feedback Matrix"
echo "This Step Might Take a While"
echo "The Feedback Matrix Can Be Found at data/proc/fbm.bin It Takes Up Roughly 200mb For 12k Words"
time node ./src/pre/feedback_matrix.js data/filter/words.json data/proc/feedback_matrix.bin

echo "Generating Benchmark Tests"
node src/pre/test.js data/filter/solutions.json data/test 5000