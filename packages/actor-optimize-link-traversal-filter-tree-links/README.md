# Comunica Filter Tree Links Optimize Link Traversal Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-optimize-link-traversal-filter-tree-links.svg)](https://www.npmjs.com/package/@comunica/actor-optimize-link-traversal-filter-tree-links)

A comunica Link traversal optimizer that filter link of document following the [TREE specification](https://treecg.github.io/specification/)

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-optimize-link-traversal-filter-tree-links
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-optimize-link-traversal-filter-tree-links/^1.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:optimize-link-traversal/actors#filter-tree-links",
      "@type": "ActorOptimizeLinkTraversalFilterTreeLinks"
    }
  ]
}
```

### Config Parameters

TODO: fill in parameters (this section can be removed if there are none)

* `someParam`: Description of the param
