import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-loan-form',
  standalone: false,
  templateUrl: './loan-form.component.html',
  styleUrl: './loan-form.component.scss',
})
export class LoanFormComponent {
  @Input() form!: FormGroup;

  get varRate(): string {
    const euribor    = this.form?.get('euribor')?.value    || 0;
    const bankMargin = this.form?.get('bankMargin')?.value || 0;
    return (euribor + bankMargin).toFixed(2);
  }
}
