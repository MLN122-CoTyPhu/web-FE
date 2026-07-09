import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Tư Bản Tài Chính & Quyền Lực Mềm Của Độc Quyền — Chương 4",
  description:
    "Kinh tế chính trị Mác–Lênin: Tư bản tài chính và quyền lực mềm của độc quyền — bài học cho kinh tế Việt Nam.",
};

function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="4.6" r="2.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SectionHeading({ number, title }: { number: number; title: string }) {
  return (
    <div className="mb-8 flex items-start gap-5">
      <span
        className="content-serif flex-shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: "52px",
          height: "52px",
          background: "var(--content-red)",
          color: "#fff",
          fontSize: "22px",
          fontWeight: 700,
          boxShadow: "0 6px 18px rgba(193,18,31,0.35)",
        }}
      >
        {number}
      </span>
      <h2
        className="content-serif"
        style={{
          fontSize: "clamp(22px, 3.2vw, 32px)",
          fontWeight: 700,
          lineHeight: 1.32,
          color: "var(--content-text)",
          paddingTop: "6px",
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-5"
      style={{ fontSize: "16px", lineHeight: 1.9, color: "var(--content-text)" }}
    >
      {children}
    </p>
  );
}

function TermParagraph({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <Lead>
      <strong className="content-serif" style={{ color: "var(--content-gold)", fontWeight: 600 }}>
        {term}{" "}
      </strong>
      {children}
    </Lead>
  );
}

