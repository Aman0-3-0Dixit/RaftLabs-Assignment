type Listener = (event: MessageEvent | Event) => void;

/**
 * jsdom has no EventSource implementation. This mock lets tests construct
 * one (capturing the instance), then manually fire "open"/"status"/"error"
 * events to drive the hook/component under test, the same way a real
 * server-sent event would.
 */
export class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  listeners: Record<string, Listener[]> = {};
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners[type] = (this.listeners[type] || []).filter((l) => l !== listener);
  }

  emit(type: string, data?: unknown) {
    const event =
      type === "status"
        ? new MessageEvent(type, { data: JSON.stringify(data) })
        : new Event(type);
    (this.listeners[type] || []).forEach((l) => l(event));
  }

  close() {
    this.closed = true;
  }

  static reset() {
    MockEventSource.instances = [];
  }
}