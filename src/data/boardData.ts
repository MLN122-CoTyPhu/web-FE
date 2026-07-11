import type { BoardCell, EventCard, QuizQuestion } from "@/types/game";

export interface CellKnowledge {
  concept: string;      // tên khái niệm Mác-Lênin
  explanation: string;  // giải thích theo Chương 4
}

export interface BoardCellFull extends BoardCell {
  knowledge: CellKnowledge;
}

// ============================================
// NGÂN HÀNG 21 CÂU HỎI THÂU TÓM — trích từ 26 câu hỏi Chương 4 Mác-Lênin
// (mirror của socket-server-BE-/src/data/boardData.ts)
// ============================================
const Q_IMF: QuizQuestion = {
  question: "Trong thời kỳ độc quyền, ngân hàng không còn là trung gian thanh toán đơn thuần mà trở thành gì?",
  options: [
    "Người khống chế, chi phối mọi hoạt động kinh tế của xã hội",
    "Một cơ quan trung lập chỉ làm nhiệm vụ giữ hộ tiền cho khách hàng",
    "Một tổ chức từ thiện hỗ trợ vốn không hoàn lại cho doanh nghiệp nhỏ",
    "Một chi nhánh hành chính trực thuộc hoàn toàn chính phủ",
  ],
  correctIndex: 0,
};

const Q_NYSE: QuizQuestion = {
  question: "Hệ thống tài phiệt chi phối đời sống kinh tế thông qua cơ chế nào?",
  options: [
    "Chế độ tham dự (sở hữu cổ phần khống chế)",
    "Ban hành luật thuế trực tiếp lên từng công dân",
    "Kiểm soát hoàn toàn giá lương thực trong nước",
    "Sáp nhập bắt buộc mọi doanh nghiệp vào một công ty duy nhất",
  ],
  correctIndex: 0,
};

const Q_CONCERN: QuizQuestion = {
  question: "Đặc điểm chính của hình thức Concern là gì?",
  options: [
    "Tổ chức độc quyền đa ngành, có sự liên kết về kỹ thuật giữa các ngành",
    "Chỉ hoạt động trong một ngành duy nhất và không mở rộng",
    "Là thỏa thuận miệng, không có ràng buộc pháp lý giữa các bên",
    "Chỉ thống nhất giá bán, không liên quan đến kỹ thuật sản xuất",
  ],
  correctIndex: 0,
};

const Q_CONGLOMERATE: QuizQuestion = {
  question: "Conglomerate thâu tóm các xí nghiệp dựa trên cơ sở nào?",
  options: [
    "Các lĩnh vực kinh doanh hoàn toàn khác nhau, không liên quan về kỹ thuật",
    "Chỉ những xí nghiệp cùng ngành và có liên kết kỹ thuật chặt chẽ",
    "Chỉ những xí nghiệp nằm trong cùng một quốc gia",
    "Chỉ những xí nghiệp nhà nước đã cổ phần hóa",
  ],
  correctIndex: 0,
};

const Q_TNC: QuizQuestion = {
  question: "Hiện nay, chủ thể chính thực hiện đầu tư trực tiếp (FDI) toàn cầu là ai?",
  options: [
    "Các công ty xuyên quốc gia (TNCs)",
    "Các tổ chức phi chính phủ (NGO)",
    "Chính phủ các nước đang phát triển",
    "Các hộ gia đình cá thể ở nước phát triển",
  ],
  correctIndex: 0,
};

const Q_XN_LON: QuizQuestion = {
  question: "Khoa học - kỹ thuật phát triển cuối thế kỷ XIX đã thúc đẩy hình thành loại hình xí nghiệp nào?",
  options: [
    "Các xí nghiệp có quy mô lớn",
    "Các xưởng thủ công quy mô hộ gia đình",
    "Các hợp tác xã nông nghiệp nhỏ lẻ",
    "Các cửa hàng bán lẻ độc lập",
  ],
  correctIndex: 0,
};

const Q_XKTB_GIAI_DOAN: QuizQuestion = {
  question: "Xuất khẩu tư bản là đặc điểm của giai đoạn nào trong chủ nghĩa tư bản?",
  options: [
    "Giai đoạn chủ nghĩa tư bản độc quyền",
    "Giai đoạn chủ nghĩa tư bản tự do cạnh tranh",
    "Giai đoạn phong kiến chuyển sang tư bản",
    "Giai đoạn kinh tế kế hoạch hóa tập trung",
  ],
  correctIndex: 0,
};

const Q_DINH_NGHIA_DQ: QuizQuestion = {
  question: "Độc quyền là sự liên minh giữa các doanh nghiệp lớn nhằm mục đích gì?",
  options: [
    "Thâu tóm sản xuất/tiêu thụ, định giá độc quyền và thu lợi nhuận độc quyền cao",
    "Giảm giá bán để cạnh tranh công bằng với doanh nghiệp nhỏ",
    "Chia sẻ công nghệ miễn phí cho toàn ngành",
    "Tăng số lượng đối thủ cạnh tranh trên thị trường",
  ],
  correctIndex: 0,
};

const Q_KET_HOP_NHAN_SU: QuizQuestion = {
  question: "Sự kết hợp nhân sự giữa tư bản tài chính và nhà nước được thực hiện thông qua đâu?",
  options: [
    "Các hội chủ xí nghiệp, liên đoàn công nghiệp tham gia vào bộ máy chính quyền",
    "Các cuộc bầu cử trực tiếp do công nhân tổ chức",
    "Hiến pháp quy định cấm doanh nhân tham gia chính trị",
    "Tòa án quốc tế phân xử tranh chấp thương mại",
  ],
  correctIndex: 0,
};

const Q_XKTB_KET_HOP: QuizQuestion = {
  question: "Hình thức xuất khẩu tư bản hiện đại thường kết hợp với việc gì?",
  options: [
    "Kết hợp giữa xuất khẩu hàng hóa và xuất khẩu tư bản",
    "Chỉ xuất khẩu hàng hóa, không xuất khẩu vốn",
    "Chỉ chuyển giao lao động, không chuyển giao vốn hay hàng hóa",
    "Hoàn toàn tách biệt khỏi hoạt động thương mại quốc tế",
  ],
  correctIndex: 0,
};

