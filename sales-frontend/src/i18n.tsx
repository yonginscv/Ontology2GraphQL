import React, { createContext, useContext, useEffect, useState } from 'react';
import { UnderwritingCase } from './types';

export type Language = 'ko' | 'en';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'ko',
  setLang: () => {},
  toggleLang: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('ko');

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      lang === 'ko'
        ? 'Smart FP 언더라이팅 워크벤치 — 영업사원용 청약·심사 시스템'
        : 'Smart FP Underwriting Workbench — Insurance Sales & Underwriting System';
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === 'ko' ? 'en' : 'ko'));
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

// ============================================================================
// Domain Data Translation Dictionaries (KO <-> EN)
// ============================================================================

const PRODUCT_NAME_EN: Record<string, string> = {
  'PROD-HLT-001': 'Non-Par Signature 100-Year Comprehensive Health Insurance',
  'PROD-SIMP-002': 'Non-Par 3·2·5 One-Pass Simplified Issue Health Insurance',
  'PROD-DRV-003': 'Non-Par ProCare Personal Accident & Driver Comprehensive Insurance',
};

const COVERAGE_NAME_EN: Record<string, string> = {
  'COV-CANCER-01': 'General Cancer Diagnosis Benefit (Excl. Minor Cancer) — Main Contract',
  'COV-CARDIO-02': 'Cerebrovascular & Ischemic Heart Disease Diagnosis Rider',
  'COV-ENDO-03': 'Diabetic Complications & Chronic Renal Failure Dialysis Rider',
  'COV-SIMP-CARDIO-01': 'Simplified Issue Cerebrovascular & Cardiovascular Combined Diagnosis',
  'COV-SIMP-SURG-02': 'Disease Surgery Class 1–5 Benefit Rider (Simplified)',
  'COV-OCC-INJ-01': 'General Accidental Death & Disability (3–100%) — Main Contract',
  'COV-DRV-LEGAL-02': 'Traffic Accident Settlement Subsidy & Legal Defense Cost Rider',
};

const BENEFIT_TRIGGER_EN: Record<string, string> = {
  'BNF-101': 'First diagnosis of malignant neoplasm (general cancer)',
  'BNF-102': 'Diagnosis of minor/borderline cancer (thyroid or borderline tumor)',
  'BNF-201': 'Diagnosis of cerebrovascular disease incl. hemorrhage & infarction (I60–I69)',
  'BNF-202': 'CABG surgery for ischemic heart disease incl. acute MI (I20–I25)',
  'BNF-301': 'Surgery benefit for diabetic retinopathy or foot ulcer',
  'BNF-302': 'Initiation of hemodialysis for end-stage renal failure',
  'BNF-S201': 'First diagnosis of cerebrovascular disease (Simplified Issue)',
  'BNF-S202': 'First diagnosis of ischemic heart disease (Simplified Issue)',
  'BNF-S301': 'Per-procedure benefit for Class 3–5 open/non-open disease surgery',
  'BNF-D101': 'Accidental death or severe post-injury disability (>=80%)',
  'BNF-D201': 'Actual criminal settlement subsidy for bodily injury while driving',
  'BNF-D202': 'Legal defense attorney fee upon indictment from driving accident',
};

const APPLICANT_NAME_EN: Record<string, string> = {
  'APPL-1001': 'Min-jun Kim',
  'APPL-1002': 'Seo-yeon Park',
  'APPL-1003': 'Tae-ho Lee',
  'APPL-1004': 'Young-chul Choi',
  '정하늘 (신규 가망고객)': 'Ha-neul Jung (New Prospect)',
  '김민준': 'Min-jun Kim',
  '박서연': 'Seo-yeon Park',
  '이태호': 'Tae-ho Lee',
  '최영철': 'Young-chul Choi',
};

