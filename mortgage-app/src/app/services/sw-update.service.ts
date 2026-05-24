import {
  DestroyRef,
  EnvironmentInjector,
  effect,
  inject,
  Injectable,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

const CHECK_INTERVAL_MS = 30 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class SwUpdateService {
  readonly updateAvailable = signal(false);

  private readonly swUpdate = inject(SwUpdate);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(EnvironmentInjector);
  private initialized = false;

  init(): void {
    if (!this.swUpdate.isEnabled || this.initialized) return;
    this.initialized = true;

    runInInjectionContext(this.injector, () => {
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
    });

    this.checkForUpdates();
    const intervalId = setInterval(() => this.checkForUpdates(), CHECK_INTERVAL_MS);

    const onVisible = (): void => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    this.destroyRef.onDestroy(() => {
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
    this.swUpdate
      .activateUpdate()
      .then(() => document.location.reload())
      .catch(() => document.location.reload());
  }

  dismiss(): void {
    this.updateAvailable.set(false);
  }
}
