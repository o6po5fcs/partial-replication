# Artifact

This artifact contains:

- The complete Redex formalism presented by the paper. It can be found in [redex-formalism/](./redex-formalism). See [redex-formalism/README.md](./redex-formalism/README.md) for details on its contents.
- A Docker image to reproduce the evaluation of the paper. This Docker image is based on Alpine Linux + Racket + NodeJS. The rest of this document explains:
  - [Getting started](#getting-started)
  - [Running property-based tests](#run-property-based-tests-on-the-redex-formalism-paper-section-41) (Section 4.1 in the paper)
  - [Reproducing benchmarks (limited run for local execution)](#reproduce-benchmark-results-limited-benchmark-runs-for-local-execution) (Section 4.2 in the paper)
  - [Reproducing benchmarks (full run)](#reproduce-benchmark-results-full-benchmark-run) (Section 4.2 in the paper)

## Getting Started

### Prerequisites

Requires [Docker](https://docs.docker.com/get-docker/). We used Docker `29.9.3`, build `5457199` on a MacBook Pro 16" 2023 (`Apple M3 Max` CPU).

### Load or build the Docker image

Either option results in a local image named `redex-artifact`.

**Option A.** Load the prebuilt image:

```bash
docker load -i artifact-image.tar.gz
docker images artifact   # should list the image
```

**Option B.** Build the docker image from the directory where the `Dockerfile` and this README is located:

```bash
docker build -t artifact .
```

### Start a container

```bash
docker run -it --rm --workdir /redex-formalism artifact
```

1. `docker run -it --rm`: Starts an interactive container and deletes it automatically when you close it.
2. `--workdir /redex-formalism`: Starts the container inside a specific folder path that contains the Redex formalism.
3. `artifact`: The name of the Docker image being run.

### Check the image's integrity

Test that the image works by running the following command. `OK` output means success:

   ```bash
   racket -e '(require (file "formalism/JsonLang.rkt") (file "formalism/PolTreeLang.rkt") (file "testing/rackcheck.rkt")) (displayln "OK")'
   ```

## Run property-based tests on the Redex formalism (paper section 4.1)

Open a shell in the Docker container.

```bash
docker run -it --rm --workdir /redex-formalism artifact
```

1. `docker run -it --rm`: Starts an interactive container and deletes it automatically when you close it.
2. `--workdir /redex-formalism`: Starts the container inside a specific folder path that contains the Redex formalism.
3. `artifact`: The name of the Docker image being run.

To confirm that property-based tests succeed, they can be run by running the property-based tests for a sufficient number of checks. A suggested amount is to run `4` instances (i.e., occupying 4 CPU threads) with `3000` checks.

**Expected runtime:** approximately 10 minutes on a 2023 16" MacBook Pro (`Apple M3 Max` CPU).

Note that breaking out of the test with `Ctrl+C` or `Cmd+C` (macOS) may require multiple presses, as breaking out of the tests for one property will automatically start the tests for the next property.

```bash
./run_all_property_based_tests.sh 4 3000
```

After the experiment is finished, the output of all logs can be checked for success or completion as follows:

```bash
./check_all_test_logs.sh 
```

## Reproduce benchmark results (limited benchmark runs for local execution)

This section explains how to perform a limited run of the benchmarks of the paper for exection on a personal device. These are sufficient to show the general shape of the graphs from the paper, but with fewer measurements and repetitions (and therefore a higher degree of variability).
Benchmark logs and results will be stored in the `./benchmark-logs` subdirectory that will be created on first run, and rendered graphs will be stored in `./benchmark-logs/pdf_figures/`.

For each of the commands in the following subsections, open a terminal in the root directory of this artifact (where the `Dockerfile` and this `README.md` are located), and open a shell in the Docker container.

```bash
docker run -it --rm \
  --volume "$(pwd)/benchmark-logs:/benchmark-logs" \
  --workdir "/benchmarks/workspace/securemerge-benchmark/benchkit-evaluation" \
  artifact bash -c "source venv/bin/activate && exec bash"
```

1. `docker run -it --rm`: Starts an interactive container and deletes it automatically when you close it.
2. `--volume "$(pwd)/benchmark-logs:/benchmark-logs"`: Shares the `benchmark-logs` folder between your computer and the container, so saved logs and rendered graphs are more easily accessible.
3. `--workdir "..."`: Starts the container inside a specific folder path.
4. `artifact`: The name of the Docker image being run.
5. `bash -c "source venv/bin/activate && exec bash"`: Activates the Python virtual environment when entering the container's shell.

### Access check benchmarks (limited benchmark run of paper section 4.2.3)

Note that the term "_security policy_" is used as an equivalent to "_shard query_".

**Expected runtime:** approximately 11 minutes on a 2023 16" MacBook Pro (`Apple M3 Max` CPU).

```bash
python -m src.accesschecks.bench_access_checks \
  --iterations 3 \
  --nb_runs 1 \
  --results_dir /benchmark-logs \
  --tmp_dir /benchmark-logs \
  --security_policy_sizes_to_check 1 10 100 200 300 400 500 1000 5000 10000 \
  --number_of_checks 1000 \
  --graphs_nb_warmup_runs_to_ignore 0
```

### Shard query migrations benchmarks (limited benchmark run of paper section 4.2.4)

Note that the term "_security policy_" is used as an equivalent to "_shard query_".

#### Migration speed after growing the shard query

**Expected runtime:** approximately 1 hour 30 minutes on a 2023 MacBook Pro (Apple M3 Max).

```bash
python -m src.add.bench_migration_speed \
  --nb_runs 1 \
  --iterations 3 \
  --results_dir /benchmark-logs \
  --tmp_dir /benchmark-logs \
  --privileges_to_add 1 10 50 100 500 1000 5000 \
  --graphs_nb_warmup_runs_to_ignore 0
```

#### Migration speed after shrinking the shard query

**Expected runtime:** approximately 8 hours on a 2023 MacBook Pro (Apple M3 Max).

```bash
python -m src.remove.bench_migration_speed \
  --nb_runs 1 \
  --iterations 3 \
  --results_dir /benchmark-logs \
  --tmp_dir /benchmark-logs \
  --privileges_to_remove 1 10 50 100 500 1000 5000 \
  --graphs_nb_warmup_runs_to_ignore 0
```

### Communication overhead benchmarks (limited benchmark run of paper section 4.2.5)

Note that in the commands below, the term "_security policy_" is used as an equivalent to "_shard query_".

#### Migration sizes after growing the shard query

**Expected runtime:** approximately 42 minutes on a 2023 MacBook Pro (Apple M3 Max).

```bash
python -m src.add.bench_migration_size \
  --results_dir /benchmark-logs \
  --tmp_dir /benchmark-logs \
  --approaches srdt-plain-security-policy \
               poltree-security-policy \
               srdt-plain-security-policy-with-diff \
  --privileges_to_add 1 100 1000 10000
```

#### Migration sizes after shrinking the shard query

**Expected runtime:** approximately 1 hour 41 minutes on a 2023 MacBook Pro (Apple M3 Max).

```bash
python -m src.remove.bench_migration_size \
  --results_dir /benchmark-logs \
  --tmp_dir /benchmark-logs \
  --approaches srdt-plain-security-policy \
               poltree-security-policy \
               srdt-plain-security-policy-with-diff \
  --privileges_to_remove 1 100 1000 7000 8000 9000 10000
```

## Reproduce benchmark results (full benchmark run)

The graphs in the paper were obtained by running the equivalent of the commands given in this section, which will take a very long time to run (days or, more likely, weeks).
We ran this experiment on an HPC cluster by submitting 10 jobs to simultaneously execute 10 runs, and by splitting the parameter space into multiple concurrent jobs.
Note that the term "_security policy_" is used as an equivalent to "_shard query_".

For each of the following benchmarks, first open a shell in the Docker container.

```bash
docker run -it --rm --volume "$(pwd):/benchmarks/workspace/securemerge-benchmark/benchkit-evaluation" --workdir "/benchmarks/workspace/securemerge-benchmark/benchkit-evaluation" artifact bash -c "source venv/bin/activate && exec bash"
```

1. `docker run -it --rm`: Starts an interactive container and deletes it automatically when you close it.
2. `--volume "$(pwd)/benchmark-logs:/benchmark-logs"`: Shares the `$(pwd)/benchmark-logs` folder between your computer (a subfolder of the current working directory) and the container so saved logs and rendered graphs are more easily accessible.
3. `--workdir "..."`: Starts the container inside a specific folder path.
4. `artifact`: The name of the Docker image being run.
5. `bash -c "source venv/bin/activate && exec bash"`: Activates the Python virtual environment when entering the container's shell.

### Access check benchmarks (full benchmark run of paper section 4.2.3)

```bash
python -m src.accesschecks.bench_access_checks \
  --iterations 20 \
  --nb_runs 10 \
  --results_dir /benchmark-logs --tmp_dir /benchmark-logs \
  --security_policy_sizes_to_check 1 10 100 200 300 400 500 600 700 800 900 1000 2000 3000 4000 5000 6000 7000 8000 9000 10000 20000 40000 60000 80000 100000 150000 \
  --number_of_checks 10000 \
  --graphs_nb_warmup_runs_to_ignore 10
```

### Shard query migrations benchmarks (full benchmark run of paper section 4.2.4)

#### Migration speed for growing shard queries

```bash
python -m src.add.bench_migration_speed \
  --nb_runs 10 \
  --iterations 20 \
  --results_dir /benchmark-logs \
  --tmp_dir /benchmark-logs \
  --privileges_to_add 1 10 20 30 40 50 60 70 80 90 100 200 300 400 500 600 700 800 900 1000 2000 3000 4000 5000 6000 7000 8000 9000 10000 \
  --graphs_nb_warmup_runs_to_ignore 10
```

#### Migration speed for shrinking shard queries

```bash
python -m src.remove.bench_migration_speed \
  --nb_runs 10 \
  --iterations 20 \
  --results_dir /benchmark-logs \
  --tmp_dir /benchmark-logs \
  --privileges_to_remove 1 10 20 30 40 50 60 70 80 90 100 200 300 400 500 600 700 800 900 1000 2000 3000 4000 5000 6000 7000 8000 9000 10000 \
  --graphs_nb_warmup_runs_to_ignore 10
```

### Communication overhead benchmarks (full benchmark run of paper section 4.2.5)

#### Migration size for growing shard queries 

```bash
python -m src.add.bench_migration_size \
  --results_dir /benchmark-logs \
  --tmp_dir /benchmark-logs \
  --approaches srdt-plain-security-policy \
               poltree-security-policy \
               srdt-plain-security-policy-with-diff \
  --privileges_to_add 1 250 500 750 1000 1250 1500 1750 2000 3000 4000 5000 6000 7000 8000 9000 10000
```

#### Migration size for shrinking shard queries

```bash
python -m src.remove.bench_migration_size \
  --results_dir /benchmark-logs \
  --tmp_dir /benchmark-logs \
  --approaches srdt-plain-security-policy \
               poltree-security-policy \
               srdt-plain-security-policy-with-diff \
  --privileges_to_remove 1 250 500 750 1000 1250 1500 1750 2000 3000 4000 5000 6000 7000 8000 9000 10000
```
