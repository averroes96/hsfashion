import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import path from 'path';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface ProcessedImages {
  originalUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  fullUrl: string;
}

export async function processAndSaveImage(fileBuffer: Buffer, originalFilename: string): Promise<ProcessedImages> {
  const baseName = path.parse(originalFilename).name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  // Create a Promise to handle the stream upload to Cloudinary
  const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'hsfashion', // Organize uploads into a specific folder
        public_id: `${Date.now()}_${baseName}`,
        resource_type: 'image',
        format: 'webp', // Standardize format to webp for better performance
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as UploadApiResponse);
      }
    );

    uploadStream.end(fileBuffer);
  });

  // Generate transformed URLs using Cloudinary's dynamic URL generation
  const publicId = uploadResult.public_id;
  const version = uploadResult.version;
  const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;

  return {
    originalUrl: `${baseUrl}/v${version}/${publicId}.webp`,
    // Thumbnail (300x300, cover fit)
    thumbnailUrl: `${baseUrl}/c_fill,w_300,h_300,q_80/v${version}/${publicId}.webp`,
    // Medium (800x800, inside fit)
    mediumUrl: `${baseUrl}/c_fit,w_800,h_800,q_85/v${version}/${publicId}.webp`,
    // Full (1600x1600, inside fit)
    fullUrl: `${baseUrl}/c_fit,w_1600,h_1600,q_90/v${version}/${publicId}.webp`,
  };
}
