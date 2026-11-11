import { OntologyClassDef, OntologyGraphEdge, OntologyMetadata, OntologyPropertyDef } from './types';

export interface ParsedJsonLdOntology {
  metadata: OntologyMetadata;
  rawJsonObj: Record<string, unknown>;
  rawNodeMap: Record<string, Record<string, unknown>>;
}

export function extractLocalName(uri: string): string {
  if (!uri) return 'Unknown';
  const colonIdx = uri.indexOf(':');
  if (colonIdx >= 0 && colonIdx + 1 < uri.length) {
    return uri.substring(colonIdx + 1);
  }
  const hashIdx = uri.lastIndexOf('#');
  if (hashIdx >= 0 && hashIdx + 1 < uri.length) {
    return uri.substring(hashIdx + 1);
  }
  return uri;
}

export function expandUri(uri: string, context: Record<string, string>): string {
  if (!uri) return '';
  const colonIdx = uri.indexOf(':');
  if (colonIdx > 0) {
    const prefix = uri.substring(0, colonIdx);
    const local = uri.substring(colonIdx + 1);
    if (context[prefix]) {
      return `${context[prefix]}${local}`;
    }
  }
  return uri;
}

export function mapRangeToGraphQLType(rangeUri: string): string {
  switch (rangeUri) {
    case 'xsd:ID':
      return 'ID';
    case 'xsd:string':
    case 'xsd:date':
    case 'xsd:dateTime':
      return 'String';
    case 'xsd:int':
    case 'xsd:integer':
    case 'xsd:long':
      return 'Int';
    case 'xsd:float':
    case 'xsd:double':
    case 'xsd:decimal':
      return 'Float';
    case 'xsd:boolean':
      return 'Boolean';
    default:
      return extractLocalName(rangeUri);
  }
}

function buildGraphQLTypeExpression(baseType: string, isList: boolean, required: boolean): string {
  if (isList) {
    return required ? `[${baseType}!]!` : `[${baseType}!]`;
  }
  return required ? `${baseType}!` : baseType;
}

export function parseJsonLdOntology(jsonLdText: string): ParsedJsonLdOntology {
  const root = JSON.parse(jsonLdText) as Record<string, unknown>;
  const ontologyId = String(root['@id'] || 'ins:InsuranceProductUnderwritingOntology');
  const label = String(root['rdfs:label'] || 'Insurance Ontology');
  const comment = String(root['rdfs:comment'] || '');
  const version = String(root['ins:version'] || '1.0.0');

  const context: Record<string, string> = {};
  if (root['@context'] && typeof root['@context'] === 'object') {
    for (const [k, v] of Object.entries(root['@context'] as Record<string, unknown>)) {
      context[k] = String(v);
    }
  }

  const graphArray = Array.isArray(root['@graph'])
    ? (root['@graph'] as Record<string, unknown>[])
    : [];

  const rawNodeMap: Record<string, Record<string, unknown>> = {};
  const classNodesMap = new Map<string, Record<string, unknown>>();
  const propertyNodes: Record<string, unknown>[] = [];

  for (const item of graphArray) {
    const id = String(item['@id'] || '');
    const type = String(item['@type'] || '');
    if (id) {
      rawNodeMap[id] = item;
    }
    if (type === 'rdfs:Class' && id) {
      classNodesMap.set(id, item);
    } else if (type === 'rdf:Property' && id) {
      propertyNodes.push(item);
    }
  }

  const allProperties: OntologyPropertyDef[] = [];
  const objectEdges: OntologyGraphEdge[] = [];

  for (const propNode of propertyNodes) {
    const uri = String(propNode['@id'] || '');
    const localName = extractLocalName(uri);
    const propLabel = String(propNode['rdfs:label'] || localName);
    const propComment = String(propNode['rdfs:comment'] || '');
    const domainUri = String(propNode['rdfs:domain'] || '');
    const rangeUri = String(propNode['rdfs:range'] || 'xsd:string');
    const isList = Boolean(propNode['ins:isList']);
    const required = Boolean(propNode['ins:required']);
    const sourceField = String(propNode['ins:sourceField'] || localName);
    const crossServiceJoin = propNode['ins:crossServiceJoin']
      ? String(propNode['ins:crossServiceJoin'])
      : '';

    const isObjectRelation =
      classNodesMap.has(rangeUri) || (!rangeUri.startsWith('xsd:') && rangeUri.startsWith('ins:'));
    const baseGraphqlType = mapRangeToGraphQLType(rangeUri);
    const graphqlType = buildGraphQLTypeExpression(baseGraphqlType, isList, required);

    const propDef: OntologyPropertyDef = {
      uri,
      localName,
      label: propLabel,
      comment: propComment,
      domainUri,
      rangeUri,
      graphqlType,
      isObjectRelation,
      isList,
      required,
      sourceField,
      crossServiceJoin,
    };
    allProperties.push(propDef);

    if (isObjectRelation) {
      const sourceClassName = extractLocalName(domainUri);
      const targetClassName = extractLocalName(rangeUri);
      objectEdges.push({
        id: `${sourceClassName}_${localName}_${targetClassName}`,
        sourceClassUri: domainUri,
        sourceClassName,
        propertyUri: uri,
        propertyName: localName,
        propertyLabel: propLabel,
        targetClassUri: rangeUri,
        targetClassName,
        isCrossService: Boolean(crossServiceJoin),
        crossServiceName: crossServiceJoin,
      });
    }
  }

  const classes: OntologyClassDef[] = [];
  for (const [uri, cNode] of classNodesMap.entries()) {
    const localName = extractLocalName(uri);
    const cLabel = String(cNode['rdfs:label'] || localName);
    const cComment = String(cNode['rdfs:comment'] || '');
    const domain = String(cNode['ins:domain'] || 'General');
    const sourceService = String(cNode['ins:sourceService'] || 'unknown-service');
    const sourceEndpoint = String(cNode['ins:sourceEndpoint'] || '');
    const isRootQuery = Boolean(cNode['ins:isRootQuery']);

    const fields = allProperties.filter((p) => p.domainUri === uri);
    classes.push({
      uri,
      localName,
      label: cLabel,
      comment: cComment,
      domain,
      sourceService,
      sourceEndpoint,
      isRootQuery,
      fields,
    });
  }

  return {
    metadata: {
      ontologyId,
      label,
      comment,
      version,
      context,
      classes,
      properties: allProperties,
      objectEdges,
    },
    rawJsonObj: root,
    rawNodeMap,
  };
}
