# Comunica Extract Links Tree Extract Links Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-extract-links-tree.svg)](https://www.npmjs.com/package/@comunica/actor-extract-links-tree)

A comunica [Extract Links Actor](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/bus-extract-links) for the [TREE](https://treecg.github.io/specification/).

There is also a [Guided Linked Traversal Query Processing](https://arxiv.org/abs/2005.02239)
option that can be enabled using the `reachabilityCriterionUseSPARQLFilte` flag based on the solvability of the query filter expression
and the [`tree:relation`](https://treecg.github.io/specification/#Relation) as explained in
the poster article
["How TREE hypermedia can speed up Link Traversal-based Query Processing for SPARQL queries with filters"](https://constraintautomaton.github.io/How-TREE-hypermedia-can-speed-up-Link-Traversal-based-Query-Processing-queries/) 

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-extract-links-tree
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-extract-links-tree/^0.0.1/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:extract-links/actors#extract-links-tree",
      "@type": "ActorExtractLinksTree",
      "reachabilityCriterionUseSPARQLFilter": true

    }
  ]
}
```
