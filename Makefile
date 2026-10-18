.PHONY: install test run build deploy

install:
	npm ci --ignore-scripts --offline

test:
	npm test

run:
	npm start

build:
	docker build -t ai-task-automator:local .

deploy:
	@printf '%s\n' 'Build the image, push it to your registry, then run: docker run --rm ai-task-automator:local'
