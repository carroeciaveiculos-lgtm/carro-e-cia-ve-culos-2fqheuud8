export function validateSeoContent(html: string, metaDescription: string) {
  const checks = [];
  let passed = true;

  const h1Match = html.match(/<h1[^>]*>.*?<\/h1>/gi);
  const hasH1 = h1Match && h1Match.length === 1;
  checks.push({
    name: 'H1 Tag',
    passed: hasH1,
    detail: hasH1 ? '1 H1 tag found' : 'Must have exactly 1 H1 tag',
  });
  if (!hasH1) passed = false;

  const metaValid = !!metaDescription && metaDescription.length >= 120 && metaDescription.length <= 160;
  checks.push({
    name: 'Meta Description Length',
    passed: metaValid,
    detail: metaValid ? `${metaDescription.length} chars` : 'Should be 120-160 chars',
  });
  if (!metaValid) passed = false;

  return { passed, checks };
}
