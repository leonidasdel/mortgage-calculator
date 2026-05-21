import { Injectable, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

const CHECK_INTERVAL_MS = 30 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class SwUpdateService {
  readonly updateAvailable = signal(false);

  constructor(private swUpdate: SwUpdate) {}

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates.pipe(
      filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
    ).subscribe(() => this.updateAvailable.set(true));

    this.swUpdate.unrecoverable.subscribe(() => {
      this.updateAvailable.set(true);
    });

    this.checkForUpdates();
    setInterval(() => this.checkForUpdates(), CHECK_INTERVAL_MS);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates();
      }
    });
  }

  checkForUpdates(): void {
    if (!this.swUpdate.isEnabled) return;
    this.swUpdate.checkForUpdate().catch(() => {});
  }

  applyUpdate(): void {
    if (!this.swUpdate.isEnabled) return;
    this.swUpdate.activateUpdate()
      .then(() => document.location.reload())
      .catch(() => document.location.reload());
  }

  dismiss(): void {
    this.updateAvailable.set(false);
  }
}
