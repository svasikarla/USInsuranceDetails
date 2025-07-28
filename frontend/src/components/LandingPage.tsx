import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, useAnimation } from 'framer-motion';
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowsRightLeftIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  StarIcon,
  ChartBarIcon,
  LightBulbIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// --- MOCK DATA ---
const features = [
  { name: 'AI-Powered Document Processing', description: 'Upload insurance documents and let our advanced AI extract, analyze, and structure policy information automatically.', icon: DocumentTextIcon, benefits: ['99.5% accuracy', '30-sec processing', '15+ formats'], color: 'from-blue-500 to-cyan-500' },
  { name: 'Intelligent Red Flag Detection', description: 'Our AI identifies potential coverage gaps, exclusions, and limitations that could impact your claims.', icon: ExclamationTriangleIcon, benefits: ['200+ risk patterns', 'Real-time alerts', '95% issue prevention'], color: 'from-red-500 to-pink-500' },
  { name: 'Advanced Policy Analysis', description: 'Get comprehensive insights into policy terms, benefits, and coverage details with our sophisticated analysis engine.', icon: MagnifyingGlassIcon, benefits: ['Deep coverage analysis', 'Benefit optimization', 'Cost-benefit insights'], color: 'from-green-500 to-emerald-500' },
  { name: 'Smart Policy Comparison', description: 'Compare multiple policies side-by-side with intelligent recommendations to help you choose the best coverage.', icon: ArrowsRightLeftIcon, benefits: ['Side-by-side comparison', 'ROI calculations', 'Personalized recommendations'], color: 'from-purple-500 to-indigo-500' },
];
const stats = [
  { label: 'Policies Analyzed', value: 50000, suffix: '+', icon: DocumentTextIcon },
  { label: 'Hours Saved', value: 125000, suffix: '+', icon: ClockIcon },
  { label: 'Cost Savings', value: 2.5, prefix: '$', suffix: 'M+', icon: CurrencyDollarIcon },
  { label: 'Happy Customers', value: 1200, suffix: '+', icon: UserGroupIcon },
];
const testimonials = [
  { content: "This platform saved our HR team 15 hours per week. The AI red flag detection caught issues we would have missed.", author: "Sarah Johnson", role: "HR Director", company: "TechCorp Inc.", rating: 5 },
  { content: "The policy comparison feature helped us save $50,000 annually by identifying better coverage options. Game-changing.", author: "Michael Chen", role: "Benefits Manager", company: "Global Solutions LLC", rating: 5 },
  { content: "Finally, a tool that makes insurance policy analysis simple and accurate. The AI insights are incredibly valuable.", author: "Emily Rodriguez", role: "Insurance Analyst", company: "HealthFirst Corp", rating: 5 },
];
const trustIndicators = [
  { name: 'SOC 2 Certified', icon: ShieldCheckIcon },
  { name: 'HIPAA Compliant', icon: ShieldCheckIcon },
  { name: '99.9% Uptime', icon: CheckCircleIcon },
  { name: 'Enterprise Grade', icon: LightBulbIcon },
];

// --- HOOKS ---
const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let startTime: number;
          const startCount = 0;
          const updateCount = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const currentCount = Math.floor(progress * (end - startCount) + startCount);
            setCount(currentCount);
            if (progress < 1) requestAnimationFrame(updateCount);
          };
          requestAnimationFrame(updateCount);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration]);

  return [count, ref] as const;
};

