import { ProfileFieldBinding } from '../utils/merge-profile-defaults.util';
import { UserFinancialProfile } from '../models/user-profile.models';
import { AnnualBonusModel } from '../components/annual-bonus-calculator/annual-bonus.schema';
import { HolidayBonusModel } from '../components/holiday-bonus-calculator/holiday-bonus.schema';
import { SeveranceModel } from '../components/severance-calculator/severance.schema';
import { UnusedLeaveModel } from '../components/unused-leave-calculator/unused-leave.schema';
import { FreelancerModel } from '../components/freelancer-calculator/freelancer.schema';
import { PropertyPurchaseModel } from '../components/property-purchase-calculator/property-purchase.schema';

const childrenToString = (p: UserFinancialProfile) => String(p.children ?? 0);
const taxYearToAnnualBonusYear = (p: UserFinancialProfile) => p.taxYear ?? '2026';
const taxYearToHolidayYear = (p: UserFinancialProfile) =>
  (p.taxYear === '2025' ? 2025 : 2026) as HolidayBonusModel['year'];
const taxYearToUnusedLeave = (p: UserFinancialProfile) => p.taxYear ?? '2026';

export const ANNUAL_BONUS_PROFILE_BINDINGS: ProfileFieldBinding<AnnualBonusModel>[] = [
  { modelKey: 'grossMonthly', profileKey: 'grossMonthly' },
  { modelKey: 'year', profileKey: 'taxYear', toModel: taxYearToAnnualBonusYear },
  { modelKey: 'ageGroup', profileKey: 'ageGroup' },
  { modelKey: 'children', profileKey: 'children', toModel: childrenToString },
];

export const HOLIDAY_BONUS_PROFILE_BINDINGS: ProfileFieldBinding<HolidayBonusModel>[] = [
  { modelKey: 'grossMonthly', profileKey: 'grossMonthly' },
  { modelKey: 'year', profileKey: 'taxYear', toModel: taxYearToHolidayYear },
  { modelKey: 'ageGroup', profileKey: 'ageGroup' },
  { modelKey: 'children', profileKey: 'children' },
];

export const SEVERANCE_PROFILE_BINDINGS: ProfileFieldBinding<SeveranceModel>[] = [
  { modelKey: 'grossMonthly', profileKey: 'grossMonthly' },
];

export const UNUSED_LEAVE_PROFILE_BINDINGS: ProfileFieldBinding<UnusedLeaveModel>[] = [
  { modelKey: 'grossMonthly', profileKey: 'grossMonthly' },
  { modelKey: 'taxYear', profileKey: 'taxYear', toModel: taxYearToUnusedLeave },
  { modelKey: 'ageGroup', profileKey: 'ageGroup' },
  { modelKey: 'children', profileKey: 'children' },
];

export const FREELANCER_PROFILE_BINDINGS: ProfileFieldBinding<FreelancerModel>[] = [
  { modelKey: 'ageGroup', profileKey: 'ageGroup' },
  { modelKey: 'children', profileKey: 'children', toModel: childrenToString },
];

export const PROPERTY_PURCHASE_PROFILE_BINDINGS: ProfileFieldBinding<PropertyPurchaseModel>[] = [
  { modelKey: 'children', profileKey: 'children' },
  { modelKey: 'isMarried', profileKey: 'isMarried' },
];
