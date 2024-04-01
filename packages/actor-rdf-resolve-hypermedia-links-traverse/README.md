# Comunica Traverse RDF Resolve Hypermedia Links Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-resolve-hypermedia-links-traverse.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-resolve-hypermedia-links-traverse)

An [RDF Resolve Hypermedia Links](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-resolve-hypermedia-links)
actor that emits all links inside the `traverse` field from extracted metadata as link to be followed.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rdf-resolve-hypermedia-links-traverse
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-resolve-hypermedia-links-traverse/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "config-sets:resolve-hypermedia.json#myHypermediaLinksTraverse",
      "@type": "ActorRdfResolveHypermediaLinksTraverse"
    }
  ]
}
```
