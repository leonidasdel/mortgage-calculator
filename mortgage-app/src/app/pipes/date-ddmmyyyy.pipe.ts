import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateDDMMYYYY', standalone: false })
export class DateDDMMYYYYPipe implements PipeTransform {
  transform(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }
}