const OCCUPATION_NAME_EN: Record<string, string> = {
  'IT 클라우드 아키텍트': 'IT Cloud Architect',
  '약국 개국 약사': 'Licensed Community Pharmacist',
  '철골·교량 현장 시공감리원': 'Structural Steel & Bridge Site Supervisor',
  '개인택시 운수사업자': 'Owner-Operator Taxi Driver',
  '자영업 카페 운영': 'Self-Employed Cafe Owner',
};

const RISK_FACTOR_NAME_EN: Record<string, string> = {
  I10_HYPERTENSION: 'Essential Hypertension (On antihypertensives for 3 yrs)',
  E11_DIABETES: 'Type 2 Diabetes Mellitus (Oral hypoglycemics, HbA1c 7.4%)',
  D34_THYROID_NODULE: 'Benign Thyroid Nodule (0.6cm under follow-up)',
  OCC_HIGH_ALTITUDE: 'High-Altitude Construction Engineer (Occupation Grade 3)',
  DRV_SIGNAL_VIOLATION: '1 Minor Signal-Violation Collision within Last 2 Years',
  I20_ANGINA_HISTORY: 'Unstable Angina & Coronary Stent History (2 yrs ago)',
};

const RISK_CLINICAL_NOTE_EN: Record<string, string> = {
  I10_HYPERTENSION:
    'Controlled at BP 138/88 mmHg on medication; no hospitalization within the past year',
  E11_DIABETES:
    'HbA1c at 7.4%; requires detailed underwriting review for microvascular complications',
  D34_THYROID_NODULE:
    'Confirmed benign via Fine Needle Aspiration (FNA); no size change over the past 6 months',
  OCC_HIGH_ALTITUDE:
    'High occupational injury risk from falls and heavy machinery (Occupation Grade 3 applied)',
  DRV_SIGNAL_VIOLATION:
    'Auto insurance discount/surcharge grade 12Z; 1 statutory violation accident on record',
  I20_ANGINA_HISTORY:
    'History of Percutaneous Coronary Intervention (PCI) within 2 years; ineligible for standard cardiovascular riders',
};

const RULE_NAME_EN: Record<string, string> = {
  'RULE-UW-01': 'Thyroid Nodule Specific Organ Exclusion Rule (Thyroid/Endocrine)',
  'RULE-UW-02': 'Comorbid Hypertension + Diabetes Standard Track Surcharge Rule',
  'RULE-UW-03': '3·2·5 Simplified Track Chronic Disease Auto-Approval (STP) Rule',
  'RULE-UW-04': 'Occupation Grade 3 High-Risk Injury Benefit Limit & Surcharge Rule',
  'RULE-UW-05': 'Coronary Intervention (Stent/Angina within 5 Yrs) Standard Decline Rule',
};

const RULE_DESC_EN: Record<string, string> = {
  'RULE-UW-01':
    'For benign thyroid nodules under observation, approve general cancer main contract as standard with a 2-year thyroid exclusion rider.',
  'RULE-UW-02':
    'For comorbid hypertension and Type 2 diabetes on medication, apply 35%–45% risk surcharge and complication reduction period on standard health plans.',
  'RULE-UW-03':
    'In the 3·2·5 simplified track, automatically approve (STP) without exclusions if no hospitalization/surgery was advised within 3 months or hospitalized within 2 years.',
  'RULE-UW-04':
    'For Occupation Grade 3 (construction/high-altitude), cap general accidental death/disability limit at KRW 50M and apply a 25% occupational risk surcharge.',
  'RULE-UW-05':
    'Applicants with coronary stent/angina procedures within the past 5 years are declined for standard health plans (recommend switching to 3·2·5 simplified issue).',
};

