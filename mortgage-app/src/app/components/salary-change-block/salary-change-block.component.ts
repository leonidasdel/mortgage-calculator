import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-salary-change-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './salary-change-block.component.html',
})
export class SalaryChangeBlockComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() hasSalaryChange = false;

  @Output() salaryChangeToggle = new EventEmitter<boolean>();
  @Output() salaryChangeMonthChange = new EventEmitter<string>();
  @Output() previousGrossChange = new EventEmitter<string>();
}
