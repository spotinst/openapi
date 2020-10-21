# Spot OpenAPI Specification

Spot OpenAPI Specification is a static site built using [OpenAPI][openapi] definitions and powered by [ReDoc][redoc].

## Contents

- [Requirements](#requirements)
- [Local Development](#local-development)
- [Build Artifacts](#build-artifacts)
- [Getting Help](#getting-help)
- [Community](#community)
- [Contributing](#contributing)
- [License](#license)

## Requirements

- [Nvm][nvm]
- [Node.js][nodejs]
- [Yarn][yarn]

## Local Development

- Start the ReDoc webserver (available at http://localhost:8080):

```sh
# using yarn
$ yarn serve

# using docker
$ make serve
```

- Validate the API definition against the OpenAPI schema:

```sh
# using yarn
$ yarn validate

# using docker
$ make validate
```

## Build Artifacts

- Make a static HTML file with ReDoc:

```sh
# using yarn
$ yarn bundle:redoc

# using docker
$ make bundle-redoc
```

- Make a single JSON bundle of the OpenAPI spec:

```sh
# using yarn
$ yarn bundle:swagger

# using docker
$ make bundle-swagger
```

## Getting Help

We use GitHub issues for tracking bugs and feature requests. Please use these community resources for getting help:

- Ask a question on [Stack Overflow][stackoverflow] and tag it with [spot-openapi][stackoverflow-spot-help].
- Join our Spot community on [Slack][slack-spot].
- Open an [issue][github-new-issue].

## Community

- [Slack](http://slack.spot.io/)
- [Twitter](https://twitter.com/spot_hq/)

## Contributing

Please see the [contribution guidelines](.github/CONTRIBUTING.md).

## License

Code is licensed under the [Apache License 2.0](LICENSE).

[openapi]: https://swagger.io/resources/open-api
[redoc]: https://github.com/Redocly/redoc
[nvm]: https://github.com/nvm-sh/nvm
[nodejs]: https://nodejs.org
[yarn]: https://yarnpkg.com
[stackoverflow]: https://stackoverflow.com
[stackoverflow-spot-help]: https://stackoverflow.com/questions/tagged/spot-openapi
[slack-spot]: http://slack.spot.io
[github-new-issue]: https://github.com/spotinst/openapi/issues/new
