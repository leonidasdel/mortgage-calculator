import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTree, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-salary-change-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField],
  templateUrl: './salary-change-block.component.html',
})
export class SalaryChangeBlockComponent {
  // Subset of parent salary form fields — passed from parent FieldTree
  formFields = input.required<FieldTree<{
    hasSalaryChange: boolean;
    salaryChangeMonth: string;
    previousGross: number;
  }>>();
  hasSalaryChange = input(false);

  salaryChangeToggle = output<boolean>();
  salaryChangeMonthChange = output<string>();
  previousGrossChange = output<string>();
}
