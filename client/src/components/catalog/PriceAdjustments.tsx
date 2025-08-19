import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Percent } from 'lucide-react';
import { PriceAdjustment, Category, Subcategory } from '@/interfaces/catalog';

interface PriceAdjustmentsProps {
  priceAdjustments: PriceAdjustment[];
  categories: Category[];
  subcategories: Subcategory[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof PriceAdjustment, value: string | number) => void;
}

const PriceAdjustments: React.FC<PriceAdjustmentsProps> = ({
  priceAdjustments,
  categories,
  subcategories,
  onAdd,
  onRemove,
  onUpdate,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-[#222222]">
          Configurar Incrementos de Precio
        </h4>
        <button
          type="button"
          onClick={onAdd}
          className="btn btn-sm bg-[#222222] text-white hover:bg-[#111111] border-none"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      <div className="text-sm text-[#666666] mb-4">
        <p className="mb-2">
          <strong>Configuración de incrementos por categoría o subcategoría:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Especifica categoría O subcategoría (no ambos)</li>
          <li>Los ajustes por subcategoría tienen prioridad</li>
          <li>Ejemplo: 35% incrementa $100 a $135</li>
        </ul>
      </div>

      {priceAdjustments.length === 0 ? (
        <div className="text-center py-8 text-[#666666]">
          <Percent className="w-8 h-8 mx-auto mb-2 text-[#999999]" />
          <p>No hay ajustes de precio configurados</p>
          <p className="text-sm">Haz clic en &quot;Agregar&quot; para crear uno</p>
        </div>
      ) : (
        <div className="space-y-3">
          {priceAdjustments.map((adjustment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-4 rounded-lg border border-[#e1e1e1] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#222222]">
                  Ajuste #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="btn btn-sm btn-circle btn-ghost text-red-600 hover:bg-red-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Selector de Categoría */}
                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-1">
                    Categoría
                  </label>
                  <select
                    value={adjustment.categoryId || ''}
                    onChange={(e) => onUpdate(index, 'categoryId', e.target.value)}
                    disabled={!!adjustment.subcategoryId}
                    className="select select-bordered w-full text-sm"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de Subcategoría */}
                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-1">
                    Subcategoría
                  </label>
                  <select
                    value={adjustment.subcategoryId || ''}
                    onChange={(e) => onUpdate(index, 'subcategoryId', e.target.value)}
                    disabled={!!adjustment.categoryId}
                    className="select select-bordered w-full text-sm"
                  >
                    <option value="">Seleccionar subcategoría</option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input de Porcentaje */}
                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-1">
                    Incremento (%)
                  </label>
                  <input
                    type="number"
                    value={adjustment.percentageIncrease}
                    onChange={(e) =>
                      onUpdate(
                        index,
                        'percentageIncrease',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    min="0"
                    max="1000"
                    step="0.1"
                    className="input input-bordered w-full text-sm"
                    placeholder="35"
                  />
                </div>
              </div>

              {/* Preview del cálculo */}
              {adjustment.percentageIncrease > 0 && (
                <div className="bg-blue-50 p-2 rounded text-sm">
                  <span className="text-blue-800">
                    <strong>Ejemplo:</strong> $100 USD → $
                    {(100 * (1 + adjustment.percentageIncrease / 100)).toFixed(2)} USD
                  </span>
                </div>
              )}

              {/* Validación visual */}
              {!adjustment.categoryId && !adjustment.subcategoryId && (
                <div className="bg-yellow-50 p-2 rounded text-sm">
                  <span className="text-yellow-800">
                    ⚠️ Selecciona una categoría o subcategoría
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PriceAdjustments;
