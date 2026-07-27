import { useState, useEffect } from 'react';
import { IconChevronLeft, IconChevronRight } from './PremiumIcons';
import './ImageSlider.css';

interface ImageSliderProps {
  images: string[];
  autoPlay?: boolean;
  interval?: number;
}

const ImageSlider = ({ images, autoPlay = true, interval = 4000 }: ImageSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, images.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="image-slider">
      <div className="slider-images">
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`Slide ${index + 1}`}
            className={`slider-image ${index === currentIndex ? 'active' : ''}`}
            loading="lazy"
          />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            className="slider-arrow slider-arrow-left"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); goToPrevious(); }}
            aria-label="Previous image"
          >
            <IconChevronLeft size={24} strokeWidth={1.8} />
          </button>

          <button
            className="slider-arrow slider-arrow-right"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); goToNext(); }}
            aria-label="Next image"
          >
            <IconChevronRight size={24} strokeWidth={1.8} />
          </button>

          <div className="slider-dots">
            {images.map((_, index) => (
              <button
                key={index}
                className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setCurrentIndex(index); }}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageSlider;
