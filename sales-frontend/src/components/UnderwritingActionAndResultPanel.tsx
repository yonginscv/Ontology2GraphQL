import React, { useState } from 'react';
import {
  InsuranceProduct,
  UnderwritingCase,
  UnderwritingSimulationInput,
} from '../types';
import {
  DECISION_OUTCOME_META,
  formatKRW,
  RISK_GRADE_META,
  UW_TRACK_META,
} from '../formatters';
import {
  AlertOctagon,
  ArrowRight,
  Bot,
  Calculator,
  Check,
  CheckCircle2,
  ClipboardCopy,
  FileCheck2,
  Gavel,
  Loader2,
  Play,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  UserCheck,
} from 'lucide-react';

interface UnderwritingActionAndResultPanelProps {
  draftInput: UnderwritingSimulationInput;
  selectedProduct: InsuranceProduct | null;
  activeCase: UnderwritingCase | null;
  previousCaseForComparison: UnderwritingCase | null;
  isSimulating: boolean;
  onRunUnderwriting: (overrideProductId?: string) => void;
}

export const UnderwritingActionAndResultPanel: React.FC<
  UnderwritingActionAndResultPanelProps
> = ({
  draftInput,
  selectedProduct,
  activeCase,
  previousCaseForComparison,
  isSimulating,
  onRunUnderwriting,
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);

  const decision = activeCase?.decision;
  const outcomeMeta = decision
    ? DECISION_OUTCOME_META[decision.decisionOutcome] || DECISION_OUTCOME_META.STANDARD_ACCEPT
    : null;

  // Check if current Input differs from what's inside activeCase
  const isDraftDirty =
    !activeCase ||
    activeCase.targetProduct.productId !== draftInput.productId ||
    activeCase.targetApplicant.applicantName !== draftInput.applicantName ||
    activeCase.targetApplicant.age !== draftInput.age ||
    activeCase.targetApplicant.occupationGrade !== draftInput.occupationGrade ||
    activeCase.targetApplicant.isSmoker !== draftInput.isSmoker ||
    activeCase.targetApplicant.hasRiskFactor
      .map((r) => r.factorCode)
      .sort()
      .join(',') !== [...draftInput.riskFactorCodes].sort().join(',');

  // Recommend 3.2.5 simplified product if declined or heavily loaded on a standard product
  const canRecommendSimplified =
    activeCase &&
    activeCase.targetProduct.underwritingTrack === 'STANDARD' &&
    (activeCase.decision.decisionOutcome === 'DECLINED' ||
      activeCase.decision.decisionOutcome === 'SUBSTANDARD_LOADING');

  const handleCopyCustomerProposal = () => {
    if (!activeCase) return;
    const text = [
      `[언더라이팅 인수심사 결과 안내서]`,
      `• 심사번호: ${activeCase.caseId} (${activeCase.applicationDate})`,
      `• 피보험자: ${activeCase.targetApplicant.applicantName} (${activeCase.targetApplicant.age}세, ${activeCase.targetApplicant.occupationName} / 상해${activeCase.targetApplicant.occupationGrade}급)`,
      `• 청약상품: ${activeCase.targetProduct.productName} (${activeCase.targetProduct.productCode})`,
      `• 심사판정: ${
        DECISION_OUTCOME_META[activeCase.decision.decisionOutcome]?.label ||
        activeCase.decision.decisionOutcome
      } (${activeCase.decision.automatedDecision ? 'AI 무인자동심사 STP' : '심사역 정밀심사'})`,
      `• 월 납입보험료: ${formatKRW(activeCase.decision.finalMonthlyPremium)} (기본 ${formatKRW(
        activeCase.targetProduct.baseMonthlyPremium
      )} / 할증 +${formatKRW(activeCase.decision.surchargeAmount)}, ${
        activeCase.decision.loadingPercentage
      }%)`,
      activeCase.decision.exclusionClauses.length > 0
        ? `• 부담보/제한조건: ${activeCase.decision.exclusionClauses.join(', ')}`
        : `• 부담보/제한조건: 없음 (전 담보 정상 보장)`,
      `• 심사소견: ${activeCase.decision.underwriterComment}`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Step Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            3
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">언더라이팅 인수심사 실행 및 판정</h2>
            <p className="text-[11px] text-slate-500">
              GraphQL <code className="text-indigo-600 font-mono">simulateUnderwriting</code> ·{' '}
              <code className="text-indigo-600 font-mono">UnderwritingDecision</code>
            </p>
          </div>
        </div>

        {activeCase && (
          <button
            type="button"
            onClick={handleCopyCustomerProposal}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-sm"
          >
            {copiedSummary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">안내문 복사됨</span>
              </>
            ) : (
              <>
                <ClipboardCopy className="w-3.5 h-3.5 text-slate-500" />
                <span>고객 안내문 복사</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Top Sticky Action Bar: Selected Customer x Product Summary + Execute Button */}
      <div className="p-3.5 bg-slate-900 text-white border-b border-slate-800 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-semibold shrink-0">
              고객
            </span>
            <span className="font-bold truncate">
              {draftInput.applicantName} ({draftInput.age}세 · {draftInput.occupationGrade}급 · 위험요소{' '}
              {draftInput.riskFactorCodes.length}건)
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold shrink-0">
              상품
            </span>
            <span className="font-bold truncate">
              {selectedProduct?.productName || draftInput.productId}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={isSimulating}
          onClick={() => onRunUnderwriting()}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
            isSimulating
              ? 'bg-indigo-700 text-indigo-200 cursor-wait'
              : isDraftDirty
              ? 'bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white ring-2 ring-indigo-300/40'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {isSimulating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>3개 도메인(Product · Risk · Underwriting) 통합 인수심사 실행 중...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>
                {isDraftDirty
                  ? '선택한 고객·상품 조건으로 실시간 언더라이팅 심사 실행'
                  : '언더라이팅 재심사 실행'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Scrollable Result Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!activeCase || !decision || !outcomeMeta ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 space-y-2">
            <Scale className="w-10 h-10 text-slate-300 stroke-1" />
            <div className="text-sm font-bold text-slate-600">
              언더라이팅 심사 대기 중
            </div>
            <p className="text-xs text-slate-400 max-w-xs">
              좌측에서 고객과 고지사항을 선택하고, 중앙에서 상품을 선택한 뒤 상단 심사 실행 버튼을 눌러주세요.
            </p>
          </div>
        ) : (
          <>
            {isDraftDirty && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-800">
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    고객 조건 또는 상품이 변경되었습니다. <strong>심사 실행</strong>을 누르면 최신 조건이 반영됩니다.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRunUnderwriting()}
                  className="px-2 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] shrink-0 hover:bg-amber-700"
                >
                  즉시 반영
                </button>
              </div>
            )}

            {/* 1. Primary Underwriting Decision Banner */}
            <div className={`p-4 rounded-2xl border-2 ${outcomeMeta.cardBg} space-y-3`}>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-sm ${outcomeMeta.badgeClass}`}
                    >
                      {outcomeMeta.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        decision.automatedDecision
                          ? 'bg-white/90 text-teal-700 border-teal-300'
                          : 'bg-white/90 text-amber-800 border-amber-300'
                      }`}
                    >
                      {decision.automatedDecision ? (
                        <>
                          <Bot className="w-3 h-3" /> 무인 자동심사(STP) 완료
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3 h-3" /> 심사역 조건부 확인
                        </>
                      )}
                    </span>
                  </div>
                  <p className={`text-xs font-medium ${outcomeMeta.accentText}`}>
                    {outcomeMeta.subtitle}
                  </p>
                </div>

                <div className="text-right shrink-0 font-mono text-[10px] text-slate-500">
                  <div>{activeCase.caseId}</div>
                  <div>{activeCase.applicationDate}</div>
                </div>
              </div>

              {/* Premium Calculation Receipt Box */}
              <div className="bg-white/95 rounded-xl p-3 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <span className="font-semibold flex items-center gap-1 text-slate-700">
                    <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                    월 납입보험료 산출 명세 ({activeCase.targetProduct.productName})
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {UW_TRACK_META[activeCase.targetProduct.underwritingTrack]?.label ||
                      activeCase.targetProduct.underwritingTrack}
                  </span>
                </div>

                {decision.decisionOutcome === 'DECLINED' ? (
                  <div className="py-2 text-center text-xs font-bold text-rose-600">
                    인수거절 판정으로 보험료가 산출되지 않습니다 (청약 불가)
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 pt-2.5 text-center">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-400">표준 기본보험료</div>
                      <div className="text-xs font-bold text-slate-700 mt-0.5">
                        {formatKRW(activeCase.targetProduct.baseMonthlyPremium)}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-400">
                        위험할증 ({decision.loadingPercentage.toFixed(1)}%)
                      </div>
                      <div
                        className={`text-xs font-bold mt-0.5 ${
                          decision.surchargeAmount > 0 ? 'text-amber-700' : 'text-emerald-600'
                        }`}
                      >
                        {decision.surchargeAmount > 0
                          ? `+${formatKRW(decision.surchargeAmount)}`
                          : '할증 없음 (0원)'}
                      </div>
                    </div>
                    <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-200">
                      <div className="text-[10px] text-indigo-600 font-semibold">
                        최종 월 납입보험료
                      </div>
                      <div className="text-sm font-extrabold text-indigo-700 mt-0.5">
                        {formatKRW(decision.finalMonthlyPremium)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Smart Alternative Recommendation Banner (Standard -> 3.2.5 Simplified Issue) */}
            {canRecommendSimplified && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-900 to-emerald-900 text-white shadow-md space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Sparkles className="w-4 h-4" />
                    <span>영업사원 AI 대안 설계 가이드 (청약 거절·할증 방어)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-mono">
                    PROD-SIMP-002
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  현재 고객({activeCase.targetApplicant.applicantName})님은 표준심사 트랙에서{' '}
                  <strong className="text-amber-300">
                    {decision.decisionOutcome === 'DECLINED'
                      ? '인수거절'
                      : `${decision.loadingPercentage}% 할증 및 조건부`}
                  </strong>{' '}
                  판정을 받았습니다. <strong>「무배당 3·2·5 원패스 유병자 간편건강보험」</strong>으로 전환하여 재심사하면 만성질환 무할증 승낙 또는 완화된 조건으로 즉시 청약 유도가 가능합니다.
                </p>
                <button
                  type="button"
                  onClick={() => onRunUnderwriting('PROD-SIMP-002')}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>3·2·5 유병자 간편건강보험으로 원클릭 전환 재심사</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Side-by-Side Comparison when switched from a previous case for the same customer */}
            {previousCaseForComparison &&
              previousCaseForComparison.caseId !== activeCase.caseId &&
              previousCaseForComparison.targetApplicant.applicantName ===
                activeCase.targetApplicant.applicantName && (
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                  <div className="text-xs font-bold text-indigo-900 flex items-center justify-between">
                    <span>직전 심사 vs 현재 심사 상품 비교</span>
                    <span className="text-[10px] text-indigo-600 font-normal">
                      동일 고객({activeCase.targetApplicant.applicantName}) 플랜 비교
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-semibold">직전 심사 상품</div>
                      <div className="font-bold text-slate-800 truncate">
                        {previousCaseForComparison.targetProduct.productName}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-rose-600">
                          {DECISION_OUTCOME_META[
                            previousCaseForComparison.decision.decisionOutcome
                          ]?.label.split(' ')[0] ||
                            previousCaseForComparison.decision.decisionOutcome}
                        </span>
                        <span className="font-bold text-slate-700">
                          {previousCaseForComparison.decision.decisionOutcome === 'DECLINED'
                            ? '가입불가'
                            : formatKRW(previousCaseForComparison.decision.finalMonthlyPremium)}
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border-2 border-indigo-500">
                      <div className="text-[10px] text-indigo-600 font-semibold">현재 심사 상품</div>
                      <div className="font-bold text-slate-900 truncate">
                        {activeCase.targetProduct.productName}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-600">
                          {outcomeMeta.label.split(' ')[0]}
                        </span>
                        <span className="font-extrabold text-indigo-700">
                          {decision.decisionOutcome === 'DECLINED'
                            ? '가입불가'
                            : formatKRW(decision.finalMonthlyPremium)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* 3. Exclusion Clauses (특정부위/질병 부담보 및 제한 조건) */}
            <div className="rounded-xl border border-slate-200 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  부과된 부담보 및 보장 제한 조건 (exclusionClauses)
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {decision.exclusionClauses.length}건
                </span>
              </div>

              {decision.exclusionClauses.length === 0 ? (
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  특정부위 부담보 및 보장 감액 조건 없이 전 담보 표준 보장됩니다.
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {decision.exclusionClauses.map((clause, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 font-semibold flex items-start gap-2"
                    >
                      <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{clause}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 4. Underwriter / AI Comment */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                심사역 / AI 종합 심사 소견 (underwriterComment)
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/80">
                {decision.underwriterComment}
              </p>
            </div>

            {/* 5. Triggered Underwriting Rules (matchedRules) */}
            <div className="rounded-xl border border-slate-200 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Gavel className="w-4 h-4 text-indigo-600" />
                  적용된 인수심사 규칙 (matchedRules)
                </span>
                <span className="text-[11px] text-slate-500">
                  {activeCase.matchedRules.length}개 룰 적중
                </span>
              </div>

              <div className="space-y-2">
                {activeCase.matchedRules.map((rule) => (
                  <div
                    key={rule.ruleId}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {rule.ruleId}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {rule.ruleCode}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rule.actionType === 'DECLINE'
                            ? 'bg-rose-100 text-rose-700'
                            : rule.actionType === 'ACCEPT'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        액션: {rule.actionType}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">{rule.ruleName}</div>
                    <div className="text-[11px] font-mono text-indigo-700 bg-indigo-50/80 px-2 py-1 rounded border border-indigo-100">
                      조건식: {rule.conditionExpression}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {rule.ruleDescription}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Evaluated Applicant Risk Assessment Summary */}
            <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  피보험자 리스크 스코어링 결과 (targetApplicant.riskAssessment)
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {activeCase.targetApplicant.riskAssessment.scoringModelVersion}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400">종합 위험점수</div>
                  <div className="text-xs font-extrabold text-slate-900">
                    {activeCase.targetApplicant.riskAssessment.totalRiskScore}점 / 100
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400">산출 위험등급</div>
                  <div className="text-xs font-bold text-indigo-700">
                    {RISK_GRADE_META[activeCase.targetApplicant.riskAssessment.riskGrade]?.label.split(
                      ' ('
                    )[0] || activeCase.targetApplicant.riskAssessment.riskGrade}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400">표준 대비 할증배수</div>
                  <div className="text-xs font-bold text-slate-800">
                    {activeCase.targetApplicant.riskAssessment.mortalityLoadingRatio.toFixed(2)}배
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
