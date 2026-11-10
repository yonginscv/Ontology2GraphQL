# `sales-frontend` 개발 사례로 본 온톨로지 기반 GraphQL & AI 활용 분석

본 문서는 [schema.graphql](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/backend/src/main/resources/schema.graphql)을 참조하여 영업사원용 언더라이팅 워크벤치([`sales-frontend/`](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/sales-frontend/src/App.tsx))를 구축한 경험을 바탕으로, **(1) GraphQL 도입 시 애플리케이션 개발의 장점**, **(2) AI 에이전트 활용 시 개발 생산성 극대화 요인**, **(3) 실무 적용 시 한계 및 주의할 점**을 정리한 기술 분석서입니다.

---

## 1. `sales-frontend`에서 GraphQL을 사용했을 때의 애플리케이션 개발 장점

보험 영업사원용 언더라이팅 화면은 **상품(Product)**, **고객 위험(Risk)**, **인수심사(Underwriting)**라는 3개의 서로 다른 도메인 마이크로서비스 데이터를 한 화면에서 유기적으로 조합해야 하는 대표적인 복합 도메인 UI입니다.

### 1.1 다중 마이크로서비스 오케스트레이션 단일화 (No More Client-Side Join)
- **기존 REST 방식의 문제점**:
  영업사원 워크벤치 초기 화면을 렌더링하거나 심사 결과를 조회하려면 프론트엔드가 여러 REST 엔드포인트를 순차/병렬 호출해야 합니다.
  1. `GET /mock/product-service/products` (상품 및 담보 목록)
  2. `GET /mock/risk-service/applicants` (고객 및 기왕증 목록)
  3. `GET /mock/uw-service/rules` (언더라이팅 룰 마스터)
  4. `GET /mock/uw-service/cases` → 각 케이스마다 `productId`, `applicantId`, `matchedRuleIds`로 추가 N회 호출
