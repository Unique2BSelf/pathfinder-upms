"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, CheckCircle, AlertCircle, CreditCard } from "lucide-react";

interface StripeConfig {
  stripe_secret_key: string;
  stripe_publishable_key: string;
  stripe_webhook_secret: string;
  isConfigured: boolean;
}

export default function StripeSettingsPage() {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  
  const [config, setConfig] = useState<StripeConfig>({
    stripe_secret_key: "",
    stripe_publishable_key: "",
    stripe_webhook_secret: "",
    isConfigured: false,
  });

  useEffect(() => {
    // In production, fetch from stripe_config table
    // For now, check environment variables
    const hasEnvKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (hasEnvKey) {
      setConfig(prev => ({ ...prev, isConfigured: true }));
    }
  }, []);

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    
    try {
      // In production: save to stripe_config table via API
      // For now, just simulate save and show instructions
      
      // Store in localStorage for demo
      if (typeof window !== 'undefined') {
        localStorage.setItem('stripe_config', JSON.stringify({
          stripe_secret_key: config.stripe_secret_key,
          stripe_publishable_key: config.stripe_publishable_key,
        }));
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setError("");
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1.00,
          description: 'Test payment',
          paymentType: 'other',
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Stripe connection successful! Redirect to: ' + data.url);
      } else {
        setError(data.error || 'Connection test failed');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Stripe Payments</h1>
          <p className="text-slate-500">Configure payment processing</p>
        </div>
      </div>

      {/* Status Card */}
      <div className={`rounded-xl p-6 mb-6 ${config.isConfigured ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-center gap-3">
          {config.isConfigured ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <AlertCircle className="w-6 h-6 text-amber-600" />
          )}
          <div>
            <p className="font-semibold text-slate-800">
              {config.isConfigured ? 'Stripe Connected' : 'Stripe Not Configured'}
            </p>
            <p className="text-sm text-slate-600">
              {config.isConfigured 
                ? 'Payment processing is active'
                : 'Add your API keys to enable payments'
              }
            </p>
          </div>
        </div>
      </div>

      {/* API Keys Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">API Configuration</h2>
        
        <div className="space-y-4">
          {/* Secret Key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Stripe Secret Key
            </label>
            <div className="relative">
              <input
                type={showKeys.secret ? 'text' : 'password'}
                value={config.stripe_secret_key}
                onChange={(e) => setConfig({ ...config, stripe_secret_key: e.target.value })}
                placeholder="sk_live_..."
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('secret')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKeys.secret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Starts with sk_live_</p>
          </div>

          {/* Publishable Key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Stripe Publishable Key
            </label>
            <div className="relative">
              <input
                type={showKeys.publishable ? 'text' : 'password'}
                value={config.stripe_publishable_key}
                onChange={(e) => setConfig({ ...config, stripe_publishable_key: e.target.value })}
                placeholder="pk_live_..."
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('publishable')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKeys.publishable ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Starts with pk_live_</p>
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Webhook Signing Secret
            </label>
            <div className="relative">
              <input
                type={showKeys.webhook ? 'text' : 'password'}
                value={config.stripe_webhook_secret}
                onChange={(e) => setConfig({ ...config, stripe_webhook_secret: e.target.value })}
                placeholder="whsec_..."
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('webhook')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKeys.webhook ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">For receiving payment webhooks</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
          
          <button
            onClick={testConnection}
            className="px-6 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg"
          >
            Test Connection
          </button>
        </div>

        {saved && (
          <p className="mt-4 text-green-600 font-medium">Configuration saved!</p>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-slate-50 rounded-xl p-6">
        <h3 className="font-semibold text-slate-800 mb-3">How to get your Stripe keys:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
          <li>Go to <a href="https://dashboard.stripe.com" target="_blank" className="text-purple-600 hover:underline">stripe.com</a> and create an account</li>
          <li>Navigate to <strong>Developers → API Keys</strong></li>
          <li>Copy your <strong>Secret Key</strong> (starts with sk_live_)</li>
          <li>Copy your <strong>Publishable Key</strong> (starts with pk_live_)</li>
          <li>Go to <strong>Developers → Webhooks</strong> and create endpoint:</li>
          <li className="ml-4 text-xs font-mono bg-slate-200 px-2 py-1 rounded inline">
            yourdomain.com/api/stripe/webhook
          </li>
          <li>Copy the <strong>Signing Secret</strong> (starts with whsec_)</li>
        </ol>
      </div>
    </div>
  );
}
