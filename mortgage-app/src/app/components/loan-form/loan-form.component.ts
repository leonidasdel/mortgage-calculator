import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { LoanParams } from '../../models/mortgage.models';
import { RateFeedService } from '../../services/rate-feed.service';

@Component({
  selector: 'app-loan-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  templateUrl: './loan-form.component.html',
  styleUrl: './loan-form.component.scss',
})
export class LoanFormComponent {
  formFields = input.required<FieldTree<LoanParams>>();
  rateFeed = input<RateFeedService | null>(null);
  liveEuriborToggle = output<boolean>();

  varRate = computed(() => {
    const fields = this.formFields();
    const euribor = this.liveDisplayRate();
    return (euribor + fields.bankMargin().value()).toFixed(2);
  });

  useLive = computed(() => this.rateFeed()?.useLiveRate() ?? false);
  euriborLoading = computed(() => this.rateFeed()?.isLoading() ?? false);
  euriborAsOf = computed(() => this.rateFeed()?.asOf() ?? null);
  euriborFetchFailed = computed(
    () => this.useLive() && !this.euriborLoading() && (this.rateFeed()?.usedFallback() ?? false),
  );

  liveDisplayRate = computed(() => {
    const feed = this.rateFeed();
    if (feed?.useLiveRate()) {
      return feed.liveRate() ?? this.formFields().euribor().value();
    }
    return this.formFields().euribor().value();
  });

  toggleLiveEuribor(checked: boolean): void {
    this.liveEuriborToggle.emit(checked);
  }
}
