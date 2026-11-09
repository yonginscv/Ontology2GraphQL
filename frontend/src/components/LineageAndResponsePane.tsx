import React, { useState } from 'react';
import { LineageStep } from '../types';
import { Activity, ArrowRight, CheckCircle2, Clock, Database, Server, Workflow } from 'lucide-react';

interface Props {
  protocolUsed: 'GRAPHQL' | 'REST';
  responseJson: unknown;
  lineageSteps: LineageStep[];
  onSelectOntologyClassFromLineage: (className: string) => void;
}

const DOMAIN_BADGE: Record<string, string> = {
  Product: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  Underwriting: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  Risk: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
};

export const LineageAndResponsePane: React.FC<Props> = ({
  protocolUsed,
  responseJson,
  lineageSteps,
  onSelectOntologyClassFromLineage,
}) => {
  const [viewMode, setViewMode] = useState<'SPLIT' | 'LINEAGE' | 'JSON'>('SPLIT');

  const totalLatency = lineageSteps.reduce((acc, s) => acc + s.latencyMs, 0);
  const distinctServices = Array.from(new Set(lineageSteps.map((s) => s.sourceService)));

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-pink-400" />
          <span className="font-semibold text-sm text-slate-100">
            3. Live Data Lineage & Execution Result
          </span>
        </div>

        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('SPLIT')}
            className={`px-2 py-1 rounded-md font-medium transition ${
              viewMode === 'SPLIT'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            통합 뷰
          </button>
          <button
            onClick={() => setViewMode('LINEAGE')}
            className={`px-2 py-1 rounded-md font-medium transition ${
              viewMode === 'LINEAGE'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            데이터 계보({lineageSteps.length})
          </button>
          <button
            onClick={() => setViewMode('JSON')}
            className={`px-2 py-1 rounded-md font-medium transition ${
              viewMode === 'JSON'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            응답 JSON
          </button>
        </div>
      </div>

      {/* Summary Telemetry Strip */}
      <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {protocolUsed === 'GRAPHQL' ? 'GraphQL /graphql' : 'Hybrid REST /api/v1/*'}
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            호출된 도메인 서비스: <strong>{distinctServices.length}개</strong> ({lineageSteps.length}{' '}
            steps)
          </span>
        </div>
        <span className="flex items-center gap-1 font-mono text-amber-300">
          <Clock className="w-3.5 h-3.5" /> 총 백엔드 소요시간: {totalLatency}ms
        </span>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden p-3.5 gap-3">
        {/* Data Lineage Steps */}
        {(viewMode === 'SPLIT' || viewMode === 'LINEAGE') && (
          <div
            className={`${
              viewMode === 'SPLIT' ? 'h-[52%]' : 'flex-1'
            } flex flex-col overflow-hidden`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-pink-400" />
                실시간 데이터 계보 (Ontology Concept ↔ GraphQL Field ↔ Domain Mock Service)
              </span>
              <span className="text-[10px] text-slate-400">
                항목 클릭 시 좌측 온톨로지 그래프에서 해당 클래스 포커스
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {lineageSteps.map((step) => {
                const classLocalName = step.ontologyClassUri.replace('ins:', '');
                return (
                  <div
                    key={step.stepOrder}
                    onClick={() => onSelectOntologyClassFromLineage(classLocalName)}
                    className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 hover:border-pink-500/50 cursor-pointer transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 font-mono text-[11px] flex items-center justify-center font-bold">
                          {step.stepOrder}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            DOMAIN_BADGE[step.domainName] || DOMAIN_BADGE.Product
                          }`}
                        >
                          {step.domainName} Domain
                        </span>
                        <span className="font-mono text-xs font-semibold text-white">
                          {step.graphqlFieldPath}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400">
                        {step.latencyMs}ms · {step.status}
                      </span>
                    </div>

                    {/* 3-Step Visual Lineage Flow */}
                    <div className="grid grid-cols-11 items-center gap-1 text-[11px] bg-slate-900/90 p-2 rounded border border-slate-800/90">
                      <div className="col-span-4">
                        <div className="text-[10px] text-slate-400">Ontology RDFS Concept</div>
                        <div className="font-mono text-indigo-300 font-semibold truncate">
                          {step.ontologyClassUri}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 truncate">
                          {step.ontologyPropertyUri}
                        </div>
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>

                      <div className="col-span-6">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Database className="w-3 h-3 text-emerald-400" />
                          <span>{step.sourceService}</span>
                        </div>
                        <div className="font-mono text-emerald-300 font-medium truncate">
                          {step.httpMethod} {step.endpointUri}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                          원천필드: [{step.rawSourceFields.join(', ')}]
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Response JSON */}
        {(viewMode === 'SPLIT' || viewMode === 'JSON') && (
          <div
            className={`${
              viewMode === 'SPLIT' ? 'h-[48%]' : 'flex-1'
            } flex flex-col overflow-hidden`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-200">
                실행 결과 페이로드 (GraphQL Data & Extensions / Hybrid REST Response)
              </span>
              <span className="text-[10px] font-mono text-slate-400">JSON Format</span>
            </div>
            <pre className="flex-1 bg-slate-950 text-sky-200 font-mono text-xs p-3 rounded-lg border border-slate-800 overflow-y-auto whitespace-pre-wrap">
              {JSON.stringify(responseJson, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
