import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { App } from './app';
import { SeoService } from './services/seo.service';
import { SwUpdateService } from './services/sw-update.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [App],
      imports: [RouterModule.forRoot([])],
      providers: [
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
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
