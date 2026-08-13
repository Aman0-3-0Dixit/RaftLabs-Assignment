import "@testing-library/jest-dom/vitest";

// jsdom has no layout engine, so ResizeObserver doesn't exist and real
// widths are always 0. Tests that need a specific width configure this via
// (window as any).__mockResizeWidth before rendering.
class MockResizeObserver {
  private el: Element | null = null;
  constructor(private callback: ResizeObserverCallback) {}
  observe(el: Element) {
    this.el = el;
    const width = (window as unknown as { __mockResizeWidth?: number }).__mockResizeWidth ?? 1000;
    this.callback(
      [
        {
          target: el,
          contentRect: { width, height: 800, top: 0, left: 0, bottom: 800, right: width, x: 0, y: 0, toJSON() {} },
        } as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver
    );
  }
  unobserve() {}
  disconnect() {}
}

(global as unknown as { ResizeObserver: typeof MockResizeObserver }).ResizeObserver =
  MockResizeObserver;

