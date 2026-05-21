import { Component, Input } from '@angular/core';
import { ExportService } from '../../services/export.service';
import { ShareStateService } from '../../services/share-state.service';

@Component({
  selector: 'app-export-row',
  standalone: false,
  templateUrl: './export-row.component.html',
  styleUrl: './export-row.component.scss',
})
export class ExportRowComponent {
  @Input() sharePath = '';
  @Input() shareState: Record<string, unknown> = {};
  @Input() shareSummary = '';
  @Input() printTargetId = '';
  @Input() showPrint = true;
  @Input() showCopy = true;
  @Input() showShare = true;

  constructor(
    private exportSvc: ExportService,
    private shareSvc: ShareStateService,
  ) {}

  print(): void {
    if (this.printTargetId) {
      this.exportSvc.printElement(this.printTargetId);
    } else {
      this.exportSvc.printPage();
    }
  }

  async copySummary(): Promise<void> {
    const text = this.shareSummary || window.location.href;
    await this.exportSvc.copySummary(text);
  }

  async copyLink(): Promise<void> {
    if (!this.sharePath) return;
    await this.shareSvc.copyShareLink(this.sharePath, this.shareState);
    this.exportSvc.showToast('Ο σύνδεσμος αντιγράφηκε!');
  }

  shareWhatsApp(): void {
    if (!this.sharePath) return;
    const url = this.shareSvc.buildShareUrl(this.sharePath, this.shareState);
    const wa = this.shareSvc.whatsAppUrl(this.shareSummary || 'Δες τον υπολογισμό:', url);
    window.open(wa, '_blank');
  }
}
