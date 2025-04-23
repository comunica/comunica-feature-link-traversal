# Comunica Hypermedia Links Queue Wrapper for Link Filtering

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-resolve-hypermedia-links-queue-wrapper-filter.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-filter)

An [RDF Resolve Hypermedia Links Queue](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-resolve-hypermedia-links-queue) actor
that wraps over another link queue provided by the bus,
and filters the links that can be taken out of the queue.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-filter
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```json
{
  "@context": [
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-filter/^0.0.0/components/context.jsonld"
  ],
  "actors": [
    {
      "@id": "urn:comunica:default:rdf-resolve-hypermedia-links-queue/actors#wrapper-filter",
      "@type": "ActorRdfResolveHypermediaLinksQueueWrapperFilter",
      "beforeActors": { "@id": "urn:comunica:default:rdf-resolve-hypermedia-links-queue/actors#fifo" },
      "mediatorRdfResolveHypermediaLinksQueue": { "@id": "urn:comunica:default:rdf-resolve-hypermedia-links-queue/mediators#main" }
    }
  ]
}
```
