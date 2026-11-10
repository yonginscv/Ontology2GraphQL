package com.insure.ontology;

import com.insure.ontology.generator.OntologyMetadata;
import com.insure.ontology.generator.OntologyToGraphQLGenerator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.tester.AutoConfigureGraphQlTester;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.graphql.test.tester.GraphQlTester;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureGraphQlTester
class OntologyToGraphQLIntegrationTest {

    @Autowired
    private OntologyToGraphQLGenerator generator;

    @Autowired
    private GraphQlTester graphQlTester;

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
    void shouldServePinnedGraphiqlHtmlTemplate() throws Exception {
        ClassPathResource resource = new ClassPathResource("graphiql/index.html");
        String html = resource.getContentAsString(StandardCharsets.UTF_8);
        assertThat(html)
                .contains("https://unpkg.com/graphiql@3.0.6/graphiql.min.js")
                .contains("https://unpkg.com/graphiql@3.0.6/graphiql.min.css")
                .contains("https://unpkg.com/@graphiql/plugin-explorer@1.0.2/dist/index.umd.js")
                .contains("https://unpkg.com/@graphiql/plugin-explorer@1.0.2/dist/style.css");
    }
}
