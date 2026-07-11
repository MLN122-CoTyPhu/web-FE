"use client";

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      style={{
        animation: spinning ? "spin-slow 0.8s linear infinite" : "none",
      }}
    >
      <path
        d="M13.5 8a5.5 5.5 0 1 1-1.6-3.87"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.5 2.5v3.2h-3.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function RefreshButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title="Tải lại"
      aria-label="Tải lại"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
      style={{
        fontFamily: "var(--font-ui)",
        color: "var(--gold-400)",
        background: "rgba(232,185,35,0.08)",
        border: "1.5px solid rgba(232,185,35,0.3)",
        opacity: loading ? 0.6 : 1,
        cursor: loading ? "default" : "pointer",
      }}
      onMouseEnter={e => {
        if (loading) return;
        e.currentTarget.style.background = "rgba(232,185,35,0.16)";
        e.currentTarget.style.borderColor = "rgba(232,185,35,0.5)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "rgba(232,185,35,0.08)";
        e.currentTarget.style.borderColor = "rgba(232,185,35,0.3)";
      }}
    >
      <RefreshIcon spinning={!!loading} />
      {loading ? "Đang tải..." : "Tải lại"}
    </button>
  );
}
