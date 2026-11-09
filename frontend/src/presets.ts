export interface QueryPreset {
  id: string;
  title: string;
  badge: string;
  description: string;
  highlightClasses: string[];
  protocol: 'GRAPHQL' | 'REST';
  restEndpoint?: string;
  query: string;
}

export const QUERY_PRESETS: QueryPreset[] = [
  {
    id: 'uw-complex-case-002',
    title: '시나리오 1: 복합 만성질환(고혈압+당뇨) 청약건 3대 도메인 통합 조회',
    badge: '3-Domain Graph Join',
    description:
      '단일 GraphQL 쿼리로 Underwriting Service(심사건/판정/규칙) + Product Service(상품/담보/급부) + Risk Service(청약자/위험요소/위험점수)를 온톨로지 관계(ins:targetProduct, ins:targetApplicant)에 따라 조립합니다.',
    highlightClasses: [
      'UnderwritingCase',
      'InsuranceProduct',
      'Coverage',
      'ApplicantProfile',
      'RiskFactor',
      'RiskAssessment',
      'UnderwritingRule',
      'UnderwritingDecision',
    ],
    protocol: 'GRAPHQL',
    query: `query GetComplexUnderwritingGraph {
  underwritingCase(caseId: "UW-CASE-2026-002") {
    caseId
    applicationDate
    channelType
    uwStatus
    targetProduct {
      productId
      productCode
      productName
      underwritingTrack
      baseMonthlyPremium
      hasCoverage {
        coverageCode
        coverageName
        sensitiveRiskCategory
        maxInsuredAmount
      }
    }
    targetApplicant {
      applicantId
      applicantName
      age
      occupationName
      occupationGrade
      hasRiskFactor {
        factorCode
        factorName
        riskCategory
        severityLevel
        riskScoreContribution
      }
      riskAssessment {
        totalRiskScore
        riskGrade
        mortalityLoadingRatio
      }
    }
    matchedRules {
      ruleCode
      ruleName
      conditionExpression
      actionType
    }
    decision {
      decisionOutcome
      finalMonthlyPremium
      surchargeAmount
      loadingPercentage
      exclusionClauses
      underwriterComment
    }
  }
}`,
  },
  {
    id: 'uw-simplified-vs-standard',
    title: '시나리오 2: 전체 언더라이팅 심사 케이스 비교 (표준형 할증/거절 vs 3·2·5 간편심사 자동승낙)',
    badge: 'Multi-Case Comparison',
    description:
      '동일한 유병자(박서연, 고혈압+당뇨)가 표준형 건강보험(CASE-002)과 3·2·5 간편보험(CASE-003)에 청약했을 때 온톨로지 인수트랙(ins:underwritingTrack)과 심사규칙에 따라 결과가 어떻게 달라지는지 비교합니다.',
    highlightClasses: [
      'UnderwritingCase',
      'InsuranceProduct',
      'ApplicantProfile',
      'RiskAssessment',
      'UnderwritingDecision',
    ],
    protocol: 'GRAPHQL',
    query: `query CompareAllUnderwritingCases {
  underwritingCases {
    caseId
    uwStatus
    targetProduct {
      productName
      underwritingTrack
      baseMonthlyPremium
    }
    targetApplicant {
      applicantName
      age
      occupationGrade
      riskAssessment {
        totalRiskScore
        riskGrade
      }
    }
    decision {
      decisionOutcome
      finalMonthlyPremium
      loadingPercentage
      exclusionClauses
      automatedDecision
    }
  }
}`,
  },
  {
    id: 'product-catalog-deep',
    title: '시나리오 3: 상품 · 담보 · 급부조건(ins:InsuranceProduct → ins:Coverage → ins:BenefitCondition) 계층 탐색',
    badge: 'Product Domain',
    description:
      '상품 카탈로그 마이크로서비스의 3단계 온톨로지 계층(상품 → 담보/특약 → 지급사유/면책·감액 급부조건)과 민감 위험분류(ins:sensitiveRiskCategory)를 조회합니다.',
    highlightClasses: ['InsuranceProduct', 'Coverage', 'BenefitCondition'],
    protocol: 'GRAPHQL',
    query: `query ExploreProductHierarchy {
  insuranceProducts {
    productId
    productCode
    productName
    productCategory
    underwritingTrack
    baseMonthlyPremium
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
}`,
  },
  {
    id: 'hybrid-rest-orchestrated',
    title: '시나리오 4: [Hybrid REST Gateway] 레거시 연동을 위한 REST 오케스트레이션 API 호출',
    badge: 'REST API Gateway',
    description:
      'GraphQL Serving Layer가 레거시 채널/외부 파트너를 위해 REST API(/api/v1/underwriting/cases/UW-CASE-2026-002/orchestrated)로도 동일한 도메인 조합과 Lineage 추적을 제공하는 것을 실증합니다.',
    highlightClasses: ['UnderwritingCase', 'InsuranceProduct', 'ApplicantProfile', 'UnderwritingDecision'],
    protocol: 'REST',
    restEndpoint: '/api/v1/underwriting/cases/UW-CASE-2026-002/orchestrated',
    query: `# Hybrid REST Gateway Endpoint Call
# HTTP Method : GET
# Endpoint    : /api/v1/underwriting/cases/UW-CASE-2026-002/orchestrated
#
# GraphQL과 달리 REST 엔드포인트는 서버에 고정된 전체 필드(Fixed Over-fetching Payload)를 반환하며,
# 동일한 온톨로지 메타데이터 기반 Data Lineage 추적을 제공합니다.`,
  },
];
