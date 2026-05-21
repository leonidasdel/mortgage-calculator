import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SeoService } from './services/seo.service';
import { SwUpdateService } from './services/sw-update.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  constructor(
    private router: Router,
    private seo: SeoService,
    public swUpdate: SwUpdateService,
  ) {}

  ngOnInit(): void {
    this.swUpdate.init();
    this.seo.updateForRoute(this.router.url.split('?')[0] || '/');
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    ).subscribe(e => {
      this.seo.updateForRoute(e.urlAfterRedirects.split('?')[0] || '/');
    });
  }
}