// --- COMPONENTS ---
const Header = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = ['Features', 'Testimonials', 'Pricing'];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-900/80 backdrop-blur-lg shadow-lg' : 'bg-transparent'}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-white">🛡️ InsureAI</span>
          </div>
          <div className="hidden lg:flex lg:gap-x-8">
            {navLinks.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-semibold leading-6 text-gray-200 hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </div>
          <div className="hidden lg:flex lg:items-center lg:gap-x-4">
            <button onClick={() => router.push('/login')} className="text-sm font-semibold leading-6 text-gray-200 hover:text-white transition-colors">Log in</button>
            <button onClick={() => router.push('/register')} className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 transition-all duration-300 transform hover:scale-105">Get Started</button>
          </div>
          <div className="flex lg:hidden">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-200">
              {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="lg:hidden bg-gray-900/90 pb-4">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {navLinks.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setIsOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">{item}</a>
            ))}
          </div>
          <div className="border-t border-gray-700 pt-4 pb-3">
            <div className="px-5">
                <button onClick={() => { router.push('/register'); setIsOpen(false); }} className="w-full rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 transition-all duration-300">Get Started</button>
                <p className="mt-4 text-center text-sm text-gray-400">Already have an account? <a href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">Log in</a></p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const LandingPage = () => {
  const router = useRouter();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-50 font-sans">
      <Header />
      <main>
        {/* Hero Section */}
        <div className="relative h-screen flex items-center justify-center text-center">
           <div
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ backgroundImage: "url('https://images.pexels.com/photos/5496464/pexels-photo-5496464.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')" }}
          ></div>
          <div className="absolute inset-0 bg-gray-900/60 z-10"></div>
          <div className="relative z-20 mx-auto max-w-4xl px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                AI-Powered Insurance Intelligence
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-200">
                Transform complex insurance documents into actionable insights. Save time, reduce risk, and make smarter decisions with our advanced analysis platform.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <button onClick={() => router.push('/register')} className="rounded-md bg-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-indigo-400 transition-all duration-300 transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
                  Get Started Free
                </button>
                <button onClick={() => router.push('/login')} className="text-base font-semibold leading-6 text-white hover:text-gray-200 transition-colors">
                  Request a Demo <span aria-hidden="true">→</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Trust Indicators Section */}
        <div className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
              {trustIndicators.map((indicator) => (
                <div key={indicator.name} className="flex items-center justify-center">
                  <indicator.icon className="h-6 w-6 mr-2 text-gray-500" />
                  <span className="text-gray-600 font-medium">{indicator.name}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">Core Features</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Everything You Need for Smarter Insurance Analysis</p>
              <p className="mt-6 text-lg leading-8 text-gray-600">Our platform is designed to automate manual work, uncover hidden risks, and provide clarity on complex policy details.</p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
                {features.map((feature, index) => (
                  <motion.div key={feature.name} className="relative pl-16" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.2 }}>
                    <dt className="text-base font-semibold leading-7 text-gray-900">
                      <div className={`absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r ${feature.color}`}>
                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      {feature.name}
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
                    <dd className="mt-4 flex flex-wrap gap-2">
                      {feature.benefits.map(benefit => (
                        <span key={benefit} className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          <CheckCircleIcon className="h-3 w-3 mr-1.5" />
                          {benefit}
                        </span>
                      ))}
                    </dd>
                  </motion.div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              {stats.map((stat) => {
                const [count, ref] = useCounter(stat.value);
                return (
                  <div key={stat.label} ref={ref} className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl">
                    <stat.icon className="h-10 w-10 text-indigo-600 mb-4" />
                    <p className="text-4xl font-bold tracking-tight text-gray-900">{stat.prefix}{count.toLocaleString()}{stat.suffix}</p>
                    <p className="text-base leading-7 text-gray-600 mt-2">{stat.label}</p>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div id="testimonials" className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">Testimonials</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Trusted by Industry Leaders</p>
            </div>
            <div className="mx-auto mt-16 flow-root sm:mt-20">
              <motion.div key={currentTestimonial} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="-mt-8 sm:-mx-4 sm:pl-4 sm:pr-8">
                <div className="relative max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => <StarIcon key={i} className="h-5 w-5" />)}
                  </div>
                  <blockquote className="text-xl font-medium leading-8 text-gray-900">"{testimonials[currentTestimonial].content}"</blockquote>
                  <div className="mt-8 flex items-center">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">{testimonials[currentTestimonial].author.charAt(0)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-900">{testimonials[currentTestimonial].author}</div>
                      <div className="text-gray-600">{testimonials[currentTestimonial].role}, {testimonials[currentTestimonial].company}</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-8 space-x-2">
                  {testimonials.map((_, index) => (
                    <button key={index} onClick={() => setCurrentTestimonial(index)} className={`h-2 w-2 rounded-full transition-colors ${index === currentTestimonial ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div id="pricing" className="bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <motion.div className="mx-auto max-w-2xl text-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Transform Your Insurance Analysis?</h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-100">Join thousands of companies already using our AI-powered platform to save time, reduce costs, and make better insurance decisions.</p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <button onClick={() => router.push('/register')} className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-indigo-600 shadow-sm hover:bg-gray-50 transition-all duration-300 hover:scale-105">
                  Start Your Free Trial
                </button>
                <button onClick={() => router.push('/login')} className="text-lg font-semibold leading-6 text-white hover:text-indigo-100 transition-colors">
                  Learn more <span aria-hidden="true">→</span>
                </button>
              </div>
              <p className="mt-6 text-sm text-indigo-200">14-day free trial • No credit card required • Cancel anytime</p>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">🛡️ InsureAI</span>
            </div>
            <p className="text-sm text-gray-400">© 2024 InsureAI Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
