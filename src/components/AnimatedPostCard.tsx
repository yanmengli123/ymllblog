import { motion } from 'framer-motion';

interface AnimatedPostCardProps {
  title: string;
  description: string;
  date: string;
  tags?: string[];
  slug: string;
  image?: string;
  readingTime?: string;
  index?: number;
}

export default function AnimatedPostCard({
  title,
  description,
  date,
  tags = [],
  slug,
  image,
  readingTime,
  index = 0,
}: AnimatedPostCardProps) {
  const formattedDate = new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: 'easeOut',
      }}
      whileHover={{
        y: -4,
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
      }}
      className="relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-md transition-colors duration-300"
    >
      {image && (
        <div className="aspect-video overflow-hidden">
          <motion.img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <time dateTime={date} className="text-sm text-gray-500 dark:text-gray-400">
            {formattedDate}
          </time>
          {readingTime && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              · {readingTime}
            </span>
          )}
        </div>

        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          <a href={`/blog/${slug}`} className="hover:text-green-700 dark:hover:text-green-400 transition-colors">
            {title}
          </a>
        </h3>

        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
          {description}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}