const Q_DQNN_MUC_DICH: QuizQuestion = {
  question: "Độc quyền nhà nước hình thành nhằm tạo ra sức mạnh vật chất cho việc gì?",
  options: [
    "Sự ổn định của chế độ chính trị xã hội ứng với điều kiện lịch sử nhất định",
    "Xóa bỏ hoàn toàn vai trò của các tập đoàn tư nhân",
    "Tăng cường cạnh tranh tự do không giới hạn",
    "Giải thể toàn bộ hệ thống ngân hàng trung ương",
  ],
  correctIndex: 0,
};

const Q_BIEN_GIOI_MEM: QuizQuestion = {
  question: "Chiến lược 'Biên giới mềm' nhằm mục đích bành trướng lĩnh vực nào?",
  options: [
    "Bành trướng biên giới kinh tế và ảnh hưởng chính trị",
    "Mở rộng lãnh thổ quân sự bằng vũ lực trực tiếp",
    "Chỉ nhằm quảng bá văn hóa, không liên quan kinh tế",
    "Chỉ áp dụng trong nội bộ một quốc gia, không ra nước ngoài",
  ],
  correctIndex: 0,
};

const Q_CARTEL: QuizQuestion = {
  question: "Tại sao Cartel được coi là liên minh không vững chắc?",
  options: [
    "Vì các thành viên vẫn độc lập về cả sản xuất và lưu thông, dễ vi phạm thỏa thuận",
    "Vì Cartel bị pháp luật cấm hoàn toàn ở mọi quốc gia",
    "Vì Cartel chỉ tồn tại trong một ngày rồi giải thể",
    "Vì các thành viên bị sáp nhập thành một công ty duy nhất ngay từ đầu",
  ],
  correctIndex: 0,
};

const Q_SYNDICATE: QuizQuestion = {
  question: "Mục đích của Syndicate khi thống nhất đầu mối mua bán là gì?",
  options: [
    "Bán hàng hóa với giá đắt và mua nguyên liệu với giá rẻ",
    "Bán hàng hóa dưới giá thành để chiếm thị phần",
    "Loại bỏ hoàn toàn khâu mua bán trung gian",
    "Trao quyền định giá cho từng thành viên độc lập",
  ],
  correctIndex: 0,
};

const Q_TRUST: QuizQuestion = {
  question: "Hình thức độc quyền nào đánh dấu bước ngoặt về sự vận động của quan hệ sản xuất tư bản chủ nghĩa?",
  options: ["Trust (Tơ-rớt)", "Cartel", "Syndicate", "Concern"],
  correctIndex: 0,
};

const Q_XKTB_MUC_DICH: QuizQuestion = {
  question: "Mục đích cuối cùng của việc xuất khẩu tư bản ra nước ngoài là gì?",
  options: [
    "Chiếm đoạt giá trị thặng dư tại nước nhập khẩu tư bản",
    "Giúp đỡ nước nhập khẩu phát triển kinh tế không vụ lợi",
    "Chuyển giao toàn bộ công nghệ miễn phí",
    "Tăng viện trợ nhân đạo không hoàn lại",
  ],
  correctIndex: 0,
};

const Q_XKTB_BIEU_HIEN_MOI: QuizQuestion = {
  question: "Ngày nay, các nước tư bản phát triển thường xuất khẩu tư bản sang đâu là chủ yếu?",
  options: [
    "Xuất khẩu lẫn nhau giữa các nước tư bản phát triển",
    "Chỉ xuất khẩu sang các nước nghèo nhất thế giới",
    "Chỉ xuất khẩu trong nội bộ một quốc gia",
    "Ngừng hoàn toàn hoạt động xuất khẩu tư bản",
  ],
  correctIndex: 0,
};

const Q_CONG_CU_THUE: QuizQuestion = {
  question: "Nhà nước sử dụng công cụ Thuế để làm gì trong nền kinh tế độc quyền?",
  options: [
    "Điều tiết quá trình tái sản xuất xã hội theo hướng có lợi cho tư bản độc quyền",
    "Xóa bỏ hoàn toàn vai trò của thuế trong nền kinh tế",
    "Chỉ dùng để trả lương công chức, không điều tiết kinh tế",
    "Chuyển giao toàn quyền thu thuế cho tập đoàn tư nhân",
  ],
  correctIndex: 0,
};

const Q_SO_HUU_NN: QuizQuestion = {
  question: "Sở hữu độc quyền nhà nước là sở hữu tập thể của giai cấp nào?",
  options: [
    "Giai cấp tư bản độc quyền",
    "Giai cấp nông dân",
    "Toàn thể nhân dân lao động không phân biệt giai cấp",
    "Giai cấp tiểu tư sản thành thị",
  ],
  correctIndex: 0,
};

const Q_TAC_DONG_TICH_CUC: QuizQuestion = {
  question: "Độc quyền góp phần chuyển nền sản xuất nhỏ thành nền sản xuất như thế nào?",
  options: [
    "Nền sản xuất hiện đại",
    "Nền sản xuất thủ công truyền thống",
    "Nền sản xuất tự cung tự cấp",
    "Nền sản xuất phi tập trung hoàn toàn",
  ],
  correctIndex: 0,
};

const Q_TAC_DONG_TIEU_CUC: QuizQuestion = {
  question: "Độc quyền có thể gây ra hệ quả gì đối với sự phân hóa xã hội?",
  options: [
    "Làm gia tăng sự phân hóa giàu nghèo sâu sắc",
    "Xóa bỏ hoàn toàn khoảng cách giàu nghèo",
    "Không có tác động gì đến cơ cấu xã hội",
    "Làm giảm chênh lệch thu nhập giữa các tầng lớp",
  ],
  correctIndex: 0,
};

