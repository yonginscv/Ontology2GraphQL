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
  translateApplicantName,
  translateExclusionClause,
  translateOccupationName,
  translateProductName,
  translateRuleDescription,
  translateRuleName,
  translateUnderwriterComment,
  useLanguage,
} from '../i18n';
import {
  AlertOctagon,
  ArrowLeft,
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
  RotateCcw,
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
  onPrevStep: () => void;
  onRestartWizard: () => void;
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
  onPrevStep,
  onRestartWizard,
}) => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  const [copiedSummary, setCopiedSummary] = useState(false);

  const decision = activeCase?.decision;
  const outcomeMeta = decision
    ? DECISION_OUTCOME_META[decision.decisionOutcome] ||
      DECISION_OUTCOME_META.STANDARD_ACCEPT
    : null;

  // Recommend 3.2.5 simplified product if declined or heavily loaded on a standard product
  const canRecommendSimplified =
    activeCase &&
    activeCase.targetProduct.underwritingTrack === 'STANDARD' &&
    (activeCase.decision.decisionOutcome === 'DECLINED' ||
      activeCase.decision.decisionOutcome === 'SUBSTANDARD_LOADING');

  const handleCopyCustomerProposal = () => {
    if (!activeCase) return;
    const applName = translateApplicantName(
      activeCase.targetApplicant.applicantId,
      activeCase.targetApplicant.applicantName,
      lang
    );
    const applOcc = translateOccupationName(
      activeCase.targetApplicant.occupationName,
      lang
    );
    const prodName = translateProductName(
      activeCase.targetProduct.productId,
      activeCase.targetProduct.productName,
      lang
    );
    const outMeta = DECISION_OUTCOME_META[activeCase.decision.decisionOutcome];
    const outLabel = isKo
      ? outMeta?.label || activeCase.decision.decisionOutcome
      : outMeta?.enLabel || activeCase.decision.decisionOutcome;
    const exclusionsTranslated = activeCase.decision.exclusionClauses.map((c) =>
      translateExclusionClause(c, lang)
    );
    const commentTranslated = translateUnderwriterComment(activeCase, lang);

    const text = isKo
      ? [
          `[언더라이팅 인수심사 결과 안내서]`,
          `• 심사번호: ${activeCase.caseId} (${activeCase.applicationDate})`,
          `• 피보험자: ${applName} (${activeCase.targetApplicant.age}세, ${applOcc} / 상해${activeCase.targetApplicant.occupationGrade}급)`,
          `• 청약상품: ${prodName} (${activeCase.targetProduct.productCode})`,
          `• 심사판정: ${outLabel} (${
            activeCase.decision.automatedDecision
              ? 'AI 무인자동심사 STP'
              : '심사역 정밀심사'
          })`,
          `• 월 납입보험료: ${formatKRW(
            activeCase.decision.finalMonthlyPremium,
            'ko'
          )} (기본 ${formatKRW(
            activeCase.targetProduct.baseMonthlyPremium,
            'ko'
          )} / 할증 +${formatKRW(
            activeCase.decision.surchargeAmount,
            'ko'
          )}, ${activeCase.decision.loadingPercentage}%)`,
          exclusionsTranslated.length > 0
            ? `• 부담보/제한조건: ${exclusionsTranslated.join(', ')}`
            : `• 부담보/제한조건: 없음 (전 담보 정상 보장)`,
          `• 심사소견: ${commentTranslated}`,
        ].join('\n')
      : [
          `[Underwriting Evaluation Summary]`,
          `• Case ID: ${activeCase.caseId} (${activeCase.applicationDate})`,
          `• Insured Applicant: ${applName} (Age ${activeCase.targetApplicant.age}, ${applOcc} / Grade ${activeCase.targetApplicant.occupationGrade})`,
          `• Product: ${prodName} (${activeCase.targetProduct.productCode})`,
          `• Decision: ${outLabel} (${
            activeCase.decision.automatedDecision
              ? 'AI Automated STP'
              : 'Underwriter Manual Review'
          })`,
          `• Monthly Premium: ${formatKRW(
            activeCase.decision.finalMonthlyPremium,
            'en'
          )} (Base ${formatKRW(
            activeCase.targetProduct.baseMonthlyPremium,
            'en'
          )} / Surcharge +${formatKRW(
            activeCase.decision.surchargeAmount,
            'en'
          )}, ${activeCase.decision.loadingPercentage}%)`,
          exclusionsTranslated.length > 0
            ? `• Exclusions / Restrictions: ${exclusionsTranslated.join(', ')}`
            : `• Exclusions / Restrictions: None (Full Standard Coverage)`,
          `• Underwriter Comment: ${commentTranslated}`,
        ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const displayedDraftApplicantName = translateApplicantName(
    draftInput.applicantName,
    draftInput.applicantName,
    lang
  );
  const displayedSelectedProductName = selectedProduct
    ? translateProductName(selectedProduct.productId, selectedProduct.productName, lang)
    : draftInput.productId;

  const activeCaseApplicantName = activeCase
    ? translateApplicantName(
        activeCase.targetApplicant.applicantId,
        activeCase.targetApplicant.applicantName,
        lang
      )
    : '';
  const activeCaseProductName = activeCase
    ? translateProductName(
        activeCase.targetProduct.productId,
        activeCase.targetProduct.productName,
        lang
      )
    : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Step Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
            STEP 3
          </span>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {isKo
                ? '언더라이팅 인수심사 결과 및 대안 플랜 리포트'
                : 'Underwriting Decision & Alternative Plan Report'}
            </h2>
            <p className="text-xs text-slate-500">
              {isKo ? (
                <>
                  고객(<strong>{displayedDraftApplicantName}</strong>) × 상품(
                  <strong>{displayedSelectedProductName}</strong>) 조합에 대한 실시간 GraphQL{' '}
                  <code className="text-indigo-600 font-mono">simulateUnderwriting</code> 심사 판정 결과입니다.
                </>
              ) : (
                <>
                  Real-time GraphQL{' '}
                  <code className="text-indigo-600 font-mono">simulateUnderwriting</code>{' '}
                  decision for <strong>{displayedDraftApplicantName}</strong> ×{' '}
                  <strong>{displayedSelectedProductName}</strong>.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSimulating}
            onClick={() => onRunUnderwriting()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
          >
            {isSimulating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>
              {isKo ? '현재 조건으로 재심사 실행' : 'Re-run Underwriting'}
            </span>
          </button>

          {activeCase && (
            <button
              type="button"
              onClick={handleCopyCustomerProposal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">
                    {isKo ? '안내문 복사됨' : 'Proposal Copied'}
                  </span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {isKo ? '고객 안내문 복사' : 'Copy Customer Proposal'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Wizard Step 3 Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {isSimulating ? (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <div className="text-base font-extrabold text-slate-800">
              {isKo
                ? '3개 도메인(Product · Risk · Underwriting) 통합 언더라이팅 심사 중...'
                : 'Running Cross-Domain Underwriting (Product · Risk · Underwriting)...'}
            </div>
            <p className="text-xs text-slate-500">
              {isKo
                ? '고객 위험요소 스코어링 및 상품별 인수심사 규칙(UnderwritingRule)을 매칭하고 있습니다.'
                : 'Scoring customer risk factors and matching product-specific underwriting rules (UnderwritingRule).'}
            </p>
          </div>
        ) : !activeCase || !decision || !outcomeMeta ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-3">
            <Scale className="w-12 h-12 text-slate-300 stroke-1" />
            <div className="text-sm font-bold text-slate-600">
              {isKo ? '언더라이팅 심사 준비 완료' : 'Ready for Underwriting Evaluation'}
            </div>
            <button
              type="button"
              onClick={() => onRunUnderwriting()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs inline-flex items-center gap-2 shadow"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {isKo ? '지금 언더라이팅 심사 실행하기' : 'Run Underwriting Now'}
              </span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column (6 cols): Decision Outcome, Premium Receipt, Alternative Recommendation, Exclusions */}
            <div className="col-span-12 lg:col-span-6 space-y-4">
              {/* 1. Primary Underwriting Decision Banner */}
              <div className={`p-5 rounded-2xl border-2 ${outcomeMeta.cardBg} space-y-4`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full shadow-sm ${outcomeMeta.badgeClass}`}
                      >
                        {isKo ? outcomeMeta.label : outcomeMeta.enLabel}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          decision.automatedDecision
                            ? 'bg-white/90 text-teal-700 border-teal-300'
                            : 'bg-white/90 text-amber-800 border-amber-300'
                        }`}
                      >
                        {decision.automatedDecision ? (
                          <>
                            <Bot className="w-3.5 h-3.5" />{' '}
                            {isKo
                              ? '무인 자동심사(STP) 완료'
                              : 'Automated STP Approved'}
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />{' '}
                            {isKo
                              ? '심사역 조건부 확인'
                              : 'Underwriter Review'}
                          </>
                        )}
                      </span>
                    </div>
                    <p className={`text-xs font-semibold ${outcomeMeta.accentText}`}>
                      {isKo ? outcomeMeta.subtitle : outcomeMeta.enSubtitle}
                    </p>
                  </div>

                  <div className="text-right shrink-0 font-mono text-xs text-slate-500">
                    <div className="font-bold text-slate-700">{activeCase.caseId}</div>
                    <div>{activeCase.applicationDate}</div>
                  </div>
                </div>

                {/* Premium Calculation Receipt Box */}
                <div className="bg-white/95 rounded-xl p-4 border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2.5 border-b border-slate-100">
                    <span className="font-bold flex items-center gap-1.5 text-slate-800">
                      <Calculator className="w-4 h-4 text-indigo-600" />
                      {isKo
                        ? `월 납입보험료 산출 명세 (${activeCaseProductName})`
                        : `Monthly Premium Breakdown (${activeCaseProductName})`}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {isKo
                        ? UW_TRACK_META[activeCase.targetProduct.underwritingTrack]?.label ||
                          activeCase.targetProduct.underwritingTrack
                        : UW_TRACK_META[activeCase.targetProduct.underwritingTrack]?.enLabel ||
                          activeCase.targetProduct.underwritingTrack}
                    </span>
                  </div>

                  {decision.decisionOutcome === 'DECLINED' ? (
                    <div className="py-3 text-center text-xs font-extrabold text-rose-600">
                      {isKo
                        ? '인수거절 판정으로 보험료가 산출되지 않습니다 (해당 상품 청약 불가)'
                        : 'No premium calculated due to underwriting decline (Ineligible for enrollment)'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 pt-3 text-center">
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <div className="text-[11px] text-slate-400">
                          {isKo ? '표준 기본보험료' : 'Base Premium'}
                        </div>
                        <div className="text-sm font-bold text-slate-700 mt-0.5">
                          {formatKRW(activeCase.targetProduct.baseMonthlyPremium, lang)}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <div className="text-[11px] text-slate-400">
                          {isKo
                            ? `위험할증 (${decision.loadingPercentage.toFixed(1)}%)`
                            : `Risk Surcharge (${decision.loadingPercentage.toFixed(1)}%)`}
                        </div>
                        <div
                          className={`text-sm font-bold mt-0.5 ${
                            decision.surchargeAmount > 0
                              ? 'text-amber-700'
                              : 'text-emerald-600'
                          }`}
                        >
                          {decision.surchargeAmount > 0
                            ? `+${formatKRW(decision.surchargeAmount, lang)}`
                            : isKo
                            ? '할증 없음 (0원)'
                            : 'No Surcharge (KRW 0)'}
                        </div>
                      </div>
                      <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
                        <div className="text-[11px] text-indigo-600 font-bold">
                          {isKo ? '최종 월 납입보험료' : 'Final Monthly Premium'}
                        </div>
                        <div className="text-base font-extrabold text-indigo-700 mt-0.5">
                          {formatKRW(decision.finalMonthlyPremium, lang)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Smart Alternative Recommendation Banner */}
              {canRecommendSimplified && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-900 to-emerald-900 text-white shadow-md space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {isKo
                          ? '영업사원 AI 대안 설계 가이드 (청약 거절·할증 방어)'
                          : 'AI Alternative Plan Recommendation (Save Declined / Loaded Case)'}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-mono">
                      PROD-SIMP-002
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {isKo ? (
                      <>
                        현재 고객({activeCaseApplicantName})님은 표준심사 트랙에서{' '}
                        <strong className="text-amber-300">
                          {decision.decisionOutcome === 'DECLINED'
                            ? '인수거절'
                            : `${decision.loadingPercentage}% 할증 및 조건부`}
                        </strong>{' '}
                        판정을 받았습니다.{' '}
                        <strong>「무배당 3·2·5 원패스 유병자 간편건강보험」</strong>으로 전환하여 재심사하면 만성질환 무할증 승낙 또는 완화된 조건으로 즉시 청약 유도가 가능합니다.
                      </>
                    ) : (
                      <>
                        Applicant <strong>{activeCaseApplicantName}</strong> received a{' '}
                        <strong className="text-amber-300">
                          {decision.decisionOutcome === 'DECLINED'
                            ? 'Declined'
                            : `${decision.loadingPercentage}% Surcharge & Conditional`}
                        </strong>{' '}
                        decision on the Standard Track. Switching to{' '}
                        <strong>
                          &ldquo;Non-Par 3·2·5 One-Pass Simplified Issue Health Insurance&rdquo;
                        </strong>{' '}
                        enables immediate standard approval or relaxed terms for chronic conditions.
                      </>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => onRunUnderwriting('PROD-SIMP-002')}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition shadow"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isKo
                        ? '3·2·5 유병자 간편건강보험으로 원클릭 전환 재심사'
                        : '1-Click Re-evaluate with 3·2·5 Simplified Health Plan'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Side-by-Side Comparison when switched from a previous case */}
              {previousCaseForComparison &&
                previousCaseForComparison.caseId !== activeCase.caseId &&
                previousCaseForComparison.targetApplicant.applicantName ===
                  activeCase.targetApplicant.applicantName && (
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2.5">
                    <div className="text-xs font-bold text-indigo-900 flex items-center justify-between">
                      <span>
                        {isKo
                          ? '직전 심사 vs 현재 심사 상품 비교'
                          : 'Previous vs. Current Plan Comparison'}
                      </span>
                      <span className="text-[11px] text-indigo-600 font-normal">
                        {isKo
                          ? `동일 고객(${activeCaseApplicantName}) 플랜 비교`
                          : `Same Applicant (${activeCaseApplicantName})`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-semibold">
                          {isKo ? '직전 심사 상품' : 'Previous Plan'}
                        </div>
                        <div className="font-bold text-slate-800 truncate mt-0.5">
                          {translateProductName(
                            previousCaseForComparison.targetProduct.productId,
                            previousCaseForComparison.targetProduct.productName,
                            lang
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-xs font-semibold text-rose-600">
                            {isKo
                              ? DECISION_OUTCOME_META[
                                  previousCaseForComparison.decision.decisionOutcome
                                ]?.label.split(' ')[0] ||
                                previousCaseForComparison.decision.decisionOutcome
                              : DECISION_OUTCOME_META[
                                  previousCaseForComparison.decision.decisionOutcome
                                ]?.enLabel.split(' (')[0] ||
                                previousCaseForComparison.decision.decisionOutcome}
                          </span>
                          <span className="font-bold text-slate-700">
                            {previousCaseForComparison.decision.decisionOutcome ===
                            'DECLINED'
                              ? isKo
                                ? '가입불가'
                                : 'Declined'
                              : formatKRW(
                                  previousCaseForComparison.decision.finalMonthlyPremium,
                                  lang
                                )}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-white border-2 border-indigo-500">
                        <div className="text-[10px] text-indigo-600 font-semibold">
                          {isKo ? '현재 심사 상품' : 'Current Plan'}
                        </div>
                        <div className="font-bold text-slate-900 truncate mt-0.5">
                          {activeCaseProductName}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-600">
                            {isKo
                              ? outcomeMeta.label.split(' ')[0]
                              : outcomeMeta.enLabel.split(' (')[0]}
                          </span>
                          <span className="font-extrabold text-indigo-700">
                            {decision.decisionOutcome === 'DECLINED'
                              ? isKo
                                ? '가입불가'
                                : 'Declined'
                              : formatKRW(decision.finalMonthlyPremium, lang)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* 3. Exclusion Clauses */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    {isKo
                      ? '부과된 부담보 및 보장 제한 조건 (exclusionClauses)'
                      : 'Imposed Exclusions & Coverage Restrictions (exclusionClauses)'}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {isKo
                      ? `${decision.exclusionClauses.length}건`
                      : `${decision.exclusionClauses.length} item(s)`}
                  </span>
                </div>

                {decision.exclusionClauses.length === 0 ? (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {isKo
                      ? '특정부위 부담보 및 보장 감액 조건 없이 전 담보 표준 보장됩니다.'
                      : 'Full standard coverage applies across all riders with no organ exclusions or benefit reductions.'}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {decision.exclusionClauses.map((clause, idx) => (
                      <li
                        key={idx}
                        className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 font-semibold flex items-start gap-2"
                      >
                        <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{translateExclusionClause(clause, lang)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 4. Underwriter / AI Comment */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-indigo-600" />
                  {isKo
                    ? '심사역 / AI 종합 심사 소견 (underwriterComment)'
                    : 'Underwriter / AI Assessment Summary (underwriterComment)'}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                  {translateUnderwriterComment(activeCase, lang)}
                </p>
              </div>
            </div>

            {/* Right Column (6 cols): Applicant Risk Assessment & Triggered Underwriting Rules */}
            <div className="col-span-12 lg:col-span-6 space-y-4">
              {/* 5. Evaluated Applicant Risk Assessment Summary */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800">
                    {isKo
                      ? '피보험자 리스크 스코어링 결과 (targetApplicant.riskAssessment)'
                      : 'Applicant Risk Scoring Result (targetApplicant.riskAssessment)'}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {activeCase.targetApplicant.riskAssessment.scoringModelVersion}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-400">
                      {isKo ? '종합 위험점수' : 'Total Risk Score'}
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {isKo
                        ? `${activeCase.targetApplicant.riskAssessment.totalRiskScore}점 / 100`
                        : `${activeCase.targetApplicant.riskAssessment.totalRiskScore} / 100 pts`}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-400">
                      {isKo ? '산출 위험등급' : 'Evaluated Risk Grade'}
                    </div>
                    <div className="text-sm font-bold text-indigo-700 mt-0.5">
                      {isKo
                        ? RISK_GRADE_META[
                            activeCase.targetApplicant.riskAssessment.riskGrade
                          ]?.label.split(' (')[0] ||
                          activeCase.targetApplicant.riskAssessment.riskGrade
                        : RISK_GRADE_META[
                            activeCase.targetApplicant.riskAssessment.riskGrade
                          ]?.enLabel.split(' (')[0] ||
                          activeCase.targetApplicant.riskAssessment.riskGrade}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-400">
                      {isKo ? '표준 대비 할증배수' : 'Loading Multiplier'}
                    </div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                      {activeCase.targetApplicant.riskAssessment.mortalityLoadingRatio.toFixed(
                        2
                      )}
                      {isKo ? '배' : 'x'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Triggered Underwriting Rules (matchedRules) */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Gavel className="w-4 h-4 text-indigo-600" />
                    {isKo
                      ? '적용된 인수심사 규칙 상세 (matchedRules)'
                      : 'Triggered Underwriting Rules (matchedRules)'}
                  </span>
                  <span className="text-xs font-semibold text-indigo-600">
                    {isKo
                      ? `${activeCase.matchedRules.length}개 룰 적중`
                      : `${activeCase.matchedRules.length} Rule(s) Matched`}
                  </span>
                </div>

                <div className="space-y-3">
                  {activeCase.matchedRules.map((rule) => (
                    <div
                      key={rule.ruleId}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                            {rule.ruleId}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            {rule.ruleCode}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            rule.actionType === 'DECLINE'
                              ? 'bg-rose-100 text-rose-700'
                              : rule.actionType === 'ACCEPT'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isKo ? '판정 액션: ' : 'Action: '}
                          {rule.actionType}
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {translateRuleName(rule.ruleId, rule.ruleName, lang)}
                      </div>
                      <div className="text-xs font-mono text-indigo-700 bg-indigo-50/80 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                        {isKo ? '조건식: ' : 'Condition: '}
                        {rule.conditionExpression}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {translateRuleDescription(rule.ruleId, rule.ruleDescription, lang)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Step 3 Footer Bar */}
      <div className="px-6 py-4 bg-slate-900 text-white border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <button
          type="button"
          onClick={onPrevStep}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs inline-flex items-center gap-2 border border-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {isKo ? '이전: 보험상품 다시 선택' : 'Back: Re-select Product'}
          </span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRestartWizard}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs inline-flex items-center gap-2 border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              {isKo ? '처음부터 새로 심사하기 (STEP 1)' : 'Start Over from Step 1'}
            </span>
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={() => onRunUnderwriting()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-lg transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {isKo ? '언더라이팅 재심사 실행' : 'Re-run Underwriting'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
