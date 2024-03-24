# Comunica Predicates Extract Links Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-extract-links-predicates.svg)](https://www.npmjs.com/package/@comunica/actor-extract-links-predicates)

An [RDF Metadata Extract](https://github.com/comunica/comunica/tree/master/packages/bus-extract-links) actor that
collects all object links for subjects that (optionally) match the current document
and predicates that match with any of the configured regular expressions.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-extract-links-predicates
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-extract-links-predicates/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:extract-links/actors#predicates",
      "@type": "ActorExtractLinksTraversePredicates"
      "checkSubject": true,
      "predicateRegexes": [
        "http://www.w3.org/ns/ldp#contains"
      ]
    }
  ]
}
```

### Config Parameters

* `checkSubject`: If only quads will be considered that have a subject equal to the request URL.
* `predicateRegexes`: An array of regular expressions that will be matched with incoming predicates.
