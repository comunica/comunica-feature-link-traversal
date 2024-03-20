# Comunica Traverse Annotate Source Graph RDF Resolve Hypermedia Links Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-resolve-hypermedia-links-traverse-annotate-source-graph.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-resolve-hypermedia-links-traverse-annotate-source-graph)

An [RDF Resolve Hypermedia Links](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-resolve-hypermedia-links)
actor that annotates all triples that were obtained from a certain document,
with the document URL from which the triple originated.
This annotation is done by making the triple part of the document URL's named graph.

When using this actor, it is recommended to run the query engine using union graph semantics (`--unionDefaultGraph`).

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rdf-resolve-hypermedia-links-traverse-annotate-source-graph
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-resolve-hypermedia-links-traverse-annotate-source-graph/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:rdf-resolve-hypermedia-links/actors#traverse-annotate-source-graph",
      "@type": "ActorRdfResolveHypermediaLinksTraverseAnnotateSourceGraph"
    }
  ]
}
```

### Config Parameters

TODO: fill in parameters (this section can be removed if there are none)

* `someParam`: Description of the param
