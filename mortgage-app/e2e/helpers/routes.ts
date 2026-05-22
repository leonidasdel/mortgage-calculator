/** Route smoke targets — titles mirror SEO_CONFIG in seo.service.ts */
export interface RouteSmoke {
  path: string;
  title: string;
  /** Visible heading text (h1.page-title or home hero) */
  heading: string;
  /** Defaults to h1.page-title; home uses .home-title */
  headingSelector?: string;
}

export const ROUTES: RouteSmoke[] = [
  {
    path: '/',
    title: 'Salaries.gr — Οικονομικοί Υπολογιστές',
    heading: 'Salaries.gr',
    headingSelector: '.home-title',
  },
  {
    path: '/mortgage',
    title: 'Υπολογιστής Στεγατικού Δανείου | Salaries.gr',
    heading: 'Υπολογισμός Δόσης Δανείου',
  },
  {
    path: '/consumer-loan',
    title: 'Καταναλωτικό Δάνειο | Salaries.gr',
    heading: 'Καταναλωτικό Δάνειο',
  },
  {
    path: '/salary',
    title: 'Υπολογισμός Μισθού 2026 — Μικτά σε Καθαρά | Salaries.gr',
    heading: 'Υπολογισμός Μισθού',
  },
  {
    path: '/annual-bonus',
    title: 'Μπόνους Μισθού | Salaries.gr',
    heading: 'Υπολογισμός Μπόνους',
  },
  {
    path: '/holiday-bonus',
    title: 'Δώρα Εορτών | Salaries.gr',
    heading: 'Δώρα Εορτών',
  },
  {
    path: '/freelancer',
    title: 'Ελεύθερος Επαγγελματίας | Salaries.gr',
    heading: 'Ελεύθερος Επαγγελματίας',
  },
  {
    path: '/unused-leave',
    title: 'Μη Ληφθείσα Άδεια | Salaries.gr',
    heading: 'Μη Ληφθείσα Άδεια',
  },
  {
    path: '/severance',
    title: 'Αποζημίωση Απόλυσης Ν.4808/2021 | Salaries.gr',
    heading: 'Αποζημίωση Απόλυσης',
  },
  {
    path: '/interest',
    title: 'Υπολογισμός Τόκων | Salaries.gr',
    heading: 'Υπολογισμός Τόκων',
  },
  {
    path: '/savings',
    title: 'Αποταμίευση | Salaries.gr',
    heading: 'Αποταμίευση',
  },
  {
    path: '/rent-vs-buy',
    title: 'Νοικιάζω ή Αγοράζω; | Salaries.gr',
    heading: 'Νοικιάζω ή Αγοράζω;',
  },
  {
    path: '/rental-tax',
    title: 'Φόρος Ενοικίου | Salaries.gr',
    heading: 'Φόρος Ενοικίου',
  },
  {
    path: '/property-purchase',
    title: 'Κόστος Αγοράς Ακινήτου | Salaries.gr',
    heading: 'Κόστος Αγοράς Ακινήτου',
  },
  {
    path: '/inheritance-gift',
    title: 'Φόρος Κληρονομιάς & Δωρεάς | Salaries.gr',
    heading: 'Φόρος Κληρονομιάς & Δωρεάς',
  },
  {
    path: '/crypto-tax',
    title: 'Φόρος Κρυπτονομισμάτων 15% | Salaries.gr',
    heading: 'Φόρος Κρυπτονομισμάτων',
  },
  {
    path: '/car-cost',
    title: 'Τέλη Κυκλοφορίας & Κόστος Αυτοκινήτου 2026 | Salaries.gr',
    heading: 'Κόστος Αυτοκινήτου',
  },
];
