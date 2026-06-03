export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  createdAt: number;
}

export interface Collection {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverImage?: string;
  itemIds: string[]; // Ordered list of item IDs
  createdAt: number;
  updatedAt: number;
}

export interface Item {
  id: string;
  userId: string;
  title: string;
  tags: string[]; // stored without #, lowercase, kebab-case
  rawInput?: string; // The exact string typed by the user during creation
  image?: string;
  notes?: string;
  archived?: boolean;
  createdAt: number;
  updatedAt: number;
}
