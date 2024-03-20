# Comunica Shapetrees RDF Metadata Extract Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-metadata-extract-shapetrees.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-metadata-extract-shapetrees)

An [RDF Metadata Extract](https://github.com/comunica/comunica/tree/master/packages/bus-rdf-metadata-extract) actor that
adds the `shapetrees` entry to the metadata object,
which will contain those [Shape Trees](https://shapetrees.org/) objects that either match and do not match with the current query.
The applicable and non-applicable are stored in separate arrays.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rdf-metadata-extract-shapetrees
```

## Metadata entries

This actor adds the following entries to the metadata object.

* `shapetrees`: An object containing arrays of `applicable` and `nonApplicable` `ShapeTree` objects.

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-metadata-extract-shapetrees/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:rdf-metadata-extract/actors#shapetrees",
      "@type": "ActorRdfMetadataExtractShapetrees"
      "mediatorDereferenceRdf": { "@id": "urn:comunica:default:dereference-rdf/mediators#main" },
      "mediatorHttp": { "@id": "urn:comunica:default:http/mediators#main" }
    }
  ]
}
```

### Config Parameters

* `actorInitQuery`: An instance of [ActorInitQuery](https://github.com/comunica/comunica/tree/master/packages/actor-init-query), defaults to `urn:comunica:default:init/actors#query`.
* `mediatorDereferenceRdf`: A mediator over the [Dereference RDF bus](https://github.com/comunica/comunica/tree/master/packages/bus-dereference-rdf).
* `mediatorHttp`: A mediator over the [HTTP bus](https://github.com/comunica/comunica/tree/master/packages/bus-http).
