/**
 * 计算阅读时间
 * @param content 文章内容（Markdown/MDX 原文）
 * @returns 阅读时间字符串，如 "5 分钟"
 */
export function calculateReadingTime(content: string): string {
  // 移除 Markdown 语法
  const plainText = content
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/`[^`]*`/g, '') // 移除行内代码
    .replace(/#{1,6}\s+/g, '') // 移除标题标记
    .replace(/\*\*|__/g, '') // 移除加粗
    .replace(/\*|_/g, '') // 移除斜体
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 移除链接，保留文本
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '') // 移除图片
    .replace(/<[^>]*>/g, '') // 移除 HTML 标签
    .replace(/\s+/g, ' ') // 合并空白
    .trim();

  const characterCount = plainText.length;

  // 中文阅读速度约 300-500 字/分钟，取中间值 400
  const wordsPerMinute = 400;
  const minutes = Math.ceil(characterCount / wordsPerMinute);

  if (minutes < 1) return '1 分钟';
  return `${minutes} 分钟`;
}

/**
 * 计算字数
 */
export function countCharacters(content: string): number {
  const plainText = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\*|_/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return plainText.length;
}
