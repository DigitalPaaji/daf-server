import fs from "fs";
import path from "path";

interface RemoveImageParams {
  imgpath: string;
}

export const removeImage = async ({ imgpath }: RemoveImageParams) => {
  try {
    if (!imgpath) return;

    // 🔒 Normalize path (remove leading slash)
    const safePath = imgpath.startsWith("/")
      ? imgpath.slice(1)
      : imgpath;

    const fullPath = path.join(process.cwd(), safePath);

    // ✅ Check file exists first
    await fs.promises.access(fullPath);

    // 🗑️ Delete file
    await fs.promises.unlink(fullPath);
  } catch (error: any) {
    // Ignore "file not found" errors
    if (error.code !== "ENOENT") {
      console.error("Image delete failed:", error);
    }
  }
};
