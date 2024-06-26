#!/bin/bash

TEST_FILES=$(circleci tests glob "**/*.integration.spec.ts")
echo "$TEST_FILES" | circleci tests run --command "xargs pnpm test:integration --ci --runInBand --reporters=jest-junit --runTestsByPath" --split-by=timings --timings-type=file