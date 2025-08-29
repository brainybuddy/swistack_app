'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  Code2, 
  Zap, 
  Shield, 
  Globe, 
  Rocket, 
  ChevronRight,
  Star,
  Users,
  GitBranch,
  Cloud,
  Lock,
  Sparkles,
  ArrowRight,
  Check,
  Menu,
  X
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Code2 className="w-6 h-6" />,
      title: 'Intelligent Code Editor',
      description: 'AI-powered code completion and real-time collaboration'
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: 'Cloud Development',
      description: 'Develop from anywhere with cloud-based workspaces'
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: 'Git Integration',
      description: 'Built-in version control with seamless Git operations'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure by Design',
      description: 'Enterprise-grade security with end-to-end encryption'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      description: 'Optimized performance for instant code execution'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Deploy Anywhere',
      description: 'One-click deployment to multiple cloud providers'
    }
  ];

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for individual developers',
      features: [
        '5 Active Projects',
        '1GB Storage',
        'Basic Templates',
        'Community Support',
        'Public Repositories'
      ],
      cta: 'Get Started',
      highlighted: false
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/month',
      description: 'For professional developers',
      features: [
        'Unlimited Projects',
        '50GB Storage',
        'Premium Templates',
        'Priority Support',
        'Private Repositories',
        'Advanced Collaboration',
        'CI/CD Integration'
      ],
      cta: 'Start Free Trial',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Unlimited Storage',
        'Custom Templates',
        'Dedicated Support',
        'SSO Integration',
        'Advanced Security',
        'SLA Guarantee'
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-900/80 backdrop-blur-lg z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Swistack</span>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-6">
                  <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
                  <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">Docs</a>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">Blog</a>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => router.push('/login')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => router.push('/register')}
                className="bg-teal-600 px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                Get Started
              </button>
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-b border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#features" className="block text-gray-300 hover:text-white px-3 py-2">Features</a>
              <a href="#pricing" className="block text-gray-300 hover:text-white px-3 py-2">Pricing</a>
              <a href="#" className="block text-gray-300 hover:text-white px-3 py-2">Docs</a>
              <a href="#" className="block text-gray-300 hover:text-white px-3 py-2">Blog</a>
              <button 
                onClick={() => router.push('/login')}
                className="block w-full text-left text-gray-300 hover:text-white px-3 py-2"
              >
                Sign In
              </button>
              <button 
                onClick={() => router.push('/register')}
                className="block w-full text-left bg-teal-600 px-3 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-teal-300">Introducing Swistack 2.0</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
              Code in the Cloud,
              <br />Deploy Everywhere
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10">
              The modern development platform that brings your ideas to life. 
              Write, test, and deploy code directly from your browser with AI-powered assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.push('/register')}
                className="inline-flex items-center px-8 py-4 bg-teal-600 rounded-lg font-semibold text-lg hover:bg-teal-700 transition-colors"
              >
                Start Building for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button className="inline-flex items-center px-8 py-4 bg-gray-800 border border-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-700 transition-colors">
                Watch Demo
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
            <div className="mt-12 flex items-center justify-center space-x-8 text-gray-500 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>100K+ Developers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Rocket className="w-4 h-4" />
                <span>1M+ Deployments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Build</h2>
            <p className="text-xl text-gray-400">Powerful features to accelerate your development workflow</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:bg-gray-800/70 transition-all hover:transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-4">
                  <div className="text-teal-400">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-400">Choose the plan that fits your needs</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`rounded-2xl p-8 ${
                  plan.highlighted 
                    ? 'bg-teal-500/20 border-2 border-teal-500 scale-105' 
                    : 'bg-gray-800/50 border border-gray-700'
                }`}
              >
                {plan.highlighted && (
                  <div className="text-center mb-4">
                    <span className="bg-teal-600 text-xs font-semibold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-gray-400">{plan.period}</span>}
                  </div>
                  <p className="text-gray-400 mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => router.push('/register')}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-teal-600 hover:bg-teal-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Development?</h2>
          <p className="text-xl text-gray-400 mb-10">
            Join thousands of developers building the future with Swistack
          </p>
          <button 
            onClick={() => router.push('/register')}
            className="inline-flex items-center px-8 py-4 bg-teal-600 rounded-xl font-semibold text-lg hover:bg-teal-700 transition-colors"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Swistack</span>
              </div>
              <p className="text-gray-400 text-sm">
                The modern cloud development platform for the next generation of builders.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p>© 2024 Swistack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}