export interface LawMeta {
  route: string;
  law: string;
  lastVerified: string;
  sourceUrl?: string;
  disclaimer: string;
}

export const LAW_METADATA: Record<string, LawMeta> = {
  '/': {
    route: '/',
    law: 'Salaries.gr',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτικοί υπολογισμοί · όχι επίσημες βεβαιώσεις ΑΑΔΕ/ΕΦΚΑ.',
  },
  '/mortgage': {
    route: '/mortgage',
    law: 'Ν.128/1975 (εισφορά)',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτικός υπολογισμός · όχι προσφορά τράπεζας.',
  },
  '/salary': {
    route: '/salary',
    law: 'Κ.Φ.Ε. + ΕΦΚΑ',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτικός υπολογισμός · όχι επίσημη βεβαίωση ΕΦΚΑ/ΑΑΔΕ.',
  },
  '/annual-bonus': {
    route: '/annual-bonus',
    law: 'Κ.Φ.Ε. + ΕΦΚΑ',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτικός υπολογισμός μπόνους.',
  },
  '/inheritance-gift': {
    route: '/inheritance-gift',
    law: 'Κ.Φ.Ε. άρθρα 29-30',
    lastVerified: '2026-05',
    sourceUrl: 'https://www.aade.gr/',
    disclaimer: 'Ενδεικτικός υπολογισμός · όχι επίσημη δήλωση ΑΑΔΕ.',
  },
  '/crypto-tax': {
    route: '/crypto-tax',
    law: 'Φόρος κερδών κεφαλαίου 15%',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτικός υπολογισμός · δήλωση Ε1 έως 30/6.',
  },
  '/car-cost': {
    route: '/car-cost',
    law: 'Τέλη κυκλοφορίας 2026',
    lastVerified: '2026-05',
    sourceUrl: 'https://www.aade.gr/',
    disclaimer: 'Ενδεικτικός υπολογισμός · επαλήθευση στο myCar.',
  },
  '/interest': {
    route: '/interest',
    law: 'Παρακράτηση τόκων 15%',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτικός υπολογισμός.',
  },
  '/consumer-loan': {
    route: '/consumer-loan',
    law: 'Ν.128/1975',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτικός υπολογισμός.',
  },
  '/rent-vs-buy': {
    route: '/rent-vs-buy',
    law: 'Σύγκριση κόστους',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτική ανάλυση.',
  },
  '/rental-tax': {
    route: '/rental-tax',
    law: 'Κ.Φ.Ε. ενοίκια',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτικός υπολογισμός φόρου.',
  },
  '/freelancer': {
    route: '/freelancer',
    law: 'Κ.Φ.Ε. + ΕΦΚΑ',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτικός υπολογισμός.',
  },
  '/savings': {
    route: '/savings',
    law: 'Σύνθετος τόκος',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτική προβολή.',
  },
  '/unused-leave': {
    route: '/unused-leave',
    law: 'Ν.4093/2012',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτικός υπολογισμός.',
  },
  '/holiday-bonus': {
    route: '/holiday-bonus',
    law: 'Κ.Φ.Ε. + ΕΦΚΑ',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτικός υπολογισμός.',
  },
  '/severance': {
    route: '/severance',
    law: 'Ν.4808/2021',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτικός υπολογισμός αποζημίωσης.',
  },
  '/property-purchase': {
    route: '/property-purchase',
    law: 'Μεταβίβαση ακινήτου',
    lastVerified: '2026-05',
    disclaimer: 'Ενδεικτικός υπολογισμός κόστους.',
  },
  '/privacy': {
    route: '/privacy',
    law: 'Salaries.gr',
    lastVerified: '2026-05',
    disclaimer: 'Πολιτική απορρήτου · client-side εφαρμογή.',
  },
};

export function getLawMeta(route: string): LawMeta {
  return LAW_METADATA[route] ?? LAW_METADATA['/'];
}
