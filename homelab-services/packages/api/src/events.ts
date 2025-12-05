/**
 * Event Emitter for Real-Time Events
 *
 * Provides pub/sub pattern for broadcasting events to subscribed clients.
 */

import { EventEmitter } from 'events'
import type { Hook } from '@homelab/db'

export interface HookEvent {
  type: 'hook:created'
  data: Hook
}

export interface WorkerEvent {
  event: 'worker_spawned' | 'worker_started' | 'worker_progress' | 'worker_completed' | 'worker_failed'
  workerId: string
  status: string
  timestamp: Date
  data?: any
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

class WorkerEventEmitter extends EventEmitter {
  emit(event: 'worker:event', data: WorkerEvent): boolean {
    return super.emit(event, data)
  }

  on(event: 'worker:event', listener: (data: WorkerEvent) => void): this {
    return super.on(event, listener)
  }

  off(event: 'worker:event', listener: (data: WorkerEvent) => void): this {
    return super.off(event, listener)
  }
}

// Singleton instances
export const hookEvents = new HookEventEmitter()
export const workerEvents = new WorkerEventEmitter()
