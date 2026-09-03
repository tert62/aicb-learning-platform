// AICB — AI in Coding & Business | VinUniversity 2026
// Curriculum data: Phase 1 (Common) + Track 2 (AI Infra) + Track 3 (Advanced Agent)

const CURRICULUM = {
  phase1: {
    id: 'phase1',
    title: 'Phase 1 — Nền Tảng AI',
    subtitle: 'Day 1–14 · Học chung toàn khóa',
    icon: '🚀',
    color: '#6c63ff',
    gradient: 'linear-gradient(135deg, #6c63ff, #a855f7)',
    days: [
      {
        id: 'day1', day: 1,
        title: 'AI & LLM Foundation',
        subtitle: 'Nền tảng — Hiểu LLM từ gốc rễ',
        instructor: 'Huỳnh Thành Trung',
        file: '../Slide/Day1.pdf',
        fileType: 'pdf',
        topics: ['LLM', 'Foundation Models', 'Transformer', 'AI Basics'],
        color: '#6c63ff',
        description: 'Giới thiệu tổng quan về AI và Large Language Models, cơ chế hoạt động của Transformer, các mô hình nền tảng hiện đại.'
      },
      {
        id: 'day2', day: 2,
        title: 'Xác Định Bài Toán Kinh Doanh Cho AI',
        subtitle: 'Chọn đúng bài toán, đúng mức tự động hóa',
        instructor: 'Nguyễn Tiến Đồng',
        file: '../Slide/Day2.pdf',
        fileType: 'pdf',
        topics: ['Business Problem', 'AI Strategy', 'Automation Level', 'ROI'],
        color: '#7c3aed',
        description: 'Cách xác định và phân tích bài toán kinh doanh phù hợp với AI, đánh giá mức độ tự động hóa và gate kỹ thuật.'
      },
      {
        id: 'day3', day: 3,
        title: 'Từ Chatbot Đến Agentic Agent',
        subtitle: 'Design Pattern ReAct — Think → Act → Observe',
        instructor: 'AICB Faculty',
        file: '../Slide/Day3.pdf',
        fileType: 'pdf',
        topics: ['Agent', 'ReAct Pattern', 'Agentic AI', 'Tool Use'],
        color: '#8b5cf6',
        description: 'Hiểu sự khác biệt giữa chatbot đơn giản và Agentic AI, implement pattern ReAct, thiết kế agent có khả năng tự suy luận.'
      },
      {
        id: 'day4', day: 4,
        title: 'Prompt Engineering & Tool Calling',
        subtitle: 'Làm sao nói để AI hiểu đúng ý?',
        instructor: 'AICB Faculty',
        file: '../Slide/Day4.pdf',
        fileType: 'pdf',
        topics: ['Prompt Engineering', 'Tool Calling', 'Few-shot', 'Chain-of-Thought'],
        color: '#6d28d9',
        description: 'Kỹ thuật viết prompt hiệu quả, function calling, few-shot learning và chain-of-thought prompting.'
      },
      {
        id: 'day5', day: 5,
        title: 'Thiết Kế Sản Phẩm AI Cho Sự Không Chắc Chắn',
        subtitle: 'Từ khả năng của model đến trải nghiệm đáng tin cậy',
        instructor: 'Mai Anh Nguyen Blue',
        file: '../Slide/Day6.pdf',
        fileType: 'pdf',
        topics: ['Product Design', 'AI UX', 'Reliability', 'Uncertainty'],
        color: '#5b21b6',
        description: 'Nguyên tắc thiết kế sản phẩm AI khi model không hoàn hảo, xây dựng trải nghiệm đáng tin cậy cho người dùng.'
      },
      {
        id: 'day7', day: 7,
        title: 'Data Foundations',
        subtitle: 'Embedding & Vector Store — Nền tảng dữ liệu cho AI',
        instructor: 'Trần Minh Tú (M.Sc)',
        file: '../Slide/Day7.pdf',
        fileType: 'pdf',
        topics: ['Embeddings', 'Vector Database', 'Similarity Search', 'FAISS'],
        color: '#4c1d95',
        description: 'Vector embeddings, cơ sở dữ liệu vector, similarity search và ứng dụng trong các hệ thống AI hiện đại.'
      },
      {
        id: 'day8', day: 8,
        title: 'RAG Pipeline',
        subtitle: 'Retrieval-Augmented Generation — Truy Xuất & Sinh Câu Trả Lời',
        instructor: 'AICB Faculty',
        file: '../Slide/Day8.pdf',
        fileType: 'pdf',
        topics: ['RAG', 'Retrieval', 'Generation', 'Chunking', 'Reranking'],
        color: '#2563eb',
        description: 'Xây dựng pipeline RAG hoàn chỉnh từ ingestion, chunking, embedding đến retrieval và generation.'
      },
      {
        id: 'day9', day: 9,
        title: 'Multi-Agent & Kết Nối Hệ Thống',
        subtitle: 'MCP, A2A & LangGraph — Orchestration nâng cao',
        instructor: 'AICB Faculty',
        file: '../Slide/Day9.pdf',
        fileType: 'pdf',
        topics: ['Multi-Agent', 'MCP', 'A2A', 'LangGraph', 'Orchestration'],
        color: '#1d4ed8',
        description: 'Thiết kế hệ thống multi-agent, giao tiếp giữa các agent qua MCP/A2A, orchestration với LangGraph.'
      },
      {
        id: 'day10', day: 10,
        title: 'Data Pipeline & Data Observability',
        subtitle: 'Đường ống dữ liệu đáng tin cậy cho AI',
        instructor: 'Trần Quang Thiện (TrustedAI)',
        file: '../Slide/Day10.pdf',
        fileType: 'pdf',
        topics: ['Data Pipeline', 'Observability', 'Data Quality', 'ETL'],
        color: '#0369a1',
        description: 'Xây dựng và vận hành data pipeline cho AI, monitoring chất lượng dữ liệu, observability trong production.'
      },
      {
        id: 'day11', day: 11,
        title: 'Guardrails & AI Safety',
        subtitle: 'Agent mạnh rồi — nhưng ai kiểm soát nó?',
        instructor: 'Đội ngũ Giảng viên AICB',
        file: '../Slide/Day11.pdf',
        fileType: 'pdf',
        topics: ['AI Safety', 'Guardrails', 'Alignment', 'Red Teaming', 'Content Moderation'],
        color: '#dc2626',
        description: 'Các kỹ thuật guardrails để kiểm soát AI, alignment, phòng chống misuse và xây dựng AI có trách nhiệm.'
      },
      {
        id: 'day12', day: 12,
        title: 'Deployment — Đưa Agent Lên Cloud',
        subtitle: 'Từ localhost đến production URL',
        instructor: 'AICB Faculty',
        file: '../Slide/Day12.pdf',
        fileType: 'pdf',
        topics: ['Cloud Deployment', 'Docker', 'FastAPI', 'CI/CD', 'Production'],
        color: '#ea580c',
        description: 'Deploy AI agent lên cloud (GCP/AWS), containerization với Docker, CI/CD pipeline, best practices production.'
      },
      {
        id: 'day13', day: 13,
        title: 'Monitoring, Logging & Observability',
        subtitle: 'Biết agent đang chạy thế nào trước khi user phàn nàn',
        instructor: 'AICB Faculty',
        file: '../Slide/Day13.pdf',
        fileType: 'pdf',
        topics: ['Monitoring', 'Logging', 'Observability', 'Tracing', 'Alerting'],
        color: '#d97706',
        description: 'Hệ thống monitoring cho AI agents, structured logging, distributed tracing, alerting và incident response.'
      },
      {
        id: 'day14', day: 14,
        title: 'AI Evaluation & Benchmarking',
        subtitle: 'Đo lường chất lượng AI một cách khoa học',
        instructor: 'AICB Faculty',
        file: '../Slide/Day14.pdf',
        fileType: 'pdf',
        topics: ['Evaluation', 'Benchmarking', 'Metrics', 'RAGAS', 'LLM-as-Judge'],
        color: '#16a34a',
        description: 'Framework đánh giá AI systems, các metrics quan trọng, RAGAS cho RAG, LLM-as-Judge và human evaluation.'
      }
    ]
  },

  track2: {
    id: 'track2',
    title: 'Track 2 — AI Infrastructure',
    subtitle: 'Day 16–19 · Hạ tầng & Data Engineering cho AI',
    icon: '⚙️',
    color: '#00d4ff',
    gradient: 'linear-gradient(135deg, #00d4ff, #0891b2)',
    days: [
      {
        id: 't2day16', day: 16,
        title: 'Cloud Infrastructure for AI',
        subtitle: 'Nền tảng đám mây — từ VM đến Kubernetes',
        instructor: 'AICB Faculty',
        file: '../Track2/Day 16_ Track 2_ Cloud infrastructure for AI.pptx',
        fileType: 'pptx',
        topics: ['Cloud', 'GCP', 'AWS', 'Kubernetes', 'Infrastructure as Code'],
        color: '#00d4ff',
        description: 'Thiết kế và triển khai hạ tầng đám mây cho AI workloads, container orchestration với Kubernetes, IaC.'
      },
      {
        id: 't2day17', day: 17,
        title: 'Data Pipeline Engineering',
        subtitle: 'Xây đường ống dữ liệu nuôi AI',
        instructor: 'AICB Faculty',
        file: '../Track2/Day17-Track2.pdf',
        fileType: 'pdf',
        topics: ['Data Pipeline', 'Apache Kafka', 'Airflow', 'Spark', 'Batch & Streaming'],
        color: '#06b6d4',
        description: 'Thiết kế data pipeline batch và streaming, orchestration với Airflow, xử lý dữ liệu quy mô lớn với Spark.'
      },
      {
        id: 't2day18', day: 18,
        title: 'Data Lakehouse Architecture',
        subtitle: 'Kết hợp Data Lake + Data Warehouse hiện đại',
        instructor: 'AICB Faculty',
        file: '../Track2/Day18-Track2.pdf',
        fileType: 'pdf',
        topics: ['Lakehouse', 'Delta Lake', 'Iceberg', 'Data Warehouse', 'Medallion'],
        color: '#0e7490',
        description: 'Kiến trúc Lakehouse hiện đại, Delta Lake/Apache Iceberg, Medallion architecture (Bronze/Silver/Gold).'
      },
      {
        id: 't2day19', day: 19,
        title: 'Vector Store & Feature Store',
        subtitle: 'Lưu trữ và quản lý đặc trưng cho ML',
        instructor: 'Phạm Mạnh',
        file: '../Track2/Day19-Track2.pdf',
        fileType: 'pdf',
        topics: ['Vector Store', 'Feature Store', 'Pinecone', 'Feast', 'MLOps'],
        color: '#155e75',
        description: 'Vector databases (Pinecone, Weaviate, Qdrant), Feature Store với Feast, quản lý features trong ML lifecycle.'
      },
      {
        id: 't2day20', day: 20,
        title: 'Day 20',
        subtitle: 'Track 2 - Day 20',
        instructor: 'AICB Faculty',
        file: '../Track2/Day20-Track2.pdf',
        fileType: 'pdf',
        topics: ['AI Infrastructure'],
        color: '#0891b2',
        description: 'Nội dung đang được cập nhật.'
      },
      {
        id: 't2day21', day: 21,
        title: 'Day 21',
        subtitle: 'Track 2 - Day 21',
        instructor: 'AICB Faculty',
        file: '../Track2/Day 21-Track2.pptx',
        fileType: 'pptx',
        topics: ['AI Infrastructure'],
        color: '#0891b2',
        description: 'Nội dung đang được cập nhật.'
      },
      {
        id: 't2day22', day: 22,
        title: 'Day 22',
        subtitle: 'Track 2 - Day 22',
        instructor: 'AICB Faculty',
        file: '../Track2/Day 22-Track2.pptx',
        fileType: 'pptx',
        topics: ['AI Infrastructure'],
        color: '#0891b2',
        description: 'Nội dung đang được cập nhật.'
      }
    ]
  },

  track3: {
    id: 'track3',
    title: 'Track 3 — Advanced AI Agent',
    subtitle: 'Day 16–19 · Agent nâng cao & Production RAG',
    icon: '🤖',
    color: '#ff6b9d',
    gradient: 'linear-gradient(135deg, #ff6b9d, #ec4899)',
    days: [
      {
        id: 't3day16', day: 16,
        title: 'Advanced Agent Architectures',
        subtitle: 'Kiến trúc Agent phức tạp & Enterprise-grade',
        instructor: 'AICB Faculty',
        file: '../Track3/Day16-Track3.pdf',
        fileType: 'pdf',
        topics: ['Agent Architecture', 'Multi-Agent Systems', 'Planner-Executor', 'Hierarchical Agent'],
        color: '#ff6b9d',
        description: 'Các pattern kiến trúc Agent nâng cao: Planner-Executor, Hierarchical, Debate, Critic-Actor cho enterprise.'
      },
      {
        id: 't3day17', day: 17,
        title: 'Memory Systems for Agents',
        subtitle: 'Bộ nhớ ngắn hạn, dài hạn và episodic',
        instructor: 'AICB Faculty',
        file: '../Track3/Day17-Track3.pdf',
        fileType: 'pdf',
        topics: ['Memory', 'Short-term', 'Long-term', 'Episodic Memory', 'Semantic Memory'],
        color: '#ec4899',
        description: 'Thiết kế hệ thống bộ nhớ cho AI agents: working memory, episodic, semantic và procedural memory.'
      },
      {
        id: 't3day18', day: 18,
        title: 'Production RAG',
        subtitle: 'Từ Demo 60% Đến Production 85%+',
        instructor: 'Trần Quang Thiện',
        file: '../Track3/Day18-Track3.pdf',
        fileType: 'pdf',
        topics: ['Advanced RAG', 'Reranking', 'Hybrid Search', 'Query Expansion', 'Evaluation'],
        color: '#db2777',
        description: 'Nâng RAG từ prototype lên production: advanced chunking, hybrid search, reranking, query transformation và evaluation.'
      },
      {
        id: 't3day19', day: 19,
        title: 'GraphRAG & Knowledge Graphs',
        subtitle: 'Đồ thị tri thức cho AI thế hệ mới',
        instructor: 'Ngô Thanh Tùng',
        file: '../Track3/Day19-Track3.pdf',
        fileType: 'pdf',
        topics: ['GraphRAG', 'Knowledge Graph', 'Neo4j', 'Entity Extraction', 'Graph Traversal'],
        color: '#be185d',
        description: 'Microsoft GraphRAG, xây dựng Knowledge Graph với Neo4j, entity/relation extraction, graph-based retrieval.'
      },
      {
        id: 't3day20', day: 20,
        title: 'Day 20',
        subtitle: 'Track 3 - Day 20',
        instructor: 'AICB Faculty',
        file: '../Track3/Day20-Track3.pdf',
        fileType: 'pdf',
        topics: ['Advanced AI Agent'],
        color: '#be185d',
        description: 'Nội dung đang được cập nhật.'
      },
      {
        id: 't3day21', day: 21,
        title: 'Day 21',
        subtitle: 'Track 3 - Day 21',
        instructor: 'AICB Faculty',
        file: '../Track3/Day21-Track3.pdf',
        fileType: 'pdf',
        topics: ['Advanced AI Agent'],
        color: '#be185d',
        description: 'Nội dung đang được cập nhật.'
      },
      {
        id: 't3day22', day: 22,
        title: 'Day 22',
        subtitle: 'Track 3 - Day 22',
        instructor: 'AICB Faculty',
        file: '../Track3/Day22-Track3.pdf',
        fileType: 'pdf',
        topics: ['Advanced AI Agent'],
        color: '#be185d',
        description: 'Nội dung đang được cập nhật.'
      },
      {
        id: 't3day23', day: 23,
        title: 'Day 23',
        subtitle: 'Track 3 - Day 23',
        instructor: 'AICB Faculty',
        file: '../Track3/Day23-Track3.pdf',
        fileType: 'pdf',
        topics: ['Advanced AI Agent'],
        color: '#be185d',
        description: 'Nội dung đang được cập nhật.'
      },
      {
        id: 't3day24', day: 24,
        title: 'Day 24',
        subtitle: 'Track 3 - Day 24',
        instructor: 'AICB Faculty',
        file: '../Track3/Day24-Track3.pdf',
        fileType: 'pdf',
        topics: ['Advanced AI Agent'],
        color: '#be185d',
        description: 'Nội dung đang được cập nhật.'
      },
      {
        id: 't3day27', day: 27,
        title: 'Day 27',
        subtitle: 'Track 3 - Day 27',
        instructor: 'AICB Faculty',
        file: '../Track3/Day27-Track3.pdf',
        fileType: 'pdf',
        topics: ['Advanced AI Agent'],
        color: '#be185d',
        description: 'Nội dung đang được cập nhật.'
      }
    ]
  }
};

// Helper: get all days flat
function getAllDays() {
  return [
    ...CURRICULUM.phase1.days.map(d => ({ ...d, track: 'phase1' })),
    ...CURRICULUM.track2.days.map(d => ({ ...d, track: 'track2' })),
    ...CURRICULUM.track3.days.map(d => ({ ...d, track: 'track3' }))
  ];
}

// Helper: get day by id
function getDayById(id) {
  return getAllDays().find(d => d.id === id);
}

// Helper: get track info
function getTrackInfo(trackId) {
  return CURRICULUM[trackId];
}

// Available globally as window.CURRICULUM etc.
window.CURRICULUM = CURRICULUM;
window.getAllDays = getAllDays;
window.getDayById = getDayById;
