import Image from "next/image";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image src="/icons/icon-192.png" alt="" width={size} height={size} className="rounded-[22%]" priority />
      <span className="font-mono text-[15px] font-semibold tracking-[0.12em] uppercase">
        Figure<span className="text-accent">.</span>09
      </span>
    </span>
  );
}
