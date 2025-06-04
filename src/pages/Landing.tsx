import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-bg-primary to-bg-secondary">
      <section className="py-24 px-8 text-center max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-extrabold text-text-primary mb-6 drop-shadow-lg"
        >
          Collaborative Markdown Editor
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-2xl text-text-secondary mb-10 max-w-3xl mx-auto"
        >
          Edit and collaborate on markdown documents in real-time with your team
        </motion.p>
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/auth')}
          className="px-8 py-4 bg-accent-primary text-bg-primary rounded-lg font-semibold text-lg shadow-lg hover:bg-accent-secondary transition-all duration-200 hover:shadow-accent-primary/20"
        >
          Get Started
        </motion.button>
      </section>

      <section className="py-16 px-8 bg-bg-secondary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-card-bg p-8 rounded-xl shadow-lg border border-accent-primary/10 hover:border-accent-primary/30 transition-all duration-300"
          >
            <h3 className="text-2xl font-bold text-accent-primary mb-4">Real-time Collaboration</h3>
            <p className="text-text-secondary">Work together with your team in real-time, seeing changes as they happen.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="bg-card-bg p-8 rounded-xl shadow-lg border border-accent-primary/10 hover:border-accent-primary/30 transition-all duration-300"
          >
            <h3 className="text-2xl font-bold text-accent-primary mb-4">Markdown Support</h3>
            <p className="text-text-secondary">Write in Markdown with instant preview and formatting tools.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="bg-card-bg p-8 rounded-xl shadow-lg border border-accent-primary/10 hover:border-accent-primary/30 transition-all duration-300"
          >
            <h3 className="text-2xl font-bold text-accent-primary mb-4">Version History</h3>
            <p className="text-text-secondary">Track changes and revert to previous versions at any time.</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing; 