import { expect } from 'chai';
import { IEvent } from '../models/IEvent';
import { InMemoryStorage } from './InMemoryStorage';
import { IStorage } from './IStorage';
import { IStorageItem } from './IStorageItem';

describeStorage('InMemoryStorage', (maxItems = 250) => {
  return new InMemoryStorage(maxItems);
});

export function describeStorage(name: string,
                                storageFactory: (maxItems?: number) => IStorage,
                                beforeEachCallback?: () => void,
                                recreateStorage: boolean = false) {
  describe(name, () => {
    if (beforeEachCallback) {
      beforeEach(beforeEachCallback);
    }

    it('should save events', () => {
      let storage = storageFactory();
      const key = 'ex-q-';
      const event1: IEvent = { type: 'log', reference_id: key + '123454321' };
      const event2: IEvent = { type: 'log', reference_id: key + '098765432' };
      expect(storage.get().length).to.equal(0);
      storage.save(event1);
      expect(storage.get().length).to.equal(1);

      if (recreateStorage) {
        storage = storageFactory();
      }

      storage.save(event2);
      expect(storage.get().length).to.equal(2);
    });

    it('should get saved events', () => {
      let storage = storageFactory();
      const key = 'ex-q-';
      const event1: IEvent = { type: 'log', reference_id: key + '11' };
      const event2: IEvent = { type: 'log', reference_id: key + '12' };
      const event3: IEvent = { type: 'log', reference_id: key + '13' };
      const event4: IEvent = { type: 'log', reference_id: key + '14' };
      const event5: IEvent = { type: 'log', reference_id: key + '15' };
      const event6: IEvent = { type: 'log', reference_id: key + '16' };
      expect(storage.get().length).to.equal(0);

      const ts1 = storage.save(event1);
      const ts2 = storage.save(event2);
      storage.save(event3);
      storage.save(event4);
      storage.save(event5);
      storage.save(event6);
      expect(storage.get().length).to.equal(6);

      if (recreateStorage) {
        storage = storageFactory();
      }

      expect(storage.get().length).to.equal(6);
      storage.remove(ts1);
      expect(storage.get().length).to.equal(5);

      expect(storage.get()[0].value).to.eql(event2);
      storage.remove(ts2);
      expect(storage.get().length).to.equal(4);

      let events = storage.get(2);
      expect(events.length).to.equal(2);
      expect(events[0].value).not.to.equal(events[1].value);
      storage.remove(events[0].timestamp);
      storage.remove(events[1].timestamp);
      expect(storage.get().length).to.equal(2);

      events = storage.get();
      expect(events.length).to.equal(2);
      expect(events[0].value).not.to.equal(events[1].value);
    });

    it('should clear all events', () => {
      let storage = storageFactory();
      const key = 'ex-q-';
      const event1: IEvent = { type: 'log', reference_id: key + '11' };
      const event2: IEvent = { type: 'log', reference_id: key + '12' };
      const event3: IEvent = { type: 'log', reference_id: key + '13' };
      const event4: IEvent = { type: 'log', reference_id: key + '14' };
      const event5: IEvent = { type: 'log', reference_id: key + '15' };
      const event6: IEvent = { type: 'log', reference_id: key + '16' };
      expect(storage.get().length).to.equal(0);

      const ts1 = storage.save(event1);
      storage.save(event2);
      storage.save(event3);
      storage.save(event4);
      storage.save(event5);
      storage.save(event6);
      expect(storage.get().length).to.equal(6);

      if (recreateStorage) {
        storage = storageFactory();
      }

      storage.remove(ts1);
      expect(storage.get().length).to.equal(5);

      storage.clear();

      expect(storage.get().length).to.equal(0);
    });

    it('should get with limit', () => {
      let storage = storageFactory(250);
      for (let index: number = 0; index < 260; index++) {
        storage.save({ type: 'log', reference_id: index.toString() });
      }

      if (recreateStorage) {
        storage = storageFactory(250);
      }

      expect(storage.get().length).to.equal(250);
      expect(storage.get(1).length).to.equal(1);
    });

    it('should get the oldest events', () => {
      function getDate(baseDate: Date, offset: number) {
        return new Date(baseDate.getTime() + (offset * 60000));
      }

      const DATE: Date = new Date();
      let storage = storageFactory();
      for (let index: number = 0; index < 10; index++) {
        storage.save({
          date: getDate(DATE, index),
          type: 'log',
          reference_id: index.toString()
        });

        expect(storage.get().length).to.equal(index + 1);
      }

      if (recreateStorage) {
        storage = storageFactory();
      }

      let offset: number = 0;
      let events: IStorageItem[] = storage.get(2);
      while (events && events.length > 0) {
        expect(2).to.equal(events.length);
        for (let ei = 0; ei < 2; ei++) {
          expect(getDate(DATE, offset++)).to.eql(events[ei].value.date);
          storage.remove(events[ei].timestamp);
        }

        events = storage.get(2);
      }
    });

    it('should respect max items limit', () => {
      let storage = storageFactory(5);
      const timestamps = [];
      for (let index: number = 0; index < 5; index++) {
        timestamps.push(storage.save({ type: 'log', reference_id: index.toString() }));
      }

      let events: IStorageItem[] = storage.get();
      expect(events.length).to.equal(5);
      expect(events[0].timestamp).to.equal(timestamps[0]);
      storage.save({ type: 'log', reference_id: '6' });

      if (recreateStorage) {
        storage = storageFactory(5);
      }

      events = storage.get();
      expect(events.length).to.equal(5);
      expect(events[0].timestamp).to.equal(timestamps[1]);
    });

  });
}
