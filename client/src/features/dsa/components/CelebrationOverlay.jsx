import { FiAward as FiTrophy, FiAward, FiZap } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import BadgeVisual, { getBadgeMetadata } from '../../../components/BadgeVisual';

// Premium Gamified Celebration Overlay — shown when a coding challenge is
// conquered (code submitted / topic completed). Faithful port of the original.
export const CelebrationOverlay = ({ ctx }) => {
  const { celebrationData, setCelebrationData, activeDifficulty, navigate } = ctx;

  return (
    <AnimatePresence>
      {celebrationData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="bg-[var(--bg-card)] border-2 border-[var(--primary)]/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative p-8 text-center flex flex-col items-center gap-6"
          >
            {/* Leveled Up Banner */}
            {celebrationData.leveledUp && (
              <div className="absolute top-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-4 py-1 rounded-full shadow-lg animate-pulse">
                🏆 Rank Promoted!
              </div>
            )}

            {/* Success Badge Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-full flex items-center justify-center text-[var(--text-main)] shadow-xl relative animate-bounce">
              <FiTrophy className="text-3xl" />
              <div className="absolute -bottom-2 bg-emerald-500 text-[var(--text-main)] font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-white">
                Passed
              </div>
            </div>

            {/* Milestone Details */}
            <div className="space-y-1">
              <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight">Challenge Conquered!</h2>
              <p className="text-[10px] text-[var(--text-light)] font-black uppercase tracking-wider">
                Quest completed in {activeDifficulty.toUpperCase()} difficulty
              </p>
            </div>

            {/* Newly Earned Badges Section */}
            {celebrationData.newlyEarnedBadges && celebrationData.newlyEarnedBadges.length > 0 && (
              <div className="w-full p-4 bg-slate-900/60 border border-white/5 rounded-2xl text-center space-y-3 relative z-10">
                <div className="text-[9px] text-amber-500 font-black uppercase tracking-widest">
                  🎉 New Badges Unlocked!
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {celebrationData.newlyEarnedBadges.map((badge, idx) => {
                    const metadata = getBadgeMetadata(badge);
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-950/45 border border-white/5 max-w-[90px] text-center">
                        <BadgeVisual badge={badge} size="sm" />
                        <div className="text-[8px] font-black text-white truncate w-full mt-1">{badge.name}</div>
                        <div className={`text-[6px] font-black tracking-wider uppercase ${metadata.rarity.textColor}`}>{metadata.rarity.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Newly Earned Certificate Section */}
            {celebrationData.newlyEarnedCertificate && (
              <div className="w-full p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-center space-y-2 relative z-10">
                <div className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">
                  🎓 Course Certified!
                </div>
                <div className="text-3xl filter drop-shadow animate-bounce">🏆</div>
                <div className="text-xs font-black text-[var(--text-main)]">
                  You earned the {celebrationData.newlyEarnedCertificate.title}!
                </div>
                <p className="text-[8px] text-[var(--text-muted)] font-semibold leading-normal">
                  View and print your official certificate on the Dashboard.
                </p>
              </div>
            )}

            {/* XP and Streak stats */}
            <div className="flex gap-4 w-full mt-2">
              <div className="flex-1 p-4 bg-[var(--bg-sub)] border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center gap-0.5 shadow-inner">
                <FiZap className="text-amber-500 text-lg animate-pulse" />
                <span className="text-[8px] font-black text-[var(--text-light)] uppercase tracking-wider">Quest XP</span>
                <span className="text-lg font-black text-emerald-500">+{celebrationData.xpEarned} XP</span>
              </div>

              <div className="flex-1 p-4 bg-[var(--bg-sub)] border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center gap-0.5 shadow-inner">
                <span className="text-lg animate-bounce">🔥</span>
                <span className="text-[8px] font-black text-[var(--text-light)] uppercase tracking-wider">Active Streak</span>
                <span className="text-lg font-black text-amber-500">{celebrationData.streak} Days</span>
              </div>
            </div>

            {/* Curated Celebration Quote Box */}
            <div className="p-4 bg-[var(--bg-sub)] border border-[var(--border)] rounded-2xl relative w-full text-center">
              <div className="absolute -top-2 left-6 bg-[var(--primary)] text-[var(--text-main)] text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                Milestone Note
              </div>
              <p className="italic text-xs text-[var(--text-muted)] font-medium leading-relaxed mt-1 select-text">
                "{celebrationData.quote}"
              </p>
            </div>

            {/* Badge Rank Unlocked */}
            <div className="w-full py-2 border-y border-[var(--border)] flex justify-between items-center text-[10px] font-black text-[var(--text-light)] uppercase tracking-wider px-2">
              <span>Codex Badge:</span>
              <span className={`flex items-center gap-1.5 ${celebrationData.rank.style}`}>
                <FiAward /> {celebrationData.rank.badge} ({celebrationData.rank.title})
              </span>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                const dest = celebrationData.navigateOnClose;
                setCelebrationData(null);
                if (dest) {
                  navigate(dest);
                }
              }}
              className="w-full py-3.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:shadow-lg text-[var(--text-main)] font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Continue Quest
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};