package com.insure.ontology.lineage;

import com.insure.ontology.model.DomainModels.LineageStep;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class LineageTraceCollector {

    private final ThreadLocal<List<LineageStep>> currentRequestSteps = ThreadLocal.withInitial(ArrayList::new);
    private final ThreadLocal<AtomicInteger> stepCounter = ThreadLocal.withInitial(() -> new AtomicInteger(0));
    private final List<LineageStep> lastRecordedSteps = new CopyOnWriteArrayList<>();

    public void startRequest() {
        currentRequestSteps.get().clear();
        stepCounter.get().set(0);
    }

    public void recordStep(
            String graphqlFieldPath,
            String ontologyClassUri,
            String ontologyPropertyUri,
            String domainName,
            String sourceService,
            String httpMethod,
            String endpointUri,
            List<String> rawSourceFields,
            int latencyMs
    ) {
        int order = stepCounter.get().incrementAndGet();
        LineageStep step = new LineageStep(
                order,
                graphqlFieldPath,
                ontologyClassUri,
                ontologyPropertyUri,
                domainName,
                sourceService,
                httpMethod,
                endpointUri,
                rawSourceFields,
                latencyMs,
                "200 OK"
        );
        currentRequestSteps.get().add(step);
    }

    public List<LineageStep> finishAndSnapshot() {
        List<LineageStep> steps = List.copyOf(currentRequestSteps.get());
        if (!steps.isEmpty()) {
            lastRecordedSteps.clear();
            lastRecordedSteps.addAll(steps);
        }
        currentRequestSteps.remove();
        stepCounter.remove();
        return steps;
    }

    public List<LineageStep> getCurrentSteps() {
        return Collections.unmodifiableList(currentRequestSteps.get());
    }

    public List<LineageStep> getLastRecordedSteps() {
        return Collections.unmodifiableList(lastRecordedSteps);
    }
}
