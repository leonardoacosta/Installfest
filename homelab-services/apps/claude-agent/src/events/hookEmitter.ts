import { EventEmitter } from 'events';
import type { Hook } from '@homelab/db';

export interface HookEvent {
  type: 'hook';
  data: Hook & { metadata: any };
}

class HookEventEmitter extends EventEmitter {
  emitHook(hook: Hook & { metadata: any }) {
    this.emit('hook', hook);
  }

  onHook(listener: (hook: Hook & { metadata: any }) => void) {
    this.on('hook', listener);
    return () => this.off('hook', listener);
  }
}

export const hookEmitter = new HookEventEmitter();
