.PHONY: redoc-docker
redoc-docker: ## Start redoc webserver with Docker
	docker run --rm -p 8080:80 -v $PWD:/usr/share/nginx/html/code -e SPEC_URL=/code/api/spotinst.yaml redocly/redoc