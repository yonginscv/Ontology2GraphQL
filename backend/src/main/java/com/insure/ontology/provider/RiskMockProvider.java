package com.insure.ontology.provider;

import com.insure.ontology.lineage.LineageTraceCollector;
import com.insure.ontology.model.DomainModels.ApplicantProfile;
import com.insure.ontology.model.DomainModels.RiskAssessment;
import com.insure.ontology.model.DomainModels.RiskFactor;
import jakarta.annotation.PostConstruct;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/mock/risk-service")
public class RiskMockProvider {

    private final LineageTraceCollector lineageCollector;
    private final Map<String, ApplicantProfile> applicantStore = new LinkedHashMap<>();
    private final Map<String, RiskFactor> catalogRiskFactors = new LinkedHashMap<>();

    public RiskMockProvider(LineageTraceCollector lineageCollector) {
        this.lineageCollector = lineageCollector;
    }

    @PostConstruct
    public void initSampleRiskData() {
        RiskFactor rfHypertension = new RiskFactor(
                "RF-MED-101",
                "I10_HYPERTENSION",
                "본태성 고혈압 (혈압강하제 복용 3년차)",
                "CARDIOVASCULAR",
                "MODERATE",
                28,
                "수축기 138 / 이완기 88mmHg로 투약 관리 중이며 최근 1년 내 입원력 없음"
        );
        RiskFactor rfDiabetes = new RiskFactor(
                "RF-MED-102",
                "E11_DIABETES",
                "제2형 당뇨병 (경구혈당강하제 복용, HbA1c 7.4%)",
                "ENDOCRINE",
                "HIGH",
                36,
                "당화혈색소 7.4% 수준으로 미세혈관 합병증 여부에 대한 정밀 심사 필요"
        );
        RiskFactor rfThyroid = new RiskFactor(
                "RF-MED-103",
                "D34_THYROID_NODULE",
                "갑상선 양성결절 (0.6cm 추적관찰 중)",
                "CANCER",
                "LOW",
                14,
                "세침흡인검사(FNA) 결과 양성 판정, 최근 6개월 크기 변화 없음"
        );
        RiskFactor rfHighAltOcc = new RiskFactor(
                "RF-OCC-201",
                "OCC_HIGH_ALTITUDE",
                "고소작업 건설현장 시공기사 (상해직업급수 3급)",
                "OCCUPATIONAL",
                "HIGH",
                32,
                "추락 및 중장비 작업 상해 위험도 높음 (직업급수 3급 적용)"
        );
        RiskFactor rfDrivingHist = new RiskFactor(
                "RF-DRV-301",
                "DRV_SIGNAL_VIOLATION",
                "최근 2년 내 신호위반 경미 접촉사고 1건",
                "DRIVING",
                "MODERATE",
                22,
                "자동차보험 할증등급 12Z, 중대법규위반 사고 이력 1회 존재"
        );
        RiskFactor rfCoronaryHistory = new RiskFactor(
                "RF-MED-109",
                "I20_ANGINA_HISTORY",
                "불안정 협심증 관상동맥 스텐트 시술력 (2년 전)",
                "CARDIOVASCULAR",
                "CRITICAL",
                55,
                "최근 2년 내 관상동맥중재술(PCI) 시행 이력으로 표준형 심혈관 담보 인수 제한 대상"
        );

        for (RiskFactor rf : List.of(rfHypertension, rfDiabetes, rfThyroid, rfHighAltOcc, rfDrivingHist, rfCoronaryHistory)) {
            catalogRiskFactors.put(rf.factorCode(), rf);
        }

        ApplicantProfile a1 = new ApplicantProfile(
                "APPL-1001",
                "김민준",
                34,
                "M",
                "IT 클라우드 아키텍트",
                1,
                false,
                22.8,
                List.of(rfThyroid),
                new RiskAssessment("ASSM-1001", 18, "PREFERRED", 1.0, "RISK-AI-v3.4")
        );

        ApplicantProfile a2 = new ApplicantProfile(
                "APPL-1002",
                "박서연",
                52,
                "F",
                "약국 개국 약사",
                1,
                false,
                25.9,
                List.of(rfHypertension, rfDiabetes),
                new RiskAssessment("ASSM-1002", 68, "SUBSTANDARD_B", 1.42, "RISK-AI-v3.4")
        );

        ApplicantProfile a3 = new ApplicantProfile(
                "APPL-1003",
                "이태호",
                46,
                "M",
                "철골·교량 현장 시공감리원",
                3,
                true,
                27.4,
                List.of(rfHighAltOcc, rfDrivingHist, rfHypertension),
                new RiskAssessment("ASSM-1003", 79, "SUBSTANDARD_B", 1.55, "RISK-AI-v3.4")
        );

        ApplicantProfile a4 = new ApplicantProfile(
                "APPL-1004",
                "최영철",
                61,
                "M",
                "개인택시 운수사업자",
                3,
                true,
                28.6,
                List.of(rfCoronaryHistory, rfDiabetes, rfHypertension),
                new RiskAssessment("ASSM-1004", 94, "HIGH_RISK_DECLINE", 2.15, "RISK-AI-v3.4")
        );

        applicantStore.put(a1.applicantId(), a1);
        applicantStore.put(a2.applicantId(), a2);
        applicantStore.put(a3.applicantId(), a3);
        applicantStore.put(a4.applicantId(), a4);
    }

