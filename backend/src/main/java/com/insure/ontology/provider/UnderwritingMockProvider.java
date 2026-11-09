package com.insure.ontology.provider;

import com.insure.ontology.lineage.LineageTraceCollector;
import com.insure.ontology.model.DomainModels.*;
import jakarta.annotation.PostConstruct;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/mock/uw-service")
public class UnderwritingMockProvider {

    private final LineageTraceCollector lineageCollector;
    private final ProductMockProvider productProvider;
    private final RiskMockProvider riskProvider;

    private final Map<String, UnderwritingRule> ruleStore = new LinkedHashMap<>();
    private final Map<String, UnderwritingCase> caseStore = new LinkedHashMap<>();
    private final AtomicInteger simSequence = new AtomicInteger(2005);

    public UnderwritingMockProvider(
            LineageTraceCollector lineageCollector,
            ProductMockProvider productProvider,
            RiskMockProvider riskProvider
    ) {
        this.lineageCollector = lineageCollector;
        this.productProvider = productProvider;
        this.riskProvider = riskProvider;
    }

    @PostConstruct
    public void initUnderwritingData() {
        UnderwritingRule r1 = new UnderwritingRule(
                "RULE-UW-01",
                "UW-THY-EXCL-01",
                "갑상선 결절 보유자 갑상선암/내분비 특정부위 부담보 준칙",
                "CANCER",
                "riskFactor == 'D34_THYROID_NODULE' && productTrack == 'STANDARD'",
                "COVERAGE_EXCLUSION",
                "갑상선 양성결절 추적관찰 중인 경우 일반암 주계약은 표준 승낙하되 갑상선 부위 2년 부담보(보장제외) 조건부 인수"
        );
        UnderwritingRule r2 = new UnderwritingRule(
                "RULE-UW-02",
                "UW-CARDIO-LOAD-02",
                "고혈압+당뇨 복합 만성질환자 표준형 심혈관·내분비 할증 심사규칙",
                "CARDIOVASCULAR",
                "riskFactor IN ['I10_HYPERTENSION', 'E11_DIABETES'] && productTrack == 'STANDARD'",
                "PREMIUM_LOADING",
                "고혈압과 제2형 당뇨병 동반 투약 시 표준형 종합건강보험은 위험률 할증(35%~45%) 및 합병증 담보 감액 조건 적용"
        );
        UnderwritingRule r3 = new UnderwritingRule(
                "RULE-UW-03",
                "UW-SIMP-325-PASS",
                "3·2·5 간편심사 트랙 만성질환(고혈압·당뇨) 무할증 자동승낙 규칙",
                "ENDOCRINE",
                "productTrack == 'SIMPLIFIED_325' && recentHospitalization == false",
                "ACCEPT",
                "간편심사(3·2·5) 상품은 최근 3개월 입원/수술 권유 및 2년 내 입원력이 없으면 고혈압·당뇨 투약 중이라도 무부담보 자동승낙(STP)"
        );
        UnderwritingRule r4 = new UnderwritingRule(
                "RULE-UW-04",
                "UW-OCC-GRADE3-LIMIT",
                "상해직업급수 3급 고위험 현장직 상해담보 가입한도 제한 및 할증 규칙",
                "OCCUPATIONAL",
                "occupationGrade == 3 && coverageCategory == 'OCCUPATIONAL'",
                "BENEFIT_LIMIT",
                "건설·고소작업 등 상해직업급수 3급 피보험자는 일반상해 사망·후유장해 한도를 5,000만원으로 제한하고 직업위험 할증 25% 부과"
        );
        UnderwritingRule r5 = new UnderwritingRule(
                "RULE-UW-05",
                "UW-CORONARY-DECLINE",
                "최근 5년 내 관상동맥 중재술(스텐트/협심증) 이력자 표준형 인수거절 규칙",
                "CARDIOVASCULAR",
                "riskFactor == 'I20_ANGINA_HISTORY' && productTrack == 'STANDARD'",
                "DECLINE",
                "최근 5년 이내 협심증·심근경색 관상동맥 스텐트 시술 이력자는 표준형 건강보험 인수 불가(유병자 간편보험 대안 안내)"
        );

        for (UnderwritingRule r : List.of(r1, r2, r3, r4, r5)) {
            ruleStore.put(r.ruleId(), r);
        }

        UnderwritingCase c1 = new UnderwritingCase(
                "UW-CASE-2026-001",
                "2026-11-05",
                "DIRECT_CM",
                "CONDITIONAL_OFFER",
                "PROD-HLT-001",
                "APPL-1001",
                List.of("RULE-UW-01"),
                new UnderwritingDecision(
                        "DEC-2026-001",
                        "CONDITIONAL_EXCLUSION",
                        89000,
                        0,
                        0.0,
                        List.of("갑상선 및 부갑상선(C73, D34) 2년간 특정부위 부담보"),
                        "피보험자 김민준(34세, 1급): 종합위험점수 18점(PREFERRED). 갑상선 양성결절 이력에 대해 RULE-UW-01을 적용하여 갑상선 2년 부담보 조건으로 무할증 자동승낙(STP).",
                        true
                )
        );

        UnderwritingCase c2 = new UnderwritingCase(
                "UW-CASE-2026-002",
                "2026-11-06",
                "GA_AGENCY",
                "CONDITIONAL_OFFER",
                "PROD-HLT-001",
                "APPL-1002",
                List.of("RULE-UW-02"),
                new UnderwritingDecision(
                        "DEC-2026-002",
                        "SUBSTANDARD_LOADING",
                        126380,
                        37380,
                        42.0,
                        List.of("혈관성 신장합병증 3년간 50% 감액 부담보"),
                        "피보험자 박서연(52세, 1급): 고혈압(I10)+당뇨(E11) 복합 위험요소 보유(위험점수 68점). 표준형 상품 가입 시 위험할증률 42.0%(+37,380원) 및 내분비 합병증 조건부 승낙 제시.",
                        false
                )
        );

        UnderwritingCase c3 = new UnderwritingCase(
                "UW-CASE-2026-003",
                "2026-11-07",
                "EXCLUSIVE_AGENT",
                "AUTO_APPROVED",
                "PROD-SIMP-002",
                "APPL-1002",
                List.of("RULE-UW-03"),
                new UnderwritingDecision(
                        "DEC-2026-003",
                        "STANDARD_ACCEPT",
                        114000,
                        0,
                        0.0,
                        List.of(),
                        "피보험자 박서연(52세): 3·2·5 간편심사 건강보험 트랙(RULE-UW-03) 적용으로 고혈압·당뇨 투약 중임에도 부담보 및 추가 할증 없이 즉시 무인 자동승낙(STP).",
                        true
                )
        );

        UnderwritingCase c4 = new UnderwritingCase(
                "UW-CASE-2026-004",
                "2026-11-08",
                "GA_AGENCY",
                "CONDITIONAL_OFFER",
                "PROD-DRV-003",
                "APPL-1003",
                List.of("RULE-UW-04"),
                new UnderwritingDecision(
                        "DEC-2026-004",
                        "SUBSTANDARD_LOADING",
                        54600,
                        12600,
                        30.0,
                        List.of("고소작업(10m 이상) 중 발생한 단독 추락상해 사망한도 5,000만원 제한"),
                        "피보험자 이태호(46세, 직업급수 3급): 고위험 현장직(RULE-UW-04) 및 신호위반 사고력 반영하여 상해·운전자 보험료 30% 할증(+12,600원) 및 고소작업 한도 조건부 승낙.",
                        false
                )
        );

        UnderwritingCase c5 = new UnderwritingCase(
                "UW-CASE-2026-005",
                "2026-11-08",
                "BANCASSURANCE",
                "DECLINED",
                "PROD-HLT-001",
                "APPL-1004",
                List.of("RULE-UW-05", "RULE-UW-02"),
                new UnderwritingDecision(
                        "DEC-2026-005",
                        "DECLINED",
                        0,
                        0,
                        0.0,
                        List.of("표준형 종합건강보험 인수거절 (최근 2년 내 관상동맥 스텐트 시술력 및 고위험 복합질환)"),
                        "피보험자 최영철(61세): 종합위험점수 94점(HIGH_RISK_DECLINE). RULE-UW-05에 의거 표준형 종합건강보험 인수 거절. 'PROD-SIMP-002(3·2·5 유병자 간편보험)' 전환 설계 권고.",
                        true
                )
        );

        for (UnderwritingCase c : List.of(c1, c2, c3, c4, c5)) {
            caseStore.put(c.caseId(), c);
        }
    }

