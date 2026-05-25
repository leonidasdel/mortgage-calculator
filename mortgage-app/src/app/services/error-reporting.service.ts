import { ErrorHandler, Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Lightweight client-side error capture (console + window hooks). */
@Injectable({ providedIn: 'root' })
export class ErrorReportingService {
  private readonly platformId = inject(PLATFORM_ID);
  private initialized = false;

  init(): void {
    if (!isPlatformBrowser(this.platformId) || this.initialized) return;
    this.initialized = true;

    window.addEventListener('error', (event) => this.captureException(event.error ?? event.message));
    window.addEventListener('unhandledrejection', (event) => this.captureException(event.reason));
  }

  captureException(error: unknown): void {
    console.error('[Salaries.gr]', error);
  }
}

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly reporting = inject(ErrorReportingService);

  handleError(error: unknown): void {
    this.reporting.captureException(error);
  }
}
