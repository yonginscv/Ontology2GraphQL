export interface OntologyPropertyDef {
  uri: string;
  localName: string;
  label: string;
  comment: string;
  domainUri: string;
  rangeUri: string;
  graphqlType: string;
  isObjectRelation: boolean;
  isList: boolean;
  required: boolean;
  sourceField: string;
  crossServiceJoin: string;
}

export interface OntologyClassDef {
  uri: string;
  localName: string;
  label: string;
  comment: string;
  domain: 'Product' | 'Risk' | 'Underwriting' | string;
  sourceService: string;
  sourceEndpoint: string;
  isRootQuery: boolean;
  fields: OntologyPropertyDef[];
}

export interface OntologyGraphEdge {
  id: string;
  sourceClassUri: string;
  sourceClassName: string;
  propertyUri: string;
  propertyName: string;
  propertyLabel: string;
  targetClassUri: string;
  targetClassName: string;
  isCrossService: boolean;
  crossServiceName: string;
}

export interface OntologyMetadata {
  ontologyId: string;
  label: string;
  comment: string;
  version: string;
  context: Record<string, string>;
  classes: OntologyClassDef[];
  properties: OntologyPropertyDef[];
  objectEdges: OntologyGraphEdge[];
}

export interface LineageStep {
  stepOrder: number;
  graphqlFieldPath: string;
  ontologyClassUri: string;
  ontologyPropertyUri: string;
  domainName: string;
  sourceService: string;
  httpMethod: string;
  endpointUri: string;
  rawSourceFields: string[];
  latencyMs: number;
  status: string;
}

export interface RiskFactorCatalogItem {
  riskFactorId: string;
  factorCode: string;
  factorName: string;
  riskCategory: string;
  severityLevel: string;
  riskScoreContribution: number;
  clinicalNote: string;
}
