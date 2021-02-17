import { IEvent } from "../../src/models/IEvent.js";
import { InMemoryStorage } from "../../src/storage/InMemoryStorage.js";
import { IStorage } from "../../src/storage/IStorage.js";
import { IStorageItem } from "../../src/storage/IStorageItem.js";

describeStorage('InMemoryStorage', (maxItems = 250) => {
  return new InMemoryStorage(maxItems);
});

export function describeStorage(
  name: string,
  storageFactory: (maxItems?: number) => IStorage,
  afterEachCallback?: () => void,
  beforeEachCallback?: () => void,
  recreateStorage: boolean = false
) {
  describe(name, () => {
    if (beforeEachCallback) {
      beforeEach(beforeEachCallback);
    }

    if (afterEachCallback) {
      afterEach(afterEachCallback);
    }

    test('should save events', () => {
      let storage = storageFactory();
      const key = 'ex-q-';
      const event1: IEvent = { type: 'log', reference_id: key + '123454321' };
      const event2: IEvent = { type: 'log', reference_id: key + '098765432' };
      expect(storage.get().length).toBe(0);
      storage.save(event1);
      expect(storage.get().length).toBe(1);

      if (recreateStorage) {
        storage = storageFactory();
      }

      storage.save(event2);
      expect(storage.get().length).toBe(2);
    });

    test('should get saved events', () => {
      let storage = storageFactory();
      const key = 'ex-q-';
      const event1: IEvent = { type: 'log', reference_id: key + '11' };
      const event2: IEvent = { type: 'log', reference_id: key + '12' };
      const event3: IEvent = { type: 'log', reference_id: key + '13' };
      const event4: IEvent = { type: 'log', reference_id: key + '14' };
      const event5: IEvent = { type: 'log', reference_id: key + '15' };
      const event6: IEvent = { type: 'log', reference_id: key + '16' };
      expect(storage.get().length).toBe(0);

      const ts1 = storage.save(event1);
      const ts2 = storage.save(event2);
      storage.save(event3);
      storage.save(event4);
      storage.save(event5);
      storage.save(event6);
      expect(storage.get().length).toBe(6);

      if (recreateStorage) {
        storage = storageFactory();
      }

      expect(storage.get().length).toBe(6);
      storage.remove(ts1);
      expect(storage.get().length).toBe(5);

      expect(storage.get()[0].value).toEqual(event2);
      storage.remove(ts2);
      expect(storage.get().length).toBe(4);

      let events = storage.get(2);
      expect(events.length).toBe(2);
      expect(events[0].value).not.toEqual(events[1].value);
      storage.remove(events[0].timestamp);
      storage.remove(events[1].timestamp);
      expect(storage.get().length).toBe(2);

      events = storage.get();
      expect(events.length).toBe(2);
      expect(events[0].value).not.toEqual(events[1].value);
    });

    test('should clear all events', () => {
      let storage = storageFactory();
      const key = 'ex-q-';
      const event1: IEvent = { type: 'log', reference_id: key + '11' };
      const event2: IEvent = { type: 'log', reference_id: key + '12' };
      const event3: IEvent = { type: 'log', reference_id: key + '13' };
      const event4: IEvent = { type: 'log', reference_id: key + '14' };
      const event5: IEvent = { type: 'log', reference_id: key + '15' };
      const event6: IEvent = { type: 'log', reference_id: key + '16' };
      expect(storage.get().length).toBe(0);

      const ts1 = storage.save(event1);
      storage.save(event2);
      storage.save(event3);
      storage.save(event4);
      storage.save(event5);
      storage.save(event6);
      expect(storage.get().length).toBe(6);

      if (recreateStorage) {
        storage = storageFactory();
      }

      storage.remove(ts1);
      expect(storage.get().length).toBe(5);

      storage.clear();

      expect(storage.get().length).toBe(0);
    });

    test('should get with limit', () => {
      let storage = storageFactory(250);
      for (let index: number = 0; index < 260; index++) {
        storage.save({ type: 'log', reference_id: index.toString() });
      }

      if (recreateStorage) {
        storage = storageFactory(250);
      }

      expect(storage.get().length).toBe(250);
      expect(storage.get(1).length).toBe(1);
    });

    test('should get the oldest events', () => {
      function getDate(baseDate: Date, dateOffset: number) {
        return new Date(baseDate.getTime() + (dateOffset * 60000));
      }

      const DATE: Date = new Date();
      let storage = storageFactory();
      for (let index: number = 0; index < 10; index++) {
        storage.save({
          date: getDate(DATE, index),
          type: 'log',
          reference_id: index.toString()
        });

        expect(storage.get().length).toBe(index + 1);
      }

      if (recreateStorage) {
        storage = storageFactory();
      }

      let offset: number = 0;
      let events: IStorageItem[] = storage.get(2);
      while (events && events.length > 0) {
        expect(2).toBe(events.length);
        for (let ei = 0; ei < 2; ei++) {
          expect(getDate(DATE, offset++)).toEqual(events[ei].value.date);
          storage.remove(events[ei].timestamp);
        }

        events = storage.get(2);
      }
    });

    test('should respect max items limit', () => {
      let storage = storageFactory(5);
      const timestamps = [];
      for (let index: number = 0; index < 5; index++) {
        timestamps.push(storage.save({ type: 'log', reference_id: index.toString() }));
      }

      let events: IStorageItem[] = storage.get();
      expect(events.length).toBe(5);
      expect(events[0].timestamp).toBe(timestamps[0]);
      storage.save({ type: 'log', reference_id: '6' });

      if (recreateStorage) {
        storage = storageFactory(5);
      }

      events = storage.get();
      expect(events.length).toBe(5);
      expect(events[0].timestamp).toBe(timestamps[1]);
    });

  });
}
