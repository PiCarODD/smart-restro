import { useState, useEffect } from 'react';

interface AdvertisingSlideshowProps {
  images: string[];
  interval?: number; // Time in milliseconds between slides (default: 5000)
}

/**
 * Advertising Slideshow Component
 * Displays images in a rotating slideshow format
 */
export function AdvertisingSlideshow({ images, interval = 5000 }: AdvertisingSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-black shadow-2xl">
      {/* TV Frame Effect */}
      <div className="absolute inset-0 border-4 border-gray-800 rounded-lg pointer-events-none z-10" 
           style={{ 
             boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 0 30px rgba(0,0,0,0.3)'
           }} 
      />
      
      {images.length === 0 ? (
        /* No Signal Display */
        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          {/* TV Static/Noise Effect */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px),
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)
              `,
              backgroundSize: '4px 4px',
            }}
          />
          
          {/* No Signal Text */}
          <div className="relative z-10 text-center px-4">
            <div className="text-white/40 text-6xl font-bold mb-4 tracking-wider">
              NO SIGNAL
            </div>
            <div className="text-white/30 text-sm font-mono">
              Please add advertisement images
            </div>
            <div className="mt-4 flex justify-center gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-white/20 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Images Container */}
          <div className="relative w-full h-full">
            {images.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentIndex ? 'opacity-100 z-0' : 'opacity-0 z-[-1]'
                }`}
              >
                <img
                  src={image}
                  alt={`Advertisement ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading={index === currentIndex ? 'eager' : 'lazy'}
                  onError={(e) => {
                    // Hide broken images
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

