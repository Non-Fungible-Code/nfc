import Pinata from '@pinata/sdk';
import nc from 'next-connect';

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

handler.post(async (req, res) => {
  const { cid } = req.body;

  await pinata.unpin(cid);

  res.status(200).json({});
});

export default handler;
