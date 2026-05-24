import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ExportService } from '../../services/export.service';
import { ShareStateService } from '../../services/share-state.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-export-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './export-row.component.html',
  styleUrl: './export-row.component.scss',
})
export class ExportRowComponent {
  sharePath = input('');
  shareState = input<object>({});
  shareSummary = input('');
  printTargetId = input('');
  showPrint = input(true);
  showCopy = input(true);
  showShare = input(true);

  private readonly exportSvc = inject(ExportService);
  private readonly shareSvc = inject(ShareStateService);

  print(): void {
    const targetId = this.printTargetId();
    if (targetId) {
      this.exportSvc.printElement(targetId);
    } else {
      this.exportSvc.printPage();
    }
  }

  async copySummary(): Promise<void> {
    const text = this.shareSummary() || window.location.href;
    await this.exportSvc.copySummary(text);
  }

  async copyLink(): Promise<void> {
    const path = this.sharePath();
    if (!path) return;
    await this.shareSvc.copyShareLink(path, this.shareState() as Record<string, unknown>);
    this.exportSvc.showToast('Ο σύνδεσμος αντιγράφηκε!');
  }

  shareWhatsApp(): void {
    const path = this.sharePath();
    if (!path) return;
    const url = this.shareSvc.buildShareUrl(path, this.shareState() as Record<string, unknown>);
    const wa = this.shareSvc.whatsAppUrl(this.shareSummary() || 'Δες τον υπολογισμό:', url);
    window.open(wa, '_blank');
  }
}
