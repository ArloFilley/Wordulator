#!/bin/bash
echo "installing node modules"
npm i
wait
sleep 5

echo "Creating Directory Structure"
sleep 0.2
echo "Created ./data"
sleep 0.2
mkdir data
echo "Created ./data/filter"
mkdir data/filter
sleep 0.2
echo "Created ./data/proc"
mkdir data/proc
sleep 0.2
echo "Created ./data/raw"
mkdir data/raw
sleep 0.2
echo "Created ./data/test"
mkdir data/test
sleep 0.2
echo "Created ./bench"
mkdir bench

wait
sleep 5

echo "Copying Files Into Correct Places"
cp run/wordle.txt data/raw/wordle.txt
sleep 0.2
echo "Copied ./run/wordle.txt -> ./data/raw/wordle.txt"
cp run/solutions.txt data/raw/solutions.txt
sleep 0.2
echo "Copied ./run/solutions.txt -> ./data/raw/solutions.txt"

wait
sleep 1

echo "Filtering List For Valid Words"
node src/pre/filter_words.js data/raw/wordle.txt data/filter/words.json 5
node src/pre/filter_words.js data/raw/solutions.txt data/filter/solutions.json 5

wait
sleep 1

echo "Generating Feedback Matrix"
echo "This Step Might Take a While"
echo "The Feedback Matrix Can Be Found at data/proc/feedback_matrix.bin It Takes Up Roughly 200mb For 12k Words"
node ./src/pre/feedback_matrix.js data/filter/words.json data/proc/feedback_matrix.bin

wait
sleep 1

echo "Generating Benchmark Tests"
node src/pre/test.js data/filter/solutions.json data/test/tests.json 5000

wait
sleep 1
echo "Everything installed correctly :>"