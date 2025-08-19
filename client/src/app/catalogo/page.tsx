"use client";

import { useCatalog } from "@/hooks/useCatalog";
import { Category, Subcategory } from "@/interfaces/catalog";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import PriceAdjustments from "@/components/catalog/PriceAdjustments";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Users,
  Layers,
  DollarSign,
  Mail,
} from "lucide-react";

const CatalogPage = () => {
  const {
    state,
    categories,
    filteredSubcategories,
    form,
    handlers,
    selectedCategories,
    selectedSubcategories,
    priceAdjustments,
    email,
  } = useCatalog();

  const { loading, error, logoPreview, emailSent, emailAddress } = state;

  const {
    handleLogoChange,
    removeLogo,
    handleCategoryChange,
    handleSubcategoryChange,
    selectAllCategories,
    deselectAllCategories,
    selectAllSubcategories,
    deselectAllSubcategories,
    clearError,
    clearSuccess,
    addPriceAdjustment,
    removePriceAdjustment,
    updatePriceAdjustment,
    onSubmit,
  } = handlers;

  const { handleSubmit, register, formState: { errors } } = form;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-[#e1e1e1] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#222222] px-6 py-8 text-white">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Generador de Catálogos
                </h1>
                <p className="text-gray-300 mt-2">
                  Crea catálogos personalizados de productos en formato PDF
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Formulario */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Campo Email */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#222222] flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#666666]" />
                  Dirección de Email
                </h3>
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="tu-email@ejemplo.com"
                    className={`input w-full border border-[#e1e1e1] rounded-none bg-[#FFFFFF] text-[#222222] ${errors.email ? 'input-error' : ''}`}
                    {...register('email', {
                      required: 'El email es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })}
                  />
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-sm flex items-center gap-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.email.message}
                    </motion.p>
                  )}
                  <p className="text-sm text-[#666666]">
                    Te enviaremos el catálogo en formato PDF a esta dirección de email.
                  </p>
                </div>
              </div>
              {/* Categorías */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#222222] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#666666]" />
                    Categorías
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllCategories}
                      className={`btn btn-sm rounded-none bg-[#FFFFFF] border border-[#e1e1e1] text-[#111111] shadow-none`}
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllCategories}
                      className={`btn btn-sm rounded-none bg-[#FFFFFF] border border-[#e1e1e1] text-[#111111] shadow-none`}
                    >
                      Ninguna
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {categories.map((category: Category) => (
                    <motion.label
                      key={category.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-3 p-4 border border-[#e1e1e1] rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={(e) =>
                          handleCategoryChange(category.id, e.target.checked)
                        }
                        className="checkbox checkbox-neutral"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-[#222222]">
                          {category.title}
                        </div>
                        <div className="text-sm text-[#666666]">
                          {category.description}
                        </div>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Subcategorías */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#222222] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#666666]" />
                    Subcategorías
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllSubcategories}
                      className={`btn btn-sm rounded-none bg-[#FFFFFF] border border-[#e1e1e1] text-[#111111] shadow-none`}
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllSubcategories}
                      className={`btn btn-sm rounded-none bg-[#FFFFFF] border border-[#e1e1e1] text-[#111111] shadow-none`}
                    >
                      Ninguna
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredSubcategories.map((subcategory: Subcategory) => (
                    <motion.label
                      key={subcategory.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-3 p-4 border border-[#e1e1e1] rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubcategories.includes(subcategory.id)}
                        onChange={(e) =>
                          handleSubcategoryChange(
                            subcategory.id,
                            e.target.checked
                          )
                        }
                        className="checkbox checkbox-neutral"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-[#222222]">
                          {subcategory.title}
                        </div>
                        <div className="text-sm text-[#666666]">
                          {subcategory.description}
                        </div>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#222222] flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#666666]" />
                  Logo del Catálogo
                </h3>

                <div className="space-y-4">
                  <div>
                    <input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="file-input file-input-bordered w-full"
                    />
                    <p className="text-sm text-[#666666] mt-2">
                      Opcional. Si no se proporciona, se usará un logo por
                      defecto.
                    </p>
                  </div>

                  {logoPreview && (
                    <div className="flex justify-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                      >
                        <img
                          src={logoPreview}
                          alt="Preview del logo"
                          className="w-24 h-24 object-contain border border-[#e1e1e1] rounded-lg bg-gray-50"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 btn btn-circle btn-xs bg-red-500 hover:bg-red-600 border-none text-white"
                        >
                          ×
                        </button>
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ajustes de Precio */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#222222] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#666666]" />
                  Ajustes de Precio
                </h3>

                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <PriceAdjustments
                    priceAdjustments={priceAdjustments}
                    categories={categories}
                    subcategories={filteredSubcategories}
                    onAdd={addPriceAdjustment}
                    onRemove={removePriceAdjustment}
                    onUpdate={updatePriceAdjustment}
                  />
                </div>
              </div>

              {/* Alertas de estado - cerca del botón */}
              {/* Alert de carga */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="alert alert-info"
                  >
                    <div className="flex items-center gap-3">
                      <LoadingSpinner size="sm" />
                      <div className="flex-1">
                        <div className="font-semibold text-blue-800">
                          Generando tu catálogo personalizado...
                        </div>
                        <div className="text-sm text-blue-700 mt-1">
                          Este proceso puede demorar unos minutos. Te enviaremos el catálogo a <strong>{email}</strong> cuando esté listo.
                          Puedes cerrar esta página si lo deseas.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Catálogo enviado por email */}
              <AnimatePresence>
                {emailSent && !loading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="alert alert-success"
                  >
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-green-800">
                        ¡Catálogo enviado exitosamente! 📧
                      </div>
                      <div className="text-sm text-green-700 mt-1">
                        Hemos enviado tu catálogo personalizado a <strong>{emailAddress}</strong>.
                        Revisa tu bandeja de entrada y carpeta de spam.
                      </div>
                    </div>
                    <button
                      onClick={clearSuccess}
                      className="btn btn-sm btn-ghost text-green-800 hover:bg-green-600 hover:text-white"
                    >
                      ×
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="alert alert-error"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800">{error}</span>
                    <button
                      onClick={clearError}
                      className="btn btn-sm btn-ghost text-red-800 hover:bg-red-600 hover:text-white"
                    >
                      ×
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botón de envío */}
              <div className="flex justify-end pt-6 border-t border-[#e1e1e1]">
                <button
                  type="submit"
                  className={`btn btn-lg border-none transition-all duration-200 ${
                    loading 
                      ? 'bg-gray-400 cursor-not-allowed opacity-70 pointer-events-none' 
                      : 'bg-[#222222] hover:bg-[#111111] cursor-pointer'
                  } text-white`}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="text-white">Generando y enviando...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 text-white" />
                      <span className="text-white">Generar y Enviar por Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Info adicional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white rounded-lg shadow-sm border border-[#e1e1e1] p-6"
        >
          <h3 className="text-lg font-semibold text-[#222222] mb-4">
            ¿Cómo funciona?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-[#666666]" />
              </div>
              <h4 className="font-medium text-[#222222] mb-2">1. Email</h4>
              <p className="text-sm text-[#666666]">
                Ingresa tu dirección de email donde quieres recibir el catálogo
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-[#666666]" />
              </div>
              <h4 className="font-medium text-[#222222] mb-2">2. Configura</h4>
              <p className="text-sm text-[#666666]">
                Selecciona las categorías y subcategorías que quieres incluir en
                tu catálogo
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-[#666666]" />
              </div>
              <h4 className="font-medium text-[#222222] mb-2">3. Ajusta Precios</h4>
              <p className="text-sm text-[#666666]">
                Opcionalmente, configura incrementos de precio por categoría o subcategoría
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-[#666666]" />
              </div>
              <h4 className="font-medium text-[#222222] mb-2">4. Recibe por Email</h4>
              <p className="text-sm text-[#666666]">
                Te enviaremos el catálogo en PDF directamente a tu email
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CatalogPage;
