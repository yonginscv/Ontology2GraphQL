import React, { useState } from 'react';
import { ApplicantProfile, RiskFactor, UnderwritingSimulationInput } from '../types';
import { RISK_CATEGORY_META, RISK_GRADE_META } from '../formatters';
import {
  translateApplicantName,
  translateOccupationName,
  translateRiskClinicalNote,
  translateRiskFactorName,
  useLanguage,
} from '../i18n';
import {
  ArrowRight,
  Briefcase,
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
  onChangeDraftInput: (
    updater: (prev: UnderwritingSimulationInput) => UnderwritingSimulationInput
  ) => void;
  onResetToSelectedApplicant: () => void;
  onNextStep: () => void;
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
  onNextStep,
}) => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  const [searchKeyword, setSearchKeyword] = useState('');
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const selectedOriginal =
    applicants.find((a) => a.applicantId === selectedApplicantId) || null;

  const filteredApplicants = applicants.filter((a) => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) return true;
    const enName = translateApplicantName(a.applicantId, a.applicantName, 'en').toLowerCase();
    const enOcc = translateOccupationName(a.occupationName, 'en').toLowerCase();
    return (
      a.applicantName.toLowerCase().includes(q) ||
      enName.includes(q) ||
      a.occupationName.toLowerCase().includes(q) ||
      enOcc.includes(q) ||
      a.applicantId.toLowerCase().includes(q) ||
      a.hasRiskFactor.some(
        (rf) =>
          rf.factorName.toLowerCase().includes(q) ||
          translateRiskFactorName(rf.factorCode, rf.factorName, 'en')
            .toLowerCase()
            .includes(q)
      )
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
      selectedOriginal.hasRiskFactor
        .map((r) => r.factorCode)
        .sort()
        .join(',') !== [...draftInput.riskFactorCodes].sort().join(','));

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

  const displayedDraftName = translateApplicantName(
    selectedApplicantId,
    draftInput.applicantName,
    lang
  );
  const displayedDraftOccupation = translateOccupationName(
    draftInput.occupationName,
    lang
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Step Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
            STEP 1
          </span>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {isKo
                ? '피보험자(고객) 선택 및 계약 전 알릴 의무(고지사항) 구성'
                : 'Select Insured Customer & Configure Pre-Contract Disclosures'}
            </h2>
            <p className="text-xs text-slate-500">
              {isKo ? (
                <>
                  등록된 고객 프로필(<code className="text-indigo-600 font-mono">applicantProfiles</code>)을 선택하거나 신규 고객의 인적사항·위험요소를 구성한 뒤 다음 단계로 이동하세요.
                </>
              ) : (
                <>
                  Select a registered customer profile (<code className="text-indigo-600 font-mono">applicantProfiles</code>) or configure a new prospect&apos;s demographics and risk factors before proceeding.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => {
              if (selectedApplicantId === 'CUSTOM' && applicants.length > 0) {
                onSelectApplicant(applicants[0]);
              }
              setShowProfileEditor(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              selectedApplicantId !== 'CUSTOM'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {isKo
              ? `등록 고객 선택 (${applicants.length}명)`
              : `Registered Customers (${applicants.length})`}
          </button>
          <button
            type="button"
            onClick={() => {
              onSwitchToCustomCustomer();
              setShowProfileEditor(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              selectedApplicantId === 'CUSTOM'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            {isKo ? '신규 가망고객 직접입력' : 'Custom Prospect Input'}
          </button>
        </div>
      </div>

      {/* Main 2-Column Wizard Step Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Customer List & Demographic Editor */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            {selectedApplicantId !== 'CUSTOM' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isKo
                      ? '1-A. 등록 피보험자 목록'
                      : '1-A. Registered Insured Applicants'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {isKo
                      ? '클릭하여 심사 대상 고객을 선택하세요'
                      : 'Click a card to select the target applicant'}
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder={
                      isKo
                        ? '고객명, 직업명, 보유 질환(고혈압, 당뇨 등) 검색...'
                        : 'Search by customer name, occupation, or condition (e.g., Hypertension, Diabetes)...'
                    }
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredApplicants.map((appl) => {
                    const isSelected = appl.applicantId === selectedApplicantId;
                    const gMeta =
                      RISK_GRADE_META[appl.riskAssessment.riskGrade] ||
                      RISK_GRADE_META.STANDARD;
                    const applName = translateApplicantName(
                      appl.applicantId,
                      appl.applicantName,
                      lang
                    );
                    const applOcc = translateOccupationName(appl.occupationName, lang);

                    return (
                      <button
                        key={appl.applicantId}
                        type="button"
                        onClick={() => onSelectApplicant(appl)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/15 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {applName.slice(0, 1)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-sm text-slate-900">
                                  {applName}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {isKo
                                    ? `(${appl.age}세·${appl.gender === 'M' ? '남' : '여'})`
                                    : `(${appl.age}y·${appl.gender})`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5">
                                <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[120px]">
                                  {applOcc}
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                                    appl.occupationGrade === 3
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {isKo ? `${appl.occupationGrade}급` : `Gr.${appl.occupationGrade}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${gMeta.badgeClass}`}
                          >
                            {isKo
                              ? `${appl.riskAssessment.totalRiskScore}점`
                              : `${appl.riskAssessment.totalRiskScore} pts`}
                          </span>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-1">
                          {appl.isSmoker && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                              <Cigarette className="w-2.5 h-2.5" />{' '}
                              {isKo ? '흡연' : 'Smoker'}
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            BMI {appl.bmi}
                          </span>
                          {appl.hasRiskFactor.map((rf) => {
                            const rfLabel = translateRiskFactorName(
                              rf.factorCode,
                              rf.factorName,
                              lang
                            ).split(' (')[0];
                            return (
                              <span
                                key={rf.riskFactorId}
                                className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium"
                              >
                                {rfLabel}
                              </span>
                            );
                          })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Customer Profile & Live AI Risk Score Preview */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-extrabold text-slate-800">
                    {isKo
                      ? '선택된 청약 피보험자 프로필 & 예상 위험도'
                      : 'Selected Insured Profile & Live Risk Estimate'}
                  </span>
                  {isModifiedFromOriginal && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                      {isKo ? '조건 수정됨' : 'Modified'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isModifiedFromOriginal && (
                    <button
                      type="button"
                      onClick={onResetToSelectedApplicant}
                      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 font-semibold"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />{' '}
                      {isKo ? '원래대로 복원' : 'Reset'}
                    </button>
                  )}
                  {selectedApplicantId !== 'CUSTOM' && (
                    <button
                      type="button"
                      onClick={() => setShowProfileEditor((v) => !v)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline"
                    >
                      {showProfileEditor
                        ? isKo
                          ? '인적사항 입력창 접기'
                          : 'Hide Profile Editor'
                        : isKo
                        ? '인적사항 세부 조정'
                        : 'Edit Demographics'}
                    </button>
                  )}
                </div>
              </div>

              {/* Live Risk Score Preview Card */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">
                    {isKo
                      ? '실시간 예상 종합 위험점수 (AI Risk Assessment)'
                      : 'Live Composite Risk Score (AI Risk Assessment)'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">
                      {isKo ? `${liveEst.score} / 100점` : `${liveEst.score} / 100 pts`}
                    </span>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${gradeMeta.badgeClass}`}
                    >
                      {isKo ? gradeMeta.label : gradeMeta.enLabel}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${gradeMeta.barColor}`}
                    style={{ width: `${Math.min(100, liveEst.score)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                  <span className="font-medium text-slate-700">
                    {isKo
                      ? `${displayedDraftName} (${draftInput.age}세 · ${
                          draftInput.gender === 'M' ? '남성' : '여성'
                        } · ${displayedDraftOccupation} [상해 ${
                          draftInput.occupationGrade
                        }급] · ${draftInput.isSmoker ? '흡연' : '비흡연'} · BMI ${
                          draftInput.bmi
                        })`
                      : `${displayedDraftName} (Age ${draftInput.age} · ${
                          draftInput.gender === 'M' ? 'Male' : 'Female'
                        } · ${displayedDraftOccupation} [Grade ${
                          draftInput.occupationGrade
                        }] · ${draftInput.isSmoker ? 'Smoker' : 'Non-Smoker'} · BMI ${
                          draftInput.bmi
                        })`}
                  </span>
                  <span className="font-semibold text-indigo-700">
                    {isKo
                      ? `예상 할증지수 ${liveEst.loadingRatio.toFixed(2)}배`
                      : `Est. Loading ${liveEst.loadingRatio.toFixed(2)}x`}
                  </span>
                </div>
              </div>

              {/* Editable Demographic Fields */}
              {(selectedApplicantId === 'CUSTOM' || showProfileEditor) && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {isKo ? '고객 성명' : 'Customer Name'}
                    </label>
                    <input
                      type="text"
                      value={draftInput.applicantName}
                      onChange={(e) =>
                        onChangeDraftInput((prev) => ({
                          ...prev,
                          applicantName: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        {isKo ? '보험나이(세)' : 'Insurance Age'}
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
                        className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        {isKo ? '성별' : 'Gender'}
                      </label>
                      <select
                        value={draftInput.gender}
                        onChange={(e) =>
                          onChangeDraftInput((prev) => ({ ...prev, gender: e.target.value }))
                        }
                        className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      >
                        <option value="M">{isKo ? '남성 (M)' : 'Male (M)'}</option>
                        <option value="F">{isKo ? '여성 (F)' : 'Female (F)'}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {isKo ? '직업명' : 'Occupation'}
                    </label>
                    <input
                      type="text"
                      value={draftInput.occupationName}
                      onChange={(e) =>
                        onChangeDraftInput((prev) => ({
                          ...prev,
                          occupationName: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {isKo ? '상해 직업급수' : 'Occupation Injury Grade'}
                    </label>
                    <select
                      value={draftInput.occupationGrade}
                      onChange={(e) =>
                        onChangeDraftInput((prev) => ({
                          ...prev,
                          occupationGrade: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    >
                      <option value={1}>
                        {isKo
                          ? '1급 (사무직·전문직 비위험)'
                          : 'Grade 1 (Office / Professional — Low Risk)'}
                      </option>
                      <option value={2}>
                        {isKo
                          ? '2급 (외근·현장관리 중위험)'
                          : 'Grade 2 (Field / Supervision — Moderate Risk)'}
                      </option>
                      <option value={3}>
                        {isKo
                          ? '3급 (건설·운수·고소작업 고위험)'
                          : 'Grade 3 (Construction / Driving / High-Altitude — High Risk)'}
                      </option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-600">
                      {isKo ? '현재 흡연 여부' : 'Current Smoker'}
                    </span>
                    <input
                      type="checkbox"
                      checked={draftInput.isSmoker}
                      onChange={(e) =>
                        onChangeDraftInput((prev) => ({ ...prev, isSmoker: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 gap-2">
                    <span className="text-xs font-bold text-slate-600 shrink-0">
                      BMI ({draftInput.bmi})
                    </span>
                    <input
                      type="range"
                      min={18}
                      max={35}
                      step={0.2}
                      value={draftInput.bmi}
                      onChange={(e) =>
                        onChangeDraftInput((prev) => ({
                          ...prev,
                          bmi: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pre-contract Disclosure Risk Factors Checklist */}
          <div className="col-span-12 lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isKo
                    ? '1-B. 계약 전 알릴 의무 (병력·직업·운전 위험요소 고지)'
                    : '1-B. Pre-Contract Disclosure (Medical, Occupational & Driving Risks)'}
                </h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                {isKo
                  ? `고지 위험요소 ${draftInput.riskFactorCodes.length}건 선택됨`
                  : `${draftInput.riskFactorCodes.length} Risk Factor(s) Selected`}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {isKo
                ? '고객이 보유한 기왕증(KCD 질병코드)이나 직업·운전 위험요소를 체크하세요. 선택된 위험요소는 다음 단계에서 상품별 담보 민감도와 자동 대조됩니다.'
                : 'Check any pre-existing medical conditions (KCD codes) or occupational/driving hazards held by the customer. Selected factors are automatically cross-checked against coverage risk sensitivities in Step 2.'}
            </p>

            <div className="space-y-2">
              {riskCatalog.map((rf) => {
                const checked = draftInput.riskFactorCodes.includes(rf.factorCode);
                const catMeta = RISK_CATEGORY_META[rf.riskCategory] || {
                  label: rf.riskCategory,
                  enLabel: rf.riskCategory,
                  colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
                };
                const rfName = translateRiskFactorName(rf.factorCode, rf.factorName, lang);
                const rfNote = translateRiskClinicalNote(
                  rf.factorCode,
                  rf.clinicalNote,
                  lang
                );

                return (
                  <div
                    key={rf.factorCode}
                    onClick={() => toggleRiskFactorCode(rf.factorCode)}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                      checked
                        ? 'bg-rose-50/60 border-rose-400 ring-1 ring-rose-400/20 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-extrabold text-slate-900">
                              {rfName}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {rf.factorCode}
                            </span>
                          </div>
                          {rfNote && (
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                              {rfNote}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${catMeta.colorClass}`}
                        >
                          {isKo ? catMeta.label.split(' ')[0] : catMeta.enLabel}
                        </span>
                        <div
                          className={`text-[11px] font-extrabold mt-1 ${
                            rf.severityLevel === 'CRITICAL'
                              ? 'text-rose-600'
                              : rf.severityLevel === 'HIGH'
                              ? 'text-orange-600'
                              : 'text-slate-500'
                          }`}
                        >
                          +{rf.riskScoreContribution}
                          {isKo ? '점' : ' pts'} ({rf.severityLevel})
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

      {/* Wizard Step 1 Footer Bar */}
      <div className="px-6 py-4 bg-slate-900 text-white border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-bold">
            {isKo ? '선택된 고객 요약' : 'Selected Applicant'}
          </span>
          <span className="font-bold text-white text-sm">
            {isKo
              ? `${displayedDraftName} (${draftInput.age}세 · ${
                  draftInput.gender === 'M' ? '남' : '여'
                })`
              : `${displayedDraftName} (Age ${draftInput.age} · ${draftInput.gender})`}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">
            {isKo
              ? `${displayedDraftOccupation} (상해 ${draftInput.occupationGrade}급)`
              : `${displayedDraftOccupation} (Grade ${draftInput.occupationGrade})`}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-amber-300 font-semibold">
            {isKo
              ? `고지 위험요소 ${draftInput.riskFactorCodes.length}건 (예상 위험점수 ${liveEst.score}점)`
              : `${draftInput.riskFactorCodes.length} Disclosed Risk(s) (Est. Score ${liveEst.score} pts)`}
          </span>
        </div>

        <button
          type="button"
          onClick={onNextStep}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-950 transition"
        >
          <span>{isKo ? '다음: 보험상품 선택' : 'Next: Select Insurance Product'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
