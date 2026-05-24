import { Injectable } from '@angular/core';
import { AmortizationRow } from '../models/mortgage.models';
import { PayslipLine } from '../models/salary.models';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  exportCSV(headers: string[], rows: (string | number)[][], filename: string): void {
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => this.escapeCsvCell(String(c))).join(','))
      .join('\n');
    this.downloadBlob('\ufeff' + csv, 'text/csv;charset=utf-8;', filename);
  }

  escapeCsvCell(value: string): string {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  exportAmortizationCSV(schedule: AmortizationRow[]): void {
    const headers = [
      'Δόση',
      'Ημερομηνία',
      'Δόση (€)',
      'Κεφάλαιο (€)',
      'Τόκος (€)',
      'Εισφορά Ν.128 (€)',
      'Υπόλοιπο (€)',
      'Επιτόκιο (%)',
      'Πρόωρη Αποπληρωμή (€)',
    ];
    const rows = schedule.map((r) => [
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
    this.exportCSV(headers, rows, 'amortization_schedule.csv');
  }

  printPage(): void {
    window.print();
  }

  printElement(elementId: string): void {
    const el = document.getElementById(elementId);
    if (!el) {
      window.print();
      return;
    }
    const w = window.open('', '_blank');
    if (!w) return;
    w.document
      .write(`<!DOCTYPE html><html lang="el"><head><meta charset="utf-8"><title>Salaries.gr</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;color:#111}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #ddd;padding:8px;text-align:right}
        th:first-child,td:first-child{text-align:left}
        h1{font-size:18px;margin-bottom:16px}
        .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}
        .lbl{color:#666;font-size:12px}.val{font-weight:700}
      </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 300);
  }

  exportPayslipPdf(lines: PayslipLine[], title: string): void {
    const html = `
      <h1>${title}</h1>
      <p style="color:#666;font-size:12px;margin-bottom:20px">Δελτίο Αποδοχών — Salaries.gr</p>
      ${lines.map((l) => `<div class="row"><span class="lbl">${l.label}</span><span class="val">${l.value}</span></div>`).join('')}
      <p style="margin-top:24px;font-size:11px;color:#999">Ενδεικτικό · όχι επίσημο δελτίο εργοδότη</p>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document
      .write(`<!DOCTYPE html><html lang="el"><head><meta charset="utf-8"><title>${title}</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;max-width:480px;margin:0 auto}
      .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
      .lbl{color:#444}.val{font-weight:700;font-variant-numeric:tabular-nums}
      h1{font-size:16px;text-transform:uppercase;letter-spacing:1px}</style></head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 300);
  }

  async copySummary(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Αντιγράφηκε!');
      return true;
    } catch {
      return false;
    }
  }

  showToast(msg: string): void {
    let el = document.getElementById('export-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'export-toast';
      el.style.cssText =
        'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.3)';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      el!.style.display = 'none';
    }, 2000);
  }

  private downloadBlob(content: string, mime: string, filename: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
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
