import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'euro', standalone: false })
export class EuroPipe implements PipeTransform {
  transform(value: number, decimals = 2): string {
    return '€' + value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
