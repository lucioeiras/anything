import { decodeHTML } from 'entities';

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
      type: 'tweet';
      url: string;
      author: string;
      avatar: string;
      text: string;
      images?: string[];
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

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return decodeHTML(str);
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
 * Cleans Reddit post description text by stripping out "X votes, Y comments" prefixes
 * in English, Portuguese, Spanish, etc., subscriber counts, and Reddit boilerplate.
 * Returns undefined if no meaningful body text remains.
 */
export function cleanRedditDescription(desc?: string): string | undefined {
  if (!desc) return undefined;
  let text = desc.trim();

  // Strip votes and comments count prefix (e.g., '107 votos, 38 comentários.', '54 votes, 13 comments.')
  text = text
    .replace(
      /^\s*[\d.,\s]+[kKmMkKmilMil]*\s*(?:votes?|votos?|upvotes?)\s*[,·•]?\s*[\d.,\s]+[kKmMkKmilMil]*\s*(?:comments?|coment[aá]rios?)\.?\s*/iu,
      ''
    )
    .trim();

  // Strip single vote or comment count prefix
  text = text
    .replace(
      /^\s*[\d.,\s]+[kKmMkKmilMil]*\s*(?:votes?|votos?|upvotes?|comments?|coment[aá]rios?)\.?\s*/iu,
      ''
    )
    .trim();

  // Strip subscriber / member count boilerplate
  text = text
    .replace(
      /^\s*[\d.,\s]+[kKmMkKmilMil]*\s*(?:de\s+)?(?:subscribers?|members?|membros?|inscritos?)\s*(?:in the|na comunidade|no|na|da|do|de\b)?\s*[^.]*\.?\s*/iu,
      ''
    )
    .trim();

  // Strip common Reddit boilerplates
  if (
    !text ||
    /^explore (?:this post|esta publica[cç][aã]o)/i.test(text) ||
    /^posted by\b/i.test(text) ||
    /^publicado por\b/i.test(text) ||
    /^a (?:place|community) (?:for|to)\b/i.test(text) ||
    /^uma comunidade para\b/i.test(text)
  ) {
    return undefined;
  }

  return text || undefined;
}

