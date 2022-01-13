# Comunica Traverse Shapetrees RDF Metadata Extract Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-metadata-extract-traverse-shapetrees.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-metadata-extract-traverse-shapetrees)

A comunica Traverse Shapetrees RDF Metadata Extract Actor.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rdf-metadata-extract-traverse-shapetrees
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-metadata-extract-traverse-shapetrees/^1.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": "config-setsslts:extract-content-policies.json#myRdfMetadataExtractTraverseShapetrees",
      "@type": "ActorRdfMetadataExtractTraverseShapetrees"
    }
  ]
}
```

### Config Parameters

TODO
