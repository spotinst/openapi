# spotinst-openapi

## Local Development
Launch redoc with Docker and expose the web server at http://localhost:8080

> make redoc-docker

## Build Artifacts

Bundle all yaml files to a consolidated JSON document
> make bundle-json

Create a single html file documentation site
> make redoc-static