const EXCLUSION_CLAUSE_EN: Record<string, string> = {
  '갑상선 및 부갑상선(C73, D34) 2년간 특정부위 부담보':
    '2-Year Specific Organ Exclusion on Thyroid & Parathyroid Glands (C73, D34)',
  '갑상선 및 내분비계(C73, D34) 2년간 특정부위 부담보':
    '2-Year Specific Organ Exclusion on Thyroid & Endocrine System (C73, D34)',
  '혈관성 신장합병증 3년간 50% 감액 부담보':
    '3-Year 50% Benefit Reduction on Vascular Renal Complications',
  '당뇨성 신장·망막 합병증 2년간 부담보':
    '2-Year Exclusion on Diabetic Renal & Retinal Complications',
  '고소작업(10m 이상) 중 발생한 단독 추락상해 사망한도 5,000만원 제한':
    'Accidental Death Limit Capped at KRW 50M for Solo Falls During High-Altitude Work (>=10m)',
  '고위험 작업 중 추락·상해 사망 가입한도 5,000만원 제한':
    'Accidental Death Limit Capped at KRW 50M for High-Risk Occupational Falls/Injuries',
  '표준형 종합건강보험 인수거절 (최근 2년 내 관상동맥 스텐트 시술력 및 고위험 복합질환)':
    'Declined for Standard Comprehensive Health Insurance (Coronary Stent within 2 Yrs & High-Risk Comorbidities)',
  '표준형 건강보험 인수거절: 관상동맥 중재술(협심증) 이력 (3·2·5 간편심사 상품으로 재설계 권장)':
    'Declined for Standard Health Insurance: Coronary Intervention (Angina) History (Recommend 3·2·5 Simplified Track)',
  '허혈성심장질환 2년간 50% 감액 조건 적용':
    '2-Year 50% Benefit Reduction Applied to Ischemic Heart Disease Coverage',
};

const CASE_COMMENT_EN: Record<string, string> = {
  'UW-CASE-2026-001':
    'Applicant Min-jun Kim (34, Grade 1): Total Risk Score 18 pts (PREFERRED). Applied RULE-UW-01 for benign thyroid nodule; auto-approved (STP) with no surcharge and a 2-year thyroid exclusion.',
  'UW-CASE-2026-002':
    'Applicant Seo-yeon Park (52, Grade 1): Comorbid Hypertension (I10) + Diabetes (E11) (Risk Score 68 pts). Conditional offer on standard plan with 42.0% surcharge (+KRW 37,380) and endocrine complication restriction.',
  'UW-CASE-2026-003':
    'Applicant Seo-yeon Park (52): Applied 3·2·5 Simplified Issue Track (RULE-UW-03). Auto-approved (STP) immediately without exclusions or surcharges despite active hypertension and diabetes medication.',
  'UW-CASE-2026-004':
    'Applicant Tae-ho Lee (46, Grade 3): High-risk field occupation (RULE-UW-04) and signal violation history reflected; conditional offer with 30% surcharge (+KRW 12,600) and high-altitude coverage limit.',
  'UW-CASE-2026-005':
    'Applicant Young-chul Choi (61): Total Risk Score 94 pts (HIGH_RISK_DECLINE). Declined for standard comprehensive health plan per RULE-UW-05. Recommended switching to PROD-SIMP-002 (3·2·5 Simplified Issue).',
};

