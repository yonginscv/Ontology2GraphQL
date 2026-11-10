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
  AlertCircle,
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
}

export const ProductSelectionPanel: React.FC<ProductSelectionPanelProps> = ({
  products,
  selectedProductId,
  draftInput,
  riskCatalog,
  onSelectProduct,
}) => {
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
  const customerRiskCategories = new Set(customerActiveRiskFactors.map((rf) => rf.riskCategory));
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Step Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            2
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">보험상품 선택 및 담보·급부 분석</h2>
            <p className="text-[11px] text-slate-500">
              GraphQL <code className="text-indigo-600 font-mono">insuranceProducts</code> ·{' '}
              <code className="text-indigo-600 font-mono">hasCoverage</code> ·{' '}
              <code className="text-indigo-600 font-mono">hasBenefit</code>
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-[11px]">
          {[
            { code: 'ALL', label: '전체' },
            { code: 'COMPREHENSIVE_HEALTH', label: '종합건강' },
            { code: 'SIMPLIFIED_ISSUE', label: '3·2·5 간편' },
            { code: 'DRIVER_ACCIDENT', label: '상해·운전자' },
          ].map((tab) => (
            <button
              key={tab.code}
              type="button"
              onClick={() => setCategoryFilter(tab.code)}
              className={`px-2 py-1 rounded-md font-semibold transition ${
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

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Product Cards */}
        <div className="space-y-2.5">
          {filteredProducts.map((prod) => {
            const isSelected = prod.productId === selectedProductId;
            const catMeta = PRODUCT_CATEGORY_META[prod.productCategory] || {
              label: prod.productCategory,
              badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
              shortDesc: '',
            };
            const trackMeta = UW_TRACK_META[prod.underwritingTrack] || {
              label: prod.underwritingTrack,
              badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
            };

            const isAgeEligible = draftInput.age <= prod.maxEligibleAge;
            const isSimplifiedTrack = prod.underwritingTrack === 'SIMPLIFIED_325';

            // Pre-underwriting smart advisor hint for sales agent
            let suitabilityBadge: { text: string; tone: 'warn' | 'recommend' | 'ok' } | null = null;
            if (!isAgeEligible) {
              suitabilityBadge = {
                text: `가입연령 초과 (최대 ${prod.maxEligibleAge}세)`,
                tone: 'warn',
              };
            } else if (hasAngina && !isSimplifiedTrack) {
              suitabilityBadge = {
                text: '협심증 이력 — 표준형 인수거절 예상',
                tone: 'warn',
              };
            } else if ((hasAngina || hasChronic) && isSimplifiedTrack) {
              suitabilityBadge = {
                text: '유병자·만성질환 맞춤 추천 트랙',
                tone: 'recommend',
              };
            } else {
              suitabilityBadge = {
                text: '가입연령 및 심사트랙 적격',
                tone: 'ok',
              };
            }

            return (
              <div
                key={prod.productId}
                onClick={() => onSelectProduct(prod.productId)}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-indigo-50/60 border-indigo-500 ring-2 ring-indigo-500/15 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catMeta.badgeClass}`}
                      >
                        {catMeta.label}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${trackMeta.badgeClass}`}
                      >
                        {trackMeta.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {prod.productCode}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900">{prod.productName}</h3>
                    <p className="text-[11px] text-slate-500">{catMeta.shortDesc}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400 font-medium">기본 월보험료</div>
                    <div className="text-base font-extrabold text-indigo-700">
                      {formatKRW(prod.baseMonthlyPremium)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      최대 {prod.maxEligibleAge}세 가입
                    </div>
                  </div>
                </div>

                {/* Suitability & Coverage summary footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>
                      구성 담보 <strong>{prod.hasCoverage.length}개</strong> (주계약{' '}
                      {prod.hasCoverage.filter((c) => c.isMandatory).length} · 특약{' '}
                      {prod.hasCoverage.filter((c) => !c.isMandatory).length})
                    </span>
                  </div>

                  {suitabilityBadge && (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        suitabilityBadge.tone === 'warn'
                          ? 'bg-rose-100 text-rose-700'
                          : suitabilityBadge.tone === 'recommend'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {suitabilityBadge.tone === 'warn' ? (
                        <AlertCircle className="w-3 h-3" />
                      ) : suitabilityBadge.tone === 'recommend' ? (
                        <Sparkles className="w-3 h-3" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {suitabilityBadge.text}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Product Coverages & Benefits Breakdown */}
        {selectedProduct && (
          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900">
                  선택 상품 구성 담보 및 급부 상세 ({selectedProduct.hasCoverage.length}개 담보)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                고객 위험요소와 연관된 담보는 집중 심사 표시됩니다
              </span>
            </div>

            <div className="space-y-2">
              {selectedProduct.hasCoverage.map((cov) => {
                const isSensitiveMatch = customerRiskCategories.has(cov.sensitiveRiskCategory);
                const riskCatMeta = RISK_CATEGORY_META[cov.sensitiveRiskCategory] || {
                  label: cov.sensitiveRiskCategory,
                  colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
                };
                const isExpanded = expandedCoverageIds[cov.coverageId] !== false;

                return (
                  <div
                    key={cov.coverageId}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      isSensitiveMatch
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    {/* Coverage Header */}
                    <button
                      type="button"
                      onClick={() => toggleCoverageExpand(cov.coverageId)}
                      className="w-full p-3 text-left flex items-start justify-between gap-2 hover:bg-slate-100/60 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              cov.isMandatory
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {cov.isMandatory ? '주계약 (필수)' : '선택특약'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {cov.coverageCode}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${riskCatMeta.colorClass}`}
                          >
                            민감위험: {riskCatMeta.label.split(' ')[0]}
                          </span>
                          {isSensitiveMatch && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              <ShieldAlert className="w-3 h-3" /> 고객 고지 위험요소 연동 심사 대상
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-900">{cov.coverageName}</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">최대 가입한도</div>
                          <div className="text-xs font-extrabold text-slate-800">
                            {formatManwon(cov.maxInsuredAmount)}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Benefits List */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-200/60 bg-white space-y-1.5">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          보장 급부 지급 조건 (hasBenefit)
                        </div>
                        {cov.hasBenefit.map((bnf) => (
                          <div
                            key={bnf.benefitId}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <Tag className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span>{bnf.triggerEvent}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 pl-4">
                                <span className="inline-flex items-center gap-0.5">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  면책기간:{' '}
                                  {bnf.waitingPeriodDays > 0 ? `${bnf.waitingPeriodDays}일` : '없음'}
                                </span>
                                <span>·</span>
                                <span>
                                  50% 감액기간:{' '}
                                  {bnf.reductionPeriodMonths > 0
                                    ? `${bnf.reductionPeriodMonths}개월`
                                    : '없음'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200">
                                {formatManwon(bnf.payoutAmount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
