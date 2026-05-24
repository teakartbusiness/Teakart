import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(
  file: Buffer,
  folder: string
): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder }, (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({ url: result.secure_url, public_id: result.public_id });
      })
      .end(file);
  });
}

export async function deleteImage(public_id: string): Promise<void> {
  await cloudinary.uploader.destroy(public_id);
}
