import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Handle,
  MarkerType,
  MiniMap,
  Node,
  NodeProps,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import {
  OntologyClassDef,
  OntologyGraphEdge,
  OntologyMetadata,
  OntologyPropertyDef,
} from '../types';
import { expandUri, extractLocalName, parseJsonLdOntology } from '../ontologyParser';
import { DEFAULT_ONTOLOGY_JSONLD } from '../defaultOntologyJsonLd';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Code2,
  Database,
  ExternalLink,
  FileCode2,
  FileJson,
  Filter,
  GitBranch,
  KeyRound,
  Layers,
  LayoutGrid,
  Link2,
  Network,
  Package,
  Search,
  ShieldAlert,
  Sparkles,
  Tag,
  FileCheck2,
  Eye,
} from 'lucide-react';

interface OntologyViewerTabProps {
  rawJsonLd?: string;
  metadata?: OntologyMetadata | null;
  selectedClassName?: string;
  onSelectClass?: (className: string) => void;
  isLightMode?: boolean;
}

type LayoutMode = 'DAGRE_LR' | 'DAGRE_TB' | 'DOMAIN_SWIMLANE';
type GraphMode = 'CLASS_ONLY' | 'EXPAND_SELECTED_PROPS' | 'EXPAND_ALL_PROPS';
type InspectorSubTab = 'PROPERTIES' | 'RELATIONS' | 'JSONLD';

const DOMAIN_THEME: Record<
  string,
  {
    badgeBg: string;
    badgeText: string;
    borderColor: string;
    selectedBorder: string;
    headerBg: string;
    minimapColor: string;
    accentHex: string;
    koLabel: string;
  }
> = {
  Product: {
    badgeBg: 'bg-sky-500/20 border-sky-500/40',
    badgeText: 'text-sky-300',
    borderColor: 'border-sky-500/60',
    selectedBorder: 'border-sky-400 ring-2 ring-sky-400/50',
    headerBg: 'from-sky-950/90 to-slate-900/90',
    minimapColor: '#38bdf8',
    accentHex: '#38bdf8',
    koLabel: 'Product (상품)',
  },
  Underwriting: {
    badgeBg: 'bg-violet-500/20 border-violet-500/40',
    badgeText: 'text-violet-300',
    borderColor: 'border-violet-500/60',
    selectedBorder: 'border-violet-400 ring-2 ring-violet-400/50',
    headerBg: 'from-violet-950/90 to-slate-900/90',
    minimapColor: '#a78bfa',
    accentHex: '#a78bfa',
    koLabel: 'Underwriting (인수심사)',
  },
  Risk: {
    badgeBg: 'bg-amber-500/20 border-amber-500/40',
    badgeText: 'text-amber-300',
    borderColor: 'border-amber-500/60',
    selectedBorder: 'border-amber-400 ring-2 ring-amber-400/50',
    headerBg: 'from-amber-950/90 to-slate-900/90',
    minimapColor: '#fbbf24',
    accentHex: '#fbbf24',
    koLabel: 'Risk (위험관리)',
  },
};

interface ClassNodeData extends Record<string, unknown> {
  cls: OntologyClassDef;
  isSelected: boolean;
  selectedPropertyUri: string | null;
  layoutDirection: 'LR' | 'TB';
  onSelectClassNode: (cls: OntologyClassDef) => void;
  onSelectPropertyFromNode: (cls: OntologyClassDef, prop: OntologyPropertyDef) => void;
}

interface PropertyNodeData extends Record<string, unknown> {
  prop: OntologyPropertyDef;
  ownerClass: OntologyClassDef;
  isSelected: boolean;
  layoutDirection: 'LR' | 'TB';
  onSelectPropertyNode: (cls: OntologyClassDef, prop: OntologyPropertyDef) => void;
}

