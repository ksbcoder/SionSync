const dotStyle = "w-3 h-3 rounded-full bg-brand-500";

export function DotLoader({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="flex gap-2">
        <span className={`${dotStyle} animate-dot-bounce [animation-delay:0ms]`} />
        <span className={`${dotStyle} animate-dot-bounce [animation-delay:150ms]`} />
        <span className={`${dotStyle} animate-dot-bounce [animation-delay:300ms]`} />
      </div>
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
}
