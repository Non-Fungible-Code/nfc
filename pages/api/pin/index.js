import path from 'path';
import fs from 'fs-extra';
import Pinata from '@pinata/sdk';
import nc from 'next-connect';
import Multer from 'multer';

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
        cb(null, 'tmp');
      },
      filename(req, file, cb) {
        const dirname = path.dirname(file.originalname);
        fs.ensureDir(`tmp/${dirname}`).then(() => {
          cb(null, file.originalname);
        });
      },
    }),
    preservePath: true,
  }).array('files'),
);

handler.post(async (req, res) => {
  const { name, id } = req.body;

  let r;

  r = await pinata.pinFromFS(path.resolve(process.cwd(), `tmp/${id}`), {
    pinataMetadata: {
      name,
    },
    pinataOptions: {
      cidVersion: 1,
    },
  });
  console.log(r);

  await fs.remove(`tmp/${id}`);

  res.status(200).json(r);
});

export default handler;

export const config = {
  api: {
    bodyParser: false,
  },
};
