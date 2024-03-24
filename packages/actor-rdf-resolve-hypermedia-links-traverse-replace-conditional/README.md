# Comunica Traverse Filter Conditional RDF Resolve Hypermedia Links Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-resolve-hypermedia-links-traverse-replace-conditional.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-resolve-hypermedia-links-traverse-replace-conditional)

An [RDF Resolve Hypermedia Links](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-resolve-hypermedia-links)
actor that iterates over all links in `traverse`,
and for each link that is also defined in `traverseConditional`,
that link in `traverse` is replaced.

This allows other actors to define a conditional link in `traverseConditional` with a specific context,
which is only followed (and specific context applied) if another actor defines this link.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rdf-resolve-hypermedia-links-traverse-replace-conditional
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-resolve-hypermedia-links-traverse-replace-conditional/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "config-setsslt:traverse-content-policies-conditional.json#myActorRdfResolveHypermediaLinksTraverseReplaceConditional",
      "@type": "ActorRdfResolveHypermediaLinksTraverseReplaceConditional",
      "mediatorRdfResolveHypermediaLinks": { "@id": "config-sets:resolve-hypermedia.json#mediatorRdfResolveHypermediaLinks" }
    }
  ]
}
```

### Config Parameters

* `mediatorRdfResolveHypermediaLinks`: A mediator over the [RDF Resolve Hypermedia Links bus](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-resolve-hypermedia-links).
