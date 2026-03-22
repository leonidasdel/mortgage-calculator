import { Component } from '@angular/core';

interface NavItem {
  route: string;
  icon: string;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-nav',
  standalone: false,
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent {
  mobileMenuOpen = false;
  collapsed = false;

  readonly navGroups: NavGroup[] = [
    {
      label: 'Δάνεια',
      items: [
        { route: '/mortgage', icon: '🏦', label: 'Στεγαστικό Δάνειο' },
        { route: '/consumer-loan', icon: '💳', label: 'Καταναλωτικό Δάνειο' },
      ],
    },
    {
      label: 'Εισόδημα',
      items: [
        { route: '/salary', icon: '💰', label: 'Υπολογισμός Μισθού' },
        { route: '/freelancer', icon: '📋', label: 'Ελεύθ. Επαγγελματίας' },
        { route: '/unused-leave', icon: '🏖️', label: 'Μη Ληφθείσα Άδεια' },
      ],
    },
    {
      label: 'Αποταμίευση',
      items: [
        { route: '/interest', icon: '📈', label: 'Υπολογισμός Τόκων' },
        { route: '/savings', icon: '🪴', label: 'Αποταμίευση' },
      ],
    },
    {
      label: 'Ακίνητα',
      items: [
        { route: '/rent-vs-buy', icon: '🏠', label: 'Νοικιάζω ή Αγοράζω;' },
        { route: '/rental-tax', icon: '🏘️', label: 'Φόρος Ενοικίου' },
      ],
    },
  ];

  toggleMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    document.body.classList.toggle('sidebar-collapsed', this.collapsed);
  }
}
