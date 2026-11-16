## Overview

```
secure-replication/
├─ formalisation/
│  ├─ JsonLang.rkt                 - Redex specification of JSON and shard queries
│  ├─ PolTreeLang.rkt              - Redex specification of PolTrees
├─ rendering/
│  ├─ rendering.rkt                - Procedures to render graphics from the formalisms to be used in papers
├─ testing/
│  ├─ generators.rkt               - Data generators to be used by property-based testing
│  ├─ helpers.rkt                  - Some helper functions to be used by property-based testing
│  ├─ rackcheck.rkt                - The main file that specifies the property-based tests using rackcheck
├─ check_all_test_logs.sh          - Checks matching numbered logs for all listed property-based tests. Takes no arguments; tests without matching logs are skipped.
├─ check_test_logs.sh              - Checks matching numbered logs for one property-based test. Takes one argument: the test name. Tests without matching logs are skipped.
├─ run_all_property_based_tests.sh - Runs all property-based tests in succession. Has 2 arguments, (1) the number of parallel instances to run, and (2) how many times to check the property in each instance.
├─ run_property_based_test.sh      - Script to start many instances of one property-based test, to log their output ./logs/. There are 3 mandatory command-line arguments: (1) the number of parallel processes to start (e.g., 4 threads, each will use 100% CPU), (2) the property-based test to run (this is a racket function name from rackcheck.rkt, e.g., "check-projection-confidentiality"), and (3) how many times to check the property in each instance (e.g., 100).

```
