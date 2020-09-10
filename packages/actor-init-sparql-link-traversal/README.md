# Comunica SPARQL Link Traversal Init Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-init-sparql-link-traversal.svg)](https://www.npmjs.com/package/@comunica/actor-init-sparql-link-traversal)

Comunica SPARQL Link Traversal is a SPARQL query engine for JavaScript that follows links to detect new sources.

This module is part of the [Comunica framework](https://comunica.dev/).

## Install

```bash
$ yarn add @comunica/actor-init-sparql-link-traversal
```

or

```bash
$ npm install -g @comunica/actor-init-sparql-link-traversal
```

## Usage

Show 100 triples from http://fragments.dbpedia.org/2015-10/en:

```bash
$ comunica-sparql-link-traversal https://www.rubensworks.net/ \
  "SELECT DISTINCT * WHERE {
       <https://www.rubensworks.net/#me> <http://xmlns.com/foaf/0.1/knows> ?p.
       <https://ruben.verborgh.org/profile/#me> <http://xmlns.com/foaf/0.1/knows> ?p.
       ?p <http://xmlns.com/foaf/0.1/name> ?name.
   }"
```

Show the help with all options:

```bash
$ comunica-sparql-link-traversal --help
```

Just like [Comunica SPARQL](https://github.com/comunica/comunica/tree/master/packages/actor-init-sparql),
a [dynamic variant](https://github.com/comunica/comunica/tree/master/packages/actor-init-sparql#usage-from-the-command-line) (`comunica-dynamic-sparql-link-traversal`) also exists.

_[**Read more** about querying from the command line](https://comunica.dev/docs/query/getting_started/query_cli/)._

### Usage within application

This engine can be used in JavaScript/TypeScript applications as follows:

```javascript
const newEngine = require('@comunica/actor-init-sparql-link-traversal').newEngine;
const myEngine = newEngine();

const result = await myEngine.query(`
  SELECT DISTINCT * WHERE {
      <https://www.rubensworks.net/#me> <http://xmlns.com/foaf/0.1/knows> ?p.
      <https://ruben.verborgh.org/profile/#me> <http://xmlns.com/foaf/0.1/knows> ?p.
      ?p <http://xmlns.com/foaf/0.1/name> ?name.
  }`, {
  sources: ['https://www.rubensworks.net/'],
});

// Consume results as a stream (best performance)
result.bindingsStream.on('data', (binding) => {
    console.log(binding.get('?s').value);
    console.log(binding.get('?s').termType);

    console.log(binding.get('?p').value);

    console.log(binding.get('?o').value);
});

// Consume results as an array (easier)
const bindings = await result.bindings();
console.log(bindings[0].get('?s').value);
console.log(bindings[0].get('?s').termType);
```

_[**Read more** about querying an application](https://comunica.dev/docs/query/getting_started/query_app/)._

### Usage as a SPARQL endpoint

Start a webservice exposing http://fragments.dbpedia.org/2015-10/en via the SPARQL protocol, i.e., a _SPARQL endpoint_.

```bash
$ comunica-sparql-link-traversal-http https://www.rubensworks.net/
```

Show the help with all options:

```bash
$ comunica-sparql-link-traversal-http --help
```

The SPARQL endpoint can only be started dynamically.
An alternative config file can be passed via the `COMUNICA_CONFIG` environment variable.

Use `bin/http.js` when running in the Comunica monorepo development environment.

_[**Read more** about setting up a SPARQL endpoint](https://comunica.dev/docs/query/getting_started/setup_endpoint/)._
