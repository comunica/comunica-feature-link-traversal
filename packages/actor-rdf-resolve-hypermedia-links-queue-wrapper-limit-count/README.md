# Comunica Wrapper Limit Count RDF Resolve Hypermedia Links Queue Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-resolve-hypermedia-links-queue-wrapper-limit-count.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-count)

An [RDF Resolve Hypermedia Links Queue](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-resolve-hypermedia-links-queue) actor
that wraps over another link queue provided by the bus,
and imposes a limit on the maximum number of links that can be pushed into it.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-count
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-resolve-hypermedia-links-queue-wrapper-limit-count/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "config-setsslt:link-queue-limit.json#myActorRdfResolveHypermediaLinksQueueWrapperLimitCount",
      "@type": "ActorRdfResolveHypermediaLinksQueueWrapperLimitCount"
    }
  ]
}
```

### Config Parameters

* `carrhlqwlc:Actor/RdfResolveHypermediaLinksQueue/WrapperLimitCount#limit`: The maximum number of links can can be followed per source.
* `carrhlqwlc:Actor/RdfResolveHypermediaLinksQueue/WrapperLimitCount#mediatorRdfResolveHypermediaLinksQueue`: A mediator over the [RDF Resolve Hypermedia Links Queue bus](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-resolve-hypermedia-links-queue).
