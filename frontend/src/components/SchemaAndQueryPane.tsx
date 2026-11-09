import React, { useState } from 'react';
import { QueryPreset, QUERY_PRESETS } from '../presets';
import { Code2, Play, Sparkles, Terminal, FileCode } from 'lucide-react';

interface Props {
  derivedSdl: string;
  selectedClassName: string;
  activePreset: QueryPreset;
  customQuery: string;
  isExecuting: boolean;
  onSelectPreset: (preset: QueryPreset) => void;
  onChangeQuery: (q: string) => void;
  onExecute: () => void;
}

export const SchemaAndQueryPane: React.FC<Props> = ({
  derivedSdl,
  selectedClassName,
  activePreset,
  customQuery,
  isExecuting,
  onSelectPreset,
  onChangeQuery,
  onExecute,
}) => {
  const [subTab, setSubTab] = useState<'QUERY' | 'SDL'>('QUERY');

  const extractSelectedClassSdlSnippet = (): string => {
    const marker = `type ${selectedClassName} @ontologyClass`;
    const idx = derivedSdl.indexOf(marker);
    if (idx === -1) return derivedSdl;
    const endIdx = derivedSdl.indexOf('\n}\n', idx);
    if (endIdx === -1) return derivedSdl.slice(idx);
    return derivedSdl.slice(idx, endIdx + 3);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm text-slate-100">
            2. Derived GraphQL Schema & Hybrid Runner
          </span>
        </div>

        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setSubTab('QUERY')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              subTab === 'QUERY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Query / REST 실행기
          </button>
          <button
            onClick={() => setSubTab('SDL')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              subTab === 'SDL'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            자동 도출된 전체 GraphQL SDL
          </button>
        </div>
      </div>

      {/* Selected Ontology Class -> GraphQL Type Live Mapping Banner */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            선택된 온톨로지 클래스(`ins:{selectedClassName}`)로부터 자동 도출된 GraphQL Type 정의:
          </span>
          <span className="text-[10px] font-mono text-emerald-400">
            @ontologyClass · @ontologyProperty
          </span>
        </div>
        <pre className="text-[11px] font-mono text-emerald-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 max-h-36 overflow-y-auto whitespace-pre">
          {extractSelectedClassSdlSnippet()}
        </pre>
      </div>

      {subTab === 'QUERY' ? (
        <div className="flex-1 flex flex-col overflow-hidden p-3.5 gap-3">
          {/* Scenario Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              실증 시나리오 프리셋 선택 (GraphQL 3-Domain 통합 쿼리 & Hybrid REST API)
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {QUERY_PRESETS.map((preset) => {
                const active = preset.id === activePreset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectPreset(preset)}
                    className={`text-left px-3 py-2 rounded-lg border transition flex items-center justify-between gap-2 ${
                      active
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                        : 'bg-slate-950/50 border-slate-800/90 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="truncate text-xs font-medium">{preset.title}</div>
                    <span
                      className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded border ${
                        preset.protocol === 'REST'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800/80">
              {activePreset.description}
            </p>
          </div>

          {/* Query Editor */}
          <div className="flex-1 flex flex-col min-h-[180px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                {activePreset.protocol === 'GRAPHQL'
                  ? 'POST /graphql (Spring for GraphQL Serving Layer)'
                  : `GET ${activePreset.restEndpoint} (Hybrid REST Serving Layer)`}
              </span>
              <button
                onClick={onExecute}
                disabled={isExecuting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-emerald-900/40 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isExecuting
                  ? '실행 중...'
                  : activePreset.protocol === 'GRAPHQL'
                  ? 'GraphQL 쿼리 실행 & 계보 추적'
                  : 'Hybrid REST 호출 & 계보 추적'}
              </button>
            </div>
            <textarea
              value={customQuery}
              onChange={(e) => onChangeQuery(e.target.value)}
              readOnly={activePreset.protocol === 'REST'}
              spellCheck={false}
              className="flex-1 w-full bg-slate-950 text-emerald-200 font-mono text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500/70 resize-none"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              insurance-ontology.jsonld로부터 자동 생성된 전체 GraphQL Schema (SDL)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              OntologyToGraphQLGenerator.java
            </span>
          </div>
          <pre className="flex-1 bg-slate-950 text-slate-200 font-mono text-xs p-3.5 rounded-lg border border-slate-800 overflow-y-auto whitespace-pre">
            {derivedSdl}
          </pre>
        </div>
      )}
    </div>
  );
};
