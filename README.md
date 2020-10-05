# Spot OpenAPI Specification

## Local Development

- Start the ReDoc webserver (available at http://localhost:8080):

```sh
# using yarn
yarn serve

# using docker
make serve
```

- Validate the API definition against the OpenAPI schema:

```sh
# using yarn
yarn validate

# using docker
make validate
```

## Build Artifacts

- Make a static HTLM file with ReDoc:

```sh
# using yarn
yarn bundle

# using docker
make bundle
```

- Make a sinlge JSON bundle of the OpenAPI spec:

```sh
# using yarn
yarn bundle:json

# using docker
make bundle-json
```

## License

Code is licensed under the [Apache License 2.0](LICENSE).
