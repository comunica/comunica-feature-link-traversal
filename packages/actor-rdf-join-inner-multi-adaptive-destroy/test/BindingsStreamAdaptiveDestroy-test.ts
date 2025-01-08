import type { BindingsStream } from '@comunica/types';
import { BindingsFactory } from '@comunica/utils-bindings-factory';
import type * as RDF from '@rdfjs/types';
import { ArrayIterator, BufferedIterator } from 'asynciterator';
import { DataFactory } from 'rdf-data-factory';
import { BindingsStreamAdaptiveDestroy } from '../lib';
import '@comunica/utils-jest';

jest.useFakeTimers();

const DF = new DataFactory();
const BF = new BindingsFactory(DF);

describe('BindingsStreamAdaptiveDestroy', () => {
  it('produces the first iterator if the timeout is not reached', async() => {
    const delayedSource = jest.fn();
    const it = new BindingsStreamAdaptiveDestroy(
      <BindingsStream> <unknown> new ArrayIterator([
        BF.fromRecord({ a: DF.namedNode('ex:a1') }),
        BF.fromRecord({ a: DF.namedNode('ex:a2') }),
      ]),
      delayedSource,
      { timeout: 100 },
    );

    await expect(it).toEqualBindingsStream([
      BF.fromRecord({ a: DF.namedNode('ex:a1') }),
      BF.fromRecord({ a: DF.namedNode('ex:a2') }),
    ]);
    expect(delayedSource).not.toHaveBeenCalled();
  });

  it('consumes part of the second iterator if the timeout is reached', async() => {
    const delayedSource = jest.fn(async() => {
      return <BindingsStream> <unknown> new ArrayIterator([
        BF.fromRecord({ a: DF.namedNode('ex:a1') }),
        BF.fromRecord({ a: DF.namedNode('ex:a2') }),
      ], { autoStart: false });
    });
    const slowSource: BindingsStream = new BufferedIterator();
    (<any> slowSource)._push(BF.fromRecord({ a: DF.namedNode('ex:a1') }));

    const it = new BindingsStreamAdaptiveDestroy(
      slowSource,
      delayedSource,
      { timeout: 5_000 },
    );

    await new Promise<void>((resolve) => {
      const firstDataListener = (bindings: RDF.Bindings) => {
        it.removeListener('data', firstDataListener);
        expect(bindings).toEqualBindings(BF.fromRecord({ a: DF.namedNode('ex:a1') }));
        resolve();
      };
      it.on('data', firstDataListener);
    });
    expect(delayedSource).not.toHaveBeenCalled();

    jest.runAllTimers();

    await new Promise<void>((resolve) => {
      const firstDataListener = (bindings: RDF.Bindings) => {
        it.removeListener('data', firstDataListener);
        expect(bindings).toEqualBindings(BF.fromRecord({ a: DF.namedNode('ex:a2') }));
        resolve();
      };
      it.on('data', firstDataListener);
    });
    await new Promise<void>(resolve => it.on('end', resolve));

    expect(delayedSource).toHaveBeenCalledTimes(1);
    expect(slowSource.destroyed).toBeTruthy();
  });
});
