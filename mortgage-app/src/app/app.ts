import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs/operators';
import { NavComponent } from './components/nav/nav.component';
import { SeoService } from './services/seo.service';
import { SwUpdateService } from './services/sw-update.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  readonly swUpdate = inject(SwUpdateService);

  private readonly navUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.split('?')[0] || '/'),
    ),
    { initialValue: this.router.url.split('?')[0] || '/' },
  );

  constructor() {
    effect(() => {
      this.seo.updateForRoute(this.navUrl());
    });
  }
}
