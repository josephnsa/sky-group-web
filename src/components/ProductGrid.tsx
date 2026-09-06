import { useState } from "preact/hooks";
import { motion, AnimatePresence } from "framer-motion";
import type { Producto } from "../data/catalog";
import ProductCard from "./ProductCard";
import VistaRapidaModal from "./VistaRapidaModal";

interface Props {
  productos: Producto[];
}

export default function ProductGrid({ productos }: Props) {
  const [vistaRapida, setVistaRapida] = useState<Producto | null>(null);

  if (productos.length === 0) {
    return (
      <p class="py-10 text-center text-neutral-500">
        No se encontraron productos.
      </p>
    );
  }

  return (
    <>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence>
          {productos.map((p) => (
            <motion.div
              key={p.sku}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ProductCard producto={p} onVistaRapida={setVistaRapida} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {vistaRapida && (
          <VistaRapidaModal producto={vistaRapida} onClose={() => setVistaRapida(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
