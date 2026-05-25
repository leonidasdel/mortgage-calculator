import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LawFooterComponent } from '../law-footer/law-footer.component';

@Component({
  selector: 'app-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LawFooterComponent],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent {}
