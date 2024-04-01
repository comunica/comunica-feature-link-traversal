import type { Readable } from 'node:stream';
import type { ActorInitQuery } from '@comunica/actor-init-query';
import { BindingsFactory } from '@comunica/bindings-factory';
import type { MediatorDereferenceRdf } from '@comunica/bus-dereference-rdf';
import { KeysInitQuery, KeysQueryOperation } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { ArrayIterator } from 'asynciterator';
import { DataFactory } from 'rdf-data-factory';
import { Factory as AlgebraFactory } from 'sparqlalgebrajs';
import { ActorExtractLinksSolidTypeIndex } from '../lib/ActorExtractLinksSolidTypeIndex';

const quad = require('rdf-quad');
const stream = require('streamify-array');

const DF = new DataFactory();
const BF = new BindingsFactory();
const AF = new AlgebraFactory();

describe('ActorExtractLinksSolidTypeIndex', () => {
  let bus: any;
  let mediatorDereferenceRdf: MediatorDereferenceRdf;
  let actorInitQuery: ActorInitQuery;
  let input: Readable;
  let context: ActionContext;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    mediatorDereferenceRdf = <any> {
      mediate: jest.fn(async() => ({
        data: new ArrayIterator([], { autoStart: false }),
      })),
    };
    actorInitQuery = <any> {};
    input = stream([]);
    context = new ActionContext({
      [KeysInitQuery.query.name]: AF.createBgp([
        AF.createPattern(
          DF.variable('s'),
          DF.namedNode(ActorExtractLinksSolidTypeIndex.RDF_TYPE),
          DF.namedNode('ex:class1'),
        ),
        AF.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.namedNode('ex:bla')),
      ]),
      [KeysQueryOperation.operation.name]: AF.createPattern(
        DF.variable('s'),
        DF.namedNode('ex:p'),
        DF.namedNode('ex:bla'),
      ),
    });
  });

  describe('An ActorExtractLinksSolidTypeIndex instance with onlyMatchingTypes: false', () => {
    let actor: ActorExtractLinksSolidTypeIndex;

    beforeEach(() => {
      actor = new ActorExtractLinksSolidTypeIndex({
        name: 'actor',
        bus,
        typeIndexPredicates: [
          'ex:typeIndex1',
          'ex:typeIndex2',
        ],
        onlyMatchingTypes: false,
        mediatorDereferenceRdf,
        actorInitQuery,
        inference: false,
      });
      (<any> actor).queryEngine = {
        queryBindings: jest.fn(async() => ({
          toArray: async() => [
            BF.fromRecord({ instance: DF.namedNode('ex:file1'), class: DF.namedNode('ex:class1') }),
            BF.fromRecord({ instance: DF.namedNode('ex:file2'), class: DF.namedNode('ex:class2') }),
          ],
        })),
      };
    });

    describe('test', () => {
      it('should reject for an empty context', async() => {
        await expect(actor.test(<any> { context: new ActionContext() })).rejects
          .toThrow('Actor actor can only work in the context of a query.');
      });

      it('should reject for a context without query operation', async() => {
        await expect(actor.test(<any> {
          context: new ActionContext({
            [KeysInitQuery.query.name]: {},
          }),
        })).rejects.toThrow('Actor actor can only work in the context of a query operation.');
      });

      it('should reject for a context without query', async() => {
        await expect(actor.test(<any> {
          context: new ActionContext({
            [KeysQueryOperation.operation.name]: {},
          }),
        })).rejects.toThrow('Actor actor can only work in the context of a query.');
      });

      it('should be true for a valid context', async() => {
        await expect(actor.test(<any> { context })).resolves.toBeTruthy();
      });
    });

    it('should run on an empty stream', async() => {
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [],
        });
    });

    it('should run on a stream without type index predicates', async() => {
      input = stream([
        quad('ex:s1', 'ex:px', 'ex:o1', 'ex:gx'),
        quad('ex:s2', 'ex:p', '"o"', 'ex:g'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [],
        });
    });

    it('should run on a stream with type index predicates', async() => {
      input = stream([
        quad('ex:s1', 'ex:typeIndex1', 'ex:index1'),
        quad('ex:s2', 'ex:typeIndex2', 'ex:index2'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            {
              url: 'ex:file1',
            },
            {
              url: 'ex:file1',
            },
            {
              url: 'ex:file2',
            },
            {
              url: 'ex:file2',
            },
          ],
        });

      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledTimes(2);
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:index1', context });
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:index2', context });
    });
  });

  describe('An ActorExtractLinksSolidTypeIndex instance with onlyMatchingTypes and inference:true', () => {
    let actor: ActorExtractLinksSolidTypeIndex;

    beforeEach(() => {
      actor = new ActorExtractLinksSolidTypeIndex({
        name: 'actor',
        bus,
        typeIndexPredicates: [
          'ex:typeIndex1',
          'ex:typeIndex2',
        ],
        onlyMatchingTypes: true,
        inference: true,
        mediatorDereferenceRdf,
        actorInitQuery,
      });
      (<any> actor).queryEngine = {
        queryBindings: jest.fn(async() => ({
          toArray: async() => [
            BF.fromRecord({ instance: DF.namedNode('ex:file1'), class: DF.namedNode('ex:class1') }),
            BF.fromRecord({ instance: DF.namedNode('ex:file2'), class: DF.namedNode('ex:class2') }),
          ],
        })),
      };
    });

    it('should run on a stream without type index predicates', async() => {
      input = stream([
        quad('ex:s1', 'ex:px', 'ex:o1', 'ex:gx'),
        quad('ex:s2', 'ex:p', '"o"', 'ex:g'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [],
        });
    });

    it('should run on a stream with type index predicates', async() => {
      input = stream([
        quad('ex:s1', 'ex:typeIndex1', 'ex:index1'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      (<any> actor).queryEngine.queryBindings = (query: string) => {
        if (query.includes('solid:TypeRegistration')) {
          return {
            toArray: async() => [
              BF.fromRecord({ instance: DF.namedNode('ex:file1'), class: DF.namedNode('ex:class1') }),
              BF.fromRecord({ instance: DF.namedNode('ex:file2'), class: DF.namedNode('ex:class2') }),
            ],
          };
        }
        return {
          toArray: async() => [ ],
        };
      };
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            {
              url: 'ex:file1',
            },
          ],
        });

      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledTimes(1);
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:index1', context });
    });

    it('should run on a stream with type index predicates for a non-matching query', async() => {
      input = stream([
        quad('ex:s1', 'ex:typeIndex1', 'ex:index1'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      (<any> actor).queryEngine.queryBindings = (query: string) => {
        if (query.includes('solid:TypeRegistration')) {
          return {
            toArray: async() => [
              BF.fromRecord({ instance: DF.namedNode('ex:file1'), class: DF.namedNode('ex:class1') }),
              BF.fromRecord({ instance: DF.namedNode('ex:file2'), class: DF.namedNode('ex:class2') }),
            ],
          };
        }
        return {
          toArray: async() => [ ],
        };
      };

      context = new ActionContext({
        [KeysInitQuery.query.name]: AF.createBgp([
          AF.createPattern(
            DF.variable('s'),
            DF.namedNode(ActorExtractLinksSolidTypeIndex.RDF_TYPE),
            DF.namedNode('ex:class3'),
          ),
          AF.createPattern(DF.variable('s'), DF.namedNode('ex:p'), DF.namedNode('ex:bla')),
        ]),
        [KeysQueryOperation.operation.name]: AF.createPattern(
          DF.variable('s'),
          DF.namedNode('ex:p'),
          DF.namedNode('ex:bla'),
        ),
      });
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [],
        });

      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledTimes(1);
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:index1', context });
    });

    it('should run on a stream with type index predicates for a partially matching query', async() => {
      input = stream([
        quad('ex:s1', 'ex:typeIndex1', 'ex:index1'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      (<any> actor).queryEngine.queryBindings = (query: string) => {
        if (query.includes('solid:TypeRegistration')) {
          return {
            toArray: async() => [
              BF.fromRecord({ instance: DF.namedNode('ex:file1'), class: DF.namedNode('ex:class1') }),
              BF.fromRecord({ instance: DF.namedNode('ex:file2'), class: DF.namedNode('ex:class2') }),
            ],
          };
        }
        return {
          toArray: async() => [ ],
        };
      };
      context = new ActionContext({
        [KeysInitQuery.query.name]: AF.createBgp([
          AF.createPattern(
            DF.variable('s1'),
            DF.namedNode(ActorExtractLinksSolidTypeIndex.RDF_TYPE),
            DF.namedNode('ex:class1'),
          ),
          AF.createPattern(DF.variable('s1'), DF.namedNode('ex:p'), DF.namedNode('ex:bla')),

          AF.createPattern(DF.variable('s2'), DF.namedNode('ex:p'), DF.namedNode('ex:bla')),
        ]),
        [KeysQueryOperation.operation.name]: AF.createPattern(
          DF.variable('s1'),
          DF.namedNode('ex:p'),
          DF.namedNode('ex:bla'),
        ),
      });
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            {
              url: 'ex:file1',
            },
            {
              url: 'ex:file2',
            },
          ],
        });

      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledTimes(1);
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:index1', context });
    });

    it('should run on a stream with type index predicates for a link property path query', async() => {
      input = stream([
        quad('ex:s1', 'ex:typeIndex1', 'ex:index1'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      context = new ActionContext({
        [KeysInitQuery.query.name]: AF.createPath(
          DF.variable('s1'),
          AF.createLink(DF.namedNode(ActorExtractLinksSolidTypeIndex.RDF_TYPE)),
          DF.namedNode('ex:class1'),
        ),
        [KeysQueryOperation.operation.name]: AF.createPattern(
          DF.variable('s1'),
          DF.namedNode('ex:p'),
          DF.namedNode('ex:bla'),
        ),
      });
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            {
              url: 'ex:file1',
            },
          ],
        });

      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledTimes(1);
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:index1', context });
    });

    it('should run on a stream with type index predicates without class in query', async() => {
      input = stream([
        quad('ex:s1', 'ex:typeIndex1', 'ex:index1'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      (<any> actor).queryEngine.queryBindings = (query: string) => {
        if (query.includes('solid:TypeRegistration')) {
          return {
            toArray: async() => [
              BF.fromRecord({ instance: DF.namedNode('ex:file1'), class: DF.namedNode('ex:class1') }),
              BF.fromRecord({ instance: DF.namedNode('ex:file2'), class: DF.namedNode('ex:class2') }),
            ],
          };
        }
        return {
          toArray: async() => [
            BF.fromRecord({ domain: DF.namedNode('ex:class2') }),
          ],
        };
      };

      context = new ActionContext({
        [KeysInitQuery.query.name]: AF.createPattern(
          DF.variable('s'),
          DF.namedNode('ex:predicate7'),
          DF.namedNode('ex:blabla'),
        ),
        [KeysQueryOperation.operation.name]: AF.createPattern(
          DF.variable('s'),
          DF.namedNode('ex:predicate7'),
          DF.namedNode('ex:bla'),
        ),
      });
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            {
              url: 'ex:file2',
            },
          ],
        });
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledTimes(1);
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:index1', context });
    });

    it('should run on a stream with multiple type index predicates without class explicit in query', async() => {
      input = stream([
        quad('ex:s1', 'ex:typeIndex1', 'ex:index1'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      (<any> actor).queryEngine.queryBindings = (query: string) => {
        if (query.includes('solid:TypeRegistration')) {
          return {
            toArray: async() => [
              BF.fromRecord({ instance: DF.namedNode('ex:file1'), class: DF.namedNode('ex:class1') }),
              BF.fromRecord({ instance: DF.namedNode('ex:file2'), class: DF.namedNode('ex:class2') }),
            ],
          };
        }
        if (query.includes('ex:predicate8')) {
          return {
            toArray: async() => [
              BF.fromRecord({ domain: DF.namedNode('ex:class2') }),
            ],
          };
        }

        return {
          toArray: async() => [],
        };
      };
      context = new ActionContext({
        [KeysInitQuery.query.name]: AF.createBgp([
          AF.createPattern(DF.variable('s1'), DF.namedNode('ex:predicate8'), DF.namedNode('ex:bla')),
          AF.createPattern(DF.variable('s2'), DF.namedNode('ex:predicate9'), DF.namedNode('ex:bla')),
        ]),
        [KeysQueryOperation.operation.name]: AF.createPattern(
          DF.variable('s1'),
          DF.namedNode('ex:predicate1'),
          DF.namedNode('ex:bla'),
        ),
      });
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            {
              url: 'ex:file1',
            },
            {
              url: 'ex:file2',
            },
          ],
        });
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledTimes(1);
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:index1', context });
    });

    it('should run on a stream with type index predicate with multiple domains', async() => {
      input = stream([
        quad('ex:s1', 'ex:typeIndex1', 'ex:index1'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      (<any> actor).queryEngine.queryBindings = (query: string) => {
        if (query.includes('solid:TypeRegistration')) {
          return {
            toArray: async() => [
              BF.fromRecord({ instance: DF.namedNode('ex:file1'), class: DF.namedNode('ex:class1') }),
              BF.fromRecord({ instance: DF.namedNode('ex:file2'), class: DF.namedNode('ex:class2') }),
            ],
          };
        }
        if (query.includes('ex:predicate10')) {
          return {
            toArray: async() => [
              BF.fromRecord({ domain: DF.namedNode('ex:class2') }),
              BF.fromRecord({ domain: DF.namedNode('ex:class1') }),
            ],
          };
        }
      };
      context = new ActionContext({
        [KeysInitQuery.query.name]: AF.createBgp([
          AF.createPattern(DF.variable('s1'), DF.namedNode('ex:predicate10'), DF.namedNode('ex:bla')),
        ]),
        [KeysQueryOperation.operation.name]: AF.createPattern(
          DF.variable('s1'),
          DF.namedNode('ex:predicate10'),
          DF.namedNode('ex:bla'),
        ),
      });
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            {
              url: 'ex:file2',
            },
            {
              url: 'ex:file1',
            },
          ],
        });
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledTimes(1);
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:index1', context });
    });

    it('should run on a stream with type index predicates for an nps property path query', async() => {
      input = stream([
        quad('ex:s1', 'ex:typeIndex1', 'ex:index1'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      (<any> actor).queryEngine.queryBindings = (query: string) => {
        if (query.includes('solid:TypeRegistration')) {
          return {
            toArray: async() => [
              BF.fromRecord({ instance: DF.namedNode('ex:file1'), class: DF.namedNode('ex:class1') }),
              BF.fromRecord({ instance: DF.namedNode('ex:file2'), class: DF.namedNode('ex:class2') }),
            ],
          };
        }
        return {
          toArray: async() => [

          ],
        };
      };
      context = new ActionContext({
        [KeysInitQuery.query.name]: AF.createPath(
          DF.variable('s1'),
          AF.createNps([
            DF.namedNode('ex:p1'),
            DF.namedNode(ActorExtractLinksSolidTypeIndex.RDF_TYPE),
            DF.namedNode('ex:p'),
          ]),
          DF.namedNode('ex:class1'),
        ),
        [KeysQueryOperation.operation.name]: AF.createPattern(
          DF.variable('s1'),
          DF.namedNode('ex:p'),
          DF.namedNode('ex:bla'),
        ),
      });
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            {
              url: 'ex:file1',
            },
          ],
        });

      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledTimes(1);
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:index1', context });
    });
  });

  describe('An ActorExtractLinksSolidTypeIndex instance with inference: false', () => {
    let actor: ActorExtractLinksSolidTypeIndex;

    beforeEach(() => {
      actor = new ActorExtractLinksSolidTypeIndex({
        name: 'actor',
        bus,
        typeIndexPredicates: [
          'ex:typeIndex1',
          'ex:typeIndex2',
        ],
        onlyMatchingTypes: true,
        inference: false,
        mediatorDereferenceRdf,
        actorInitQuery,
      });
      (<any> actor).queryEngine = {
        queryBindings: jest.fn(async() => ({
          toArray: async() => [
            BF.fromRecord({ instance: DF.namedNode('ex:file1'), class: DF.namedNode('ex:class1') }),
            BF.fromRecord({ instance: DF.namedNode('ex:file2'), class: DF.namedNode('ex:class2') }),
          ],
        })),
      };
    });

    it('should run on a stream with type index predicates without class in query', async() => {
      input = stream([
        quad('ex:s1', 'ex:typeIndex1', 'ex:index1'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      context = new ActionContext({
        [KeysInitQuery.query.name]: AF.createPattern(
          DF.variable('s'),
          DF.namedNode('ex:predicate1'),
          DF.namedNode('ex:blabla'),
        ),
        [KeysQueryOperation.operation.name]: AF.createPattern(
          DF.variable('s'),
          DF.namedNode('ex:predicate1'),
          DF.namedNode('ex:bla'),
        ),
      });
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            {
              url: 'ex:file1',
            },
            {
              url: 'ex:file2',
            },
          ],
        });
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledTimes(1);
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:index1', context });
    });

    it('should run on a stream with multiple type index predicates without class in query', async() => {
      input = stream([
        quad('ex:s1', 'ex:typeIndex1', 'ex:index1'),
        quad('ex:s3', 'ex:px', 'ex:o3', 'ex:gx'),
        quad('ex:s4', 'ex:p', 'ex:o4', 'ex:g'),
        quad('ex:s5', 'ex:p', 'ex:o5', 'ex:gx'),
      ]);
      context = new ActionContext({
        [KeysInitQuery.query.name]: AF.createBgp([
          AF.createPattern(DF.variable('s1'), DF.namedNode('ex:predicate1'), DF.namedNode('ex:bla')),
          AF.createPattern(DF.variable('s2'), DF.namedNode('ex:predicate2'), DF.namedNode('ex:bla')),
        ]),
        [KeysQueryOperation.operation.name]: AF.createPattern(
          DF.variable('s1'),
          DF.namedNode('ex:predicate1'),
          DF.namedNode('ex:bla'),
        ),
      });
      await expect(actor.run({ url: '', metadata: input, requestTime: 0, context })).resolves
        .toEqual({
          links: [
            {
              url: 'ex:file1',
            },
            {
              url: 'ex:file2',
            },
          ],
        });
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledTimes(1);
      expect(mediatorDereferenceRdf.mediate).toHaveBeenCalledWith({ url: 'ex:index1', context });
    });
  });
});