async function resolveSubredditAvatar(subName: string): Promise<string> {
  const fallbackAvatar = 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png';
  if (!subName || subName.toLowerCase() === 'reddit') {
    return fallbackAvatar;
  }

  try {
    const subRes = await fetch(`https://www.reddit.com/r/${subName}/`, {
      headers: { 'User-Agent': 'Twitterbot/1.0' },
    });
    if (subRes.ok) {
      const subHtml = await subRes.text();

      // 1. Specific shreddit-subreddit-icon img
      const m1 =
        subHtml.match(
          /<img[^>]*class=["'][^"']*shreddit-subreddit-icon__icon[^"']*["'][^>]*src=["']([^"']+)["']/i
        ) ||
        subHtml.match(
          /<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*shreddit-subreddit-icon__icon[^"']*["']/i
        );
      if (m1) return decodeHtmlEntities(m1[1]);

      // 2. Specific styles communityIcon (must be communityIcon, not profileIcon)
      const m2 = subHtml.match(
        /https:\/\/styles\.redditmedia\.com\/t5_[^"'\\s>]*communityIcon[^"'\\s>]*/i
      );
      if (m2) return decodeHtmlEntities(m2[0]);

      // 3. Subreddit icon in thumbs.redditmedia.com
      const m3 = subHtml.match(
        /https:\/\/[ab]\.thumbs\.redditmedia\.com\/[^"'\\s<>]+\.(?:png|jpg|jpeg)/i
      );
      if (m3) return decodeHtmlEntities(m3[0]);

      // 4. Any icon with community-icon in class or id
      const m4 =
        subHtml.match(/<img[^>]*community-icon[^>]*src=["']([^"']+)["']/i) ||
        subHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*community-icon/i);
      if (m4) return decodeHtmlEntities(m4[1]);
    }
  } catch {
    // fallback
  }

  return fallbackAvatar;
}

/**
 * Resolves metadata for a given URL and determines whether it should be
 * saved as a YouTube video, Reddit post, Tweet/X post, Article, or generic Link.
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
    let finalUrl = url;
    let postHtml = '';
    let oembedTitle = '';

    const oembedPromise = fetch(`https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`)
      .then(async (r) => (r.ok ? r.json() : null))
      .catch(() => null);

    const postPromise = fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Twitterbot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
      .then(async (r) => {
        if (r.ok) {
          finalUrl = r.url || url;
          return r.text();
        }
        return '';
      })
      .catch(() => '');

    const [oembedData, fetchedHtml] = await Promise.all([oembedPromise, postPromise]);
    if (oembedData && oembedData.title) {
      oembedTitle = oembedData.title;
    }
    postHtml = fetchedHtml || '';

    // Check canonical og:url if available
    if (postHtml) {
      const ogUrl = extractMeta(postHtml, 'og:url');
      if (ogUrl) {
        finalUrl = ogUrl;
      }
    }

    const subMatch =
      finalUrl.match(/reddit\.com\/r\/([^/?#]+)/i) || url.match(/reddit\.com\/r\/([^/?#]+)/i);
    const subName = subMatch ? subMatch[1] : 'reddit';
    const subreddit = `r/${subName}`;

    const postIdMatch =
      finalUrl.match(/\/comments\/([a-z0-9]+)/i) || url.match(/\/comments\/([a-z0-9]+)/i);
    const postId = postIdMatch ? postIdMatch[1] : '';

    // Fetch avatar and RSS in parallel
    const avatarPromise = resolveSubredditAvatar(subName);

    let rssPromise: Promise<string | null> = Promise.resolve(null);
    if (postId && subName && subName.toLowerCase() !== 'reddit') {
      const rssUrl = `https://www.reddit.com/r/${subName}/comments/${postId}/.rss`;
      rssPromise = fetch(rssUrl, {
        headers: { 'User-Agent': 'Twitterbot/1.0' },
      })
        .then(async (r) => (r.ok ? r.text() : null))
        .catch(() => null);
    }

    const [subredditAvatar, rssXml] = await Promise.all([avatarPromise, rssPromise]);

    let title = '';
    let image: string | undefined;
    let text: string | undefined;

    if (rssXml) {
      const entryMatch = rssXml.match(/<entry>([\s\S]*?)<\/entry>/);
      if (entryMatch) {
        const entry = entryMatch[1];

        // Title from RSS
        const tMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
        if (tMatch) {
          title = decodeHtmlEntities(tMatch[1].trim());
        }

        // Image: direct i.redd.it first, then media:thumbnail, then preview.redd.it
        const iReddIt = entry.match(/https:\/\/i\.redd\.it\/[^"'\\s<>&]+/i);
        const thumbMatch = entry.match(/<media:thumbnail\s+[^>]*url=["']([^"']+)["']/i);
        const previewMatch = entry.match(
          /https:\/\/(?:preview|external-preview)\.redd\.it\/[^"'\\s<>&]+/i
        );

        if (iReddIt) {
          image = decodeHtmlEntities(iReddIt[0]);
        } else if (thumbMatch) {
          image = decodeHtmlEntities(thumbMatch[1]);
        } else if (previewMatch) {
          image = decodeHtmlEntities(previewMatch[0]);
        }

        // Text from <div class="md">
        const contentMatch = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/);
        if (contentMatch) {
          const decodedContent = decodeHtmlEntities(contentMatch[1]);
          const mdMatch = decodedContent.match(/<div class=["']md["']>([\s\S]*?)<\/div>/);
          if (mdMatch) {
            const rawText = mdMatch[1]
              .replace(/<[^>]+>/g, '')
              .replace(/&#32;/g, ' ')
              .trim();
            if (rawText) {
              text = cleanRedditDescription(rawText);
            }
          }
        }
      }
    }

    // Title fallbacks
    if (!title) {
      title = oembedTitle;
    }
    if (!title && postHtml) {
      const ogTitle = extractMeta(postHtml, 'og:title') || extractMeta(postHtml, 'twitter:title');
      if (ogTitle) {
        title = ogTitle
          .replace(/^(?:\[[^\]]*\]\s*)?From the .*? community on Reddit:\s*/i, '')
          .replace(/\s*:\s*r\/[a-zA-Z0-9_]+.*$/i, '')
          .replace(/\s*-\s*Reddit.*$/i, '')
          .trim();
      }
      if (!title) {
        const pageTitle = extractTitle(postHtml);
        if (pageTitle && pageTitle.toLowerCase() !== 'reddit') {
          title = pageTitle
            .replace(/\s*:\s*r\/[a-zA-Z0-9_]+.*$/i, '')
            .replace(/\s*-\s*Reddit.*$/i, '')
            .trim();
        }
      }
    }
    if (!title) {
      const slugMatch = finalUrl.match(/\/comments\/[a-z0-9]+\/([^/?#]+)/i);
      if (slugMatch) {
        title = decodeURIComponent(slugMatch[1].replace(/_/g, ' '));
      }
    }
    if (!title || title.toLowerCase() === 'reddit') {
      title = `${subreddit} post`;
    }

    // Image fallback from postHtml (ensure share.redd.it and default icons are NEVER used)
    if (!image && postHtml) {
      const ogImg = extractMeta(postHtml, 'og:image') || extractMeta(postHtml, 'twitter:image');
      if (
        ogImg &&
        !ogImg.includes('share.redd.it') &&
        !ogImg.includes('redditstatic.com') &&
        !ogImg.includes('favicon')
      ) {
        image = decodeHtmlEntities(ogImg);
      } else {
        const iReddIt = postHtml.match(/https:\/\/i\.redd\.it\/[^"'\\s<>&]+/i);
        if (iReddIt) {
          image = decodeHtmlEntities(iReddIt[0]);
        }
      }
    }

    // Text fallback from postHtml
    if (!text && postHtml) {
      const desc = extractMeta(postHtml, 'description') || extractMeta(postHtml, 'og:description');
      if (desc) {
        text = cleanRedditDescription(desc);
      }
    }

    return {
      type: 'reddit',
      url: finalUrl,
      subreddit,
      subredditAvatar,
      title,
      ...(text ? { text } : {}),
      ...(image ? { image } : {}),
    };
  }

  // 3. Twitter / X Detection
  if (/(?:twitter\.com|x\.com)/i.test(hostname)) {
    const match = url.match(
      /(?:twitter\.com|x\.com)\/(?:#!\/)?([a-zA-Z0-9_]+)(?:\/status(?:es)?\/(\d+))?/i
    );
    const handle = match ? match[1] : '';
    const tweetId = match ? match[2] : '';

    let author = handle ? `@${handle}` : 'X Post';
    let avatar = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png';
    let text = '';
    let images: string[] = [];

    if (tweetId) {
      // 1. Try fxtwitter API
      try {
        const res = await fetch(`https://api.fxtwitter.com/status/${tweetId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.tweet) {
            const t = data.tweet;
            if (t.author?.name) {
              author = t.author.screen_name ? t.author.name : t.author.name;
            }
            if (t.author?.avatar_url) {
              avatar = t.author.avatar_url;
            }
            if (t.text) {
              text = t.text;
            }
            if (t.media?.photos?.length) {
              images = t.media.photos
                .map((p: { url?: string }) => p.url)
                .filter(Boolean) as string[];
            }
          }
        }
      } catch {
        // Fallback
      }

      // 2. Fallback: Twitter Syndication API
      if (!text) {
        try {
          const syndRes = await fetch(
            `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=x`
          );
          if (syndRes.ok) {
            const t = await syndRes.json();
            if (t.user?.name) {
              author = t.user.screen_name ? `${t.user.name} (@${t.user.screen_name})` : t.user.name;
            }
            if (t.user?.profile_image_url_https) {
              avatar = t.user.profile_image_url_https.replace('_normal.', '_200x200.');
            }
            if (t.text) {
              text = t.text;
            }
            if (t.photos?.length) {
              images = t.photos.map((p: { url?: string }) => p.url).filter(Boolean) as string[];
            } else if (t.mediaDetails?.length) {
              images = t.mediaDetails
                .filter((m: { type?: string }) => m.type === 'photo')
                .map((m: { media_url_https?: string }) => m.media_url_https)
                .filter(Boolean) as string[];
            }
          }
        } catch {
          // Fallback
        }
      }

      // 3. Fallback: Twitter oEmbed
      if (!text) {
        try {
          const oembedRes = await fetch(
            `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`
          );
          if (oembedRes.ok) {
            const oembed = await oembedRes.json();
            if (oembed.author_name) author = oembed.author_name;
            if (oembed.html) {
              const pMatch = oembed.html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
              if (pMatch) {
                text = decodeHtmlEntities(pMatch[1].replace(/<[^>]+>/g, '').trim());
              }
            }
          }
        } catch {
          // Fallback
        }
      }
    }

    if (!text) {
      text = `Post by ${author}`;
    }

    return {
      type: 'tweet',
      url,
      author,
      avatar,
      text,
      ...(images.length > 0 ? { images } : {}),
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
