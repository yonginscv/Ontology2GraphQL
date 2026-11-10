import React, { useEffect, useState } from 'react';
import {
  ApplicantProfile,
  GraphQLExecutionLog,
  InsuranceProduct,
  UnderwritingCase,
  UnderwritingRule,
  UnderwritingSimulationInput,
} from './types';
import {
  fetchSalesWorkbenchData,
  RISK_FACTOR_MASTER_CATALOG,
  runUnderwritingSimulation,
} from './graphqlClient';
import { CustomerSelectionPanel } from './components/CustomerSelectionPanel';
import { ProductSelectionPanel } from './components/ProductSelectionPanel';
import { UnderwritingActionAndResultPanel } from './components/UnderwritingActionAndResultPanel';
import { CaseHistoryAndRuleModal } from './components/CaseHistoryAndRuleModal';
import {
  AlertCircle,
  BookOpen,
  BriefcaseBusiness,
  Code2,
  History,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

export const App: React.FC = () => {
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [applicants, setApplicants] = useState<ApplicantProfile[]>([]);
  const [rules, setRules] = useState<UnderwritingRule[]>([]);
  const [cases, setCases] = useState<UnderwritingCase[]>([]);

  const [isLoadingInit, setIsLoadingInit] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const [selectedApplicantId, setSelectedApplicantId] = useState<string | 'CUSTOM'>('APPL-1002');
  const [draftInput, setDraftInput] = useState<UnderwritingSimulationInput>({
    productId: 'PROD-HLT-001',
    applicantName: '박서연',
    age: 52,
    gender: 'F',
    occupationName: '약국 개국 약사',
    occupationGrade: 1,
    isSmoker: false,
    bmi: 25.9,
    riskFactorCodes: ['I10_HYPERTENSION', 'E11_DIABETES'],
  });

  const [activeCase, setActiveCase] = useState<UnderwritingCase | null>(null);
  const [previousCaseForComparison, setPreviousCaseForComparison] =
    useState<UnderwritingCase | null>(null);
  const [latestLog, setLatestLog] = useState<GraphQLExecutionLog | null>(null);
  const [activeModal, setActiveModal] = useState<'HISTORY' | 'RULES' | 'GRAPHQL_LOG' | null>(null);

  const loadWorkbenchData = async () => {
    setIsLoadingInit(true);
    setErrorMessage(null);
    try {
      const result = await fetchSalesWorkbenchData();
      const { insuranceProducts, applicantProfiles, underwritingRules, underwritingCases } =
        result.data;

      setProducts(insuranceProducts);
      setApplicants(applicantProfiles);
      setRules(underwritingRules);
      setCases(underwritingCases);
      setLatestLog(result.log);

      // Default to APPL-1002 (박서연) and her existing case UW-CASE-2026-002 if available
      const defaultApplicant =
        applicantProfiles.find((a) => a.applicantId === 'APPL-1002') || applicantProfiles[0];
      const defaultProduct =
        insuranceProducts.find((p) => p.productId === 'PROD-HLT-001') || insuranceProducts[0];

      if (defaultApplicant && defaultProduct) {
        setSelectedApplicantId(defaultApplicant.applicantId);
        setDraftInput({
          productId: defaultProduct.productId,
          applicantName: defaultApplicant.applicantName,
          age: defaultApplicant.age,
          gender: defaultApplicant.gender,
          occupationName: defaultApplicant.occupationName,
          occupationGrade: defaultApplicant.occupationGrade,
          isSmoker: defaultApplicant.isSmoker,
          bmi: defaultApplicant.bmi,
          riskFactorCodes: defaultApplicant.hasRiskFactor.map((rf) => rf.factorCode),
        });
      }

      const matchingCase =
        underwritingCases.find((c) => c.caseId === 'UW-CASE-2026-002') || underwritingCases[0];
      if (matchingCase) {
        setActiveCase(matchingCase);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : '백엔드 GraphQL 서버(http://localhost:8080/graphql)에 연결할 수 없습니다.'
      );
    } finally {
      setIsLoadingInit(false);
    }
  };

  useEffect(() => {
    loadWorkbenchData();
  }, []);

  const handleSelectApplicant = (appl: ApplicantProfile) => {
    setSelectedApplicantId(appl.applicantId);
    setDraftInput((prev) => ({
      ...prev,
      applicantName: appl.applicantName,
      age: appl.age,
      gender: appl.gender,
      occupationName: appl.occupationName,
      occupationGrade: appl.occupationGrade,
      isSmoker: appl.isSmoker,
      bmi: appl.bmi,
      riskFactorCodes: appl.hasRiskFactor.map((rf) => rf.factorCode),
    }));

    // If there is a pre-existing case for this applicant + product, show it immediately
    const existingCase = cases.find(
      (c) =>
        c.targetApplicant.applicantId === appl.applicantId &&
        c.targetProduct.productId === draftInput.productId
    );
    if (existingCase) {
      setActiveCase(existingCase);
    }
  };

  const handleSwitchToCustomCustomer = () => {
    setSelectedApplicantId('CUSTOM');
    setDraftInput((prev) => ({
      ...prev,
      applicantName: '정하늘 (신규 가망고객)',
      age: 42,
      gender: 'M',
      occupationName: '자영업 카페 운영',
      occupationGrade: 1,
      isSmoker: false,
      bmi: 24.2,
      riskFactorCodes: ['I10_HYPERTENSION'],
    }));
  };

  const handleResetToSelectedApplicant = () => {
    const orig = applicants.find((a) => a.applicantId === selectedApplicantId);
    if (orig) {
      handleSelectApplicant(orig);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setDraftInput((prev) => ({ ...prev, productId }));
    // Check if there's an existing case matching current applicant + newly selected product
    if (selectedApplicantId !== 'CUSTOM') {
      const existingCase = cases.find(
        (c) =>
          c.targetApplicant.applicantId === selectedApplicantId &&
          c.targetProduct.productId === productId
      );
      if (existingCase) {
        if (activeCase && activeCase.caseId !== existingCase.caseId) {
          setPreviousCaseForComparison(activeCase);
        }
        setActiveCase(existingCase);
      }
    }
  };

  const handleRunUnderwriting = async (overrideProductId?: string) => {
    const payload: UnderwritingSimulationInput = overrideProductId
      ? { ...draftInput, productId: overrideProductId }
      : draftInput;

    if (overrideProductId) {
      setDraftInput(payload);
    }

    setIsSimulating(true);
    setErrorMessage(null);
    try {
      const result = await runUnderwritingSimulation(payload);
      const newCase = result.data.simulateUnderwriting;
      if (activeCase) {
        setPreviousCaseForComparison(activeCase);
      }
      setActiveCase(newCase);
      setLatestLog(result.log);

      // Prepend to case history
      setCases((prev) => [newCase, ...prev.filter((c) => c.caseId !== newCase.caseId)]);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : '언더라이팅 심사 실행 중 오류가 발생했습니다.'
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSelectCaseFromHistory = (uwCase: UnderwritingCase) => {
    setActiveCase(uwCase);
    const knownApplicant = applicants.find(
      (a) => a.applicantId === uwCase.targetApplicant.applicantId
    );
    setSelectedApplicantId(knownApplicant ? knownApplicant.applicantId : 'CUSTOM');
    setDraftInput({
      productId: uwCase.targetProduct.productId,
      applicantName: uwCase.targetApplicant.applicantName,
      age: uwCase.targetApplicant.age,
      gender: uwCase.targetApplicant.gender,
      occupationName: uwCase.targetApplicant.occupationName,
      occupationGrade: uwCase.targetApplicant.occupationGrade,
      isSmoker: uwCase.targetApplicant.isSmoker,
      bmi: uwCase.targetApplicant.bmi,
      riskFactorCodes: uwCase.targetApplicant.hasRiskFactor.map((rf) => rf.factorCode),
    });
  };

  const applyQuickScenario = (applicantId: string, productId: string) => {
    const appl = applicants.find((a) => a.applicantId === applicantId);
    if (!appl) return;
    setSelectedApplicantId(appl.applicantId);
    setDraftInput({
      productId,
      applicantName: appl.applicantName,
      age: appl.age,
      gender: appl.gender,
      occupationName: appl.occupationName,
      occupationGrade: appl.occupationGrade,
      isSmoker: appl.isSmoker,
      bmi: appl.bmi,
      riskFactorCodes: appl.hasRiskFactor.map((rf) => rf.factorCode),
    });
    const matched = cases.find(
      (c) =>
        c.targetApplicant.applicantId === applicantId && c.targetProduct.productId === productId
    );
    if (matched) {
      if (activeCase && activeCase.caseId !== matched.caseId) {
        setPreviousCaseForComparison(activeCase);
      }
      setActiveCase(matched);
    }
  };

  const selectedProduct =
    products.find((p) => p.productId === draftInput.productId) || products[0] || null;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 text-slate-900 overflow-hidden">
      {/* Top Global Sales Portal Header */}
      <header className="px-5 py-3 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-950">
            <BriefcaseBusiness className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-white">
                Smart FP 언더라이팅 워크벤치
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                영업사원용 가상 청약·인수심사 시스템
              </span>
              <span className="hidden md:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                GraphQL Schema (ins:InsuranceProductUnderwritingOntology)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              고객 선택 · 고지사항(위험요소) 점검 · 보험상품 담보 매칭 · AI/룰 실시간 언더라이팅 판정 및 대안설계
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveModal('HISTORY')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>심사 이력 ({cases.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('RULES')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>인수심사 지침 ({rules.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('GRAPHQL_LOG')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-mono font-semibold border border-indigo-500/40 transition"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              GraphQL & Lineage ({latestLog ? `${latestLog.lineageSteps.length} steps` : 'Ready'})
            </span>
          </button>
        </div>
      </header>

      {/* Sub-header: Sales Representative Quick Consultation Scenarios Bar */}
      <div className="px-5 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-3 overflow-x-auto shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
            <Zap className="w-3.5 h-3.5" /> 영업 현장 추천 시나리오
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyQuickScenario('APPL-1001', 'PROD-HLT-001')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition"
            >
              ① 김민준(34세·갑상선결절) × 표준 건강보험 [부담보 승낙]
            </button>
            <button
              type="button"
              onClick={() => applyQuickScenario('APPL-1002', 'PROD-HLT-001')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition"
            >
              ② 박서연(52세·고혈압+당뇨) × 표준 건강보험 [42% 할증]
            </button>
            <button
              type="button"
              onClick={() => applyQuickScenario('APPL-1002', 'PROD-SIMP-002')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
            >
              ③ 박서연(52세·고혈압+당뇨) × 3·2·5 간편보험 [무할증 자동승낙]
            </button>
            <button
              type="button"
              onClick={() => applyQuickScenario('APPL-1003', 'PROD-DRV-003')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition"
            >
              ④ 이태호(46세·현장직3급) × 상해·운전자보험 [한도제한+할증]
            </button>
            <button
              type="button"
              onClick={() => applyQuickScenario('APPL-1004', 'PROD-HLT-001')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition"
            >
              ⑤ 최영철(61세·협심증스텐트) × 표준 건강보험 [인수거절 → 대안설계]
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={loadWorkbenchData}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 font-semibold shrink-0"
          title="GraphQL 서버에서 최신 데이터 새로고침"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 새로고침
        </button>
      </div>

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="mx-5 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={loadWorkbenchData}
            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700"
          >
            재시도
          </button>
        </div>
      )}

      {/* Main 3-Column Sales Workbench */}
      <main className="flex-1 p-4 overflow-hidden">
        {isLoadingInit ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
            <Sparkles className="w-7 h-7 animate-spin text-indigo-600" />
            <div className="text-sm font-bold text-slate-700">
              GraphQL 게이트웨이에서 상품 카탈로그 · 고객 프로필 · 심사 규칙을 불러오는 중입니다...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4 h-full overflow-hidden">
            {/* Step 1: Customer & Risk Factors (4 cols) */}
            <div className="col-span-12 lg:col-span-4 h-full overflow-hidden">
              <CustomerSelectionPanel
                applicants={applicants}
                riskCatalog={RISK_FACTOR_MASTER_CATALOG}
                selectedApplicantId={selectedApplicantId}
                draftInput={draftInput}
                onSelectApplicant={handleSelectApplicant}
                onSwitchToCustomCustomer={handleSwitchToCustomCustomer}
                onChangeDraftInput={setDraftInput}
                onResetToSelectedApplicant={handleResetToSelectedApplicant}
              />
            </div>

            {/* Step 2: Insurance Product & Coverages (4 cols) */}
            <div className="col-span-12 lg:col-span-4 h-full overflow-hidden">
              <ProductSelectionPanel
                products={products}
                selectedProductId={draftInput.productId}
                draftInput={draftInput}
                riskCatalog={RISK_FACTOR_MASTER_CATALOG}
                onSelectProduct={handleSelectProduct}
              />
            </div>

            {/* Step 3: Underwriting Execution & Decision Report (4 cols) */}
            <div className="col-span-12 lg:col-span-4 h-full overflow-hidden">
              <UnderwritingActionAndResultPanel
                draftInput={draftInput}
                selectedProduct={selectedProduct}
                activeCase={activeCase}
                previousCaseForComparison={previousCaseForComparison}
                isSimulating={isSimulating}
                onRunUnderwriting={handleRunUnderwriting}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modals for History, Rules, and GraphQL/Lineage Inspector */}
      <CaseHistoryAndRuleModal
        activeModal={activeModal}
        cases={cases}
        rules={rules}
        latestLog={latestLog}
        onClose={() => setActiveModal(null)}
        onSelectCaseFromHistory={handleSelectCaseFromHistory}
      />
    </div>
  );
};

export default App;
