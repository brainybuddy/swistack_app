import Link from 'next/link'
import { Star, Heart, ShoppingCart } from 'lucide-react'

interface Product {
  id: number
  name: string
  price: number
  rating: number
  category: string
  image: string
}

export default function ProductsPage() {
  const products: Product[] = [
    { id: 1, name: 'Premium Headphones', price: 199, rating: 4.5, category: 'Audio', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop' },
    { id: 2, name: 'Wireless Speaker', price: 89, rating: 4.8, category: 'Audio', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop' },
    { id: 3, name: 'Smart Watch', price: 299, rating: 4.2, category: 'Wearables', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop' },
    { id: 4, name: 'Laptop Stand', price: 49, rating: 4.6, category: 'Accessories', image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop' },
    { id: 5, name: 'Wireless Mouse', price: 35, rating: 4.3, category: 'Accessories', image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&h=500&fit=crop' },
    { id: 6, name: 'Mechanical Keyboard', price: 129, rating: 4.7, category: 'Accessories', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&h=500&fit=crop' },
  ]
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <span className="text-gray-900">All Products</span>
          </nav>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-gray-700">Audio</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-gray-700">Wearables</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-gray-700">Accessories</span>
                </label>
              </div>
            </div>
          </aside>
          
          <main className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">All Products</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow">
                  <div className="relative aspect-square">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                    <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
                      <Heart className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      {product.category}
                    </span>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                    
                    <div className="flex items-center mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${
                              star <= Math.floor(product.rating) 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">({product.rating})</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-blue-600">
                        ${product.price}
                      </p>
                      <button className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}