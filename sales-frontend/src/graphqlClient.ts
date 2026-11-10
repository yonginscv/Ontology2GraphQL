import {
  ApplicantProfile,
  GraphQLExecutionLog,
  InsuranceProduct,
  LineageStep,
  RiskFactor,
  UnderwritingCase,
  UnderwritingRule,
  UnderwritingSimulationInput,
} from './types';

// ============================================================================
// GraphQL Queries & Mutations strictly matching backend/src/main/resources/schema.graphql
// ============================================================================

export const GET_SALES_WORKBENCH_QUERY = `query GetSalesWorkbenchData {
  insuranceProducts {
    productId
    productCode
    productName
    productCategory
    baseMonthlyPremium
    maxEligibleAge
    underwritingTrack
    hasCoverage {
      coverageId
      coverageCode
      coverageName
      isMandatory
      maxInsuredAmount
      sensitiveRiskCategory
      hasBenefit {
        benefitId
        triggerEvent
        payoutAmount
        waitingPeriodDays
        reductionPeriodMonths
      }
    }
  }
  applicantProfiles {
    applicantId
    applicantName
    age
    gender
    occupationName
    occupationGrade
    isSmoker
    bmi
    hasRiskFactor {
      riskFactorId
      factorCode
      factorName
      riskCategory
      severityLevel
      riskScoreContribution
      clinicalNote
    }
    riskAssessment {
      assessmentId
      totalRiskScore
      riskGrade
      mortalityLoadingRatio
      scoringModelVersion
    }
  }
  underwritingRules {
    ruleId
    ruleCode
    ruleName
    targetRiskCategory
    conditionExpression
    actionType
    ruleDescription
  }
  underwritingCases {
    caseId
    applicationDate
    channelType
    uwStatus
    targetProduct {
      productId
      productCode
      productName
      productCategory
      baseMonthlyPremium
      maxEligibleAge
      underwritingTrack
      hasCoverage {
        coverageId
        coverageCode
        coverageName
        isMandatory
        maxInsuredAmount
        sensitiveRiskCategory
        hasBenefit {
          benefitId
          triggerEvent
          payoutAmount
          waitingPeriodDays
          reductionPeriodMonths
        }
      }
    }
    targetApplicant {
      applicantId
      applicantName
      age
      gender
      occupationName
      occupationGrade
      isSmoker
      bmi
      hasRiskFactor {
        riskFactorId
        factorCode
        factorName
        riskCategory
        severityLevel
        riskScoreContribution
        clinicalNote
      }
      riskAssessment {
        assessmentId
        totalRiskScore
        riskGrade
        mortalityLoadingRatio
        scoringModelVersion
      }
    }
    matchedRules {
      ruleId
      ruleCode
      ruleName
      targetRiskCategory
      conditionExpression
      actionType
      ruleDescription
    }
    decision {
      decisionId
      decisionOutcome
      finalMonthlyPremium
      surchargeAmount
      loadingPercentage
      exclusionClauses
      underwriterComment
      automatedDecision
    }
  }
}`;

export const SIMULATE_UNDERWRITING_MUTATION = `mutation SimulateUnderwritingForSales($input: UnderwritingSimulationInput!) {
  simulateUnderwriting(input: $input) {
    caseId
    applicationDate
    channelType
    uwStatus
    targetProduct {
      productId
      productCode
      productName
      productCategory
      baseMonthlyPremium
      maxEligibleAge
      underwritingTrack
      hasCoverage {
        coverageId
        coverageCode
        coverageName
        isMandatory
        maxInsuredAmount
        sensitiveRiskCategory
        hasBenefit {
          benefitId
          triggerEvent
          payoutAmount
          waitingPeriodDays
          reductionPeriodMonths
        }
      }
    }
    targetApplicant {
      applicantId
      applicantName
      age
      gender
      occupationName
      occupationGrade
      isSmoker
      bmi
      hasRiskFactor {
        riskFactorId
        factorCode
        factorName
        riskCategory
        severityLevel
        riskScoreContribution
        clinicalNote
      }
      riskAssessment {
        assessmentId
        totalRiskScore
        riskGrade
        mortalityLoadingRatio
        scoringModelVersion
      }
    }
    matchedRules {
      ruleId
      ruleCode
      ruleName
      targetRiskCategory
      conditionExpression
      actionType
      ruleDescription
    }
    decision {
      decisionId
      decisionOutcome
      finalMonthlyPremium
      surchargeAmount
      loadingPercentage
      exclusionClauses
      underwriterComment
      automatedDecision
    }
  }
}`;

