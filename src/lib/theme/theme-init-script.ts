/**
 * Blocking inline script to prevent FOUC (Flash of Unstyled Content).
 * Injected via next/script strategy="beforeInteractive" in layouts.
 * Must NOT be in a "use client" module — server components need the raw string at build time.
 */
export const themeInitScript = `try{var t=localStorage.getItem('theme')||'system';var d=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.classList.add(d);document.documentElement.style.colorScheme=d;}catch(e){}`;
