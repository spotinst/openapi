.PHONY: redoc-docker
redoc-docker: ## Start redoc webserver with Docker
	docker run --rm -p 8080:80 -v $(PWD):/usr/share/nginx/html/code -e SPEC_URL=/code/api/spotinst.yaml redocly/redoc

.PHONY: redoc-static
redoc-static: ## Make a static html file with redoc
	docker run -v $PWD:/code -it --rm node sh -c "cd /code && npx redoc-cli bundle ./api/spotinst.yaml"

.PHONY: bundle-json 
bundle-json: ## Make a sinlge JSON bundle of the OpenAPI Spec
	docker run -v $PWD:/code -it --rm node npx swagger-cli bundle -o /code/spotinst-all.json /code/api/spotinst.yaml