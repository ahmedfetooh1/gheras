export interface User {
  _id?: string;
  name?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
  plan?: string; // free, premium
}

export interface Plant {
  _id: string;
  id?: string;
  commonName: string;
  name?: string;
  scientificName: string;
  family?: string;
  description?: string;
  images: string[];
  growingSeason?: string;
  temperatureRange?: {
    min?: number;
    max?: number;
  };
  sunlightHours?: number;
  soilPH?: {
    min?: number;
    max?: number;
  };
  waterNeeds?: {
    level?: string;
    frequency?: number;
  };
  nutritionalValue?: string;
  fertilizers: any[];
  diseases: any[];
  potSizeOptions?: {
    plantType: string;
    min: number;
    max: number;
    unit: string;
  }[];
  growthStages?: {
    name: string;
    durationInDays: number;
    description?: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Disease {
  _id: string;
  id?: string;
  name: string;
  symptoms: string;
  treatment: string;
}

export interface Fertilizer {
  _id: string;
  id?: string;
  name: string;
  type: string;
  usageInstructions: string;
}

export interface Product {
  _id?: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  category: Category | string;
  stock: number;
}

export interface Category {
  _id?: string;
  name: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price?: number;
}

export interface Cart {
  _id?: string;
  user: string;
  items: CartItem[];
  totalPrice: number;
}

export interface Order {
  _id?: string;
  user: string;
  items: CartItem[];
  totalPrice: number;
  status: string;
  paymentStatus: string;
}

export interface Post {
  _id?: string;
  user: User | string;
  title: string;
  content: string;
  comments?: Comment[];
  createdAt?: string;
}

export interface Comment {
  _id?: string;
  user: User | string;
  post: string;
  content: string;
  createdAt?: string;
}

export interface Blog {
  _id?: string;
  title: string;
  slug: string;
  content: string;
  author: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface DashboardStats {
  totalUsers?: number;
  totalOrders?: number;
  totalRevenue?: number;
  totalPlants?: number;
}
