import { IEvent } from '../models/IEvent';
import { InMemoryStorage } from './InMemoryStorage';

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
});
