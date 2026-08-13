"use client";

import { useEffect, useRef, useState } from "react";
import type { OrderStatus } from "@/lib/order-status/engine";

type ConnectionState = "connecting" | "live" | "reconnecting" | "closed";

export function useOrderStatusStream(orderId: string, initialStatus: OrderStatus) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    // Terminal on arrival — nothing to subscribe to.
    const terminalOnLoad = ["DELIVERED", "CANCELLED", "FAILED_DELIVERY"];
    if (terminalOnLoad.includes(initialStatus)) {
      setConnection("closed");
      return;
    }

    const source = new EventSource(`/api/orders/${orderId}/stream`);

    source.addEventListener("open", () => setConnection("live"));

    source.addEventListener("status", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        setStatus(data.status);
      } catch {
        /* ignore malformed event */
      }
    });

    source.addEventListener("error", () => {
      // EventSource retries automatically; reflect that in the UI rather
      // than treating a transient drop as fatal.
      setConnection((prev) => (prev === "closed" ? prev : "reconnecting"));
    });

    return () => {
      source.close();
      setConnection("closed");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    const terminal: OrderStatus[] = ["DELIVERED", "CANCELLED", "FAILED_DELIVERY"];
    if (terminal.includes(status)) setConnection("closed");
  }, [status]);

  return { status, connection, setStatus };
}
