export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export function formatManwon(manwon: number): string {
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const rem = manwon % 10000;
    return rem > 0 ? `${eok}억 ${new Intl.NumberFormat('ko-KR').format(rem)}만원` : `${eok}억원`;
  }
  return new Intl.NumberFormat('ko-KR').format(manwon) + '만원';
}

export const PRODUCT_CATEGORY_META: Record<
  string,
  { label: string; badgeClass: string; shortDesc: string }
> = {
  COMPREHENSIVE_HEALTH: {
    label: '종합건강보험',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    shortDesc: '암·뇌·심장 3대 질병 및 합병증 표준 종합보장',
  },
  SIMPLIFIED_ISSUE: {
    label: '3·2·5 유병자 간편',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    shortDesc: '만성질환(고혈압·당뇨) 투약자도 가입 가능한 간편심사 트랙',
  },
  DRIVER_ACCIDENT: {
    label: '상해·운전자보험',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    shortDesc: '일반상해 사망·후유장해 및 운전자 형사합의금 보장',
  },
};

export const UW_TRACK_META: Record<string, { label: string; badgeClass: string }> = {
  STANDARD: {
    label: '표준심사 (Standard)',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  SIMPLIFIED_325: {
    label: '3·2·5 간편심사 (Simplified)',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-300',
  },
  GUARANTEED: {
    label: '무심사 (Guaranteed)',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-300',
  },
};

export const RISK_CATEGORY_META: Record<string, { label: string; colorClass: string }> = {
  CARDIOVASCULAR: {
    label: '심뇌혈관 (Cardiovascular)',
    colorClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  ENDOCRINE: {
    label: '내분비·대사 (Endocrine)',
    colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  CANCER: {
    label: '종양·암 (Cancer)',
    colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  OCCUPATIONAL: {
    label: '직업·상해 (Occupational)',
    colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  DRIVING: {
    label: '운전·교통 (Driving)',
    colorClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
};

export const RISK_GRADE_META: Record<
  string,
  { label: string; badgeClass: string; barColor: string }
> = {
  PREFERRED: {
    label: '우량체 (PREFERRED)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    barColor: 'bg-emerald-500',
  },
  STANDARD: {
    label: '표준체 (STANDARD)',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    barColor: 'bg-blue-500',
  },
  SUBSTANDARD_A: {
    label: '경증 표준하체 (SUBSTANDARD A)',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    barColor: 'bg-amber-500',
  },
  SUBSTANDARD_B: {
    label: '중등도 표준하체 (SUBSTANDARD B)',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    barColor: 'bg-orange-500',
  },
  HIGH_RISK_DECLINE: {
    label: '고위험 인수제한 (HIGH RISK)',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    barColor: 'bg-rose-600',
  },
};

export const DECISION_OUTCOME_META: Record<
  string,
  {
    label: string;
    subtitle: string;
    cardBg: string;
    badgeClass: string;
    accentText: string;
  }
> = {
  STANDARD_ACCEPT: {
    label: '표준 승낙 (무할증·무부담보)',
    subtitle: '추가 할증이나 보장 제한 없이 표준 조건으로 즉시 청약 가능합니다.',
    cardBg: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300',
    badgeClass: 'bg-emerald-600 text-white',
    accentText: 'text-emerald-800',
  },
  CONDITIONAL_EXCLUSION: {
    label: '조건부 승낙 (특정부위 부담보)',
    subtitle: '보험료 할증은 없으나 특정 질병/부위에 대한 일정 기간 부담보 조건이 적용됩니다.',
    cardBg: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300',
    badgeClass: 'bg-blue-600 text-white',
    accentText: 'text-blue-800',
  },
  SUBSTANDARD_LOADING: {
    label: '조건부 승낙 (위험보험료 할증)',
    subtitle: '보유 위험요소에 따른 위험할증 보험료 및 일부 보장 조건 조정 후 청약 가능합니다.',
    cardBg: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300',
    badgeClass: 'bg-amber-600 text-white',
    accentText: 'text-amber-900',
  },
  DECLINED: {
    label: '인수 거절 (해당 상품 청약 불가)',
    subtitle: '현재 선택한 상품의 인수 기준을 초과하였습니다. 대안 상품(간편심사) 전환을 권장합니다.',
    cardBg: 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300',
    badgeClass: 'bg-rose-600 text-white',
    accentText: 'text-rose-900',
  },
};
