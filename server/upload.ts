import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "uploads");
const subdirs = ["comprovantes", "fotos", "pdfs", "outros"];

subdirs.forEach(dir => {
  const dirPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.query.type as string || 'outros';
    let uploadPath = path.join(__dirname, "..", "uploads");
    
    switch (type) {
      case 'comprovante':
        uploadPath = path.join(uploadPath, "comprovantes");
        break;
      case 'foto':
        uploadPath = path.join(uploadPath, "fotos");
        break;
      case 'pdf':
        uploadPath = path.join(uploadPath, "pdfs");
        break;
      default:
        uploadPath = path.join(uploadPath, "outros");
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, sanitizedName + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const type = req.query.type as string;
  
  const allowedMimeTypes: Record<string, string[]> = {
    'foto': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    'comprovante': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    'pdf': ['application/pdf'],
  };
  
  const allowed = allowedMimeTypes[type] || [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'
  ];
  
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido para ${type}. Tipos aceitos: ${allowed.join(', ')}`));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});
