import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { Collection, CollectionRule, Resource } from '@/types';
import { AppError } from '@/lib/app-error';

export class CollectionService {
  private static MOCK_KEY = 'mock-collections';

  private static getMockCollections(): Collection[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.MOCK_KEY);
    return data ? JSON.parse(data) : [];
  }

  private static saveMockCollections(collections: Collection[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.MOCK_KEY, JSON.stringify(collections));
  }

  /**
   * Evaluates dynamic rules against resources to determine matching resource IDs
   */
  public static evaluateSmartCollectionRules(collection: Collection, resources: Resource[]): string[] {
    if (!collection.isDynamic || !collection.rules || collection.rules.length === 0) {
      return collection.resourceIds || collection.itemIds || [];
    }

    return resources
      .filter(resource => {
        const meta = (resource.providerMetadata?.metadata || resource.metadata || {}) as Record<string, any>;

        return collection.rules!.every(rule => {
          let fieldValue: any;
          
          switch (rule.field) {
            case 'type':
              fieldValue = resource.type;
              break;
            case 'tag':
              fieldValue = resource.tags;
              break;
            case 'status':
              fieldValue = resource.status;
              break;
            case 'provider':
              fieldValue = resource.providerMetadata?.provider || resource.provider;
              break;
            case 'year':
              fieldValue = meta.year || meta.Year || meta.publishYear || meta.publishedDate;
              if (fieldValue) fieldValue = parseInt(String(fieldValue).match(/\d{4}/)?.[0] || '0', 10);
              break;
            default:
              fieldValue = undefined;
          }

          if (fieldValue === undefined || fieldValue === null) return false;

          const targetVal = rule.value;

          switch (rule.operator) {
            case 'equals':
              if (Array.isArray(fieldValue)) {
                return fieldValue.map(v => String(v).toLowerCase()).includes(String(targetVal).toLowerCase());
              }
              return String(fieldValue).toLowerCase() === String(targetVal).toLowerCase();

            case 'contains':
              if (Array.isArray(fieldValue)) {
                return fieldValue.some(v => String(v).toLowerCase().includes(String(targetVal).toLowerCase()));
              }
              return String(fieldValue).toLowerCase().includes(String(targetVal).toLowerCase());

            case 'greaterThan':
              return Number(fieldValue) > Number(targetVal);

            case 'lessThan':
              return Number(fieldValue) < Number(targetVal);

            default:
              return false;
          }
        });
      })
      .map(r => r.id);
  }

  public static async getUserCollections(userId: string): Promise<Collection[]> {
    if (!userId) throw AppError.authRequired();

    if (userId === 'mock-user-id') {
      return this.getMockCollections();
    }

    try {
      const q = query(
        collection(db, 'users', userId, 'collections'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Collection[];
    } catch (err) {
      console.error("Error fetching collections:", err);
      throw AppError.fromError(err);
    }
  }

  public static async createCollection(
    userId: string, 
    data: Omit<Collection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    if (!userId) throw AppError.authRequired();

    const timestamp = Date.now();
    const newCollection = {
      ...data,
      userId,
      resourceIds: data.resourceIds || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (userId === 'mock-user-id') {
      const collections = this.getMockCollections();
      const id = 'col-' + Date.now();
      const colObj = { id, ...newCollection };
      collections.unshift(colObj);
      this.saveMockCollections(collections);
      return id;
    }

    try {
      const colRef = collection(db, 'users', userId, 'collections');
      const docRef = await addDoc(colRef, newCollection);
      return docRef.id;
    } catch (err) {
      console.error("Error creating collection:", err);
      throw AppError.fromError(err);
    }
  }

  public static async updateCollection(
    userId: string, 
    collectionId: string, 
    update: Partial<Collection>
  ): Promise<void> {
    if (!userId) throw AppError.authRequired();

    const cleanUpdate = { ...update, updatedAt: Date.now() };

    if (userId === 'mock-user-id') {
      const collections = this.getMockCollections();
      const updated = collections.map(c => c.id === collectionId ? { ...c, ...cleanUpdate } : c);
      this.saveMockCollections(updated);
      return;
    }

    try {
      const docRef = doc(db, 'users', userId, 'collections', collectionId);
      await updateDoc(docRef, cleanUpdate);
    } catch (err) {
      console.error("Error updating collection:", err);
      throw AppError.fromError(err);
    }
  }

  public static async deleteCollection(userId: string, collectionId: string): Promise<void> {
    if (!userId) throw AppError.authRequired();

    if (userId === 'mock-user-id') {
      const collections = this.getMockCollections();
      const updated = collections.filter(c => c.id !== collectionId);
      this.saveMockCollections(updated);
      return;
    }

    try {
      const docRef = doc(db, 'users', userId, 'collections', collectionId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting collection:", err);
      throw AppError.fromError(err);
    }
  }
}
