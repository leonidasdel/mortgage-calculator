import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { SwUpdateService } from './sw-update.service';

describe('SwUpdateService', () => {
  let service: SwUpdateService;
  let versionUpdates$: Subject<{ type: string }>;
  let unrecoverable$: Subject<{ reason: string }>;
  let swUpdateMock: {
    isEnabled: boolean;
    versionUpdates: Subject<{ type: string }>;
    unrecoverable: Subject<{ reason: string }>;
    checkForUpdate: ReturnType<typeof vi.fn>;
    activateUpdate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    versionUpdates$ = new Subject();
    unrecoverable$ = new Subject();
    swUpdateMock = {
      isEnabled: true,
      versionUpdates: versionUpdates$,
      unrecoverable: unrecoverable$,
      checkForUpdate: vi.fn().mockResolvedValue(true),
      activateUpdate: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: SwUpdate, useValue: swUpdateMock }],
    });
    service = TestBed.inject(SwUpdateService);
  });

  it('should set updateAvailable on VERSION_READY', () => {
    service.init();
    expect(service.updateAvailable()).toBe(false);
    versionUpdates$.next({ type: 'VERSION_READY' } as VersionReadyEvent);
    expect(service.updateAvailable()).toBe(true);
  });

  it('should set updateAvailable on unrecoverable error', () => {
    service.init();
    unrecoverable$.next({ reason: 'cache bust' });
    expect(service.updateAvailable()).toBe(true);
  });

  it('should check for updates on init', () => {
    service.init();
    expect(swUpdateMock.checkForUpdate).toHaveBeenCalled();
  });

  it('should dismiss update banner', () => {
    service.updateAvailable.set(true);
    service.dismiss();
    expect(service.updateAvailable()).toBe(false);
  });

  it('should no-op when service worker disabled', () => {
    swUpdateMock.isEnabled = false;
    service.init();
    service.checkForUpdates();
    expect(swUpdateMock.checkForUpdate).not.toHaveBeenCalled();
  });
});
