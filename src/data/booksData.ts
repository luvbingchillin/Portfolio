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
    coverColor: '#1a2436',      // Oxford Navy Leather
    accentColor: '#e0b556',     // Gilded Auric Foil
    pagesEdgeColor: '#e8dcba',
    githubUrl: 'https://github.com/luvbingchillin/Code-search',
    liveUrl: '#',
    stackShelf: 'Stack IV • Bay 02'
  },
  {
    id: 'dtu-image-analysis',
    title: 'Biomedical Vision',
    subtitle: 'Morphological Segmentation & Spatial Analysis',
    edition: 'Research Monograph',
    callNumber: 'RC 78.7 .D53 2025',
    year: '2025',
    category: 'Machine Learning',
    curator: 'Kang Yuchen',
    shortDescription: 'Computer vision framework for automated histological cell segmentation and feature extraction.',
    fullSynopsis: 'A clinical-grade automated imaging pipeline engineered for rapid tissue boundary segmentation, cell nuclei counting, and spatial morphology classification using custom U-Net backbones and morphological filtering.',
    techStack: ['Python', 'PyTorch', 'OpenCV', 'Scikit-Image', 'CUDA'],
    metrics: [
      { label: 'Dice Score', value: '0.942' },
      { label: 'Inference', value: '34 FPS' },
      { label: 'Dataset', value: '12k Scans' }
    ],
    keyFeatures: [
      'High-resolution multi-scale feature pyramid network',
      'Automated stain normalization and color deconvolution',
      'Watershed & active contour morphological post-processing',
      'Interactive diagnostic heatmap viewer'
    ],
    coverColor: '#2b1b1b',      // Crimson Wine Leather
    accentColor: '#f2cca0',     // Rose Gold Foil
    pagesEdgeColor: '#edd9c0',
    githubUrl: 'https://github.com/luvbingchillin',
    liveUrl: '#',
    stackShelf: 'Stack VI • Bay 09'
  },
  {
    id: 'computer-graphics',
    title: 'Physical Rendering',
    subtitle: 'Ray Marching, PBR Shaders & Radiance Fields',
    edition: 'Atelier Volume III',
    callNumber: 'T 385 .G72 2025',
    year: '2025',
    category: 'Graphics & 3D',
    curator: 'Kang Yuchen',
    shortDescription: 'Real-time WebGL graphics engine with thin-film optical iridescence and area light soft shadows.',
    fullSynopsis: 'An exploratory graphics laboratory implementing microfacet specular reflection models, screen-space ambient occlusion, volumetric fog, and custom GLSL fragment shaders simulating optical diffraction across anisotropic surfaces.',
    techStack: ['WebGL 2.0', 'Three.js', 'GLSL Shaders', 'Vite', 'TypeScript'],
    metrics: [
      { label: 'Framerate', value: '60 FPS 4K' },
      { label: 'Lights', value: '16 Dynamic' },
      { label: 'Draw Calls', value: 'Optimized 1-pass' }
    ],
    keyFeatures: [
      'Physical microfacet Cook-Torrance BRDF implementation',
      'Real-time procedural normal generation on GPU/CPU',
      'Rectangular studio area light integration with LUT',
      'Spring-dampened camera rig with natural inertia'
    ],
    coverColor: '#122621',      // Emerald Forest Leather
    accentColor: '#e6c86e',     // Imperial Gold Leaf
    pagesEdgeColor: '#eadeb8',
    githubUrl: 'https://github.com/luvbingchillin',
    liveUrl: '#',
    stackShelf: 'Stack II • Bay 01'
  },
  {
    id: 'agentic-workspace',
    title: 'Autonomous Agents',
    subtitle: 'Hierarchical Multi-Agent Orchestration Protocol',
    edition: 'Technical Treatise',
    callNumber: 'Q 335 .O73 2026',
    year: '2026',
    category: 'Systems & Tools',
    curator: 'Kang Yuchen',
    shortDescription: 'Event-driven multi-agent coordination protocol featuring tool streaming and context isolation.',
    fullSynopsis: 'A resilient agentic workflow manager enabling autonomous software engineers to plan, execute code edits, run sandboxed tests, and coordinate across distributed micro-tasks with deterministic state machines and reactive rollback.',
    techStack: ['Node.js', 'TypeScript', 'WebSockets', 'SQLite', 'Docker'],
    metrics: [
      { label: 'Task Success', value: '96.8%' },
      { label: 'Event Latency', value: '4ms' },
      { label: 'Concurrency', value: '64 Agents' }
    ],
    keyFeatures: [
      'Transactional file modification pipeline with rollbacks',
      'Subagent hierarchical delegation with isolated memory',
      'MCP (Model Context Protocol) tool provider architecture',
      'Interactive terminal replay & inspection dashboard'
    ],
    coverColor: '#281a33',      // Byzantine Imperial Plum
    accentColor: '#d6aef8',     // Silver Lilac Foil
    pagesEdgeColor: '#ecdcf5',
    githubUrl: 'https://github.com/luvbingchillin',
    liveUrl: '#',
    stackShelf: 'Stack V • Bay 04'
  },
  {
    id: 'athenaeum-portfolio',
    title: 'Athenaeum Archive',
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
    coverColor: '#2a1a10',      // Antique Saddle Mahogany
    accentColor: '#f3c769',     // 24k Gold Foil Leaf
    pagesEdgeColor: '#edd8b6',
    githubUrl: 'https://github.com/luvbingchillin/Portfolio',
    liveUrl: '#',
    stackShelf: 'Stack I • Vault'
  }
];