export const BOARD_CELLS: BoardCellFull[] = [
  {
    id: 0, name: "🌏 Ô Xuất Phát", type: "start",
    description: "Đi qua ô này nhận 200 đô la.",
    effect: { money: 200 },
    knowledge: {
      concept: "Tích lũy tư bản ban đầu",
      explanation: "Điểm khởi đầu của quá trình tích lũy tư bản. Theo Lênin, tập trung và tích tụ sản xuất là điều kiện tất yếu dẫn đến hình thành độc quyền — ai nắm nhiều vốn ban đầu, người đó có lợi thế chi phối.",
    },
  },
  {
    id: 1, name: "🏦 Quỹ Tiền Tệ Quốc Tế (IMF)", type: "financial_capital",
    description: "IMF cho vay kèm điều kiện khắt khe về cải cách kinh tế — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 480, rent: 80, quiz: Q_IMF,
    knowledge: {
      concept: "Tư bản tài chính quốc tế",
      explanation: "IMF là biểu hiện của sự chi phối tư bản tài chính toàn cầu. Theo Lênin, ngân hàng không còn là trung gian thanh toán mà trở thành trung tâm quyền lực, chi phối toàn bộ đời sống kinh tế qua điều kiện cho vay.",
    },
  },
  {
    id: 2, name: "📈 Thị Trường Chứng Khoán New York (NYSE)", type: "financial_capital",
    description: "Tư bản tài chính chi phối qua hệ thống cổ phần — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 360, rent: 60, quiz: Q_NYSE,
    knowledge: {
      concept: "Thị trường chứng khoán và tập trung tư bản",
      explanation: "Thị trường chứng khoán là công cụ chính của tư bản tài chính để tập trung vốn khổng lồ và chi phối các xí nghiệp qua hệ thống cổ phần, mà không cần sở hữu trực tiếp — đây là đặc trưng của chủ nghĩa tư bản độc quyền hiện đại.",
    },
  },
  {
    id: 3, name: "Việt Nam — Điều Tiết Nhà Nước", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Nhà nước Việt Nam chủ động bảo vệ nền kinh tế.",
    effect: { drawCard: true, drawCardType: "state_policy" },
    knowledge: {
      concept: "Vai trò điều tiết của Nhà nước xã hội chủ nghĩa",
      explanation: "Việt Nam vận dụng công cụ nhà nước (thuế, ngân sách, tiền tệ) để điều tiết thị trường và bảo vệ lợi ích quốc gia. Đây là sự khác biệt căn bản giữa nhà nước XHCN và nhà nước tư sản — nhà nước phục vụ lợi ích đa số, không phải lợi ích tài phiệt.",
    },
  },
  {
    id: 4, name: "🏢 Samsung — Tập Đoàn Độc Quyền Đa Ngành", type: "conglomerate",
    description: "Tập đoàn đa ngành kiểm soát nhiều lĩnh vực cùng lúc — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 420, rent: 70, quiz: Q_CONCERN,
    knowledge: {
      concept: "Tập đoàn độc quyền đa ngành (Conglomerate)",
      explanation: "Conglomerate thâu tóm nhiều ngành hoàn toàn khác nhau dưới một mái nhà. Theo Lênin, đây là biểu hiện cao nhất của tập trung tư bản — từ sự cạnh tranh tự do, thị trường tất yếu dẫn đến độc quyền thống trị.",
    },
  },
  {
    id: 5, name: "🌐 Liên Minh Dầu Mỏ Quốc Tế (Oil Consortium)", type: "consortium",
    description: "Hội đồng tư vấn họp — quyết định vay vốn hay giữ tự chủ kinh tế.",
    effect: { councilVote: true },
    knowledge: {
      concept: "Liên minh độc quyền (Consortium)",
      explanation: "Consortium là liên minh giữa các ngân hàng lớn và xí nghiệp công nghiệp, thống nhất giá cả và phân chia thị trường. Lênin nhấn mạnh: đây là hình thức độc quyền đặc trưng kết hợp tư bản ngân hàng với tư bản công nghiệp — bản chất của tư bản tài chính.",
    },
  },
  {
    id: 6, name: "💻 Google — Tập Đoàn Công Nghệ Số Toàn Cầu", type: "conglomerate",
    description: "Google xuất khẩu tư bản qua dữ liệu, nền tảng quảng cáo và điện toán đám mây — trả lời đúng để thâu tóm.",
    effect: {},
    ownable: true, price: 540, rent: 90, quiz: Q_CONGLOMERATE,
    knowledge: {
      concept: "Xuất khẩu tư bản thế hệ mới qua nền tảng số",
      explanation: "Các tập đoàn Big Tech là hình thức mới của xuất khẩu tư bản — không xuất khẩu hàng hóa vật chất mà xuất khẩu nền tảng số, dữ liệu và quyền lực mềm số. Đây là biến thể của lý luận Lênin về xuất khẩu tư bản trong kỷ nguyên số hóa.",
    },
  },
  {
    id: 7, name: "🏭 Foxconn — Công Ty Xuyên Quốc Gia Sản Xuất", type: "tnc",
    description: "Chuỗi cung ứng xuyên quốc gia — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 300, rent: 50, quiz: Q_TNC,
    knowledge: {
      concept: "Công ty xuyên quốc gia (TNC) và chuỗi cung ứng",
      explanation: "TNCs như Foxconn là chủ thể chủ yếu của xuất khẩu tư bản hiện đại. Chúng tạo ra mạng lưới sản xuất toàn cầu, khai thác lao động rẻ ở các nước đang phát triển và chiếm đoạt giá trị thặng dư — đúng như Lênin dự báo về bản chất của chủ nghĩa đế quốc.",
    },
  },
  {
    id: 8, name: "Việt Nam — Thu Hút Đầu Tư Trực Tiếp Nước Ngoài Công Nghệ Cao", type: "vietnam",
    description: "Rút thẻ Toàn cầu hóa. Chủ động thu hút FDI chất lượng cao để chuyển đổi cơ cấu.",
    effect: { drawCard: true, drawCardType: "globalization" },
    knowledge: {
      concept: "Tận dụng mặt tích cực của độc quyền",
      explanation: "Việt Nam chủ động thu hút FDI công nghệ cao để tận dụng mặt tích cực của độc quyền: thúc đẩy nghiên cứu khoa học kỹ thuật và tăng năng suất lao động. Đây là chiến lược 'vừa hội nhập, vừa bảo hộ' — tận dụng dòng vốn mà không để bị chi phối.",
    },
  },
  {
    id: 9, name: "💳 Nền Tảng Tài Chính Công Nghệ (Fintech)", type: "financial_capital",
    description: "Fintech tạo kênh luân chuyển vốn mới — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 240, rent: 40, quiz: Q_XN_LON,
    knowledge: {
      concept: "Biên giới mềm trong lĩnh vực tài chính số",
      explanation: "Các nền tảng Fintech là biểu hiện mới của xuất khẩu tư bản — không cần đặt văn phòng ở nước khác nhưng vẫn kiểm soát dòng tiền và dữ liệu tài chính. Đây là 'biên giới mềm' trong không gian số mà các nhà nước cần xây dựng khả năng quản lý.",
    },
  },
  {
    id: 10, name: "⚓ Ô Tự Do — Nghỉ Một Lượt", type: "free",
    description: "Không có hiệu ứng. Nghỉ ngơi, quan sát thị trường toàn cầu.",
    effect: {},
    knowledge: {
      concept: "Không gian tự do tương đối trong nền kinh tế độc quyền",
      explanation: "Ngay cả 'ô tự do' cũng là sản phẩm của hệ thống độc quyền. Theo Lênin, tự do cạnh tranh trong chủ nghĩa tư bản chỉ là tạm thời — tất yếu dẫn đến độc quyền. Đây là thời điểm cân nhắc chiến lược trước khi tiếp tục cuộc chơi.",
    },
  },
  {
    id: 11, name: "🌍 Ngân Hàng Thế Giới (World Bank)", type: "financial_capital",
    description: "Ngân hàng Thế giới cho vay kèm điều kiện 'cải cách cơ cấu' — trả lời đúng để thâu tóm.",
    effect: {},
    ownable: true, price: 600, rent: 100, quiz: Q_XKTB_GIAI_DOAN,
    knowledge: {
      concept: "Định chế tài chính quốc tế như công cụ chi phối",
      explanation: "World Bank là công cụ của tư bản tài chính quốc tế. Điều kiện vay thường yêu cầu tư nhân hóa, cắt giảm chi tiêu công và mở cửa thị trường — thực chất là áp đặt mô hình kinh tế tư bản, làm suy yếu khả năng điều tiết của nhà nước các nước đang phát triển.",
    },
  },
  {
    id: 12, name: "📦 Amazon — Mạng Lưới Thương Mại Và Logistics Toàn Cầu", type: "tnc",
    description: "Amazon kiểm soát cả sản xuất lẫn phân phối — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 480, rent: 80, quiz: Q_DINH_NGHIA_DQ,
    knowledge: {
      concept: "TNC kiểm soát cả sản xuất lẫn lưu thông",
      explanation: "Amazon kiểm soát không chỉ sản xuất mà cả phân phối và hạ tầng đám mây — đây là đặc trưng của tư bản tài chính hiện đại: chi phối toàn bộ vòng quay tư bản từ sản xuất đến tiêu thụ, như Lênin mô tả về sự kết hợp công nghiệp-thương nghiệp-ngân hàng.",
    },
  },
  {
    id: 13, name: "🔗 Liên Minh Công Nghệ Quốc Tế (Tech Consortium)", type: "consortium",
    description: "Liên minh công nghệ áp đặt tiêu chuẩn quốc tế — hội đồng biểu quyết chấp nhận hay kháng cự.",
    effect: { councilVote: true },
    knowledge: {
      concept: "Độc quyền tiêu chuẩn công nghệ như biên giới mềm",
      explanation: "Consortium công nghệ áp đặt tiêu chuẩn kỹ thuật quốc tế, buộc các nước đang phát triển phải tuân theo. Đây là hình thức 'biên giới mềm' trong lĩnh vực công nghệ — ai kiểm soát tiêu chuẩn thì kiểm soát thị trường toàn cầu mà không cần dùng vũ lực.",
    },
  },
  {
    id: 14, name: "Việt Nam — Hàng Rào Thuế Quan Bảo Hộ", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Nhà nước dùng thuế hạn chế sức mạnh độc quyền nước ngoài.",
    effect: { drawCard: true, drawCardType: "state_policy" },
    knowledge: {
      concept: "Công cụ thuế quan như vũ khí kinh tế",
      explanation: "Hàng rào thuế quan là công cụ nhà nước hạn chế sự thao túng của hàng hóa độc quyền nước ngoài và bảo vệ sản xuất trong nước. Việt Nam cần cân bằng giữa hội nhập (hưởng lợi từ thương mại) và bảo hộ (bảo vệ ngành sản xuất chiến lược nội địa).",
    },
  },
  {
    id: 15, name: "💥 Khủng Hoảng Tín Dụng Toàn Cầu", type: "crisis",
    description: "Tất cả người chơi đều mất tiền. Khủng hoảng lan rộng không ai tránh khỏi.",
    effect: { money: -150, allPlayers: true },
    knowledge: {
      concept: "Khủng hoảng tín dụng và tích tụ tư bản bắt buộc",
      explanation: "Theo Lênin, khủng hoảng kinh tế là nguyên nhân trực tiếp thúc đẩy tích tụ và tập trung tư bản. Các doanh nghiệp yếu bị thâu tóm, tư bản tập trung vào ít tay hơn — khủng hoảng không phá hủy hệ thống mà tái cấu trúc nó theo hướng tập trung độc quyền hơn.",
    },
  },
  {
    id: 16, name: "🏦 JP Morgan — Ngân Hàng Độc Quyền Hàng Đầu", type: "financial_capital",
    description: "Ngân hàng độc quyền lớn nhất Phố Wall — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 720, rent: 120, quiz: Q_KET_HOP_NHAN_SU,
    knowledge: {
      concept: "Ngân hàng độc quyền — trung tâm quyền lực kinh tế",
      explanation: "JP Morgan là ví dụ điển hình cho luận điểm của Lênin: ngân hàng lớn không còn là trung gian thanh toán mà trở thành 'chủ nhân' của nền kinh tế. Thông qua nắm giữ cổ phần và cho vay, ngân hàng kiểm soát hàng trăm xí nghiệp công nghiệp và thương nghiệp.",
    },
  },
  {
    id: 17, name: "🛢️ Tổ Hợp Ngân Hàng Toàn Cầu (Banking Syndicate)", type: "consortium",
    description: "Syndicate ngân hàng thống nhất giá cả và phân chia thị trường — hội đồng quyết định.",
    effect: { money: -90, autonomy: -25 },
    knowledge: {
      concept: "Syndicate — độc quyền thỏa thuận giá cả",
      explanation: "Syndicate là hình thức liên minh độc quyền trong đó các thành viên thống nhất giá cả và sản lượng, triệt tiêu hoàn toàn cạnh tranh. Khi các ngân hàng lớn nhất thế giới hợp thành Syndicate, họ kiểm soát lãi suất toàn cầu — ảnh hưởng đến mọi nền kinh tế.",
    },
  },
  {
    id: 18, name: "📱 Apple — Chuỗi Giá Trị Xuyên Quốc Gia", type: "tnc",
    description: "Apple thiết kế ở Mỹ, sản xuất ở châu Á — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 420, rent: 70, quiz: Q_XKTB_KET_HOP,
    knowledge: {
      concept: "Chuỗi giá trị toàn cầu và chiếm đoạt giá trị thặng dư",
      explanation: "Apple thiết kế ở Mỹ, sản xuất ở châu Á (Foxconn, TSMC). Lợi nhuận khổng lồ chảy về trụ sở chính trong khi lao động ở nước đang phát triển nhận phần nhỏ. Đây là hình thức xuất khẩu tư bản hiện đại: kết hợp xuất khẩu vốn và công nghệ để chiếm đoạt giá trị thặng dư từ xa.",
    },
  },
  {
    id: 19, name: "Việt Nam — Nhận Diện Chiến Lược Biên Giới Mềm", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Nhận diện và cảnh giác với bành trướng kinh tế núp bóng đầu tư.",
    effect: { drawCard: true, drawCardType: "state_policy" },
    knowledge: {
      concept: "Biên giới mềm — bành trướng không cần súng đạn",
      explanation: "Biên giới mềm (soft border) là khái niệm chỉ sự bành trướng kinh tế không cần chiếm đóng lãnh thổ. Các cường quốc sử dụng đầu tư hạ tầng, công nghệ và tiêu chuẩn quốc tế để áp đặt ảnh hưởng. Việt Nam cần nhận diện rõ chiến lược này để có chính sách bảo vệ an ninh kinh tế phù hợp.",
    },
  },
  {
    id: 20, name: "🎯 Hội Đồng Tư Vấn — Biểu Quyết Tập Thể", type: "free",
    description: "Toàn bộ người chơi cùng biểu quyết về một quyết sách kinh tế quan trọng.",
    effect: { councilVote: true },
    knowledge: {
      concept: "Liên minh nhân sự (Personal Union) trong tư bản tài chính",
      explanation: "Theo Lênin, liên minh nhân sự là việc các đại diện tập đoàn độc quyền tham gia vào bộ máy nhà nước và ngược lại. Hội đồng tư vấn này mô phỏng cơ chế quyết định tập thể đó — ranh giới giữa lợi ích doanh nghiệp và lợi ích nhà nước trở nên mờ nhạt.",
    },
  },
  {
    id: 21, name: "💰 BlackRock — Quỹ Đầu Tư Độc Quyền Lớn Nhất Thế Giới", type: "financial_capital",
    description: "BlackRock quản lý tài sản vượt GDP nhiều quốc gia — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 660, rent: 110, quiz: Q_DQNN_MUC_DICH,
    knowledge: {
      concept: "Quỹ đầu tư — đỉnh cao tập trung tư bản tài chính",
      explanation: "BlackRock quản lý hơn 10.000 tỷ đô tài sản — lớn hơn GDP của Trung Quốc. Đây là biểu hiện cao nhất của sự tập trung tư bản tài chính mà Lênin dự báo: một số ít tổ chức tài chính kiểm soát phần lớn tư bản của toàn thế giới thông qua hệ thống cổ phần.",
    },
  },
  {
    id: 22, name: "🏗️ Sáng Kiến Vành Đai Con Đường — Biên Giới Mềm Hạ Tầng", type: "tnc",
    description: "Đầu tư hạ tầng kèm điều kiện ràng buộc chủ quyền — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 360, rent: 60, rentAutonomy: -8, quiz: Q_BIEN_GIOI_MEM,
    knowledge: {
      concept: "Bẫy nợ và biên giới mềm qua đầu tư hạ tầng",
      explanation: "Sáng kiến Vành Đai Con Đường (BRI) là ví dụ điển hình về biên giới mềm: sử dụng đầu tư hạ tầng để mở rộng ảnh hưởng kinh tế và chính trị mà không cần xâm chiếm lãnh thổ. Khi con nợ không trả được, tài sản chiến lược bị chuyển giao — một hình thức chiếm đoạt hiện đại.",
    },
  },
  {
    id: 23, name: "Việt Nam — Xây Dựng Năng Lực Nội Sinh Và Tập Đoàn Quốc Gia", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Khuyến khích tập đoàn trong nước đủ mạnh để cạnh tranh.",
    effect: { drawCard: true, drawCardType: "state_policy" },
    knowledge: {
      concept: "Xây dựng năng lực nội sinh như biện pháp bảo vệ chủ quyền kinh tế",
      explanation: "Để không bị thâu tóm hoàn toàn bởi tư bản nước ngoài, Việt Nam cần tập đoàn kinh tế trong nước đủ mạnh. Theo lý luận về độc quyền, chỉ khi có lực lượng đối trọng nội địa mới có thể mặc cả sòng phẳng với TNC và bảo vệ lợi ích quốc gia.",
    },
  },
  {
    id: 24, name: "🚗 Toyota — Sản Xuất Xuyên Quốc Gia Và Phụ Thuộc Chuỗi Cung Ứng", type: "tnc",
    description: "Mạng lưới sản xuất toàn cầu của Toyota — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 390, rent: 65, quiz: Q_CARTEL,
    knowledge: {
      concept: "Bẫy phụ thuộc chuỗi cung ứng của TNC",
      explanation: "Các nước đang phát triển dễ rơi vào bẫy phụ thuộc: khi TNC đặt nhà máy, nước sở tại trở thành 'mắt xích' trong chuỗi cung ứng toàn cầu do TNC kiểm soát. Mất đơn hàng của TNC là mất việc làm hàng loạt — đây là hình thức chi phối kinh tế tinh vi nhất.",
    },
  },
  {
    id: 25, name: "💳 Visa Và Mastercard — Hạ Tầng Thanh Toán Kiểm Soát Dòng Tiền", type: "financial_capital",
    description: "Kiểm soát hạ tầng thanh toán toàn cầu — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 330, rent: 55, quiz: Q_SYNDICATE,
    knowledge: {
      concept: "Hạ tầng thanh toán như công cụ quyền lực mềm tài chính",
      explanation: "Visa và Mastercard xử lý hàng tỷ giao dịch mỗi ngày và có thể ngừng dịch vụ với bất kỳ quốc gia nào theo lệnh chính phủ Mỹ. Đây là hình thức quyền lực mềm tài chính: ai kiểm soát hạ tầng thanh toán thì có quyền năng kinh tế không cần vũ lực.",
    },
  },
  {
    id: 26, name: "🤝 Tổ Chức Thương Mại Thế Giới (WTO)", type: "consortium",
    description: "Gia nhập WTO mở thị trường nhưng kèm điều kiện — hội đồng biểu quyết hội nhập hay bảo hộ.",
    effect: { councilVote: true },
    knowledge: {
      concept: "Thể chế thương mại quốc tế và bất bình đẳng có cơ cấu",
      explanation: "Các luật lệ của WTO thường phản ánh lợi ích của các nước phát triển, buộc nước đang phát triển giảm bảo hộ trong khi nước giàu vẫn duy trì trợ cấp nông nghiệp và sở hữu trí tuệ. Đây là biểu hiện của 'luật chơi' do tư bản tài chính quốc tế thiết lập.",
    },
  },
  {
    id: 27, name: "Việt Nam — Liên Kết Kinh Tế Khu Vực ASEAN Và RCEP", type: "vietnam",
    description: "Rút thẻ Toàn cầu hóa. Tham gia ASEAN, RCEP — liên kết khu vực bảo vệ không gian phát triển.",
    effect: { drawCard: true, drawCardType: "globalization" },
    knowledge: {
      concept: "Khu vực hóa như chiến lược bảo vệ tập thể",
      explanation: "Việt Nam tham gia ASEAN và RCEP để xây dựng không gian bảo vệ tập thể trước sức ép của các nước tư bản lớn. Theo lý luận về toàn cầu hóa và khu vực hóa, liên kết khu vực là tất yếu để bảo vệ không gian phát triển — nhưng phải đảm bảo điều kiện có lợi cho nước đang phát triển.",
    },
  },
  {
    id: 28, name: "🔬 Intel — Công Nghệ Bán Dẫn Chiến Lược", type: "tnc",
    description: "Ngành bán dẫn có ý nghĩa chiến lược — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 300, rent: 50, quiz: Q_TAC_DONG_TICH_CUC,
    knowledge: {
      concept: "Công nghệ chiến lược và chuyển giao công nghệ",
      explanation: "Độc quyền công nghệ cao (như thúc đẩy R&D và sản xuất chip) là mặt tích cực của độc quyền mà Lênin đề cập: độc quyền tạo điều kiện tập trung nguồn lực cho nghiên cứu khoa học kỹ thuật. Việt Nam cần khai thác cơ hội này để nâng cấp vị thế trong chuỗi giá trị toàn cầu.",
    },
  },
  {
    id: 29, name: "📊 Goldman Sachs — Tư Bản Tài Chính Phố Wall", type: "financial_capital",
    description: "Goldman Sachs thống trị thị trường vốn toàn cầu — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 780, rent: 130, quiz: Q_XKTB_BIEU_HIEN_MOI,
    knowledge: {
      concept: "Phố Wall — trung tâm của tư bản tài chính toàn cầu",
      explanation: "Goldman Sachs tiêu biểu cho sự tập trung tư bản tài chính mà Lênin mô tả: một số ít ngân hàng lớn kiểm soát thị trường vốn toàn cầu, chi phối các chính phủ và doanh nghiệp. Cựu nhân viên Goldman Sachs nắm giữ nhiều vị trí bộ trưởng tài chính trên thế giới — minh chứng cho 'liên minh nhân sự'.",
    },
  },
  {
    id: 30, name: "🚧 Đình Trệ Sản Xuất", type: "crisis",
    description: "Vẫn di chuyển bình thường nhưng không thể thu phí thuê hay thâu tóm ô mới trong 2 lượt (vẫn được biểu quyết Hội đồng).",
    effect: { autonomy: -40, softPower: -20 },
    knowledge: {
      concept: "Chi phối kinh tế dẫn đến chi phối chính trị",
      explanation: "Theo Lênin, xuất khẩu tư bản không chỉ chiếm đoạt về kinh tế mà tất yếu dẫn đến chi phối về chính trị. Khi kinh tế phụ thuộc, chính sách đối nội và đối ngoại đều bị ảnh hưởng. Đây là bản chất của chủ nghĩa đế quốc — không chỉ là hiện tượng kinh tế mà là hệ thống quyền lực tổng thể.",
    },
  },
  {
    id: 31, name: "🧩 Tencent — Tập Đoàn Số Đa Ngành Nắm Giữ Dữ Liệu", type: "conglomerate",
    description: "Tencent thu thập dữ liệu hàng tỷ người — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 510, rent: 85, quiz: Q_TAC_DONG_TIEU_CUC,
    knowledge: {
      concept: "Tập đoàn số và tài nguyên dữ liệu như tư bản mới",
      explanation: "Tencent kiểm soát WeChat, gaming, tài chính và dữ liệu của hàng tỷ người dùng — đây là hình thức mới của xuất khẩu tư bản: chiếm đoạt không phải tài nguyên vật chất mà tài nguyên số (dữ liệu hành vi, tài chính, xã hội). Dữ liệu là 'dầu mỏ' của thế kỷ 21.",
    },
  },
  {
    id: 32, name: "Việt Nam — Bảo Hộ Công Nghệ Tài Chính Nội Địa", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Xây dựng hệ sinh thái Fintech nội địa tự chủ.",
    effect: { drawCard: true, drawCardType: "state_policy" },
    knowledge: {
      concept: "Tự chủ công nghệ tài chính như nền tảng chủ quyền số",
      explanation: "Việt Nam cần xây dựng hệ sinh thái Fintech nội địa (MoMo, VNPay...) để tránh phụ thuộc vào nền tảng nước ngoài. Đây là biểu hiện của tự chủ kinh tế số — tương tự như vai trò của ngân hàng quốc gia trong lý luận Lênin về công cụ điều tiết nhà nước.",
    },
  },
  {
    id: 33, name: "✈️ Nike — Xuất Khẩu Sản Xuất Sang Nước Đang Phát Triển", type: "tnc",
    description: "Nike thiết kế ở Mỹ, sản xuất ở Việt Nam — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 360, rent: 60, quiz: Q_XKTB_MUC_DICH,
    knowledge: {
      concept: "Khai thác lao động thông qua chuỗi cung ứng TNC",
      explanation: "Nike thiết kế ở Mỹ nhưng sản xuất ở Việt Nam, Bangladesh... để khai thác lao động giá rẻ và chiếm đoạt giá trị thặng dư từ nước nhập khẩu tư bản. Đây là đúng cơ chế Lênin mô tả: xuất khẩu tư bản để chiếm đoạt lợi nhuận ở nước có mức lương thấp hơn.",
    },
  },
  {
    id: 34, name: "🌊 Khủng Hoảng Tài Chính Toàn Cầu — Tích Tụ Bắt Buộc", type: "crisis",
    description: "Khủng hoảng toàn cầu — tất cả mất tiền nặng, buộc phải hợp nhất tài sản để tồn tại.",
    effect: { money: -200, allPlayers: true },
    knowledge: {
      concept: "Khủng hoảng tài chính như động lực tái cấu trúc độc quyền",
      explanation: "Khủng hoảng 2008 là minh chứng: khi bong bóng tài chính vỡ, nhà nước phải 'cứu' các ngân hàng 'quá lớn để đổ' (too big to fail). Kết quả: tư bản tập trung hơn vào ít tay hơn. Khủng hoảng không phá hủy chủ nghĩa tư bản mà tái cấu trúc nó theo hướng độc quyền sâu hơn.",
    },
  },
  {
    id: 35, name: "🏛️ Ngân Hàng Phát Triển Châu Á (ADB)", type: "financial_capital",
    description: "ADB cho vay vốn phát triển kèm điều kiện cải cách cơ cấu — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 420, rent: 70, quiz: Q_CONG_CU_THUE,
    knowledge: {
      concept: "Cạnh tranh ảnh hưởng qua định chế tài chính khu vực",
      explanation: "ADB (do Nhật-Mỹ chi phối) và AIIB (do Trung Quốc khởi xướng) phản ánh cạnh tranh ảnh hưởng của các cường quốc tư bản thông qua định chế tài chính. Vốn vay luôn đi kèm điều kiện phản ánh lợi ích địa chính trị của nước cho vay — không có bữa trưa miễn phí trong quan hệ tài chính quốc tế.",
    },
  },
  {
    id: 36, name: "Việt Nam — Điều Hành Chính Sách Tiền Tệ Và Tín Dụng", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Nhà nước dùng tiền tệ và tín dụng bảo vệ kinh tế vĩ mô.",
    effect: { drawCard: true, drawCardType: "state_policy" },
    knowledge: {
      concept: "Công cụ tiền tệ như vũ khí bảo vệ kinh tế quốc gia",
      explanation: "Ngân hàng Nhà nước Việt Nam điều hành chính sách tiền tệ, kiểm soát tỷ giá và tín dụng để bảo vệ kinh tế vĩ mô trước biến động của dòng vốn quốc tế. Đây là ứng dụng thực tiễn của lý luận Lênin: nhà nước phải nắm giữ 'các đòn bẩy chỉ huy' của nền kinh tế — ngân hàng, tiền tệ, tín dụng.",
    },
  },
  {
    id: 37, name: "🔋 TSMC — Chuỗi Bán Dẫn Toàn Cầu Và Ai Kiểm Soát Chip", type: "tnc",
    description: "TSMC nắm giữ công nghệ chip tiên tiến nhất — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 540, rent: 90, quiz: Q_SO_HUU_NN,
    knowledge: {
      concept: "Độc quyền công nghệ chip — đỉnh cao của tập trung sản xuất",
      explanation: "'Ai kiểm soát chip, người đó kiểm soát thế giới.' TSMC nắm giữ công nghệ sản xuất chip tiên tiến nhất và hầu như không có đối thủ cạnh tranh — đây là ví dụ sinh động nhất về độc quyền hoàn toàn trong kỷ nguyên số. Cả Mỹ lẫn Trung Quốc đều tranh giành kiểm soát TSMC.",
    },
  },
  {
    id: 38, name: "💼 Tập Đoàn Tài Chính Độc Quyền (Financial Trust)", type: "conglomerate",
    description: "Trust tài chính thống nhất cả sản xuất lẫn lưu thông — trả lời đúng câu hỏi để thâu tóm.",
    effect: {},
    ownable: true, price: 600, rent: 100, rentAutonomy: -10, quiz: Q_TRUST,
    knowledge: {
      concept: "Trust — hình thức độc quyền cao nhất theo Lênin",
      explanation: "Trust là hình thức tổ chức độc quyền cao nhất mà Lênin phân tích: thống nhất cả sản xuất lẫn lưu thông dưới sự kiểm soát chung, triệt tiêu hoàn toàn cạnh tranh. Đây là kết quả tất yếu của quá trình tích tụ và tập trung tư bản — từ cạnh tranh tự do đến độc quyền tuyệt đối.",
    },
  },
  {
    id: 39, name: "🎴 Ô Cơ Hội — Rút Thẻ Vận Mệnh", type: "free",
    description: "Rút thẻ ngẫu nhiên — cơ hội hay rủi ro đều có thể xảy ra trong nền kinh tế toàn cầu hóa.",
    effect: { drawCard: true },
    knowledge: {
      concept: "Tính ngẫu nhiên và bất định trong kinh tế tư bản",
      explanation: "Trong hệ thống tư bản độc quyền, ngay cả những tác nhân lớn cũng phải đối mặt với rủi ro và bất định. Nhưng theo Lênin, 'may mắn' và 'rủi ro' trong tư bản chủ nghĩa không hoàn toàn ngẫu nhiên — chúng phản ánh sức mạnh tương quan của các lực lượng kinh tế và chính trị.",
    },
  },
];

