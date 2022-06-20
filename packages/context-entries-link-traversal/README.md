# Comunica Context Entries for Link Traversal

[![npm version](https://badge.fury.io/js/%40comunica%2Fcontext-entries-link-traversal.svg)](https://www.npmjs.com/package/@comunica/context-entries-link-traversal)

A collection of reusable Comunica context key definitions for link traversal.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/context-entries-link-traversal
```

## Usage

```typescript
import { KeysRdfResolveHypermediaLinks } from '@comunica/context-entries-link-traversal';

// ...

const annotateSources = context.get(KeysRdfResolveHypermediaLinks.annotateSources);
```

All available keys are available in [`Keys`](https://github.com/comunica/comunica-feature-link-traversal/blob/master/packages/context-entries-link-traversal/lib/Keys.ts).
