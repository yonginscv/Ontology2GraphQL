package com.insure.ontology.rest;

import com.insure.ontology.generator.OntologyMetadata;
import com.insure.ontology.generator.OntologyToGraphQLGenerator;
import com.insure.ontology.lineage.LineageTraceCollector;
import com.insure.ontology.model.DomainModels.*;
import com.insure.ontology.provider.ProductMockProvider;
import com.insure.ontology.provider.RiskMockProvider;
import com.insure.ontology.provider.UnderwritingMockProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HybridGatewayRestController {

    private final OntologyToGraphQLGenerator ontologyGenerator;
    private final ProductMockProvider productProvider;
    private final RiskMockProvider riskProvider;
    private final UnderwritingMockProvider uwProvider;
    private final LineageTraceCollector lineageCollector;

    public HybridGatewayRestController(
            OntologyToGraphQLGenerator ontologyGenerator,
            ProductMockProvider productProvider,
            RiskMockProvider riskProvider,
            UnderwritingMockProvider uwProvider,
            LineageTraceCollector lineageCollector
    ) {
        this.ontologyGenerator = ontologyGenerator;
        this.productProvider = productProvider;
        this.riskProvider = riskProvider;
        this.uwProvider = uwProvider;
        this.lineageCollector = lineageCollector;
    }

    @GetMapping("/ontology/schema")
    public Map<String, Object> getOntologyAndDerivedSchema() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("rawJsonLd", ontologyGenerator.getRawJsonLd());
        result.put("metadata", ontologyGenerator.getCachedMetadata());
        result.put("derivedGraphQLSdl", ontologyGenerator.getCachedGraphQLSdl());
        result.put("riskFactorsCatalog", riskProvider.getAvailableRiskFactorsCatalog());
        return result;
    }

    public record TransformPreviewRequest(String jsonLd) {}

    @PostMapping("/ontology/transform-preview")
    public ResponseEntity<Map<String, Object>> previewOntologyTransform(@RequestBody TransformPreviewRequest request) {
        try {
            OntologyMetadata parsed = ontologyGenerator.parseOntology(request.jsonLd());
            String sdl = ontologyGenerator.generateGraphQLSdl(parsed);
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("success", true);
            resp.put("metadata", parsed);
            resp.put("derivedGraphQLSdl", sdl);
            resp.put("classCount", parsed.classes().size());
            resp.put("propertyCount", parsed.properties().size());
            resp.put("edgeCount", parsed.objectEdges().size());
            return ResponseEntity.ok(resp);
        } catch (IOException | RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage() != null ? e.getMessage() : "Invalid JSON-LD syntax"
            ));
        }
    }

    @GetMapping("/products")
    public Map<String, Object> getProductsRest(@RequestParam(required = false) String category) {
        lineageCollector.startRequest();
        List<InsuranceProduct> products = productProvider.getAllProducts(category);
        List<LineageStep> steps = lineageCollector.finishAndSnapshot();
        return Map.of(
                "protocol", "REST (OpenAPI Hybrid Gateway)",
                "endpoint", "GET /api/v1/products",
                "data", products,
                "lineage", steps
        );
    }

    @GetMapping("/underwriting/cases/{caseId}/orchestrated")
    public ResponseEntity<Map<String, Object>> getOrchestratedCaseRest(@PathVariable String caseId) {
        lineageCollector.startRequest();
        UnderwritingCase uwCase = uwProvider.getCaseById(caseId);
        if (uwCase == null) {
            lineageCollector.finishAndSnapshot();
            return ResponseEntity.notFound().build();
        }
        InsuranceProduct product = productProvider.getProductById(uwCase.targetProductId(), "REST.orchestrated.targetProduct");
        ApplicantProfile applicant = riskProvider.getApplicantById(uwCase.targetApplicantId(), "REST.orchestrated.targetApplicant");
        List<UnderwritingRule> rules = uwProvider.getRulesByIds(uwCase.matchedRuleIds(), "REST.orchestrated.matchedRules");
        List<LineageStep> steps = lineageCollector.finishAndSnapshot();

        Map<String, Object> composite = new LinkedHashMap<>();
        composite.put("caseId", uwCase.caseId());
        composite.put("applicationDate", uwCase.applicationDate());
        composite.put("channelType", uwCase.channelType());
        composite.put("uwStatus", uwCase.uwStatus());
        composite.put("targetProduct", product);
        composite.put("targetApplicant", applicant);
        composite.put("matchedRules", rules);
        composite.put("decision", uwCase.decision());

        return ResponseEntity.ok(Map.of(
                "protocol", "REST (Hybrid Gateway BFF Endpoint - Fixed Over-fetching Payload)",
                "endpoint", "GET /api/v1/underwriting/cases/" + caseId + "/orchestrated",
                "data", composite,
                "lineage", steps
        ));
    }

    @PostMapping("/underwriting/simulate")
    public Map<String, Object> simulateUnderwritingRest(@RequestBody UnderwritingSimulationInput input) {
        lineageCollector.startRequest();
        UnderwritingCase uwCase = uwProvider.simulateCase(input);
        InsuranceProduct product = productProvider.getProductById(uwCase.targetProductId(), "REST.simulate.targetProduct");
        ApplicantProfile applicant = riskProvider.getApplicantById(uwCase.targetApplicantId(), "REST.simulate.targetApplicant");
        List<UnderwritingRule> rules = uwProvider.getRulesByIds(uwCase.matchedRuleIds(), "REST.simulate.matchedRules");
        List<LineageStep> steps = lineageCollector.finishAndSnapshot();

        Map<String, Object> composite = new LinkedHashMap<>();
        composite.put("caseId", uwCase.caseId());
        composite.put("applicationDate", uwCase.applicationDate());
        composite.put("channelType", uwCase.channelType());
        composite.put("uwStatus", uwCase.uwStatus());
        composite.put("targetProduct", product);
        composite.put("targetApplicant", applicant);
        composite.put("matchedRules", rules);
        composite.put("decision", uwCase.decision());

        return Map.of(
                "protocol", "REST (POST /api/v1/underwriting/simulate)",
                "data", composite,
                "lineage", steps
        );
    }
}
