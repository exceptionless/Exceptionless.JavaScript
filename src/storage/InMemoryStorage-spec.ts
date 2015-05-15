import { IEvent } from '../models/IEvent';
import { InMemoryStorage } from './InMemoryStorage';

describe('InMemoryStorage', () => {
  it('should save events', () => {
    var storage = new InMemoryStorage<IEvent>();
    var key = 'ex-LhhP1C9gi-q-';
    var event1:IEvent = { type: 'log', reference_id: key + '123454321' };
    var event2:IEvent = { type: 'log', reference_id: key + '098765432' };
    expect(storage.count()).toBe(0);
    storage.save(event1.reference_id, event1);
    expect(storage.count()).toBe(1);
    expect(storage.count(key)).toBe(1);
    storage.save(event2.reference_id, event2);
    expect(storage.count()).toBe(2);
    expect(storage.count(key)).toBe(2);
    expect(storage.count(key + '1')).toBe(1);
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
    expect(storage.count()).toBe(0);

    storage.save(event1.reference_id, event1);
    storage.save(event2.reference_id, event2);
    storage.save(event3.reference_id, event3);
    storage.save(event4.reference_id, event4);
    storage.save(event5.reference_id, event5);
    storage.save(event6.reference_id, event6);
    expect(storage.count()).toBe(6);

    var ev = storage.get(event1.reference_id, 1)[0];
    expect(ev).toEqual(event1);
    expect(storage.count()).toBe(5);

    ev = storage.get(event2.reference_id, 1)[0];
    expect(ev).toEqual(event2);
    expect(storage.count()).toBe(4);

    var events = storage.get(key, 2);
    expect(events.length).toBe(2);
    expect(events[0]).not.toEqual(events[1]);
    expect(storage.count()).toBe(2);

    events = storage.get(key);
    expect(events.length).toBe(2);
    expect(events[0]).not.toEqual(events[1]);
    expect(storage.count()).toBe(0);
  });

  it('should clear all events', () => {
    var storage = new InMemoryStorage<IEvent>();
    var key = 'ex-LhhP1C9gi-q-';
    var event1:IEvent = { type: 'log', reference_id: key + '11' };
    var event2:IEvent = { type: 'log', reference_id: key + '12' };
    var event3:IEvent = { type: 'log', reference_id: key + '13' };
    var event4:IEvent = { type: 'log', reference_id: key + '14' };
    var event5:IEvent = { type: 'log', reference_id: key + '15' };
    var event6:IEvent = { type: 'log', reference_id: key + '16' };
    expect(storage.count()).toBe(0);

    storage.save(event1.reference_id, event1);
    storage.save(event2.reference_id, event2);
    storage.save(event3.reference_id, event3);
    storage.save(event4.reference_id, event4);
    storage.save(event5.reference_id, event5);
    storage.save(event6.reference_id, event6);
    expect(storage.count()).toBe(6);

    storage.clear(event1.reference_id);
    expect(storage.count()).toBe(5);

    storage.clear();
    expect(storage.count()).toBe(0);
  });
});
