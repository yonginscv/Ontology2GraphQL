package com.insure.ontology;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.insure.ontology.generator.OntologyMetadata;
import com.insure.ontology.generator.OntologyToGraphQLGenerator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.tester.AutoConfigureGraphQlTester;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureGraphQlTester
@AutoConfigureMockMvc
class OntologyToGraphQLIntegrationTest {

    @Autowired
    private OntologyToGraphQLGenerator generator;

    @Autowired
    private GraphQlTester graphQlTester;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldParseJsonLdOntologyAndGenerateGraphQLSchemaWithDirectives() {
        OntologyMetadata metadata = generator.getCachedMetadata();
        assertThat(metadata).isNotNull();
        assertThat(metadata.classes()).hasSize(9);
        assertThat(metadata.properties().size()).isGreaterThanOrEqualTo(45);
        assertThat(metadata.objectEdges()).isNotEmpty();

        String sdl = generator.getCachedGraphQLSdl();
        assertThat(sdl)
                .contains("directive @ontologyClass")
                .contains("directive @ontologyProperty")
                .contains("type InsuranceProduct @ontologyClass")
                .contains("type UnderwritingCase @ontologyClass")
                .contains("type ApplicantProfile @ontologyClass")
                .contains("crossServiceJoin: \"product-catalog-service\"")
                .contains("crossServiceJoin: \"risk-assessment-service\"");
    }

    @Test
    void shouldExecuteCrossDomainGraphQLQueryAndCollectOntologyLineage() {
        String query = """
                query GetCaseGraph {
                  underwritingCase(caseId: "UW-CASE-2026-002") {
                    caseId
                    uwStatus
                    targetProduct {
                      productId
                      productName
                      underwritingTrack
                      hasCoverage {
                        coverageCode
                        coverageName
                        sensitiveRiskCategory
                      }
                    }
                    targetApplicant {
                      applicantName
                      age
                      hasRiskFactor {
                        factorCode
                        factorName
                        severityLevel
                      }
                      riskAssessment {
                        totalRiskScore
                        riskGrade
                        mortalityLoadingRatio
                      }
                    }
                    matchedRules {
                      ruleCode
                      actionType
                    }
                    decision {
                      decisionOutcome
                      finalMonthlyPremium
                      loadingPercentage
                    }
                  }
                }
                """;

        graphQlTester.document(query)
                .execute()
                .path("underwritingCase.caseId").entity(String.class).isEqualTo("UW-CASE-2026-002")
                .path("underwritingCase.targetProduct.productName").entity(String.class).isEqualTo("무배당 시그니처 100세 종합건강보험")
                .path("underwritingCase.targetApplicant.applicantName").entity(String.class).isEqualTo("박서연")
                .path("underwritingCase.targetApplicant.riskAssessment.totalRiskScore").entity(Integer.class).isEqualTo(68)
                .path("underwritingCase.decision.decisionOutcome").entity(String.class).isEqualTo("SUBSTANDARD_LOADING")
                .path("underwritingCase.decision.finalMonthlyPremium").entity(Integer.class).isEqualTo(126380);
    }

    @Test
    void shouldServeLocalGraphiqlHtmlTemplateAndVendorAssetsForOfflineUse() throws Exception {
        ClassPathResource resource = new ClassPathResource("graphiql/index.html");
        String html = resource.getContentAsString(StandardCharsets.UTF_8);
        assertThat(html)
                .doesNotContain("unpkg.com")
                .doesNotContain("http://")
                .doesNotContain("https://")
                .contains("<meta charset=\"UTF-8\" />")
                .contains("/graphiql/vendor/react.production.min.js")
                .contains("/graphiql/vendor/react-dom.production.min.js")
                .contains("/graphiql/vendor/graphiql.min.js")
                .contains("/graphiql/vendor/graphiql.min.css")
                .contains("/graphiql/vendor/plugin-explorer.umd.js")
                .contains("/graphiql/vendor/plugin-explorer.css");

        String[] localVendorAssets = {
                "static/graphiql/vendor/react.production.min.js",
                "static/graphiql/vendor/react-dom.production.min.js",
                "static/graphiql/vendor/graphiql.min.js",
                "static/graphiql/vendor/graphiql.min.css",
                "static/graphiql/vendor/plugin-explorer.umd.js",
                "static/graphiql/vendor/plugin-explorer.css"
        };
        for (String assetPath : localVendorAssets) {
            ClassPathResource asset = new ClassPathResource(assetPath);
            assertThat(asset.exists()).as("Expected offline asset to exist: " + assetPath).isTrue();
            assertThat(asset.contentLength()).as("Expected offline asset to be non-empty: " + assetPath).isGreaterThan(0);

            String webPath = assetPath.substring("static".length());
            MvcResult assetResult = mockMvc.perform(get(webPath))
                    .andExpect(status().isOk())
                    .andReturn();
            assertThat(assetResult.getResponse().getContentType())
                    .as("Expected UTF-8 charset on static asset: " + webPath)
                    .containsIgnoringCase("charset=UTF-8");
        }

        MvcResult graphiqlResult = mockMvc.perform(get("/graphiql").param("path", "/graphql"))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(graphiqlResult.getResponse().getContentType())
                .contains("text/html")
                .containsIgnoringCase("charset=UTF-8");
    }

