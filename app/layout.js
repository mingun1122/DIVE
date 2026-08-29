import "./globals.css";

export const metadata = {
  title: "게코리움 | GECKORIUM",
  description: "특별한 게코를 만나고, 건강한 사육 정보를 확인하는 게코 전문샵 게코리움",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
