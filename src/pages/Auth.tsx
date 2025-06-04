import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary to-bg-secondary py-16 px-4">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-card-bg rounded-lg shadow-xl p-8 border border-accent-primary/10"
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-text-primary">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          
          <form className="space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-text-secondary mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 rounded-md bg-bg-secondary border border-accent-primary/20 text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-text-secondary mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 rounded-md bg-bg-secondary border border-accent-primary/20 text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-text-secondary mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-2 rounded-md bg-bg-secondary border border-accent-primary/20 text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3 px-4 bg-accent-primary text-bg-primary rounded-md font-medium hover:bg-accent-secondary transition-colors duration-200 shadow-lg hover:shadow-accent-primary/20"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-text-secondary hover:text-accent-primary transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth; 