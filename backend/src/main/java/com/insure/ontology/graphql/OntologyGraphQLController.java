package com.insure.ontology.graphql;

import com.insure.ontology.lineage.LineageTraceCollector;
import com.insure.ontology.model.DomainModels.*;
import com.insure.ontology.provider.ProductMockProvider;
import com.insure.ontology.provider.RiskMockProvider;
import com.insure.ontology.provider.UnderwritingMockProvider;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

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
}
