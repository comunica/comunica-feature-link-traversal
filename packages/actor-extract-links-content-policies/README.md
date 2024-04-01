# Comunica Content Policies Extract Links Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-extract-links-content-policies.svg)](https://www.npmjs.com/package/@comunica/actor-extract-links-content-policies)

A comunica Traverse Content Policies RDF Metadata Extract Actor.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-extract-links-content-policies
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
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-extract-links-content-policies/^1.0.0/components/context.jsonld"
  ],
  "actors": [
    ...
    {
      "@id": "config-sets:resolve-hypermedia.json#myExtractLinksContentPolicies",
      "@type": "ActorExtractLinksContentPolicies"
    }
  ]
}
```

### Config Parameters

* `actorInitQuery`: An instance of ActorInitQuery.
* `traverseConditional`: A flag indicating if links should only be follow IF it has been defined by some other link extractor. _(default: `true`)_
