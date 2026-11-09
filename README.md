# Insurance Ontology → GraphQL Schema & Lineage PoC (`Ontology2GraphQLPoC`)

보험사의 핵심 비즈니스 도메인인 **상품(Product) · 언더라이팅/인수심사(Underwriting) · 위험관리(Risk)** 영역을 **JSON-LD / RDFS 표준 온톨로지**로 정의하고, 이로부터 **GraphQL Schema(SDL)**와 시맨틱 디렉티브(`@ontologyClass`, `@ontologyProperty`)를 자동 도출하여 **Spring for GraphQL + Hybrid REST API 게이트웨이**로 서빙하는 실증(PoC) 프로젝트입니다.

---

## 1. 문서 및 요구사항 / 스프린트 계획

- **[PoC 요구사항 정의서 및 스프린트 플랜 (PRD & Sprint Plan)](./docs/poc_requirements_and_sprint_plan.md)**
- **[스프린트 태스크 트래커](./docs/sprint_task_tracker.md)**

---

## 2. 스프린트별 주요 구현 산출물 요약

### Sprint 1: JSON-LD / RDFS 온톨로지 정의 및 GraphQL Schema 자동 도출기
- **온톨로지 스키마**: [`backend/src/main/resources/ontology/insurance-ontology.jsonld`](./backend/src/main/resources/ontology/insurance-ontology.jsonld)
  - **상품(Product)**: `ins:InsuranceProduct`, `ins:Coverage`, `ins:BenefitCondition`
  - **위험(Risk)**: `ins:ApplicantProfile`, `ins:RiskFactor`, `ins:RiskAssessment`
  - **언더라이팅(Underwriting)**: `ins:UnderwritingCase`, `ins:UnderwritingRule`, `ins:UnderwritingDecision`
  - 총 9개 `rdfs:Class`와 46개 `rdf:Property`(`rdfs:domain`, `rdfs:range`, `ins:sourceService`, `ins:sourceField`, `ins:crossServiceJoin`) 정의
- **GraphQL SDL 변환 엔진**: [`OntologyToGraphQLGenerator.java`](./backend/src/main/java/com/insure/ontology/generator/OntologyToGraphQLGenerator.java)
  - JSON-LD/RDFS 그래프를 파싱하여 `@ontologyClass` 및 `@ontologyProperty` 시맨틱 디렉티브가 포함된 GraphQL SDL을 런타임/빌드타임에 자동 도출합니다.

### Sprint 2: 3대 보험 도메인 Mock Providers & 데이터 계보(Lineage) 수집기
- [`ProductMockProvider.java`](./backend/src/main/java/com/insure/ontology/provider/ProductMockProvider.java): 무배당 100세 종합건강보험(표준형), 3·2·5 원패스 유병자 간편건강보험(간편심사), 프로케어 상해·운전자 종합보험 및 담보/급부 카탈로그 제공
- [`RiskMockProvider.java`](./backend/src/main/java/com/insure/ontology/provider/RiskMockProvider.java): 청약자 프로필, 기왕증(고혈압 `I10`, 당뇨 `E11`, 갑상선결절 `D34`, 협심증 스텐트 `I20`), 직업급수(1~3급) 기반 리스크 스코어링 엔진
- [`UnderwritingMockProvider.java`](./backend/src/main/java/com/insure/ontology/provider/UnderwritingMockProvider.java): 인수심사 규칙(`RULE-UW-01` ~ `05`) 매칭 및 표준승낙/할증승낙/특정부위 부담보/인수거절 판정 엔진
- [`LineageTraceCollector.java`](./backend/src/main/java/com/insure/ontology/lineage/LineageTraceCollector.java): 각 필드가 어느 온톨로지 URI에서 유래했고 어떤 Mock 마이크로서비스 엔드포인트와 원천 컬럼(`prod_id`, `tot_risk_scr`, `dec_outcome` 등)을 호출했는지 실시간 계보 수집

