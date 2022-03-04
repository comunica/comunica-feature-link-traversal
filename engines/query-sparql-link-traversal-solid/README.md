# Comunica SPARQL Link Traversal Solid Init Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Fquery-sparql-link-traversal-solid.svg)](https://www.npmjs.com/package/@comunica/query-sparql-link-traversal-solid)
[![Docker Pulls](https://img.shields.io/docker/pulls/comunica/query-sparql-link-traversal-solid.svg)](https://hub.docker.com/r/comunica/query-sparql-link-traversal-solid/)

Comunica SPARQL Link Traversal Solid is a SPARQL query engine for JavaScript that follows links across documents within [Solid](https://solidproject.org/) data pods.

**Warning: due to the uncontrolled nature of the Web, it is recommended to always enable [lenient mode](https://comunica.dev/docs/query/advanced/context/#4--lenient-execution) when doing link traversal.**

This module is part of the [Comunica framework](https://comunica.dev/).

## Install

```bash
$ yarn add @comunica/query-sparql-link-traversal-solid
```

or

```bash
$ npm install -g @comunica/query-sparql-link-traversal-solid
```

## Usage

Show 100 triples from a private resource
by authenticating through the https://solidcommunity.net/ identity provider (when using https://pod.inrupt.com/, your IDP will be https://broker.pod.inrupt.com/):

```bash
$ comunica-sparql-link-traversal-solid  --idp https://solidcommunity.net/ \
  https://www.rubensworks.net/ \
  "SELECT DISTINCT * WHERE {
       <https://www.rubensworks.net/#me> <http://xmlns.com/foaf/0.1/knows> ?p.
       <https://ruben.verborgh.org/profile/#me> <http://xmlns.com/foaf/0.1/knows> ?p.
       ?p <http://xmlns.com/foaf/0.1/name> ?name.
   }" --lenient
```

This command will connect with the given identity provider,
and open your browser to log in with your WebID.
After logging in, the query engine will be able to access all the documents you have access to.

Show the help with all options:

```bash
$ comunica-sparql-link-traversal-solid --help
```

Just like [Comunica SPARQL](https://github.com/comunica/comunica/tree/master/packages/query-sparql),
a [dynamic variant](https://github.com/comunica/comunica/tree/master/packages/query-sparql#usage-from-the-command-line) (`comunica-dynamic-sparql-link-traversal`) also exists.

_[**Read more** about querying from the command line](https://comunica.dev/docs/query/getting_started/query_cli/)._

### Usage within application

This engine can be used in JavaScript/TypeScript applications as follows:

```javascript
const QueryEngine = require('@comunica/query-sparql-link-traversal-solid').QueryEngine;
const {interactiveLogin} = require('solid-node-interactive-auth');

// This will open your Web browser to log in
const session = await interactiveLogin({oidcIssuer: 'https://solidcommunity.net/'});
const myEngine = new QueryEngine();

const bindingsStream = await myEngine.queryBindings(`
  SELECT DISTINCT * WHERE {
      <https://www.rubensworks.net/#me> <http://xmlns.com/foaf/0.1/knows> ?p.
      <https://ruben.verborgh.org/profile/#me> <http://xmlns.com/foaf/0.1/knows> ?p.
      ?p <http://xmlns.com/foaf/0.1/name> ?name.
  }`, {
    sources: [session.info.webId], // Sets your profile as query source
    '@comunica/actor-http-inrupt-solid-client-authn:session': session,
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

Start a webservice exposing https://www.rubensworks.net/ via the SPARQL protocol, i.e., a _SPARQL endpoint_,
by authenticating through the https://solidcommunity.net/ identity provider.

```bash
$ comunica-sparql-link-traversal-solid-http --idp https://solidcommunity.net/ \
  https://www.rubensworks.net/ --lenient
```

Show the help with all options:

```bash
$ comunica-sparql-link-traversal-solid-http --help
```

The SPARQL endpoint can only be started dynamically.
An alternative config file can be passed via the `COMUNICA_CONFIG` environment variable.

Use `bin/http.js` when running in the Comunica monorepo development environment.

_[**Read more** about setting up a SPARQL endpoint](https://comunica.dev/docs/query/getting_started/setup_endpoint/)._
