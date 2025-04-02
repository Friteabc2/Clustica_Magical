import React from 'react';
import { AdvancedImage, lazyload, placeholder } from '@cloudinary/react';
import { Cloudinary } from '@cloudinary/url-gen';
import { fill, scale } from '@cloudinary/url-gen/actions/resize';
import { autoGravity, focusOn } from '@cloudinary/url-gen/qualifiers/gravity';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';
import { auto } from '@cloudinary/url-gen/qualifiers/quality';
import { webp } from '@cloudinary/url-gen/qualifiers/format';

// Initialiser l'instance Cloudinary
const cld = new Cloudinary({
  cloud: {
    cloudName: 'doh47zakc'
  }
});

interface CloudinaryImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'panoramic' | string;
  className?: string;
  fit?: 'fill' | 'scale' | 'crop';
  placeholder?: boolean;
}

/**
 * Composant d'image optimisé pour Cloudinary
 */
export function CloudinaryImage({
  src,
  alt,
  width,
  height,
  aspectRatio = 'landscape',
  className = '',
  fit = 'fill',
  placeholder: showPlaceholder = true
}: CloudinaryImageProps) {
  // Si l'image n'est pas une URL Cloudinary, utiliser une balise image standard
  if (!src || !src.includes('cloudinary.com')) {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        width={width}
        height={height}
        style={{ objectFit: fit === 'fill' ? 'cover' : fit === 'scale' ? 'contain' : 'cover' }}
      />
    );
  }
  
  // Extraire l'ID public de l'URL Cloudinary
  // Format attendu: https://res.cloudinary.com/doh47zakc/image/upload/v12345/path/to/image.jpg
  let publicId = src.split('/upload/').pop();
  
  // Gérer le cas où il y a une version v12345/
  if (publicId && publicId.match(/^v\d+\//)) {
    publicId = publicId.replace(/^v\d+\//, '');
  }
  
  if (!publicId) {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        width={width}
        height={height}
      />
    );
  }
  
  // Créer l'image avec la configuration Cloudinary
  const myImage = cld.image(publicId);
  
  // Appliquer des transformations
  myImage.delivery(quality(auto())); // Qualité automatique
  myImage.delivery(format(webp())); // Format WebP
  
  // Appliquer le redimensionnement selon le fit
  if (fit === 'fill') {
    if (width && height) {
      myImage.resize(fill().width(width).height(height).gravity(autoGravity()));
    } else if (width) {
      // Déterminer la hauteur en fonction du ratio d'aspect
      let ratio = 1;
      if (aspectRatio === 'landscape') ratio = 0.75; // 4:3
      else if (aspectRatio === 'portrait') ratio = 1.5; // 2:3
      else if (aspectRatio === 'panoramic') ratio = 0.33; // 3:1
      
      const calculatedHeight = Math.round(width * ratio);
      myImage.resize(fill().width(width).height(calculatedHeight).gravity(autoGravity()));
    } else if (height) {
      // Déterminer la largeur en fonction du ratio d'aspect
      let ratio = 1;
      if (aspectRatio === 'landscape') ratio = 1.33; // 4:3
      else if (aspectRatio === 'portrait') ratio = 0.67; // 2:3
      else if (aspectRatio === 'panoramic') ratio = 3; // 3:1
      
      const calculatedWidth = Math.round(height * ratio);
      myImage.resize(fill().width(calculatedWidth).height(height).gravity(autoGravity()));
    }
  } else if (fit === 'scale') {
    if (width && height) {
      myImage.resize(scale().width(width).height(height));
    } else if (width) {
      myImage.resize(scale().width(width));
    } else if (height) {
      myImage.resize(scale().height(height));
    }
  }
  
  // Plugins pour l'AdvancedImage
  const plugins = [];
  
  // Ajouter le lazy loading
  plugins.push(lazyload());
  
  // Ajouter un placeholder pendant le chargement
  if (showPlaceholder) {
    plugins.push(placeholder());
  }
  
  return (
    <div className={className}>
      <AdvancedImage cldImg={myImage} plugins={plugins} alt={alt} />
    </div>
  );
}