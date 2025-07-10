
export interface SearchResult {
  title: string;
  url: string;
  coverImageUrl: string;
  // AI-enriched data
  rating?: number;
  tags?: string[];
  briefSummary?: string;
  publicationYear?: number;
  validityRating?: string;
  // UI state
  selected?: boolean;
}

export interface GraphNode {
    resultIndex: number; 
    title: string;
}

export interface CorrelationCluster {
    theme: string;
    description: string;
    nodes: GraphNode[];
}

export interface CorrelationData {
    clusters: CorrelationCluster[];
}

export interface SearchSession {
  query: string;
  summary: string;
  results: SearchResult[];
  correlationData?: CorrelationData;
  timestamp: number;
  selectionMode?: boolean;
}

export enum AppStatus {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

export enum AppView {
    SEARCH,
    EDITOR,
}
