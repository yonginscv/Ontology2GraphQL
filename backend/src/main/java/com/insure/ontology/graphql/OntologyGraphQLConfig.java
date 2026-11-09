package com.insure.ontology.graphql;

import com.insure.ontology.generator.OntologyToGraphQLGenerator;
import com.insure.ontology.lineage.LineageTraceCollector;
import com.insure.ontology.model.DomainModels.LineageStep;
import graphql.ExecutionResult;
import graphql.ExecutionResultImpl;
import org.springframework.boot.autoconfigure.graphql.GraphQlSourceBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.graphql.server.WebGraphQlInterceptor;
import org.springframework.graphql.server.WebGraphQlRequest;
import org.springframework.graphql.server.WebGraphQlResponse;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Configuration
public class OntologyGraphQLConfig {

    @Bean
    public GraphQlSourceBuilderCustomizer ontologyDrivenSchemaCustomizer(OntologyToGraphQLGenerator generator) {
        return builder -> {
            String generatedSdl = generator.getCachedGraphQLSdl();
            ByteArrayResource sdlResource = new ByteArrayResource(
                    generatedSdl.getBytes(StandardCharsets.UTF_8),
                    "ontology-derived-schema.graphqls"
            );
            builder.schemaResources(sdlResource);
        };
    }

    @Bean
    public WebGraphQlInterceptor lineageGraphQlInterceptor(LineageTraceCollector lineageCollector) {
        return (WebGraphQlRequest request, WebGraphQlInterceptor.Chain chain) -> {
            lineageCollector.startRequest();
            return chain.next(request).map((WebGraphQlResponse response) -> {
                List<LineageStep> steps = lineageCollector.finishAndSnapshot();
                return response.transform(builder -> {
                    Map<Object, Object> ext = new LinkedHashMap<>();
                    ext.put("ontologyLineage", steps);
                    ext.put("ontologyId", "ins:InsuranceProductUnderwritingOntology");
                    ext.put("totalBackendCalls", steps.size());
                    builder.extensions(ext);
                });
            });
        };
    }
}
