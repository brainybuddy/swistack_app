export interface Product {
  id: number
  name: string
  price: number
  rating: number
  image: string
  category: string
  description?: string
  stock?: number
}

export interface CartItem extends Product {
  quantity: number
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered'
  createdAt: Date
  updatedAt: Date
}