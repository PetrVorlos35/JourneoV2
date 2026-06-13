import { useState } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LikeButton = ({ tripId, initialLikes = 0, initialIsLiked = false, onLikeChange }) => {
  const { t } = useTranslation();
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isLiked) {
        // Remove like
        const data = await api.votes.remove(tripId);
        setLikes(data.likes);
        setIsLiked(data.isLiked);
        if (onLikeChange) onLikeChange(data.likes, data.isLiked);
      } else {
        // Add like
        const data = await api.votes.cast(tripId, 1);
        setLikes(data.likes);
        setIsLiked(data.isLiked);
        if (onLikeChange) onLikeChange(data.likes, data.isLiked);
      }
    } catch (err) {
      toast.error(err.message || t('likeButton.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-row items-center gap-1.5 glass-card rounded-full pl-2 pr-4 py-1.5 shadow-sm border border-gray-100 dark:border-white/10 w-fit">
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={handleLike}
        disabled={isLoading}
        className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer disabled:cursor-not-allowed shrink-0 ${
          isLiked
            ? 'bg-red-500/20 text-red-500 shadow-sm shadow-red-500/10'
            : 'text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-500/10'
        }`}
        title={isLiked ? t('likeButton.unlike') : t('likeButton.like')}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isLiked ? 'liked' : 'unliked'}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Heart 
              size={20} 
              strokeWidth={isLiked ? 0 : 2.5} 
              fill={isLiked ? "currentColor" : "none"} 
            />
          </motion.div>
        </AnimatePresence>
      </motion.button>

      <div className="flex items-center px-1">
        <motion.span
          key={likes}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className={`text-[14px] font-bold tabular-nums leading-none ${
            isLiked ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {likes}
        </motion.span>
      </div>
    </div>
  );
};

export default LikeButton;
