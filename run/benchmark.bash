#!/bin/bash

echo "Running benchmark, results saved to ./bench/benchmark.txt"
time node . combo bench 100 | tee "./bench/benchmark.txt"