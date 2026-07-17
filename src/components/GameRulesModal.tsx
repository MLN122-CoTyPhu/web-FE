"use client";

// Shared rules modal — used both in the room page (via the "📖 Luật chơi"
// button in the top bar, available any time during a match) and on the home
// page (so players can read the rules BEFORE creating/joining a room, not
// just once they're already inside a game).

// Windows renders the 🇻🇳 flag emoji as raw "VN" letters (no flag glyph in the
// default font), while 💰/🌏 render fine everywhere. Draw the flag as inline
// SVG instead so the "Việt Nam" role always shows an actual flag icon.
function VietnamFlagIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * (2 / 3)}
      viewBox="0 0 30 20"
      style={{ display: "block", borderRadius: 2, boxShadow: "0 0 0 1px rgba(0,0,0,0.25)" }}
    >
      <rect width="30" height="20" fill="#DA251D" />
      <polygon
        points="15,3 16.65,7.74 21.66,7.84 17.66,10.87 19.11,15.66 15,12.8 10.89,15.66 8.34,10.87 8.34,7.84 13.35,7.74"
        fill="#FFCD00"
      />
    </svg>
  );
}

// Stroke-based SVGs (instead of 💰⭐🏛️ emoji, which render inconsistently
// across platforms) so the icon set looks coherent everywhere.
function MoneyIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "-1.5px", flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.6v6.8M9.9 6.2c0-.85-.85-1.5-1.9-1.5s-1.9.58-1.9 1.4c0 .78.68 1.05 1.9 1.35c1.22.3 1.9.62 1.9 1.4c0 .85-.85 1.4-1.9 1.4s-1.9-.55-1.9-1.45"
        stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function AutonomyIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "-1.5px", flexShrink: 0 }}>
      <path d="M8 1.4l5.3 1.9v3.7c0 3.5-2.2 6.1-5.3 7c-3.1-.9-5.3-3.5-5.3-7V3.3z"
        stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
function PowerIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={{ display: "inline-block", verticalAlign: "-1.5px", flexShrink: 0 }}>
      <path d="M8 1.1l1.98 4.26 4.6.54-3.44 3.18.92 4.56L8 11.5l-4.06 2.14.92-4.56-3.44-3.18 4.6-.54z" />
    </svg>
  );
}

