.PHONY: install install-root install-frontend \
        build build-tsp build-frontend \
        dev lint lint-tsp lint-frontend \
        watch preview clean

install: install-root install-frontend

install-root:
	npm install

install-frontend:
	npm install --prefix frontend

build: build-tsp build-frontend

build-tsp:
	npm run build

build-frontend:
	npm run build --prefix frontend

watch:
	npm run watch

dev:
	npm run dev --prefix frontend

preview:
	npm run preview --prefix frontend

lint: lint-tsp lint-frontend

lint-tsp:
	npm run lint

lint-frontend:
	npm run lint --prefix frontend

clean:
	rm -rf tsp-output frontend/dist
