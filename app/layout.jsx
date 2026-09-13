export const metadata = {
  title: "ExpoTec 2026 — Automação residencial",
  description: "Varal e portão automáticos: apresentação interativa do projeto da turma TIN3A, Escola Técnica Fortec.",
  icons: { icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230d211e'/%3E%3Cpath d='M7 24V8h18v16M12 8v16M20 8v16' stroke='%23bafa68' stroke-width='2' fill='none'/%3E%3C/svg%3E" },
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{document.documentElement.dataset.theme=localStorage.getItem(\"expotec-theme\")||\"dark\"}catch{}" }} />
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
