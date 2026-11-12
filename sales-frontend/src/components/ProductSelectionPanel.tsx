import React, { useState } from 'react';
import { InsuranceProduct, RiskFactor, UnderwritingSimulationInput } from '../types';
import {
  formatKRW,
  formatManwon,
  PRODUCT_CATEGORY_META,
  RISK_CATEGORY_META,
  UW_TRACK_META,
} from '../formatters';
import {
  translateApplicantName,
  translateBenefitTrigger,
  translateCoverageName,
  translateProductName,
  useLanguage,
} from '../i18n';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Shield,
  ShieldAlert,
  Sparkles,
  Tag,
} from 'lucide-react';

interface ProductSelectionPanelProps {
  products: InsuranceProduct[];
  selectedProductId: string;
  draftInput: UnderwritingSimulationInput;
  riskCatalog: RiskFactor[];
  onSelectProduct: (productId: string) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
}

export const ProductSelectionPanel: React.FC<ProductSelectionPanelProps> = ({
  products,
  selectedProductId,
  draftInput,
  riskCatalog,
  onSelectProduct,
  onPrevStep,
  onNextStep,
}) => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [expandedCoverageIds, setExpandedCoverageIds] = useState<Record<string, boolean>>({});

  const selectedProduct =
    products.find((p) => p.productId === selectedProductId) || products[0] || null;

  const filteredProducts = products.filter((p) =>
    categoryFilter === 'ALL' ? true : p.productCategory === categoryFilter
  );

  // Identify risk categories held by current customer
  const customerActiveRiskFactors = riskCatalog.filter((rf) =>
    draftInput.riskFactorCodes.includes(rf.factorCode)
  );
  const customerRiskCategories = new Set(
    customerActiveRiskFactors.map((rf) => rf.riskCategory)
  );
  if (draftInput.occupationGrade === 3) {
    customerRiskCategories.add('OCCUPATIONAL');
  }

  const hasAngina = draftInput.riskFactorCodes.includes('I20_ANGINA_HISTORY');
  const hasChronic =
    draftInput.riskFactorCodes.includes('I10_HYPERTENSION') ||
    draftInput.riskFactorCodes.includes('E11_DIABETES');

  const toggleCoverageExpand = (covId: string) => {
    setExpandedCoverageIds((prev) => ({
      ...prev,
      [covId]: prev[covId] === undefined ? false : !prev[covId],
    }));
  };

  const displayedApplicantName = translateApplicantName(
    draftInput.applicantName,
    draftInput.applicantName,
    lang
  );
  const displayedSelectedProductName = selectedProduct
    ? translateProductName(selectedProduct.productId, selectedProduct.productName, lang)
    : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Step Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
            STEP 2
          </span>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {isKo
                ? '청약 보험상품 선택 및 담보·급부 적합성 분석'
                : 'Select Insurance Product & Analyze Coverage Suitability'}
            </h2>
            <p className="text-xs text-slate-500">
              {isKo ? (
                <>
                  STEP 1에서 선택한 고객(<strong>{displayedApplicantName}</strong>,{' '}
                  {draftInput.age}세)의 위험요소와 상품별 담보(
                  <code className="text-indigo-600 font-mono">hasCoverage</code>)·급부(
                  <code className="text-indigo-600 font-mono">hasBenefit</code>)를 비교하고 상품을 선택하세요.
                </>
              ) : (
                <>
                  Compare the risk profile of <strong>{displayedApplicantName}</strong> (Age{' '}
                  {draftInput.age}) against product coverages (
                  <code className="text-indigo-600 font-mono">hasCoverage</code>) and benefits (
                  <code className="text-indigo-600 font-mono">hasBenefit</code>) to select a plan.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs">
          {[
            { code: 'ALL', label: isKo ? '전체 상품' : 'All Products' },
            {
              code: 'COMPREHENSIVE_HEALTH',
              label: isKo ? '종합건강보험' : 'Comprehensive Health',
            },
            {
              code: 'SIMPLIFIED_ISSUE',
              label: isKo ? '3·2·5 유병자 간편' : '3·2·5 Simplified',
            },
            {
              code: 'DRIVER_ACCIDENT',
              label: isKo ? '상해·운전자' : 'Accident & Driver',
            },
          ].map((tab) => (
            <button
              key={tab.code}
              type="button"
              onClick={() => setCategoryFilter(tab.code)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                categoryFilter === tab.code
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Wizard Step Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column (5 cols): Insurance Product Cards */}
          <div className="col-span-12 lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {isKo
                  ? `2-A. 판매 상품 카탈로그 (${filteredProducts.length}종)`
                  : `2-A. Product Catalog (${filteredProducts.length} Plans)`}
              </h3>
              <span className="text-[11px] text-slate-400">
                {isKo ? '심사할 상품을 선택하세요' : 'Select a product to evaluate'}
              </span>
            </div>

            <div className="space-y-3">
              {filteredProducts.map((prod) => {
                const isSelected = prod.productId === selectedProductId;
                const catMeta = PRODUCT_CATEGORY_META[prod.productCategory] || {
                  label: prod.productCategory,
                  enLabel: prod.productCategory,
                  badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  shortDesc: '',
                  enShortDesc: '',
                };
                const trackMeta = UW_TRACK_META[prod.underwritingTrack] || {
                  label: prod.underwritingTrack,
                  enLabel: prod.underwritingTrack,
                  badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                };

                const isAgeEligible = draftInput.age <= prod.maxEligibleAge;
                const isSimplifiedTrack = prod.underwritingTrack === 'SIMPLIFIED_325';

                let suitabilityBadge: {
                  text: string;
                  tone: 'warn' | 'recommend' | 'ok';
                } | null = null;
                if (!isAgeEligible) {
                  suitabilityBadge = {
                    text: isKo
                      ? `가입연령 초과 (최대 ${prod.maxEligibleAge}세)`
                      : `Exceeds Max Age (Max ${prod.maxEligibleAge}y)`,
                    tone: 'warn',
                  };
                } else if (hasAngina && !isSimplifiedTrack) {
                  suitabilityBadge = {
                    text: isKo
                      ? '협심증 이력 — 표준형 인수거절 예상'
                      : 'Angina History — Standard Decline Expected',
                    tone: 'warn',
                  };
                } else if ((hasAngina || hasChronic) && isSimplifiedTrack) {
                  suitabilityBadge = {
                    text: isKo
                      ? '유병자·만성질환 맞춤 추천 트랙'
                      : 'Recommended Track for Chronic Conditions',
                    tone: 'recommend',
                  };
                } else {
                  suitabilityBadge = {
                    text: isKo
                      ? '가입연령 및 심사트랙 적격'
                      : 'Eligible Age & Underwriting Track',
                    tone: 'ok',
                  };
                }

                const prodName = translateProductName(
                  prod.productId,
                  prod.productName,
                  lang
                );

                return (
                  <div
                    key={prod.productId}
                    onClick={() => onSelectProduct(prod.productId)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/15 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catMeta.badgeClass}`}
                          >
                            {isKo ? catMeta.label : catMeta.enLabel}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${trackMeta.badgeClass}`}
                          >
                            {isKo ? trackMeta.label : trackMeta.enLabel}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {prod.productCode}
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 pt-0.5">
                          {prodName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {isKo ? catMeta.shortDesc : catMeta.enShortDesc}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-slate-400 font-medium">
                          {isKo ? '기본 월보험료' : 'Base Monthly'}
                        </div>
                        <div className="text-base font-extrabold text-indigo-700">
                          {formatKRW(prod.baseMonthlyPremium, lang)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isKo
                            ? `최대 ${prod.maxEligibleAge}세 가입`
                            : `Up to Age ${prod.maxEligibleAge}`}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        <span>
                          {isKo ? (
                            <>
                              담보 <strong>{prod.hasCoverage.length}개</strong> (주계약{' '}
                              {prod.hasCoverage.filter((c) => c.isMandatory).length} · 특약{' '}
                              {prod.hasCoverage.filter((c) => !c.isMandatory).length})
                            </>
                          ) : (
                            <>
                              <strong>{prod.hasCoverage.length}</strong> Coverages (Main{' '}
                              {prod.hasCoverage.filter((c) => c.isMandatory).length} · Riders{' '}
                              {prod.hasCoverage.filter((c) => !c.isMandatory).length})
                            </>
                          )}
                        </span>
                      </div>

                      {suitabilityBadge && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            suitabilityBadge.tone === 'warn'
                              ? 'bg-rose-100 text-rose-700'
                              : suitabilityBadge.tone === 'recommend'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {suitabilityBadge.tone === 'warn' ? (
                            <AlertCircle className="w-3.5 h-3.5" />
                          ) : suitabilityBadge.tone === 'recommend' ? (
                            <Sparkles className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          {suitabilityBadge.text}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (7 cols): Selected Product Coverages & Benefits Detail */}
          <div className="col-span-12 lg:col-span-7 space-y-3">
            {selectedProduct && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isKo
                        ? `2-B. [${displayedSelectedProductName}] 구성 담보 및 급부 조건 상세`
                        : `2-B. [${displayedSelectedProductName}] Coverages & Benefit Conditions`}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    {isKo
                      ? '고객 고지 위험요소와 민감도가 겹치는 담보는 주황색으로 표시됩니다'
                      : 'Coverages sensitive to the customer’s disclosed risks are highlighted in amber'}
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedProduct.hasCoverage.map((cov) => {
                    const isSensitiveMatch = customerRiskCategories.has(
                      cov.sensitiveRiskCategory
                    );
                    const riskCatMeta = RISK_CATEGORY_META[cov.sensitiveRiskCategory] || {
                      label: cov.sensitiveRiskCategory,
                      enLabel: cov.sensitiveRiskCategory,
                      colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
                    };
                    const isExpanded = expandedCoverageIds[cov.coverageId] !== false;
                    const covName = translateCoverageName(
                      cov.coverageId,
                      cov.coverageName,
                      lang
                    );

                    return (
                      <div
                        key={cov.coverageId}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          isSensitiveMatch
                            ? 'border-amber-300 bg-amber-50/40 shadow-2xs'
                            : 'border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleCoverageExpand(cov.coverageId)}
                          className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-100/60 transition"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  cov.isMandatory
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {cov.isMandatory
                                  ? isKo
                                    ? '주계약 (필수)'
                                    : 'Main Contract (Mandatory)'
                                  : isKo
                                  ? '선택특약'
                                  : 'Optional Rider'}
                              </span>
                              <span className="text-xs font-mono text-slate-500">
                                {cov.coverageCode}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${riskCatMeta.colorClass}`}
                              >
                                {isKo
                                  ? `민감위험: ${riskCatMeta.label}`
                                  : `Sensitive Risk: ${riskCatMeta.enLabel}`}
                              </span>
                              {isSensitiveMatch && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                  <ShieldAlert className="w-3.5 h-3.5" />{' '}
                                  {isKo
                                    ? '고객 고지 위험요소 연동 집중심사 담보'
                                    : 'Matched Disclosed Risk — Focused UW Review'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-extrabold text-slate-900 pt-0.5">
                              {covName}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-[10px] text-slate-400">
                                {isKo ? '최대 가입한도' : 'Max Insured Limit'}
                              </div>
                              <div className="text-sm font-extrabold text-slate-800">
                                {formatManwon(cov.maxInsuredAmount, lang)}
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-slate-200/60 bg-white space-y-2">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              {isKo
                                ? `보장 급부 지급 조건 (hasBenefit · ${cov.hasBenefit.length}건)`
                                : `Benefit Payment Conditions (hasBenefit · ${cov.hasBenefit.length})`}
                            </div>
                            {cov.hasBenefit.map((bnf) => {
                              const triggerText = translateBenefitTrigger(
                                bnf.benefitId,
                                bnf.triggerEvent,
                                lang
                              );
                              return (
                                <div
                                  key={bnf.benefitId}
                                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="space-y-1">
                                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                      <Tag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                      <span>{triggerText}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 pl-5">
                                      <span className="inline-flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        {isKo ? '면책기간:' : 'Waiting Period:'}{' '}
                                        <strong>
                                          {bnf.waitingPeriodDays > 0
                                            ? isKo
                                              ? `${bnf.waitingPeriodDays}일`
                                              : `${bnf.waitingPeriodDays} days`
                                            : isKo
                                            ? '없음 (즉시 보장)'
                                            : 'None (Immediate)'}
                                        </strong>
                                      </span>
                                      <span>·</span>
                                      <span>
                                        {isKo ? '50% 감액기간:' : '50% Reduction Period:'}{' '}
                                        <strong>
                                          {bnf.reductionPeriodMonths > 0
                                            ? isKo
                                              ? `${bnf.reductionPeriodMonths}개월`
                                              : `${bnf.reductionPeriodMonths} mos`
                                            : isKo
                                            ? '없음'
                                            : 'None'}
                                        </strong>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="inline-block px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-200">
                                      {isKo ? '지급액 ' : 'Payout '}
                                      {formatManwon(bnf.payoutAmount, lang)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Wizard Step 2 Footer Bar */}
      <div className="px-6 py-4 bg-slate-900 text-white border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <button
          type="button"
          onClick={onPrevStep}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs inline-flex items-center gap-2 border border-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {isKo ? '이전: 고객 선택 및 고지사항' : 'Back: Customer & Disclosures'}
          </span>
        </button>

        <div className="hidden md:flex items-center gap-3 text-xs">
          <span className="text-slate-400">
            {isKo ? '청약 설계 조합:' : 'Selected Combination:'}
          </span>
          <span className="font-bold text-indigo-300">
            {isKo
              ? `${displayedApplicantName} (${draftInput.age}세)`
              : `${displayedApplicantName} (Age ${draftInput.age})`}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-bold text-emerald-300">
            {displayedSelectedProductName} (
            {isKo ? '기본 ' : 'Base '}
            {formatKRW(selectedProduct?.baseMonthlyPremium || 0, lang)}
            {isKo ? '/월' : '/mo'})
          </span>
        </div>

        <button
          type="button"
          onClick={onNextStep}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-lg transition"
        >
          <span>
            {isKo ? '다음: 언더라이팅 심사 실행' : 'Next: Run Underwriting Evaluation'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
