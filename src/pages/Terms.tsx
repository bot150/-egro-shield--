import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, Info, Scale, Zap, Activity, Ban } from 'lucide-react';

export const Terms: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-5xl mx-auto pb-12">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-neutral-900 tracking-tighter">Policy Conditions & Exclusions</h1>
        <p className="text-xl text-neutral-500 font-medium max-w-2xl mx-auto">
          Understanding what is not covered is as important as knowing what is.
        </p>
      </div>

      {/* Standard Exclusions Section */}
      <div className="bg-white rounded-[40px] p-10 border border-neutral-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
            <Ban size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Standard Exclusions</h2>
            <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest">This policy does not cover losses caused by:</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "🪖", title: "War & Civil Unrest", desc: "Losses resulting from armed conflict or public disorder." },
            { icon: "🦠", title: "Pandemics", desc: "Widespread health crises (e.g., COVID-19 related lockdowns)." },
            { icon: "💣", title: "Terrorism Attacks", desc: "Acts of violence intended to create fear for political ends." },
            { icon: "⚖️", title: "Illegal Activities", desc: "Losses occurring while participating in unlawful acts." },
            { icon: "🍺", title: "Alcohol/Drug Influence", desc: "Incidents occurring under the influence of substances." },
            { icon: "🛠️", title: "Intentional Damage", desc: "Self-inflicted harm or deliberate property damage." },
          ].map((item, idx) => (
            <div key={idx} className="p-6 bg-neutral-50 rounded-3xl border border-transparent hover:border-neutral-200 transition-all group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">{item.icon}</div>
              <h3 className="text-lg font-black text-neutral-900 mb-2">{item.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Claim Verification Rules Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-emerald-50 rounded-[40px] p-10 border border-emerald-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Zap size={24} />
            </div>
            <h2 className="text-2xl font-black text-emerald-900 tracking-tight">Parametric Triggers</h2>
          </div>
          <p className="text-emerald-800 font-medium leading-relaxed">
            Weather claims are verified via hyper-local satellite data. No manual filing required. 
            Our system automatically detects disruptions and initiates payouts.
          </p>
        </div>

        <div className="bg-blue-50 rounded-[40px] p-10 border border-blue-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Activity size={24} />
            </div>
            <h2 className="text-2xl font-black text-blue-900 tracking-tight">Accident Verification</h2>
          </div>
          <p className="text-blue-800 font-medium leading-relaxed">
            Requires a valid police report (FIR) or hospital discharge summary within 48 hours of the incident.
            Documentation must be uploaded via the claims portal.
          </p>
        </div>
      </div>

      {/* Coverage Limits Section */}
      <div className="bg-amber-50 rounded-[40px] p-10 border border-amber-100 flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 bg-white text-amber-600 rounded-3xl flex items-center justify-center shadow-sm shrink-0">
          <Scale size={40} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-amber-900 tracking-tight mb-2">Coverage Limits</h2>
          <p className="text-lg text-amber-800 font-medium leading-relaxed">
            Maximum aggregate payout per user is capped at <span className="font-black">5x the annual premium paid</span>. 
            This ensures the sustainability of the collective protection pool.
          </p>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center p-8 bg-neutral-100 rounded-3xl border border-neutral-200">
        <div className="flex items-center justify-center gap-2 text-neutral-500 font-bold text-xs uppercase tracking-widest">
          <Info size={16} />
          <span>Last Updated: April 2026 • Policy Version 2.4</span>
        </div>
      </div>
    </div>
  );
};
