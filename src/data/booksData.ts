import type { ProjectBook } from '../types/book';

export const BOOKS_CATALOG: ProjectBook[] = [
  {
    id: 'code-search',
    title: 'Code Search Engine',
    subtitle: 'Neural Semantic Indexing & AST Retrieval',
    edition: 'First Edition (Refined)',
    callNumber: 'QA 76.73 .C63 2026',
    year: '2026',
    category: 'Systems & Tools',
    curator: 'Kang Yuchen',
    shortDescription: 'Fast semantic code search across large repositories using Rust, Tree-Sitter AST parsing, and vector embeddings.',
    fullSynopsis: 'A semantic codebase search engine that indexes functions, types, and logic flows across large polyglot repositories for natural-language queries. Built with Rust, Tree-Sitter AST chunking, vector embeddings, and an interactive React syntax visualizer.',
    techStack: ['TypeScript', 'Rust', 'Tree-Sitter', 'Vector Search', 'React'],
    metrics: [
      { label: 'Latency', value: '< 18ms' },
      { label: 'Index Capacity', value: '500k+ LoC' },
      { label: 'Accuracy', value: '99.4%' }
    ],
    keyFeatures: [
      'Tree-Sitter AST chunking preserving lexical scope and call hierarchies',
      'Hybrid search combining dense neural vector embeddings with BM25 keyword retrieval',
      'High-performance Rust indexing pipeline with sub-18ms query latency',
      'Interactive syntax visualizer and dependency cross-reference graph in React'
    ],
    coverColor: '#172338',      // Oxford Navy Leather
    accentColor: '#e5be65',     // Gilded Auric Foil
    bindingMaterial: 'Oxford Navy Levant Morocco Leather',
    foilMaterial: '24-Karat Gold Auric Leaf',
    pagesEdgeColor: '#e8dcba',
    ribbonColor: '#1e3a8a',     // Deep Sapphire Silk Ribbon
    glowColor: '#60a5fa',       // Electric Cyan Pulse
    thickness: 0.34,
    emblemType: 'ast-tree',
    githubUrl: 'https://github.com/luvbingchillin/Code-search',
    liveUrl: '#',
    stackShelf: 'Stack IV • Bay 02'
  },
  {
    id: 'card-drafter',
    title: 'CardDrafter',
    subtitle: 'High-Throughput Booster Collation & Draft Engine',
    edition: 'First Edition (Go 1.22)',
    callNumber: 'QA 76.73 .G63 2026',
    year: '2026',
    category: 'Systems & Tools',
    curator: 'Kang Yuchen',
    shortDescription: 'Real-time booster collation and card drafting engine built with Go 1.22, MongoDB, and Python gRPC.',
    fullSynopsis: 'A real-time card drafting and booster pack collation engine. Simulates authentic physical print-sheet collation algorithms and synchronized multiplayer draft lobbies using Go 1.22, MongoDB, Docker, and a Python gRPC analytics microservice.',
    techStack: ['Go', 'MongoDB', 'React 18', 'TypeScript', 'Docker', 'Python', 'gRPC'],
    metrics: [
      { label: 'Pack Latency', value: '< 2ms' },
      { label: 'Collation Engine', value: 'Go 1.22 Mux' },
      { label: 'Architecture', value: 'Clean 3-Tier' }
    ],
    keyFeatures: [
      'Deterministic booster pack collation accurately reproducing authentic physical print runs',
      'Clean three-tier architecture in Go 1.22 with context-aware data access and sub-2ms pack generation',
      'Real-time synchronized multiplayer drafting lobbies managed with in-memory RWMutex state',
      'Scryfall card ingestion pipeline and analytics service communicating via Python gRPC'
    ],
    coverColor: '#2b121c',      // Rich Mythic Burgundy Leather
    accentColor: '#f5a778',     // Warm Copper & Foil Stamped Gold
    bindingMaterial: 'Mythic Burgundy Morocco Leather',
    foilMaterial: 'Warm Copper & Auric Stamping',
    pagesEdgeColor: '#edd3c8',
    ribbonColor: '#991b1b',     // Mythic Red Silk Ribbon
    glowColor: '#f87171',       // Ember Mana Flame
    thickness: 0.38,            // Heavier collation binder
    emblemType: 'card-deck',
    githubUrl: 'https://github.com/luvbingchillin/CardDrafter',
    liveUrl: '#',
    stackShelf: 'Stack I • Bay 01'
  },
  {
    id: 'automate-ai',
    title: 'AutomateAI',
    subtitle: 'AI Employee Development & Performance Platform',
    edition: 'SAP x NTU Hackathon Edition',
    callNumber: 'HF 5549.5 .A88 2025',
    year: '2025',
    category: 'Full-Stack',
    curator: 'Kang Yuchen',
    shortDescription: 'AI workforce development platform built with FastAPI, LangChain, OpenAI, and React.',
    fullSynopsis: 'An enterprise workforce development platform engineered for the SAP x NTU Hackathon. Automates employee onboarding, managerial performance review synthesis, and career skills gap assessments using FastAPI, Python, LangChain, OpenAI, and PostgreSQL.',
    techStack: ['React 18', 'FastAPI', 'Python', 'LangChain', 'OpenAI', 'PostgreSQL', 'Docker'],
    metrics: [
      { label: 'Competition', value: 'SAP x NTU' },
      { label: 'AI Workflows', value: '4 Core Modules' },
      { label: 'Deployment', value: 'Vercel + Cloud' }
    ],
    keyFeatures: [
      'Interactive onboarding workflows with automated HR checklist progression',
      'Managerial performance review synthesis and constructive feedback drafts powered by LangChain & OpenAI',
      'Personalized skills gap analysis engine mapping employee growth to internal opportunities',
      'Modular microservice backend built with FastAPI, PostgreSQL, and Docker containerization'
    ],
    coverColor: '#0f2821',      // Deep Malachite Pine Leather
    accentColor: '#6ee7b7',     // Radiant Mint & Gold Foil
    bindingMaterial: 'Deep Malachite Pine Calfskin',
    foilMaterial: 'Radiant Mint & Auric Leaf',
    pagesEdgeColor: '#dcf2e8',
    ribbonColor: '#047857',     // Emerald Silk Ribbon
    glowColor: '#34d399',       // Neural Mint Aura
    thickness: 0.35,
    emblemType: 'neural-network',
    githubUrl: 'https://github.com/TIFFMUN/AutomateAI',
    liveUrl: 'https://automate-ai-chi.vercel.app',
    stackShelf: 'Stack II • Bay 04'
  },
  {
    id: 'a-new-story',
    title: 'A New Story',
    subtitle: 'Semantic Literary Discovery & Reading Matcher',
    edition: 'First Edition (Vercel)',
    callNumber: 'PN 81 .N49 2025',
    year: '2025',
    category: 'Full-Stack',
    curator: 'Kang Yuchen',
    shortDescription: 'Mood-based literary recommendation platform powered by OpenAI embeddings, Express.js, and Supabase.',
    fullSynopsis: 'A personalized literary discovery platform that matches readers to novels based on dynamic mood vectors and narrative tropes. Built with OpenAI natural-language embeddings, an Express.js API, Supabase PostgreSQL, and an editorial React interface.',
    techStack: ['React', 'Vite', 'Express.js', 'Supabase', 'OpenAI', 'TailwindCSS'],
    metrics: [
      { label: 'Live App', value: 'Vercel' },
      { label: 'Database', value: 'Supabase Postgres' },
      { label: 'Recommendation', value: 'OpenAI Vectors' }
    ],
    keyFeatures: [
      'Interactive narrative matcher mapping reader mood inputs to thematic literary trajectories',
      'Semantic recommendation pipeline powered by OpenAI text embeddings and Supabase PostgreSQL',
      'Live personal bookshelf curation with real-time catalog search and reading list management',
      'Secure session authentication with JWT cookie middleware and a responsive Tailwind UI'
    ],
    coverColor: '#251535',      // Byzantine Midnight Plum Leather
    accentColor: '#d8b4fe',     // Celestial Lavender Gilded Foil
    bindingMaterial: 'Byzantine Plum Archival Buckram',
    foilMaterial: 'Celestial Lavender Gilded Leaf',
    pagesEdgeColor: '#eee4fa',
    ribbonColor: '#6b21a8',     // Imperial Amethyst Silk Ribbon
    glowColor: '#c084fc',       // Starlight Lavender Glow
    thickness: 0.32,            // Sleek literary novel
    emblemType: 'open-book',
    githubUrl: 'https://github.com/luvbingchillin/A-New-Story',
    liveUrl: 'https://a-new-story-frontend.vercel.app/',
    stackShelf: 'Stack III • Bay 07'
  },
  {
    id: 'portfolio-archive',
    title: 'Portfolio Archive',
    subtitle: 'Kinetic 3D Library & Interactive Monograph',
    edition: 'Collector’s Tome',
    callNumber: 'Z 675 .A84 2026',
    year: '2026',
    category: 'Interactive',
    curator: 'Kang Yuchen',
    shortDescription: 'Interactive 3D library carousel built with Three.js, React 19, procedural canvas textures, and spring physics.',
    fullSynopsis: 'An interactive 3D portfolio presenting engineering projects as physical archival tomes. Engineered with Three.js, React 19, and Vite, featuring 100% procedural leather and gold-foil canvas textures, harmonic spring physics, and full-bleed reading monographs.',
    techStack: ['React 19', 'Three.js', 'TypeScript', 'Vite', 'Canvas 2D API'],
    metrics: [
      { label: 'Bundle', value: '< 180kb Gzip' },
      { label: 'Physics', value: '60 FPS Spring' },
      { label: 'Textures', value: '100% Procedural' }
    ],
    keyFeatures: [
      'Interactive 3D book carousel rendered with Three.js WebGL and dynamic directional lighting',
      'Procedural canvas generator creating bespoke embossed leather covers and gold-foil typography',
      'Harmonic spring physics with velocity-based aerodynamic banking and drag-to-rotate inspection',
      'Full-bleed archival monograph reading modal with smooth keyboard traversal and scale convergence'
    ],
    coverColor: '#2b190e',      // Antique Saddle Mahogany Leather
    accentColor: '#f5c563',     // 24K Gold Leaf
    bindingMaterial: 'Antique Saddle Mahogany Leather',
    foilMaterial: 'Pure 24K Auric Leaf',
    pagesEdgeColor: '#edd8b6',
    ribbonColor: '#b45309',     // Rich Amber Silk Ribbon
    glowColor: '#fbbf24',       // Gilded Gold Radiance
    thickness: 0.40,            // Heavier master archival tome
    emblemType: 'athenaeum-portal',
    githubUrl: 'https://github.com/luvbingchillin/Portfolio',
    liveUrl: '#',
    stackShelf: 'Stack V • Vault'
  }
];
