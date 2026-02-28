import { Injectable } from '@angular/core';
import { AmortizationRow } from '../models/mortgage.models';

@Injectable({ providedIn: 'root' })
export class ExportService {

  exportCSV(schedule: AmortizationRow[]): void {
    const headers = ['Δόση','Ημερομηνία','Δόση (€)','Κεφάλαιο (€)','Τόκος (€)','Εισφορά Ν.128 (€)','Υπόλοιπο (€)','Επιτόκιο (%)','Πρόωρη Αποπληρωμή (€)'];
    const body = schedule.map(r => [
      r.month,
      this.fmtDate(r.date),
      r.payment.toFixed(2),
      r.principal.toFixed(2),
      r.interest.toFixed(2),
      r.n128.toFixed(2),
      r.balance.toFixed(2),
      r.rate.toFixed(3),
      r.earlyAmt.toFixed(2),
    ]);

    const csv  = [headers, ...body].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'amortization_schedule.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private fmtDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }
}
