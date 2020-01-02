import { PointerEvent } from '../../specs/settings';

export const EXTERNAL_POINTER_EVENT = 'EXTERNAL_POINTER_EVENT';

interface ExternalPointerEvent {
  type: typeof EXTERNAL_POINTER_EVENT;
  event: PointerEvent;
}

export function onExternalPointerEvent(event: PointerEvent): ExternalPointerEvent {
  return { type: EXTERNAL_POINTER_EVENT, event };
}

export type EventsActions = ExternalPointerEvent;
