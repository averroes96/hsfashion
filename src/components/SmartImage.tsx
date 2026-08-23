'use client';
import { useState, useRef, useEffect } from 'react';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperStyle?: React.CSSProperties;
}

export default function SmartImage({ src, alt, className, style, wrapperStyle, ...props }: SmartImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <div 
      className={`${!isLoaded && !hasError ? 'skeleton-bg' : ''} ${className || ''}`} 
      style={{ 
        position: 'relative', 
        overflow: 'hidden', 
        backgroundColor: !isLoaded && !hasError ? 'var(--border-color)' : 'transparent',
        ...wrapperStyle 
      }}
    >
      <img
        ref={imgRef}
        src={hasError ? '/placeholder.jpg' : src}
        alt={alt || ''}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        style={{
          ...style,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
        {...props}
      />
    </div>
  );
}
