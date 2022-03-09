# Comunica Traverse Predicates RDF Metadata Extract Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-metadata-extract-traverse-predicates.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-metadata-extract-traverse-predicates)

An [RDF Metadata Extract](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-metadata-extract) actor that
collects all object links for subjects that match the current document
and predicates that match with any of the configured regular expressions, 
and stores it inside the metadata under the `traverse` key.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rdf-metadata-extract-traverse-predicates
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-metadata-extract-traverse-predicates/^1.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:rdf-metadata-extract/actors#traverse-predicates",
      "@type": "ActorRdfMetadataExtractTraversePredicates"
      "predicateRegexes": [
        "http://www.w3.org/ns/ldp#contains"
      ]
    }
  ]
}
```

### Config Parameters

* `predicateRegexes`: An array of regular expressions that will be matched with incoming predicates.
