# TaskPilot — Smart Workflow Automation

TaskPilot turns a plain-language outcome into a deterministic, ordered checklist.
It is a local-first web app for students, hackathon teams, freelancers, and small
teams who want a calm way to organize recurring work and verify completion.

The UI is dependency-free vanilla HTML/CSS/JavaScript with localStorage persistence.
The testable workflow core lives in `src/workflow.js` and is covered by Node's
built-in test runner.

## Requirements

- Node.js **22.14.0** (the version is pinned in `.nvmrc`)
- npm 10+ (bundled with Node 22)
- GNU Make for the convenience commands
- Docker 24+ for the container workflow

No third-party npm packages are required. `package-lock.json` is committed so
installs are reproducible and can run offline.

## Setup

```sh
nvm install                 # uses .nvmrc
nvm use
make install                # equivalent to npm ci --ignore-scripts --offline
```

If `nvm` is unavailable, install Node 22.14.0 manually and verify with
`node --version`.

## Run and test

The single project test command is:

```sh
make test
```

It runs Node's built-in test runner without network access and checks deterministic
workflow IDs and ordering, input validation limits, idempotent completion tracking,
and persistence round-tripping/validation. Run the same suite directly with
`npm test`.

Start the local web app with:

```sh
make run
# open http://localhost:4173
```

TaskPilot stays entirely in the browser. Workflows survive a refresh or restarting
the local server because they are stored in the browser's localStorage.

## Docker

Build and run the containerized app:

```sh
docker build -t ai-task-automator:local .
docker run --rm -p 4173:4173 ai-task-automator:local
```

The Dockerfile pins Node 22.14.0, installs from the lockfile with `npm ci`, and
starts the static server on port 4173. `make build` performs the same image build.

## Deploy

Build the image, tag it for your registry, authenticate using your deployment
platform's normal secret store, and push it:

```sh
docker build -t ai-task-automator:local .
docker tag ai-task-automator:local REGISTRY/ai-task-automator:VERSION
docker push REGISTRY/ai-task-automator:VERSION
```

Run the pushed image with `docker run --rm REGISTRY/ai-task-automator:VERSION`.
`make deploy` prints the local run reminder; registry names and credentials are
intentionally supplied by the deployment environment rather than stored here.
