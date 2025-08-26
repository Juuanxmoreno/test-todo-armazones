import axios from 'axios';
import Dollar from '@models/Dollar';
import { dollarResponseDTO, updateDollarAddedValueDTO } from '@dto/dollar.dto';
import { AppError } from '@utils/AppError';
import logger from '@config/logger';

export class DollarService {
  private bluelyticsUrl = 'https://api.bluelytics.com.ar/v2/latest';
  private dolarApiUrl = 'https://dolarapi.com/v1/dolares/blue';

  /**
   * Obtiene el valor del dólar blue desde Bluelytics o DolarApi (fallback).
   */
  private async fetchDollarBaseValue(): Promise<number> {
    try {
      const { data } = await axios.get(this.bluelyticsUrl, { timeout: 5000 });
      logger.info('Cotización obtenida de Bluelytics', {
        value: data?.blue?.value_sell,
      });
      return data?.blue?.value_sell;
    } catch (err) {
      logger.warn('Fallo Bluelytics, intentando con DolarApi...', {
        error: err,
      });
      try {
        const { data } = await axios.get(this.dolarApiUrl, { timeout: 5000 });
        logger.info('Cotización obtenida de DolarApi', { value: data?.venta });
        return data?.venta;
      } catch (err2) {
        logger.error('Fallo también DolarApi', { error: err2 });
        throw new AppError('No se pudo obtener la cotización del dólar', 503, 'error', true, {
          cause: 'Fallo en Bluelytics y DolarApi',
          hint: 'Verifica la conectividad con las APIs externas',
        });
      }
    }
  }

  /**
   * Aplica el addedValue ya sea como porcentaje o valor fijo.
   */
  private applyAddedValue(baseValue: number, addedValue: number, isPercentage: boolean): number {
    if (isPercentage) {
      return baseValue * (1 + addedValue / 100);
    }
    return baseValue + addedValue;
  }

  /**
   * Actualiza el valor del dólar en la base de datos y devuelve un DTO.
   */
  public async updateDollarValue(): Promise<dollarResponseDTO> {
    const baseValue = await this.fetchDollarBaseValue();

    let dollar = await Dollar.findOne();

    if (!dollar) {
      dollar = new Dollar({
        value: baseValue,
        addedValue: 0,
        isPercentage: false,
        latestAPIUpdate: new Date(),
      });
      logger.info('Nuevo registro de dólar creado en la base de datos', {
        baseValue,
      });
    }

    const finalValue = this.applyAddedValue(baseValue, dollar.addedValue, dollar.isPercentage);

    dollar.value = finalValue;
    dollar.latestAPIUpdate = new Date();

    await dollar.save();

    logger.info('Valor del dólar actualizado en la base de datos', {
      finalValue,
      addedValue: dollar.addedValue,
      isPercentage: dollar.isPercentage,
    });

    // Mapeo al DTO explícitamente
    const response: dollarResponseDTO = {
      value: dollar.value,
      addedValue: dollar.addedValue,
      isPercentage: dollar.isPercentage,
      latestAPIUpdate: dollar.latestAPIUpdate,
    };

    return response;
  }

  /**
   * Actualiza la configuración de addedValue e isPercentage.
   */
  public async updateDollarConfig(dto: updateDollarAddedValueDTO): Promise<dollarResponseDTO> {
    const dollar = await Dollar.findOne();

    if (!dollar) {
      logger.warn('Intento de configurar dólar sin registro en la base de datos');
      throw new AppError('No existe un registro de dólar en la base de datos', 404, 'error', true, {
        cause: 'No se ejecutó aún updateDollarValue',
        hint: 'Ejecuta primero la actualización desde las APIs externas',
      });
    }

    // Actualizo configuración
    dollar.addedValue = dto.addedValue;
    dollar.isPercentage = dto.isPercentage;

    // Recalculo el valor en base al último valor API guardado
    const baseValue = await this.fetchDollarBaseValue().catch(() => dollar.value);
    const finalValue = this.applyAddedValue(baseValue, dto.addedValue, dto.isPercentage);

    dollar.value = finalValue;
    dollar.latestAPIUpdate = new Date();

    await dollar.save();

    logger.info('Configuración del dólar actualizada', {
      addedValue: dto.addedValue,
      isPercentage: dto.isPercentage,
      finalValue,
    });

    const response: dollarResponseDTO = {
      value: dollar.value,
      addedValue: dollar.addedValue,
      isPercentage: dollar.isPercentage,
      latestAPIUpdate: dollar.latestAPIUpdate,
    };

    return response;
  }

  /**
   * Retorna el valor actual del dólar (sin actualizarlo).
   */
  public async getDollar(): Promise<dollarResponseDTO> {
    const dollar = await Dollar.findOne();

    if (!dollar) {
      logger.warn('Intento de obtener dólar sin registro en la base de datos');
      throw new AppError('No existe un registro de dólar en la base de datos', 404, 'error', true, {
        cause: 'No se ejecutó aún updateDollarValue',
        hint: 'Ejecuta primero la actualización desde las APIs externas',
      });
    }

    logger.info('Valor del dólar obtenido de la base de datos', {
      value: dollar.value,
      addedValue: dollar.addedValue,
      isPercentage: dollar.isPercentage,
    });

    const response: dollarResponseDTO = {
      value: dollar.value,
      addedValue: dollar.addedValue,
      isPercentage: dollar.isPercentage,
      latestAPIUpdate: dollar.latestAPIUpdate,
    };

    return response;
  }
}
