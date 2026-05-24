import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export const OG_IMAGE_URL = 'https://salaries.gr/og-salaries.png';
export const SITE_ORIGIN = 'https://salaries.gr';

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
      {
        question: 'Πόσα καθαρά παίρνω με 1500€ μικτά;',
        answer:
          'Εξαρτάται από ηλικία, παιδιά και έτος. Χρησιμοποιήστε τον υπολογιστή για ακριβή αποτέλεσμα.',
      },
      {
        question: 'Πόσοι μισθοί υπολογίζονται ετησίως;',
        answer: '14 μισθοί: 12 μηνιαίοι + Δώρο Χριστουγέννων + Δώρο Πάσχα/επίδομα αδείας.',
      },
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
  '/mortgage': {
    title: 'Υπολογιστής Στεγατικού Δανείου | Salaries.gr',
    description: 'Δόση, τόκοι, πρόωρες αποπληρωμές.',
    path: '/mortgage',
  },
  '/severance': {
    title: 'Αποζημίωση Απόλυσης Ν.4808/2021 | Salaries.gr',
    description: 'Υπολογισμός αποζημίωσης ιδιωτικού τομέα.',
    path: '/severance',
  },
  '/consumer-loan': {
    title: 'Καταναλωτικό Δάνειο | Salaries.gr',
    description: 'Μηνιαία δόση καταναλωτικού δανείου.',
    path: '/consumer-loan',
  },
  '/annual-bonus': {
    title: 'Μπόνους Μισθού | Salaries.gr',
    description: 'Καθαρό ετήσιο μπόνους μετά ΕΦΚΑ και φόρο.',
    path: '/annual-bonus',
  },
  '/interest': {
    title: 'Υπολογισμός Τόκων | Salaries.gr',
    description: 'Καθαρή απόδοση καταθέσεων.',
    path: '/interest',
  },
  '/savings': {
    title: 'Αποταμίευση | Salaries.gr',
    description: 'Σύνθετος τόκος και πληθωρισμός.',
    path: '/savings',
  },
  '/freelancer': {
    title: 'Ελεύθερος Επαγγελματίας | Salaries.gr',
    description: 'Καθαρό εισόδημα μετά φόρους.',
    path: '/freelancer',
  },
  '/unused-leave': {
    title: 'Μη Ληφθείσα Άδεια | Salaries.gr',
    description: 'Αποζημίωση αχρησιμοποίητων αδειών.',
    path: '/unused-leave',
  },
  '/holiday-bonus': {
    title: 'Δώρα Εορτών | Salaries.gr',
    description: 'Δώρο Χριστουγέννων, Πάσχα, επίδομα αδείας.',
    path: '/holiday-bonus',
  },
  '/rent-vs-buy': {
    title: 'Νοικιάζω ή Αγοράζω; | Salaries.gr',
    description: 'Σύγκριση ενοικίασης vs αγοράς.',
    path: '/rent-vs-buy',
  },
  '/rental-tax': {
    title: 'Φόρος Ενοικίου | Salaries.gr',
    description: 'Φόρος εισοδήματος από ενοίκια.',
    path: '/rental-tax',
  },
  '/property-purchase': {
    title: 'Κόστος Αγοράς Ακινήτου | Salaries.gr',
    description: 'Μεταβίβαση, συμβολαιογράφος, φόροι.',
    path: '/property-purchase',
  },
};

export function normalizeSeoPath(path: string): string {
  return path.split('?')[0] || '/';
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  updateForRoute(path: string): void {
    const normalized = normalizeSeoPath(path);
    const cfg = SEO_CONFIG[normalized] ?? SEO_CONFIG['/'];
    const canonicalUrl = `${SITE_ORIGIN}${cfg.path === '/' ? '' : cfg.path}`;

    this.title.setTitle(cfg.title);
    this.meta.updateTag({ name: 'description', content: cfg.description });
    this.meta.updateTag({ property: 'og:title', content: cfg.title });
    this.meta.updateTag({ property: 'og:description', content: cfg.description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:image', content: OG_IMAGE_URL });
    this.setCanonical(canonicalUrl);
    this.removeFaqSchema();
    if (cfg.faq?.length) this.injectFaqSchema(cfg.faq);
  }

  private setCanonical(url: string): void {
    const head = this.doc.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private injectFaqSchema(faq: { question: string; answer: string }[]): void {
    this.removeFaqSchema();
    const script = this.doc.createElement('script');
    script.id = 'faq-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
    this.doc.head.appendChild(script);
  }

  private removeFaqSchema(): void {
    this.doc.getElementById('faq-jsonld')?.remove();
  }
}
