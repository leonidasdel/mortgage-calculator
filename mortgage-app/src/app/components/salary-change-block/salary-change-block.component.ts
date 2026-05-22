import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-salary-change-block',
  standalone: false,
  templateUrl: './salary-change-block.component.html',
})
export class SalaryChangeBlockComponent {
  @Input() hasSalaryChange = false;

  @Output() salaryChangeToggle = new EventEmitter<boolean>();
  @Output() salaryChangeMonthChange = new EventEmitter<string>();
  @Output() previousGrossChange = new EventEmitter<string>();
}