// Bộ màu trầm, tông đỏ cờ + vàng học thuật (theo yêu cầu) — thay cho bảng màu
// Tailwind mặc định (đỏ/cam/tím/xanh tươi) trước đây trông chói và lệch tông
// so với phần Nội Dung.
//
// Kiểu tô: nền TRẦM (tối) riêng theo loại ô + viền cùng tông nhưng đậm/rõ hơn
// một chút để phân định — đúng theo spec "nền trầm, không dùng màu tươi/sáng".
// Thanh 4px ở mép trên mỗi ô (xem STRIP_COLORS trong room/[id]/page.tsx) dùng
// lại đúng các mã hex "border" bên dưới làm dấu hiệu loại ô nổi bật hơn.
export const CELL_COLORS: Record<string, string> = {
  financial_capital: "bg-[#5c1512] border-[#a02820] text-[#ffd9d4]",
  conglomerate:      "bg-[#5c3410] border-[#b0621a] text-[#ffe3c2]",
  consortium:        "bg-[#3d1f4d] border-[#7a3d94] text-[#ecd2f7]",
  tnc:               "bg-[#152b45] border-[#2f5f95] text-[#cfe1f7]",
  vietnam:           "bg-[#123821] border-[#1f7a45] text-[#c7f0d5]",
  crisis:            "bg-[#1a1310] border-[#8a1a12] text-[#f0c6c0]",
  start:             "bg-[#5c4a10] border-[#d4af1f] text-[#fff3c4]",
  free:              "bg-[#2a2f38] border-[#5a6474] text-[#dbe2ec]",
};

