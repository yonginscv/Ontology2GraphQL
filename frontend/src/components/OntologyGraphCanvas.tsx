import React from 'react';
import { OntologyClassDef, OntologyMetadata } from '../types';
import { Database, GitBranch, Layers, ShieldAlert, FileCheck2, Package, Maximize2 } from 'lucide-react';

interface Props {
  metadata: OntologyMetadata;
  selectedClassName: string;
  highlightedClasses: string[];
  onSelectClass: (className: string) => void;
  onOpenFullViewer?: () => void;
}

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  InsuranceProduct: { x: 110, y: 75 },
  Coverage: { x: 110, y: 205 },
  BenefitCondition: { x: 110, y: 335 },

  UnderwritingCase: { x: 370, y: 75 },
  UnderwritingRule: { x: 370, y: 205 },
  UnderwritingDecision: { x: 370, y: 335 },

  ApplicantProfile: { x: 630, y: 75 },
  RiskFactor: { x: 630, y: 205 },
  RiskAssessment: { x: 630, y: 335 },
};

const DOMAIN_STYLE: Record<
  string,
  { border: string; bg: string; badge: string; stroke: string; label: string }
> = {
  Product: {
    border: 'border-sky-500/70',
    bg: 'bg-sky-950/60',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    stroke: '#38bdf8',
    label: 'Product Domain (상품)',
  },
  Underwriting: {
    border: 'border-violet-500/70',
    bg: 'bg-violet-950/60',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    stroke: '#a78bfa',
    label: 'Underwriting Domain (심사)',
  },
  Risk: {
    border: 'border-amber-500/70',
    bg: 'bg-amber-950/60',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    stroke: '#fbbf24',
    label: 'Risk Domain (위험)',
  },
};