    @GetMapping("/cases")
    public List<UnderwritingCase> getAllCases() {
        lineageCollector.recordStep(
                "Query.underwritingCases",
                "ins:UnderwritingCase",
                "ins:caseId, ins:uwStatus, ins:targetProduct, ins:targetApplicant, ins:decision",
                "Underwriting",
                "underwriting-engine-service",
                "GET",
                "/mock/uw-service/cases",
                List.of("uw_case_no", "appl_dt", "chnl_dv_cd", "uw_stat_cd", "target_prod_id", "target_appl_id", "matched_rule_ids", "decision_obj"),
                16
        );
        return List.copyOf(caseStore.values());
    }

    @GetMapping("/cases/{caseId}")
    public UnderwritingCase getCaseById(@PathVariable String caseId) {
        lineageCollector.recordStep(
                "Query.underwritingCase",
                "ins:UnderwritingCase",
                "ins:caseId, ins:uwStatus, ins:decision",
                "Underwriting",
                "underwriting-engine-service",
                "GET",
                "/mock/uw-service/cases/" + caseId,
                List.of("uw_case_no", "appl_dt", "chnl_dv_cd", "uw_stat_cd", "target_prod_id", "target_appl_id", "matched_rule_ids", "dec_outcome", "fnl_mm_prem"),
                15
        );
        return caseStore.get(caseId);
    }