const ONTOLOGY_NODE_EN: Record<string, { label: string; comment: string }> = {
  'ins:InsuranceProductUnderwritingOntology': {
    label: 'Integrated Insurance Product, Underwriting & Risk Management Ontology',
    comment:
      'Ontology schema defining Product, Risk, and Underwriting domain concepts and microservice lineage metadata based on JSON-LD and RDFS standards',
  },
  'ins:InsuranceProduct': {
    label: 'Insurance Product',
    comment: 'Financial insurance product entity comprising main contract and optional riders offered by the insurer',
  },
  'ins:Coverage': {
    label: 'Coverage / Rider',
    comment: 'Individual coverage unit (mandatory main contract or optional rider) composing an insurance product',
  },
  'ins:BenefitCondition': {
    label: 'Benefit Condition',
    comment: 'Benefit trigger events, payout limits, reduction periods, and waiting periods per coverage',
  },
  'ins:ApplicantProfile': {
    label: 'Applicant Profile',
    comment: 'Insured applicant demographics, occupation grade, and medical/behavioral summary for underwriting',
  },
  'ins:RiskFactor': {
    label: 'Risk Factor',
    comment: 'Medical pre-existing conditions, occupational hazards, and driving/behavioral risk factors held by the applicant',
  },
  'ins:RiskAssessment': {
    label: 'Risk Assessment',
    comment: 'Composite risk score, risk grade, and mortality loading ratio computed by the risk scoring engine',
  },
  'ins:UnderwritingCase': {
    label: 'Underwriting Case',
    comment: 'Root transaction entity initiated when an applicant applies for a specific insurance product',
  },
  'ins:UnderwritingRule': {
    label: 'Underwriting Rule',
    comment: 'Business rule determining acceptance, surcharge, exclusion, or decline for product/coverage and risk combinations',
  },
  'ins:UnderwritingDecision': {
    label: 'Underwriting Decision',
    comment: 'Final underwriting determination (Accept/Loading/Exclusion/Decline) and premium calculation produced by the rule engine and underwriter',
  },
  'ins:productId': { label: 'Product ID', comment: 'Unique identifier of the insurance product' },
  'ins:productCode': { label: 'Product Code', comment: 'Standard product code for policy terms and disclosure' },
  'ins:productName': { label: 'Product Name', comment: 'Official name of the insurance product' },
  'ins:productCategory': {
    label: 'Product Category',
    comment: 'Product line category (COMPREHENSIVE_HEALTH, SIMPLIFIED_ISSUE, DRIVER_ACCIDENT)',
  },
  'ins:baseMonthlyPremium': {
    label: 'Base Monthly Premium (KRW)',
    comment: 'Standard monthly base premium for a standard risk profile',
  },
  'ins:maxEligibleAge': {
    label: 'Max Eligible Age',
    comment: 'Maximum insured age eligible to enroll in the product',
  },
  'ins:underwritingTrack': {
    label: 'Underwriting Track',
    comment: 'Underwriting evaluation track (STANDARD, SIMPLIFIED_325, GUARANTEED)',
  },
  'ins:hasCoverage': {
    label: 'Included Coverages',
    comment: 'List of mandatory main contract and optional rider coverages included in the product',
  },
  'ins:coverageId': { label: 'Coverage ID', comment: 'Unique identifier of the coverage' },
  'ins:coverageCode': { label: 'Coverage Code', comment: 'Standard coverage code' },
  'ins:coverageName': { label: 'Coverage Name', comment: 'Name of the coverage or rider' },
  'ins:isMandatory': {
    label: 'Is Mandatory Main Contract',
    comment: 'Whether the coverage is a mandatory main contract or an optional rider',
  },
  'ins:maxInsuredAmount': {
    label: 'Max Insured Amount (10K KRW)',
    comment: 'Maximum insured limit for the coverage (unit: 10,000 KRW)',
  },
  'ins:sensitiveRiskCategory': {
    label: 'Sensitive Risk Category',
    comment: 'Primary risk category scrutinized during underwriting (CARDIOVASCULAR, ENDOCRINE, OCCUPATIONAL, DRIVING, CANCER)',
  },
  'ins:hasBenefit': {
    label: 'Benefit Conditions',
    comment: 'Detailed benefit payment conditions linked to the coverage',
  },
  'ins:benefitId': { label: 'Benefit ID', comment: 'Unique identifier of the benefit condition' },
  'ins:triggerEvent': {
    label: 'Trigger Event',
    comment: 'Benefit payment trigger event (e.g., confirmed cerebrovascular diagnosis, ischemic heart surgery)',
  },
  'ins:payoutAmount': {
    label: 'Payout Amount (10K KRW)',
    comment: 'Base benefit payout amount upon trigger event occurrence (unit: 10,000 KRW)',
  },
  'ins:waitingPeriodDays': {
    label: 'Waiting Period (Days)',
    comment: 'Waiting period in days before coverage takes effect (e.g., 90 days for cancer)',
  },
  'ins:reductionPeriodMonths': {
    label: 'Reduction Period (Months)',
    comment: 'Initial policy months during which a 50% benefit reduction applies',
  },
  'ins:applicantId': { label: 'Applicant ID', comment: 'Unique identifier of the applicant' },
  'ins:applicantName': { label: 'Applicant Name', comment: 'Full name of the insured applicant' },
  'ins:age': { label: 'Insurance Age', comment: 'Calculated insurance age of the applicant' },
  'ins:gender': { label: 'Gender', comment: 'Applicant gender (M/F)' },
  'ins:occupationName': { label: 'Occupation Name', comment: 'Occupation title based on standard classification' },
  'ins:occupationGrade': {
    label: 'Occupation Injury Grade',
    comment: 'Occupational hazard grade (Grade 1: Non-hazardous office, Grade 2: Moderate field, Grade 3: High-risk construction)',
  },
  'ins:isSmoker': { label: 'Current Smoker', comment: 'Whether the applicant has smoked within the past year' },
  'ins:bmi': { label: 'Body Mass Index (BMI)', comment: 'Physical Body Mass Index' },
  'ins:hasRiskFactor': {
    label: 'Held Risk Factors',
    comment: 'List of medical, occupational, or driving risk factors identified for the applicant',
  },
  'ins:riskAssessment': {
    label: 'Composite Risk Assessment',
    comment: 'Comprehensive risk evaluation result computed by the risk scoring engine',
  },
  'ins:riskFactorId': { label: 'Risk Factor ID', comment: 'Unique identifier of the risk factor' },
  'ins:factorCode': {
    label: 'Risk Factor Code',
    comment: 'KCD disease code or standard risk factor code (e.g., I10_HYPERTENSION, E11_DIABETES)',
  },
  'ins:factorName': { label: 'Risk Factor Name', comment: 'Descriptive name of the risk factor' },
  'ins:riskCategory': {
    label: 'Risk Category',
    comment: 'Risk domain category (CARDIOVASCULAR, ENDOCRINE, OCCUPATIONAL, DRIVING, CANCER)',
  },
  'ins:severityLevel': {
    label: 'Severity Level',
    comment: 'Clinical or occupational severity level (LOW, MODERATE, HIGH, CRITICAL)',
  },
  'ins:riskScoreContribution': {
    label: 'Risk Score Contribution',
    comment: 'Points added to the composite risk score by this risk factor (0–100)',
  },
  'ins:clinicalNote': {
    label: 'Clinical / Disclosure Note',
    comment: 'Summary of pre-contract disclosure and medical checkup/clinical records',
  },
  'ins:assessmentId': { label: 'Assessment ID', comment: 'Unique identifier of the risk assessment result' },
  'ins:totalRiskScore': {
    label: 'Total Risk Score',
    comment: 'Composite risk score combining medical history, occupation, age, and BMI (0–100 pts)',
  },
  'ins:riskGrade': {
    label: 'Risk Grade',
    comment: 'Evaluated risk tier (PREFERRED, STANDARD, SUBSTANDARD_A, SUBSTANDARD_B, HIGH_RISK_DECLINE)',
  },
  'ins:mortalityLoadingRatio': {
    label: 'Mortality Loading Ratio',
    comment: 'Risk loading multiplier relative to standard (1.0) (e.g., 1.35 = 35% loading)',
  },
  'ins:scoringModelVersion': {
    label: 'Scoring Model Version',
    comment: 'Version of the underwriting risk scoring model used',
  },
  'ins:caseId': { label: 'Case ID', comment: 'Unique underwriting case number' },
  'ins:applicationDate': { label: 'Application Date', comment: 'Date of application and underwriting submission' },
  'ins:channelType': {
    label: 'Sales Channel',
    comment: 'Acquisition channel (GA_AGENCY, EXCLUSIVE_AGENT, DIRECT_CM, BANCASSURANCE)',
  },
  'ins:uwStatus': {
    label: 'Underwriting Status',
    comment: 'Processing status (AUTO_APPROVED, CONDITIONAL_OFFER, MANUAL_REVIEW, DECLINED)',
  },
  'ins:targetProduct': {
    label: 'Target Insurance Product',
    comment: 'Reference to the insurance product under review (joined from Product Service)',
  },
  'ins:targetApplicant': {
    label: 'Target Applicant Profile',
    comment: 'Reference to the insured applicant and risk profile (joined from Risk Service)',
  },
  'ins:matchedRules': {
    label: 'Matched Underwriting Rules',
    comment: 'List of underwriting rules triggered during this case evaluation',
  },
  'ins:decision': {
    label: 'Final Underwriting Decision',
    comment: 'Final underwriting determination including surcharge and exclusion conditions',
  },
  'ins:ruleId': { label: 'Rule ID', comment: 'Unique identifier of the underwriting rule' },
  'ins:ruleCode': { label: 'Rule Code', comment: 'Standard underwriting guideline rule code' },
  'ins:ruleName': { label: 'Rule Name', comment: 'Title of the underwriting rule' },
  'ins:targetRiskCategory': {
    label: 'Target Risk Category',
    comment: 'Risk category evaluated by this rule',
  },
  'ins:conditionExpression': {
    label: 'Condition Expression',
    comment: 'Rule trigger expression (e.g., riskFactor == I10_HYPERTENSION && coverage == CARDIOVASCULAR)',
  },
  'ins:actionType': {
    label: 'Decision Action Type',
    comment: 'Action taken when triggered (ACCEPT, PREMIUM_LOADING, COVERAGE_EXCLUSION, BENEFIT_LIMIT, DECLINE)',
  },
  'ins:ruleDescription': {
    label: 'Rule Guideline Description',
    comment: 'Detailed rationale from the underwriting manual',
  },
  'ins:decisionId': { label: 'Decision ID', comment: 'Unique identifier of the underwriting decision' },
  'ins:decisionOutcome': {
    label: 'Decision Outcome',
    comment: 'Final outcome (STANDARD_ACCEPT, SUBSTANDARD_LOADING, CONDITIONAL_EXCLUSION, DECLINED)',
  },
  'ins:finalMonthlyPremium': {
    label: 'Final Monthly Premium (KRW)',
    comment: 'Final monthly premium reflecting loading percentage and coverage adjustments',
  },
  'ins:surchargeAmount': {
    label: 'Risk Surcharge Amount (KRW)',
    comment: 'Additional monthly premium added due to risk loading over base premium',
  },
  'ins:loadingPercentage': {
    label: 'Loading Percentage (%)',
    comment: 'Applied premium surcharge percentage (%)',
  },
  'ins:exclusionClauses': {
    label: 'Exclusion Clauses',
    comment: 'List of specific body parts or diseases excluded from coverage for a designated period',
  },
  'ins:underwriterComment': {
    label: 'Underwriter / AI Comment',
    comment: 'Comprehensive rationale summary for the underwriting decision',
  },
  'ins:automatedDecision': {
    label: 'Automated Decision (STP)',
    comment: 'Whether completed via Straight-Through Processing (STP) by AI/rule engine without manual review',
  },
};

