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
    shortDescription: 'High-throughput code repository search combining AST parsing with vector embeddings.',
    fullSynopsis: 'An intelligent semantic codebase retrieval system designed to locate functions, types, and logic flows across multi-gigabyte polyglot repositories. Implements fast inverted indexing alongside dense neural embeddings for natural language code queries.',
    techStack: ['TypeScript', 'Rust', 'Tree-Sitter', 'Vector Search', 'React'],
    metrics: [
      { label: 'Latency', value: '< 18ms' },
      { label: 'Index Capacity', value: '500k+ LoC' },
      { label: 'Accuracy', value: '99.4%' }
    ],
    keyFeatures: [
      'AST-aware syntax chunking preserving lexical scope',
      'Hybrid semantic vector search + BM25 keyword ranking',
      'Real-time indexing watcher with zero-downtime updates',
      'Interactive syntax visualizer with cross-reference graph'
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
    shortDescription: 'Real-time MTG booster collation and draft simulator powered by a high-concurrency Go backend.',
    fullSynopsis: 'A high-throughput card drafting and booster pack collation simulator engineered with Go 1.22 and MongoDB. Accurately models authentic physical print-sheet collation algorithms, rarities, and foil sheet weighting, while serving synchronous drafting lobbies with sub-millisecond pack generation and Python gRPC analytics.',
    techStack: ['Go', 'MongoDB', 'React 18', 'TypeScript', 'Docker', 'Python', 'gRPC'],
    metrics: [
      { label: 'Pack Latency', value: '< 2ms' },
      { label: 'Collation Engine', value: 'Go 1.22 Mux' },
      { label: 'Architecture', value: 'Clean 3-Tier' }
    ],
    keyFeatures: [
      'Deterministic MTG booster collation reproducing authentic physical print runs',
      'Clean three-tier layered architecture in Go with context-aware data access',
      'Real-time drafting lobby synchronization with in-memory RWMutex state management',
      'Integrated Scryfall card database ingestion pipeline and analytics service'
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
    shortDescription: 'AI-powered enterprise platform streamlining onboarding, skills growth, and performance management.',
    fullSynopsis: 'An intelligent enterprise talent platform engineered for the SAP x NTU Hackathon. Automates new employee onboarding journeys, provides AI-driven performance review synthesis and managerial feedback drafts, and maps skills gap assessments to tailored career pathways using FastAPI, LangChain, and OpenAI.',
    techStack: ['React 18', 'FastAPI', 'Python', 'LangChain', 'OpenAI', 'PostgreSQL', 'Docker'],
    metrics: [
      { label: 'Competition', value: 'SAP x NTU' },
      { label: 'AI Workflows', value: '4 Core Modules' },
      { label: 'Deployment', value: 'Vercel + Cloud' }
    ],
    keyFeatures: [
      'AI-guided interactive onboarding workflows with checklist and HR automation',
      'Managerial performance feedback synthesis and constructive review draft generator',
      'Personalized skills gap analysis paired with AI curriculum recommendations',
      'Career Oracle path predictor mapping employee growth to internal opportunities'
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
    shortDescription: 'AI-assisted literary matching engine helping readers discover next reads based on taste and mood.',
    fullSynopsis: 'A modern book curation and recommendation platform pairing readers with literary works tailored to dynamic mood vectors and narrative tropes. Integrates OpenAI natural language embeddings with a Supabase PostgreSQL backend and Express API, complete with interactive shelf management and user testimonial archives.',
    techStack: ['React', 'Vite', 'Express.js', 'Supabase', 'OpenAI', 'TailwindCSS'],
    metrics: [
      { label: 'Live App', value: 'Vercel' },
      { label: 'Database', value: 'Supabase Postgres' },
      { label: 'Recommendation', value: 'OpenAI Vectors' }
    ],
    keyFeatures: [
      'Interactive Matcher engine mapping reader moods to thematic narrative trajectories',
      'Live book search and personal bookshelf management with real-time UI refresh',
      'JWT-secured session handling and Supabase authentication with cookie middleware',
      'Responsive editorial reading interface styled with Tailwind and Framer Motion'
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
    shortDescription: 'The current portfolio experience: 3D interactive book carousel with PBR leather, gold foil & spring physics.',
    fullSynopsis: 'Engineered with custom procedural canvas textures, physical book lathe & box geometries, and harmonic spring damping. Replaces conventional portfolio web grids with an authentic tactile archive reminiscent of historic European libraries.',
    techStack: ['React 19', 'Three.js', 'TypeScript', 'Vite', 'Canvas 2D API'],
    metrics: [
      { label: 'Bundle', value: '< 180kb Gzip' },
      { label: 'Physics', value: '60 FPS Spring' },
      { label: 'Textures', value: '100% Procedural' }
    ],
    keyFeatures: [
      'Procedural embossed leather & gilded typography generation',
      'Double-sided book flip mechanics with openable reading spread',
      'Dynamic key & rim lighting with cursor parallax tracking',
      'Harmonic spring physics with velocity banking and flow lean'
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