const OntologyClassFlowNode: React.FC<NodeProps<Node<ClassNodeData>>> = ({ data }) => {
  const {
    cls,
    isSelected,
    selectedPropertyUri,
    layoutDirection,
    onSelectClassNode,
    onSelectPropertyFromNode,
  } = data;
  const theme = DOMAIN_THEME[cls.domain] || DOMAIN_THEME.Product;
  const datatypeProps = cls.fields.filter((f) => !f.isObjectRelation);
  const relationProps = cls.fields.filter((f) => f.isObjectRelation);

  const targetPos = layoutDirection === 'LR' ? Position.Left : Position.Top;
  const sourcePos = layoutDirection === 'LR' ? Position.Right : Position.Bottom;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelectClassNode(cls);
      }}
      className={`w-[270px] rounded-xl bg-slate-900/95 border-2 transition-all shadow-xl cursor-pointer select-none overflow-hidden ${
        isSelected
          ? `${theme.selectedBorder} shadow-indigo-500/20 scale-[1.02]`
          : `${theme.borderColor} hover:border-slate-400`
      }`}
    >
      <Handle
        type="target"
        position={targetPos}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-slate-900"
      />

      {/* Node Header */}
      <div className={`px-3 py-2 bg-gradient-to-r ${theme.headerBg} border-b border-slate-800`}>
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950/80 text-indigo-300 border border-indigo-500/30">
            {cls.uri}
          </span>
          <div className="flex items-center gap-1">
            {cls.isRootQuery && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Root
              </span>
            )}
            <span
              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${theme.badgeBg} ${theme.badgeText}`}
            >
              {cls.domain}
            </span>
          </div>
        </div>

        <div className="mt-1.5 flex items-baseline justify-between gap-1">
          <div className="font-extrabold text-sm text-white tracking-tight truncate">
            {cls.localName}
          </div>
          <span className="text-[10px] font-mono text-slate-400 shrink-0">rdfs:Class</span>
        </div>
        <div className="text-[11px] text-slate-300 truncate">{cls.label}</div>
      </div>

      {/* Node Property Preview List */}
      <div className="p-2.5 space-y-1.5 bg-slate-950/80">
        <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800/80">
          <span className="flex items-center gap-1 font-mono truncate max-w-[165px]">
            <Database className="w-3 h-3 text-emerald-400 shrink-0" />
            {cls.sourceService}
          </span>
          <span className="font-semibold text-indigo-300">
            속성 {datatypeProps.length} · 관계 {relationProps.length}
          </span>
        </div>

        <div className="space-y-1 max-h-[132px] overflow-y-auto pr-0.5">
          {cls.fields.slice(0, 6).map((prop) => {
            const isPropSelected = selectedPropertyUri === prop.uri;
            return (
              <div
                key={prop.uri}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPropertyFromNode(cls, prop);
                }}
                className={`px-2 py-1 rounded text-[10px] flex items-center justify-between gap-1.5 transition ${
                  isPropSelected
                    ? 'bg-indigo-600/40 border border-indigo-400 text-white'
                    : prop.isObjectRelation
                    ? 'bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-200 border border-indigo-500/20'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1 truncate">
                  {prop.rangeUri === 'xsd:ID' ? (
                    <KeyRound className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  ) : prop.isObjectRelation ? (
                    <Link2 className="w-2.5 h-2.5 text-pink-400 shrink-0" />
                  ) : (
                    <Tag className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                  )}
                  <span className="font-mono font-medium truncate">{prop.localName}</span>
                </div>
                <span
                  className={`font-mono text-[9.5px] shrink-0 ${
                    prop.isObjectRelation ? 'text-pink-300 font-semibold' : 'text-emerald-400'
                  }`}
                >
                  {prop.rangeUri}
                </span>
              </div>
            );
          })}
          {cls.fields.length > 6 && (
            <div className="text-center text-[10px] text-indigo-300/90 pt-0.5 font-medium">
              + {cls.fields.length - 6}개 프로퍼티 더보기 (클릭)
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={sourcePos}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-slate-900"
      />
    </div>
  );
};

const OntologyPropertyFlowNode: React.FC<NodeProps<Node<PropertyNodeData>>> = ({ data }) => {
  const { prop, ownerClass, isSelected, layoutDirection, onSelectPropertyNode } = data;
  const targetPos = layoutDirection === 'LR' ? Position.Left : Position.Top;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelectPropertyNode(ownerClass, prop);
      }}
      className={`w-[210px] px-2.5 py-2 rounded-lg border transition-all cursor-pointer select-none shadow-md ${
        isSelected
          ? 'bg-indigo-950 border-amber-400 ring-2 ring-amber-400/40 scale-105'
          : 'bg-slate-900/95 border-slate-700 hover:border-indigo-400'
      }`}
    >
      <Handle
        type="target"
        position={targetPos}
        className="!w-2 !h-2 !bg-amber-400 !border !border-slate-900"
      />
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[9.5px] text-amber-300 font-semibold truncate">
          {prop.uri}
        </span>
        <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-800 text-emerald-300 border border-slate-700">
          {prop.rangeUri}
        </span>
      </div>
      <div className="text-[11px] font-bold text-slate-100 mt-0.5 truncate">{prop.label}</div>
      <div className="flex items-center justify-between text-[9.5px] text-slate-400 mt-1 font-mono">
        <span>src: {prop.sourceField}</span>
        <span>{prop.required ? 'Required' : 'Optional'}</span>
      </div>
    </div>
  );
};

