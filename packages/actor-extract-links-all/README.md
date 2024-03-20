# Comunica All Extract Links Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-extract-links-all.svg)](https://www.npmjs.com/package/@comunica/actor-extract-links-all)

An [RDF Metadata Extract](https://github.com/comunica/comunica/tree/master/packages/bus-extract-links) actor that
collects all URIs in a page.

This corresponds to the `cAll` reachability criterion as defined in "Hartig, Olaf, and Johann-Christoph Freytag. "Foundations of traversal based query execution over linked data." Proceedings of the 23rd ACM conference on Hypertext and social media. 2012.".

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-extract-links-all
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
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-extract-links-all/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "config-sets:resolve-hypermedia.json#myExtractLinksAll",
      "@type": "ActorExtractLinksAll"
    }
  ]
}
```
