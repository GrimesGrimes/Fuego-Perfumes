import DomeGallery from './DomeGallery';
import { getIconicProducts } from '../data/products';

export default function IconicDomeSection() {
  const iconic = getIconicProducts();

  const images = iconic.map((p) => ({
    src: p.image,
    alt: `${p.inspiredByName} — ${p.house}`
  }));

  return (
    <section id="iconicas" className="py-16 lg:py-24 overflow-hidden bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">
            Seleccion Premium
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Fragancias Iconicas
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Las fragancias mas deseadas del mundo, ahora a tu alcance
          </p>
        </div>

        <div className="relative h-[520px] sm:h-[620px] lg:h-[680px] rounded-3xl border border-white/10 bg-gradient-to-b from-surface/40 to-black overflow-hidden">
          <DomeGallery
            images={images}
            fit={0.52}
            minRadius={420}
            overlayBlurColor="#060010"
            imageBorderRadius="22px"
            openedImageBorderRadius="26px"
            openedImageWidth="420px"
            openedImageHeight="420px"
            grayscale={false}
            autoplay
            autoplaySpeedDegPerSec={7.0}
          />
        </div>
      </div>
    </section>
  );
}
