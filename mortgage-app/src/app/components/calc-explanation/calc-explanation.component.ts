import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-calc-explanation',
  standalone: false,
  templateUrl: './calc-explanation.component.html',
  styleUrl: './calc-explanation.component.scss',
})
export class CalcExplanationComponent {
  @Input() title = 'Πώς υπολογίζεται;';
  @Input() steps: string[] = [];
  @Input() formula = '';
  open = signal(false);

  toggle(): void {
    this.open.update(v => !v);
  }
}
