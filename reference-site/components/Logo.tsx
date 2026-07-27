import Image from 'next/image';

/**
 * Brand logo (CoachX wordmark) with an optional "powered by Tamil Business
 * Tribe" caption beneath it. Native aspect ratio 1617×444 (≈3.64:1).
 */
export function Logo({
  height = 34,
  poweredBy = false,
  priority = false,
  className = '',
  captionClassName = 'text-slate-500',
}: {
  height?: number;
  poweredBy?: boolean;
  priority?: boolean;
  className?: string;
  captionClassName?: string;
}) {
  const width = Math.round(height * (1617 / 444));
  return (
    <span className={`inline-flex flex-col items-start leading-none ${className}`}>
      <Image
        src="/brand/coachx-logo.png"
        alt="CoachX"
        width={width}
        height={height}
        priority={priority}
        style={{ height, width: 'auto' }}
      />
      {poweredBy ? (
        <span className={`mt-1 text-[10px] font-medium tracking-wide ${captionClassName}`}>
          Powered by <span className="font-semibold">Tamil Business Tribe</span>
        </span>
      ) : null}
    </span>
  );
}
