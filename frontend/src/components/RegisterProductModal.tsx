import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

interface RegisterProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (productName: string, price: number) => void;
  marketColor: string;
}

export function RegisterProductModal({
  isOpen,
  onClose,
  onRegister,
  marketColor
}: RegisterProductModalProps) {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");

    if (!productName.trim()) {
      setError("Debes ingresar el nombre del producto");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Debes ingresar un precio válido mayor a 0");
      return;
    }

    onRegister(productName.trim(), priceNum);
    setProductName("");
    setPrice("");
    onClose();
  };

  const handleClose = () => {
    setProductName("");
    setPrice("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-6 h-6" style={{ color: marketColor }} />
            Registrar Nuevo Producto
          </DialogTitle>
          <DialogDescription>
            Agrega un nuevo producto con su precio al inventario de tu puesto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="productName">Nombre del Producto</Label>
            <Input
              id="productName"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ej: Tomates, Pollo entero, etc."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="price">Precio (Bs.)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-600">Bs.</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSubmit}
              className="flex-1"
              style={{ backgroundColor: marketColor }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Producto
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
