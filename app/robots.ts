import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xn----8sba3adk3a1a.xn--p1ai';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/admin/'] },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
