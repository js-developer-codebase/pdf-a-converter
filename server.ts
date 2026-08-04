import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { convertToPdfa, extractPdfMetadata } from './src/lib/pdfa-converter';
import { validatePdfaCompliance } from './src/lib/pdfa-validator';
import { PdfMetadata, PdfaConformanceLevel } from './src/types';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB max
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes

  /**
   * Health & API Information Endpoint
   */
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'PDF/A Archival Converter API',
      version: '1.0.0',
      supportedConformanceLevels: ['PDF/A-1b', 'PDF/A-2b', 'PDF/A-3b', 'PDF/A-1a', 'PDF/A-2u'],
      endpoints: {
        convert: 'POST /api/convert-pdfa (multipart/form-data or application/json)',
        validate: 'POST /api/validate-pdfa (multipart/form-data or application/json)',
      },
    });
  });

  /**
   * POST /api/convert-pdfa
   * Converts a input PDF to PDF/A format with metadata.
   * Accepts both multipart/form-data (file upload) and application/json (base64 PDF).
   */
  app.post('/api/convert-pdfa', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    try {
      let pdfBuffer: Buffer | null = null;
      let rawFilename = 'document.pdf';
      let metadataInput: Partial<PdfMetadata> = {};

      const standardKeys = ['title', 'author', 'subject', 'keywords', 'creator', 'producer', 'conformanceLevel', 'creationDate', 'modDate', 'download', 'pdfBase64', 'filename', 'metadata'];
      let custom: Record<string, string> = {};

      // Handle multipart file upload vs JSON base64
      if (req.file) {
        pdfBuffer = req.file.buffer;
        rawFilename = req.file.originalname || 'document.pdf';
        
        for (const key of Object.keys(req.body)) {
          if (!standardKeys.includes(key)) {
            custom[key] = String(req.body[key]);
          }
        }

        metadataInput = {
          title: req.body.title,
          author: req.body.author,
          subject: req.body.subject,
          keywords: req.body.keywords,
          creator: req.body.creator,
          producer: req.body.producer,
          conformanceLevel: req.body.conformanceLevel as PdfaConformanceLevel,
          creationDate: req.body.creationDate,
          modDate: req.body.modDate,
          custom: custom
        };
      } else if (req.body.pdfBase64) {
        const base64Clean = req.body.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
        pdfBuffer = Buffer.from(base64Clean, 'base64');
        rawFilename = req.body.filename || 'document.pdf';
        
        if (req.body.metadata) {
          metadataInput = req.body.metadata;
        } else {
          for (const key of Object.keys(req.body)) {
            if (!standardKeys.includes(key)) {
              custom[key] = String(req.body[key]);
            }
          }
          metadataInput = {
            title: req.body.title,
            author: req.body.author,
            subject: req.body.subject,
            keywords: req.body.keywords,
            creator: req.body.creator,
            producer: req.body.producer,
            conformanceLevel: req.body.conformanceLevel,
            custom: custom
          };
        }
      }

      if (!pdfBuffer || pdfBuffer.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Missing PDF file. Upload a file via "file" parameter or pass "pdfBase64" string.',
        });
        return;
      }

      // Default metadata if not provided
      const pdfUint8 = new Uint8Array(pdfBuffer);
      const extracted = await extractPdfMetadata(pdfUint8);

      const title = metadataInput.title?.trim() || extracted.metadata.title || rawFilename.replace(/\.pdf$/i, '');
      const author = metadataInput.author?.trim() || extracted.metadata.author || 'Archival User';
      const subject = metadataInput.subject?.trim() || extracted.metadata.subject || 'Standard Archival Document';
      const keywords = metadataInput.keywords?.trim() || extracted.metadata.keywords || 'PDF/A, Archival, ISO 19005';
      const creator = metadataInput.creator?.trim() || 'PDF/A Conversion Engine';
      const producer = metadataInput.producer?.trim() || 'PDF/A Archival Service';
      const conformanceLevel = metadataInput.conformanceLevel || 'PDF/A-2b';

      const metadata: PdfMetadata = {
        title,
        author,
        subject,
        keywords,
        creator,
        producer,
        conformanceLevel,
        creationDate: metadataInput.creationDate,
        modDate: metadataInput.modDate,
        custom: metadataInput.custom,
      };

      // Convert to PDF/A
      const { pdfaBytes, finalMetadata } = await convertToPdfa(pdfUint8, metadata);
      const complianceReport = await validatePdfaCompliance(pdfaBytes, conformanceLevel);

      const baseName = rawFilename.replace(/\.pdf$/i, '');
      const outputFilename = `${baseName}-PDFA.pdf`;

      // Return mode: if direct download requested or Accept is binary pdf
      const formatQuery = (req.query.format as string) || '';
      const downloadParam = req.query.download === 'true' || req.body.download === true;
      const acceptHeader = req.headers.accept || '';

      if (downloadParam || formatQuery === 'pdf' || (acceptHeader.includes('application/pdf') && !acceptHeader.includes('application/json'))) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(outputFilename)}"`);
        res.setHeader('X-PDFA-Conformance', conformanceLevel);
        res.setHeader('X-PDFA-Score', complianceReport.score.toString());
        res.send(Buffer.from(pdfaBytes));
        return;
      }

      // Otherwise return JSON with base64 PDF and compliance report
      const pdfaBase64 = Buffer.from(pdfaBytes).toString('base64');

      res.json({
        success: true,
        message: 'Successfully converted document to PDF/A archival standard format.',
        filename: outputFilename,
        pdfBase64: `data:application/pdf;base64,${pdfaBase64}`,
        metadata: finalMetadata,
        complianceReport,
        processedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('PDF/A Conversion Error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to convert document to PDF/A format.',
        details: err.message || String(err),
      });
    }
  });

  /**
   * POST /api/validate-pdfa
   * Analyzes an uploaded PDF for PDF/A compliance without modifying it.
   */
  app.post('/api/validate-pdfa', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    try {
      let pdfBuffer: Buffer | null = null;
      let level: PdfaConformanceLevel = (req.body.conformanceLevel as PdfaConformanceLevel) || 'PDF/A-2b';

      if (req.file) {
        pdfBuffer = req.file.buffer;
      } else if (req.body.pdfBase64) {
        const base64Clean = req.body.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
        pdfBuffer = Buffer.from(base64Clean, 'base64');
      }

      if (!pdfBuffer || pdfBuffer.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Missing PDF file. Upload a file via "file" parameter or pass "pdfBase64" string.',
        });
        return;
      }

      const report = await validatePdfaCompliance(new Uint8Array(pdfBuffer), level);

      res.json({
        success: true,
        complianceReport: report,
        evaluatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'Validation failed.',
        details: err.message || String(err),
      });
    }
  });

  // Vite Middleware in Development, Static Serving in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