export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[250] p-4"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="animate-modal-entrance w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #241a14 0%, #17100e 100%)",
          border: "1.5px solid rgba(232,185,35,0.3)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 28px 80px rgba(0,0,0,0.9)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(232,185,35,0.15)" }}>
          <div>
            <h2 className="text-gold-static font-bold text-xl" style={{ fontFamily: "var(--font-display)" }}>
              📖 Luật Chơi
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Cờ Tỷ Phú Toàn Cầu — Chương 4 Mác-Lênin
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all text-sm"
            style={{ background: "rgba(255,255,255,0.07)", color: "var(--text-secondary)" }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5 text-sm" style={{ color: "var(--text-secondary)" }}>

          {/* Điểm số */}
          <section>
            <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              🏆 Điểm Số
            </h3>
            <div className="rounded-xl px-4 py-3 text-center" style={{ background: "rgba(232,185,35,0.07)", border: "1px solid rgba(232,185,35,0.2)" }}>
              <p className="font-bold text-base" style={{ color: "var(--gold-400)", fontFamily: "var(--font-code)" }}>
                Điểm = Tiền + Giá trị tài sản đã thâu tóm + Tự chủ×10 + Quyền lực mềm×5
              </p>
              <p className="text-xs mt-1.5" style={{ color: "rgba(232,185,35,0.6)" }}>
                Tự chủ = 0 → thua ngay lập tức, dù nhiều tiền/tài sản nhất
              </p>
              <p className="text-[11px] mt-1.5 border-t border-dashed border-[rgba(255,23,68,0.3)] pt-1.5" style={{ color: "#FF6B7A" }}>
                ⚠️ <strong>Thâm hụt tài chính &amp; Vỡ nợ</strong>: Khi bị trừ tiền mặt vượt quá số dư hiện có (trả phí thuê, phạt quiz, thẻ sự kiện...), phần thâm hụt sẽ tự động quy đổi thành giảm Tự chủ kinh tế với tỷ lệ <strong>$10 thâm hụt = -1 Tự chủ</strong>.
              </p>
            </div>
          </section>

          {/* 3 Vai */}
          <section>
            <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              👥 3 Vai Chơi
            </h3>
            <div className="space-y-2">
              {[
                { icon: "💰", name: "Tư bản tài chính", money: "$2.700", auto: "45", sp: "60",
                  note: "Phí thuê 50%. Trên ô Đỏ/Cam: nhận lợi thay vì mất. Trên ô TNC: nhận 50% giá trị. Là chủ nợ Consortium → nhận cổ tức." },
                { icon: <VietnamFlagIcon size={18} />, name: "Việt Nam", money: "$1.900", auto: "80", sp: "65",
                  note: "Phí thuê 60%. Trên ô Đỏ: giảm 50% tác động xấu. Trên ô TNC: giảm 30%. Rút thẻ Chính sách (toàn tốt) tại ô Việt Nam." },
                { icon: "🌏", name: "Nước đang phát triển", money: "$1.600", auto: "85", sp: "45",
                  note: "Tự chủ cao nhất nhưng phí thuê 100%. Chịu đầy đủ tác động tiêu cực từ ô Đỏ/TNC. Khủng hoảng: thêm −5 Tự chủ." },
              ].map(r => (
                <div key={r.name} className="rounded-xl px-3 py-2.5 flex gap-3 items-start"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{r.icon}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{r.name}</div>
                    <div className="text-xs mt-0.5 flex gap-3">
                      <span className="inline-flex items-center gap-1" style={{ color: "#00E676" }}><MoneyIcon size={12} /> {r.money}</span>
                      <span className="inline-flex items-center gap-1" style={{ color: "#42A5F5" }}><AutonomyIcon size={12} /> {r.auto}</span>
                      <span className="inline-flex items-center gap-1" style={{ color: "#CE93D8" }}><PowerIcon size={12} /> {r.sp}</span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: "rgba(139,163,204,0.75)" }}>{r.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quy trình lượt */}
          <section>
            <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              🎲 Quy Trình Một Lượt
            </h3>
            <div className="space-y-1.5">
              {[
                ["1",  "Tung xúc xắc",        'Nhấn nút "Tung Xúc Xắc". Nếu đang bị chi phối: bấm bỏ lượt.'],
                ["2",  "Di chuyển",            "Bấm vào biểu tượng đang nhảy để quân cờ đi từng bước đến ô đích."],
                ["3",  "Xử lý ô đến",          "Ô sở hữu được: quiz để mua (chưa chủ) hoặc trả phí thuê (có chủ). Ô khác: hiệu ứng/thẻ/vote như thường."],
                ["4a", "Đọc thông tin ô",      'Modal thông tin ô hiện ra, bấm "Đã hiểu ✓" để tiếp tục.'],
                ["4b", "Trả lời quiz / đọc thẻ", '(Tuỳ ô) Trả lời câu hỏi thâu tóm, hoặc đọc thẻ sự kiện, bấm "Đã hiểu ✓".'],
                ["5",  "Kết thúc lượt",        'Bấm "Kết Thúc Lượt" để chuyển sang người tiếp theo.'],
              ].map(([step, title, desc]) => (
                <div key={step} className="flex gap-3 items-start px-3 py-2 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{ background: "rgba(232,185,35,0.15)", color: "var(--gold-400)" }}>
                    {step}
                  </span>
                  <div>
                    <div className="font-semibold text-xs" style={{ color: "var(--text-primary)" }}>{title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(139,163,204,0.7)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Loại ô */}
          <section>
            <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              🗺️ Các Loại Ô
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ["#a02820", "🔴 Tư bản tài chính (×9, sở hữu được)", "Chưa chủ: quiz để mua. Có chủ: trả phí thuê."],
                ["#b0621a", "🟠 Tập đoàn (×4, sở hữu được)", "Chưa chủ: quiz để mua. Có chủ: trả phí thuê."],
                ["#7a3d94", "🟣 Consortium (×5)", "Vote tập thể. Tư bản TC nhận cổ tức."],
                ["#2f5f95", "🔵 TNC — Công ty xuyên QG (×8, sở hữu được)", "Chưa chủ: quiz để mua. Có chủ: trả phí thuê."],
                ["#1f7a45", "🟢 Việt Nam (×8)", "Vai Việt Nam: rút thẻ tốt. Vai khác: không có hiệu ứng."],
                ["#8a1a12", "⚫ Khủng hoảng (×3)", "Tất cả mất 10% tiền hiện có. ĐPT: thêm −5 Tự chủ."],
                ["#d4af1f", "⭐ Xuất phát (ô 0)", "Đi qua → nhận +$200."],
                ["#5a6474", "⬜ Tự do (ô 10) / Cơ hội (ô 39)", "Tự do: không có gì. Cơ hội: rút thẻ ngẫu nhiên."],
              ].map(([color, label, desc]) => (
                <div key={label} className="rounded-lg px-2.5 py-2"
                  style={{ background: "rgba(255,255,255,0.03)", borderLeft: `3px solid ${color}` }}>
                  <div className="font-semibold text-xs" style={{ color: "var(--text-primary)" }}>{label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(139,163,204,0.65)" }}>{desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Thâu tóm & Phí thuê */}
          <section>
            <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              🏭 Thâu Tóm &amp; Phí Thuê (Ô Đỏ/Cam/Xanh Dương)
            </h3>
            <div className="rounded-xl px-3 py-2.5 text-xs space-y-1.5"
              style={{ background: "rgba(232,185,35,0.06)", border: "1px solid rgba(232,185,35,0.2)" }}>
              <p style={{ color: "var(--text-primary)" }}>21 ô (Tư bản tài chính / Tập đoàn / TNC) có thể mua được:</p>
              <p>• <strong style={{ color: "var(--gold-300)" }}>Chưa có chủ</strong> → hiện câu hỏi kiến thức Chương 4. Trả lời đúng + đủ tiền + Sức mạnh ≥ 50 → <strong style={{ color: "#40E090" }}>thâu tóm</strong> ô đó.</p>
              <p>• Trả lời <strong style={{ color: "#40E090" }}>đúng nhưng thiếu điều kiện</strong> (không đủ tiền hoặc Sức mạnh &lt; 50) → vẫn ghi nhận hiểu biết: <strong style={{ color: "#42A5F5" }}>+5 Tự chủ</strong>.</p>
              <p>• Trả lời <strong style={{ color: "#FF6B7A" }}>sai</strong> hoặc <strong style={{ color: "#FF6B7A" }}>hết giờ</strong> → mất $30 chi phí cơ hội và −10 Tự chủ.</p>
              <p>• <strong style={{ color: "#FF6B7A" }}>Đã có chủ</strong> (người khác) → tự động trả <strong>phí thuê</strong> + <strong>−5 Tự chủ</strong> (lệ thuộc kinh tế).</p>
              <p>• Phí thuê tuỳ vai: <strong style={{ color: "#70B8FF" }}>Tư bản TC 50%</strong> · <strong style={{ color: "#40E090" }}>Việt Nam 60%</strong> · <strong style={{ color: "#FFAB40" }}>Nước ĐPT 100%</strong>.</p>
              <p>• Dẫm vào ô của chính mình → miễn phí.</p>
              <p>• Giá trị các ô đã thâu tóm được cộng vào điểm cuối game.</p>
            </div>
          </section>

          {/* Ô 30 + Kết thúc */}
          <section>
            <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              ⚠️ Ô Nguy Hiểm &amp; Kết Thúc Game
            </h3>
            <div className="space-y-2">
              <div className="rounded-xl px-3 py-2.5"
                style={{ background: "rgba(255,23,68,0.08)", border: "1px solid rgba(255,23,68,0.25)" }}>
                <div className="font-bold text-xs" style={{ color: "#FF6B7A" }}>🚧 Ô 30 — Đình Trệ Sản Xuất</div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,107,122,0.8)" }}>
                  −10% tiền mặt &nbsp;·&nbsp; −30 Tự chủ (ĐPT: −35) &nbsp;·&nbsp; −20 Sức mạnh &nbsp;·&nbsp; 2 lượt không thu phí thuê / không thâu tóm ô mới (vẫn di chuyển và biểu quyết)
                </div>
              </div>
              <div className="rounded-xl px-3 py-2.5"
                style={{ background: "rgba(255,23,68,0.06)", border: "1px solid rgba(255,23,68,0.2)" }}>
                <div className="font-bold text-xs" style={{ color: "#FF6B7A" }}>💀 Kết thúc game</div>
                <div className="text-xs mt-1" style={{ color: "rgba(139,163,204,0.75)" }}>
                  Trò chơi kết thúc ngay khi đạt tối đa <strong>50 lượt chơi</strong> hoặc khi Tự chủ của bất kỳ ai về 0.
                  Bảng xếp hạng tự động hiện — người điểm cao nhất thắng.
                </div>
              </div>
            </div>
          </section>

          {/* Biểu quyết */}
          <section>
            <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              🗳️ Hội Đồng Biểu Quyết (Ô Tím)
            </h3>
            <div className="rounded-xl px-3 py-2.5 text-xs space-y-1"
              style={{ background: "rgba(180,79,255,0.07)", border: "1px solid rgba(180,79,255,0.2)" }}>
              <p style={{ color: "var(--text-primary)" }}>Khi người không phải Tư bản TC đến ô Consortium:</p>
              <p>• Tất cả người chơi cùng vote <strong style={{ color: "#00E676" }}>Chấp nhận</strong> hoặc <strong style={{ color: "#FF6B7A" }}>Từ chối</strong></p>
              <p>• Đa số quyết định → hiệu ứng áp lên người đến ô đó</p>
              <p>• Tư bản TC không vote — nhận cổ tức +$80, +10 Quyền lực mềm</p>
              <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(180,79,255,0.2)" }}>
                <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>5 ô Consortium:</p>
                {[
                  ["5 — Oil Consortium", "Chấp nhận: +$300, −15 TC / Từ chối: +10 TC, +10 SP"],
                  ["13 — Tech Alliance", "Chấp nhận: +$160, −10 TC, −5 SP / Từ chối: +15 TC, +5 SP"],
                  ["17 — Banking Syndicate", "Chấp nhận: +$400, −25 TC / Từ chối: +20 TC, +5 SP"],
                  ["20 — Hội đồng Tư vấn", "Chấp nhận: +$200, −20 TC, −10 SP / Từ chối: +15 TC, +15 SP"],
                  ["26 — WTO", "Chấp nhận: +$300, −10 TC, +5 SP / Từ chối: +10 TC"],
                ].map(([o, e]) => (
                  <div key={o} className="flex gap-2 py-0.5">
                    <span className="flex-shrink-0 font-semibold" style={{ color: "#B44FFF", minWidth: 140 }}>{o}</span>
                    <span style={{ color: "rgba(139,163,204,0.7)" }}>{e}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-3 flex justify-end"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onClose} className="btn-gold px-6 py-2 text-sm">
            Đã hiểu ✓
          </button>
        </div>
      </div>
    </div>
  );
}