export const OntologyGraphCanvas: React.FC<Props> = ({
  metadata,
  selectedClassName,
  highlightedClasses,
  onSelectClass,
  onOpenFullViewer,
}) => {
  const selectedClass: OntologyClassDef | undefined =
    metadata.classes.find((c) => c.localName === selectedClassName) || metadata.classes[0];

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-sm text-slate-100">
            1. JSON-LD / RDFS Ontology Graph
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            {metadata.classes.length} Classes · {metadata.properties.length} Properties
          </span>
          {onOpenFullViewer && (
            <button
              type="button"
              onClick={onOpenFullViewer}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition"
              title="React Flow 기반 대화형 온톨로지 그래프 뷰어 열기"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Ontology Viewer</span>
            </button>
          )}
        </div>
      </div>

      {/* Domain Legend */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sky-300">
            <Package className="w-3.5 h-3.5" /> 상품(Product)
          </span>
          <span className="flex items-center gap-1.5 text-violet-300">
            <FileCheck2 className="w-3.5 h-3.5" /> 언더라이팅(UW)
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5" /> 위험(Risk)
          </span>
        </div>
        <span className="text-[11px] text-slate-400">노드 클릭 시 RDFS 스키마 & GraphQL 매핑 상세 표시</span>
      </div>

      {/* Interactive SVG Graph */}
      <div className="relative bg-slate-950/90 border-b border-slate-800 select-none">
        <svg viewBox="0 0 740 410" className="w-full h-[300px]">
          <defs>
            <marker
              id="arrow-normal"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#64748b" />
            </marker>
            <marker
              id="arrow-cross"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#ec4899" />
            </marker>
          </defs>

          {/* Column Domain Swimlanes */}
          <rect
            x="16"
            y="14"
            width="188"
            height="382"
            rx="10"
            fill="rgba(14, 165, 233, 0.04)"
            stroke="rgba(56, 189, 248, 0.2)"
            strokeDasharray="4 4"
          />
          <text x="110" y="32" textAnchor="middle" fill="#7dd3fc" fontSize="11" fontWeight="600">
            Product Domain (상품)
          </text>

          <rect
            x="276"
            y="14"
            width="188"
            height="382"
            rx="10"
            fill="rgba(139, 92, 246, 0.05)"
            stroke="rgba(167, 139, 250, 0.25)"
            strokeDasharray="4 4"
          />
          <text x="370" y="32" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontWeight="600">
            Underwriting Domain (심사)
          </text>

          <rect
            x="536"
            y="14"
            width="188"
            height="382"
            rx="10"
            fill="rgba(245, 158, 11, 0.04)"
            stroke="rgba(251, 191, 36, 0.2)"
            strokeDasharray="4 4"
          />
          <text x="630" y="32" textAnchor="middle" fill="#fcd34d" fontSize="11" fontWeight="600">
            Risk Domain (위험)
          </text>

          {/* Edges */}
          {metadata.objectEdges.map((edge) => {
            const src = NODE_POSITIONS[edge.sourceClassName] || { x: 370, y: 200 };
            const tgt = NODE_POSITIONS[edge.targetClassName] || { x: 370, y: 300 };

            const isVertical = src.x === tgt.x;
            let x1 = src.x;
            let y1 = src.y;
            let x2 = tgt.x;
            let y2 = tgt.y;

            if (isVertical) {
              y1 = src.y + 32;
              y2 = tgt.y - 34;
            } else if (src.x > tgt.x) {
              x1 = src.x - 82;
              x2 = tgt.x + 84;
            } else {
              x1 = src.x + 82;
              x2 = tgt.x - 84;
            }

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            return (
              <g key={edge.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={edge.isCrossService ? '#f472b6' : '#64748b'}
                  strokeWidth={edge.isCrossService ? 2.2 : 1.7}
                  strokeDasharray={edge.isCrossService ? '5 3' : undefined}
                  markerEnd={edge.isCrossService ? 'url(#arrow-cross)' : 'url(#arrow-normal)'}
                />
                <rect
                  x={midX - 52}
                  y={midY - 9}
                  width="104"
                  height="17"
                  rx="4"
                  fill="#0f172a"
                  stroke={edge.isCrossService ? '#db2777' : '#334155'}
                  strokeWidth="1"
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  fill={edge.isCrossService ? '#f9a8d4' : '#cbd5e1'}
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {edge.propertyUri}
                </text>
              </g>
            );
          })}

          {/* Class Nodes */}
          {metadata.classes.map((cls) => {
            const pos = NODE_POSITIONS[cls.localName] || { x: 370, y: 205 };
            const isSelected = cls.localName === selectedClass?.localName;
            const isHighlighted = highlightedClasses.includes(cls.localName);
            const style = DOMAIN_STYLE[cls.domain] || DOMAIN_STYLE.Product;

            return (
              <g
                key={cls.uri}
                transform={`translate(${pos.x - 80}, ${pos.y - 28})`}
                onClick={() => onSelectClass(cls.localName)}
                className="cursor-pointer transition-opacity"
              >
                <rect
                  width="160"
                  height="56"
                  rx="8"
                  fill={isSelected ? '#1e1b4b' : '#0f172a'}
                  stroke={isSelected ? '#818cf8' : style.stroke}
                  strokeWidth={isSelected ? 2.8 : isHighlighted ? 2.0 : 1.2}
                />
                {isHighlighted && (
                  <circle cx="148" cy="12" r="4.5" fill="#34d399" />
                )}
                <text
                  x="10"
                  y="19"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {cls.uri}
                </text>
                <text
                  x="10"
                  y="35"
                  fill="#f8fafc"
                  fontSize="11.5"
                  fontWeight="700"
                >
                  {cls.localName}
                </text>
                <text x="10" y="49" fill="#cbd5e1" fontSize="9.5">
                  {cls.label.replace(/\s*\(.*\)/, '')} ({cls.fields.length} props)
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Class RDFS Inspector */}
      {selectedClass && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  rdfs:Class
                </span>
                <h4 className="font-bold text-sm text-white">{selectedClass.uri}</h4>
              </div>
              <p className="text-xs text-slate-300 mt-1">{selectedClass.label}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Database className="w-3 h-3" /> {selectedClass.sourceService}
              </span>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                {selectedClass.sourceEndpoint}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            {selectedClass.comment}
          </p>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                RDFS Properties (rdfs:domain = {selectedClass.uri}) → GraphQL Fields
              </span>
              <span className="text-[11px] text-slate-400">
                총 {selectedClass.fields.length}개 속성
              </span>
            </div>
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                    <th className="py-1.5 px-2.5">Ontology URI (rdf:Property)</th>
                    <th className="py-1.5 px-2.5">rdfs:range</th>
                    <th className="py-1.5 px-2.5">GraphQL Type</th>
                    <th className="py-1.5 px-2.5">원천필드 (ins:sourceField)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {selectedClass.fields.map((f) => (
                    <tr
                      key={f.uri}
                      className={`hover:bg-slate-800/40 ${
                        f.isObjectRelation ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-1.5 px-2.5">
                        <div className="font-mono text-indigo-300 font-medium">{f.uri}</div>
                        <div className="text-[11px] text-slate-400">{f.label}</div>
                      </td>
                      <td className="py-1.5 px-2.5 font-mono text-[11px] text-amber-300">
                        {f.rangeUri}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono text-[11px] text-emerald-300 font-semibold">
                        {f.graphqlType}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono text-[11px] text-slate-300">
                        <span>{f.sourceField}</span>
                        {f.crossServiceJoin && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            ↗ {f.crossServiceJoin}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
