import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { OrderResponseDto, OrderUserResponseDto } from '@dto/order.dto';
import { ShippingMethod, PaymentMethod } from '@enums/order.enum';
import { formatCurrency } from '@utils/formatCurrency';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatDateToArg(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(date);
}

function translateShippingMethod(method: ShippingMethod): string {
  switch (method) {
    case ShippingMethod.ParcelCompany:
      return 'Empresa de paquetería';
    case ShippingMethod.Motorcycle:
      return 'Moto';
    default:
      return method;
  }
}

function translatePaymentMethod(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.CashOnDelivery:
      return 'Efectivo contra entrega';
    case PaymentMethod.BankTransfer:
      return 'Transferencia bancaria o depósito';
    default:
      return method;
  }
}

export async function generateOrderPDF(orderData: OrderResponseDto): Promise<Buffer> {
  const templatePath = path.join(__dirname, 'templates', 'order-pdf.hbs');
  const templateHtml = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateHtml);

  // Helpers para condicionales
  const isParcelCompany = orderData.shippingMethod === ShippingMethod.ParcelCompany;
  const isMotorcycle = orderData.shippingMethod === ShippingMethod.Motorcycle;
  const showBankTransferExpense =
    orderData.paymentMethod === PaymentMethod.BankTransfer && orderData.bankTransferExpense !== undefined;

  // Logo URL
  const logoUrl = 'https://i.imgur.com/gx4jg0A.jpeg';

  // Formatear fecha
  const createdAtFormatted = formatDateToArg(orderData.createdAt);

  // Traducciones
  const shippingMethodLabel = translateShippingMethod(orderData.shippingMethod as ShippingMethod);
  const paymentMethodLabel = translatePaymentMethod(orderData.paymentMethod as PaymentMethod);

  // Formatear montos en USD
  const itemsFormatted = orderData.items.map((item) => ({
    ...item,
    priceUSDAtPurchase: formatCurrency(item.priceUSDAtPurchase, 'en-US', 'USD'),
    subTotal: formatCurrency(item.subTotal, 'en-US', 'USD'),
    gainUSD: formatCurrency(item.gainUSD, 'en-US', 'USD'),
  }));

  const totalAmountFormatted = formatCurrency(orderData.totalAmount, 'en-US', 'USD');
  const totalGainUSDFormatted = formatCurrency(orderData.totalGainUSD, 'en-US', 'USD');
  const bankTransferExpenseFormatted =
    orderData.bankTransferExpense !== undefined
      ? formatCurrency(orderData.bankTransferExpense, 'en-US', 'USD')
      : undefined;

  const html = template({
    ...orderData,
    logoUrl,
    createdAt: createdAtFormatted,
    shippingMethodLabel,
    paymentMethodLabel,
    items: itemsFormatted,
    totalAmount: totalAmountFormatted,
    totalGainUSD: totalGainUSDFormatted,
    isParcelCompany,
    isMotorcycle,
    showBankTransferExpense,
    bankTransferExpense: bankTransferExpenseFormatted,
  });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = (await page.pdf({ format: 'A4' })) as Buffer;
  await browser.close();

  return pdfBuffer;
}

export async function generateUserOrderPDF(orderData: OrderUserResponseDto): Promise<Buffer> {
  const templatePath = path.join(__dirname, 'templates', 'order-pdf-user.hbs');
  const templateHtml = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateHtml);

  // Helpers para condicionales
  const isParcelCompany = orderData.shippingMethod === ShippingMethod.ParcelCompany;
  const isMotorcycle = orderData.shippingMethod === ShippingMethod.Motorcycle;
  const showBankTransferExpense =
    orderData.paymentMethod === PaymentMethod.BankTransfer && orderData.bankTransferExpense !== undefined;

  // Logo URL
  const logoUrl = 'https://i.imgur.com/nzdfwS7.png';

  // Formatear fecha
  const createdAtFormatted = formatDateToArg(orderData.createdAt);

  // Traducciones
  const shippingMethodLabel = translateShippingMethod(orderData.shippingMethod as ShippingMethod);
  const paymentMethodLabel = translatePaymentMethod(orderData.paymentMethod as PaymentMethod);

  // Formatear montos en USD
  const itemsFormatted = orderData.items.map((item) => ({
    ...item,
    priceUSDAtPurchase: formatCurrency(item.priceUSDAtPurchase, 'en-US', 'USD'),
    subTotal: formatCurrency(item.subTotal, 'en-US', 'USD'),
  }));

  const totalAmountFormatted = formatCurrency(orderData.totalAmount, 'en-US', 'USD');
  const bankTransferExpenseFormatted =
    orderData.bankTransferExpense !== undefined
      ? formatCurrency(orderData.bankTransferExpense, 'en-US', 'USD')
      : undefined;

  const html = template({
    ...orderData,
    logoUrl,
    createdAt: createdAtFormatted,
    shippingMethodLabel,
    paymentMethodLabel,
    items: itemsFormatted,
    totalAmount: totalAmountFormatted,
    isParcelCompany,
    isMotorcycle,
    showBankTransferExpense,
    bankTransferExpense: bankTransferExpenseFormatted,
  });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = (await page.pdf({ format: 'A4' })) as Buffer;
  await browser.close();

  return pdfBuffer;
}
