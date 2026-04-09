export interface Source {
  id?: string;
  title: string;
  type: 'book' | 'course' | 'note' | 'article';
  author?: string;
  url?: string;
  createdAt: any;
  userId: string;
}

export interface Chunk {
  id?: string;
  sourceId: string;
  content: string;
  userId: string;
  createdAt: any;
}

export interface KnowledgeUnit {
  id?: string;
  title: string;
  content: string;
  type: 'principle' | 'framework' | 'insight';
  sourceId: string;
  userId: string;
  tags: string[];
  confidence: number;
  createdAt: any;
}

export interface Relationship {
  id?: string;
  fromId: string;
  toId: string;
  type: 'relates_to' | 'derived_from' | 'used_in';
  userId: string;
}
