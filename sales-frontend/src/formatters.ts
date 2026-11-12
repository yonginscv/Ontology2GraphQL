import { Language } from './i18n';

export function formatKRW(amount: number, lang: Language = 'ko'): string {
  if (lang === 'en') {
    return 'KRW ' + new Intl.NumberFormat('en-US').format(amount);
  }
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export function formatManwon(manwon: number, lang: Language = 'ko'): string {
  if (lang === 'en') {
    // 1 manwon = 10,000 KRW; 100 manwon = 1M KRW
    const millionKRW = manwon / 100;
    if (millionKRW >= 1) {
      return `KRW ${Number.isInteger(millionKRW) ? millionKRW : millionKRW.toFixed(1)}M`;
    }
    return 'KRW ' + new Intl.NumberFormat('en-US').format(manwon * 10000);
  }
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const rem = manwon % 10000;
    return rem > 0 ? `${eok}억 ${new Intl.NumberFormat('ko-KR').format(rem)}만원` : `${eok}억원`;
  }
  return new Intl.NumberFormat('ko-KR').format(manwon) + '만원';
}

export const PRODUCT_CATEGORY_META: Record<
  string,
  {
    label: string;
    enLabel: string;
    badgeClass: string;
    shortDesc: string;
    enShortDesc: string;
  }
> = {
  COMPREHENSIVE_HEALTH: {
    label: '종합건강보험',
    enLabel: 'Comprehensive Health',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    shortDesc: '암·뇌·심장 3대 질병 및 합병증 표준 종합보장',
    enShortDesc: 'Standard comprehensive coverage for Cancer, Brain & Heart diseases and complications',
  },
  SIMPLIFIED_ISSUE: {
    label: '3·2·5 유병자 간편',
    enLabel: '3·2·5 Simplified Issue',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    shortDesc: '만성질환(고혈압·당뇨) 투약자도 가입 가능한 간편심사 트랙',
    enShortDesc: 'Simplified underwriting track eligible for applicants on chronic hypertension/diabetes medication',
  },
  DRIVER_ACCIDENT: {
    label: '상해·운전자보험',
    enLabel: 'Accident & Driver',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    shortDesc: '일반상해 사망·후유장해 및 운전자 형사합의금 보장',
    enShortDesc: 'Coverage for general accidental death/disability and driver criminal settlement subsidies',
  },
};

export const UW_TRACK_META: Record<
  string,
  { label: string; enLabel: string; badgeClass: string }
> = {
  STANDARD: {
    label: '표준심사 (Standard)',
    enLabel: 'Standard Track',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  SIMPLIFIED_325: {
    label: '3·2·5 간편심사 (Simplified)',
    enLabel: '3·2·5 Simplified Track',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-300',
  },
  GUARANTEED: {
    label: '무심사 (Guaranteed)',
    enLabel: 'Guaranteed Issue',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-300',
  },
};

export const RISK_CATEGORY_META: Record<
  string,
  { label: string; enLabel: string; colorClass: string }
> = {
  CARDIOVASCULAR: {
    label: '심뇌혈관 (Cardiovascular)',
    enLabel: 'Cardiovascular',
    colorClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  ENDOCRINE: {
    label: '내분비·대사 (Endocrine)',
    enLabel: 'Endocrine & Metabolic',
    colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  CANCER: {
    label: '종양·암 (Cancer)',
    enLabel: 'Oncology / Cancer',
    colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  OCCUPATIONAL: {
    label: '직업·상해 (Occupational)',
    enLabel: 'Occupational Injury',
    colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  DRIVING: {
    label: '운전·교통 (Driving)',
    enLabel: 'Driving & Traffic',
    colorClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
};

export const RISK_GRADE_META: Record<
  string,
  { label: string; enLabel: string; badgeClass: string; barColor: string }
> = {
  PREFERRED: {
    label: '우량체 (PREFERRED)',
    enLabel: 'Preferred (PREFERRED)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    barColor: 'bg-emerald-500',
  },
  STANDARD: {
    label: '표준체 (STANDARD)',
    enLabel: 'Standard (STANDARD)',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    barColor: 'bg-blue-500',
  },
  SUBSTANDARD_A: {
    label: '경증 표준하체 (SUBSTANDARD A)',
    enLabel: 'Substandard A (Mild)',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    barColor: 'bg-amber-500',
  },
  SUBSTANDARD_B: {
    label: '중등도 표준하체 (SUBSTANDARD B)',
    enLabel: 'Substandard B (Moderate)',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    barColor: 'bg-orange-500',
  },
  HIGH_RISK_DECLINE: {
    label: '고위험 인수제한 (HIGH RISK)',
    enLabel: 'High Risk Decline',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    barColor: 'bg-rose-600',
  },
};

export const DECISION_OUTCOME_META: Record<
  string,
  {
    label: string;
    enLabel: string;
    subtitle: string;
    enSubtitle: string;
    cardBg: string;
    badgeClass: string;
    accentText: string;
  }
> = {
  STANDARD_ACCEPT: {
    label: '표준 승낙 (무할증·무부담보)',
    enLabel: 'Standard Acceptance (No Surcharge / No Exclusion)',
    subtitle: '추가 할증이나 보장 제한 없이 표준 조건으로 즉시 청약 가능합니다.',
    enSubtitle:
      'Eligible for immediate enrollment under standard terms without additional surcharges or coverage exclusions.',
    cardBg: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300',
    badgeClass: 'bg-emerald-600 text-white',
    accentText: 'text-emerald-800',
  },
  CONDITIONAL_EXCLUSION: {
    label: '조건부 승낙 (특정부위 부담보)',
    enLabel: 'Conditional Acceptance (Specific Organ Exclusion)',
    subtitle: '보험료 할증은 없으나 특정 질병/부위에 대한 일정 기간 부담보 조건이 적용됩니다.',
    enSubtitle:
      'No premium surcharge applies, but coverage for designated body parts or conditions is excluded for a specified period.',
    cardBg: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300',
    badgeClass: 'bg-blue-600 text-white',
    accentText: 'text-blue-800',
  },
  SUBSTANDARD_LOADING: {
    label: '조건부 승낙 (위험보험료 할증)',
    enLabel: 'Substandard Acceptance (Risk Premium Loading)',
    subtitle: '보유 위험요소에 따른 위험할증 보험료 및 일부 보장 조건 조정 후 청약 가능합니다.',
    enSubtitle:
      'Eligible for enrollment with risk-adjusted premium loading and modified coverage conditions based on disclosed risk factors.',
    cardBg: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300',
    badgeClass: 'bg-amber-600 text-white',
    accentText: 'text-amber-900',
  },
  DECLINED: {
    label: '인수 거절 (해당 상품 청약 불가)',
    enLabel: 'Declined (Ineligible for Selected Product)',
    subtitle: '현재 선택한 상품의 인수 기준을 초과하였습니다. 대안 상품(간편심사) 전환을 권장합니다.',
    enSubtitle:
      'Exceeds underwriting eligibility limits for the selected product. Switching to an alternative (3·2·5 Simplified Issue) plan is recommended.',
    cardBg: 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300',
    badgeClass: 'bg-rose-600 text-white',
    accentText: 'text-rose-900',
  },
};
