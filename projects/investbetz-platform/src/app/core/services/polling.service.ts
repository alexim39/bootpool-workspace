import { Injectable, OnDestroy } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PollingService implements OnDestroy {
  private intervals: Map<string, any> = new Map();

  start(id: string, fn: () => void, intervalMs: number = 30000): () => void {
    this.stop(id);
    fn();
    this.intervals.set(id, setInterval(fn, intervalMs));
    return () => this.stop(id);
  }

  stop(id: string) {
    const existing = this.intervals.get(id);
    if (existing) { clearInterval(existing); this.intervals.delete(id); }
  }

  stopAll() { this.intervals.forEach((id) => clearInterval(id)); this.intervals.clear(); }

  ngOnDestroy() { this.stopAll(); }
}
