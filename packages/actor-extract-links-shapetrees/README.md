# Comunica Shapetrees Extract Links Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-extract-links-shapetrees.svg)](https://www.npmjs.com/package/@comunica/actor-extract-links-shapetrees)

A comunica Traverse Shapetrees RDF Metadata Extract Actor.

**Warning: this package is experimental, and does not work properly yet.**

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-extract-links-shapetrees
```

## Metadata entries

This actor adds the following entries to the metadata object.

* `traverse`: Array of URLs to traverse.

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-extract-links-shapetrees/^0.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:extract-links/actors#traverse-shapetrees",
      "@type": "ActorExtractLinksShapetrees",
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
