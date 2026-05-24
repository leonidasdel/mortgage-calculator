import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { getLawMeta } from '../../constants/law-metadata';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-law-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './law-footer.component.html',
  styleUrl: './law-footer.component.scss',
})
export class LawFooterComponent {
  route = input('/');
  meta = computed(() => getLawMeta(this.route()));
}
