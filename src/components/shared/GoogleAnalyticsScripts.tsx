import Script from "next/script";

const rawGaId = process.env.NEXT_PUBLIC_GA_ID?.toUpperCase();
const gaId = rawGaId?.match(/^G-[A-Z0-9]+$/) ? rawGaId : undefined;

export function GoogleAnalyticsScripts() {
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
      </Script>
    </>
  );
}
