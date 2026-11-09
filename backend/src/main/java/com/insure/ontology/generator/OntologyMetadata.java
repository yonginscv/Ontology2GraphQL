package com.insure.ontology.generator;

import java.util.List;
import java.util.Map;

public record OntologyMetadata(
        String ontologyId,
        String label,
        String comment,
        String version,
        Map<String, String> context,
        List<OntologyClassDef> classes,
        List<OntologyPropertyDef> properties,
        List<OntologyGraphEdge> objectEdges
) {
    public record OntologyClassDef(
            String uri,
            String localName,
            String label,
            String comment,
            String domain,
            String sourceService,
            String sourceEndpoint,
            boolean isRootQuery,
            List<OntologyPropertyDef> fields
    ) {}

    public record OntologyPropertyDef(
            String uri,
            String localName,
            String label,
            String comment,
            String domainUri,
            String rangeUri,
            String graphqlType,
            boolean isObjectRelation,
            boolean isList,
            boolean required,
            String sourceField,
            String crossServiceJoin
    ) {}

    public record OntologyGraphEdge(
            String id,
            String sourceClassUri,
            String sourceClassName,
            String propertyUri,
            String propertyName,
            String propertyLabel,
            String targetClassUri,
            String targetClassName,
            boolean isCrossService,
            String crossServiceName
    ) {}
}
