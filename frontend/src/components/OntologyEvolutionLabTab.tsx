import React, { useState } from 'react';
import { Code2, PlusCircle, RefreshCw, Sparkles, Wand2 } from 'lucide-react';

interface Props {
  initialJsonLd: string;
  initialSdl: string;
}

export const OntologyEvolutionLabTab: React.FC<Props> = ({ initialJsonLd, initialSdl }) => {
  const [jsonLdText, setJsonLdText] = useState(initialJsonLd);
  const [previewSdl, setPreviewSdl] = useState(initialSdl);
  const [stats, setStats] = useState<{ classCount: number; propertyCount: number; edgeCount: number }>({
    classCount: 9,
    propertyCount: 46,
    edgeCount: 7,
  });
  const [statusMsg, setStatusMsg] = useState<string>(
    '현재 기본 insurance-ontology.jsonld 스키마가 로드되어 있습니다.'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runTransformPreview = async (payloadJsonLd: string, customBanner?: string) => {
    setErrorMsg(null);
    const res = await fetch('/api/v1/ontology/transform-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonLd: payloadJsonLd }),
    });
    const json = await res.json();
    if (!json.success) {
      setErrorMsg(json.error || 'JSON-LD 파싱 오류');
    } else {
      setPreviewSdl(json.derivedGraphQLSdl);
      setStats({
        classCount: json.classCount,
        propertyCount: json.propertyCount,
        edgeCount: json.edgeCount,
      });
      setStatusMsg(
        customBanner ||
          `변환 완료: ${json.classCount}개 RDFS 클래스, ${json.propertyCount}개 프로퍼티로부터 GraphQL SDL이 자동 재생성되었습니다.`
      );
    }
  };

  const injectEvolutionPreset = (type: 'GENETIC_RISK' | 'TELEMATICS_CLASS') => {
    try {
      const parsed = JSON.parse(jsonLdText);
      const graph: any[] = parsed['@graph'] || [];

      if (type === 'GENETIC_RISK') {
        const exists = graph.some((n) => n['@id'] === 'ins:geneticRiskPercentile');
        if (!exists) {
          graph.push(
            {
              '@id': 'ins:geneticRiskPercentile',
              '@type': 'rdf:Property',
              'rdfs:label': '유전체 질환 위험 백분위(%)',
              'rdfs:comment': '유전체 분석(PRS) 기반 심혈관·암 발병 위험 백분위 지수',
              'rdfs:domain': 'ins:RiskAssessment',
              'rdfs:range': 'xsd:float',
              'ins:required': false,
              'ins:sourceField': 'gen_prs_pct',
            },
            {
              '@id': 'ins:wearableHealthScore',
              '@type': 'rdf:Property',
              'rdfs:label': '스마트워치 생체활동 건강점수',
              'rdfs:comment': '최근 90일 심박변이도(HRV) 및 수면·보행 데이터 기반 건강점수',
              'rdfs:domain': 'ins:ApplicantProfile',
              'rdfs:range': 'xsd:int',
              'ins:required': false,
              'ins:sourceField': 'wearable_hlth_scr',
            }
          );
        }
        parsed['ins:version'] = '1.3.0-evolution';
        const updatedStr = JSON.stringify(parsed, null, 2);
        setJsonLdText(updatedStr);
        runTransformPreview(
          updatedStr,
          '✨ [진화 시나리오 1 적용] ins:geneticRiskPercentile 및 ins:wearableHealthScore 속성이 추가되어 GraphQL SDL의 RiskAssessment와 ApplicantProfile 타입에 즉시 반영되었습니다!'
        );
      } else {
        const exists = graph.some((n) => n['@id'] === 'ins:TelematicsDrivingRecord');
        if (!exists) {
          graph.push(
            {
              '@id': 'ins:TelematicsDrivingRecord',
              '@type': 'rdfs:Class',
              'rdfs:label': 'UBI 텔레매틱스 주행기록 (Telematics Driving Record)',
              'rdfs:comment': '커넥티드카/내비게이션 기반 급감속·야간주행·안전운전 점수 엔티티',
              'ins:domain': 'Risk',
              'ins:sourceService': 'telematics-iot-service',
              'ins:sourceEndpoint': 'GET /mock/telematics-service/drivers/{applicantId}',
            },
            {
              '@id': 'ins:safetyDrivingScore',
              '@type': 'rdf:Property',
              'rdfs:label': 'UBI 안전운전 점수',
              'rdfs:comment': '텔레매틱스 1,000km 주행 기준 안전운전 점수',
              'rdfs:domain': 'ins:TelematicsDrivingRecord',
              'rdfs:range': 'xsd:int',
              'ins:required': true,
              'ins:sourceField': 'ubi_safe_scr',
            },
            {
              '@id': 'ins:hasTelematicsRecord',
              '@type': 'rdf:Property',
              'rdfs:label': '텔레매틱스 주행이력 참조',
              'rdfs:comment': '피보험자의 커넥티드카 안전운전 데이터 연동',
              'rdfs:domain': 'ins:ApplicantProfile',
              'rdfs:range': 'ins:TelematicsDrivingRecord',
              'ins:required': false,
              'ins:sourceField': 'telematics_ref_id',
              'ins:crossServiceJoin': 'telematics-iot-service',
            }
          );
        }
        parsed['ins:version'] = '1.4.0-telematics';
        const updatedStr = JSON.stringify(parsed, null, 2);
        setJsonLdText(updatedStr);
        runTransformPreview(
          updatedStr,
          '🚀 [진화 시나리오 2 적용] 신규 RDFS 클래스(ins:TelematicsDrivingRecord)와 크로스 서비스 관계(ins:hasTelematicsRecord)가 추가되어 GraphQL Type 및 @ontologyProperty가 자동 생성되었습니다!'
        );
      }
    } catch (e: any) {
      setErrorMsg('JSON 파싱 실패: ' + e.message);
    }
  };

  const resetOntology = () => {
    setJsonLdText(initialJsonLd);
    runTransformPreview(initialJsonLd, '초기 온톨로지 스키마(v1.2.0)로 복원되었습니다.');
  };

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* Top Action Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Wand2 className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white">
              Ontology Schema Evolution Lab (JSON-LD 편집 → GraphQL SDL 실시간 자동 도출)
            </h3>
            <p className="text-xs text-slate-300">{statusMsg}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => injectEvolutionPreset('GENETIC_RISK')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            진화 시연 1: 유전체/웨어러블 위험속성 추가
          </button>
          <button
            onClick={() => injectEvolutionPreset('TELEMATICS_CLASS')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-pink-200 text-xs font-medium transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            진화 시연 2: 신규 텔레매틱스 RDFS 클래스 추가
          </button>
          <button
            onClick={resetOntology}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            초기화
          </button>
          <button
            onClick={() => runTransformPreview(jsonLdText)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            JSON-LD → GraphQL 변환 실행
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="px-4 py-2 rounded-lg bg-rose-950/70 border border-rose-500/50 text-xs text-rose-200">
          {errorMsg}
        </div>
      )}

      {/* Side-by-Side Editors */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
        <div className="col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Code2 className="w-4 h-4" />
              Source of Truth: insurance-ontology.jsonld (JSON-LD + RDFS)
            </span>
            <span className="text-[11px] font-mono text-slate-400">Editable JSON-LD</span>
          </div>
          <textarea
            value={jsonLdText}
            onChange={(e) => setJsonLdText(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-slate-950 text-amber-100 font-mono text-xs p-3.5 focus:outline-none resize-none"
          />
        </div>

        <div className="col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Auto-Derived Target: schema.graphqls (GraphQL SDL + Semantic Directives)
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              {stats.classCount} Types · {stats.propertyCount} Fields · {stats.edgeCount} Relations
            </span>
          </div>
          <pre className="flex-1 w-full bg-slate-950 text-emerald-200 font-mono text-xs p-3.5 overflow-y-auto whitespace-pre">
            {previewSdl}
          </pre>
        </div>
      </div>
    </div>
  );
};
