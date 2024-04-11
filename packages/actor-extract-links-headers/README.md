# Comunica Headers Extract Links Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-extract-links-headers.svg)](https://www.npmjs.com/package/@comunica/actor-extract-links-headers)

An [RDF Metadata Extract](https://github.com/comunica/comunica/tree/master/packages/bus-extract-links) actor that
collects all links headers that match with any of the configured regular expressions.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-extract-links-headers
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-extract-links-headers/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:extract-links/actors#headers",
      "@type": "ActorExtractLinksHeaders"
      "headersRegexes": [
        "rel=\"describedby\""
      ]
    }
  ]
}
```

### Config Parameters

* `headersRegexes`: An array of regular expressions that will be matched with incoming link headers.
