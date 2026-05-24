import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LeaveResult } from '../../services/unused-leave-calculator.service';
import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';

@Component({
  selector: 'app-unused-leave-compensation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EuroPipe],
  templateUrl: './unused-leave-compensation.component.html',
  styleUrl: './unused-leave-compensation.component.scss',
})
export class UnusedLeaveCompensationComponent {
  result = input.required<LeaveResult>();
  workWeek = input<'5day' | '6day'>('5day');
  unusedDays = input(0);
  includeHolidayBonus = input(false);
}
