.PHONY: serve
serve: ## Start the ReDoc webserver
	docker run --rm -p 8080:80 -v $(PWD):/usr/share/nginx/html/src -e SPEC_URL=/src/api/spot.yaml redocly/redoc

.PHONY: bundle-redoc
bundle-redoc: ## Make a static HTML file with ReDoc
	docker run --rm -it -v $(PWD):/src -w /src node:14 npx redoc-cli bundle --template redoc/template.hbs.html --output build/index.html api/spot.yaml

.PHONY: bundle-swagger
bundle-swagger: ## Make a single JSON bundle of the OpenAPI spec
	docker run --rm -it -v $(PWD):/src -w /src node:14 npx swagger-cli bundle --outfile build/openapi.json api/spot.yaml

.PHONY: validate
validate: ## Validate the API definition against the OpenAPI schema
	docker run --rm -it -v $(PWD):/src -w /src node:14 npx swagger-cli validate --no-schema api/spot.yaml
