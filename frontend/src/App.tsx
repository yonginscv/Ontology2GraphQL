import React, { useEffect, useState } from 'react';
import { LineageStep, OntologyMetadata, RiskFactorCatalogItem } from './types';
import { QUERY_PRESETS, QueryPreset } from './presets';
import { OntologyGraphCanvas } from './components/OntologyGraphCanvas';
import { OntologyViewerTab } from './components/OntologyViewerTab';
import { SchemaAndQueryPane } from './components/SchemaAndQueryPane';
import { LineageAndResponsePane } from './components/LineageAndResponsePane';
import { UnderwritingSimulatorTab } from './components/UnderwritingSimulatorTab';
import { OntologyEvolutionLabTab } from './components/OntologyEvolutionLabTab';
import { DEFAULT_ONTOLOGY_JSONLD } from './defaultOntologyJsonLd';
import { parseJsonLdOntology } from './ontologyParser';
import {
  Activity,
  Cpu,
  GitBranch,
  Layers,
  Network,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'VIEWER' | 'EXPLORER' | 'SIMULATOR' | 'EVOLUTION'>(
    'VIEWER'
  );
  const [rawJsonLd, setRawJsonLd] = useState<string>(DEFAULT_ONTOLOGY_JSONLD);
  const [metadata, setMetadata] = useState<OntologyMetadata | null>(() => {
    try {
      return parseJsonLdOntology(DEFAULT_ONTOLOGY_JSONLD).metadata;
    } catch {
      return null;
    }
  });
  const [derivedSdl, setDerivedSdl] = useState<string>('');
  const [riskCatalog, setRiskCatalog] = useState<RiskFactorCatalogItem[]>([]);

  const [selectedClassName, setSelectedClassName] = useState<string>('UnderwritingCase');
  const [activePreset, setActivePreset] = useState<QueryPreset>(QUERY_PRESETS[0]);
  const [customQuery, setCustomQuery] = useState<string>(QUERY_PRESETS[0].query);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [responseJson, setResponseJson] = useState<unknown>(null);
  const [lineageSteps, setLineageSteps] = useState<LineageStep[]>([]);

  useEffect(() => {
    const loadInitialSchema = async () => {
      try {
        const res = await fetch('/api/v1/ontology/schema');
        if (res.ok) {
          const data = await res.json();
          setRawJsonLd(data.rawJsonLd);
          setMetadata(data.metadata);
          setDerivedSdl(data.derivedGraphQLSdl);
          setRiskCatalog(data.riskFactorsCatalog || []);
        }
        await executePresetQuery(QUERY_PRESETS[0], QUERY_PRESETS[0].query);
      } catch {
        // Fallback to embedded DEFAULT_ONTOLOGY_JSONLD if backend is not yet started
      }
    };
    loadInitialSchema();
  }, []);

  const executePresetQuery = async (preset: QueryPreset, queryStr: string) => {
    setIsExecuting(true);
    try {
      if (preset.protocol === 'GRAPHQL') {
        const res = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryStr }),
        });
        const json = await res.json();
        setResponseJson(json);
        setLineageSteps(json.extensions?.ontologyLineage || []);
      } else if (preset.restEndpoint) {
        const res = await fetch(preset.restEndpoint);
        const json = await res.json();
        setResponseJson(json);
        setLineageSteps(json.lineage || []);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSelectPreset = (preset: QueryPreset) => {
    setActivePreset(preset);
    setCustomQuery(preset.query);
    if (preset.highlightClasses.length > 0) {
      setSelectedClassName(preset.highlightClasses[0]);
    }
    executePresetQuery(preset, preset.query);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Global Navigation Header */}
      <header className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base text-white tracking-tight">
                Insurance Ontology → GraphQL Schema & Lineage PoC
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                JSON-LD / RDFS → Spring for GraphQL + Hybrid REST
              </span>
            </div>
            <p className="text-xs text-slate-400">
              보험 상품(Product) · 언더라이팅(Underwriting) · 위험(Risk) 도메인 온톨로지 기반 통합 API 게이트웨이 실증 플랫폼
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveTab('VIEWER')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'VIEWER'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            1. JSON-LD 온톨로지 뷰어 (Ontology Graph)
          </button>
          <button
            onClick={() => setActiveTab('EXPLORER')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'EXPLORER'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            2. Ontology ↔ GraphQL ↔ Lineage 3-Pane 비교
          </button>
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'SIMULATOR'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            3. 실시간 언더라이팅 & 리스크 심사 시뮬레이터
          </button>
          <button
            onClick={() => setActiveTab('EVOLUTION')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'EVOLUTION'
                ? 'bg-pink-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            4. 온톨로지 스키마 진화 실험실 (Schema Evolution)
          </button>
        </div>

        {/* Status Badges */}
        <div className="hidden 2xl:flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 font-mono">
            <Cpu className="w-3.5 h-3.5" /> Spring GraphQL :8080
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 font-mono">
            <Activity className="w-3.5 h-3.5" /> 3 Mock Providers Active
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 overflow-hidden">
        {!metadata ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm gap-2">
            <Sparkles className="w-5 h-5 animate-spin text-indigo-400" />
            JSON-LD / RDFS 온톨로지 및 도출된 GraphQL 스키마를 불러오는 중...
          </div>
        ) : activeTab === 'VIEWER' ? (
          <OntologyViewerTab
            rawJsonLd={rawJsonLd}
            metadata={metadata}
            selectedClassName={selectedClassName}
            onSelectClass={(clsName) => setSelectedClassName(clsName)}
          />
        ) : activeTab === 'EXPLORER' ? (
          <div className="grid grid-cols-12 gap-4 h-full overflow-hidden">
            <div className="col-span-4 h-full overflow-hidden">
              <OntologyGraphCanvas
                metadata={metadata}
                selectedClassName={selectedClassName}
                highlightedClasses={activePreset.highlightClasses}
                onSelectClass={(clsName) => setSelectedClassName(clsName)}
                onOpenFullViewer={() => setActiveTab('VIEWER')}
              />
            </div>

            <div className="col-span-4 h-full overflow-hidden">
              <SchemaAndQueryPane
                derivedSdl={derivedSdl}
                selectedClassName={selectedClassName}
                activePreset={activePreset}
                customQuery={customQuery}
                isExecuting={isExecuting}
                onSelectPreset={handleSelectPreset}
                onChangeQuery={setCustomQuery}
                onExecute={() => executePresetQuery(activePreset, customQuery)}
              />
            </div>

            <div className="col-span-4 h-full overflow-hidden">
              <LineageAndResponsePane
                protocolUsed={activePreset.protocol}
                responseJson={responseJson}
                lineageSteps={lineageSteps}
                onSelectOntologyClassFromLineage={(clsName) => setSelectedClassName(clsName)}
              />
            </div>
          </div>
        ) : activeTab === 'SIMULATOR' ? (
          <UnderwritingSimulatorTab riskCatalog={riskCatalog} />
        ) : (
          <OntologyEvolutionLabTab
            initialJsonLd={rawJsonLd}
            initialSdl={derivedSdl}
            onOntologyUpdated={(newJsonLd, newMeta, newSdl) => {
              setRawJsonLd(newJsonLd);
              setMetadata(newMeta);
              if (newSdl) setDerivedSdl(newSdl);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;
