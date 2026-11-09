package com.insure.ontology.provider;

import com.insure.ontology.lineage.LineageTraceCollector;
import com.insure.ontology.model.DomainModels.BenefitCondition;
import com.insure.ontology.model.DomainModels.Coverage;
import com.insure.ontology.model.DomainModels.InsuranceProduct;
import jakarta.annotation.PostConstruct;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/mock/product-service")
public class ProductMockProvider {

    private final LineageTraceCollector lineageCollector;
    private final Map<String, InsuranceProduct> productStore = new LinkedHashMap<>();

    public ProductMockProvider(LineageTraceCollector lineageCollector) {
        this.lineageCollector = lineageCollector;
    }

    @PostConstruct
    public void initSampleProducts() {
        InsuranceProduct p1 = new InsuranceProduct(
                "PROD-HLT-001",
                "INS-2026-H101",
                "무배당 시그니처 100세 종합건강보험",
                "COMPREHENSIVE_HEALTH",
                89000,
                65,
                "STANDARD",
                List.of(
                        new Coverage(
                                "COV-CANCER-01",
                                "C-101",
                                "일반암 진단비(유사암 제외) 주계약",
                                true,
                                5000,
                                "CANCER",
                                List.of(
                                        new BenefitCondition("BNF-101", "악성신생물(일반암) 최초 진단 확정", 5000, 90, 12),
                                        new BenefitCondition("BNF-102", "소액/유사암(갑상선·경계성종양) 진단 확정", 1000, 90, 12)
                                )
                        ),
                        new Coverage(
                                "COV-CARDIO-02",
                                "C-201",
                                "뇌혈관질환 및 허혈성심장질환 진단특약",
                                false,
                                3000,
                                "CARDIOVASCULAR",
                                List.of(
                                        new BenefitCondition("BNF-201", "뇌출혈·뇌경색 포함 뇌혈관질환(I60-I69) 진단 확정", 3000, 0, 12),
                                        new BenefitCondition("BNF-202", "급성심근경색 포함 허혈성심장질환(I20-I25) 관상동맥우회술", 2000, 0, 12)
                                )
                        ),
                        new Coverage(
                                "COV-ENDO-03",
                                "C-301",
                                "당뇨합병증 및 만성신부전 투석치료 특약",
                                false,
                                2000,
                                "ENDOCRINE",
                                List.of(
                                        new BenefitCondition("BNF-301", "당뇨병성 망막병증·족부궤양 수술 급부", 1000, 0, 6),
                                        new BenefitCondition("BNF-302", "말기신부전 혈액투석 개시 급부", 2000, 90, 12)
                                )
                        )
                )
        );

        InsuranceProduct p2 = new InsuranceProduct(
                "PROD-SIMP-002",
                "INS-2026-S325",
                "무배당 3·2·5 원패스 유병자 간편건강보험",
                "SIMPLIFIED_ISSUE",
                114000,
                80,
                "SIMPLIFIED_325",
                List.of(
                        new Coverage(
                                "COV-SIMP-CARDIO-01",
                                "S-201",
                                "간편고지 뇌혈관·심혈관 통합진단비",
                                true,
                                2000,
                                "CARDIOVASCULAR",
                                List.of(
                                        new BenefitCondition("BNF-S201", "유병자 뇌혈관질환 최초 진단 확정", 2000, 90, 24),
                                        new BenefitCondition("BNF-S202", "유병자 허혈성심장질환 최초 진단 확정", 2000, 90, 24)
                                )
                        ),
                        new Coverage(
                                "COV-SIMP-SURG-02",
                                "S-305",
                                "질병 1~5종 수술비 특약(간편형)",
                                false,
                                1500,
                                "ENDOCRINE",
                                List.of(
                                        new BenefitCondition("BNF-S301", "질병 3종~5종 관혈/비관혈 수술 시 회당 지급", 1500, 0, 12)
                                )
                        )
                )
        );

        InsuranceProduct p3 = new InsuranceProduct(
                "PROD-DRV-003",
                "INS-2026-D700",
                "무배당 프로케어 상해·운전자 종합보험",
                "DRIVER_ACCIDENT",
                42000,
                75,
                "STANDARD",
                List.of(
                        new Coverage(
                                "COV-OCC-INJ-01",
                                "D-101",
                                "일반상해 사망·후유장해(3~100%) 주계약",
                                true,
                                10000,
                                "OCCUPATIONAL",
                                List.of(
                                        new BenefitCondition("BNF-D101", "상해사고로 인한 사망 또는 80% 이상 고도후유장해", 10000, 0, 0)
                                )
                        ),
                        new Coverage(
                                "COV-DRV-LEGAL-02",
                                "D-202",
                                "교통사고처리지원금(중대법규위반 포함) 및 변호사선임비 특약",
                                false,
                                20000,
                                "DRIVING",
                                List.of(
                                        new BenefitCondition("BNF-D201", "자동차운전 중 인사사고 형사합의금 실손 보상", 20000, 0, 0),
                                        new BenefitCondition("BNF-D202", "운전 중 사고 공소제기 시 변호사선임비용", 5000, 0, 0)
                                )
                        )
                )
        );

        productStore.put(p1.productId(), p1);
        productStore.put(p2.productId(), p2);
        productStore.put(p3.productId(), p3);
    }

    @GetMapping("/products")
    public List<InsuranceProduct> getAllProducts(@RequestParam(required = false) String category) {
        lineageCollector.recordStep(
                "Query.insuranceProducts",
                "ins:InsuranceProduct",
                "ins:productId, ins:productName, ins:hasCoverage",
                "Product",
                "product-catalog-service",
                "GET",
                "/mock/product-service/products" + (category != null ? "?category=" + category : ""),
                List.of("prod_id", "prod_cd", "prod_nm", "prod_cat_cd", "base_mm_prem", "uw_track_type", "coverages"),
                12
        );
        return productStore.values().stream()
                .filter(p -> category == null || category.isBlank() || p.productCategory().equalsIgnoreCase(category))
                .toList();
    }

    @GetMapping("/products/{productId}")
    public InsuranceProduct getProductById(@PathVariable String productId, @RequestParam(defaultValue = "Query.insuranceProduct") String fieldPath) {
        lineageCollector.recordStep(
                fieldPath,
                "ins:InsuranceProduct",
                "ins:targetProduct -> ins:InsuranceProduct (ins:hasCoverage -> ins:Coverage -> ins:hasBenefit)",
                "Product",
                "product-catalog-service",
                "GET",
                "/mock/product-service/products/" + productId,
                List.of("prod_id", "prod_cd", "prod_nm", "base_mm_prem", "uw_track_type", "cov_id", "cov_nm", "sens_risk_cat", "bnf_id", "payout_amt"),
                14
        );
        return productStore.get(productId);
    }
}
