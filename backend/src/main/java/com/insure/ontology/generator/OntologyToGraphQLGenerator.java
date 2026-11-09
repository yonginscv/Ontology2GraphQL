package com.insure.ontology.generator;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.insure.ontology.generator.OntologyMetadata.OntologyClassDef;
import com.insure.ontology.generator.OntologyMetadata.OntologyGraphEdge;
import com.insure.ontology.generator.OntologyMetadata.OntologyPropertyDef;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OntologyToGraphQLGenerator {

    private final ObjectMapper objectMapper;
    private String rawJsonLd;
    private OntologyMetadata cachedMetadata;
    private String cachedGraphQLSdl;

    public OntologyToGraphQLGenerator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() throws IOException {
        ClassPathResource resource = new ClassPathResource("ontology/insurance-ontology.jsonld");
        try (InputStream is = resource.getInputStream()) {
            this.rawJsonLd = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            this.cachedMetadata = parseOntology(this.rawJsonLd);
            this.cachedGraphQLSdl = generateGraphQLSdl(this.cachedMetadata);
        }
    }

    public String getRawJsonLd() {
        return rawJsonLd;
    }

    public OntologyMetadata getCachedMetadata() {
        return cachedMetadata;
    }

    public String getCachedGraphQLSdl() {
        return cachedGraphQLSdl;
    }

    public OntologyMetadata parseOntology(String jsonLdContent) throws IOException {
        JsonNode root = objectMapper.readTree(jsonLdContent);
        String ontologyId = textOrDefault(root, "@id", "ins:Ontology");
        String label = textOrDefault(root, "rdfs:label", "Insurance Ontology");
        String comment = textOrDefault(root, "rdfs:comment", "");
        String version = textOrDefault(root, "ins:version", "1.0.0");

        Map<String, String> contextMap = new LinkedHashMap<>();
        JsonNode ctxNode = root.get("@context");
        if (ctxNode != null && ctxNode.isObject()) {
            ctxNode.fields().forEachRemaining(entry -> contextMap.put(entry.getKey(), entry.getValue().asText()));
        }

        JsonNode graphNode = root.get("@graph");
        Map<String, JsonNode> classNodes = new LinkedHashMap<>();
        List<JsonNode> propertyNodes = new ArrayList<>();

        if (graphNode != null && graphNode.isArray()) {
            for (JsonNode item : graphNode) {
                String type = textOrDefault(item, "@type", "");
                String id = textOrDefault(item, "@id", "");
                if ("rdfs:Class".equals(type)) {
                    classNodes.put(id, item);
                } else if ("rdf:Property".equals(type)) {
                    propertyNodes.add(item);
                }
            }
        }

        List<OntologyPropertyDef> allProperties = new ArrayList<>();
        List<OntologyGraphEdge> objectEdges = new ArrayList<>();

        for (JsonNode propNode : propertyNodes) {
            String uri = textOrDefault(propNode, "@id", "");
            String localName = extractLocalName(uri);
            String propLabel = textOrDefault(propNode, "rdfs:label", localName);
            String propComment = textOrDefault(propNode, "rdfs:comment", "");
            String domainUri = textOrDefault(propNode, "rdfs:domain", "");
            String rangeUri = textOrDefault(propNode, "rdfs:range", "xsd:string");
            boolean isList = boolOrDefault(propNode, "ins:isList", false);
            boolean required = boolOrDefault(propNode, "ins:required", false);
            String sourceField = textOrDefault(propNode, "ins:sourceField", localName);
            String crossServiceJoin = textOrDefault(propNode, "ins:crossServiceJoin", "");

            boolean isObjectRelation = classNodes.containsKey(rangeUri) || (!rangeUri.startsWith("xsd:") && rangeUri.startsWith("ins:"));
            String baseGraphqlType = mapRangeToGraphQLType(rangeUri);
            String fullGraphqlType = buildGraphQLTypeExpression(baseGraphqlType, isList, required);

            OntologyPropertyDef propDef = new OntologyPropertyDef(
                    uri,
                    localName,
                    propLabel,
                    propComment,
                    domainUri,
                    rangeUri,
                    fullGraphqlType,
                    isObjectRelation,
                    isList,
                    required,
                    sourceField,
                    crossServiceJoin
            );
            allProperties.add(propDef);

            if (isObjectRelation) {
                String sourceClassName = extractLocalName(domainUri);
                String targetClassName = extractLocalName(rangeUri);
                objectEdges.add(new OntologyGraphEdge(
                        sourceClassName + "_" + localName + "_" + targetClassName,
                        domainUri,
                        sourceClassName,
                        uri,
                        localName,
                        propLabel,
                        rangeUri,
                        targetClassName,
                        !crossServiceJoin.isBlank(),
                        crossServiceJoin
                ));
            }
        }

        Map<String, List<OntologyPropertyDef>> propsByDomain = allProperties.stream()
                .collect(Collectors.groupingBy(OntologyPropertyDef::domainUri, LinkedHashMap::new, Collectors.toList()));

        List<OntologyClassDef> classes = new ArrayList<>();
        for (Map.Entry<String, JsonNode> entry : classNodes.entrySet()) {
            String uri = entry.getKey();
            JsonNode cNode = entry.getValue();
            String localName = extractLocalName(uri);
            String cLabel = textOrDefault(cNode, "rdfs:label", localName);
            String cComment = textOrDefault(cNode, "rdfs:comment", "");
            String domain = textOrDefault(cNode, "ins:domain", "General");
            String sourceService = textOrDefault(cNode, "ins:sourceService", "unknown-service");
            String sourceEndpoint = textOrDefault(cNode, "ins:sourceEndpoint", "");
            boolean isRootQuery = boolOrDefault(cNode, "ins:isRootQuery", false);

            List<OntologyPropertyDef> fields = propsByDomain.getOrDefault(uri, List.of());
            classes.add(new OntologyClassDef(
                    uri,
                    localName,
                    cLabel,
                    cComment,
                    domain,
                    sourceService,
                    sourceEndpoint,
                    isRootQuery,
                    fields
            ));
        }

        return new OntologyMetadata(
                ontologyId,
                label,
                comment,
                version,
                contextMap,
                classes,
                allProperties,
                objectEdges
        );
    }

    public String generateGraphQLSdl(OntologyMetadata metadata) {
        StringBuilder sb = new StringBuilder();
        sb.append("# ==========================================================================\n");
        sb.append("# AUTO-GENERATED GRAPHQL SCHEMA FROM JSON-LD / RDFS ONTOLOGY\n");
        sb.append("# Ontology ID : ").append(metadata.ontologyId()).append(" (v").append(metadata.version()).append(")\n");
        sb.append("# Label       : ").append(metadata.label()).append("\n");
        sb.append("# ==========================================================================\n\n");

        sb.append("directive @ontologyClass(\n");
        sb.append("  uri: String!\n");
        sb.append("  label: String!\n");
        sb.append("  domain: String!\n");
        sb.append("  sourceService: String!\n");
        sb.append("  sourceEndpoint: String!\n");
        sb.append(") on OBJECT\n\n");

        sb.append("directive @ontologyProperty(\n");
        sb.append("  uri: String!\n");
        sb.append("  label: String!\n");
        sb.append("  range: String!\n");
        sb.append("  sourceField: String!\n");
        sb.append("  crossServiceJoin: String\n");
        sb.append(") on FIELD_DEFINITION\n\n");

        for (OntologyClassDef cls : metadata.classes()) {
            sb.append("\"\"\"\n");
            sb.append("[").append(cls.domain()).append(" Domain] ").append(cls.label()).append("\n");
            if (!cls.comment().isBlank()) {
                sb.append(cls.comment()).append("\n");
            }
            sb.append("Ontology RDFS Class: ").append(cls.uri()).append("\n");
            sb.append("Source Service: ").append(cls.sourceService()).append(" (").append(cls.sourceEndpoint()).append(")\n");
            sb.append("\"\"\"\n");
            sb.append("type ").append(cls.localName()).append(" @ontologyClass(\n");
            sb.append("  uri: \"").append(escape(cls.uri())).append("\"\n");
            sb.append("  label: \"").append(escape(cls.label())).append("\"\n");
            sb.append("  domain: \"").append(escape(cls.domain())).append("\"\n");
            sb.append("  sourceService: \"").append(escape(cls.sourceService())).append("\"\n");
            sb.append("  sourceEndpoint: \"").append(escape(cls.sourceEndpoint())).append("\"\n");
            sb.append(") {\n");

            for (OntologyPropertyDef field : cls.fields()) {
                sb.append("  \"\"\"").append(escape(field.label())).append(" - ").append(escape(field.comment())).append("\"\"\"\n");
                sb.append("  ").append(field.localName()).append(": ").append(field.graphqlType());
                sb.append(" @ontologyProperty(uri: \"").append(escape(field.uri())).append("\"");
                sb.append(", label: \"").append(escape(field.label())).append("\"");
                sb.append(", range: \"").append(escape(field.rangeUri())).append("\"");
                sb.append(", sourceField: \"").append(escape(field.sourceField())).append("\"");
                if (field.crossServiceJoin() != null && !field.crossServiceJoin().isBlank()) {
                    sb.append(", crossServiceJoin: \"").append(escape(field.crossServiceJoin())).append("\"");
                }
                sb.append(")\n");
            }
            sb.append("}\n\n");
        }

        sb.append("""
                "데이터 계보(Data Lineage) 추적 엔트리: GraphQL 필드가 어떤 온톨로지 개념 및 백엔드 서비스 호출로부터 도출되었는지 기록"
                type LineageStep {
                  stepOrder: Int!
                  graphqlFieldPath: String!
                  ontologyClassUri: String!
                  ontologyPropertyUri: String!
                  domainName: String!
                  sourceService: String!
                  httpMethod: String!
                  endpointUri: String!
                  rawSourceFields: [String!]!
                  latencyMs: Int!
                  status: String!
                }

                "언더라이팅 시뮬레이션 요청 입력"
                input UnderwritingSimulationInput {
                  productId: ID!
                  applicantName: String!
                  age: Int!
                  gender: String!
                  occupationName: String!
                  occupationGrade: Int!
                  isSmoker: Boolean!
                  bmi: Float!
                  riskFactorCodes: [String!]!
                }

                type Query {
                  "모든 언더라이팅 심사건 목록 조회 (Product + Risk + Underwriting 3개 도메인 통합 그래프)"
                  underwritingCases: [UnderwritingCase!]!

                  "특정 언더라이팅 심사건 단건 조회 (3개 도메인 마이크로서비스 조립)"
                  underwritingCase(caseId: ID!): UnderwritingCase

                  "판매 중인 보험상품 카탈로그 및 담보/급부 조회 (Product Domain)"
                  insuranceProducts(category: String): [InsuranceProduct!]!

                  "특정 보험상품 단건 조회 (Product Domain)"
                  insuranceProduct(productId: ID!): InsuranceProduct

                  "피보험자/청약자 위험 프로필 목록 조회 (Risk Domain)"
                  applicantProfiles: [ApplicantProfile!]!

                  "특정 피보험자 위험 프로필 단건 조회 (Risk Domain)"
                  applicantProfile(applicantId: ID!): ApplicantProfile

                  "인수심사 규칙(Underwriting Rule) 마스터 목록 조회 (Underwriting Domain)"
                  underwritingRules(riskCategory: String): [UnderwritingRule!]!

                  "최근 실행된 GraphQL 쿼리의 데이터 계보(Lineage) 트레이스 조회"
                  latestLineageTraces: [LineageStep!]!
                }

                type Mutation {
                  "실시간 언더라이팅 & 리스크 인수심사 시뮬레이션 실행"
                  simulateUnderwriting(input: UnderwritingSimulationInput!): UnderwritingCase!
                }
                """);

        return sb.toString();
    }

    public static String extractLocalName(String uri) {
        if (uri == null || uri.isBlank()) {
            return "Unknown";
        }
        int colonIdx = uri.indexOf(':');
        if (colonIdx >= 0 && colonIdx + 1 < uri.length()) {
            return uri.substring(colonIdx + 1);
        }
        int hashIdx = uri.lastIndexOf('#');
        if (hashIdx >= 0 && hashIdx + 1 < uri.length()) {
            return uri.substring(hashIdx + 1);
        }
        return uri;
    }

    public static String mapRangeToGraphQLType(String rangeUri) {
        return switch (rangeUri) {
            case "xsd:ID" -> "ID";
            case "xsd:string", "xsd:date", "xsd:dateTime" -> "String";
            case "xsd:int", "xsd:integer", "xsd:long" -> "Int";
            case "xsd:float", "xsd:double", "xsd:decimal" -> "Float";
            case "xsd:boolean" -> "Boolean";
            default -> extractLocalName(rangeUri);
        };
    }

    private static String buildGraphQLTypeExpression(String baseType, boolean isList, boolean required) {
        if (isList) {
            return required ? "[" + baseType + "!]!" : "[" + baseType + "!]";
        }
        return required ? baseType + "!" : baseType;
    }

    private static String textOrDefault(JsonNode node, String field, String defaultValue) {
        if (node != null && node.has(field) && !node.get(field).isNull()) {
            return node.get(field).asText(defaultValue);
        }
        return defaultValue;
    }

    private static boolean boolOrDefault(JsonNode node, String field, boolean defaultValue) {
        if (node != null && node.has(field) && !node.get(field).isNull()) {
            return node.get(field).asBoolean(defaultValue);
        }
        return defaultValue;
    }

    private static String escape(String str) {
        if (str == null) return "";
        return str.replace("\"", "\\\"").replace("\n", " ");
    }
}