    @GetMapping("/applicants")
    public List<ApplicantProfile> getAllApplicants() {
        lineageCollector.recordStep(
                "Query.applicantProfiles",
                "ins:ApplicantProfile",
                "ins:applicantId, ins:hasRiskFactor, ins:riskAssessment",
                "Risk",
                "risk-assessment-service",
                "GET",
                "/mock/risk-service/applicants",
                List.of("appl_id", "appl_nm", "ins_age", "occ_grd", "smk_yn", "risk_factors", "tot_risk_scr", "risk_grd_cd"),
                15
        );
        return List.copyOf(applicantStore.values());
    }

    @GetMapping("/applicants/{applicantId}")
    public ApplicantProfile getApplicantById(
            @PathVariable String applicantId,
            @RequestParam(defaultValue = "Query.applicantProfile") String fieldPath
    ) {
        lineageCollector.recordStep(
                fieldPath,
                "ins:ApplicantProfile",
                "ins:targetApplicant -> ins:ApplicantProfile (ins:hasRiskFactor -> ins:RiskFactor, ins:riskAssessment -> ins:RiskAssessment)",
                "Risk",
                "risk-assessment-service",
                "GET",
                "/mock/risk-service/applicants/" + applicantId,
                List.of("appl_id", "appl_nm", "ins_age", "occ_grd", "smk_yn", "bmi_val", "rf_cd", "sev_lvl", "tot_risk_scr", "mort_load_ratio"),
                19
        );
        return applicantStore.get(applicantId);
    }

    public List<RiskFactor> getAvailableRiskFactorsCatalog() {
        return List.copyOf(catalogRiskFactors.values());
    }

    public ApplicantProfile evaluateSimulatedApplicant(
            String applicantId,
            String name,
            int age,
            String gender,
            String occupationName,
            int occupationGrade,
            boolean isSmoker,
            double bmi,
            List<String> riskFactorCodes
    ) {
        List<RiskFactor> factors = new ArrayList<>();
        int score = 0;

        if (age >= 55) score += 12;
        else if (age >= 45) score += 6;

        if (isSmoker) score += 10;
        if (bmi >= 28.0) score += 8;
        else if (bmi >= 25.0) score += 4;

        if (occupationGrade == 3) score += 12;
        else if (occupationGrade == 2) score += 5;

        if (riskFactorCodes != null) {
            for (String code : riskFactorCodes) {
                RiskFactor rf = catalogRiskFactors.get(code);
                if (rf != null) {
                    factors.add(rf);
                    score += rf.riskScoreContribution();
                }
            }
        }

        int totalScore = Math.min(100, Math.max(5, score));
        String riskGrade;
        double loadingRatio;

        if (totalScore <= 25) {
            riskGrade = "PREFERRED";
            loadingRatio = 1.0;
        } else if (totalScore <= 45) {
            riskGrade = "STANDARD";
            loadingRatio = 1.10;
        } else if (totalScore <= 65) {
            riskGrade = "SUBSTANDARD_A";
            loadingRatio = 1.28;
        } else if (totalScore <= 85) {
            riskGrade = "SUBSTANDARD_B";
            loadingRatio = 1.48;
        } else {
            riskGrade = "HIGH_RISK_DECLINE";
            loadingRatio = 2.10;
        }

        RiskAssessment assessment = new RiskAssessment(
                "ASSM-" + applicantId,
                totalScore,
                riskGrade,
                loadingRatio,
                "RISK-AI-v3.4-SIM"
        );

        ApplicantProfile profile = new ApplicantProfile(
                applicantId,
                name,
                age,
                gender,
                occupationName,
                occupationGrade,
                isSmoker,
                bmi,
                factors,
                assessment
        );

        applicantStore.put(applicantId, profile);

        lineageCollector.recordStep(
                "Mutation.simulateUnderwriting.targetApplicant",
                "ins:ApplicantProfile",
                "ins:hasRiskFactor, ins:riskAssessment",
                "Risk",
                "risk-assessment-service",
                "POST",
                "/mock/risk-service/applicants/evaluate",
                List.of("appl_id", "occ_grd", "smk_yn", "rf_cd", "tot_risk_scr", "risk_grd_cd", "mort_load_ratio"),
                21
        );

        return profile;
    }
}
