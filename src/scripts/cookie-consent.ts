// Cookie-Consent-Logik – kein alert(), kein console.log in Produktion

export type ConsentLevel = 'all' | 'essential' | 'custom' | null;

export function getConsent(): ConsentLevel {
  try {
    return (localStorage.getItem('cookieConsent') as ConsentLevel) ?? null;
  } catch {
    return null;
  }
}

export function setConsent(level: ConsentLevel, analytics: boolean, marketing: boolean): void {
  try {
    localStorage.setItem('cookieConsent', level ?? '');
    localStorage.setItem('analyticsCookies', String(analytics));
    localStorage.setItem('marketingCookies', String(marketing));
  } catch {
    // Private Browsing – Einstellung gilt nur für diese Session
    sessionStorage.setItem('cookieConsent', level ?? '');
    sessionStorage.setItem('analyticsCookies', String(analytics));
    sessionStorage.setItem('marketingCookies', String(marketing));
  }
}

export function getSetting(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function acceptAll(): void {
  setConsent('all', true, true);
  triggerAnalytics();
  triggerAds(true);
  hideBanner();
}

export function acceptEssential(): void {
  setConsent('essential', false, false);
  hideBanner();
}

export function saveCustom(analytics: boolean, marketing: boolean): void {
  setConsent('custom', analytics, marketing);
  if (analytics) triggerAnalytics();
  triggerAds(marketing);
  hideBanner();
}

function hideBanner(): void {
  document.getElementById('cookie-banner')?.remove();
}

function triggerAnalytics(): void {
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('config', 'G-6NSYG8B1T9', { anonymize_ip: true });
  }
}

export function triggerAds(personalized: boolean): void {
  // AdSense-Skript laden falls noch nicht vorhanden
  if (!document.querySelector('script[src*="adsbygoogle"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8687929894744033';
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }

  // Ad-Container einblenden
  document.querySelectorAll<HTMLElement>('.ad-container').forEach(el => {
    el.style.display = 'block';
  });

  // Ads initialisieren
  setTimeout(() => {
    const adsbygoogle: any[] = (window as any).adsbygoogle || [];
    (window as any).adsbygoogle = adsbygoogle;
    document.querySelectorAll<HTMLElement>('.adsbygoogle:not([data-ad-status])').forEach(ad => {
      if (!personalized) ad.setAttribute('data-npa', '1');
      adsbygoogle.push({});
    });
  }, 800);
}

// Banner nur zeigen wenn noch kein Consent gesetzt; ansonsten Dienste direkt laden
export function initCookieBanner(): void {
  if (!getConsent()) {
    document.getElementById('cookie-banner')?.classList.add('show');
  } else {
    if (getSetting('analyticsCookies') === 'true') triggerAnalytics();
    triggerAds(getSetting('marketingCookies') === 'true');
  }
}