function ItemList({
  items,
}: {
  items: { title: string; desc: string }[];
}) {
  return (
    <div className="mb-6">
      {items.map((it, i) => (
        <div key={i} className="content-item flex gap-4">
          <span
            className="content-serif flex-shrink-0"
            style={{ color: "var(--content-red)", fontSize: "13px", fontWeight: 600, width: "22px", paddingTop: "2px" }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <p style={{ fontWeight: 600, color: "var(--content-text)", fontSize: "15px" }}>{it.title}</p>
            <p style={{ color: "var(--content-text-secondary)", fontSize: "14.5px", lineHeight: 1.8, marginTop: "3px" }}>
              {it.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="content-serif"
      style={{ fontSize: "18px", fontWeight: 600, color: "var(--content-gold)", margin: "1.75rem 0 0.9rem" }}
    >
      {children}
    </h3>
  );
}

export default function NoiDungPage() {
  return (
    <div className="content-theme">
      <SiteNav />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <header
        className="relative overflow-hidden text-center"
        style={{
          paddingTop: "132px",
          paddingBottom: "64px",
          borderBottom: "1px solid var(--content-hairline)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 85% 0%, rgba(193,18,31,0.16) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 5% 100%, rgba(232,185,35,0.09) 0%, transparent 60%)",
          }}
        />
        <div className="max-w-3xl mx-auto px-5 relative">
          <span
            className="inline-flex items-center gap-2.5 mb-7"
            style={{
              padding: "9px 22px",
              borderRadius: "999px",
              border: "1px solid rgba(232,185,35,0.4)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "var(--content-gold)",
            }}
          >
            <span aria-hidden>★</span> CHƯƠNG 4 · KINH TẾ CHÍNH TRỊ MÁC–LÊNIN <span aria-hidden>★</span>
          </span>

          <h1
            className="content-serif"
            style={{ fontSize: "clamp(32px, 5.6vw, 52px)", fontWeight: 700, lineHeight: 1.2 }}
          >
            <span style={{ color: "var(--content-text)" }}>Tư Bản Tài Chính &amp; Quyền Lực Mềm</span>
            <br />
            <span style={{ color: "var(--content-gold)" }}>Của Độc Quyền</span>
          </h1>

          <div
            aria-hidden
            className="mx-auto mt-6 mb-6"
            style={{ width: "72px", height: "3px", background: "var(--content-red)", borderRadius: "2px" }}
          />

          <p
            className="mx-auto"
            style={{ maxWidth: "620px", fontSize: "16px", lineHeight: 1.85, color: "var(--content-text-secondary)" }}
          >
            Từ lý luận của Lênin về sự hợp nhất ngân hàng – công nghiệp đến các hình thức chi phối hiện đại, và
            bài học bảo vệ lợi ích quốc gia cho kinh tế Việt Nam.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <a
              href="#phan-1"
              className="content-serif"
              style={{
                background: "var(--content-red)",
                color: "#fff",
                padding: "13px 28px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "14.5px",
                boxShadow: "0 10px 26px rgba(193,18,31,0.3)",
              }}
            >
              Đọc nội dung ↓
            </a>
            <Link
              href="/"
              className="content-serif inline-flex items-center gap-2"
              style={{
                border: "1.5px solid rgba(232,185,35,0.4)",
                color: "var(--content-gold)",
                padding: "13px 28px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "14.5px",
              }}
            >
              <PersonIcon /> Chơi trò mô phỏng
            </Link>
          </div>
        </div>
      </header>

      {/* ── Article body ──────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-5 pb-10">
        {/* PHẦN I */}
        <section id="phan-1" className="pt-14 scroll-mt-24">
          <SectionHeading
            number={1}
            title="Lý luận của Lênin về tư bản tài chính trong kỷ nguyên toàn cầu hóa"
          />

          <TermParagraph term="Sự hình thành tư bản tài chính.">
            Theo V.I. Lênin, tư bản tài chính là kết quả của sự hợp nhất giữa tư bản ngân hàng của một số ít ngân
            hàng độc quyền lớn nhất với tư bản của những liên minh độc quyền các nhà công nghiệp. Quá trình này bắt
            nguồn từ sự tích tụ và tập trung sản xuất, dẫn đến việc các ngân hàng không còn đơn thuần là trung gian
            thanh toán mà trở thành những thực thể quyền lực chi phối toàn bộ đời sống kinh tế.
          </TermParagraph>

          <SubHeading>Sự kết hợp Công nghiệp – Thương nghiệp – Ngân hàng trong toàn cầu hóa</SubHeading>
          <ItemList
            items={[
              {
                title: "Consortium & Conglomerate",
                desc:
                  "Hình thức độc quyền đa ngành (Consortium) thường do một ngân hàng lớn đứng đầu; tập đoàn đa ngành (Conglomerate) thâu tóm các xí nghiệp ở những lĩnh vực hoàn toàn khác nhau.",
              },
              {
                title: "Công ty Xuyên quốc gia (TNCs)",
                desc:
                  "Chủ thể chủ yếu trong đầu tư trực tiếp và xuất khẩu tư bản, tạo mạng lưới sản xuất – lưu thông toàn cầu.",
              },
              {
                title: "Liên minh nhân sự (Personal Union)",
                desc:
                  "Đại diện tập đoàn độc quyền tham gia bộ máy nhà nước và ngược lại, tạo hệ thống điều tiết thống nhất phục vụ lợi ích tài phiệt.",
              },
            ]}
          />
        </section>

        {/* PHẦN II */}
        <section id="phan-2" className="pt-14 scroll-mt-24">
          <SectionHeading
            number={2}
            title="Các hình thức tư bản tài chính hiện đại và sự chi phối đối với các nền kinh tế đang phát triển"
          />

          <SubHeading>Các hình thức chi phối mới</SubHeading>
          <ItemList
            items={[
              {
                title: "Thị trường chứng khoán & quỹ đầu tư",
                desc: "Chi phối qua hệ thống cổ phần, chứng khoán, quỹ đầu tư quốc tế.",
              },
              {
                title: "Fintech & Công nghệ",
                desc:
                  "Nền tảng tài chính công nghệ tạo kênh huy động, luân chuyển vốn mới vượt tầm kiểm soát truyền thống.",
              },
              {
                title: "Biên giới mềm (Soft Borders)",
                desc:
                  "Bành trướng qua \"biên giới kinh tế\" bằng đầu tư, công nghệ, tiêu chuẩn quốc tế thay vì chiếm hữu lãnh thổ.",
              },
            ]}
          />

          <SubHeading>Tác động đối với nước đang phát triển</SubHeading>
          <ItemList
            items={[
              {
                title: "Xuất khẩu tư bản thế hệ mới",
                desc:
                  "Kết hợp xuất khẩu hàng hóa và tư bản để chiếm đoạt giá trị thặng dư, lợi nhuận tại nước nhập khẩu.",
              },
              {
                title: "Áp lực hội nhập",
                desc:
                  "Buộc cải thiện hạ tầng, tay nghề, cơ cấu kinh tế để tiếp nhận vốn/công nghệ; nhưng mục đích tư bản chủ nghĩa vẫn phục vụ thiểu số, dễ dẫn tới phân hóa giàu nghèo sâu sắc.",
              },
            ]}
          />
        </section>

        {/* PHẦN III */}
        <section id="phan-3" className="pt-14 scroll-mt-24">
          <SectionHeading number={3} title="Cách ứng xử của Việt Nam và bài học bảo vệ lợi ích quốc gia" />

          <ItemList
            items={[
              {
                title: "Nắm vững quy luật toàn cầu hóa & khu vực hóa",
                desc: "Tham gia các liên minh, khối liên kết kinh tế khu vực là tất yếu.",
              },
              {
                title: "Vai trò điều tiết của Nhà nước",
                desc:
                  "Dùng thuế, ngân sách, hệ thống tiền tệ – tín dụng để bảo vệ nền kinh tế; Nhà nước dẫn dắt, định hướng các ngành then chốt.",
              },
              {
                title: "Xây dựng năng lực nội sinh",
                desc:
                  "Tận dụng mặt tích cực của độc quyền (thúc đẩy KHKT, tăng năng suất); khuyến khích tập đoàn nội địa đủ mạnh cạnh tranh với TNCs, tránh bị thâu tóm.",
              },
              {
                title: "Cảnh giác với \"Biên giới mềm\"",
                desc:
                  "Nhận diện chiến lược bành trướng núp bóng đầu tư để có chính sách bảo hộ và an ninh kinh tế phù hợp.",
              },
            ]}
          />
        </section>

        {/* KẾT LUẬN */}
        <section id="ket-luan" className="pt-14 pb-4 scroll-mt-24">
          <div
            style={{
              borderLeft: "3px solid var(--content-red)",
              paddingLeft: "24px",
            }}
          >
            <p className="content-eyebrow mb-3" style={{ color: "var(--content-red)" }}>
              Kết luận
            </p>
            <p
              className="content-serif"
              style={{ fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.85, color: "var(--content-text)" }}
            >
              Lý luận của Lênin về tư bản tài chính vẫn còn nguyên giá trị trong việc giải thích bản chất quyền lực
              kinh tế toàn cầu hiện nay. Việt Nam cần tận dụng mặt tích cực của độc quyền (sức mạnh kinh tế, tiến bộ
              kỹ thuật), đồng thời kiên quyết dùng công cụ quản lý nhà nước để hạn chế tác động tiêu cực, bảo vệ lợi
              ích quốc gia trong một thế giới đầy biến động.
            </p>
          </div>
        </section>

        <div className="content-rule mt-14 mb-8" style={{ width: "100%", opacity: 0.35 }} />
        <p className="text-center pb-8" style={{ fontSize: "12px", color: "var(--content-text-muted)" }}>
          Chương 4 · Kinh tế chính trị Mác–Lênin — tài liệu học tập nội bộ
        </p>
      </main>
    </div>
  );
}
