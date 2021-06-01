import path from 'path';
import fs from 'fs-extra';
import Pinata from '@pinata/sdk';
import nc from 'next-connect';
import Multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const { PINATA_API_KEY, PINATA_API_SECRET } = process.env;

const pinata = Pinata(PINATA_API_KEY, PINATA_API_SECRET);

const handler = nc({
  onError: (err, req, res) => {
    console.error(err);
    res.status(500).json({ error: `Error: ${err}` });
  },
  onNoMatch: (req, res) => {
    res.status(405).json({ error: `Method '${req.method}' not allowed` });
  },
});

handler.use(
  Multer({
    storage: Multer.diskStorage({
      destination(req, file, cb) {
        const { id } = req.body;
        const outDir = path.resolve(process.cwd(), `tmp/${id}`);
        fs.ensureDir(outDir).then(() => {
          cb(null, outDir);
        });
      },
      filename(req, file, cb) {
        const { id } = req.body;
        const outDir = path.resolve(process.cwd(), `tmp/${id}`);
        const fileName = file.originalname
          .split(path.sep)
          .slice(1)
          .join(path.sep);
        const filePath = path.resolve(outDir, fileName);
        fs.ensureDir(path.dirname(filePath)).then(() => {
          cb(null, fileName);
        });
      },
    }),
    preservePath: true,
  }).array('files'),
);

handler.post(async (req, res) => {
  const outDir = req.files[0].destination;

  try {
    const r = await pinata.pinFromFS(outDir, {
      pinataOptions: {
        cidVersion: 1,
      },
    });

    res.status(200).json({ cid: r.IpfsHash });
  } finally {
    await fs.remove(outDir);
  }
});

export default handler;

export const config = {
  api: {
    bodyParser: false,
  },
};