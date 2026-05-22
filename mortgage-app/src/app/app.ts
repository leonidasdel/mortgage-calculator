import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { NavComponent } from './components/nav/nav.component';
import { SeoService } from './services/seo.service';
import { SwUpdateService } from './services/sw-update.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  readonly swUpdate = inject(SwUpdateService);

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.swUpdate.init();
    this.seo.updateForRoute(this.router.url.split('?')[0] || '/');
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(destroyRef),
    ).subscribe(e => {
      this.seo.updateForRoute(e.urlAfterRedirects.split('?')[0] || '/');
    });
  }
}
