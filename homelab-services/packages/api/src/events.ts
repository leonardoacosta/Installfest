/**
 * Event Emitter for Real-Time Hook Events
 *
 * Provides pub/sub pattern for broadcasting hook events to subscribed clients.
 */

import { EventEmitter } from 'events'
import type { Hook } from '@homelab/db'

export interface HookEvent {
  type: 'hook:created'
  data: Hook
}

class HookEventEmitter extends EventEmitter {
  emit(event: 'hook:created', data: Hook): boolean {
    return super.emit(event, data)
  }

  on(event: 'hook:created', listener: (data: Hook) => void): this {
    return super.on(event, listener)
  }

  off(event: 'hook:created', listener: (data: Hook) => void): this {
    return super.off(event, listener)
  }
}

// Singleton instance
export const hookEvents = new HookEventEmitter()
