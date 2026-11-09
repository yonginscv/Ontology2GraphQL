package com.insure.ontology.model;

import java.util.List;

public class DomainModels {

    public record InsuranceProduct(
            String productId,
            String productCode,
            String productName,
            String productCategory,
            int baseMonthlyPremium,
            int maxEligibleAge,
            String underwritingTrack,
            List<Coverage> hasCoverage
    ) {}

    public record Coverage(
            String coverageId,
            String coverageCode,
            String coverageName,
            boolean isMandatory,
            int maxInsuredAmount,
            String sensitiveRiskCategory,
            List<BenefitCondition> hasBenefit
    ) {}

    public record BenefitCondition(
            String benefitId,
            String triggerEvent,
            int payoutAmount,
            int waitingPeriodDays,
            int reductionPeriodMonths
    ) {}

    public record ApplicantProfile(
            String applicantId,
            String applicantName,
            int age,
            String gender,
            String occupationName,
            int occupationGrade,
            boolean isSmoker,
            double bmi,
            List<RiskFactor> hasRiskFactor,
            RiskAssessment riskAssessment
    ) {}

    public record RiskFactor(
            String riskFactorId,
            String factorCode,
            String factorName,
            String riskCategory,
            String severityLevel,
            int riskScoreContribution,
            String clinicalNote
    ) {}

    public record RiskAssessment(
            String assessmentId,
            int totalRiskScore,
            String riskGrade,
            double mortalityLoadingRatio,
            String scoringModelVersion
    ) {}

    public record UnderwritingCase(
            String caseId,
            String applicationDate,
            String channelType,
            String uwStatus,
            String targetProductId,
            String targetApplicantId,
            List<String> matchedRuleIds,
            UnderwritingDecision decision
    ) {}

    public record UnderwritingRule(
            String ruleId,
            String ruleCode,
            String ruleName,
            String targetRiskCategory,
            String conditionExpression,
            String actionType,
            String ruleDescription
    ) {}

    public record UnderwritingDecision(
            String decisionId,
            String decisionOutcome,
            int finalMonthlyPremium,
            int surchargeAmount,
            double loadingPercentage,
            List<String> exclusionClauses,
            String underwriterComment,
            boolean automatedDecision
    ) {}

    public record LineageStep(
            int stepOrder,
            String graphqlFieldPath,
            String ontologyClassUri,
            String ontologyPropertyUri,
            String domainName,
            String sourceService,
            String httpMethod,
            String endpointUri,
            List<String> rawSourceFields,
            int latencyMs,
            String status
    ) {}

    public record UnderwritingSimulationInput(
            String productId,
            String applicantName,
            int age,
            String gender,
            String occupationName,
            int occupationGrade,
            boolean isSmoker,
            double bmi,
            List<String> riskFactorCodes
    ) {}
}
