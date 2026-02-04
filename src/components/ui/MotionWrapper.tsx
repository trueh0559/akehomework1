import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface MotionWrapperProps {
  children: ReactNode;
  className?: string;
  variant?: 'fadeIn' | 'slideUp' | 'slideIn' | 'scale' | 'stagger';
  delay?: number;
}

const variants: Record<string, Variants> = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  stagger: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
};

export const MotionWrapper = ({
  children,
  className,
  variant = 'fadeIn',
  delay = 0,
}: MotionWrapperProps) => {
  const { theme } = useTheme();

  if (!theme.enable_motion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[variant]}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

export const MotionCard = ({
  children,
  className,
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) => {
  const { theme } = useTheme();

  if (!theme.enable_motion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
};

export const MotionPage = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { theme } = useTheme();

  if (!theme.enable_motion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedList = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { theme } = useTheme();

  if (!theme.enable_motion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: { transition: { staggerChildren: 0.1 } },
      }}
    >
      {children}
    </motion.div>
  );
};

export { AnimatePresence };
