import { motion, useTransform } from 'framer-motion';

export default function ScrollTextReveal({ text, progress, start = 0, end = 1, className = "" }) {
  // If the text contains <br/>, we can't just split by space easily if we pass JSX.
  // We assume text is a simple string here, and we can split by " " or handle newlines if needed.
  // For simplicity, we just split by space. We can also handle \n to insert <br />.
  const words = text.split(/(\s+)/).filter(Boolean); // keep spaces to render them properly
  
  return (
    <span className={`inline-flex flex-wrap ${className}`}>
      {words.map((word, i) => {
        // If it's just a space or newline, render it directly
        if (word.trim() === '') {
          if (word.includes('\n')) return <br key={i} className="hidden md:block" />;
          return <span key={i}>&nbsp;</span>;
        }

        // Calculate progress range for each word
        const step = (end - start) / words.length;
        const wordStart = start + i * step;
        const wordEnd = wordStart + step;

        return (
          <Word key={i} progress={progress} range={[wordStart, wordEnd]}>
            {word}
          </Word>
        );
      })}
    </span>
  );
}

const Word = ({ children, progress, range }) => {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <span className="relative mr-2 lg:mr-[0.4em] mb-[0.1em] inline-block">
      <span className="absolute opacity-20 text-white">{children}</span>
      <motion.span style={{ opacity }} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
        {children}
      </motion.span>
    </span>
  );
};
