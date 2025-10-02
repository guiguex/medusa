import { ShoppingCart, Search, Menu, Store } from 'lucide-react';

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
}

export function Header({ cartItemsCount, onCartClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="md:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2">
              <Store className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TechStore
              </h1>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
              Accueil
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
              Produits
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
              À propos
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
              Contact
            </a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onCartClick}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105"
            >
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}