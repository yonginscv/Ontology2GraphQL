import React from 'react';
import {
  GraphQLExecutionLog,
  UnderwritingCase,
  UnderwritingRule,
} from '../types';
import { DECISION_OUTCOME_META, formatKRW, RISK_CATEGORY_META } from '../formatters';
import {
  Activity,
  BookOpen,
  Code2,
  ExternalLink,
  History,
  X,
} from 'lucide-react';

interface CaseHistoryAndRuleModalProps {
  activeModal: 'HISTORY' | 'RULES' | 'GRAPHQL_LOG' | null;
  cases: UnderwritingCase[];
  rules: UnderwritingRule[];
  latestLog: GraphQLExecutionLog | null;
  onClose: () => void;
  onSelectCaseFromHistory: (uwCase: UnderwritingCase) => void;
}

export const CaseHistoryAndRuleModal: React.FC<CaseHistoryAndRuleModalProps> = ({
  activeModal,
  cases,
  rules,
  latestLog,
  onClose,
  onSelectCaseFromHistory,
}) => {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {activeModal === 'HISTORY' && <History className="w-5 h-5 text-indigo-400" />}
            {activeModal === 'RULES' && <BookOpen className="w-5 h-5 text-emerald-400" />}
            {activeModal === 'GRAPHQL_LOG' && <Code2 className="w-5 h-5 text-amber-400" />}
            <div>
              <h3 className="text-sm font-bold">
                {activeModal === 'HISTORY' &&
                  `전체 언더라이팅 심사건 이력 (Query.underwritingCases · 총 ${cases.length}건)`}
                {activeModal === 'RULES' &&
                  `언더라이팅 인수심사 지침 마스터 (Query.underwritingRules · 총 ${rules.length}건)`}
                {activeModal === 'GRAPHQL_LOG' &&
                  `GraphQL 실행 쿼리 & 온톨로지 데이터 계보(Lineage) 인스펙터`}
              </h3>
              <p className="text-[11px] text-slate-400">
                backend/src/main/resources/schema.graphql 기반 실시간 연동 데이터
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeModal === 'HISTORY' && (
            <div className="space-y-2.5">
              {cases.map((c) => {
                const outMeta =
                  DECISION_OUTCOME_META[c.decision.decisionOutcome] ||
                  DECISION_OUTCOME_META.STANDARD_ACCEPT;

                return (
                  <div
                    key={c.caseId}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white flex items-center justify-between gap-4 transition shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {c.caseId}
                        </span>
                        <span className="text-xs text-slate-400">{c.applicationDate}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          채널: {c.channelType}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${outMeta.badgeClass}`}
                        >
                          {outMeta.label}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-slate-900">
                        고객: {c.targetApplicant.applicantName} ({c.targetApplicant.age}세,{' '}
                        {c.targetApplicant.occupationName}) → 상품: {c.targetProduct.productName}
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1">
                        {c.decision.underwriterComment}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[11px] text-slate-400">최종 월보험료</div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {c.decision.decisionOutcome === 'DECLINED'
                            ? '인수거절'
                            : formatKRW(c.decision.finalMonthlyPremium)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectCaseFromHistory(c);
                          onClose();
                        }}
                        className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                      >
                        <span>워크벤치로 불러오기</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeModal === 'RULES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rules.map((r) => {
                const catMeta = RISK_CATEGORY_META[r.targetRiskCategory] || {
                  label: r.targetRiskCategory,
                  colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
                };
                return (
                  <div
                    key={r.ruleId}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
                          {r.ruleId}
                        </span>
                        <span className="text-xs font-mono text-slate-500">{r.ruleCode}</span>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${catMeta.colorClass}`}
                      >
                        {catMeta.label}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{r.ruleName}</h4>

                    <div className="p-2 rounded-lg bg-slate-900 text-emerald-300 font-mono text-xs">
                      {r.conditionExpression}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500 font-medium">판정 액션 (actionType)</span>
                      <span className="font-mono font-bold text-indigo-700">{r.actionType}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-200">
                      {r.ruleDescription}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {activeModal === 'GRAPHQL_LOG' && (
            <div className="space-y-4">
              {!latestLog ? (
                <div className="text-center py-8 text-sm text-slate-400">
                  아직 실행된 GraphQL 요청 로그가 없습니다.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-slate-100 px-4 py-2.5 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono font-bold">
                        POST /graphql
                      </span>
                      <span className="font-bold text-slate-800">{latestLog.operationName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 font-mono">
                      <span>실행시각: {latestLog.timestamp}</span>
                      <span>응답시간: {latestLog.durationMs}ms</span>
                      <span>Lineage 단계: {latestLog.lineageSteps.length}개 서비스 호출</span>
                    </div>
                  </div>

                  {/* Ontology Lineage Steps */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      온톨로지 기반 마이크로서비스 호출 계보 (extensions.ontologyLineage)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {latestLog.lineageSteps.map((step) => (
                        <div
                          key={step.stepOrder}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-700">
                              #{step.stepOrder} {step.domainName} Domain
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              {step.httpMethod} ({step.latencyMs}ms)
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-800 truncate">
                            {step.graphqlFieldPath}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500 truncate">
                            Class: {step.ontologyClassUri}
                          </div>
                          <div className="font-mono text-[10px] text-indigo-600 truncate">
                            {step.sourceService} ({step.endpointUri})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Query & Response */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-1.5">
                        GraphQL Query / Mutation & Variables
                      </div>
                      <pre className="p-3 rounded-xl bg-slate-950 text-indigo-200 font-mono text-[11px] overflow-auto max-h-80">
                        {latestLog.variables
                          ? `// Variables:\n${JSON.stringify(
                              latestLog.variables,
                              null,
                              2
                            )}\n\n${latestLog.query}`
                          : latestLog.query}
                      </pre>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-1.5">
                        GraphQL Response Payload
                      </div>
                      <pre className="p-3 rounded-xl bg-slate-950 text-emerald-300 font-mono text-[11px] overflow-auto max-h-80">
                        {JSON.stringify(latestLog.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
