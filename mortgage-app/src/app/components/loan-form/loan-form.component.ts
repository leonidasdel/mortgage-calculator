import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { LoanParams } from '../../models/mortgage.models';

@Component({
  selector: 'app-loan-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  templateUrl: './loan-form.component.html',
  styleUrl: './loan-form.component.scss',
})
export class LoanFormComponent {
  formFields = input.required<FieldTree<LoanParams>>();

  varRate = computed(() => {
    const fields = this.formFields();
    const euribor = fields.euribor().value();
    const bankMargin = fields.bankMargin().value();
    return (euribor + bankMargin).toFixed(2);
  });
}
