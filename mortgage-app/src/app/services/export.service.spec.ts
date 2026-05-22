import { TestBed } from '@angular/core/testing';
import { ExportService } from './export.service';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExportService);
  });

  describe('escapeCsvCell', () => {
    it('should return plain values unchanged', () => {
      expect(service.escapeCsvCell('1234.56')).toBe('1234.56');
    });

    it('should quote values with commas', () => {
      expect(service.escapeCsvCell('Αθήνα, Ελλάδα')).toBe('"Αθήνα, Ελλάδα"');
    });

    it('should escape double quotes', () => {
      expect(service.escapeCsvCell('say "hello"')).toBe('"say ""hello"""');
    });

    it('should quote values with newlines', () => {
      expect(service.escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
    });
  });
});