    @Test
    void shouldDemonstrateNPlusOneAndBatchProcessingReduction() throws Exception {
        String fieldsSelection = """
                caseId
                uwStatus
                targetProduct {
                  productId
                  productName
                }
                targetApplicant {
                  applicantId
                  applicantName
                  riskAssessment {
                    totalRiskScore
                  }
                }
                matchedRules {
                  ruleId
                  ruleCode
                }
                decision {
                  decisionOutcome
                  finalMonthlyPremium
                }
                """;

        String nPlusOneQuery = "query NPlusOneCases { underwritingCases { " + fieldsSelection + " } }";
        String batchedQuery = "query BatchedCases { underwritingCasesBatched { " + fieldsSelection + " } }";

        MvcResult nPlusOneResult = mockMvc.perform(post("/graphql")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("query", nPlusOneQuery))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode nPlusOneJson = objectMapper.readTree(nPlusOneResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(nPlusOneJson.path("errors").isMissingNode() || nPlusOneJson.path("errors").isEmpty()).isTrue();
        JsonNode nPlusOneCases = nPlusOneJson.path("data").path("underwritingCases");
        assertThat(nPlusOneCases).hasSize(5);
        // 1 (cases) + 5 (targetProduct) + 5 (targetApplicant) + 5 (matchedRules) = 16 backend calls
        assertThat(nPlusOneJson.path("extensions").path("totalBackendCalls").asInt()).isEqualTo(16);
        assertThat(nPlusOneJson.path("extensions").path("ontologyLineage")).hasSize(16);

        MvcResult batchedResult = mockMvc.perform(post("/graphql")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("query", batchedQuery))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode batchedJson = objectMapper.readTree(batchedResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(batchedJson.path("errors").isMissingNode() || batchedJson.path("errors").isEmpty()).isTrue();
        JsonNode batchedCases = batchedJson.path("data").path("underwritingCasesBatched");
        assertThat(batchedCases).isEqualTo(nPlusOneCases);
        // 1 (cases) + 1 (products/batch) + 1 (applicants/batch) + 1 (rules/batch) = 4 backend calls
        assertThat(batchedJson.path("extensions").path("totalBackendCalls").asInt()).isEqualTo(4);

        JsonNode lineage = batchedJson.path("extensions").path("ontologyLineage");
        assertThat(lineage).hasSize(4);
        assertThat(lineage.get(0).path("endpointUri").asText()).isEqualTo("/mock/uw-service/cases");
        List<String> batchEndpoints = StreamSupport.stream(lineage.spliterator(), false)
                .skip(1)
                .map(step -> step.path("endpointUri").asText())
                .toList();
        assertThat(batchEndpoints).containsExactlyInAnyOrder(
                "/mock/product-service/products/batch?ids=PROD-HLT-001,PROD-SIMP-002,PROD-DRV-003",
                "/mock/risk-service/applicants/batch?ids=APPL-1001,APPL-1002,APPL-1003,APPL-1004",
                "/mock/uw-service/rules/batch?ids=RULE-UW-01,RULE-UW-02,RULE-UW-03,RULE-UW-04,RULE-UW-05"
        );
    }
}
