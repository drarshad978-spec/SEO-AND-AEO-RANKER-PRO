import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ArrowRight, X, Sparkles, Target, Search } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  icon: React.ElementType;
  elementId?: string;
}

const STEPS: Step[] = [
  {
    title: "Welcome to SEO & AEO RANKER",
    description: "Your ultimate engine for high-rank SEO and Answer Engine Optimization. Let's maximize your search visibility.",
    icon: Sparkles
  },
  {
    title: "Modular SEO Tools",
    description: "Switch between full article generation, site audits, competitor research, and rapid content refinement in the sidebar.",
    icon: Search,
    elementId: "tour-sidebar"
  },
  {
    title: "Intelligent Inputs",
    description: "Provide keywords and 'RAG Context' (competitor snippets) to help the AI detect gaps and outrank the competition.",
    icon: Target,
    elementId: "tour-inputs"
  },
  {
    title: "Precision Outputs",
    description: "Get structured markdown content optimized for featured snippets (AEO) and human readability.",
    icon: Sparkles,
    elementId: "tour-output"
  }
];

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('rankflow_onboarded');
    if (!hasOnboarded) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('rankflow_onboarded', 'true');
  };

  if (!isVisible) return null;

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden"
        >
          <div className="p-8 text-center relative">
            <button 
              onClick={handleComplete}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-primary">
              <Icon size={32} />
            </div>

            <h3 className="text-2xl font-display font-bold text-slate-900 mb-3">
              {step.title}
            </h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              {step.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-brand-primary' : 'w-1.5 bg-slate-200'}`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-brand-primary hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          
          <div className="bg-slate-50 px-8 py-3 border-t border-slate-100 flex justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
