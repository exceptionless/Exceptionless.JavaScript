import { IEvent } from '../models/IEvent';
import { InMemoryStorage } from './InMemoryStorage';
import { IStorageItem } from './IStorageItem';

describe('InMemoryStorage', () => {
  it('should save events', () => {
    var storage = new InMemoryStorage<IEvent>();
    var key = 'ex-q-';
    var event1:IEvent = { type: 'log', reference_id: key + '123454321' };
    var event2:IEvent = { type: 'log', reference_id: key + '098765432' };
    expect(storage.getList().length).toBe(0);
    storage.save(event1.reference_id, event1);
    expect(storage.getList().length).toBe(1);
    expect(storage.getList(key).length).toBe(1);
    storage.save(event2.reference_id, event2);
    expect(storage.getList().length).toBe(2);
    expect(storage.getList(key).length).toBe(2);
    expect(storage.getList(key + '1').length).toBe(1);
  });

  it('should save once', () => {
    var storage = new InMemoryStorage<number>();
    storage.save('one', 1);
    expect(storage.getList().length).toBe(1);
    storage.save('one', 1);
    expect(storage.getList().length).toBe(1);
  });

  it('should get by key', () => {
    var storage = new InMemoryStorage<any>();
    storage.save('ex-server-settings.json-version', 1);
    storage.save('ex-server-settings.json', { exist: true });
    expect(storage.getList().length).toBe(2);
    expect(storage.get('ex-server-settings.json-version')).toBe(1);
    expect(storage.get('ex-server-settings.json')).toEqual({ exist: true });
  });

  it('should get saved events', () => {
    var storage = new InMemoryStorage<IEvent>();
    var key = 'ex-q-';
    var event1:IEvent = { type: 'log', reference_id: key + '11' };
    var event2:IEvent = { type: 'log', reference_id: key + '12' };
    var event3:IEvent = { type: 'log', reference_id: key + '13' };
    var event4:IEvent = { type: 'log', reference_id: key + '14' };
    var event5:IEvent = { type: 'log', reference_id: key + '15' };
    var event6:IEvent = { type: 'log', reference_id: key + '16' };
    expect(storage.getList().length).toBe(0);

    storage.save(event1.reference_id, event1);
    storage.save(event2.reference_id, event2);
    storage.save(event3.reference_id, event3);
    storage.save(event4.reference_id, event4);
    storage.save(event5.reference_id, event5);
    storage.save(event6.reference_id, event6);
    expect(storage.getList().length).toBe(6);

    var ev = storage.get(event1.reference_id);
    expect(ev).toEqual(event1);
    expect(ev).toEqual(storage.getList(event1.reference_id, 1)[0].value);
    expect(storage.getList().length).toBe(6);
    storage.remove(event1.reference_id);
    expect(storage.get(event1.reference_id)).toBe(null);
    expect(storage.getList().length).toBe(5);

    ev = storage.getList(event2.reference_id, 1)[0].value;
    expect(ev).toEqual(event2);
    storage.remove(event2.reference_id);
    expect(storage.getList().length).toBe(4);

    var events = storage.getList(key, 2);
    expect(events.length).toBe(2);
    expect(events[0].value).not.toEqual(events[1].value);
    storage.remove(events[0].path);
    storage.remove(events[1].path);
    expect(storage.getList().length).toBe(2);

    events = storage.getList(key);
    expect(events.length).toBe(2);
    expect(events[0].value).not.toEqual(events[1].value);
  });

  it('should clear all events', () => {
    var storage = new InMemoryStorage<IEvent>();
    var key = 'ex-q-';
    var event1:IEvent = { type: 'log', reference_id: key + '11' };
    var event2:IEvent = { type: 'log', reference_id: key + '12' };
    var event3:IEvent = { type: 'log', reference_id: key + '13' };
    var event4:IEvent = { type: 'log', reference_id: key + '14' };
    var event5:IEvent = { type: 'log', reference_id: key + '15' };
    var event6:IEvent = { type: 'log', reference_id: key + '16' };
    expect(storage.getList().length).toBe(0);

    storage.save(event1.reference_id, event1);
    storage.save(event2.reference_id, event2);
    storage.save(event3.reference_id, event3);
    storage.save(event4.reference_id, event4);
    storage.save(event5.reference_id, event5);
    storage.save(event6.reference_id, event6);
    expect(storage.getList().length).toBe(6);

    storage.remove(event1.reference_id);
    expect(storage.getList().length).toBe(5);

    var events = storage.getList();
    for (var index = 0; index < events.length; index++) {
      storage.remove(events[index].path);
    }

    expect(storage.getList().length).toBe(0);
  });

  it('should get with limit', () => {
    var storage = new InMemoryStorage<IEvent>(250);
    for (var index:number = 0; index < 260; index++) {
      storage.save('ex-q-' + index, { type: 'log', reference_id: index.toString() });
    }

    expect(storage.getList().length).toBe(250);
    expect(storage.getList(null).length).toBe(250);
    expect(storage.getList(null, 1).length).toBe(1)
  });

  it('should get the oldest events', () => {
    function getDate(baseDate:Date, offset:number) {
      return new Date(baseDate.getTime() + (offset * 60000));
    }

    const date:Date = new Date();
    var storage = new InMemoryStorage<IEvent>();
    for (var index:number = 0; index < 10; index++) {
      storage.save('ex-q-' + index, {
        date: getDate(date, index),
        type: 'log',
        reference_id: index.toString()
      });

      expect(storage.getList().length).toBe(index + 1);
    }

    var offset:number = 0;
    var events:IStorageItem<IEvent>[] = storage.getList('ex-q-', 2);
    while (events && events.length > 0) {
      expect(2).toBe(events.length);
      for (var ei = 0; ei < 2; ei++) {
        expect(getDate(date, offset++)).toEqual(events[ei].value.date);
        storage.remove(events[ei].path);
      }

      events = storage.getList('ex-q-', 2);
    }
  });

  it('should respect max items limit', () => {
    var storage = new InMemoryStorage<IEvent>(5);
    for (var index:number = 0; index < 5; index++) {
      storage.save('ex-q-' + index, { type: 'log', reference_id: index.toString() });
    }

    var events:IStorageItem<IEvent>[] = storage.getList();
    expect(events.length).toBe(5);
    expect(events[0].path).toBe('ex-q-0');
    storage.save('ex-q-6', { type: 'log', reference_id: '6' });

    events = storage.getList();
    expect(events.length).toBe(5);
    expect(events[0].path).toBe('ex-q-1');
  });
});
