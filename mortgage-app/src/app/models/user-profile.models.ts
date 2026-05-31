import { AgeGroup } from './salary.models';

export const USER_PROFILE_STORAGE_KEY = 'userFinancialProfile';

export interface UserFinancialProfile {
  grossMonthly?: number;
  netMonthly?: number;
  taxYear?: '2025' | '2026';
  ageGroup?: AgeGroup;
  children?: number;
  ftePercent?: number;
  isMarried?: boolean;
  inputMode?: 'gross' | 'net';
}