- **GraphQL 적용 효과**:
  [`GET_SALES_WORKBENCH_QUERY`](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/sales-frontend/src/graphqlClient.ts#L17-L137) 단 1회의 요청(`POST /graphql`)으로 3개 도메인(`InsuranceProduct`, `ApplicantProfile`, `UnderwritingRule`, `UnderwritingCase`)의 중첩 그래프를 한 번에 가져옵니다. 프론트엔드에서 복잡한 `Promise.all` 상태 동기화나 ID 매핑(Join) 로직을 작성할 필요가 없습니다.

### 1.2 깊은 계층 구조(Deep Hierarchy)의 선언적 조회 및 Over/Under-fetching 방지
- 보험 도메인은 본질적으로 계층 구조가 깊습니다:
  - `UnderwritingCase` → `targetProduct`(`InsuranceProduct`) → `hasCoverage`(`Coverage`) → `hasBenefit`(`BenefitCondition`)
  - `UnderwritingCase` → `targetApplicant`(`ApplicantProfile`) → `hasRiskFactor`(`RiskFactor`) & `riskAssessment`(`RiskAssessment`)
- [`SIMULATE_UNDERWRITING_MUTATION`](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/sales-frontend/src/graphqlClient.ts#L139-L216) 실행 시, 심사 요청과 동시에 **판정 결과(`decision`) + 적중된 룰(`matchedRules`) + 재평가된 고객 위험등급(`riskAssessment`) + 대상 상품 담보(`hasCoverage`)**를 단일 응답 트리로 받아 즉시 UI를 갱신할 수 있습니다.
- 화면별로 필요한 필드만 선택(Projection)하므로 모바일 태블릿 환경의 영업사원 앱에서도 네트워크 페이로드를 최적화할 수 있습니다.

### 1.3 강력한 타입 시스템(Strongly Typed Contract)과 프론트엔드 안정성
- [schema.graphql](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/backend/src/main/resources/schema.graphql)의 스칼라 타입 및 Nullability(`!`) 정의가 [`sales-frontend/src/types.ts`](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/sales-frontend/src/types.ts)의 TypeScript 인터페이스와 1:1로 대응됩니다.
- 백엔드 원천 시스템의 축약된 레거시 컬럼명(`prod_cat_cd`, `base_mm_prem`, `tot_risk_scr`, `dec_outcome`)이 온톨로지 기반 GraphQL 스키마를 통해 `productCategory`, `baseMonthlyPremium`, `totalRiskScore`, `decisionOutcome`이라는 명확한 도메인 표준 용어로 추상화되어 프론트엔드 코드의 가독성이 크게 향상됩니다.

### 1.4 데이터 계보(Data Lineage) 및 관측성(Observability) 내장
- GraphQL 응답의 `extensions.ontologyLineage` 필드를 통해, 영업사원 화면에 표시된 보험료 할증률이나 부담보 조건이 **어느 온톨로지 개념(`ins:UnderwritingDecision`)과 어느 백엔드 서비스 엔드포인트에서 도출되었는지** 프론트엔드([`CaseHistoryAndRuleModal.tsx`](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/sales-frontend/src/components/CaseHistoryAndRuleModal.tsx#L186-L220))에서 투명하게 추적할 수 있습니다.

---

## 2. AI를 사용했을 때 더 쉬운 개발이 가능한가? (Why GraphQL + Ontology Amplifies AI Coding)

결론부터 말하면, **일반 REST API나 문서화되지 않은 백엔드 대비 온톨로지 주석이 포함된 GraphQL 스키마(`schema.graphql`)가 주어졌을 때 AI의 코드 생성 정확도와 속도는 극적으로 향상**됩니다. 실제로 이번 `sales-frontend` 역시 `schema.graphql` 파일 하나만을 핵심 참조로 삼아 단시간에 완성되었습니다.

### 2.1 단일 컨텍스트(Single Source of Truth)로 완벽한 전체 구조 파악
- **REST 환경에서의 AI 개발**: AI가 프론트엔드를 만들려면 수십 개의 Controller 파일, DTO 클래스, Swagger/OpenAPI 조각들을 일일이 탐색해야 하며, 엔드포인트 간 외래키 관계(`target_prod_id`가 어느 API와 연결되는지)를 추론하다가 환각(Hallucination)을 일으키기 쉽습니다.
- **GraphQL 환경에서의 AI 개발**: [schema.graphql](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/backend/src/main/resources/schema.graphql) 파일 하나(약 345라인)에 **모든 엔티티, 필드 타입, 도메인 간 관계(Edge), Query/Mutation 시그니처**가 응축되어 있어 LLM의 컨텍스트 윈도우 안에서 단 한 번의 리딩으로 백엔드 전체 데이터 그래프를 100% 정확하게 이해합니다.

### 2.2 시맨틱 디렉티브(`@ontologyClass`, `@ontologyProperty`)와 독스트링의 시너지
- 본 프로젝트의 [schema.graphql](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/backend/src/main/resources/schema.graphql)에는 단순 타입뿐 아니라 온톨로지 메타데이터와 도메인 설명이 풍부하게 포함되어 있습니다:
  ```graphql
  """민감 위험분류 - 해당 담보 인수 시 중점 심사하는 위험 카테고리 (CARDIOVASCULAR, ENDOCRINE, OCCUPATIONAL, DRIVING, CANCER)"""
  sensitiveRiskCategory: String! @ontologyProperty(uri: "ins:sensitiveRiskCategory", label: "민감 위험분류", range: "xsd:string", sourceField: "sens_risk_cat")
  ```
- **비즈니스 로직 자동 도출**: AI는 이 설명을 읽고 별도의 기획서 없이도 다음과 같은 도메인 특화 UI 로직을 스스로 설계·구현할 수 있었습니다:
  - 고객의 `RiskFactor.riskCategory`와 담보의 `Coverage.sensitiveRiskCategory`가 일치할 때 **"고객 고지 위험요소 연동 심사 대상"** 경고 배지를 자동으로 표시 ([`ProductSelectionPanel.tsx`](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/sales-frontend/src/components/ProductSelectionPanel.tsx#L211-L216))
  - `underwritingTrack`이 `STANDARD`인 상품에서 `DECLINED`(인수거절) 또는 `SUBSTANDARD_LOADING`(할증) 판정이 나오면 `SIMPLIFIED_325`(3·2·5 간편심사) 트랙 상품으로 원클릭 전환 재심사를 제안하는 영업사원 가이드 구현 ([`UnderwritingActionAndResultPanel.tsx`](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/sales-frontend/src/components/UnderwritingActionAndResultPanel.tsx#L254-L280))
  - 금액 단위가 `(원)`인지 `(만원)`인지 주석(`최대 가입금액(만원)`, `기본 월보험료(원)`)을 보고 정확한 포매터([`formatKRW`, `formatManwon`](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/sales-frontend/src/formatters.ts#L1-L13))를 자동 적용

### 2.3 무결성 높은 TypeScript 타입 및 GraphQL 쿼리 자동 생성
- AI가 GraphQL SDL로부터 TypeScript 인터페이스([`types.ts`](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/sales-frontend/src/types.ts))와 쿼리문([`graphqlClient.ts`](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/sales-frontend/src/graphqlClient.ts))을 생성할 때 오타나 존재하지 않는 필드를 참조할 확률이 거의 0에 수렴하며, 한 번에 `tsc -b && vite build`를 통과하는 코드를 작성할 수 있습니다.

---

## 3. 한계 및 주의할 점 (Limitations & Caveats)

GraphQL과 AI 기반 개발이 강력한 생산성을 제공하지만, 엔터프라이즈 보험 시스템에 실무 적용할 때는 다음과 같은 한계와 주의점을 반드시 고려해야 합니다.

### 3.1 GraphQL 아키텍처 측면의 주의할 점

1. **N+1 쿼리 문제와 백엔드 부하 (DataLoader 필수)**
   - 프론트엔드 개발자가 편리하다고 해서 깊은 중첩 쿼리(`underwritingCases` → `targetProduct` → `hasCoverage` → `hasBenefit`)를 무분별하게 요청하면, 백엔드 `@SchemaMapping` 리졸버가 건별로 마이크로서비스를 반복 호출하는 **N+1 문제**가 발생합니다.
   - **대응 방안**: Spring for GraphQL의 `@BatchMapping` 또는 `DataLoader`를 적용하여 하위 도메인 호출을 배치(Batch) 처리해야 합니다.

2. **쿼리 복잡도(Query Depth/Complexity) 제한 및 보안**
   - 악의적이거나 잘못 작성된 클라이언트가 지나치게 깊거나 넓은 GraphQL 쿼리를 보내면 게이트웨이 및 하위 마이크로서비스가 과부하에 빠질 수 있습니다.
   - **대응 방안**: `MaxQueryDepthInstrumentation`, `MaxQueryComplexityInstrumentation`을 설정하고, 운영 환경에서는 허용된 쿼리만 실행하는 **Persisted Queries(APQ)** 도입을 권장합니다.

3. **HTTP 캐싱 및 에러 핸들링의 복잡성**
   - 모든 요청이 `POST /graphql` 및 HTTP `200 OK`(부분 실패 시 `errors` 배열 포함)로 반환되므로, 기존 CDN/브라우저 URL 캐싱이나 HTTP 상태 코드 기반의 단순 모니터링이 어렵습니다.
   - **대응 방안**: 클라이언트 측 Normalized Cache(Apollo Client, Relay 등) 또는 필드 단위 로깅/트레이싱(본 PoC의 `LineageTraceCollector` 같은 인터셉터)을 갖추어야 합니다.

### 3.2 AI 활용 개발 측면의 한계 및 주의할 점

1. **스키마에 드러나지 않는 암묵적 비즈니스 규칙(Implicit Rules)의 한계**
   - `schema.graphql`은 데이터 구조와 타입, 요약 설명은 완벽히 제공하지만, **세부적인 보험수리 계산식**(예: 나이·BMI·직업급수별 정확한 가산점 공식이나 복합질환 할증률 산식)은 백엔드 코드([`RiskMockProvider.java`](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/backend/src/main/java/com/insure/ontology/provider/RiskMockProvider.java#L185-L240), [`UnderwritingMockProvider.java`](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/backend/src/main/java/com/insure/ontology/provider/UnderwritingMockProvider.java#L263-L363)) 내부에 존재합니다.
   - **주의점**: 프론트엔드에서 실시간 예상치(Preview)를 계산할 때 AI가 스키마만 보고 임의의 계산식을 추정하면 백엔드 실제 판정과 불일치가 발생할 수 있습니다. 핵심 판정과 보험료 계산은 반드시 서버 Mutation(`simulateUnderwriting`)의 결과를 단일 진실 공급원(SSOT)으로 삼아야 합니다.

2. **String 기반 Enum 값의 드리프트(Drift) 위험**
   - 현재 `schema.graphql`에서 `productCategory`, `riskGrade`, `decisionOutcome` 등이 `String!` 타입과 주석 내 예시 값(`STANDARD_ACCEPT`, `SUBSTANDARD_LOADING` 등)으로 정의되어 있습니다.
   - **주의점**: 백엔드에서 새로운 상태 코드(예: `MANUAL_ESCALATION`)를 추가했을 때 주석을 업데이트하지 않으면 AI가 생성한 프론트엔드 매핑 테이블([`formatters.ts`](file:///Users/kh-mac-mini/workspace/Ontology2GraphQL/sales-frontend/src/formatters.ts))에서 누락될 수 있습니다. 가능한 경우 온톨로지에서 `enum` 타입으로 명시적 도출을 하거나, 프론트엔드에 Fallback UI 처리를 반드시 포함해야 합니다.

3. **규제·컴플라이언스 및 도메인 검증 필수**
   - 보험 청약 및 언더라이팅 UI는 금소법(금융소비자보호법)상 필수 고지 문구, 면책·감액기간 안내, 개인신용정보 동의 절차 등 법적 요건이 엄격합니다.
   - **주의점**: AI는 스키마 기반으로 사용성이 뛰어난 UI를 빠르게 생성해주지만, 법적 효력이 있는 약관 문구나 고지 의무 프로세스의 적법성은 현업 언더라이터 및 준법감시인의 최종 검수를 거쳐야 합니다.
