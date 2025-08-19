import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';
import puppeteer, { PDFOptions } from 'puppeteer';
import { CatalogDataDto } from '@dto/catalog.dto';
import { formatCurrency } from './formatCurrency';

export async function generateCatalogPDF(catalogData: CatalogDataDto): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'src', 'utils', 'templates', 'catalog-pdf.hbs');
  const templateHtml = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateHtml);

  // Registrar helpers de Handlebars
  handlebars.registerHelper('formatCurrency', (amount: number) => {
    return formatCurrency(amount, 'en-US', 'USD');
  });

  handlebars.registerHelper('eq', (a: unknown, b: unknown) => {
    return a === b;
  });

  handlebars.registerHelper('gt', (a: number, b: number) => {
    return a > b;
  });

  handlebars.registerHelper('add', (a: number, b: number) => {
    return a + b;
  });

  // Preparar datos para el template
  const html = template({
    ...catalogData,
    hasCategories: catalogData.categories.length > 0,
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-features=VizDisplayCompositor',
    ],
  });

  const page = await browser.newPage();

  // Configurar viewport y esperar por las imágenes
  await page.setViewport({ width: 1200, height: 800 });

  // Configurar el contenido con mejor manejo de imágenes
  await page.setContent(html, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
    timeout: 30000,
  });

  // Esperar un poco más para que las imágenes se carguen completamente
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const pdfOptions: PDFOptions = {
    format: 'A4',
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm',
    },
    printBackground: true,
    preferCSSPageSize: true,
    timeout: 60000,
  };

  const pdfBuffer = (await page.pdf(pdfOptions)) as Buffer;

  await browser.close();

  return pdfBuffer;
}
