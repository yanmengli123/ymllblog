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
  base?: string;
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
  base = '',
}: AnimatedPostCardProps) {
  const formattedDate = new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -6 }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100 hover:border-emerald-200"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50">
        {image ? (
          <motion.img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-6xl opacity-20">📝</span>
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag) => (
              <motion.span
                key={tag}
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-600 rounded-full cursor-default"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-bold text-stone-900 mb-3 group-hover:text-emerald-600 transition-colors duration-300">
          <a href={`${base}/blog/${slug}`} className="relative z-10">
            {title}
          </a>
        </h3>

        {/* Description */}
        <p className="text-sm text-stone-600 mb-4 leading-relaxed line-clamp-2">
          {description}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-stone-500">
          <div className="flex items-center gap-4">
            <time dateTime={date} className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formattedDate}
            </time>
            {readingTime && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {readingTime}
              </span>
            )}
          </div>

          <motion.span
            className="text-emerald-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            whileHover={{ x: 4 }}
          >
            阅读 →
          </motion.span>
        </div>
      </div>

      {/* Animated border */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-emerald-500 pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.article>
  );
}
