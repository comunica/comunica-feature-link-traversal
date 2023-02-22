# Comunica SPARQL Link Traversal

[![npm version](https://badge.fury.io/js/%40comunica%2Fquery-sparql-link-traversal.svg)](https://www.npmjs.com/package/@comunica/query-sparql-link-traversal)
[![Docker Pulls](https://img.shields.io/docker/pulls/comunica/query-sparql-link-traversal.svg)](https://hub.docker.com/r/comunica/query-sparql-link-traversal/)

Comunica SPARQL Link Traversal is a SPARQL query engine for JavaScript that follows links to detect new sources.

**Warning: due to the uncontrolled nature of the Web, it is recommended to always enable [lenient mode](https://comunica.dev/docs/query/advanced/context/#4--lenient-execution) when doing link traversal.**

This module is part of the [Comunica framework](https://comunica.dev/).

## Install

```bash
$ yarn add @comunica/query-sparql-link-traversal
```

or

```bash
$ npm install -g @comunica/query-sparql-link-traversal
```

## Usage

Find the common friends of 2 people:

```bash
$ comunica-sparql-link-traversal \
  "SELECT DISTINCT * WHERE {
    <https://www.rubensworks.net/#me> foaf:knows ?person.
    <https://ruben.verborgh.org/profile/#me> foaf:knows ?person.
    ?person foaf:name ?name.
  }" --lenient
```

If no sources are provided, the URLs inside the query will be considered starting sources.
Since passing sources is optional, the following is equivalent:

```bash
$ comunica-sparql-link-traversal https://www.rubensworks.net/ https://ruben.verborgh.org/profile/ \
  "SELECT DISTINCT * WHERE {
    <https://www.rubensworks.net/#me> foaf:knows ?person.
    <https://ruben.verborgh.org/profile/#me> foaf:knows ?person.
    ?person foaf:name ?name.
  }" --lenient
```

Show the help with all options:

```bash
$ comunica-sparql-link-traversal --help
```

Just like [Comunica SPARQL](https://github.com/comunica/comunica/tree/master/packages/query-sparql),
a [dynamic variant](https://github.com/comunica/comunica/tree/master/packages/query-sparql#usage-from-the-command-line) (`comunica-dynamic-sparql-link-traversal`) also exists.

_[**Read more** about querying from the command line](https://comunica.dev/docs/query/getting_started/query_cli/)._

### Usage within application

This engine can be used in JavaScript/TypeScript applications as follows:

```javascript
const QueryEngine = require('@comunica/query-sparql-link-traversal').QueryEngine;
const myEngine = new QueryEngine();

const bindingsStream = await myEngine.queryBindings(`
  SELECT DISTINCT * WHERE {
    <https://www.rubensworks.net/#me> foaf:knows ?person.
    <https://ruben.verborgh.org/profile/#me> foaf:knows ?person.
    ?person foaf:name ?name.
  }`, {
    // Sources field is optional. Will be derived from query if not provided.
    sources: ['https://www.rubensworks.net/'],
    lenient: true,
});

// Consume results as a stream (best performance)
bindingsStream.on('data', (binding) => {
    console.log(binding.toString()); // Quick way to print bindings for testing

    console.log(binding.has('s')); // Will be true

    // Obtaining values
    console.log(binding.get('s').value);
    console.log(binding.get('s').termType);
    console.log(binding.get('p').value);
    console.log(binding.get('o').value);
});
bindingsStream.on('end', () => {
    // The data-listener will not be called anymore once we get here.
});
bindingsStream.on('error', (error) => {
    console.error(error);
});

// Consume results as an array (easier)
const bindings = await bindingsStream.toArray();
console.log(bindings[0].get('s').value);
console.log(bindings[0].get('s').termType);
```

_[**Read more** about querying an application](https://comunica.dev/docs/query/getting_started/query_app/)._

### Usage as a SPARQL endpoint

Start a webservice exposing traversal via the SPARQL protocol, i.e., a _SPARQL endpoint_.

```bash
$ comunica-sparql-link-traversal-http --lenient
```

Start a webservice exposing traversal from https://www.rubensworks.net/ via the SPARQL protocol, i.e., a _SPARQL endpoint_.

```bash
$ comunica-sparql-link-traversal-http https://www.rubensworks.net/ --lenient
```

Show the help with all options:

```bash
$ comunica-sparql-link-traversal-http --help
```

The SPARQL endpoint can only be started dynamically.
An alternative config file can be passed via the `COMUNICA_CONFIG` environment variable.

Use `bin/http.js` when running in the Comunica monorepo development environment.

_[**Read more** about setting up a SPARQL endpoint](https://comunica.dev/docs/query/getting_started/setup_endpoint/)._
