// routes/cutting.route.ts
import { Router, Request, Response } from 'express';
import { appendToSheet } from '../utils/google-sheets';
import { CuttingSummaryPayload } from '../types';

const router = Router();

// POST /api/cutting/production → Summary
router.post('/production', async (req: Request, res: Response) => {
  const body = req.body as CuttingSummaryPayload;

  if (!body.entries || !Array.isArray(body.entries)) {
    return res
      .status(400)
      .json({ error: 'Field "entries" wajib dan harus array' });
  }

  try {
    const rows = body.entries.map((entry) => [
      new Date(body.timestamp).toLocaleString('id-ID'),
      body.shift,
      body.group,
      body.time,
      entry.customer || '-',
      entry.customerPO || '-',
      entry.poNumber || '-',
      entry.sku || '-',
      entry.sCode || '-',
      entry.quantityOrder || 0,
      entry.quantityProduksi || 0,
      entry.remainQuantity || 0,
      entry.week || '-',
    ]);

    await appendToSheet('cutting', 'summary', rows);

    return res
      .status(201)
      .json({ message: 'Data summary berhasil dikirim ke Google Sheet' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/cutting → Balok
router.post('/', async (req: Request, res: Response) => {
  const { productionDate, shift, operator, actuals } = req.body;

  if (!actuals || !Array.isArray(actuals)) {
    return res.status(400).json({ error: 'Data actuals tidak valid' });
  }

  try {
    const rows = actuals.map((act: any) => [
      productionDate,
      shift,
      req.body.machine || '-',
      operator,
      req.body.time || '-',
      '-', // plan density (optional ambil dari balok[0])
      '-', // plan ILD
      '-', // plan colour
      0,
      0,
      0,
      '-',
      0, // plan lainnya
      act.density,
      act.ild,
      act.colour,
      act.length,
      act.width,
      act.height,
      act.qtyBalok,
      act.qtyProduksi,
      act.reSize,
      act.jdfWeight,
      act.remark,
      act.descript,
      req.body.week || '-',
    ]);

    await appendToSheet('cutting', 'balok', rows);
    return res.status(201).json({ message: 'Data balok berhasil dikirim' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
