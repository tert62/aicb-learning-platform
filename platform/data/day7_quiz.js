window.DAY7_QUIZ = {
  "questions": [
    {
      "type": "concept",
      "difficulty": "basic",
      "question": "Mục đích chính của Vector Embedding trong xử lý ngôn ngữ tự nhiên (NLP) là gì?",
      "code": "",
      "language": "python",
      "options": [
        "Biểu diễn từ vựng dưới dạng ma trận thưa (sparse matrix) để tối ưu lưu trữ.",
        "Mã hóa ý nghĩa ngữ nghĩa (semantic meaning) của văn bản thành các vector số học trong không gian nhiều chiều.",
        "Nén văn bản thành kích thước nhỏ nhất để tăng tốc độ truyền tải qua mạng.",
        "Dịch thuật văn bản từ ngôn ngữ này sang ngôn ngữ khác trực tiếp bằng cách ánh xạ các điểm tọa độ."
      ],
      "answer": 1,
      "explanation": "Vector embedding chuyển đổi các khái niệm (từ, câu, tài liệu) thành vector trong không gian n chiều, trong đó khoảng cách giữa các vector thể hiện mức độ tương đồng về mặt ngữ nghĩa."
    },
    {
      "type": "code_output",
      "difficulty": "applied",
      "question": "Đoạn code sau tính khoảng cách nào giữa hai vector `u` và `v`?",
      "code": "import numpy as np\nu = np.array([1, 0, 1])\nv = np.array([0, 1, 1])\n\ndistance = np.sum(np.abs(u - v))\nprint(distance)",
      "language": "python",
      "options": [
        "Euclidean Distance (L2 norm)",
        "Manhattan Distance (L1 norm)",
        "Cosine Distance",
        "Minkowski Distance (p=3)"
      ],
      "answer": 1,
      "explanation": "Đoạn code tính tổng giá trị tuyệt đối của sự khác biệt giữa các phần tử của hai vector, đây là công thức tính khoảng cách Manhattan (L1 norm)."
    },
    {
      "type": "concept",
      "difficulty": "basic",
      "question": "Tính chất nào sau đây là ưu điểm lớn nhất của Cosine Similarity so với Euclidean Distance khi so sánh hai đoạn văn bản?",
      "code": "",
      "language": "python",
      "options": [
        "Cosine Similarity không bị ảnh hưởng bởi độ dài của văn bản (độ lớn của vector).",
        "Cosine Similarity có thể tính toán nhanh hơn nhờ dùng phép toán cộng thay vì nhân.",
        "Cosine Similarity hoạt động tốt trên ma trận thưa mà không cần chuẩn hóa (normalization).",
        "Cosine Similarity luôn trả về giá trị dương, giúp dễ dàng tích hợp vào mạng nơ-ron."
      ],
      "answer": 0,
      "explanation": "Cosine Similarity chỉ quan tâm đến góc giữa hai vector (hướng) chứ không quan tâm đến độ lớn của chúng. Vì vậy, nó rất hiệu quả khi so sánh hai đoạn văn bản khác nhau về độ dài (ví dụ: một câu vs một đoạn văn) nhưng chung một chủ đề."
    },
    {
      "type": "scenario",
      "difficulty": "applied",
      "question": "Bạn đang xây dựng một hệ thống tìm kiếm hình ảnh tương tự. Bộ dữ liệu của bạn có khoảng 1 tỷ hình ảnh. Bạn nên chọn công nghệ/cấu trúc dữ liệu nào để có tốc độ truy vấn nhanh nhất?",
      "code": "",
      "language": "python",
      "options": [
        "Lưu trữ vector trong PostgreSQL và dùng hàm tính khoảng cách tuần tự (Exact Search).",
        "Sử dụng HNSW (Hierarchical Navigable Small World) index trên một Vector Database.",
        "Dùng cây nhị phân tìm kiếm (BST) để tìm các giá trị pixel gần nhất.",
        "Lưu tất cả vector trên RAM và dùng thư viện numpy để tính khoảng cách Cosine với toàn bộ dữ liệu."
      ],
      "answer": 1,
      "explanation": "Với lượng dữ liệu khổng lồ (1 tỷ items), thuật toán Exact Search (như KNN tuần tự) sẽ quá chậm. HNSW là một thuật toán Approximate Nearest Neighbor (ANN) phổ biến và rất hiệu quả, được hỗ trợ bởi các Vector Database, giúp truy vấn cực kỳ nhanh."
    },
    {
      "type": "code_debug",
      "difficulty": "applied",
      "question": "Khi sử dụng FAISS, bạn muốn tạo một index tìm kiếm chính xác (exact search) sử dụng khoảng cách L2. Bạn viết đoạn code sau nhưng kết quả trả về không như mong muốn. Lỗi ở đâu?",
      "code": "import faiss\nd = 128  # dimension\nindex = faiss.IndexFlatIP(d)\nindex.add(vectors)\nD, I = index.search(query_vector, k=5)",
      "language": "python",
      "options": [
        "Biến `vectors` phải được chuẩn hóa về độ dài 1 trước khi add vào `IndexFlatIP`.",
        "Cần gọi `index.train(vectors)` trước khi gọi `index.add(vectors)` với IndexFlat.",
        "Nên sử dụng `faiss.IndexFlatL2` thay vì `IndexFlatIP` nếu muốn dùng khoảng cách L2.",
        "Không thể dùng Flat Index cho exact search, phải dùng IVFFlat."
      ],
      "answer": 2,
      "explanation": "Lỗi nằm ở việc chọn sai loại index. `IndexFlatIP` là Inner Product (sử dụng cho Cosine Similarity nếu vector đã chuẩn hóa), trong khi câu hỏi yêu cầu sử dụng khoảng cách L2 (Euclidean distance). Do đó, phải sử dụng `IndexFlatL2`."
    },
    {
      "type": "config",
      "difficulty": "advanced",
      "question": "Trong FAISS, khi sử dụng index `IVFFlat` (Inverted File), tham số `nlist` và `nprobe` có ý nghĩa gì?",
      "code": "",
      "language": "python",
      "options": [
        "`nlist` là số lượng centroids (cụm) phân chia dữ liệu, `nprobe` là số lượng cụm sẽ được duyệt khi tìm kiếm.",
        "`nlist` là số lượng kết quả trả về (k), `nprobe` là số lần lặp trong thuật toán K-Means.",
        "`nlist` là giới hạn RAM (tính bằng MB), `nprobe` là số lượng luồng (threads) CPU dùng để tìm kiếm.",
        "`nlist` là chiều của vector, `nprobe` là số lượng vector query mỗi batch."
      ],
      "answer": 0,
      "explanation": "Trong IVFFlat, dữ liệu được gom cụm bằng K-Means. `nlist` là số cụm dữ liệu ban đầu được tạo ra. `nprobe` là số cụm gần với câu truy vấn nhất mà FAISS sẽ xem xét khi search. `nprobe` càng cao thì độ chính xác càng cao nhưng tìm kiếm càng chậm."
    },
    {
      "type": "compare",
      "difficulty": "advanced",
      "question": "Sự khác biệt chính giữa Keyword Search (TF-IDF/BM25) và Vector Semantic Search là gì?",
      "code": "",
      "language": "python",
      "options": [
        "Keyword Search trả về kết quả nhanh hơn và luôn chính xác hơn Vector Search trong mọi trường hợp.",
        "Keyword Search chỉ bắt được sự trùng khớp từ vựng chính xác, trong khi Vector Search có thể tìm được các từ đồng nghĩa hoặc có liên quan ngữ nghĩa.",
        "Keyword Search yêu cầu dùng GPU để tính toán, trong khi Vector Search chỉ cần CPU.",
        "Keyword Search phải tạo index trước khi thêm dữ liệu, còn Vector Search thì không cần index."
      ],
      "answer": 1,
      "explanation": "Các phương pháp như TF-IDF/BM25 hoạt động dựa trên sự trùng khớp chính xác của các từ khóa. Vector Semantic Search nhúng văn bản thành vector, do đó có thể hiểu được ý nghĩa (ngữ nghĩa) và tìm được các từ đồng nghĩa, dù không trùng lặp từ vựng."
    },
    {
      "type": "concept",
      "difficulty": "applied",
      "question": "Khi nào thì việc sử dụng Hybrid Search (kết hợp Keyword Search và Vector Search) mang lại kết quả tốt nhất?",
      "code": "",
      "language": "python",
      "options": [
        "Khi người dùng luôn tìm kiếm bằng ngôn ngữ tự nhiên dài như một đoạn văn.",
        "Khi bạn chỉ quan tâm đến các từ đồng nghĩa và không cần bắt buộc phải chứa một từ cụ thể nào.",
        "Khi bạn cần cả khả năng bắt từ khóa chính xác (như mã sản phẩm, tên riêng) và sự linh hoạt trong ngữ nghĩa (tìm ý tương tự).",
        "Khi dữ liệu của bạn toàn là hình ảnh hoặc âm thanh."
      ],
      "answer": 2,
      "explanation": "Hybrid search tận dụng thế mạnh của cả hai. Keyword search rất tốt cho việc tìm chính xác tên riêng, số sê-ri, trong khi Vector search tốt cho việc hiểu ý định và ngữ nghĩa khái quát."
    },
    {
      "type": "code_output",
      "difficulty": "basic",
      "question": "Kết quả in ra của đoạn code sau là gì (giả sử vector đã chuẩn hóa độ dài về 1)?",
      "code": "import numpy as np\nu = np.array([1, 0])\nv = np.array([0, 1])\n\ncosine_sim = np.dot(u, v)\nprint(cosine_sim)",
      "language": "python",
      "options": [
        "1",
        "-1",
        "0",
        "2"
      ],
      "answer": 2,
      "explanation": "Hai vector [1, 0] và [0, 1] là hai vector trực giao (vuông góc với nhau). Tích vô hướng (dot product) của chúng bằng 0. Do đã chuẩn hóa, độ tương đồng cosine cũng chính là tích vô hướng, tức là 0."
    },
    {
      "type": "concept",
      "difficulty": "applied",
      "question": "Pinecone, Weaviate, và Milvus là ví dụ về công nghệ gì?",
      "code": "",
      "language": "python",
      "options": [
        "Các framework huấn luyện mô hình Large Language Model (LLM).",
        "Các công cụ quản lý thư viện Python thay thế cho pip.",
        "Các hệ quản trị cơ sở dữ liệu đồ thị (Graph Database).",
        "Các cơ sở dữ liệu Vector (Vector Database) chuyên dụng."
      ],
      "answer": 3,
      "explanation": "Pinecone, Weaviate và Milvus là các Vector Database chuyên dụng, được thiết kế tối ưu cho việc lưu trữ, lập chỉ mục và tìm kiếm vector (như embedding từ AI models) ở quy mô lớn."
    },
    {
      "type": "scenario",
      "difficulty": "applied",
      "question": "Bạn có 100,000 document. Việc chạy mô hình LLM (như OpenAI text-embedding-ada-002) để embed 1 document mất 0.1 giây. Nếu bạn dùng một API duy nhất (không chạy đa luồng), quá trình tạo embedding cho toàn bộ dữ liệu sẽ mất khoảng bao lâu?",
      "code": "",
      "language": "python",
      "options": [
        "Khoảng 3 tiếng",
        "Khoảng 10 tiếng",
        "Khoảng 2.7 tiếng",
        "Khoảng 27 tiếng"
      ],
      "answer": 2,
      "explanation": "100,000 documents * 0.1s = 10,000 giây. 10,000 / 3600 giây/tiếng = 2.77 tiếng. Phương án gần đúng nhất là 2.7 tiếng (hoặc ~2.8 tiếng)."
    },
    {
      "type": "code_debug",
      "difficulty": "advanced",
      "question": "Khi tìm kiếm trên một Vector Database, bạn nhận được cảnh báo 'Out of Memory' (OOM) sau khi add 50 triệu vector chiều cao. Phương pháp nào hiệu quả nhất để giải quyết mà vẫn giữ nguyên số lượng dữ liệu?",
      "code": "",
      "language": "python",
      "options": [
        "Chuyển từ thuật toán HNSW sang Exact KNN (Flat Index).",
        "Áp dụng lượng tử hóa (Quantization) như Product Quantization (PQ) hoặc Scalar Quantization (SQ).",
        "Tăng kích thước batch size khi query.",
        "Dùng hàm tính khoảng cách Manhattan thay vì Cosine."
      ],
      "answer": 1,
      "explanation": "Quantization (như PQ) giúp nén vector (ví dụ từ float32 xuống uint8 hoặc biểu diễn nhỏ hơn), làm giảm đáng kể không gian RAM cần thiết để lưu trữ index trong bộ nhớ với sự hi sinh một chút độ chính xác."
    },
    {
      "type": "concept",
      "difficulty": "basic",
      "question": "Khoảng cách Euclidean (L2) khác gì với Cosine Similarity?",
      "code": "",
      "language": "python",
      "options": [
        "Euclidean đo khoảng cách đường thẳng giữa 2 điểm, Cosine đo góc giữa 2 vector từ gốc tọa độ.",
        "Euclidean luôn ra kết quả âm, Cosine luôn ra kết quả dương.",
        "Euclidean chỉ áp dụng cho vector 2 chiều, Cosine dùng cho không gian n chiều.",
        "Không có sự khác biệt, hai khái niệm này luôn cho thứ hạng kết quả giống hệt nhau."
      ],
      "answer": 0,
      "explanation": "Euclidean (L2 distance) tính khoảng cách hình học giữa hai điểm trong không gian, còn Cosine Similarity đo góc giữa hai vector hướng từ gốc (origin). Nếu các vector được chuẩn hóa (độ dài = 1), thứ hạng (ranking) tìm kiếm của hai phương pháp này sẽ giống nhau."
    },
    {
      "type": "code_output",
      "difficulty": "applied",
      "question": "Đoạn code sau của FAISS làm gì?",
      "code": "quantizer = faiss.IndexFlatL2(d)\nindex = faiss.IndexIVFFlat(quantizer, d, nlist, faiss.METRIC_L2)\nindex.train(xb)\nindex.add(xb)",
      "language": "python",
      "options": [
        "Tạo một index dựa trên HNSW và không yêu cầu huấn luyện (train).",
        "Tạo một index Inverted File, huấn luyện bằng k-means trên dữ liệu `xb`, sau đó thêm dữ liệu `xb` vào index.",
        "Chuyển đổi dữ liệu `xb` sang định dạng nhị phân để giảm dung lượng.",
        "Tính toán khoảng cách Cosine giữa mọi cặp vector trong `xb`."
      ],
      "answer": 1,
      "explanation": "`IndexIVFFlat` là Inverted File Index. Nó cần một quantizer (ở đây là `IndexFlatL2`) để chia không gian thành `nlist` ô bằng k-means. Hàm `index.train(xb)` thực hiện việc phân cụm k-means này trước khi `add(xb)` thực sự thêm dữ liệu."
    },
    {
      "type": "config",
      "difficulty": "applied",
      "question": "Trong hệ thống Retrieval-Augmented Generation (RAG), vai trò của Vector Database là gì?",
      "code": "",
      "language": "python",
      "options": [
        "Tạo ra các embedding từ văn bản thô ngay trong database.",
        "Sinh ra câu trả lời (generation) bằng một mô hình ngôn ngữ lớn (LLM).",
        "Lưu trữ và truy xuất nhanh chóng các tài liệu có ý nghĩa (ngữ nghĩa) liên quan nhất đến câu hỏi của người dùng.",
        "Dịch thuật đa ngôn ngữ các kết quả tìm được."
      ],
      "answer": 2,
      "explanation": "Trong RAG, Vector Database đóng vai trò là phần \"Retrieval\" - nó lưu trữ các document chunk đã được mã hóa thành vector và thực hiện semantic search để cung cấp ngữ cảnh (context) liên quan nhất cho LLM sinh câu trả lời."
    },
    {
      "type": "compare",
      "difficulty": "advanced",
      "question": "Sự khác nhau cơ bản giữa Exact Search (KNN) và Approximate Nearest Neighbor (ANN) là gì?",
      "code": "",
      "language": "python",
      "options": [
        "Exact Search tìm chính xác 100% láng giềng gần nhất nhưng tốc độ chậm (O(N)), ANN tìm kết quả gần đúng nhưng với tốc độ cực nhanh (thường là O(log N)).",
        "Exact Search luôn nhanh hơn ANN nhưng ANN cho kết quả chính xác hơn.",
        "Exact Search yêu cầu máy chủ có GPU, ANN chỉ chạy được trên CPU.",
        "Exact Search chỉ hoạt động với text, ANN chỉ hoạt động với hình ảnh."
      ],
      "answer": 0,
      "explanation": "Exact search duyệt qua toàn bộ dữ liệu (exhaustive) nên luôn đảm bảo độ chính xác tuyệt đối nhưng rất chậm khi dữ liệu lớn. Các thuật toán ANN (như HNSW, IVFFlat, Annoy) đánh đổi một phần nhỏ độ chính xác để tăng tốc độ truy vấn lên nhiều lần."
    },
    {
      "type": "concept",
      "difficulty": "basic",
      "question": "Để dùng Vector Database, bước chuẩn bị dữ liệu (Data Ingestion) nào sau đây là KHÔNG thể thiếu?",
      "code": "",
      "language": "python",
      "options": [
        "Chuyển tài liệu thành file PDF và lưu vào S3 bucket.",
        "Trích xuất các thực thể (Named Entities) ra thành một đồ thị.",
        "Đưa tài liệu đi qua một Embedding Model để chuyển đổi thành các vector (array of floats).",
        "Gắn nhãn (label) cho từng tài liệu là 'Tích cực' hoặc 'Tiêu cực'."
      ],
      "answer": 2,
      "explanation": "Cơ sở dữ liệu Vector lưu trữ các vector. Do đó, bước cốt lõi là phải chạy dữ liệu text qua một Embedding model (ví dụ text-embedding-ada-002 của OpenAI hoặc BGE-m3) để có được các vector đó."
    },
    {
      "type": "scenario",
      "difficulty": "applied",
      "question": "Câu truy vấn của người dùng là 'Máy tính xách tay giá rẻ cho sinh viên'. Trong database có câu 'Laptop sinh viên tầm giá sinh viên'. Làm sao Vector Search tìm được câu này mặc dù từ khóa không khớp hoàn toàn?",
      "code": "",
      "language": "python",
      "options": [
        "Vector database tự động gửi query tới Google Search để tìm từ đồng nghĩa.",
        "Model embedding đã học được rằng 'Máy tính xách tay' và 'Laptop', 'giá rẻ' và 'tầm giá' xuất hiện trong ngữ cảnh tương tự, nên vector của 2 câu này nằm gần nhau.",
        "Do có cài đặt Fuzzy Matching (đánh vần sai) trên ElasticSearch.",
        "Do database dùng thuật toán HNSW để trộn các từ vào nhau."
      ],
      "answer": 1,
      "explanation": "Đặc tính quan trọng nhất của Embedding là các từ/câu có ngữ nghĩa giống nhau hoặc liên quan sẽ được ánh xạ thành các vector nằm gần nhau trong không gian nhiều chiều, bất chấp việc chúng không dùng chung từ vựng."
    },
    {
      "type": "code_debug",
      "difficulty": "advanced",
      "question": "Bạn dùng ChromaDB để truy vấn vector. Code dưới đây lỗi ở phần nào?",
      "code": "import chromadb\nclient = chromadb.Client()\ncollection = client.create_collection(name='my_docs')\n\n# Adding docs without explicitly generating embeddings\ncollection.add(\n    documents=['This is a document', 'This is another document'],\n    metadatas=[{'source': 'a'}, {'source': 'b'}],\n    ids=['id1', 'id2']\n)\nresults = collection.query(query_texts=['document'], n_results=1)",
      "language": "python",
      "options": [
        "Lỗi vì chưa gọi hàm `client.connect()`.",
        "Lỗi vì không khởi tạo model embedding, ChromaDB bắt buộc phải truyền model thủ công.",
        "Lỗi ở `n_results=1`, phải lớn hơn hoặc bằng 2.",
        "Không có lỗi. ChromaDB tự động dùng mô hình embedding mặc định (all-MiniLM-L6-v2) nếu không truyền vào."
      ],
      "answer": 3,
      "explanation": "ChromaDB (và nhiều Vector DB hiện đại khác) có tính năng built-in embedding. Nếu bạn không truyền vào hàm tạo embedding (embedding function), nó sẽ tự động tải một mô hình mặc định từ SentenceTransformers để embed text."
    },
    {
      "type": "concept",
      "difficulty": "applied",
      "question": "Trong bối cảnh RAG, 'Metadata Filtering' (Lọc siêu dữ liệu) trong Vector DB có tác dụng gì?",
      "code": "",
      "language": "python",
      "options": [
        "Lọc bỏ bớt số chiều của vector (ví dụ từ 1536 chiều xuống còn 256 chiều) để tiết kiệm RAM.",
        "Cho phép thu hẹp không gian tìm kiếm vector dựa trên các thuộc tính đi kèm (ví dụ: chỉ tìm trong các document có `author=John` hoặc `date>2023`).",
        "Lọc ra các từ khóa cấm hoặc từ ngữ thô tục khỏi câu trả lời của AI.",
        "Tự động trích xuất metadata từ PDF trước khi đưa vào embedding."
      ],
      "answer": 1,
      "explanation": "Metadata Filtering rất quan trọng trong RAG. Nó kết hợp sức mạnh tìm kiếm chính xác theo điều kiện (như SQL truyền thống) với tìm kiếm ngữ nghĩa, giúp giới hạn phạm vi tìm kiếm vector một cách chính xác."
    }
  ]
};
