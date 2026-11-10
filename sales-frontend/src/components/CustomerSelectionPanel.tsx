import React, { useState } from 'react';
import { ApplicantProfile, RiskFactor, UnderwritingSimulationInput } from '../types';
import { RISK_CATEGORY_META, RISK_GRADE_META } from '../formatters';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Cigarette,
  FileSpreadsheet,
  HeartPulse,
  RotateCcw,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

interface CustomerSelectionPanelProps {
  applicants: ApplicantProfile[];
  riskCatalog: RiskFactor[];
  selectedApplicantId: string | 'CUSTOM';
  draftInput: UnderwritingSimulationInput;
  onSelectApplicant: (applicant: ApplicantProfile) => void;
  onSwitchToCustomCustomer: () => void;
  onChangeDraftInput: (updater: (prev: UnderwritingSimulationInput) => UnderwritingSimulationInput) => void;
  onResetToSelectedApplicant: () => void;
}

export const CustomerSelectionPanel: React.FC<CustomerSelectionPanelProps> = ({
  applicants,
  riskCatalog,
  selectedApplicantId,
  draftInput,
  onSelectApplicant,
  onSwitchToCustomCustomer,
  onChangeDraftInput,
  onResetToSelectedApplicant,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const selectedOriginal = applicants.find((a) => a.applicantId === selectedApplicantId) || null;

  const filteredApplicants = applicants.filter((a) => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) return true;
    return (
      a.applicantName.toLowerCase().includes(q) ||
      a.occupationName.toLowerCase().includes(q) ||
      a.applicantId.toLowerCase().includes(q) ||
      a.hasRiskFactor.some((rf) => rf.factorName.toLowerCase().includes(q))
    );
  });

  // Estimate live risk score preview based on Backend RiskMockProvider formula
  const computeEstimatedScore = (): {
    score: number;
    grade: string;
    loadingRatio: number;
  } => {
    let score = 0;
    if (draftInput.age >= 55) score += 12;
    else if (draftInput.age >= 45) score += 6;

    if (draftInput.isSmoker) score += 10;
    if (draftInput.bmi >= 28.0) score += 8;
    else if (draftInput.bmi >= 25.0) score += 4;

    if (draftInput.occupationGrade === 3) score += 12;
    else if (draftInput.occupationGrade === 2) score += 5;

    for (const code of draftInput.riskFactorCodes) {
      const rf = riskCatalog.find((r) => r.factorCode === code);
      if (rf) score += rf.riskScoreContribution;
    }

    const totalScore = Math.min(100, Math.max(5, score));
    let grade = 'PREFERRED';
    let loadingRatio = 1.0;

    if (totalScore <= 25) {
      grade = 'PREFERRED';
      loadingRatio = 1.0;
    } else if (totalScore <= 45) {
      grade = 'STANDARD';
      loadingRatio = 1.1;
    } else if (totalScore <= 65) {
      grade = 'SUBSTANDARD_A';
      loadingRatio = 1.28;
    } else if (totalScore <= 85) {
      grade = 'SUBSTANDARD_B';
      loadingRatio = 1.48;
    } else {
      grade = 'HIGH_RISK_DECLINE';
      loadingRatio = 2.1;
    }

    return { score: totalScore, grade, loadingRatio };
  };

  const liveEst = computeEstimatedScore();
  const gradeMeta = RISK_GRADE_META[liveEst.grade] || RISK_GRADE_META.STANDARD;

  const isModifiedFromOriginal =
    selectedOriginal &&
    (selectedOriginal.age !== draftInput.age ||
      selectedOriginal.gender !== draftInput.gender ||
      selectedOriginal.occupationGrade !== draftInput.occupationGrade ||
      selectedOriginal.isSmoker !== draftInput.isSmoker ||
      Math.abs(selectedOriginal.bmi - draftInput.bmi) > 0.05 ||
      selectedOriginal.hasRiskFactor.map((r) => r.factorCode).sort().join(',') !==
        [...draftInput.riskFactorCodes].sort().join(','));

  const toggleRiskFactorCode = (code: string) => {
    onChangeDraftInput((prev) => {
      const exists = prev.riskFactorCodes.includes(code);
      return {
        ...prev,
        riskFactorCodes: exists
          ? prev.riskFactorCodes.filter((c) => c !== code)
          : [...prev.riskFactorCodes, code],
      };
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Step Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            1
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">피보험자(고객) 선택 및 고지사항</h2>
            <p className="text-[11px] text-slate-500">
              GraphQL <code className="text-indigo-600 font-mono">applicantProfiles</code> 조회 및 위험요소 시뮬레이션
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => {
              if (selectedApplicantId === 'CUSTOM' && applicants.length > 0) {
                onSelectApplicant(applicants[0]);
              }
              setShowProfileEditor(false);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
              selectedApplicantId !== 'CUSTOM'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            등록 고객 ({applicants.length})
          </button>
          <button
            type="button"
            onClick={() => {
              onSwitchToCustomCustomer();
              setShowProfileEditor(true);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
              selectedApplicantId === 'CUSTOM'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            신규 직접입력
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Registered Customer List */}
        {selectedApplicantId !== 'CUSTOM' && (
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="고객명, 직업명, 보유 질환(고혈압, 당뇨 등) 검색..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {filteredApplicants.map((appl) => {
                const isSelected = appl.applicantId === selectedApplicantId;
                const gMeta =
                  RISK_GRADE_META[appl.riskAssessment.riskGrade] || RISK_GRADE_META.STANDARD;

                return (
                  <button
                    key={appl.applicantId}
                    type="button"
                    onClick={() => onSelectApplicant(appl)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-50/60 border-indigo-500 ring-2 ring-indigo-500/15 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {appl.applicantName.slice(0, 1)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900">
                              {appl.applicantName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({appl.age}세 · {appl.gender === 'M' ? '남' : '여'})
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                              {appl.applicantId}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span>{appl.occupationName}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                appl.occupationGrade === 3
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              상해 {appl.occupationGrade}급
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${gMeta.badgeClass}`}
                        >
                          위험도 {appl.riskAssessment.totalRiskScore}점
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          할증지수 {appl.riskAssessment.mortalityLoadingRatio.toFixed(2)}x
                        </div>
                      </div>
                    </div>

                    {/* Risk Factors Pills */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1">
                      {appl.isSmoker && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                          <Cigarette className="w-2.5 h-2.5" /> 흡연자
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        BMI {appl.bmi}
                      </span>
                      {appl.hasRiskFactor.map((rf) => (
                        <span
                          key={rf.riskFactorId}
                          className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium"
                        >
                          {rf.factorName.split(' (')[0]}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Customer Profile & Editable Simulation Parameters */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">
                청약 심사 대상자 인적·생체 프로필
              </span>
              {isModifiedFromOriginal && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                  조건 변경됨
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {isModifiedFromOriginal && (
                <button
                  type="button"
                  onClick={onResetToSelectedApplicant}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-indigo-600 font-medium"
                  title="원래 고객 정보로 복원"
                >
                  <RotateCcw className="w-3 h-3" /> 원래대로
                </button>
              )}
              {selectedApplicantId !== 'CUSTOM' && (
                <button
                  type="button"
                  onClick={() => setShowProfileEditor((v) => !v)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline"
                >
                  {showProfileEditor ? '인적사항 접기' : '인적사항 변경'}
                </button>
              )}
            </div>
          </div>

          {/* Live Risk Score Preview Bar */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">예상 종합 위험점수 (AI Risk Score)</span>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900">{liveEst.score} / 100점</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${gradeMeta.badgeClass}`}
                >
                  {gradeMeta.label}
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${gradeMeta.barColor}`}
                style={{ width: `${Math.min(100, liveEst.score)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>
                {draftInput.applicantName} ({draftInput.age}세, 상해 {draftInput.occupationGrade}급,{' '}
                {draftInput.isSmoker ? '흡연' : '비흡연'}, BMI {draftInput.bmi})
              </span>
              <span>예상 위험할증지수 {liveEst.loadingRatio.toFixed(2)}배</span>
            </div>
          </div>

          {/* Editable Demographic Fields (Always shown in CUSTOM mode, toggleable in Registered mode) */}
          {(selectedApplicantId === 'CUSTOM' || showProfileEditor) && (
            <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-200/80">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  고객 성명
                </label>
                <input
                  type="text"
                  value={draftInput.applicantName}
                  onChange={(e) =>
                    onChangeDraftInput((prev) => ({ ...prev, applicantName: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    보험나이(세)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={85}
                    value={draftInput.age}
                    onChange={(e) =>
                      onChangeDraftInput((prev) => ({
                        ...prev,
                        age: Number(e.target.value) || 30,
                      }))
                    }
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    성별
                  </label>
                  <select
                    value={draftInput.gender}
                    onChange={(e) =>
                      onChangeDraftInput((prev) => ({ ...prev, gender: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="M">남성 (M)</option>
                    <option value="F">여성 (F)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  직업명
                </label>
                <input
                  type="text"
                  value={draftInput.occupationName}
                  onChange={(e) =>
                    onChangeDraftInput((prev) => ({ ...prev, occupationName: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  상해 직업급수
                </label>
                <select
                  value={draftInput.occupationGrade}
                  onChange={(e) =>
                    onChangeDraftInput((prev) => ({
                      ...prev,
                      occupationGrade: Number(e.target.value),
                    }))
                  }
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                >
                  <option value={1}>1급 (사무직·전문직 비위험)</option>
                  <option value={2}>2급 (외근·현장관리 중위험)</option>
                  <option value={3}>3급 (건설·운수·고소작업 고위험)</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-600">현재 흡연 여부</span>
                <input
                  type="checkbox"
                  checked={draftInput.isSmoker}
                  onChange={(e) =>
                    onChangeDraftInput((prev) => ({ ...prev, isSmoker: e.target.checked }))
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 gap-2">
                <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                  BMI ({draftInput.bmi})
                </span>
                <input
                  type="range"
                  min={18}
                  max={35}
                  step={0.2}
                  value={draftInput.bmi}
                  onChange={(e) =>
                    onChangeDraftInput((prev) => ({ ...prev, bmi: Number(e.target.value) }))
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pre-contract Disclosure Risk Factors Checklist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-bold text-slate-800">
                계약 전 알릴 의무 (병력·직업·운전 위험요소 고지)
              </h3>
            </div>
            <span className="text-[11px] text-indigo-600 font-semibold">
              선택됨 {draftInput.riskFactorCodes.length}건
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            고객의 고지사항을 체크하거나 해제하여 언더라이팅 판정 변화를 즉시 시뮬레이션할 수 있습니다.
          </p>

          <div className="space-y-1.5">
            {riskCatalog.map((rf) => {
              const checked = draftInput.riskFactorCodes.includes(rf.factorCode);
              const catMeta = RISK_CATEGORY_META[rf.riskCategory] || {
                label: rf.riskCategory,
                colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
              };

              return (
                <div
                  key={rf.factorCode}
                  onClick={() => toggleRiskFactorCode(rf.factorCode)}
                  className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
                    checked
                      ? 'bg-rose-50/50 border-rose-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            {rf.factorName}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {rf.factorCode}
                          </span>
                        </div>
                        {rf.clinicalNote && (
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            <FileSpreadsheet className="w-3 h-3 inline mr-1 text-slate-400" />
                            {rf.clinicalNote}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border ${catMeta.colorClass}`}
                      >
                        {catMeta.label.split(' ')[0]}
                      </span>
                      <div
                        className={`text-[10px] font-bold mt-1 ${
                          rf.severityLevel === 'CRITICAL'
                            ? 'text-rose-600'
                            : rf.severityLevel === 'HIGH'
                            ? 'text-orange-600'
                            : 'text-slate-500'
                        }`}
                      >
                        +{rf.riskScoreContribution}점 ({rf.severityLevel})
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
