import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BulkErParams } from '../../models/mortgage.models';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-bulk-er-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bulk-er-form.component.html',
  styleUrl: './bulk-er-form.component.scss',
})
export class BulkErFormComponent implements OnChanges {
  @Input()  visible = false;
  @Output() addBulk = new EventEmitter<BulkErParams>();
  @Output() cancelled = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      startMonth: [12, [Validators.required, Validators.min(1)]],
      amount:     [3000, [Validators.required, Validators.min(0)]],
      every:      [12, [Validators.required, Validators.min(1)]],
      count:      [12, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true && changes['visible'].previousValue === false) {
      this.form.reset({ startMonth: 12, amount: 3000, every: 12, count: 12 });
    }
  }

  get preview(): string {
    const v = this.form.value;
    const start = Math.max(1, Math.round(v.startMonth || 1));
    const amt   = Math.max(0, v.amount || 0);
    const every = Math.max(1, Math.round(v.every || 1));
    const count = Math.max(1, Math.round(v.count || 1));
    const last  = start + (count - 1) * every;
    return `Θα προστεθούν ${count} πληρωμές × €${amt.toLocaleString('el-GR')} — από μήνα ${start}, κάθε ${every} μήνα/ες, έως μήνα ${last}.`;
  }

  submit(): void {
    const v = this.form.value;
    this.addBulk.emit({
      startMonth: Math.max(1, Math.round(v.startMonth || 1)),
      amount:     Math.max(0, v.amount || 0),
      every:      Math.max(1, Math.round(v.every || 1)),
      count:      Math.max(1, Math.round(v.count || 1)),
    });
  }
}
