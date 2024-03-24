# Comunica Traverse RDF Metadata Extract Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-metadata-extract-traverse.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-metadata-extract-traverse)

An [RDF Metadata Extract](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-metadata-extract) actor that
adds the `traverse` entry to the metadata object by delegating the metadata stream to the [Extract Links bus](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/bus-extract-links).

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rdf-metadata-extract-traverse
```

## Metadata entries

This actor adds the following entries to the metadata object.

* `traverse`: Array of URLs to traverse. _(if `traverseConditional: false`)_
* `traverseConditional`: Array of URLs to conditionally traverse. _(if `traverseConditional: true`)_

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-metadata-extract-traverse/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:rdf-metadata-extract/actors#traverse",
      "@type": "ActorRdfMetadataExtractTraverse"
    }
  ]
}
```

### Config Parameters

* `mediatorExtractLinks`: Mediator over the [Extract Links bus](https://github.com/comunica/comunica-feature-link-traversal/tree/master/packages/bus-extract-links).
