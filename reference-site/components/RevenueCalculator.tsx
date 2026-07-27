'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatINR, INR_SYMBOL } from '@/lib/currency';

interface Inputs {
  leads: number; // new leads per month
  conversion: number; // % of leads who buy
  price: number; // price per client (₹)
  repeat: number; // avg months a client stays / repeat purchases
}

const defaults: Inputs = { leads: 200, conversion: 3, price: 15000, repeat: 1 };

export function RevenueCalculator() {
  const [inp, setInp] = useState<Inputs>(defaults);

  const calc = useMemo(() => {
    const leads = Math.max(0, inp.leads);
    const conv = Math.max(0, Math.min(100, inp.conversion)) / 100;
    const price = Math.max(0, inp.price);
    const repeat = Math.max(1, inp.repeat);
    const clients = leads * conv;
    const monthly = clients * price;
    const monthlyWithRepeat = monthly * repeat;
    return {
      clients,
      monthly: monthlyWithRepeat,
      yearly: monthlyWithRepeat * 12,
      perClient: price * repeat,
    };
  }, [inp]);

  const set = (k: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setInp((s) => ({ ...s, [k]: Number.isFinite(v) ? v : 0 }));
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-5">
      {/* Inputs */}
      <div className="lg:col-span-3">
        <div className="rounded-card border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <h2 className="text-xl font-bold text-ink">Your numbers</h2>
          <p className="mt-1 text-sm text-slate-500">Drag the sliders or type values — results update live.</p>

          <div className="mt-6 space-y-6">
            <SliderRow label="New leads per month" value={inp.leads} min={0} max={2000} step={10} suffix="leads" onChange={set('leads')} />
            <SliderRow label="Lead → client conversion" value={inp.conversion} min={0} max={30} step={0.5} suffix="%" onChange={set('conversion')} />
            <SliderRow label="Price per client" value={inp.price} min={0} max={200000} step={1000} prefix={INR_SYMBOL} onChange={set('price')} />
            <SliderRow label="Repeat / months per client" value={inp.repeat} min={1} max={12} step={1} suffix="×" onChange={set('repeat')} />
          </div>

          <button
            type="button"
            onClick={() => setInp(defaults)}
            className="mt-6 text-sm font-semibold text-teal hover:underline"
          >
            ↺ Reset to example
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-2">
        <div className="sticky top-28 rounded-card border-2 border-teal bg-ink p-6 text-white shadow-glow sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber">Projected revenue</p>
          <div className="mt-4">
            <p className="text-sm text-slate-300">Monthly</p>
            <p className="text-3xl font-extrabold sm:text-4xl">{formatINR(calc.monthly)}</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/15 pt-5">
            <Stat label="Per year" value={formatINR(calc.yearly)} />
            <Stat label="New clients / mo" value={calc.clients.toFixed(calc.clients < 10 ? 1 : 0)} />
            <Stat label="Value / client" value={formatINR(calc.perClient)} />
            <Stat label="Conversion" value={`${inp.conversion}%`} />
          </div>
          <Link href="/masterclass" className="btn-amber mt-6 w-full">
            Build this system — reserve your spot
          </Link>
          <p className="mt-3 text-center text-xs text-slate-400">Estimates only — a planning aid, not a guarantee.</p>
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  prefix,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-ink">{label}</label>
        <div className="flex items-center gap-1 rounded-pill border border-slate-200 px-3 py-1 text-sm font-bold text-ink">
          {prefix ? <span className="text-slate-400">{prefix}</span> : null}
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={onChange}
            className="w-20 bg-transparent text-right outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          {suffix ? <span className="text-slate-400">{suffix}</span> : null}
        </div>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        className="mt-3 w-full accent-teal"
        aria-label={label}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}
