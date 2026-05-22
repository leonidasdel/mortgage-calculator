import { Injectable, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ShareStateService {
  private readonly router = inject(Router);

  serializeState(state: object): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(state as Record<string, unknown>)) {
      if (v === null || v === undefined || v === '') continue;
      if (typeof v === 'object') {
        params.set(k, JSON.stringify(v));
      } else {
        params.set(k, String(v));
      }
    }
    return params.toString();
  }

  deserializeState(query: Record<string, string>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(query)) {
      if (v.startsWith('{') || v.startsWith('[')) {
        try { out[k] = JSON.parse(v); } catch { out[k] = v; }
      } else if (v === 'true') out[k] = true;
      else if (v === 'false') out[k] = false;
      else if (!isNaN(Number(v)) && v !== '') out[k] = Number(v);
      else out[k] = v;
    }
    return out;
  }

  buildShareUrl(path: string, state: object): string {
    const qs = this.serializeState(state);
    const base = window.location.origin + path;
    return qs ? `${base}?${qs}` : base;
  }

  async copyShareLink(path: string, state: object): Promise<string> {
    const url = this.buildShareUrl(path, state);
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    return url;
  }

  whatsAppUrl(summary: string, url: string): string {
    const text = encodeURIComponent(`${summary}\n\n${url}`);
    return `https://wa.me/?text=${text}`;
  }

  getQueryParams(): Record<string, string> {
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }

  loadShareStateIntoForm(form: FormGroup, options?: { emitEvent?: boolean }): boolean {
    const qp = this.getQueryParams();
    if (!Object.keys(qp).length) return false;
    form.patchValue(this.deserializeState(qp), { emitEvent: options?.emitEvent ?? false });
    return true;
  }
}
