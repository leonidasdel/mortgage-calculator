import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'mortgage', renderMode: RenderMode.Prerender },
  { path: 'consumer-loan', renderMode: RenderMode.Prerender },
  { path: 'salary', renderMode: RenderMode.Prerender },
  { path: 'annual-bonus', renderMode: RenderMode.Prerender },
  { path: 'holiday-bonus', renderMode: RenderMode.Prerender },
  { path: 'freelancer', renderMode: RenderMode.Prerender },
  { path: 'unused-leave', renderMode: RenderMode.Prerender },
  { path: 'severance', renderMode: RenderMode.Prerender },
  { path: 'interest', renderMode: RenderMode.Prerender },
  { path: 'savings', renderMode: RenderMode.Prerender },
  { path: 'rent-vs-buy', renderMode: RenderMode.Prerender },
  { path: 'rental-tax', renderMode: RenderMode.Prerender },
  { path: 'property-purchase', renderMode: RenderMode.Prerender },
  { path: 'inheritance-gift', renderMode: RenderMode.Prerender },
  { path: 'crypto-tax', renderMode: RenderMode.Prerender },
  { path: 'car-cost', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