export const RISK_FACTOR_MASTER_CATALOG: RiskFactor[] = [
  {
    riskFactorId: 'RF-MED-101',
    factorCode: 'I10_HYPERTENSION',
    factorName: '본태성 고혈압 (혈압강하제 복용 3년차)',
    riskCategory: 'CARDIOVASCULAR',
    severityLevel: 'MODERATE',
    riskScoreContribution: 28,
    clinicalNote: '수축기 138 / 이완기 88mmHg로 투약 관리 중이며 최근 1년 내 입원력 없음',
  },
  {
    riskFactorId: 'RF-MED-102',
    factorCode: 'E11_DIABETES',
    factorName: '제2형 당뇨병 (경구혈당강하제 복용, HbA1c 7.4%)',
    riskCategory: 'ENDOCRINE',
    severityLevel: 'HIGH',
    riskScoreContribution: 36,
    clinicalNote: '당화혈색소 7.4% 수준으로 미세혈관 합병증 여부에 대한 정밀 심사 필요',
  },
  {
    riskFactorId: 'RF-MED-103',
    factorCode: 'D34_THYROID_NODULE',
    factorName: '갑상선 양성결절 (0.6cm 추적관찰 중)',
    riskCategory: 'CANCER',
    severityLevel: 'LOW',
    riskScoreContribution: 14,
    clinicalNote: '세침흡인검사(FNA) 결과 양성 판정, 최근 6개월 크기 변화 없음',
  },
  {
    riskFactorId: 'RF-OCC-201',
    factorCode: 'OCC_HIGH_ALTITUDE',
    factorName: '고소작업 건설현장 시공기사 (상해직업급수 3급)',
    riskCategory: 'OCCUPATIONAL',
    severityLevel: 'HIGH',
    riskScoreContribution: 32,
    clinicalNote: '추락 및 중장비 작업 상해 위험도 높음 (직업급수 3급 적용)',
  },
  {
    riskFactorId: 'RF-DRV-301',
    factorCode: 'DRV_SIGNAL_VIOLATION',
    factorName: '최근 2년 내 신호위반 경미 접촉사고 1건',
    riskCategory: 'DRIVING',
    severityLevel: 'MODERATE',
    riskScoreContribution: 22,
    clinicalNote: '자동차보험 할증등급 12Z, 중대법규위반 사고 이력 1회 존재',
  },
  {
    riskFactorId: 'RF-MED-109',
    factorCode: 'I20_ANGINA_HISTORY',
    factorName: '불안정 협심증 관상동맥 스텐트 시술력 (2년 전)',
    riskCategory: 'CARDIOVASCULAR',
    severityLevel: 'CRITICAL',
    riskScoreContribution: 55,
    clinicalNote: '최근 2년 내 관상동맥중재술(PCI) 시행 이력으로 표준형 심혈관 담보 인수 제한 대상',
  },
];

export interface GraphQLResult<T> {
  data: T;
  lineageSteps: LineageStep[];
  log: GraphQLExecutionLog;
}

export async function executeGraphQL<T>(
  operationName: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<GraphQLResult<T>> {
  const start = performance.now();
  const res = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL HTTP Error: ${res.status}`);
  }

  const json = await res.json();
  const durationMs = Math.round(performance.now() - start);
  const lineageSteps: LineageStep[] = json.extensions?.ontologyLineage || [];

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join(', '));
  }

  return {
    data: json.data as T,
    lineageSteps,
    log: {
      operationName,
      query,
      variables,
      response: json,
      lineageSteps,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
      durationMs,
    },
  };
}

export interface WorkbenchDataPayload {
  insuranceProducts: InsuranceProduct[];
  applicantProfiles: ApplicantProfile[];
  underwritingRules: UnderwritingRule[];
  underwritingCases: UnderwritingCase[];
}

export async function fetchSalesWorkbenchData(): Promise<GraphQLResult<WorkbenchDataPayload>> {
  return executeGraphQL<WorkbenchDataPayload>(
    'GetSalesWorkbenchData',
    GET_SALES_WORKBENCH_QUERY
  );
}

export async function runUnderwritingSimulation(
  input: UnderwritingSimulationInput
): Promise<GraphQLResult<{ simulateUnderwriting: UnderwritingCase }>> {
  return executeGraphQL<{ simulateUnderwriting: UnderwritingCase }>(
    'SimulateUnderwritingForSales',
    SIMULATE_UNDERWRITING_MUTATION,
    { input }
  );
}
