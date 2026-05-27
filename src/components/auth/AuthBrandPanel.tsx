import React from 'react';
import { motion } from 'framer-motion';

interface AuthBrandPanelProps {
  title: string;
  subtitle: string;
}

const AuthBrandPanel: React.FC<AuthBrandPanelProps> = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-emerald-500 relative overflow-hidden flex-col items-center justify-center p-12">
      {/* Decorative elements */}
      <div className="absolute inset-0">
        {/* Wave lines */}
        <svg className="absolute bottom-0 left-0 w-full opacity-20" viewBox="0 0 800 400" fill="none">
          <path d="M-50 300 Q200 250 400 300 T850 280" stroke="white" strokeWidth="2" fill="none" />
          <path d="M-50 330 Q200 280 400 330 T850 310" stroke="white" strokeWidth="2" fill="none" />
          <path d="M-50 360 Q200 310 400 360 T850 340" stroke="white" strokeWidth="2" fill="none" />
        </svg>
        {/* Small crosses */}
        {[
          { top: '15%', left: '20%' },
          { top: '25%', right: '25%' },
          { top: '60%', left: '15%' },
          { top: '45%', right: '15%' },
          { top: '75%', right: '30%' },
          { top: '80%', left: '30%' },
        ].map((pos, i) => (
          <motion.div
            key={i}
            className="absolute text-white/30 text-xl font-light"
            style={pos}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
          >
            +
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <div className="mb-8">
          <img
            src="/lovable-uploads/0a88c5b7-5cee-4840-953d-8ac270aaa491.png"
            alt="XLata Logo"
            className="h-16 mx-auto"
          />
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
        <p className="text-white/80 text-lg max-w-sm mx-auto leading-relaxed">
          {subtitle}
        </p>
      </motion.div>
    </div>
  );
};

export default AuthBrandPanel;
