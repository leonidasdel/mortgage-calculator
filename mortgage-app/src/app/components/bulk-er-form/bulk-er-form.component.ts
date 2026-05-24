import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { BulkErParams } from '../../models/mortgage.models';
import { CommonModule } from '@angular/common';

interface BulkErModel {
  startMonth: number;
  amount: number;
  every: number;
  count: number;
}

const DEFAULT_BULK: BulkErModel = { startMonth: 12, amount: 3000, every: 12, count: 12 };

@Component({
  selector: 'app-bulk-er-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField],
  templateUrl: './bulk-er-form.component.html',
  styleUrl: './bulk-er-form.component.scss',
})
export class BulkErFormComponent {
  visible = input(false);
  addBulk = output<BulkErParams>();
  cancelled = output<void>();

  formModel = linkedSignal<boolean, BulkErModel>({
    source: this.visible,
    computation: (visible, prev) => {
      if (visible && !prev?.source) {
        return { ...DEFAULT_BULK };
      }
      return prev?.value ?? { ...DEFAULT_BULK };
    },
  });
  formFields = form(this.formModel);

  preview = computed(() => {
    const v = this.formModel();
    const start = Math.max(1, Math.round(v.startMonth || 1));
    const amt = Math.max(0, v.amount || 0);
    const every = Math.max(1, Math.round(v.every || 1));
    const count = Math.max(1, Math.round(v.count || 1));
    const last = start + (count - 1) * every;
    return `Θα προστεθούν ${count} πληρωμές × €${amt.toLocaleString('el-GR')} — από μήνα ${start}, κάθε ${every} μήνα/ες, έως μήνα ${last}.`;
  });

  submit(): void {
    const v = this.formModel();
    this.addBulk.emit({
      startMonth: Math.max(1, Math.round(v.startMonth || 1)),
      amount: Math.max(0, v.amount || 0),
      every: Math.max(1, Math.round(v.every || 1)),
      count: Math.max(1, Math.round(v.count || 1)),
    });
  }
}
