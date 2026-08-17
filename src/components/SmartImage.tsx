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
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <div 
      className={`skeleton-bg ${className || ''}`} 
      style={{ 
        position: 'relative', 
        overflow: 'hidden', 
        backgroundColor: 'var(--border-color)',
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
          transition: 'opacity 0.5s ease-in-out',
        }}
        {...props}
      />
    </div>
  );
}
