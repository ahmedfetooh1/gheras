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
  scientificName?: string;
  symptoms: string;
  treatment: string;
  image?: string;
}

export interface Fertilizer {
  _id: string;
  id?: string;
  name: string;
  type: string;
  usageInstructions: string;
  image?: string;
}

// export interface Product {
//   _id?: string;
//   name: string;
//   price: number;
//   description: string;
//   images: string;
//   category: Category | string;
//   stock: number;
// }

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  discountPercent: number;
  finalPrice: number;
  stock: number;
  images: string[];
  relatedProducts: any[];
  isActive: boolean;
  costPrice: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
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
  author: User | string;
  title: string;
  content: string;
  comments?: Comment[];
  status?: string;
  createdAt?: string;
}

export interface Comment {
  _id?: string;
  author: User | string;
  post: string;
  text: string;
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
  success?: boolean;
  stats?: {
    users?: { total: number; premium: number; regular: number };
    financials?: { netProfit: number; totalRevenueEGP: number; totalSuccessfulPayments: number };
    catalog?: { products: number; plants: number; diseases: number; fertilizers: number; categories: number; blogs: number };
    community?: { posts: number; comments: number };
    sales?: { soldProducts: number; deliveredOrders: number; pendingOrders: number };
  };
}
