import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { SeoService } from './services/seo.service';
import { SwUpdateService } from './services/sw-update.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SeoService, useValue: { updateForRoute: () => {} } },
        {
          provide: SwUpdateService,
          useValue: {
            updateAvailable: signal(false),
            init: () => {},
            applyUpdate: () => {},
            dismiss: () => {},
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
