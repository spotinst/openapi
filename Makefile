.PHONY: serve
serve: ## Start the ReDoc webserver
	docker run --rm -p 8080:80 -v $(PWD):/usr/share/nginx/html/src -e SPEC_URL=/src/api/spotinst.yaml redocly/redoc

.PHONY: bundle
bundle: ## Make a static HTLM file with ReDoc
	docker run --rm -it -v $(PWD):/src -w /src node:14 npx redoc-cli bundle --output build/index.html api/spotinst.yaml

.PHONY: bundle-json
bundle-json: ## Make a sinlge JSON bundle of the OpenAPI spec
	docker run --rm -it -v $(PWD):/src -w /src node:14 npx swagger-cli bundle --outfile build/bundle.json api/spotinst.yaml

.PHONY: validate
validate: ## Validate the API definition against the OpenAPI schema
	docker run --rm -it -v $(PWD):/src -w /src node:14 npx swagger-cli validate --no-schema api/spotinst.yaml
