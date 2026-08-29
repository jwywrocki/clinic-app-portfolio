import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { createNewsService, createPagesService } from '@/services';

export async function POST(request: Request) {
  try {
    const pagesService = createPagesService();
    const newsService = createNewsService();

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clinic.jaqb.dev';

    const urls: Array<{ url: string; lastmod: string; changefreq: string; priority: string }> = [
      {
        url: baseUrl,
        lastmod: new Date().toISOString().slice(0, 10),
        changefreq: 'daily',
        priority: '1.0',
      },
      {
        url: `${baseUrl}/o-nas`,
        lastmod: new Date().toISOString().slice(0, 10),
        changefreq: 'monthly',
        priority: '0.8',
      },
      {
        url: `${baseUrl}/uslugi`,
        lastmod: new Date().toISOString().slice(0, 10),
        changefreq: 'weekly',
        priority: '0.9',
      },
      {
        url: `${baseUrl}/lekarze`,
        lastmod: new Date().toISOString().slice(0, 10),
        changefreq: 'weekly',
        priority: '0.8',
      },
      {
        url: `${baseUrl}/aktualnosci`,
        lastmod: new Date().toISOString().slice(0, 10),
        changefreq: 'daily',
        priority: '0.7',
      },
      {
        url: `${baseUrl}/kontakt`,
        lastmod: new Date().toISOString().slice(0, 10),
        changefreq: 'monthly',
        priority: '0.6',
      },
    ];

    try {
      // Add dynamic pages
      const pagesResult = await pagesService.getPublished();
      if (!pagesResult.isFailure()) {
        pagesResult.data.forEach(page => {
          urls.push({
            url: `${baseUrl}/${page.slug}`,
            lastmod: new Date(page.updated_at).toISOString().slice(0, 10),
            changefreq: 'monthly',
            priority: '0.5',
          });
        });
      }

      // Add news pages
      const newsResult = await newsService.getPublished();
      if (!newsResult.isFailure()) {
        newsResult.data.forEach(article => {
          urls.push({
            url: `${baseUrl}/aktualnosci/${article.id}`,
            lastmod: new Date(article.updated_at || article.created_at).toISOString().slice(0, 10),
            changefreq: 'monthly',
            priority: '0.4',
          });
        });
      }
    } catch (dbError) {
      console.error('Error fetching dynamic pages for sitemap:', dbError);
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ url, lastmod, changefreq, priority }) => `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    // Write to public/sitemap.xml
    const publicDir = path.join(process.cwd(), 'public');
    const sitemapPath = path.join(publicDir, 'sitemap.xml');

    try {
      // Ensure public directory exists
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      fs.writeFileSync(sitemapPath, sitemap, 'utf8');
      console.log('✅ Sitemap generated successfully at:', sitemapPath);

      return NextResponse.json({
        success: true,
        message: 'Sitemap generated successfully',
        path: '/sitemap.xml',
        urls: urls.length,
      });
    } catch (writeError) {
      console.error('❌ Error writing sitemap file:', writeError);
      console.error('Attempted path:', sitemapPath);
      console.error('Public dir exists:', fs.existsSync(publicDir));
      return NextResponse.json(
        {
          error: 'Nie udało się zapisać pliku sitemap',
          details: (writeError as Error).message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas generowania mapy witryny' },
      { status: 500 }
    );
  }
}
