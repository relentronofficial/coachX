'use client';

import { useState } from 'react';
import { faqs } from '@/lib/site';
import { SectionHeading } from './ui';

/** Accessible FAQ accordion (single-open). */
export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" />
      <div className="divide-y divide-slate-200 overflow-hidden rounded-card border border-slate-200 bg-white">
        {faqs.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-semibold text-ink">{item.q}</span>
                <span className={`text-teal transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
              </button>
              <div className={`grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-slate-500">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
