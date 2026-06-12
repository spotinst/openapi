# Spot OpenAPI Specification

Spot OpenAPI Specification is a static site built using [OpenAPI][openapi] definitions and powered by [ReDoc][redoc].

## Table of Contents

- [Requirements](#requirements)
- [Local Development](#local-development)
- [Build Artifacts](#build-artifacts)
- [Getting Help](#getting-help)
- [Community](#community)
- [Contributing](#contributing)
- [License](#license)
- [Adding a New Documentation Section](#adding-a-new-documentation-section)

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

## Adding a New Documentation Section

The documentation is automatically split into sections based on `x-tagGroups` in `api/spot.yaml`.

### Step 1: Add Tags

First, ensure your API endpoints have tags defined in their path files under `api/services/`:

```yaml
# Example: api/services/myservice/paths/endpoint.yaml
get:
  tags:
    - My New Service
  summary: Get something
  # ...
```

### Step 2: Add Tag Definition

Add the tag definition in `api/spot.yaml` under `tags:`:

```yaml
tags:
  # ...existing tags...
  - name: My New Service
    description: Description of my new service
    externalDocs:
      description: My Service Documentation
      url: https://docs.flexera.com/spot/myservice/
```

### Step 3: Add Tag Group with Folders

Add a new group in `api/spot.yaml` under `x-tagGroups:` with `x-folders` to specify which service folders to include:

```yaml
x-tagGroups:
  # ...existing groups...
  - name: My New Section
    x-folders:
      - myservice/
    tags:
      - My New Service
      - Another Related Tag
```

The `x-folders` array specifies which folders under `api/services/` contain the paths for this section.

### Step 4: Build and Test

```sh
yarn serve
```

Your new section will appear in the left menu automatically.

### Structure Summary

| File | Purpose |
|------|---------|
| `api/spot.yaml` | Main spec with `tags`, `x-tagGroups`, and `x-folders` |
| `api/services/*/` | Service-specific paths, schemas, responses |
| `scripts/build-sections.js` | Generates split YAMLs per section (reads from `x-tagGroups`) |
| `scripts/build-landing.js` | Generates landing page with menu |
