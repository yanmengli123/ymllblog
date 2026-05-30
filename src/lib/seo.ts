export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  canonicalURL?: URL;
  type?: 'website' | 'article';
  publishedTime?: Date;
  updatedTime?: Date;
  author?: string;
  tags?: string[];
}

const SITE_URL = 'https://yanmengli123.github.io';
const BASE_PATH = '/ymllblog';

/**
 * 获取完整的站点 URL
 */
export function getSiteURL(): string {
  return `${SITE_URL}${BASE_PATH}`;
}

/**
 * 获取页面的完整 URL
 */
export function getPageURL(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${BASE_PATH}${cleanPath}`;
}

/**
 * 获取图片的完整 URL
 */
export function getImageURL(imagePath: string): string {
  if (imagePath.startsWith('http')) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${SITE_URL}${BASE_PATH}${cleanPath}`;
}

/**
 * 生成 JSON-LD 结构化数据
 */
export function generateJSONLD(props: SEOProps): object {
  const baseURL = getSiteURL();

  if (props.type === 'article') {
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: props.title,
      description: props.description,
      image: props.image ? getImageURL(props.image) : undefined,
      datePublished: props.publishedTime?.toISOString(),
      dateModified: props.updatedTime?.toISOString() || props.publishedTime?.toISOString(),
      author: {
        '@type': 'Person',
        name: props.author || 'YMLL',
        url: getPageURL('/about'),
      },
      publisher: {
        '@type': 'Organization',
        name: 'YMLL Blog',
        url: baseURL,
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': props.canonicalURL?.toString() || baseURL,
      },
      keywords: props.tags?.join(', '),
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'YMLL Blog',
    description: '探索技术与设计的交汇点，记录成长与思考',
    url: baseURL,
    author: {
      '@type': 'Person',
      name: 'YMLL',
      url: getPageURL('/about'),
    },
  };
}