    @GetMapping("/rules")
    public List<UnderwritingRule> getRules(@RequestParam(required = false) String riskCategory, @RequestParam(defaultValue = "Query.underwritingRules") String fieldPath) {
        lineageCollector.recordStep(
                fieldPath,
                "ins:UnderwritingRule",
                "ins:ruleId, ins:ruleCode, ins:conditionExpression, ins:actionType",
                "Underwriting",
                "underwriting-engine-service",
                "GET",
                "/mock/uw-service/rules" + (riskCategory != null ? "?riskCategory=" + riskCategory : ""),
                List.of("rule_id", "rule_cd", "rule_nm", "tgt_risk_cat", "cond_expr", "act_type"),
                11
        );
        return ruleStore.values().stream()
                .filter(r -> riskCategory == null || riskCategory.isBlank() || r.targetRiskCategory().equalsIgnoreCase(riskCategory))
                .toList();
    }

    public List<UnderwritingRule> getRulesByIds(List<String> ruleIds, String fieldPath) {
        lineageCollector.recordStep(
                fieldPath,
                "ins:UnderwritingRule",
                "ins:matchedRules -> ins:UnderwritingRule",
                "Underwriting",
                "underwriting-engine-service",
                "GET",
                "/mock/uw-service/rules?ids=" + String.join(",", ruleIds),
                List.of("rule_id", "rule_cd", "rule_nm", "cond_expr", "act_type", "rule_desc"),
                9
        );
        return ruleIds.stream()
                .map(ruleStore::get)
                .filter(r -> r != null)
                .toList();
    }

