import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoConfig {
  title: string;
  description: string;
  path: string;
  faq?: { question: string; answer: string }[];
}

export const SEO_CONFIG: Record<string, SeoConfig> = {
  '/': {
    title: 'Salaries.gr — Οικονομικοί Υπολογιστές',
    description: 'Δωρεάν υπολογιστές μισθού, δανείων, φόρων και ακινήτων για την Ελλάδα.',
    path: '/',
  },
  '/salary': {
    title: 'Υπολογισμός Μισθού 2026 — Μικτά σε Καθαρά | Salaries.gr',
    description: 'Υπολογίστε καθαρό μισθό, ΕΦΚΑ και φόρο εισοδήματος με 14 μισθούς.',
    path: '/salary',
    faq: [
      { question: 'Πόσα καθαρά παίρνω με 1500€ μικτά;', answer: 'Εξαρτάται από ηλικία, παιδιά και έτος. Χρησιμοποιήστε τον υπολογιστή για ακριβή αποτέλεσμα.' },
      { question: 'Πόσοι μισθοί υπολογίζονται ετησίως;', answer: '14 μισθοί: 12 μηνιαίοι + Δώρο Χριστουγέννων + Δώρο Πάσχα/επίδομα αδείας.' },
    ],
  },
  '/overtime': {
    title: 'Υπολογισμός Υπερωριών & Ωρομισθίου | Salaries.gr',
    description: 'Υπολογίστε αμοιβή υπερωριών +40% και +60% βάσει ελληνικού εργατικού δικαίου.',
    path: '/overtime',
    faq: [
      { question: 'Πόσο πληρώνονται οι υπερωρίες;', answer: 'Οι πρώτες 120 ώρες/έτος με +40%, οι επόμενες έως 150 με +60%.' },
    ],
  },
  '/inheritance-gift': {
    title: 'Φόρος Κληρονομιάς & Δωρεάς | Salaries.gr',
    description: 'Υπολογισμός φόρου κληρονομιάς και δωρεάς ανά κατηγορία συγγένειας Α/Β/Γ.',
    path: '/inheritance-gift',
  },
  '/crypto-tax': {
    title: 'Φόρος Κρυπτονομισμάτων 15% | Salaries.gr',
    description: 'Υπολογίστε φόρο 15% σε κέρδη κρυπτονομισμάτων με FIFO.',
    path: '/crypto-tax',
  },
  '/car-cost': {
    title: 'Τέλη Κυκλοφορίας & Κόστος Αυτοκινήτου 2026 | Salaries.gr',
    description: 'Υπολογισμός τελών κυκλοφορίας (cc ή CO₂) και ετήσιου κόστους ιδιοκτησίας.',
    path: '/car-cost',
  },
  '/mortgage': { title: 'Υπολογιστής Στεγατικού Δανείου | Salaries.gr', description: 'Δόση, τόκοι, πρόωρες αποπληρωμές.', path: '/mortgage' },
  '/severance': { title: 'Αποζημίωση Απόλυσης Ν.4808/2021 | Salaries.gr', description: 'Υπολογισμός αποζημίωσης ιδιωτικού τομέα.', path: '/severance' },
  '/consumer-loan': { title: 'Καταναλωτικό Δάνειο | Salaries.gr', description: 'Μηνιαία δόση καταναλωτικού δανείου.', path: '/consumer-loan' },
  '/annual-bonus': { title: 'Μπόνους Μισθού | Salaries.gr', description: 'Καθαρό ετήσιο μπόνους μετά ΕΦΚΑ και φόρο.', path: '/annual-bonus' },
  '/interest': { title: 'Υπολογισμός Τόκων | Salaries.gr', description: 'Καθαρή απόδοση καταθέσεων.', path: '/interest' },
  '/savings': { title: 'Αποταμίευση | Salaries.gr', description: 'Σύνθετος τόκος και πληθωρισμός.', path: '/savings' },
  '/freelancer': { title: 'Ελεύθερος Επαγγελματίας | Salaries.gr', description: 'Καθαρό εισόδημα μετά φόρους.', path: '/freelancer' },
  '/unused-leave': { title: 'Μη Ληφθείσα Άδεια | Salaries.gr', description: 'Αποζημίωση αχρησιμοποίητων αδειών.', path: '/unused-leave' },
  '/holiday-bonus': { title: 'Δώρα Εορτών | Salaries.gr', description: 'Δώρο Χριστουγέννων, Πάσχα, επίδομα αδείας.', path: '/holiday-bonus' },
  '/rent-vs-buy': { title: 'Νοικιάζω ή Αγοράζω; | Salaries.gr', description: 'Σύγκριση ενοικίασης vs αγοράς.', path: '/rent-vs-buy' },
  '/rental-tax': { title: 'Φόρος Ενοικίου | Salaries.gr', description: 'Φόρος εισοδήματος από ενοίκια.', path: '/rental-tax' },
  '/property-purchase': { title: 'Κόστος Αγοράς Ακινήτου | Salaries.gr', description: 'Μεταβίβαση, συμβολαιογράφος, φόροι.', path: '/property-purchase' },
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(private title: Title, private meta: Meta) {}

  updateForRoute(path: string): void {
    const cfg = SEO_CONFIG[path] ?? SEO_CONFIG['/'];
    this.title.setTitle(cfg.title);
    this.meta.updateTag({ name: 'description', content: cfg.description });
    this.meta.updateTag({ property: 'og:title', content: cfg.title });
    this.meta.updateTag({ property: 'og:description', content: cfg.description });
    this.meta.updateTag({ property: 'og:url', content: `https://salaries.gr${cfg.path}` });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.removeFaqSchema();
    if (cfg.faq?.length) this.injectFaqSchema(cfg.faq);
  }

  private injectFaqSchema(faq: { question: string; answer: string }[]): void {
    const script = document.createElement('script');
    script.id = 'faq-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
    document.head.appendChild(script);
  }

  private removeFaqSchema(): void {
    document.getElementById('faq-jsonld')?.remove();
  }
}
