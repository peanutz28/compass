import EventEmitter from 'events';
import { Response } from 'express';

export const compassEvents = new EventEmitter();
compassEvents.setMaxListeners(100);

export type CompassEvent = {
  type: 'transaction_completed' | 'transaction_blocked' | 'approval_requested' | 'approval_resolved';
  data: Record<string, any>;
  timestamp: string;
};

export function emitEvent(type: CompassEvent['type'], data: Record<string, any>): void {
  const event: CompassEvent = { type, data, timestamp: new Date().toISOString() };
  compassEvents.emit('event', event);
}

const sseClients = new Set<Response>();

export function addSseClient(res: Response): void {
  sseClients.add(res);
  compassEvents.on('event', sendToClient(res));
}

export function removeSseClient(res: Response): void {
  sseClients.delete(res);
  compassEvents.removeListener('event', sendToClient(res));
}

function sendToClient(res: Response) {
  return (event: CompassEvent) => {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      // Client disconnected
    }
  };
}
