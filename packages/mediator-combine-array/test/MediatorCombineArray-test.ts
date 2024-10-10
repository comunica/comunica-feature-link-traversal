import type { IAction, IActorOutput, IActorTest, TestResult } from '@comunica/core';
import { ActionContext, Actor, Bus, failTest, Mediator, passTest } from '@comunica/core';
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
      expect(new (<any> MediatorCombineArray)({ name: 'mediator', bus, fields: [ 'field1', 'field2' ]}))
        .toBeInstanceOf(MediatorCombineArray);
      expect(new (<any> MediatorCombineArray)({ name: 'mediator', bus, fields: [ 'field1', 'field2' ]}))
        .toBeInstanceOf(Mediator);
    });
  });

  describe('An MediatorCombineArray instance', () => {
    let mediator: MediatorCombineArray<DummyActor, IAction, IDummyTest, IDummyTest>;

    beforeEach(() => {
      mediator = new MediatorCombineArray({ name: 'mediator', bus, fields: [ 'field1', 'field2' ]});
    });

    it('should throw an error when mediateWith is called', () => {
      expect(() => (<any> mediator).mediateWith({}, [])).toThrow('Method not supported.');
    });

    describe('without actors', () => {
      it('should mediate', async() => {
        await expect(mediator.mediate({ context: new ActionContext() }))
          .resolves.toEqual({ field1: [], field2: []});
      });
    });

    describe('for defined actors', () => {
      beforeEach(() => {
        new DummyActor(1, [ 10 ], [ 1 ], bus);
        new DummyActor(10, [ 20, 30 ], [ 2, 3 ], bus);
        new DummyActor(100, [ 40, 50, 60 ], [ 4, 5, 6 ], bus);
      });

      it('should mediate', async() => {
        await expect(mediator.mediate({ context: new ActionContext() })).resolves
          .toEqual({ field1: [ 10, 20, 30, 40, 50, 60 ], field2: [ 1, 2, 3, 4, 5, 6 ]});
      });
    });

    describe('for defined actors with partly defined fields', () => {
      beforeEach(() => {
        new DummyActor(1, [ 10 ], [ 1 ], bus);
        new DummyActor(10, [ 20, 30 ], undefined, bus);
        new DummyActor(100, undefined, [ 4, 5, 6 ], bus);
      });

      it('should mediate', async() => {
        await expect(mediator.mediate({ context: new ActionContext() })).resolves
          .toEqual({ field1: [ 10, 20, 30 ], field2: [ 1, 4, 5, 6 ]});
      });
    });
  });

  describe('An MediatorCombineArray instance with erroring actors', () => {
    let mediator: MediatorCombineArray<DummyActor, IAction, IDummyTest, IDummyTest>;

    beforeEach(() => {
      mediator = new MediatorCombineArray({
        name: 'mediator',
        bus,
        fields: [ 'field1', 'field2' ],
        filterErrors: true,
      });
    });

    it('should throw an error when mediateWith is called', () => {
      expect(() => (<any> mediator).mediateWith({}, [])).toThrow('Method not supported.');
    });

    describe('without actors', () => {
      it('should mediate', async() => {
        await expect(mediator.mediate({ context: new ActionContext() }))
          .resolves.toEqual({ field1: [], field2: []});
      });
    });

    describe('for defined actors', () => {
      beforeEach(() => {
        new DummyActor(1, [ 10 ], [ 1 ], bus);
        new DummyActor(10, [ 20, 30 ], [ 2, 3 ], bus);
        new DummyThrowActor(50, bus);
        new DummyActor(100, [ 40, 50, 60 ], [ 4, 5, 6 ], bus);
      });

      it('should mediate', async() => {
        await expect(mediator.mediate({ context: new ActionContext() })).resolves
          .toEqual({ field1: [ 10, 20, 30, 40, 50, 60 ], field2: [ 1, 2, 3, 4, 5, 6 ]});
      });
    });
  });
});

class DummyActor extends Actor<IAction, IDummyTest, IDummyTest> {
  public readonly data1: any;
  public readonly data2: any;

  public constructor(id: number, data1: any, data2: any, bus: Bus<DummyActor, IAction, IDummyTest, IDummyTest>) {
    super({ name: `dummy${id}`, bus });
    this.data1 = data1;
    this.data2 = data2;
  }

  public async test(): Promise<TestResult<IDummyTest>> {
    return passTest({ field1: this.data1, field2: this.data2, otherField: 'ignored' });
  }

  public async run(action: IAction): Promise<IDummyTest> {
    return { field1: this.data1, field2: this.data2, otherField: 'ignored' };
  }
}

class DummyThrowActor extends DummyActor {
  public constructor(
    id: number,
    bus: Bus<DummyActor, IAction, IDummyTest, IDummyTest>,
  ) {
    super(id, {}, {}, bus);
  }

  public override async test(): Promise<TestResult<IDummyTest>> {
    return failTest('Dummy Error');
  }
}

interface IDummyTest extends IActorTest, IActorOutput {
  field1: number;
  field2: number;
  otherField: string;
}
