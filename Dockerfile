FROM alpine:latest

RUN apk add --no-cache bash nodejs npm racket python3 py3-pip py3-setuptools py3-matplotlib py3-numpy py3-pandas
RUN ln -s /usr/bin/python3 /usr/local/bin/python

# Install the Racket libraries the formalism needs.
RUN raco pkg install --installation --auto --batch --skip-installed errortrace-lib redex-lib redex-pict-lib rackcheck-lib

COPY redex-formalism /redex-formalism
RUN chmod +x /redex-formalism/*.sh


COPY benchmarks /benchmarks
RUN npm install --prefix /benchmarks/workspace/securemerge --omit=dev
RUN npm install --prefix /benchmarks/workspace/securemerge-benchmark --omit=dev

RUN python -m venv --system-site-packages /benchmarks/workspace/securemerge-benchmark/benchkit-evaluation/venv
RUN /benchmarks/workspace/securemerge-benchmark/benchkit-evaluation/venv/bin/python -m pip install --upgrade pip
RUN /benchmarks/workspace/securemerge-benchmark/benchkit-evaluation/venv/bin/python -m pip install -e /benchmarks/workspace/securemerge-benchmark/benchkit-evaluation