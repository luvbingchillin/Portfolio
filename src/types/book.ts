export interface ProjectBook {
  id: string;
  title: string;
  subtitle: string;
  edition: string;
  callNumber: string;
  year: string;
  category: 'Full-Stack' | 'Graphics & 3D' | 'Machine Learning' | 'Systems & Tools' | 'Interactive';
  curator: string;
  shortDescription: string;
  fullSynopsis: string;
  techStack: string[];
  metrics: { label: string; value: string }[];
  keyFeatures: string[];
  coverColor: string;      // Base leather tone (Hex)
  accentColor: string;     // Foil stamping color (Hex)
  bindingMaterial?: string; // Authentic antiquarian bookbinding material description
  foilMaterial?: string;    // Authentic gilded foil stamping description
  pagesEdgeColor?: string; // Paper gilding
  githubUrl?: string;
  liveUrl?: string;
  stackShelf: string;
  thickness?: number;
  ribbonColor?: string;
  glowColor?: string;
  emblemType?: 'ast-tree' | 'card-deck' | 'neural-network' | 'open-book' | 'athenaeum-portal';
}

export type Book = ProjectBook;
