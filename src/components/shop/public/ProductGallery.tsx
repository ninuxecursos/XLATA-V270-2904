import { useState } from 'react';
import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const hasImages = images && images.length > 0;
  const currentImage = hasImages ? images[selectedIndex] : null;

  return (
    <div className="space-y-4">
      {/* Imagem Principal */}
      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
        {currentImage ? (
          <img
            src={currentImage}
            alt={productName}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tag className="w-24 h-24 text-gray-300" />
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {hasImages && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200",
                selectedIndex === index 
                  ? "border-emerald-500 ring-2 ring-emerald-500/30" 
                  : "border-gray-200 hover:border-gray-400"
              )}
            >
              <img
                src={image}
                alt={`${productName} - Imagem ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
