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
import { OntologyViewerTab } from './components/OntologyViewerTab';
import { formatKRW } from './formatters';
import {
  AlertCircle,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Code2,
  History,
  Network,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
} from 'lucide-react';

export const App: React.FC = () => {
  const [mainView, setMainView] = useState<'WORKBENCH' | 'ONTOLOGY_VIEWER'>('WORKBENCH');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

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

      setCases((prev) => [newCase, ...prev.filter((c) => c.caseId !== newCase.caseId)]);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : '언더라이팅 심사 실행 중 오류가 발생했습니다.'
      );
    } finally {
      setIsSimulating(false);
    }
  };

  // Proceed from Step 2 -> Step 3 and trigger underwriting simulation
  const handleProceedToUnderwritingStep = async () => {
    setWizardStep(3);
    await handleRunUnderwriting();
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
    setWizardStep(3);
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
                3-Step 위자드 청약·인수심사 시스템
              </span>
              <span className="hidden md:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                GraphQL Schema (ins:InsuranceProductUnderwritingOntology)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              STEP 1 고객·고지사항 선택 → STEP 2 보험상품·담보 선택 → STEP 3 언더라이팅 심사 및 대안설계
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() =>
              setMainView((prev) => (prev === 'ONTOLOGY_VIEWER' ? 'WORKBENCH' : 'ONTOLOGY_VIEWER'))
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              mainView === 'ONTOLOGY_VIEWER'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>
              {mainView === 'ONTOLOGY_VIEWER'
                ? '← 언더라이팅 워크벤치로 돌아가기'
                : '온톨로지 뷰어 (Ontology Graph)'}
            </span>
          </button>

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

      {/* Wizard Stepper Progress Bar + Quick Scenario Presets */}
      <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* 3-Step Wizard Stepper Navigation */}
        <div className="flex items-center gap-2">
          {/* Step 1 Button */}
          <button
            type="button"
            onClick={() => setWizardStep(1)}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-left transition ${
              wizardStep === 1
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : wizardStep > 1
                ? 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100/70'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center ${
                wizardStep === 1
                  ? 'bg-white text-indigo-600'
                  : wizardStep > 1
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {wizardStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
            </span>
            <div>
              <div className="text-xs font-extrabold leading-tight">
                1단계: 고객 및 고지사항 선택
              </div>
              <div
                className={`text-[11px] ${
                  wizardStep === 1 ? 'text-indigo-100' : 'text-slate-500'
                }`}
              >
                {draftInput.applicantName} ({draftInput.age}세 · 위험요소{' '}
                {draftInput.riskFactorCodes.length}건)
              </div>
            </div>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

          {/* Step 2 Button */}
          <button
            type="button"
            onClick={() => setWizardStep(2)}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-left transition ${
              wizardStep === 2
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : wizardStep > 2
                ? 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100/70'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center ${
                wizardStep === 2
                  ? 'bg-white text-indigo-600'
                  : wizardStep > 2
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {wizardStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
            </span>
            <div>
              <div className="text-xs font-extrabold leading-tight">
                2단계: 보험상품 및 담보 선택
              </div>
              <div
                className={`text-[11px] truncate max-w-[190px] ${
                  wizardStep === 2 ? 'text-indigo-100' : 'text-slate-500'
                }`}
              >
                {selectedProduct
                  ? `${selectedProduct.productName} (${formatKRW(
                      selectedProduct.baseMonthlyPremium
                    )})`
                  : '상품 선택'}
              </div>
            </div>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

          {/* Step 3 Button */}
          <button
            type="button"
            onClick={handleProceedToUnderwritingStep}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-left transition ${
              wizardStep === 3
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center ${
                wizardStep === 3
                  ? 'bg-white text-emerald-700'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <div>
              <div className="text-xs font-extrabold leading-tight">
                3단계: 언더라이팅 심사 판정
              </div>
              <div
                className={`text-[11px] ${
                  wizardStep === 3 ? 'text-emerald-100' : 'text-slate-500'
                }`}
              >
                {activeCase ? `최근 판정: ${activeCase.decision.decisionOutcome}` : '심사 실행 대기'}
              </div>
            </div>
          </button>
        </div>

        {/* Quick Scenario Presets */}
        <div className="hidden xl:flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200">
            <Zap className="w-3 h-3" /> 빠른 시나리오 프리셋
          </span>
          <button
            type="button"
            onClick={() => applyQuickScenario('APPL-1001', 'PROD-HLT-001')}
            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition"
          >
            ① 김민준(갑상선결절)
          </button>
          <button
            type="button"
            onClick={() => applyQuickScenario('APPL-1002', 'PROD-HLT-001')}
            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition"
          >
            ② 박서연(고혈압+당뇨)
          </button>
          <button
            type="button"
            onClick={() => applyQuickScenario('APPL-1003', 'PROD-DRV-003')}
            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition"
          >
            ③ 이태호(현장직3급)
          </button>
          <button
            type="button"
            onClick={() => applyQuickScenario('APPL-1004', 'PROD-HLT-001')}
            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition"
          >
            ④ 최영철(협심증·거절대안)
          </button>
        </div>
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

      {/* Main Wizard Step Viewport or Ontology Graph Viewer */}
      {mainView === 'ONTOLOGY_VIEWER' ? (
        <main className="flex-1 p-4 overflow-hidden w-full">
          <OntologyViewerTab />
        </main>
      ) : (
        <main className="flex-1 p-5 overflow-hidden max-w-7xl w-full mx-auto">
          {isLoadingInit ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
              <Sparkles className="w-7 h-7 animate-spin text-indigo-600" />
              <div className="text-sm font-bold text-slate-700">
                GraphQL 게이트웨이에서 상품 카탈로그 · 고객 프로필 · 심사 규칙을 불러오는 중입니다...
              </div>
            </div>
          ) : wizardStep === 1 ? (
            <CustomerSelectionPanel
              applicants={applicants}
              riskCatalog={RISK_FACTOR_MASTER_CATALOG}
              selectedApplicantId={selectedApplicantId}
              draftInput={draftInput}
              onSelectApplicant={handleSelectApplicant}
              onSwitchToCustomCustomer={handleSwitchToCustomCustomer}
              onChangeDraftInput={setDraftInput}
              onResetToSelectedApplicant={handleResetToSelectedApplicant}
              onNextStep={() => setWizardStep(2)}
            />
          ) : wizardStep === 2 ? (
            <ProductSelectionPanel
              products={products}
              selectedProductId={draftInput.productId}
              draftInput={draftInput}
              riskCatalog={RISK_FACTOR_MASTER_CATALOG}
              onSelectProduct={handleSelectProduct}
              onPrevStep={() => setWizardStep(1)}
              onNextStep={handleProceedToUnderwritingStep}
            />
          ) : (
            <UnderwritingActionAndResultPanel
              draftInput={draftInput}
              selectedProduct={selectedProduct}
              activeCase={activeCase}
              previousCaseForComparison={previousCaseForComparison}
              isSimulating={isSimulating}
              onRunUnderwriting={handleRunUnderwriting}
              onPrevStep={() => setWizardStep(2)}
              onRestartWizard={() => setWizardStep(1)}
            />
          )}
        </main>
      )}

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
