import "./globals.css";

export const metadata = {
  title: "게코섬 | GECKO ISLAND",
  description: "건강하고 매력적인 게코를 쉽고 편하게 만나는 게코 전문샵",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
