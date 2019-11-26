import { CursorEvent } from '../../specs/settings';

export const EXTERNAL_POINTER_EVENT = 'EXTERNAL_POINTER_EVENT';

interface ExternalPointerEvent {
  type: typeof EXTERNAL_POINTER_EVENT;
  event?: CursorEvent;
}

export function onExternalPointerEvent(event?: CursorEvent): ExternalPointerEvent {
  return { type: EXTERNAL_POINTER_EVENT, event };
}

export type EventsActions = ExternalPointerEvent;
