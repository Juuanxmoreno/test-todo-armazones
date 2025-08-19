import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import env from './env';
import logger from './logger';
import { AppError } from '@utils/AppError';
import { fileURLToPath } from 'url';

// Configura tu transporte SMTP
const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: false,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

// Verificar conexión SMTP
transporter.verify((error) => {
  if (error) {
    logger.error('Error al conectar con el SMTP:', error);
    throw new AppError('No se pudo conectar con el servidor SMTP', 500, 'error', true, { cause: error.message });
  } else {
    logger.info('Conexión SMTP lista para enviar emails');
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Handlebars
const handlebarOptions = {
  viewEngine: {
    extname: '.hbs',
    partialsDir: path.resolve(__dirname, 'templates'),
    layoutsDir: path.resolve(__dirname, 'templates'),
    defaultLayout: '', // Puedes cambiarlo a 'main' si usás layouts
  },
  viewPath: path.resolve(__dirname, 'templates'),
  extName: '.hbs',
};

transporter.use('compile', hbs(handlebarOptions));

export default transporter;
