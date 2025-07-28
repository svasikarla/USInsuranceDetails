import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AccessibilityIssue {
  type: 'error' | 'warning';
  message: string;
  element?: string;
  fix?: string;
}

export const AccessibilityChecker: React.FC = () => {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    const checkAccessibility = () => {
      const foundIssues: AccessibilityIssue[] = [];

      // Check for buttons without accessible text
      const buttons = document.querySelectorAll('button');
      buttons.forEach((button, index) => {
        const hasText = button.textContent?.trim();
        const hasAriaLabel = button.getAttribute('aria-label');
        const hasTitle = button.getAttribute('title');

        if (!hasText && !hasAriaLabel && !hasTitle) {
          foundIssues.push({
            type: 'error',
            message: `Button ${index + 1} has no accessible text`,
            element: 'button',
            fix: 'Add aria-label, title, or visible text'
          });
        }
      });

      // Check for form inputs without labels
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach((input, index) => {
        const id = input.getAttribute('id');
        const ariaLabel = input.getAttribute('aria-label');
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const placeholder = input.getAttribute('placeholder');
        
        if (!hasLabel && !ariaLabel && !placeholder) {
          foundIssues.push({
            type: 'error',
            message: `Form element ${index + 1} has no accessible name`,
            element: input.tagName.toLowerCase(),
            fix: 'Add label, aria-label, or placeholder'
          });
        }
      });

      // Check for select elements without accessible names
      const selects = document.querySelectorAll('select');
      selects.forEach((select, index) => {
        const id = select.getAttribute('id');
        const ariaLabel = select.getAttribute('aria-label');
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const title = select.getAttribute('title');
        
        if (!hasLabel && !ariaLabel && !title) {
          foundIssues.push({
            type: 'error',
            message: `Select element ${index + 1} has no accessible name`,
            element: 'select',
            fix: 'Add label, aria-label, or title attribute'
          });
        }
      });

      // Check for HTML lang attribute
      const html = document.documentElement;
      if (!html.getAttribute('lang')) {
        foundIssues.push({
          type: 'error',
          message: 'HTML element missing lang attribute',
          element: 'html',
          fix: 'Add lang="en" to <html> element'
        });
      }

      setIssues(foundIssues);
    };

    // Run check after a delay to allow page to load
    const timer = setTimeout(checkAccessibility, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Only show in development and when explicitly enabled, and not dismissed
  if (process.env.NODE_ENV !== 'development' || issues.length === 0 || process.env.NEXT_PUBLIC_SHOW_A11Y_CHECKER !== 'true' || isDismissed) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 z-40 max-w-sm"
    >
      <div className="bg-white border border-red-200 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-red-800">
            Accessibility Issues ({issues.length})
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="text-red-600 hover:text-red-800"
              aria-label={isVisible ? "Hide accessibility issues" : "Show accessibility issues"}
            >
              {isVisible ? '−' : '+'}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Dismiss accessibility checker"
              title="Dismiss accessibility checker"
            >
              ×
            </button>
          </div>
        </div>
        
        {isVisible && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {issues.map((issue, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs ${
                  issue.type === 'error' 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div className={`font-medium ${
                  issue.type === 'error' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {issue.message}
                </div>
                {issue.fix && (
                  <div className={`mt-1 ${
                    issue.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    Fix: {issue.fix}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
