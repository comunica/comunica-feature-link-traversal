# Comunica Traverse Prune Shapetrees RDF Resolve Hypermedia Links Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-resolve-hypermedia-links-traverse-prune-shapetrees.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-resolve-hypermedia-links-traverse-prune-shapetrees)

An [RDF Resolve Hypermedia Links](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-resolve-hypermedia-links)
actor that only works if there are `shapetrees` and `traverse` entries available in the metadata.
In that case, it will prune away all links in `traverse` that do not match with any of the Shape Trees
that are guaranteed to not match with the current query.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rdf-resolve-hypermedia-links-traverse-prune-shapetrees
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-resolve-hypermedia-links-traverse-prune-shapetrees/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:rdf-resolve-hypermedia-links/actors#traverse-prune-shapetrees",
      "@type": "ActorRdfResolveHypermediaLinksTraversePruneShapetrees"
      "mediatorRdfResolveHypermediaLinks": { "@id": "urn:comunica:default:rdf-resolve-hypermedia-links/mediators#main" }
    }
  ]
}
```

### Config Parameters

* `mediatorRdfResolveHypermediaLinks`: A mediator over the [RDF Resolve Hypermedia Links bus](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-resolve-hypermedia-links).
