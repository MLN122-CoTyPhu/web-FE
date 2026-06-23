# co-ty-phu — Web (Frontend)

Next.js frontend cho **Cờ Tỷ Phú Toàn Cầu** — board game học thuật về Tư bản Tài chính & Quyền lực Mềm.

> Repo này là frontend. Backend ở repo `socket-server-BE-` trong org `MLN122-CoTyphu`.

## Yêu cầu

- Node.js >= 18
- npm >= 9

## Chạy local

### 1. Clone & cài dependencies

```bash
git clone git@github.com:MLN122-CoTyphu/web-FE.git
cd web-FE
npm install
```

### 2. Tạo file .env.local

```bash
cp env.example .env.local
```

Mở `.env.local` và điền giá trị thực (nhận từ team lead):

```
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

> Đảm bảo socket server (`co-ty-phu-socket-server`) đang chạy ở port 4000 trước.

### 3. Chạy dev

```bash
npm run dev
```

Web chạy tại: `http://localhost:3000`

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run build` | Build production |
| `npm start` | Chạy production build |
| `npm run lint` | Kiểm tra ESLint |

## Deploy lên Vercel

1. Vào [vercel.com](https://vercel.com) → **Import Project** → chọn repo này
2. **Root Directory**: để trống (root của repo này)
3. Thêm **Environment Variables** trên Vercel dashboard:

```
NEXT_PUBLIC_SOCKET_URL=https://<your-socket>.railway.app
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Cấu trúc

```
src/
├── app/
│   ├── page.tsx              ← trang chủ (tạo phòng / vào phòng)
│   ├── room/[id]/page.tsx    ← trang chơi game
│   ├── layout.tsx
│   └── globals.css
├── hooks/
│   └── useGameSocket.ts      ← Socket.io client hook
├── data/
│   └── boardData.ts          ← dữ liệu 40 ô bàn cờ + thẻ sự kiện
├── types/
│   └── game.ts               ← TypeScript interfaces
└── lib/
    └── supabase.ts           ← Supabase client
```

## Luật chơi

- **3 chỉ số**: Tiền 💰 | Tự chủ 🏛️ | Quyền lực mềm ⭐
- **Tính điểm**: `Điểm = Tiền + Tự chủ×10 + Sức mạnh×5`
- **Thắng**: Điểm cao nhất khi game kết thúc
- **Thua ngay**: Tự chủ về 0
