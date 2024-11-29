# Comunica VoID Link Filter RDF Metadata Extract Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-metadata-extract-link-filter-void.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-metadata-extract-link-filter-void)

An [RDF Metadata Extract](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-metadata-extract) actor that
creates link filters based on [VoID descriptions](https://www.w3.org/TR/void/) to filter out redundant links.
The filters are added to the context filter list.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rdf-metadata-extract-link-filter-void
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```json
{
  "@context": [
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-metadata-extract-link-filter-void/^0.0.0/components/context.jsonld"
  ],
  "actors": [
    {
      "@id": "urn:comunica:default:rdf-metadata-extract/actors#link-filter-void",
      "@type": "ActorRdfMetadataExtractLinkFilterVoid"
    }
  ]
}
```
