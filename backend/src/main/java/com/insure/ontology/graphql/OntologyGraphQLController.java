package com.insure.ontology.graphql;

import com.insure.ontology.lineage.LineageTraceCollector;
import com.insure.ontology.model.DomainModels.*;
import com.insure.ontology.provider.ProductMockProvider;
import com.insure.ontology.provider.RiskMockProvider;
import com.insure.ontology.provider.UnderwritingMockProvider;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.BatchMapping;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Controller
public class OntologyGraphQLController {

    private final ProductMockProvider productProvider;
    private final RiskMockProvider riskProvider;
    private final UnderwritingMockProvider uwProvider;
    private final LineageTraceCollector lineageCollector;

    public OntologyGraphQLController(
            ProductMockProvider productProvider,
            RiskMockProvider riskProvider,
            UnderwritingMockProvider uwProvider,
            LineageTraceCollector lineageCollector
    ) {
        this.productProvider = productProvider;
        this.riskProvider = riskProvider;
        this.uwProvider = uwProvider;
        this.lineageCollector = lineageCollector;
    }

    @QueryMapping
    public List<UnderwritingCase> underwritingCases() {
        return uwProvider.getAllCases();
    }

    @QueryMapping
    public List<BatchedUnderwritingCase> underwritingCasesBatched() {
        return uwProvider.getAllCases("Query.underwritingCasesBatched").stream()
                .map(BatchedUnderwritingCase::from)
                .toList();
    }

    @QueryMapping
    public UnderwritingCase underwritingCase(@Argument String caseId) {
        return uwProvider.getCaseById(caseId);
    }

    @QueryMapping
    public List<InsuranceProduct> insuranceProducts(@Argument String category) {
        return productProvider.getAllProducts(category);
    }

    @QueryMapping
    public InsuranceProduct insuranceProduct(@Argument String productId) {
        return productProvider.getProductById(productId, "Query.insuranceProduct");
    }

    @QueryMapping
    public List<ApplicantProfile> applicantProfiles() {
        return riskProvider.getAllApplicants();
    }

    @QueryMapping
    public ApplicantProfile applicantProfile(@Argument String applicantId) {
        return riskProvider.getApplicantById(applicantId, "Query.applicantProfile");
    }

    @QueryMapping
    public List<UnderwritingRule> underwritingRules(@Argument String riskCategory) {
        return uwProvider.getRules(riskCategory, "Query.underwritingRules");
    }

    @QueryMapping
    public List<LineageStep> latestLineageTraces() {
        return lineageCollector.getLastRecordedSteps();
    }

    @MutationMapping
    public UnderwritingCase simulateUnderwriting(@Argument UnderwritingSimulationInput input) {
        return uwProvider.simulateCase(input);
    }

    // Cross-domain @SchemaMapping resolvers defined by JSON-LD object properties (rdfs:range = ins:*)
    @SchemaMapping(typeName = "UnderwritingCase", field = "targetProduct")
    public InsuranceProduct resolveTargetProduct(UnderwritingCase uwCase) {
        return productProvider.getProductById(
                uwCase.targetProductId(),
                "UnderwritingCase(" + uwCase.caseId() + ").targetProduct"
        );
    }

    @SchemaMapping(typeName = "UnderwritingCase", field = "targetApplicant")
    public ApplicantProfile resolveTargetApplicant(UnderwritingCase uwCase) {
        return riskProvider.getApplicantById(
                uwCase.targetApplicantId(),
                "UnderwritingCase(" + uwCase.caseId() + ").targetApplicant"
        );
    }

    @SchemaMapping(typeName = "UnderwritingCase", field = "matchedRules")
    public List<UnderwritingRule> resolveMatchedRules(UnderwritingCase uwCase) {
        return uwProvider.getRulesByIds(
                uwCase.matchedRuleIds(),
                "UnderwritingCase(" + uwCase.caseId() + ").matchedRules"
        );
    }

    // Batch-processed @BatchMapping resolvers (eliminates N+1 calls across UnderwritingCase list)
    @BatchMapping(typeName = "BatchedUnderwritingCase", field = "targetProduct")
    public Map<BatchedUnderwritingCase, InsuranceProduct> batchTargetProducts(List<BatchedUnderwritingCase> cases) {
        if (cases.isEmpty()) {
            return Map.of();
        }
        List<String> productIds = cases.stream()
                .map(BatchedUnderwritingCase::targetProductId)
                .toList();
        Map<String, InsuranceProduct> productsById = productProvider.getProductsByIds(
                productIds,
                "BatchedUnderwritingCase[*].targetProduct"
        );
        Map<BatchedUnderwritingCase, InsuranceProduct> result = new LinkedHashMap<>();
        for (BatchedUnderwritingCase uwCase : cases) {
            InsuranceProduct product = productsById.get(uwCase.targetProductId());
            if (product != null) {
                result.put(uwCase, product);
            }
        }
        return result;
    }

    @BatchMapping(typeName = "BatchedUnderwritingCase", field = "targetApplicant")
    public Map<BatchedUnderwritingCase, ApplicantProfile> batchTargetApplicants(List<BatchedUnderwritingCase> cases) {
        if (cases.isEmpty()) {
            return Map.of();
        }
        List<String> applicantIds = cases.stream()
                .map(BatchedUnderwritingCase::targetApplicantId)
                .toList();
        Map<String, ApplicantProfile> applicantsById = riskProvider.getApplicantsByIds(
                applicantIds,
                "BatchedUnderwritingCase[*].targetApplicant"
        );
        Map<BatchedUnderwritingCase, ApplicantProfile> result = new LinkedHashMap<>();
        for (BatchedUnderwritingCase uwCase : cases) {
            ApplicantProfile applicant = applicantsById.get(uwCase.targetApplicantId());
            if (applicant != null) {
                result.put(uwCase, applicant);
            }
        }
        return result;
    }

    @BatchMapping(typeName = "BatchedUnderwritingCase", field = "matchedRules")
    public Map<BatchedUnderwritingCase, List<UnderwritingRule>> batchMatchedRules(List<BatchedUnderwritingCase> cases) {
        if (cases.isEmpty()) {
            return Map.of();
        }
        List<String> allRuleIds = cases.stream()
                .filter(c -> c.matchedRuleIds() != null)
                .flatMap(c -> c.matchedRuleIds().stream())
                .toList();
        Map<String, UnderwritingRule> rulesById = allRuleIds.isEmpty()
                ? Map.of()
                : uwProvider.getRulesByBatchIds(allRuleIds, "BatchedUnderwritingCase[*].matchedRules");
        Map<BatchedUnderwritingCase, List<UnderwritingRule>> result = new LinkedHashMap<>();
        for (BatchedUnderwritingCase uwCase : cases) {
            List<String> ids = uwCase.matchedRuleIds() != null ? uwCase.matchedRuleIds() : List.of();
            List<UnderwritingRule> matched = ids.stream()
                    .map(rulesById::get)
                    .filter(Objects::nonNull)
                    .toList();
            result.put(uwCase, matched);
        }
        return result;
    }
}
