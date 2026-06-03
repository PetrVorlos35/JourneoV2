import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const VoteButton = ({ tripId, initialUpvotes = 0, initialDownvotes = 0, initialUserVote = 0, onVoteChange }) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (value) => {
    if (isVoting) return;
    setIsVoting(true);

    try {
      // If clicking the same vote direction, remove the vote
      if (userVote === value) {
        const data = await api.votes.remove(tripId);
        setUpvotes(data.upvotes);
        setDownvotes(data.downvotes);
        setUserVote(0);
        if (onVoteChange) onVoteChange(data.upvotes, data.downvotes, 0);
      } else {
        // Cast or change vote
        const data = await api.votes.cast(tripId, value);
        setUpvotes(data.upvotes);
        setDownvotes(data.downvotes);
        setUserVote(data.userVote);
        if (onVoteChange) onVoteChange(data.upvotes, data.downvotes, data.userVote);
      }
    } catch (err) {
      toast.error(err.message || 'Chyba při hlasování.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex flex-row items-center gap-1 glass-card rounded-full px-2 py-1.5 shadow-sm border border-gray-100 dark:border-white/10">
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={() => handleVote(1)}
        disabled={isVoting}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer disabled:cursor-not-allowed shrink-0 ${
          userVote === 1
            ? 'bg-blue-500/20 text-blue-500 dark:text-blue-400 shadow-sm shadow-blue-500/10'
            : 'text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10'
        }`}
        title="Upvote"
      >
        <ChevronUp size={20} strokeWidth={userVote === 1 ? 3 : 2.5} />
      </motion.button>

      <div className="flex items-center gap-2 px-1">
        <motion.span
          key={`up-${upvotes}`}
          initial={{ scale: 1.3, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className={`text-[13px] font-bold tabular-nums leading-none ${
            userVote === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {upvotes}
        </motion.span>

        <span className="text-gray-300 dark:text-gray-600 text-[10px]">|</span>

        <motion.span
          key={`down-${downvotes}`}
          initial={{ scale: 1.3, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className={`text-[13px] font-bold tabular-nums leading-none ${
            userVote === -1 ? 'text-orange-500 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {downvotes}
        </motion.span>
      </div>

      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={() => handleVote(-1)}
        disabled={isVoting}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer disabled:cursor-not-allowed shrink-0 ${
          userVote === -1
            ? 'bg-orange-500/20 text-orange-500 dark:text-orange-400 shadow-sm shadow-orange-500/10'
            : 'text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-500/10'
        }`}
        title="Downvote"
      >
        <ChevronDown size={20} strokeWidth={userVote === -1 ? 3 : 2.5} />
      </motion.button>
    </div>
  );
};

export default VoteButton;
