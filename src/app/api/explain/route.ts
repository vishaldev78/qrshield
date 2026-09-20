/**
 * QRShield — Optional AI explanation endpoint (opt-in, off by default).
 *
 * Architecture rule: the deterministic security engine decides the score;
 * AI only translates existing findings into natural language. The AI is
 * never asked "is this dangerous?" and its answer never changes the verdict.
 *
 * Privacy: receives ONLY the URL + findings summary. No QR image, no history,
 * no identity. Findings are trimmed to short summaries before prompting.
 * 
 * This implementation uses local template-based generation - no external API calls.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ExplainSchema = z.object({
  url: z.string().min(1).max(2048),
  score: z.number().int().min(0).max(100),
  level: z.enum(["low", "suspicious", "high"]),
  findings: z
    .array(
      z.object({
        title: z.string().max(120),
        severity: z.enum(["low", "medium", "high"]),
        description: z.string().max(400),
      })
    )
    .max(14),
});

// Template-based explanations for each finding type
const FINDING_TEMPLATES: Record<string, (url: string) => string> = {
  "Brand impersonation": (url) => `This link appears to mimic a well-known brand's login or service page. Attackers often copy legitimate sites to steal credentials. Type the official address yourself instead of using this link.`,
  
  "URL shortener": (url) => `This link uses a URL shortening service which hides the true destination. Shortened links are commonly used to disguise malicious sites. Expand the link first using a preview service before visiting.`,
  
  "Suspicious TLD": (url) => `The domain uses a top-level extension often associated with spam or phishing campaigns. While not always malicious, exercise extra caution. Verify the site independently before entering any information.`,
  
  "Newly registered domain": (url) => `This domain was registered very recently. New domains are frequently used for phishing campaigns before being blocked. Be especially cautious with links to newly created sites.`,
  
  "IP address in URL": (url) => `The link points directly to an IP address rather than a domain name. Legitimate services rarely use bare IP addresses for customer-facing pages. This is a strong indicator of a phishing attempt.`,
  
  "Excessive subdomains": (url) => `This URL contains an unusual number of subdomains, a technique used to make the address look familiar while hiding the real destination. Check the actual domain (the last two parts) before trusting the link.`,
  
  "Homograph attack": (url) => `The domain uses characters that look like familiar letters but are actually different Unicode characters. This visual deception tricks users into thinking they're on a legitimate site. Type addresses manually.`,
  
  "Credential harvesting": (url) => `This page appears designed to collect login credentials or personal information. Legitimate companies don't ask for passwords via QR code links. Never enter credentials on pages reached through QR codes.`,
  
  "Suspicious redirect chain": (url) => `This link redirects through multiple intermediate URLs before reaching the final destination. Redirect chains are often used to evade security filters and hide malicious endpoints. Avoid following such links.`,
  
  "Known phishing pattern": (url) => `This URL matches patterns commonly used in phishing attacks. The structure resembles known malicious campaigns. Do not enter any personal information on this site.`,
  
  "Typosquatting": (url) => `The domain name closely resembles a popular site but with slight variations (extra letters, missing characters, etc.). This is a classic technique to catch users who mistype or glance quickly. Double-check the spelling.`,
  
  "Suspicious path": (url) => `The URL path contains unusual patterns like random strings, encoded data, or paths mimicking legitimate login pages. These are often indicators of automated phishing kits. Avoid accessing this link.`,
  
  "Missing HTTPS": (url) => `This link uses HTTP instead of HTTPS, meaning the connection is not encrypted. Any data you enter could be intercepted. Never submit sensitive information on unencrypted pages.`,
  
  "Generic finding": (url) => `This link shows characteristics that warrant caution. While not definitively malicious, the detected signals suggest it could be used for phishing or fraud. Verify through official channels before proceeding.`,
  
  "High entropy domain": (url) => `The domain name appears randomly generated with high character variation, which is typical of algorithmically created phishing domains. Legitimate businesses rarely use such domain patterns.`,
  
  "Suspicious query parameters": (url) => `The URL contains unusual query parameters that may be used for tracking, session hijacking, or payload delivery. Be cautious of links with long, encoded, or obfuscated parameters.`,
  
  "No risk indicators detected": (url) => `No specific risk indicators were found in this URL. However, always verify the destination independently, especially for links from QR codes. When in doubt, type the address manually.`,
};

function generateExplanation(url: string, level: string, findings: Array<{ title: string; severity: string; description: string }>): string {
  if (findings.length === 0) {
    return FINDING_TEMPLATES["No risk indicators detected"](url);
  }

  // Sort findings by severity (high first)
  const sortedFindings = [...findings].sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  // Take top 3 most severe findings
  const topFindings = sortedFindings.slice(0, 3);

  // Generate explanations for each finding
  const explanations = topFindings.map((f) => {
    const template = FINDING_TEMPLATES[f.title] || FINDING_TEMPLATES["Generic finding"];
    return template(url);
  });

  // Combine into a coherent paragraph
  const levelText = level === "high" ? "high risk" : level === "suspicious" ? "suspicious" : "low risk";
  const intro = `This QR code leads to a ${levelText} destination. `;
  
  return intro + explanations.join(" ") + " When in doubt, visit the official website directly by typing the address.";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ExplainSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { url, score, level, findings } = parsed.data;

  try {
    const explanation = generateExplanation(url, level, findings);
    
    return NextResponse.json({ explanation });
  } catch (err) {
    console.error("[/api/explain] Explanation generation failed:", err);
    return NextResponse.json(
      { error: "Explanation service is temporarily unavailable." },
      { status: 502 }
    );
  }
}