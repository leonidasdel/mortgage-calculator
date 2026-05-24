import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LawFooterComponent } from '../law-footer/law-footer.component';

export interface HomeTool {
  route: string;
  name: string;
  desc: string;
  icon: string;
  gradient: string;
  category: string;
  keywords: string;
}

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgOptimizedImage, RouterLink, LawFooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  searchQuery = signal('');

  readonly tools: HomeTool[] = [
    {
      route: '/mortgage',
      name: 'Στεγαστικό Δάνειο',
      desc: 'Δόση, τόκοι, πρόωρες αποπληρωμές',
      icon: '🏦',
      gradient: 'mortgage-gradient',
      category: 'Δάνεια',
      keywords: 'δάνειο δανειο στεγαστικό στεγαστικο',
    },
    {
      route: '/consumer-loan',
      name: 'Καταναλωτικό Δάνειο',
      desc: 'Μηνιαία δόση καταναλωτικής πίστης',
      icon: '💳',
      gradient: 'consumer-loan-gradient',
      category: 'Δάνεια',
      keywords: 'καταναλωτικό καταναλωτικο δάνειο δανειο',
    },
    {
      route: '/salary',
      name: 'Υπολογισμός Μισθού',
      desc: 'Μικτά ↔ καθαρά, ΕΦΚΑ, φόρος',
      icon: '💰',
      gradient: 'salary-gradient',
      category: 'Εισόδημα',
      keywords: 'μισθός καθαρά μισθος',
    },
    {
      route: '/annual-bonus',
      name: 'Μπόνους Μισθού',
      desc: 'Καθαρό ετήσιο μπόνους',
      icon: '💸',
      gradient: 'annual-bonus-gradient',
      category: 'Εισόδημα',
      keywords: 'μπόνους',
    },
    {
      route: '/freelancer',
      name: 'Ελεύθ. Επαγγελματίας',
      desc: 'Καθαρό μετά φόρων',
      icon: '📋',
      gradient: 'freelancer-gradient',
      category: 'Εισόδημα',
      keywords: 'ελεύθερος επαγγελματίας',
    },
    {
      route: '/unused-leave',
      name: 'Μη Ληφθείσα Άδεια',
      desc: 'Αποζημίωση αδειών',
      icon: '🏖️',
      gradient: 'unused-leave-gradient',
      category: 'Εισόδημα',
      keywords: 'άδεια',
    },
    {
      route: '/holiday-bonus',
      name: 'Δώρα Εορτών',
      desc: 'Χριστουγέννων, Πάσχα, επίδομα',
      icon: '🎁',
      gradient: 'holiday-bonus-gradient',
      category: 'Εισόδημα',
      keywords: 'δώρα',
    },
    {
      route: '/severance',
      name: 'Αποζημίωση Απόλυσης',
      desc: 'Ν.4808/2021',
      icon: '📄',
      gradient: 'severance-gradient',
      category: 'Εισόδημα',
      keywords: 'απόλυση αποζημίωση',
    },
    {
      route: '/inheritance-gift',
      name: 'Φόρος Κληρονομιάς & Δωρεάς',
      desc: 'Κατηγορίες Α/Β/Γ',
      icon: '🏛️',
      gradient: 'rental-tax-gradient',
      category: 'Φόροι',
      keywords: 'κληρονομιά δωρεά',
    },
    {
      route: '/crypto-tax',
      name: 'Φόρος Κρυπτονομισμάτων',
      desc: '15% κέρδη κεφαλαίου',
      icon: '₿',
      gradient: 'consumer-loan-gradient',
      category: 'Φόροι',
      keywords: 'crypto bitcoin',
    },
    {
      route: '/interest',
      name: 'Υπολογισμός Τόκων',
      desc: 'Καθαρή απόδοση καταθέσεων',
      icon: '📈',
      gradient: 'interest-gradient',
      category: 'Αποταμίευση',
      keywords: 'τόκοι',
    },
    {
      route: '/savings',
      name: 'Αποταμίευση',
      desc: 'Σύνθετος τόκος',
      icon: '🪴',
      gradient: 'savings-gradient',
      category: 'Αποταμίευση',
      keywords: 'αποταμίευση',
    },
    {
      route: '/car-cost',
      name: 'Κόστος Αυτοκινήτου',
      desc: 'Τέλη κυκλοφορίας 2026',
      icon: '🚗',
      gradient: 'rent-vs-buy-gradient',
      category: 'Άλλα',
      keywords: 'αυτοκίνητο τέλη',
    },
    {
      route: '/rent-vs-buy',
      name: 'Νοικιάζω ή Αγοράζω;',
      desc: 'Σύγκριση κόστους',
      icon: '🏠',
      gradient: 'rent-vs-buy-gradient',
      category: 'Ακίνητα',
      keywords: 'ενοίκιο αγορά',
    },
    {
      route: '/rental-tax',
      name: 'Φόρος Ενοικίου',
      desc: 'Φόρος εισοδήματος ενοικίων',
      icon: '🏘️',
      gradient: 'rental-tax-gradient',
      category: 'Ακίνητα',
      keywords: 'ενοίκιο φόρος',
    },
    {
      route: '/property-purchase',
      name: 'Κόστος Αγοράς Ακινήτου',
      desc: 'Μεταβίβαση, συμβολαιογράφος',
      icon: '🏡',
      gradient: 'property-purchase-gradient',
      category: 'Ακίνητα',
      keywords: 'αγορά ακινήτου',
    },
  ];

  readonly popularRoutes = ['/salary', '/mortgage', '/severance', '/car-cost'];

  readonly lifeEvents = [
    { label: 'Νέα δουλειά', routes: ['/salary'] },
    { label: 'Αγορά αυτοκινήτου', routes: ['/car-cost', '/consumer-loan'] },
    { label: 'Κληρονομιά / Δωρεά', routes: ['/inheritance-gift'] },
    { label: 'Απόλυση', routes: ['/severance', '/unused-leave'] },
  ];

  filteredTools = computed(() => {
    const q = normalizeGreekSearch(this.searchQuery());
    if (!q) return this.tools;
    return this.tools.filter((t) => {
      const haystack = normalizeGreekSearch(`${t.name} ${t.desc} ${t.keywords} ${t.category}`);
      return haystack.includes(q);
    });
  });

  onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  toolByRoute(route: string): HomeTool | undefined {
    return this.tools.find((t) => t.route === route);
  }
}

function normalizeGreekSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ς/g, 'σ')
    .trim();
}
