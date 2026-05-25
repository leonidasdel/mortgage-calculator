import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

/** Optional Plausible analytics — loads only when `plausibleDomain` is set. */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly platformId = inject(PLATFORM_ID);
  private loaded = false;

  init(): void {
    if (!isPlatformBrowser(this.platformId) || this.loaded) return;
    const domain = environment.plausibleDomain?.trim();
    if (!domain) return;

    this.loaded = true;
    const script = document.createElement('script');
    script.defer = true;
    script.dataset['domain'] = domain;
    script.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(script);
  }
}
