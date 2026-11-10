// ============================================================================
// GraphQL Domain Models mapped 1:1 from backend/src/main/resources/schema.graphql
// Ontology ID : ins:InsuranceProductUnderwritingOntology (v1.2.0)
// ============================================================================

export interface BenefitCondition {
  benefitId: string;
  triggerEvent: string;
  payoutAmount: number; // 단위: 만원
  waitingPeriodDays: number; // 면책기간(일)
  reductionPeriodMonths: number; // 감액기간(개월)
}

export interface Coverage {
  coverageId: string;
  coverageCode: string;
  coverageName: string;
  isMandatory: boolean;
  maxInsuredAmount: number; // 단위: 만원
  sensitiveRiskCategory: 'CARDIOVASCULAR' | 'ENDOCRINE' | 'OCCUPATIONAL' | 'DRIVING' | 'CANCER' | string;
  hasBenefit: BenefitCondition[];
}

export interface InsuranceProduct {
  productId: string;
  productCode: string;
  productName: string;
  productCategory: 'COMPREHENSIVE_HEALTH' | 'SIMPLIFIED_ISSUE' | 'DRIVER_ACCIDENT' | string;
  baseMonthlyPremium: number; // 단위: 원
  maxEligibleAge: number;
  underwritingTrack: 'STANDARD' | 'SIMPLIFIED_325' | 'GUARANTEED' | string;
  hasCoverage: Coverage[];
}

export interface RiskFactor {
  riskFactorId: string;
  factorCode: string;
  factorName: string;
  riskCategory: 'CARDIOVASCULAR' | 'ENDOCRINE' | 'OCCUPATIONAL' | 'DRIVING' | 'CANCER' | string;
  severityLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
  riskScoreContribution: number;
  clinicalNote?: string | null;
}

export interface RiskAssessment {
  assessmentId: string;
  totalRiskScore: number; // 0 ~ 100
  riskGrade: 'PREFERRED' | 'STANDARD' | 'SUBSTANDARD_A' | 'SUBSTANDARD_B' | 'HIGH_RISK_DECLINE' | string;
  mortalityLoadingRatio: number; // 예: 1.42
  scoringModelVersion: string;
}

export interface ApplicantProfile {
  applicantId: string;
  applicantName: string;
  age: number;
  gender: 'M' | 'F' | string;
  occupationName: string;
  occupationGrade: number; // 1, 2, 3급
  isSmoker: boolean;
  bmi: number;
  hasRiskFactor: RiskFactor[];
  riskAssessment: RiskAssessment;
}

export interface UnderwritingRule {
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  targetRiskCategory: string;
  conditionExpression: string;
  actionType: 'ACCEPT' | 'PREMIUM_LOADING' | 'COVERAGE_EXCLUSION' | 'BENEFIT_LIMIT' | 'DECLINE' | string;
  ruleDescription: string;
}

export interface UnderwritingDecision {
  decisionId: string;
  decisionOutcome: 'STANDARD_ACCEPT' | 'SUBSTANDARD_LOADING' | 'CONDITIONAL_EXCLUSION' | 'DECLINED' | string;
  finalMonthlyPremium: number;
  surchargeAmount: number;
  loadingPercentage: number;
  exclusionClauses: string[];
  underwriterComment: string;
  automatedDecision: boolean;
}

export interface UnderwritingCase {
  caseId: string;
  applicationDate: string;
  channelType: string;
  uwStatus: 'AUTO_APPROVED' | 'CONDITIONAL_OFFER' | 'MANUAL_REVIEW' | 'DECLINED' | string;
  targetProduct: InsuranceProduct;
  targetApplicant: ApplicantProfile;
  matchedRules: UnderwritingRule[];
  decision: UnderwritingDecision;
}

export interface LineageStep {
  stepOrder: number;
  graphqlFieldPath: string;
  ontologyClassUri: string;
  ontologyPropertyUri: string;
  domainName: string;
  sourceService: string;
  httpMethod: string;
  endpointUri: string;
  rawSourceFields: string[];
  latencyMs: number;
  status: string;
}

export interface UnderwritingSimulationInput {
  productId: string;
  applicantName: string;
  age: number;
  gender: string;
  occupationName: string;
  occupationGrade: number;
  isSmoker: boolean;
  bmi: number;
  riskFactorCodes: string[];
}

export interface GraphQLExecutionLog {
  operationName: string;
  query: string;
  variables?: Record<string, unknown>;
  response: unknown;
  lineageSteps: LineageStep[];
  timestamp: string;
  durationMs: number;
}
