"use client";
import { useState } from 'react';

interface SafeProductImageProps {
  imageUrl?: string | null;
  alt?: string;
  className?: string;
  wrapperClassName?: string;
}

export default function SafeProductImage({
  imageUrl,
  alt = 'product image',
  className = '',
  wrapperClassName = '',
}: SafeProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const showImage = Boolean(imageUrl) && !hasError;

  return (
    <div className={wrapperClassName}>
      {showImage ? (
        <img
          src={imageUrl as string}
          alt={alt}
          loading="lazy"
          className={className}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex h-full min-h-[180px] items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-slate-400">
          <div className="text-center px-4">
            <div className="mb-3 text-4xl">🎁</div>
            <p className="text-sm font-semibold">Фото скоро</p>
          </div>
        </div>
      )}
    </div>
  );
}
