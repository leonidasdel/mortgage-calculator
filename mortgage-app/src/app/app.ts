import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SeoService } from './services/seo.service';

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
  ) {}

  ngOnInit(): void {
    this.seo.updateForRoute(this.router.url.split('?')[0] || '/');
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    ).subscribe(e => {
      this.seo.updateForRoute(e.urlAfterRedirects.split('?')[0] || '/');
    });
  }
}
