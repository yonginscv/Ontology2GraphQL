import React, { useState } from 'react';
import { LineageStep, RiskFactorCatalogItem } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  Play,
  ShieldAlert,
  Sparkles,
  UserCheck,
  XCircle,
  Workflow,
} from 'lucide-react';

interface Props {
  riskCatalog: RiskFactorCatalogItem[];
}

export const UnderwritingSimulatorTab: React.FC<Props> = ({ riskCatalog }) => {
  const [productId, setProductId] = useState('PROD-HLT-001');
  const [applicantName, setApplicantName] = useState('정현우');
  const [age, setAge] = useState(49);
  const [gender, setGender] = useState('M');
  const [occupationName, setOccupationName] = useState('기업 재무컨설턴트');
  const [occupationGrade, setOccupationGrade] = useState(1);
  const [isSmoker, setIsSmoker] = useState(false);
  const [bmi, setBmi] = useState(25.4);
  const [selectedRiskCodes, setSelectedRiskCodes] = useState<string[]>([
    'I10_HYPERTENSION',
    'E11_DIABETES',
  ]);
  const [protocol, setProtocol] = useState<'GRAPHQL' | 'REST'>('GRAPHQL');
  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [lineage, setLineage] = useState<LineageStep[]>([]);

  const toggleRiskCode = (code: string) => {
    setSelectedRiskCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const inputPayload = {
        productId,
        applicantName,
        age: Number(age),
        gender,
        occupationName,
        occupationGrade: Number(occupationGrade),
        isSmoker,
        bmi: Number(bmi),
        riskFactorCodes: selectedRiskCodes,
      };

      if (protocol === 'GRAPHQL') {
        const mutation = `
          mutation SimulateUW($input: UnderwritingSimulationInput!) {
            simulateUnderwriting(input: $input) {
              caseId
              applicationDate
              uwStatus
              targetProduct {
                productId
                productName
                underwritingTrack
                baseMonthlyPremium
              }
              targetApplicant {
                applicantName
                age
                occupationGrade
                hasRiskFactor {
                  factorCode
                  factorName
                  riskCategory
                  severityLevel
                  riskScoreContribution
                }
                riskAssessment {
                  totalRiskScore
                  riskGrade
                  mortalityLoadingRatio
                }
              }
              matchedRules {
                ruleCode
                ruleName
                actionType
                ruleDescription
              }
              decision {
                decisionOutcome
                finalMonthlyPremium
                surchargeAmount
                loadingPercentage
                exclusionClauses
                underwriterComment
                automatedDecision
              }
            }
          }
        `;
        const res = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: mutation, variables: { input: inputPayload } }),
        });
        const json = await res.json();
        setSimResult(json.data?.simulateUnderwriting);
        setLineage(json.extensions?.ontologyLineage || []);
      } else {
        const res = await fetch('/api/v1/underwriting/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inputPayload),
        });
        const json = await res.json();
        setSimResult(json.data);
        setLineage(json.lineage || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyScenarioQuickSet = (presetType: 'DECLINE_TO_SIMP' | 'THYROID_EXCL' | 'OCC_GRADE3') => {
    if (presetType === 'DECLINE_TO_SIMP') {
      setApplicantName('최영철');
      setAge(58);
      setOccupationName('개인택시 운수사업자');
      setOccupationGrade(2);
      setIsSmoker(true);
      setBmi(27.2);
      setSelectedRiskCodes(['I20_ANGINA_HISTORY', 'I10_HYPERTENSION']);
    } else if (presetType === 'THYROID_EXCL') {
      setApplicantName('김민준');
      setAge(35);
      setOccupationName('IT 클라우드 아키텍트');
      setOccupationGrade(1);
      setIsSmoker(false);
      setBmi(22.5);
      setSelectedRiskCodes(['D34_THYROID_NODULE']);
    } else {
      setApplicantName('이태호');
      setAge(46);
      setOccupationName('교량 철골 고소작업 시공기사');
      setOccupationGrade(3);
      setIsSmoker(true);
      setBmi(26.8);
      setProductId('PROD-DRV-003');
      setSelectedRiskCodes(['OCC_HIGH_ALTITUDE', 'DRV_SIGNAL_VIOLATION']);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full overflow-hidden">
      {/* Left: Input Form */}
      <div className="col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm text-white">
                언더라이팅(UW) & 리스크 실시간 인수심사 시뮬레이터
              </h3>
              <p className="text-[11px] text-slate-400">
                상품·위험·심사 3대 도메인 온톨로지 규칙에 따른 승낙/할증/부담보/거절 판정 실증
              </p>
            </div>
          </div>
        </div>

        {/* Quick Persona Presets */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            빠른 테스트 페르소나 불러오기
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => applyScenarioQuickSet('THYROID_EXCL')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/60 text-left"
            >
              <div className="font-semibold text-indigo-300">갑상선 결절 (35세)</div>
              <div className="text-[10px] text-slate-400">특정부위 부담보 승낙</div>
            </button>
            <button
              onClick={() => applyScenarioQuickSet('OCC_GRADE3')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/60 text-left"
            >
              <div className="font-semibold text-amber-300">고소작업 3급 (46세)</div>
              <div className="text-[10px] text-slate-400">직업할증 + 한도제한</div>
            </button>
            <button
              onClick={() => applyScenarioQuickSet('DECLINE_TO_SIMP')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/60 text-left"
            >
              <div className="font-semibold text-rose-300">협심증 스텐트 (58세)</div>
              <div className="text-[10px] text-slate-400">표준형 거절 vs 간편 승낙</div>
            </button>
          </div>
        </div>

        {/* Target Insurance Product */}
        <div>
          <label className="block text-xs font-semibold text-sky-300 mb-1.5">
            1. 청약 대상 보험상품 선택 (`ins:InsuranceProduct`)
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
          >
            <option value="PROD-HLT-001">
              [PROD-HLT-001] 무배당 시그니처 100세 종합건강보험 (표준심사 STANDARD 트랙 · 월 89,000원)
            </option>
            <option value="PROD-SIMP-002">
              [PROD-SIMP-002] 무배당 3·2·5 원패스 유병자 간편건강보험 (간편심사 SIMPLIFIED_325 트랙 · 월 114,000원)
            </option>
            <option value="PROD-DRV-003">
              [PROD-DRV-003] 무배당 프로케어 상해·운전자 종합보험 (표준심사 STANDARD 트랙 · 월 42,000원)
            </option>
          </select>
        </div>

        {/* Applicant Profile */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">피보험자 성명</label>
            <input
              type="text"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">보험나이 (`ins:age`)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              상해직업급수 (`ins:occupationGrade`)
            </label>
            <select
              value={occupationGrade}
              onChange={(e) => setOccupationGrade(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              <option value={1}>1급 (비위험 사무/전문직)</option>
              <option value={2}>2급 (외근/영업/운전직)</option>
              <option value={3}>3급 (고위험 건설/현장직)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">직업명</label>
            <input
              type="text"
              value={occupationName}
              onChange={(e) => setOccupationName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">체질량지수 (`ins:bmi`)</label>
            <input
              type="number"
              step="0.1"
              value={bmi}
              onChange={(e) => setBmi(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isSmoker}
                onChange={(e) => setIsSmoker(e.target.checked)}
                className="rounded border-slate-700"
              />
              현재 흡연자 (`ins:isSmoker`)
            </label>
          </div>
        </div>

        {/* Risk Factors Multi-Select */}
        <div>
          <label className="block text-xs font-semibold text-amber-300 mb-1.5">
            2. 고지사항 / 위험요소 선택 (`ins:hasRiskFactor` → `ins:RiskFactor`)
          </label>
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {riskCatalog.map((rf) => {
              const checked = selectedRiskCodes.includes(rf.factorCode);
              return (
                <div
                  key={rf.factorCode}
                  onClick={() => toggleRiskCode(rf.factorCode)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                    checked
                      ? 'bg-amber-950/40 border-amber-500/60 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold flex items-center gap-2">
                      <input type="checkbox" checked={checked} readOnly />
                      <span>{rf.factorName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 ml-5 mt-0.5">{rf.clinicalNote}</div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      +{rf.riskScoreContribution}점 ({rf.severityLevel})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Protocol Switch & Execute */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">호출 프로토콜:</span>
            <button
              onClick={() => setProtocol('GRAPHQL')}
              className={`px-2.5 py-1 rounded border font-mono text-[11px] ${
                protocol === 'GRAPHQL'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'border-slate-700 text-slate-400'
              }`}
            >
              GraphQL Mutation
            </button>
            <button
              onClick={() => setProtocol('REST')}
              className={`px-2.5 py-1 rounded border font-mono text-[11px] ${
                protocol === 'REST'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'border-slate-700 text-slate-400'
              }`}
            >
              Hybrid REST POST
            </button>
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-900/50 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {loading ? '심사 엔진 실행 중...' : '언더라이팅 인수심사 실행'}
          </button>
        </div>
      </div>

      {/* Right: Simulation Output & Lineage */}
      <div className="col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col overflow-y-auto space-y-4">
        {!simResult ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-8">
            <Sparkles className="w-10 h-10 text-indigo-400 mb-3" />
            <h4 className="text-base font-bold text-slate-200 mb-1">
              좌측에서 청약 상품과 피보험자 위험 조건을 선택한 뒤 심사를 실행하세요
            </h4>
            <p className="text-xs max-w-lg leading-relaxed">
              예: 동일한 <strong>고혈압 + 당뇨</strong> 조건에서 상품을{' '}
              <strong>표준형 종합건강보험(PROD-HLT-001)</strong>으로 선택했을 때(할증/부담보)와{' '}
              <strong>3·2·5 유병자 간편보험(PROD-SIMP-002)</strong>으로 변경했을 때(무할증 자동승낙)
              판정이 어떻게 달라지는지 즉시 비교할 수 있습니다.
            </p>
          </div>
        ) : (
          <>
            {/* Top Decision Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                simResult.decision.decisionOutcome === 'STANDARD_ACCEPT'
                  ? 'bg-emerald-950/50 border-emerald-500/60'
                  : simResult.decision.decisionOutcome === 'DECLINED'
                  ? 'bg-rose-950/50 border-rose-500/60'
                  : 'bg-amber-950/50 border-amber-500/60'
              }`}
            >
              <div className="flex items-center gap-3">
                {simResult.decision.decisionOutcome === 'STANDARD_ACCEPT' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : simResult.decision.decisionOutcome === 'DECLINED' ? (
                  <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950/80 text-slate-200">
                      {simResult.caseId}
                    </span>
                    <span className="text-base font-bold text-white">
                      최종 인수판정: {simResult.decision.decisionOutcome}
                    </span>
                    {simResult.decision.automatedDecision && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        STP 무인자동심사 완결
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 mt-1">
                    {simResult.decision.underwriterComment}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 ml-4">
                <div className="text-[11px] text-slate-300">최종 산출 월보험료</div>
                <div className="text-xl font-extrabold text-white">
                  {simResult.decision.finalMonthlyPremium.toLocaleString()}원
                </div>
                <div className="text-[11px] text-amber-300">
                  할증률 {simResult.decision.loadingPercentage}% (+
                  {simResult.decision.surchargeAmount.toLocaleString()}원)
                </div>
              </div>
            </div>

            {/* 3-Domain Cards Summary */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-sky-500/30 space-y-1">
                <div className="text-[11px] font-mono text-sky-400">
                  ins:InsuranceProduct (Product Svc)
                </div>
                <div className="font-bold text-white">{simResult.targetProduct.productName}</div>
                <div className="text-slate-400">
                  심사트랙:{' '}
                  <span className="text-sky-300 font-mono">
                    {simResult.targetProduct.underwritingTrack}
                  </span>
                </div>
                <div className="text-slate-400">
                  기본보험료: {simResult.targetProduct.baseMonthlyPremium.toLocaleString()}원
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/30 space-y-1">
                <div className="text-[11px] font-mono text-amber-400">
                  ins:RiskAssessment (Risk Svc)
                </div>
                <div className="font-bold text-white">
                  종합 위험점수: {simResult.targetApplicant.riskAssessment.totalRiskScore}점 / 100점
                </div>
                <div className="text-slate-400">
                  위험등급:{' '}
                  <span className="text-amber-300 font-mono">
                    {simResult.targetApplicant.riskAssessment.riskGrade}
                  </span>
                </div>
                <div className="text-slate-400">
                  위험할증지수: {simResult.targetApplicant.riskAssessment.mortalityLoadingRatio}x
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-violet-500/30 space-y-1">
                <div className="text-[11px] font-mono text-violet-400">
                  ins:UnderwritingRule (UW Svc)
                </div>
                <div className="font-bold text-white">
                  적용된 인수규칙 ({simResult.matchedRules.length}건)
                </div>
                {simResult.matchedRules.map((r: any) => (
                  <div key={r.ruleCode} className="text-violet-300 font-mono text-[11px]">
                    • {r.ruleCode} ({r.actionType})
                  </div>
                ))}
              </div>
            </div>

            {/* Exclusion Clauses */}
            {simResult.decision.exclusionClauses?.length > 0 && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/40">
                <div className="text-xs font-semibold text-rose-300 flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4" /> 부과된 특정부위/질병 부담보 및 인수제한 조건 (
                  `ins:exclusionClauses`)
                </div>
                <ul className="list-disc list-inside text-xs text-slate-200 space-y-1">
                  {simResult.decision.exclusionClauses.map((clause: string, i: number) => (
                    <li key={i}>{clause}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lineage Trace for Simulation */}
            <div className="flex-1 flex flex-col">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                <Workflow className="w-4 h-4 text-pink-400" />
                시뮬레이션 실행 시 발생한 3대 도메인 마이크로서비스 호출 계보 ({protocol})
              </div>
              <div className="space-y-2">
                {lineage.map((s) => (
                  <div
                    key={s.stepOrder}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-mono text-white font-semibold">
                        #{s.stepOrder} {s.graphqlFieldPath}{' '}
                        <span className="text-indigo-400">({s.ontologyClassUri})</span>
                      </div>
                      <div className="font-mono text-[11px] text-emerald-400">
                        {s.sourceService} → {s.httpMethod} {s.endpointUri}
                      </div>
                    </div>
                    <span className="font-mono text-amber-300 text-[11px]">{s.latencyMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
