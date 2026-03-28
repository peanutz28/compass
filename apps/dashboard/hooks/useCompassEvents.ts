'use client';

import { useEffect, useRef } from 'react';

export type CompassEventType =
  | 'transaction_completed'
  | 'transaction_blocked'
  | 'approval_requested'
  | 'approval_resolved';

export interface CompassEvent {
  type: CompassEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

export function useCompassEvents(onEvent: (event: CompassEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_POLICY_SERVER_URL || 'http://localhost:3001';
    let es: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      es = new EventSource(`${base}/api/events`);

      es.onmessage = (e) => {
        try {
          const event: CompassEvent = JSON.parse(e.data);
          onEventRef.current(event);
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        es?.close();
        // Retry after 5 seconds
        retryTimeout = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      es?.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);
}
