import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";

const removeExtension = (filename: string) => {
  return filename.split(".").slice(0, -1).join(".");
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: async (req, file) => ({
    folder: "AmarShop",

    public_id:
      Math.random().toString(36).substring(2) +
      "-" +
      Date.now() +
      "-" +
      file.fieldname +
      "-" +
      removeExtension(file.originalname),
  }),
});
export const fileUploader = multer({ storage: storage });
