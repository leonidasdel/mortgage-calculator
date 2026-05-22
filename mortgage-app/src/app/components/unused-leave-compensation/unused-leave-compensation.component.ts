import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LeaveResult } from '../../services/unused-leave-calculator.service';

import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
@Component({
  selector: 'app-unused-leave-compensation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EuroPipe],
  templateUrl: './unused-leave-compensation.component.html',
  styleUrl: './unused-leave-compensation.component.scss',
})
export class UnusedLeaveCompensationComponent {
  @Input({ required: true }) result!: LeaveResult;
  @Input() workWeek: '5day' | '6day' = '5day';
  @Input() unusedDays = 0;
  @Input() includeHolidayBonus = false;
}
