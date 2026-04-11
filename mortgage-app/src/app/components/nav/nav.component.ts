import { Component, OnInit } from '@angular/core';

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
export class NavComponent implements OnInit {
  mobileMenuOpen = false;
  collapsed = false;
  darkMode = false;

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
        { route: '/unused-leave',  icon: '🏖️', label: 'Μη Ληφθείσα Άδεια' },
        { route: '/holiday-bonus', icon: '🎁', label: 'Δώρα Εορτών' },
        { route: '/severance',     icon: '📄', label: 'Αποζημίωση Απόλυσης' },
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
        { route: '/rental-tax',         icon: '🏘️', label: 'Φόρος Ενοικίου' },
        { route: '/property-purchase',  icon: '🏡', label: 'Κόστος Αγοράς Ακινήτου' },
      ],
    },
  ];

  ngOnInit(): void {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      this.darkMode = saved === 'true';
    } else {
      this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    document.documentElement.classList.toggle('dark', this.darkMode);
  }

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

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', String(this.darkMode));
    document.documentElement.classList.toggle('dark', this.darkMode);
  }
}
