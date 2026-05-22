import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calc-explanation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './calc-explanation.component.html',
  styleUrl: './calc-explanation.component.scss',
})
export class CalcExplanationComponent {
  title = input('Πώς υπολογίζεται;');
  steps = input<string[]>([]);
  formula = input('');
  open = signal(false);

  toggle(): void {
    this.open.update(v => !v);
  }
}
