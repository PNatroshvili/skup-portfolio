import type { ProjectImages } from "@/lib/types";

const shadow = "shadow-[0_28px_60px_-24px_rgba(0,0,0,0.9)]";

function Laptop({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="w-full">
      <div className={`rounded-t-[10px] border border-white/12 bg-[#1b1b1e] p-[5px] ${shadow}`}>
        <div className="aspect-[16/10] overflow-hidden rounded-[5px] bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover object-top" />
        </div>
      </div>
      {/* Hinge + base, slightly wider than the lid like a real laptop. */}
      <div className="relative left-1/2 h-[9px] w-[108%] -translate-x-1/2 rounded-b-[9px] border-x border-b border-white/10 bg-linear-to-b from-[#242427] to-[#0f0f11]">
        <div className="absolute left-1/2 top-0 h-[3px] w-[13%] -translate-x-1/2 rounded-b-full bg-black/60" />
      </div>
    </div>
  );
}

function Tablet({ src, alt }: { src: string; alt: string }) {
  return (
    <div className={`rounded-[15px] border border-white/12 bg-[#1b1b1e] p-[5px] ${shadow}`}>
      <div className="aspect-[3/4] overflow-hidden rounded-[11px] bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover object-top" />
      </div>
    </div>
  );
}

function Phone({ src, alt }: { src: string; alt: string }) {
  return (
    <div className={`relative rounded-[19px] border border-white/14 bg-[#1b1b1e] p-[4px] ${shadow}`}>
      <div className="relative aspect-[390/844] overflow-hidden rounded-[16px] bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover object-top" />
      </div>
      {/* Speaker pill */}
      <div className="absolute left-1/2 top-[7px] h-[3px] w-[26%] -translate-x-1/2 rounded-full bg-black/80" />
    </div>
  );
}

/**
 * Layered device composition: laptop leading, tablet set back on the left and
 * the phone overlapping in front — so each viewport reads in its own frame
 * instead of three flat screenshots stacked in one box.
 */
export default function DeviceShowcase({
  images,
  name,
}: {
  images: ProjectImages;
  name: string;
}) {
  return (
    <div className="relative w-full pb-[9%]">
      <div className="ml-auto w-[78%]">
        <Laptop src={images.desktop} alt={`${name} — desktop`} />
      </div>

      <div className="absolute bottom-[11%] left-0 w-[30%]">
        <Tablet src={images.tablet} alt={`${name} — tablet`} />
      </div>

      <div className="absolute bottom-0 left-[21%] w-[17%]">
        <Phone src={images.mobile} alt={`${name} — mobile`} />
      </div>
    </div>
  );
}
