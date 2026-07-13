import type { Metadata } from "next";
import { Hanken_Grotesk, Newsreader, Space_Mono } from "next/font/google";
import "./globals.css";

// "Papel": Newsreader (serif — títulos/números), Hanken Grotesk (UI/corpo),
// Space Mono (timers/labels).
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-newsreader",
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Study Better",
  description: "Organize seus estudos com ciclos personalizados",
};

// Aplica o tema salvo antes da pintura, evitando flash. Escuro é o padrão
// (sem classe); apenas o tema claro adiciona a classe `.light`.
const themeScript = `(function(){try{if(localStorage.getItem('sb-theme')==='light'){document.documentElement.classList.add('light');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${newsreader.variable} ${hankenGrotesk.variable} ${spaceMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-bg font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
