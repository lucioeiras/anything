export type ResolvedMetadata =
  | { type: 'youtube'; url: string; title: string; thumbnail: string }
  | {
      type: 'reddit';
      url: string;
      subreddit: string;
      subredditAvatar: string;
      title: string;
      text?: string;
      image?: string;
    }
  | {
      type: 'article';
      url: string;
      title: string;
      origin: string;
      thumbnail: string;
    }
  | {
      type: 'link';
      url: string;
      siteTitle: string;
      description: string;
      favicon: string;
    };

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

function extractMeta(html: string, propertyOrName: string): string | null {
  const regex = new RegExp(
    `<meta\\s+[^>]*(?:property|name)=["']${propertyOrName}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const match = html.match(regex);
  if (match) return decodeHtmlEntities(match[1].trim());

  const reverseRegex = new RegExp(
    `<meta\\s+[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${propertyOrName}["']`,
    'i'
  );
  const reverseMatch = html.match(reverseRegex);
  if (reverseMatch) return decodeHtmlEntities(reverseMatch[1].trim());

  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

function extractFavicon(html: string, baseUrl: string): string | null {
  const match = html.match(
    /<link\s+[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']+)["']/i
  );
  if (match) {
    const href = match[1].trim();
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return href;
    }
  }
  return null;
}

/**
 * Resolves metadata for a given URL and determines whether it should be
 * saved as a YouTube video, Reddit post, Article, or generic Link.
 */
export async function resolveUrlMetadata(inputUrl: string): Promise<ResolvedMetadata> {
  const url = normalizeUrl(inputUrl);

  let hostname = '';
  let pathname = '';
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname.toLowerCase();
    pathname = parsed.pathname;
  } catch {
    // If URL parsing fails, fallback to simple link
    return {
      type: 'link',
      url,
      siteTitle: url,
      description: '',
      favicon: 'https://www.google.com/s2/favicons?domain=example.com&sz=128',
    };
  }

  // 1. YouTube Detection
  if (/(?:youtube\.com|youtu\.be)/i.test(hostname)) {
    const videoIdMatch = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|v\/))([a-zA-Z0-9_-]{11})/i
    );
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    let title = 'YouTube Video';
    let thumbnail = videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : 'https://www.youtube.com/img/desktop/yt_1200.png';

    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      );
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        if (data.title) title = data.title;
        if (data.thumbnail_url) thumbnail = data.thumbnail_url;
      }
    } catch {
      // Fallback already prepared with video ID thumbnail
    }

    return {
      type: 'youtube',
      url,
      title,
      thumbnail,
    };
  }

  // 2. Reddit Detection
  if (/(?:reddit\.com|redd\.it)/i.test(hostname)) {
    const subMatch = url.match(/reddit\.com\/r\/([^/?#]+)/i);
    const subreddit = subMatch ? `r/${subMatch[1]}` : 'r/reddit';
    const subredditAvatar = 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png';

    let title = `${subreddit} post`;
    let text: string | undefined;
    let image: string | undefined;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      if (response.ok) {
        const html = await response.text();
        const ogTitle = extractMeta(html, 'og:title') || extractTitle(html);
        if (ogTitle) title = ogTitle;

        const ogDesc = extractMeta(html, 'og:description');
        if (ogDesc) text = ogDesc;

        const ogImage = extractMeta(html, 'og:image');
        if (ogImage && !ogImage.includes('redditstatic.com/icon.png')) {
          image = ogImage;
        }
      }
    } catch {
      // Fallback
    }

    return {
      type: 'reddit',
      url,
      subreddit,
      subredditAvatar,
      title,
      text,
      image,
    };
  }

  // 3. General URL fetching for Article vs Link
  const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  let html = '';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (response.ok) {
      html = await response.text();
    }
  } catch {
    // If fetching fails, return basic link
    return {
      type: 'link',
      url,
      siteTitle: hostname.replace(/^www\./, ''),
      description: '',
      favicon: fallbackFavicon,
    };
  }

  const ogTitle = extractMeta(html, 'og:title');
  const pageTitle = extractTitle(html);
  const title = ogTitle || pageTitle || hostname.replace(/^www\./, '');

  const ogDescription = extractMeta(html, 'og:description');
  const metaDescription = extractMeta(html, 'description');
  const description = ogDescription || metaDescription || '';

  const ogImage = extractMeta(html, 'og:image');
  const ogType = (extractMeta(html, 'og:type') || '').toLowerCase();
  const siteName = extractMeta(html, 'og:site_name') || hostname.replace(/^www\./, '');
  const favicon = extractFavicon(html, url) || fallbackFavicon;

  // Determine if this is an article
  const isArticle =
    ogType === 'article' ||
    ogType.startsWith('article.') ||
    Boolean(extractMeta(html, 'article:published_time')) ||
    Boolean(extractMeta(html, 'article:author')) ||
    Boolean(extractMeta(html, 'article:section')) ||
    /(\/article|\/post|\/story|\/news|\/blog|\/entry)\b/i.test(pathname) ||
    /(medium\.com|substack\.com|dev\.to|hashnode\.dev|nytimes\.com|theverge\.com|techcrunch\.com|wired\.com|bbc\.com\/news)/i.test(
      hostname
    );

  // If detected as article and has thumbnail, save as article
  if (isArticle && ogImage) {
    return {
      type: 'article',
      url,
      title,
      origin: siteName,
      thumbnail: ogImage,
    };
  }

  // Otherwise, save as regular link
  return {
    type: 'link',
    url,
    siteTitle: title,
    description,
    favicon,
  };
}
