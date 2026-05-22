import { DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

const CHECK_INTERVAL_MS = 30 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class SwUpdateService {
  readonly updateAvailable = signal(false);

  private readonly swUpdate = inject(SwUpdate);

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    const destroyRef = inject(DestroyRef);

    const versionReady = toSignal(
      this.swUpdate.versionUpdates.pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
      ),
      { initialValue: null },
    );

    const unrecoverable = toSignal(this.swUpdate.unrecoverable, { initialValue: null });

    effect(() => {
      if (versionReady() || unrecoverable()) {
        this.updateAvailable.set(true);
      }
    });

    this.checkForUpdates();
    const intervalId = setInterval(() => this.checkForUpdates(), CHECK_INTERVAL_MS);

    const onVisible = (): void => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    destroyRef.onDestroy(() => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
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