export function translateProductName(
  productId: string,
  fallbackName: string,
  lang: Language
): string {
  if (lang === 'ko') return fallbackName;
  return PRODUCT_NAME_EN[productId] || fallbackName;
}

export function translateCoverageName(
  coverageId: string,
  fallbackName: string,
  lang: Language
): string {
  if (lang === 'ko') return fallbackName;
  return COVERAGE_NAME_EN[coverageId] || fallbackName;
}

export function translateBenefitTrigger(
  benefitId: string,
  fallbackTrigger: string,
  lang: Language
): string {
  if (lang === 'ko') return fallbackTrigger;
  return BENEFIT_TRIGGER_EN[benefitId] || fallbackTrigger;
}

export function translateApplicantName(
  applicantIdOrName: string,
  fallbackName: string,
  lang: Language
): string {
  if (lang === 'ko') return fallbackName;
  return (
    APPLICANT_NAME_EN[applicantIdOrName] ||
    APPLICANT_NAME_EN[fallbackName] ||
    fallbackName
  );
}

export function translateOccupationName(
  fallbackOccupation: string,
  lang: Language
): string {
  if (lang === 'ko') return fallbackOccupation;
  return OCCUPATION_NAME_EN[fallbackOccupation] || fallbackOccupation;
}

export function translateRiskFactorName(
  factorCode: string,
  fallbackName: string,
  lang: Language
): string {
  if (lang === 'ko') return fallbackName;
  return RISK_FACTOR_NAME_EN[factorCode] || fallbackName;
}