export const CELL_TYPE_LABELS: Record<string, string> = {
  financial_capital: "Tư Bản Tài Chính",
  conglomerate:      "Tập Đoàn Đa Ngành",
  consortium:        "Liên Minh Độc Quyền",
  tnc:               "Công Ty Xuyên Quốc Gia",
  vietnam:           "Chính Sách Việt Nam",
  crisis:            "Khủng Hoảng Kinh Tế",
  start:             "Ô Xuất Phát",
  free:              "Ô Trung Lập",
};

export const EVENT_CARDS: EventCard[] = [
  {
    id: "sp1", type: "state_policy",
    title: "🛡️ Bảo Hộ Công Nghệ Tài Chính Nội Địa",
    description: "Việt Nam ban hành chính sách hỗ trợ công ty Fintech trong nước trước sự bành trướng của tập đoàn nước ngoài. Không phải trả phí ô Fintech trong 1 lượt.",
    effect: { softPower: 20, autonomy: 15 },
  },
  {
    id: "sp2", type: "state_policy",
    title: "🏗️ Điều Tiết Nhà Nước Hiệu Quả",
    description: "Nhà nước Việt Nam sử dụng hiệu quả công cụ thuế và ngân sách để bảo vệ nền kinh tế trước các cú sốc bên ngoài. Tăng tự chủ kinh tế và nhận ngân sách bổ sung.",
    effect: { autonomy: 25, money: 50 },
  },
  {
    id: "sp3", type: "state_policy",
    title: "⚖️ Hàng Rào Thuế Quan Chiến Lược",
    description: "Hạn chế sự thao túng của hàng hóa độc quyền nước ngoài. Các tập đoàn quốc tế phải nộp thuế cao — bạn nhận được khoản tiền bù đắp.",
    effect: { money: 120, autonomy: 10 },
  },
  {
    id: "sp4", type: "state_policy",
    title: "🔍 Nhận Diện Và Phản Công Biên Giới Mềm",
    description: "Việt Nam nhận diện thành công chiến lược bành trướng kinh tế núp bóng đầu tư hạ tầng. Giữ vững quyền lực mềm và tự chủ chính sách.",
    effect: { softPower: 30, autonomy: 20 },
  },
  {
    id: "sp5", type: "state_policy",
    title: "🏭 Xây Dựng Tập Đoàn Kinh Tế Quốc Gia",
    description: "Khuyến khích tập đoàn trong nước đủ mạnh để cạnh tranh với công ty xuyên quốc gia. Tăng năng lực nội sinh và quyền lực mềm.",
    effect: { softPower: 15, money: 80, autonomy: 10 },
  },
  {
    id: "fc1", type: "financial_capital",
    title: "💥 Khủng Hoảng Tín Dụng Lan Rộng Toàn Cầu",
    description: "Tư bản tài chính sụp đổ dây chuyền — tất cả người chơi mất tiền. Quá trình tích tụ tư bản bắt buộc xảy ra: doanh nghiệp yếu bị thâu tóm.",
    effect: { money: -150, allPlayers: true },
  },
  {
    id: "fc2", type: "financial_capital",
    title: "📉 Dòng Vốn Đầu Tư Rút Đột Ngột",
    description: "Các quỹ đầu tư quốc tế rút vốn đột ngột khi thị trường bất ổn — mất tài sản và quyền lực mềm.",
    effect: { money: -100, softPower: -15 },
  },
  {
    id: "fc3", type: "financial_capital",
    title: "🏢 Tập Đoàn Nước Ngoài Thâu Tóm Doanh Nghiệp Nội Địa",
    description: "Tập đoàn độc quyền nước ngoài thâu tóm công ty trong nước với giá rẻ — mất kiểm soát tài sản chiến lược.",
    effect: { money: -80, autonomy: -25 },
  },
  {
    id: "fc4", type: "financial_capital",
    title: "🔗 Kết Hợp Nhân Sự Giữa Tập Đoàn Và Chính Quyền",
    description: "Đại diện tập đoàn độc quyền xâm nhập vào bộ máy ra quyết định chính sách. Mất tự chủ về chính sách kinh tế.",
    effect: { autonomy: -30, softPower: -20 },
  },
  {
    id: "fc5", type: "financial_capital",
    title: "💸 Xuất Khẩu Tư Bản Chiếm Đoạt Giá Trị Thặng Dư",
    description: "Tư bản nước ngoài chiếm đoạt giá trị thặng dư từ lao động trong nước. Mất tiền và giảm tự chủ kinh tế.",
    effect: { money: -120, autonomy: -20 },
  },
  {
    id: "gl1", type: "globalization",
    title: "🌟 Thu Hút Thành Công Đầu Tư Trực Tiếp Công Nghệ Cao",
    description: "Tập đoàn đa quốc gia đầu tư vào ngành bán dẫn và điện tử — chuyển đổi cơ cấu kinh tế theo hướng công nghệ cao.",
    effect: { money: 100, softPower: 20 },
  },
  {
    id: "gl2", type: "globalization",
    title: "🤝 Gia Nhập Hiệp Định Thương Mại Khu Vực",
    description: "Tham gia RCEP mở rộng thị trường nhưng phải giảm bảo hộ. Cân bằng giữa hội nhập và tự chủ kinh tế.",
    effect: { money: 80, autonomy: -10, softPower: 15 },
  },
  {
    id: "gl3", type: "globalization",
    title: "📡 Hội Nhập Kinh Tế Số Toàn Cầu",
    description: "Tiếp nhận công nghệ và dòng vốn số — tăng năng suất nhưng phụ thuộc vào nền tảng và hạ tầng nước ngoài.",
    effect: { money: 60, softPower: -10, autonomy: -5 },
  },
  {
    id: "gl4", type: "globalization",
    title: "⚡ Cách Mạng Công Nghiệp 4.0 Thúc Đẩy Năng Suất",
    description: "Độc quyền thúc đẩy tiến bộ khoa học kỹ thuật — đây là mặt tích cực của độc quyền mà Lênin đề cập. Năng suất lao động tăng mạnh.",
    effect: { money: 90, softPower: 10 },
  },
];
