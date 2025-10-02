import { X, Minus, Plus, Trash2, ShoppingBag, CreditCard } from "lucide-react";
import type { CartItem } from "@/types";

interface CartProps {
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export function Cart({
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shipping;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Panier</h2>
              <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                {items.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white transition-all duration-200 hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Votre panier est vide</p>
                <p className="text-sm text-gray-400 mt-2">Ajoutez des produits pour commencer</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">
                    {items.length} article{items.length > 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={onClearCart}
                    className="text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    Vider le panier
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-sm transition-shadow"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg shadow-sm"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-medium">
                          {item.price.toLocaleString("fr-FR")} €
                        </p>
                        <div className="flex items-center mt-2 gap-2">
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() =>
                                onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
                              }
                              className="p-1 rounded-l-lg hover:bg-gray-100 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1 bg-white border-x border-gray-300 text-sm min-w-[40px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-1 rounded-r-lg hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-all duration-200 hover:scale-105 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t p-6 space-y-4 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sous-total</span>
                  <span>{subtotal.toLocaleString("fr-FR")} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Livraison</span>
                  <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                    {shipping === 0 ? "Gratuite" : `${shipping} €`}
                  </span>
                </div>
                {subtotal < 100 && (
                  <div className="text-xs text-gray-500">
                    Ajoutez {(100 - subtotal).toLocaleString("fr-FR")} € pour la livraison gratuite
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {total.toLocaleString("fr-FR")} €
                  </span>
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <CreditCard className="w-5 h-5" />
                <span>Procéder au paiement</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