export function translateRiskClinicalNote(
  factorCode: string,
  fallbackNote: string | null | undefined,
  lang: Language
): string {
  if (!fallbackNote) return '';
  if (lang === 'ko') return fallbackNote;
  return RISK_CLINICAL_NOTE_EN[factorCode] || fallbackNote;
}

export function translateRuleName(
  ruleId: string,
  fallbackName: string,
  lang: Language
): string {
  if (lang === 'ko') return fallbackName;
  return RULE_NAME_EN[ruleId] || fallbackName;
}

export function translateRuleDescription(
  ruleId: string,
  fallbackDesc: string,
  lang: Language
): string {
  if (lang === 'ko') return fallbackDesc;
  return RULE_DESC_EN[ruleId] || fallbackDesc;
}

export function translateExclusionClause(clause: string, lang: Language): string {
  if (lang === 'ko') return clause;
  return EXCLUSION_CLAUSE_EN[clause] || clause;
}

export function translateUnderwriterComment(
  uwCase: UnderwritingCase,
  lang: Language
): string {
  if (lang === 'ko') return uwCase.decision.underwriterComment;
  if (CASE_COMMENT_EN[uwCase.caseId]) {
    return CASE_COMMENT_EN[uwCase.caseId];
  }

  // Dynamic translation for simulated cases (UW-SIM-*)
  const applName = translateApplicantName(
    uwCase.targetApplicant.applicantId,
    uwCase.targetApplicant.applicantName,
    'en'
  );
  const prodName = translateProductName(
    uwCase.targetProduct.productId,
    uwCase.targetProduct.productName,
    'en'
  );
  const ruleIds = uwCase.matchedRules.map((r) => r.ruleId).join(', ');
  const finalPrem = new Intl.NumberFormat('en-US').format(
    uwCase.decision.finalMonthlyPremium
  );

  return `[Real-time Ontology Underwriting Simulation] Applicant ${applName} (Age ${uwCase.targetApplicant.age}, Grade ${uwCase.targetApplicant.occupationGrade}) → Product '${prodName}' (${uwCase.targetProduct.underwritingTrack} Track): Total Risk Score ${uwCase.targetApplicant.riskAssessment.totalRiskScore} pts (${uwCase.targetApplicant.riskAssessment.riskGrade}), Matched Rules [${ruleIds}], Outcome=${uwCase.decision.decisionOutcome} (Final Premium KRW ${finalPrem}, Loading ${uwCase.decision.loadingPercentage.toFixed(1)}%)`;
}

export function translateOntologyNode(
  uri: string,
  fallbackLabel: string,
  fallbackComment: string,
  lang: Language
): { label: string; comment: string } {
  if (lang === 'ko') {
    return { label: fallbackLabel, comment: fallbackComment };
  }
  const match = ONTOLOGY_NODE_EN[uri];
  return {
    label: match?.label || fallbackLabel,
    comment: match?.comment || fallbackComment,
  };
}