### Sprint 3: Spring for GraphQL Serving Layer & Hybrid REST API 게이트웨이
- [`OntologyGraphQLConfig.java`](./backend/src/main/java/com/insure/ontology/graphql/OntologyGraphQLConfig.java) & [`OntologyGraphQLController.java`](./backend/src/main/java/com/insure/ontology/graphql/OntologyGraphQLController.java): 온톨로지에서 도출된 GraphQL 스키마를 `GraphQlSource`로 구동하고, `@SchemaMapping`을 통해 `UnderwritingCase`에서 `Product`, `Risk`, `Underwriting` 3개 도메인 서비스를 단일 그래프로 조립하며 `extensions.ontologyLineage`에 데이터 계보를 주입합니다.
- [`HybridGatewayRestController.java`](./backend/src/main/java/com/insure/ontology/rest/HybridGatewayRestController.java): 레거시 연동을 위한 REST 엔드포인트(`/api/v1/underwriting/cases/{caseId}/orchestrated`, `/api/v1/underwriting/simulate`, `/api/v1/products`) 동시 제공
- [`OntologyToGraphQLIntegrationTest.java`](./backend/src/test/java/com/insure/ontology/OntologyToGraphQLIntegrationTest.java): JUnit 5 & `GraphQlTester` 통합 테스트

### Sprint 4: React 인터랙티브 클라이언트 애플리케이션 (3개 핵심 탭)
- **탭 1 — Ontology ↔ GraphQL ↔ Lineage 3-Pane 비교** ([`OntologyGraphCanvas.tsx`](./frontend/src/components/OntologyGraphCanvas.tsx), [`SchemaAndQueryPane.tsx`](./frontend/src/components/SchemaAndQueryPane.tsx), [`LineageAndResponsePane.tsx`](./frontend/src/components/LineageAndResponsePane.tsx)): 좌측에서 RDFS 클래스 노드를 클릭하면 중앙에 해당 클래스에서 도출된 GraphQL Type/Directive가 하이라이트되고, 쿼리 실행 시 우측에 호출된 마이크로서비스 계보(Lineage)와 JSON 응답이 나란히 표시됩니다.
- **탭 2 — 실시간 언더라이팅 & 리스크 심사 시뮬레이터** ([`UnderwritingSimulatorTab.tsx`](./frontend/src/components/UnderwritingSimulatorTab.tsx)): 청약 상품(표준형 vs 3·2·5 간편형)과 위험요소를 조합해 GraphQL Mutation 또는 Hybrid REST로 실시간 인수심사를 실행하고 판정 결과를 비교합니다.
- **탭 3 — 온톨로지 스키마 진화 실험실** ([`OntologyEvolutionLabTab.tsx`](./frontend/src/components/OntologyEvolutionLabTab.tsx)): JSON-LD 온톨로지에 유전체/웨어러블 위험 속성이나 신규 텔레매틱스 클래스를 원클릭으로 추가하고, 즉시 GraphQL SDL이 자동 확장되는 과정을 실증합니다.

---

## 3. 로컬 실행 방법 (How to Run)

### 3.1 Backend 실행 (Java 17+ / Spring Boot 3.3 / Port `8080`)
```bash
cd backend
mvn spring-boot:run
```
- GraphQL Endpoint: `POST http://localhost:8080/graphql`
- GraphiQL IDE: `http://localhost:8080/graphiql`
- Hybrid REST API:
  - `GET http://localhost:8080/api/v1/ontology/schema`
  - `GET http://localhost:8080/api/v1/products`
  - `GET http://localhost:8080/api/v1/underwriting/cases/UW-CASE-2026-002/orchestrated`
  - `POST http://localhost:8080/api/v1/underwriting/simulate`

### 3.2 Frontend 실행 (Node.js 20+ / React + Vite / Port `5173`)
```bash
cd frontend
npm install
npm run dev
```
- 브라우저에서 `http://localhost:5173` 접속
