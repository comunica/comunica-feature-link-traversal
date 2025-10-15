# Comunica Initialize Link Traversal Manager Optimize Query Operation Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-optimize-query-operation-initialize-link-traversal-manager.svg)](https://www.npmjs.com/package/@comunica/actor-optimize-query-operation-initialize-link-traversal-manager)

An [Optimize Query Operation](https://github.com/comunica/comunica/tree/master/packages/bus-optimize-query-operation) actor
that initializes a link traversal manager for all sources that should be traversed.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-optimize-query-operation-initialize-link-traversal-manager
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-optimize-query-operation-initialize-link-traversal-manager/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:optimize-query-operation/actors#initialize-link-traversal-manager",
      "@type": "ActorOptimizeQueryOperationInitializeLinkTraversalManager",
      "mediatorRdfResolveHypermediaLinks": { "@id": "urn:comunica:default:rdf-resolve-hypermedia-links/mediators#main" },
      "mediatorRdfResolveHypermediaLinksQueue": { "@id": "urn:comunica:default:rdf-resolve-hypermedia-links-queue/mediators#main" },
      "mediatorQuerySourceHypermediaResolve": { "@id": "urn:comunica:default:query-source-hypermedia-resolve/mediators#main" },
      "mediatorMergeBindingsContext": { "@id": "urn:comunica:default:merge-bindings-context/mediators#main" },
      "mediatorFactoryAggregatedStore": { "@id": "urn:comunica:default:factory-aggregated-store/mediators#main" }
    }
  ]
}
```

### Config Parameters

* `mediatorRdfResolveHypermediaLinks`: A mediator over the [RDF Resolve Hypermedia Links bus](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-resolve-hypermedia-links).
* `mediatorRdfResolveHypermediaLinksQueue`: A mediator over the [RDF Resolve Hypermedia Links Queue bus](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-resolve-hypermedia-links-queue).
* `mediatorQuerySourceHypermediaResolve`: A mediator over the [Query Source Hypermedia Resolve bus](https://github.com/comunica/comunica/tree/master/packages/bus-query-source-hypermedia-resolve).
* `mediatorMergeBindingsContext`: A mediator over the [Merge Bindings Context bus](https://github.com/comunica/comunica/tree/master/packages/bus-merge-bindings-context).
* `mediatorFactoryAggregatedStore`: A mediator over the [Aggregated Store Factory bus](https://github.com/comunica/comunica/tree/master/packages/bus-factory-aggregated-store).