const nodeTypes = {
  ontologyClass: OntologyClassFlowNode,
  ontologyProperty: OntologyPropertyFlowNode,
};

function computeDagreLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: direction === 'LR' ? 55 : 65,
    ranksep: direction === 'LR' ? 130 : 110,
    marginx: 30,
    marginy: 30,
  });

  nodes.forEach((node) => {
    const isPropNode = node.type === 'ontologyProperty';
    g.setNode(node.id, {
      width: isPropNode ? 220 : 280,
      height: isPropNode ? 76 : 240,
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    const isPropNode = node.type === 'ontologyProperty';
    const w = isPropNode ? 220 : 280;
    const h = isPropNode ? 76 : 240;
    return {
      ...node,
      position: {
        x: (pos?.x ?? 0) - w / 2,
        y: (pos?.y ?? 0) - h / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

const SWIMLANE_POSITIONS: Record<string, { x: number; y: number }> = {
  InsuranceProduct: { x: 60, y: 60 },
  Coverage: { x: 60, y: 350 },
  BenefitCondition: { x: 60, y: 640 },

  UnderwritingCase: { x: 430, y: 60 },
  UnderwritingRule: { x: 430, y: 350 },
  UnderwritingDecision: { x: 430, y: 640 },

  ApplicantProfile: { x: 800, y: 60 },
  RiskFactor: { x: 800, y: 350 },
  RiskAssessment: { x: 800, y: 640 },
};

export const OntologyViewerTab: React.FC<OntologyViewerTabProps> = ({
  rawJsonLd,
  selectedClassName: externalSelectedClassName,
  onSelectClass: externalOnSelectClass,
}) => {
  const effectiveJsonLd = rawJsonLd && rawJsonLd.trim().length > 0 ? rawJsonLd : DEFAULT_ONTOLOGY_JSONLD;

  const parsedOntology = useMemo(() => {
    try {
      return parseJsonLdOntology(effectiveJsonLd);
    } catch {
      return parseJsonLdOntology(DEFAULT_ONTOLOGY_JSONLD);
    }
  }, [effectiveJsonLd]);

  const { metadata, rawJsonObj, rawNodeMap } = parsedOntology;

  const [selectedClassUri, setSelectedClassUri] = useState<string>('ins:UnderwritingCase');
  const [selectedProperty, setSelectedProperty] = useState<OntologyPropertyDef | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('DAGRE_LR');
  const [graphMode, setGraphMode] = useState<GraphMode>('CLASS_ONLY');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<'ALL' | 'DATATYPE' | 'OBJECT'>('ALL');
  const [inspectorTab, setInspectorTab] = useState<InspectorSubTab>('PROPERTIES');
  const [showFullJsonModal, setShowFullJsonModal] = useState<boolean>(false);

  // Sync external selectedClassName if provided
  useEffect(() => {
    if (externalSelectedClassName) {
      const matched = metadata.classes.find(
        (c) => c.localName === externalSelectedClassName || c.uri === externalSelectedClassName
      );
      if (matched) {
        setSelectedClassUri(matched.uri);
      }
    }
  }, [externalSelectedClassName, metadata.classes]);

  const selectedClass: OntologyClassDef = useMemo(() => {
    return (
      metadata.classes.find((c) => c.uri === selectedClassUri) ||
      metadata.classes[0]
    );
  }, [metadata.classes, selectedClassUri]);

  const handleSelectClass = useCallback(
    (cls: OntologyClassDef) => {
      setSelectedClassUri(cls.uri);
      setSelectedProperty(null);
      externalOnSelectClass?.(cls.localName);
    },
    [externalOnSelectClass]
  );

  const handleSelectProperty = useCallback(
    (cls: OntologyClassDef, prop: OntologyPropertyDef) => {
      setSelectedClassUri(cls.uri);
      setSelectedProperty(prop);
      setInspectorTab('PROPERTIES');
      externalOnSelectClass?.(cls.localName);
    },
    [externalOnSelectClass]
  );

  // Filtered classes based on domain and search query
  const visibleClasses = useMemo(() => {
    return metadata.classes.filter((cls) => {
      if (domainFilter !== 'ALL' && cls.domain !== domainFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const classMatch =
        cls.uri.toLowerCase().includes(q) ||
        cls.localName.toLowerCase().includes(q) ||
        cls.label.toLowerCase().includes(q) ||
        cls.comment.toLowerCase().includes(q);
      const propMatch = cls.fields.some(
        (f) =>
          f.uri.toLowerCase().includes(q) ||
          f.localName.toLowerCase().includes(q) ||
          f.label.toLowerCase().includes(q) ||
          f.sourceField.toLowerCase().includes(q)
      );
      return classMatch || propMatch;
    });
  }, [metadata.classes, domainFilter, searchQuery]);

  // Build React Flow nodes & edges
  const { flowNodes, flowEdges } = useMemo(() => {
    const visibleUris = new Set(visibleClasses.map((c) => c.uri));
    const layoutDir: 'LR' | 'TB' = layoutMode === 'DAGRE_TB' ? 'TB' : 'LR';

    const rawNodes: Node[] = visibleClasses.map((cls, idx) => {
      const swimlanePos = SWIMLANE_POSITIONS[cls.localName] || {
        x: (idx % 3) * 370 + 60,
        y: Math.floor(idx / 3) * 290 + 60,
      };
      return {
        id: cls.uri,
        type: 'ontologyClass',
        position: swimlanePos,
        data: {
          cls,
          isSelected: cls.uri === selectedClass?.uri,
          selectedPropertyUri: selectedProperty?.uri || null,
          layoutDirection: layoutDir,
          onSelectClassNode: handleSelectClass,
          onSelectPropertyFromNode: handleSelectProperty,
        },
      };
    });

    const rawEdges: Edge[] = metadata.objectEdges
      .filter((e) => visibleUris.has(e.sourceClassUri) && visibleUris.has(e.targetClassUri))
      .map((edge: OntologyGraphEdge) => {
        const isEdgeSelected = selectedProperty?.uri === edge.propertyUri;
        const isConnectedToSelected =
          edge.sourceClassUri === selectedClass?.uri || edge.targetClassUri === selectedClass?.uri;

        const strokeColor = isEdgeSelected
          ? '#fbbf24'
          : edge.isCrossService
          ? '#f472b6'
          : isConnectedToSelected
          ? '#818cf8'
          : '#64748b';

        return {
          id: edge.id,
          source: edge.sourceClassUri,
          target: edge.targetClassUri,
          label: `${edge.propertyUri} (${edge.propertyLabel})`,
          animated: edge.isCrossService || isEdgeSelected,
          style: {
            stroke: strokeColor,
            strokeWidth: isEdgeSelected ? 3 : isConnectedToSelected ? 2.4 : 1.8,
            strokeDasharray: edge.isCrossService ? '6 4' : undefined,
          },
          labelStyle: {
            fill: edge.isCrossService ? '#fbcfe8' : '#e2e8f0',
            fontWeight: 600,
            fontSize: 10,
            fontFamily: 'monospace',
          },
          labelBgStyle: {
            fill: '#0f172a',
            fillOpacity: 0.92,
            stroke: edge.isCrossService ? '#db2777' : '#334155',
            strokeWidth: 1,
          },
          labelBgPadding: [6, 4] as [number, number],
          labelBgBorderRadius: 6,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
            width: 18,
            height: 18,
          },
          data: { edge },
        };
      });

    // Optional Datatype Property Nodes expansion
    if (graphMode !== 'CLASS_ONLY') {
      const targetClasses =
        graphMode === 'EXPAND_SELECTED_PROPS'
          ? visibleClasses.filter((c) => c.uri === selectedClass?.uri)
          : visibleClasses;

      targetClasses.forEach((cls) => {
        const datatypeProps = cls.fields.filter((f) => !f.isObjectRelation);
        datatypeProps.forEach((prop, pIdx) => {
          const propNodeId = `prop__${prop.uri}`;
          rawNodes.push({
            id: propNodeId,
            type: 'ontologyProperty',
            position: { x: 0, y: pIdx * 80 },
            data: {
              prop,
              ownerClass: cls,
              isSelected: selectedProperty?.uri === prop.uri,
              layoutDirection: layoutDir,
              onSelectPropertyNode: handleSelectProperty,
            },
          });

          rawEdges.push({
            id: `edge__${cls.uri}__${prop.uri}`,
            source: cls.uri,
            target: propNodeId,
            animated: selectedProperty?.uri === prop.uri,
            style: {
              stroke: selectedProperty?.uri === prop.uri ? '#fbbf24' : '#475569',
              strokeWidth: selectedProperty?.uri === prop.uri ? 2.2 : 1.2,
              strokeDasharray: '3 3',
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: selectedProperty?.uri === prop.uri ? '#fbbf24' : '#475569',
              width: 14,
              height: 14,
            },
          });
        });
      });
    }

    if (layoutMode === 'DAGRE_LR') {
      const layouted = computeDagreLayout(rawNodes, rawEdges, 'LR');
      return { flowNodes: layouted.nodes, flowEdges: layouted.edges };
    }
    if (layoutMode === 'DAGRE_TB') {
      const layouted = computeDagreLayout(rawNodes, rawEdges, 'TB');
      return { flowNodes: layouted.nodes, flowEdges: layouted.edges };
    }

    // For DOMAIN_SWIMLANE with expanded properties, position property nodes beside the selected class
    if (graphMode !== 'CLASS_ONLY') {
      const layouted = computeDagreLayout(rawNodes, rawEdges, 'LR');
      return { flowNodes: layouted.nodes, flowEdges: layouted.edges };
    }

    return { flowNodes: rawNodes, flowEdges: rawEdges };
  }, [
    visibleClasses,
    metadata.objectEdges,
    selectedClass,
    selectedProperty,
    layoutMode,
    graphMode,
    handleSelectClass,
    handleSelectProperty,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const ontEdge = edge.data?.edge as OntologyGraphEdge | undefined;
      if (!ontEdge) return;
      const srcClass = metadata.classes.find((c) => c.uri === ontEdge.sourceClassUri);
      const prop = metadata.properties.find((p) => p.uri === ontEdge.propertyUri);
      if (srcClass && prop) {
        handleSelectProperty(srcClass, prop);
      }
    },
    [metadata.classes, metadata.properties, handleSelectProperty]
  );

  // Filtered properties of selected class for the right-hand inspector
  const filteredClassProperties = useMemo(() => {
    if (!selectedClass) return [];
    return selectedClass.fields.filter((f) => {
      if (propertyTypeFilter === 'DATATYPE' && f.isObjectRelation) return false;
      if (propertyTypeFilter === 'OBJECT' && !f.isObjectRelation) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        f.uri.toLowerCase().includes(q) ||
        f.localName.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q) ||
        f.comment.toLowerCase().includes(q) ||
        f.sourceField.toLowerCase().includes(q)
      );
    });
  }, [selectedClass, propertyTypeFilter, searchQuery]);

  // Incoming & Outgoing edges for the selected class
  const outgoingEdges = useMemo(
    () => metadata.objectEdges.filter((e) => e.sourceClassUri === selectedClass?.uri),
    [metadata.objectEdges, selectedClass]
  );
  const incomingEdges = useMemo(
    () => metadata.objectEdges.filter((e) => e.targetClassUri === selectedClass?.uri),
    [metadata.objectEdges, selectedClass]
  );

  // Raw JSON-LD snippet for currently inspected class or property
  const selectedRawJsonLd = useMemo(() => {
    if (selectedProperty && rawNodeMap[selectedProperty.uri]) {
      return rawNodeMap[selectedProperty.uri];
    }
    if (selectedClass && rawNodeMap[selectedClass.uri]) {
      const classRaw = rawNodeMap[selectedClass.uri];
      const propsRaw = selectedClass.fields
        .map((f) => rawNodeMap[f.uri])
        .filter(Boolean);
      return {
        '@context': metadata.context,
        selectedClassNode: classRaw,
        domainProperties: propsRaw,
      };
    }
    return rawJsonObj;
  }, [selectedClass, selectedProperty, rawNodeMap, metadata.context, rawJsonObj]);

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden">
      {/* Top Toolbar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
            <Network className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-white">
                JSON-LD 온톨로지 그래프 뷰어 (Interactive Ontology Viewer)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Open-Source: @xyflow/react + @dagrejs/dagre
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {metadata.ontologyId} (v{metadata.version})
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              <code className="text-indigo-300">insurance-ontology.jsonld</code> · 총{' '}
              <strong className="text-white">{metadata.classes.length}개</strong> RDFS 클래스,{' '}
              <strong className="text-white">{metadata.properties.length}개</strong> RDF 프로퍼티,{' '}
              <strong className="text-white">{metadata.objectEdges.length}개</strong> 객체 관계 엣지 — 노드를 클릭하면 우측에 상세 프로퍼티가 표시됩니다.
            </p>
          </div>
        </div>

        {/* Search, Domain Filter, Layout & Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="클래스 / 프로퍼티 / 원천필드 검색..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
            />
          </div>

          {/* Domain Filter */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            {(['ALL', 'Product', 'Underwriting', 'Risk'] as const).map((dom) => (
              <button
                key={dom}
                type="button"
                onClick={() => setDomainFilter(dom)}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  domainFilter === dom
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dom === 'ALL' ? '전체 도메인' : dom}
              </button>
            ))}
          </div>

          {/* Layout Engine Selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setLayoutMode('DAGRE_LR')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                layoutMode === 'DAGRE_LR'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dagre (좌→우)
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('DAGRE_TB')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                layoutMode === 'DAGRE_TB'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dagre (상→하)
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('DOMAIN_SWIMLANE')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                layoutMode === 'DOMAIN_SWIMLANE'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              도메인 그리드
            </button>
          </div>

          {/* Property Node Expansion Mode */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setGraphMode('CLASS_ONLY')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                graphMode === 'CLASS_ONLY'
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              클래스 노드 뷰
            </button>
            <button
              type="button"
              onClick={() => setGraphMode('EXPAND_SELECTED_PROPS')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                graphMode === 'EXPAND_SELECTED_PROPS'
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              선택 클래스 속성노드 펼치기
            </button>
          </div>

          {/* Raw JSON-LD Full View Modal Button */}
          <button
            type="button"
            onClick={() => setShowFullJsonModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <FileJson className="w-3.5 h-3.5 text-amber-400" />
            <span>JSON-LD 원문</span>
          </button>
        </div>
      </div>

      {/* Main Split View: Left Interactive Graph Canvas (7 cols) + Right Property Inspector (5 cols) */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left: React Flow Interactive Graph Canvas */}
        <div className="col-span-12 lg:col-span-7 h-full relative bg-slate-950 border-r border-slate-800">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgeClick={handleEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            minZoom={0.25}
            maxZoom={1.8}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1.2}
              color="#334155"
            />
            <Controls
              position="bottom-left"
              className="!bg-slate-900 !border-slate-700 !rounded-lg !shadow-xl [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!text-slate-200 [&>button:hover]:!bg-slate-800"
            />
            <MiniMap
              position="bottom-right"
              pannable
              zoomable
              className="!bg-slate-900/95 !border !border-slate-800 !rounded-lg"
              nodeColor={(n) => {
                if (n.type === 'ontologyProperty') return '#fbbf24';
                const cls = (n.data as ClassNodeData)?.cls;
                return DOMAIN_THEME[cls?.domain || 'Product']?.minimapColor || '#38bdf8';
              }}
            />

            {/* Floating Legend Panel */}
            <Panel
              position="top-left"
              className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-lg text-xs space-y-1.5 max-w-xs"
            >
              <div className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px]">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                온톨로지 도메인 & 관계 범례
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
                <span className="flex items-center gap-1 text-sky-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                  Product (상품)
                </span>
                <span className="flex items-center gap-1 text-violet-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" />
                  Underwriting (심사)
                </span>
                <span className="flex items-center gap-1 text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  Risk (위험)
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 bg-slate-400 inline-block" /> 도메인 내부 참조
                </span>
                <span className="flex items-center gap-1 text-pink-300">
                  <span className="w-4 h-0.5 border-b-2 border-dashed border-pink-400 inline-block" />{' '}
                  Cross-Service Join
                </span>
              </div>
            </Panel>

            {/* Quick Class Jump Pills Panel */}
            <Panel
              position="top-right"
              className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2 shadow-lg max-w-[360px]"
            >
              <div className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
                빠른 클래스 노드 선택 ({metadata.classes.length}개 RDFS Class)
              </div>
              <div className="flex flex-wrap gap-1">
                {metadata.classes.map((cls) => {
                  const active = cls.uri === selectedClass?.uri;
                  const theme = DOMAIN_THEME[cls.domain] || DOMAIN_THEME.Product;
                  return (
                    <button
                      key={cls.uri}
                      type="button"
                      onClick={() => handleSelectClass(cls)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition border ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-400 font-bold shadow'
                          : `${theme.badgeBg} ${theme.badgeText} hover:opacity-90`
                      }`}
                    >
                      {cls.localName}
                    </button>
                  );
                })}
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Right: Node & Property Detail Inspector Panel */}
        <div className="col-span-12 lg:col-span-5 h-full flex flex-col bg-slate-900/95 overflow-hidden">
          {selectedClass && (
            <>
              {/* Selected Class Banner Header */}
              <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-2.5 shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        @type: rdfs:Class
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          (DOMAIN_THEME[selectedClass.domain] || DOMAIN_THEME.Product).badgeBg
                        } ${(DOMAIN_THEME[selectedClass.domain] || DOMAIN_THEME.Product).badgeText}`}
                      >
                        ins:domain = &quot;{selectedClass.domain}&quot;
                      </span>
                      {selectedClass.isRootQuery && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ins:isRootQuery = true
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-1.5 flex items-center gap-2">
                      <span>{selectedClass.uri}</span>
                      <span className="text-xs font-normal text-slate-400">
                        ({selectedClass.label})
                      </span>
                    </h3>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                      Expanded IRI: {expandUri(selectedClass.uri, metadata.context)}
                    </div>
                  </div>
                </div>

                {/* Comment description */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                  {selectedClass.comment}
                </p>

                {/* Source Service & Endpoint Metadata */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/90">
                    <div className="text-[10px] text-slate-400">원천 마이크로서비스 (ins:sourceService)</div>
                    <div className="font-mono text-emerald-300 font-semibold mt-0.5 flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{selectedClass.sourceService}</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/90">
                    <div className="text-[10px] text-slate-400">원천 엔드포인트 (ins:sourceEndpoint)</div>
                    <div className="font-mono text-amber-300 text-[11px] font-medium mt-0.5 truncate">
                      {selectedClass.sourceEndpoint}
                    </div>
                  </div>
                </div>

                {/* Inspector Sub-Tabs */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setInspectorTab('PROPERTIES')}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        inspectorTab === 'PROPERTIES'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      프로퍼티 목록 ({selectedClass.fields.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('RELATIONS')}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        inspectorTab === 'RELATIONS'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      연결 관계 ({outgoingEdges.length + incomingEdges.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('JSONLD')}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        inspectorTab === 'JSONLD'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      JSON-LD 노드 원문
                    </button>
                  </div>

                  {inspectorTab === 'PROPERTIES' && (
                    <div className="flex items-center gap-1 text-[11px]">
                      {(['ALL', 'DATATYPE', 'OBJECT'] as const).map((ft) => (
                        <button
                          key={ft}
                          type="button"
                          onClick={() => setPropertyTypeFilter(ft)}
                          className={`px-2 py-0.5 rounded border transition ${
                            propertyTypeFilter === ft
                              ? 'bg-slate-800 text-white border-slate-600 font-semibold'
                              : 'text-slate-400 border-transparent hover:text-slate-200'
                          }`}
                        >
                          {ft === 'ALL' ? '전체' : ft === 'DATATYPE' ? '스칼라(xsd)' : '객체참조(ins)'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Individual Property Spotlight Card (when a property is clicked) */}
              {selectedProperty && (
                <div className="mx-4 mt-3 p-3.5 rounded-xl bg-indigo-950/50 border-2 border-indigo-500/60 space-y-2 shrink-0 shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        @type: rdf:Property 상세
                      </span>
                      <span className="font-mono text-xs font-extrabold text-white">
                        {selectedProperty.uri}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProperty(null)}
                      className="text-[11px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700"
                    >
                      닫기 ✕
                    </button>
                  </div>

                  <div className="text-xs font-bold text-indigo-200">
                    {selectedProperty.label}{' '}
                    <span className="font-normal text-slate-300">— {selectedProperty.comment}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono pt-1">
                    <div className="p-1.5 rounded bg-slate-950/90 border border-slate-800">
                      <span className="text-slate-400 block text-[9.5px]">rdfs:domain</span>
                      <span className="text-indigo-300 font-semibold">{selectedProperty.domainUri}</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950/90 border border-slate-800">
                      <span className="text-slate-400 block text-[9.5px]">rdfs:range</span>
                      <span className="text-amber-300 font-semibold">{selectedProperty.rangeUri}</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950/90 border border-slate-800">
                      <span className="text-slate-400 block text-[9.5px]">GraphQL Type</span>
                      <span className="text-emerald-300 font-semibold">
                        {selectedProperty.graphqlType}
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950/90 border border-slate-800">
                      <span className="text-slate-400 block text-[9.5px]">ins:sourceField</span>
                      <span className="text-slate-200">{selectedProperty.sourceField}</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950/90 border border-slate-800">
                      <span className="text-slate-400 block text-[9.5px]">ins:required / isList</span>
                      <span className="text-slate-200">
                        {selectedProperty.required ? ' 필수(true)' : '선택(false)'} ·{' '}
                        {selectedProperty.isList ? '배열(List)' : '단건'}
                      </span>
                    </div>
                    {selectedProperty.isObjectRelation && (
                      <div className="p-1.5 rounded bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block text-[9.5px]">참조 대상 이동</span>
                          <span className="text-pink-300 font-semibold">
                            {extractLocalName(selectedProperty.rangeUri)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const targetCls = metadata.classes.find(
                              (c) => c.uri === selectedProperty.rangeUri
                            );
                            if (targetCls) handleSelectClass(targetCls);
                          }}
                          className="p-1 rounded bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40"
                          title="대상 클래스 노드로 이동"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Inspector Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {inspectorTab === 'PROPERTIES' && (
                  <>
                    {filteredClassProperties.map((prop) => {
                      const isPropActive = selectedProperty?.uri === prop.uri;
                      const targetCls = prop.isObjectRelation
                        ? metadata.classes.find((c) => c.uri === prop.rangeUri)
                        : undefined;

                      return (
                        <div
                          key={prop.uri}
                          onClick={() => setSelectedProperty(isPropActive ? null : prop)}
                          className={`p-3 rounded-xl border transition cursor-pointer ${
                            isPropActive
                              ? 'bg-indigo-950/60 border-indigo-400 shadow-md'
                              : prop.isObjectRelation
                              ? 'bg-slate-950/90 border-indigo-500/30 hover:border-indigo-400/70'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-indigo-300">
                                {prop.uri}
                              </span>
                              <span className="text-xs font-bold text-white">{prop.label}</span>
                              {prop.required && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  required
                                </span>
                              )}
                              {prop.isList && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                  isList: true
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                {prop.rangeUri}
                              </span>
                              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                                → {prop.graphqlType}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                            {prop.comment}
                          </p>

                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                            <div className="flex items-center gap-3 text-slate-400">
                              <span>
                                ins:sourceField ={' '}
                                <strong className="text-slate-200">{prop.sourceField}</strong>
                              </span>
                              {prop.crossServiceJoin && (
                                <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                  ↗ ins:crossServiceJoin: {prop.crossServiceJoin}
                                </span>
                              )}
                            </div>

                            {targetCls && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectClass(targetCls);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-pink-300 hover:text-pink-200 bg-pink-500/15 px-2 py-0.5 rounded border border-pink-500/30"
                              >
                                <span>{targetCls.localName} 노드로 이동</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {inspectorTab === 'RELATIONS' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-300 mb-2 flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5" />
                        나가는 객체 참조 (Outgoing Object Properties · rdfs:domain ={' '}
                        {selectedClass.uri})
                      </h4>
                      {outgoingEdges.length === 0 ? (
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-500">
                          이 클래스에서 다른 클래스로 나가는 객체 참조 프로퍼티가 없습니다 (리프 엔티티).
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {outgoingEdges.map((edge) => {
                            const tgt = metadata.classes.find(
                              (c) => c.uri === edge.targetClassUri
                            );
                            return (
                              <div
                                key={edge.id}
                                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-indigo-300">
                                      {edge.propertyUri}
                                    </span>
                                    <span className="text-xs text-slate-300">
                                      ({edge.propertyLabel})
                                    </span>
                                    {edge.isCrossService && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                        Cross-Service: {edge.crossServiceName}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                                    {edge.sourceClassUri} ──[{edge.propertyName}]──▶{' '}
                                    <strong className="text-emerald-300">
                                      {edge.targetClassUri}
                                    </strong>
                                  </div>
                                </div>
                                {tgt && (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectClass(tgt)}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold shrink-0"
                                  >
                                    {tgt.localName} 보기 →
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-emerald-300 mb-2 flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5" />
                        들어오는 객체 참조 (Incoming Object Properties · rdfs:range ={' '}
                        {selectedClass.uri})
                      </h4>
                      {incomingEdges.length === 0 ? (
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-500">
                          다른 클래스에서 이 클래스를 참조하는 프로퍼티가 없습니다 (루트 엔티티).
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {incomingEdges.map((edge) => {
                            const src = metadata.classes.find(
                              (c) => c.uri === edge.sourceClassUri
                            );
                            return (
                              <div
                                key={edge.id}
                                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-emerald-300">
                                      {edge.propertyUri}
                                    </span>
                                    <span className="text-xs text-slate-300">
                                      ({edge.propertyLabel})
                                    </span>
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                                    <strong className="text-indigo-300">
                                      {edge.sourceClassUri}
                                    </strong>{' '}
                                    ──[{edge.propertyName}]──▶ {edge.targetClassUri}
                                  </div>
                                </div>
                                {src && (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectClass(src)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shrink-0"
                                  >
                                    ← {src.localName} 보기
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {inspectorTab === 'JSONLD' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        선택된 노드({selectedProperty ? selectedProperty.uri : selectedClass.uri})의{' '}
                        <code className="text-amber-300">insurance-ontology.jsonld</code> 원문 조각
                      </span>
                      {selectedProperty && (
                        <button
                          type="button"
                          onClick={() => setSelectedProperty(null)}
                          className="text-indigo-400 hover:underline text-[11px]"
                        >
                          클래스 전체 JSON-LD 보기
                        </button>
                      )}
                    </div>
                    <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                      {JSON.stringify(selectedRawJsonLd, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Full JSON-LD Source Modal */}
      {showFullJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    backend/src/main/resources/ontology/insurance-ontology.jsonld 전체 원문
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {metadata.label} · {metadata.classes.length} Classes ·{' '}
                    {metadata.properties.length} Properties
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFullJsonModal(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                닫기 ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5 bg-slate-950">
              <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
                {effectiveJsonLd}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
