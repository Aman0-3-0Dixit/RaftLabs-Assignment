import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOrderStatusStream } from "../useOrderStatusStream";
import { MockEventSource } from "@/test-utils/mock-event-source";

beforeEach(() => {
  MockEventSource.reset();
  vi.stubGlobal("EventSource", MockEventSource);
});

describe("useOrderStatusStream", () => {
  it("does not open a connection when the initial status is already terminal", () => {
    renderHook(() => useOrderStatusStream("order_1", "DELIVERED"));
    expect(MockEventSource.instances).toHaveLength(0);
  });

  it("opens a connection for a non-terminal initial status", () => {
    const { result } = renderHook(() => useOrderStatusStream("order_1", "RECEIVED"));
    expect(MockEventSource.instances).toHaveLength(1);
    expect(result.current.connection).toBe("connecting");
  });

  it("moves to 'live' once the connection opens", () => {
    const { result } = renderHook(() => useOrderStatusStream("order_1", "RECEIVED"));
    act(() => MockEventSource.instances[0].emit("open"));
    expect(result.current.connection).toBe("live");
  });

  it("updates status when a status event arrives", () => {
    const { result } = renderHook(() => useOrderStatusStream("order_1", "RECEIVED"));
    act(() => MockEventSource.instances[0].emit("status", { status: "CONFIRMED" }));
    expect(result.current.status).toBe("CONFIRMED");
  });

  it("closes out once a terminal status arrives over the stream", () => {
    const { result } = renderHook(() => useOrderStatusStream("order_1", "RECEIVED"));
    act(() => MockEventSource.instances[0].emit("status", { status: "DELIVERED" }));
    expect(result.current.status).toBe("DELIVERED");
    expect(result.current.connection).toBe("closed");
  });

  it("treats a dropped connection as reconnecting, not fatal", () => {
    const { result } = renderHook(() => useOrderStatusStream("order_1", "RECEIVED"));
    act(() => MockEventSource.instances[0].emit("open"));
    act(() => MockEventSource.instances[0].emit("error"));
    expect(result.current.connection).toBe("reconnecting");
    expect(result.current.status).toBe("RECEIVED"); // unaffected by the drop
  });

  it("closes the underlying EventSource on unmount", () => {
    const { unmount } = renderHook(() => useOrderStatusStream("order_1", "RECEIVED"));
    const instance = MockEventSource.instances[0];
    unmount();
    expect(instance.closed).toBe(true);
  });
});