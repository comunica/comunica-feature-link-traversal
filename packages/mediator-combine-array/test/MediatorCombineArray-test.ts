import type { IAction, IActorOutput, IActorTest } from '@comunica/core';
import { ActionContext, Actor, Bus, Mediator } from '@comunica/core';
import { MediatorCombineArray } from '..';

describe('MediatorCombineArray', () => {
  let bus: Bus<DummyActor, IAction, IDummyTest, IDummyTest>;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The MediatorCombineArray module', () => {
    it('should be a function', () => {
      expect(MediatorCombineArray).toBeInstanceOf(Function);
    });

    it('should be a MediatorCombineArray constructor', () => {
      expect(new (<any>MediatorCombineArray)({ name: 'mediator', bus, fields: [ 'field1', 'field2' ]}))
        .toBeInstanceOf(MediatorCombineArray);
      expect(new (<any>MediatorCombineArray)({ name: 'mediator', bus, fields: [ 'field1', 'field2' ]}))
        .toBeInstanceOf(Mediator);
    });
  });

  describe('An MediatorCombineArray instance', () => {
    let mediator: MediatorCombineArray<DummyActor, IAction, IDummyTest, IDummyTest>;

    beforeEach(() => {
      mediator = new MediatorCombineArray({ name: 'mediator', bus, fields: [ 'field1', 'field2' ]});
    });

    it('should throw an error when mediateWith is called', () => {
      return expect(() => (<any>mediator).mediateWith({}, [])).toThrow();
    });

    describe('without actors', () => {
      it('should mediate', () => {
        return expect(mediator.mediate({ context: new ActionContext() }))
          .resolves.toEqual({ field1: [], field2: []});
      });
    });

    describe('for defined actors', () => {
      beforeEach(() => {
        new DummyActor(1, [ 10 ], [ 1 ], bus);
        new DummyActor(10, [ 20, 30 ], [ 2, 3 ], bus);
        new DummyActor(100, [ 40, 50, 60 ], [ 4, 5, 6 ], bus);
      });

      it('should mediate', () => {
        return expect(mediator.mediate({ context: new ActionContext() })).resolves
          .toEqual({ field1: [ 10, 20, 30, 40, 50, 60 ], field2: [ 1, 2, 3, 4, 5, 6 ]});
      });
    });

    describe('for defined actors with s test that reject', () => {
      beforeEach(() => {
        bus = new Bus({ name: 'bus' });
        new DummyActor(1, [ 10 ], [ 1 ], bus);
        new DummyActor(1_000, [ 70, 80, 90, 100 ], [ 7, 8, 9, 10 ], bus, true);
        new DummyActor(10, [ 20, 30 ], [ 2, 3 ], bus);
        new DummyActor(100, [ 40, 50, 60 ], [ 4, 5, 6 ], bus);
        mediator = new MediatorCombineArray({ name: 'mediator', bus, fields: [ 'field1', 'field2' ]});
      });

      it('should mediate', () => {
        return expect(mediator.mediate({ context: new ActionContext() })).resolves
          .toEqual({ field1: [ 10, 20, 30, 40, 50, 60 ], field2: [ 1, 2, 3, 4, 5, 6 ]});
      });
    });

    describe('for defined actors with partly defined fields', () => {
      beforeEach(() => {
        new DummyActor(1, [ 10 ], [ 1 ], bus);
        new DummyActor(10, [ 20, 30 ], undefined, bus);
        new DummyActor(100, undefined, [ 4, 5, 6 ], bus);
      });

      it('should mediate', () => {
        return expect(mediator.mediate({ context: new ActionContext() })).resolves
          .toEqual({ field1: [ 10, 20, 30 ], field2: [ 1, 4, 5, 6 ]});
      });
    });
  });
});

class DummyActor extends Actor<IAction, IDummyTest, IDummyTest> {
  public readonly data1: any;
  public readonly data2: any;
  public readonly rejectTest: boolean;

  public constructor(id: number,
    data1: any,
    data2: any,
    bus: Bus<DummyActor, IAction, IDummyTest, IDummyTest>,
    rejectTest?: boolean) {
    super({ name: `dummy${id}`, bus });
    this.data1 = data1;
    this.data2 = data2;
    this.rejectTest = rejectTest === undefined ? false : rejectTest;
  }

  public async test(action: IAction): Promise<IDummyTest> {
    return new Promise((resolve, reject) => {
      if (this.rejectTest) {
        reject(new Error('foo'));
        return;
      }
      resolve({ field1: this.data1, field2: this.data2, otherField: 'ignored' });
    });
  }

  public async run(action: IAction): Promise<IDummyTest> {
    return { field1: this.data1, field2: this.data2, otherField: 'ignored' };
  }
}

interface IDummyTest extends IActorTest, IActorOutput {
  field1: number;
  field2: number;
  otherField: string;
}
