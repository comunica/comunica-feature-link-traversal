# Comunica RDF Resolve Hypermedia Links Queue Actor to Prioritize Specified Predicates

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-resolve-hypermedia-links-queue-wrapper-prioritize-predicates.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-prioritize-predicates)

Comunica link queue wrapper that prioritizes a specified set of predicates.

TThis module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-prioritize-predicates
```

## Configure

After installing, this package can be added to your engine's configuration as follows:

```json
{
  "@context": [
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-prioritize-predicates/^0.0.0/components/context.jsonld"
  ],
  "actors": [
    {
      "@id": "urn:comunica:default:rdf-resolve-hypermedia-links-queue/actors#wrapper-prioritize-predicates",
      "@type": "ActorRdfResolveHypermediaLinksQueueWrapperPrioritizePredicates"
    }
  ]
}
```

### Config Parameters

* `predicates`: The list of predicate URIs to prioritize.