    @PostMapping("/simulate")
    public UnderwritingCase simulateCase(@RequestBody UnderwritingSimulationInput input) {
        int seq = simSequence.incrementAndGet();
        String caseId = "UW-SIM-" + seq;
        String applicantId = "APPL-SIM-" + seq;

        InsuranceProduct product = productProvider.getProductById(input.productId(), "Mutation.simulateUnderwriting.targetProduct");
        if (product == null) {
            product = productProvider.getAllProducts(null).get(0);
        }

        ApplicantProfile applicant = riskProvider.evaluateSimulatedApplicant(
                applicantId,
                input.applicantName(),
                input.age(),
                input.gender(),
                input.occupationName(),
                input.occupationGrade(),
                input.isSmoker(),
                input.bmi(),
                input.riskFactorCodes()
        );

        List<String> matchedRuleIds = new ArrayList<>();
        List<String> exclusions = new ArrayList<>();
        List<String> codes = input.riskFactorCodes() != null ? input.riskFactorCodes() : List.of();

        boolean isSimplified = "SIMPLIFIED_325".equalsIgnoreCase(product.underwritingTrack());
        boolean hasAngina = codes.contains("I20_ANGINA_HISTORY");
        boolean hasHypertension = codes.contains("I10_HYPERTENSION");
        boolean hasDiabetes = codes.contains("E11_DIABETES");
        boolean hasThyroid = codes.contains("D34_THYROID_NODULE");
        boolean hasHighAltOcc = codes.contains("OCC_HIGH_ALTITUDE") || input.occupationGrade() == 3;

        String uwStatus;
        String decisionOutcome;
        double loadingPct = 0.0;
        boolean autoStp = true;

        if (hasAngina && !isSimplified) {
            matchedRuleIds.add("RULE-UW-05");
            uwStatus = "DECLINED";
            decisionOutcome = "DECLINED";
            exclusions.add("표준형 건강보험 인수거절: 관상동맥 중재술(협심증) 이력 (3·2·5 간편심사 상품으로 재설계 권장)");
        } else if (isSimplified) {
            matchedRuleIds.add("RULE-UW-03");
            if (hasAngina) {
                uwStatus = "CONDITIONAL_OFFER";
                decisionOutcome = "SUBSTANDARD_LOADING";
                loadingPct = 20.0;
                autoStp = false;
                exclusions.add("허혈성심장질환 2년간 50% 감액 조건 적용");
            } else {
                uwStatus = "AUTO_APPROVED";
                decisionOutcome = "STANDARD_ACCEPT";
                loadingPct = 0.0;
            }
        } else {
            if (hasThyroid) {
                matchedRuleIds.add("RULE-UW-01");
                exclusions.add("갑상선 및 내분비계(C73, D34) 2년간 특정부위 부담보");
            }
            if (hasHypertension || hasDiabetes) {
                matchedRuleIds.add("RULE-UW-02");
                loadingPct += (hasHypertension && hasDiabetes) ? 40.0 : 22.0;
                if (hasDiabetes) {
                    exclusions.add("당뇨성 신장·망막 합병증 2년간 부담보");
                }
            }
            if (hasHighAltOcc) {
                matchedRuleIds.add("RULE-UW-04");
                loadingPct += 25.0;
                exclusions.add("고위험 작업 중 추락·상해 사망 가입한도 5,000만원 제한");
            }

            if (loadingPct > 0 && !exclusions.isEmpty()) {
                uwStatus = "CONDITIONAL_OFFER";
                decisionOutcome = "SUBSTANDARD_LOADING";
                autoStp = false;
            } else if (!exclusions.isEmpty()) {
                uwStatus = "CONDITIONAL_OFFER";
                decisionOutcome = "CONDITIONAL_EXCLUSION";
                autoStp = true;
            } else if (loadingPct > 0) {
                uwStatus = "CONDITIONAL_OFFER";
                decisionOutcome = "SUBSTANDARD_LOADING";
                autoStp = true;
            } else {
                uwStatus = "AUTO_APPROVED";
                decisionOutcome = "STANDARD_ACCEPT";
                autoStp = true;
            }
        }

        if (matchedRuleIds.isEmpty()) {
            matchedRuleIds.add("RULE-UW-03");
        }

        int basePrem = product.baseMonthlyPremium();
        int surcharge = "DECLINED".equals(decisionOutcome) ? 0 : (int) Math.round(basePrem * (loadingPct / 100.0));
        int finalPrem = "DECLINED".equals(decisionOutcome) ? 0 : basePrem + surcharge;

        String comment = String.format(
                "[실시간 온톨로지 심사 시뮬레이션] 피보험자 %s(%d세, %d급) → 상품 '%s'(%s 트랙) 심사 결과: 종합위험점수 %d점(%s), 적용규칙 %s, 판정=%s (최종보험료 %,d원, 할증 %.1f%%)",
                applicant.applicantName(),
                applicant.age(),
                applicant.occupationGrade(),
                product.productName(),
                product.underwritingTrack(),
                applicant.riskAssessment().totalRiskScore(),
                applicant.riskAssessment().riskGrade(),
                String.join(", ", matchedRuleIds),
                decisionOutcome,
                finalPrem,
                loadingPct
        );

        UnderwritingDecision decision = new UnderwritingDecision(
                "DEC-SIM-" + seq,
                decisionOutcome,
                finalPrem,
                surcharge,
                loadingPct,
                exclusions,
                comment,
                autoStp
        );

        UnderwritingCase uwCase = new UnderwritingCase(
                caseId,
                LocalDate.now().toString(),
                "ONTOLOGY_SIMULATOR",
                uwStatus,
                product.productId(),
                applicant.applicantId(),
                matchedRuleIds,
                decision
        );

        caseStore.put(caseId, uwCase);

        lineageCollector.recordStep(
                "Mutation.simulateUnderwriting",
                "ins:UnderwritingCase",
                "ins:matchedRules, ins:decision -> ins:UnderwritingDecision",
                "Underwriting",
                "underwriting-engine-service",
                "POST",
                "/mock/uw-service/simulate",
                List.of("uw_case_no", "uw_stat_cd", "matched_rule_ids", "dec_outcome", "fnl_mm_prem", "surchg_amt", "excl_clauses"),
                24
        );

        return uwCase;
    }
}
