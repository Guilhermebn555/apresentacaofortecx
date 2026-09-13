import Script from 'next/script';

export default function PresentationPage() {
  return (
    <>
<header><a className="brand" href="#1"><span className="brand-icon">E<span>↗</span></span> EXPOTEC<span className="year">2026</span></a><span className="school">ESCOLA TÉCNICA FORTEC <b>/</b> TIN3A</span><div className="header-actions"><button id="theme-toggle" className="quiet" aria-label="Ativar modo claro" aria-pressed="true"><b className="theme-icon" aria-hidden="true">☀</b><span>Modo claro</span></button><button id="fullscreen" className="quiet" aria-label="Entrar em tela cheia">⛶ <span>Tela cheia</span></button></div></header>
<main><aside><span className="eyebrow">APRESENTAÇÃO</span><nav id="nav" aria-label="Slides"></nav><div className="aside-bottom">RELATÓRIO DO PROJETO<br /><span>Planejamento & preparação</span></div></aside><div id="stage" aria-live="polite"></div></main>
<footer><span id="chapter">01 / VISÃO GERAL</span><div id="dots" aria-label="Progresso dos slides"></div><div className="pagination"><span id="count">01 <i>/ 09</i></span><button id="prev" aria-label="Slide anterior">←</button><button id="next" aria-label="Próximo slide">→</button></div></footer>

      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
