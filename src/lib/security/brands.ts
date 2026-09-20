/**
 * QRShield — Brand registry for impersonation detection.
 *
 * Strategy (defensible, unlike naive `host.includes("paypal")`):
 *  1. Leet-decode the hostname (paypa1 → paypal).
 *  2. Match brand tokens against hostname label tokens (exact token match,
 *     or substring only for tokens ≥ 5 chars to avoid praxis/axis false hits).
 *  3. Compare the *registrable domain* (eTLD+1) against the brand's official
 *     domains — legitimate subdomains of official domains never flag.
 */

export interface Brand {
  name: string;
  /** lowercase brand token used for matching */
  token: string;
  officialDomains: string[];
}

export const BRANDS: Brand[] = [
  { name: "PayPal", token: "paypal", officialDomains: ["paypal.com", "paypal.me"] },
  { name: "Google", token: "google", officialDomains: ["google.com", "googleapis.com", "googleusercontent.com", "gstatic.com"] },
  { name: "Gmail", token: "gmail", officialDomains: ["gmail.com", "google.com"] },
  { name: "YouTube", token: "youtube", officialDomains: ["youtube.com", "youtu.be"] },
  { name: "Facebook", token: "facebook", officialDomains: ["facebook.com", "fb.com"] },
  { name: "Instagram", token: "instagram", officialDomains: ["instagram.com"] },
  { name: "WhatsApp", token: "whatsapp", officialDomains: ["whatsapp.com"] },
  { name: "Amazon", token: "amazon", officialDomains: ["amazon.com", "amazon.in", "amazon.co.uk", "amazonpay.in"] },
  { name: "Apple", token: "apple", officialDomains: ["apple.com", "icloud.com"] },
  { name: "Microsoft", token: "microsoft", officialDomains: ["microsoft.com", "live.com", "office.com", "outlook.com"] },
  { name: "Netflix", token: "netflix", officialDomains: ["netflix.com"] },
  { name: "LinkedIn", token: "linkedin", officialDomains: ["linkedin.com", "lnkd.in"] },
  { name: "Telegram", token: "telegram", officialDomains: ["telegram.org", "t.me"] },
  { name: "Paytm", token: "paytm", officialDomains: ["paytm.com"] },
  { name: "PhonePe", token: "phonepe", officialDomains: ["phonepe.com"] },
  { name: "HDFC Bank", token: "hdfc", officialDomains: ["hdfcbank.com"] },
  { name: "ICICI Bank", token: "icici", officialDomains: ["icicibank.com"] },
  { name: "Axis Bank", token: "axisbank", officialDomains: ["axisbank.com"] },
  { name: "Kotak Bank", token: "kotak", officialDomains: ["kotak.com"] },
  { name: "State Bank of India", token: "statebank", officialDomains: ["sbi.co.in", "onlinesbi.sbi"] },
  { name: "Flipkart", token: "flipkart", officialDomains: ["flipkart.com"] },
  { name: "Myntra", token: "myntra", officialDomains: ["myntra.com"] },
  { name: "IRCTC", token: "irctc", officialDomains: ["irctc.co.in"] },
  { name: "Aadhaar / UIDAI", token: "uidai", officialDomains: ["uidai.gov.in", "aadhaar.gov.in"] },
  { name: "Steam", token: "steam", officialDomains: ["steampowered.com", "steamcommunity.com"] },
  { name: "Dropbox", token: "dropbox", officialDomains: ["dropbox.com"] },
  { name: "DHL", token: "dhl", officialDomains: ["dhl.com", "dhl.de"] },
  { name: "FedEx", token: "fedex", officialDomains: ["fedex.com"] },
];

/**
 * Returns the brand that the hostname appears to impersonate, or null.
 * `registrable` must already be extracted (eTLD+1).
 */
export function detectBrandImpersonation(
  decodedHost: string,
  tokens: string[],
  registrable: string
): Brand | null {
  const reg = registrable.toLowerCase();

  for (const brand of BRANDS) {
    // Never flag an official domain or its subdomains.
    const isOfficial = brand.officialDomains.some(
      (d) => reg === d || reg.endsWith(`.${d}`)
    );
    if (isOfficial) continue;

    const hit = tokens.some((t) => {
      if (t === brand.token) return true;
      // substring match only for longer brand tokens (≥5 chars)
      return brand.token.length >= 5 && t.length >= brand.token.length && t.includes(brand.token);
    });
    if (hit) return brand;
  }
  return null;
}
