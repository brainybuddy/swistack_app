'use client';

import { useState } from 'react';
import {
  CreditCard,
  Check,
  X,
  TrendingUp,
  Download,
  AlertCircle,
  Calendar,
  DollarSign,
  Zap,
  Shield,
  Users,
  HardDrive,
  Globe,
  Rocket,
  ChevronRight,
  Info,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
}

interface UsageMetric {
  name: string;
  used: number;
  limit: number | 'Unlimited';
  unit: string;
  icon: any;
}

export default function BillingView() {
  const [currentPlan, setCurrentPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card-1');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      yearlyPrice: 0,
      description: 'Perfect for trying out Swistack',
      features: [
        '5 Active Projects',
        '1GB Storage',
        'Community Support',
        'Public Repositories',
        'Basic Templates',
        'Limited Deployments'
      ],
      notIncluded: [
        'Team Collaboration',
        'Private Repositories',
        'Priority Support',
        'Custom Domains',
        'Advanced Analytics'
      ],
      current: false,
      recommended: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19,
      yearlyPrice: 190,
      description: 'Everything you need for professional development',
      features: [
        'Unlimited Projects',
        '50GB Storage',
        'Priority Support',
        'Unlimited Private Repos',
        'Premium Templates',
        'Unlimited Deployments',
        'Custom Domains',
        'Advanced Analytics',
        'CI/CD Integration',
        'Database Hosting'
      ],
      notIncluded: [
        'Dedicated Support',
        'SSO Integration',
        'SLA Guarantee'
      ],
      current: true,
      recommended: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      yearlyPrice: 990,
      description: 'Advanced features for teams and organizations',
      features: [
        'Everything in Pro',
        'Unlimited Storage',
        'Dedicated Support',
        'SSO Integration',
        'SLA Guarantee',
        'Custom Templates',
        'White Labeling',
        'Advanced Security',
        'Audit Logs',
        'Priority Infrastructure'
      ],
      notIncluded: [],
      current: false,
      recommended: false
    }
  ];

  const currentPlanDetails = plans.find(p => p.id === currentPlan) || plans[1];

  const invoices: Invoice[] = [
    {
      id: 'INV-2024-001',
      date: 'Jan 1, 2024',
      amount: 19.00,
      status: 'paid',
      description: 'Pro Plan - Monthly'
    },
    {
      id: 'INV-2023-012',
      date: 'Dec 1, 2023',
      amount: 19.00,
      status: 'paid',
      description: 'Pro Plan - Monthly'
    },
    {
      id: 'INV-2023-011',
      date: 'Nov 1, 2023',
      amount: 19.00,
      status: 'paid',
      description: 'Pro Plan - Monthly'
    },
    {
      id: 'INV-2023-010',
      date: 'Oct 1, 2023',
      amount: 19.00,
      status: 'paid',
      description: 'Pro Plan - Monthly'
    },
    {
      id: 'INV-2023-009',
      date: 'Sep 1, 2023',
      amount: 19.00,
      status: 'paid',
      description: 'Pro Plan - Monthly'
    }
  ];

  const usageMetrics: UsageMetric[] = [
    {
      name: 'Projects',
      used: 12,
      limit: 'Unlimited',
      unit: 'projects',
      icon: Rocket
    },
    {
      name: 'Storage',
      used: 8.5,
      limit: 50,
      unit: 'GB',
      icon: HardDrive
    },
    {
      name: 'Team Members',
      used: 4,
      limit: 10,
      unit: 'members',
      icon: Users
    },
    {
      name: 'Deployments',
      used: 156,
      limit: 'Unlimited',
      unit: 'this month',
      icon: Globe
    },
    {
      name: 'Build Minutes',
      used: 1250,
      limit: 5000,
      unit: 'minutes',
      icon: Clock
    },
    {
      name: 'Bandwidth',
      used: 25.3,
      limit: 100,
      unit: 'GB',
      icon: TrendingUp
    }
  ];

  const paymentMethods = [
    {
      id: 'card-1',
      type: 'visa',
      last4: '4242',
      expiry: '12/25',
      isDefault: true
    },
    {
      id: 'card-2',
      type: 'mastercard',
      last4: '5555',
      expiry: '06/24',
      isDefault: false
    }
  ];

  const calculateUsagePercentage = (used: number, limit: number | 'Unlimited') => {
    if (limit === 'Unlimited') return 0;
    return Math.round((used / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-400 bg-red-500/20';
    if (percentage >= 75) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-teal-400 bg-teal-500/20';
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white mb-2">Billing & Subscription</h1>
          <p className="text-sm text-gray-400">Manage your subscription, payment methods, and billing history</p>
        </div>

        {/* Current Plan Overview */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-xl font-semibold text-white">Current Plan: {currentPlanDetails.name}</h2>
                <span className="px-3 py-1 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>
              <p className="text-sm text-gray-400">{currentPlanDetails.description}</p>
              <div className="flex items-center space-x-4 mt-3 text-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-white">${currentPlanDetails.price}/month</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">Next billing: Feb 1, 2024</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium">
                Change Plan
              </button>
              <button className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm">
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Usage Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Usage Metrics */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Usage This Month</h3>
              <div className="grid grid-cols-2 gap-4">
                {usageMetrics.map((metric) => {
                  const percentage = calculateUsagePercentage(metric.used, metric.limit);
                  const colorClass = getUsageColor(percentage);
                  
                  return (
                    <div key={metric.name} className="bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <metric.icon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-white">{metric.name}</span>
                        </div>
                        {metric.limit !== 'Unlimited' && percentage >= 75 && (
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex items-baseline space-x-1 mb-2">
                        <span className="text-2xl font-semibold text-white">{metric.used}</span>
                        <span className="text-sm text-gray-400">
                          {metric.limit === 'Unlimited' ? metric.unit : `/ ${metric.limit} ${metric.unit}`}
                        </span>
                      </div>
                      {metric.limit !== 'Unlimited' && (
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${colorClass}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Billing History</h3>
                <button className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                    <div className="flex items-center space-x-4">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{invoice.description}</p>
                        <p className="text-xs text-gray-400">{invoice.id} • {invoice.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-white">${invoice.amount.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        invoice.status === 'paid' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : invoice.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {invoice.status}
                      </span>
                      <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                        <Download className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-6">
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Payment Methods</h3>
                <button className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
                  Add New
                </button>
              </div>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id 
                        ? 'bg-teal-500/10 border-teal-500/30'
                        : 'border-gray-700 hover:bg-gray-800/50'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {method.type.charAt(0).toUpperCase() + method.type.slice(1)} ****{method.last4}
                          </p>
                          <p className="text-xs text-gray-400">Expires {method.expiry}</p>
                        </div>
                      </div>
                      {method.isDefault && (
                        <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Spending Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">This Month</span>
                  <span className="text-lg font-semibold text-white">$19.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Last Month</span>
                  <span className="text-lg font-semibold text-white">$19.00</span>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total This Year</span>
                    <span className="text-lg font-semibold text-white">$228.00</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-400">Saved with yearly</span>
                    <span className="text-sm text-green-400">Could save $38/year</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Available Plans</h3>
          
          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gray-900/50 rounded-lg p-1 flex items-center">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly (Save 17%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-lg p-6 transition-all ${
                  plan.current
                    ? 'bg-teal-500/10 border-2 border-teal-500'
                    : 'bg-gray-900/50 border border-gray-700'
                }`}
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-white">{plan.name}</h4>
                    {plan.recommended && (
                      <span className="px-2 py-0.5 bg-teal-600 text-xs font-medium rounded-full">
                        Recommended
                      </span>
                    )}
                    {plan.current && (
                      <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 text-xs font-medium rounded-full border border-teal-500/30">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{plan.description}</p>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-bold text-white">
                      ${billingCycle === 'yearly' ? Math.floor(plan.yearlyPrice / 12) : plan.price}
                    </span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  {billingCycle === 'yearly' && plan.price > 0 && (
                    <p className="text-xs text-green-400 mt-1">
                      Save ${(plan.price * 12 - plan.yearlyPrice)} per year
                    </p>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm opacity-50">
                      <X className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-500">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                    plan.current
                      ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                      : plan.recommended
                      ? 'bg-teal-600 hover:bg-teal-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}