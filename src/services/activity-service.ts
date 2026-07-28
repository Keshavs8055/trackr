import { db } from '@/services/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, doc } from 'firebase/firestore';
import { ActivityAction, ResourceActivity } from '@/types';
import { EventBus, DomainEvent } from '@/domain/events/event-bus';

export class ActivityService {
  private static instance: ActivityService;
  private isSubscribed = false;

  private constructor() {
    this.initEventBusSubscriptions();
  }

  public static getInstance(): ActivityService {
    if (!ActivityService.instance) {
      ActivityService.instance = new ActivityService();
    }
    return ActivityService.instance;
  }

  private initEventBusSubscriptions() {
    if (this.isSubscribed) return;
    const eventBus = EventBus.getInstance();

    eventBus.subscribe('ResourceCreated', (event: DomainEvent) => {
      const { userId, resourceId, resource } = event.payload || {};
      if (userId && resourceId) {
        this.logActivity(userId, resourceId, 'created', { title: resource?.title }, resource?.title);
      }
    });

    eventBus.subscribe('StatusChanged', (event: DomainEvent) => {
      const { userId, resourceId, oldStatus, newStatus, resourceTitle } = event.payload || {};
      if (userId && resourceId) {
        this.logActivity(userId, resourceId, 'status_changed', { oldStatus, newStatus }, resourceTitle);
      }
    });

    eventBus.subscribe('MetadataRefreshed', (event: DomainEvent) => {
      const { userId, resourceId, provider, resourceTitle } = event.payload || {};
      if (userId && resourceId) {
        this.logActivity(userId, resourceId, 'metadata_refreshed', { provider }, resourceTitle);
      }
    });

    this.isSubscribed = true;
  }

  public async logActivity(
    userId: string,
    resourceId: string,
    action: ActivityAction,
    payload?: Record<string, unknown>,
    resourceTitle?: string
  ): Promise<ResourceActivity> {
    const activity: ResourceActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      resourceId,
      resourceTitle,
      action,
      payload,
      timestamp: Date.now(),
    };

    if (userId === 'mock-user-id' || typeof window === 'undefined') {
      this.saveMockActivity(activity);
      return activity;
    }

    try {
      const activitiesRef = collection(db, 'users', userId, 'resources', resourceId, 'activities');
      await addDoc(activitiesRef, {
        userId: activity.userId,
        resourceId: activity.resourceId,
        resourceTitle: activity.resourceTitle || null,
        action: activity.action,
        payload: activity.payload || {},
        timestamp: activity.timestamp,
      });
    } catch (err) {
      console.warn("Firestore activity log write failed, falling back to local storage:", err);
      this.saveMockActivity(activity);
    }

    return activity;
  }

  public async getResourceActivities(
    userId: string,
    resourceId: string
  ): Promise<ResourceActivity[]> {
    if (userId === 'mock-user-id' || typeof window === 'undefined') {
      return this.getMockActivities(resourceId);
    }

    try {
      const activitiesRef = collection(db, 'users', userId, 'resources', resourceId, 'activities');
      const q = query(activitiesRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return this.getMockActivities(resourceId);
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<ResourceActivity, 'id'>),
      }));
    } catch (err) {
      console.warn("Failed to fetch Firestore activities, returning local fallback:", err);
      return this.getMockActivities(resourceId);
    }
  }

  public async getUserActivities(
    userId: string,
    limitCount = 25
  ): Promise<ResourceActivity[]> {
    const allMock = this.getAllMockActivities();
    return allMock
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limitCount);
  }

  private inMemoryActivities: ResourceActivity[] = [];

  private saveMockActivity(activity: ResourceActivity): void {
    this.inMemoryActivities.unshift(activity);
    if (typeof localStorage !== 'undefined') {
      const existingStr = localStorage.getItem('trackr_activities') || '[]';
      try {
        const existing: ResourceActivity[] = JSON.parse(existingStr);
        existing.unshift(activity);
        localStorage.setItem('trackr_activities', JSON.stringify(existing.slice(0, 200)));
      } catch (err) {
        console.error("Error saving mock activity:", err);
      }
    }
  }

  private getMockActivities(resourceId: string): ResourceActivity[] {
    if (typeof localStorage === 'undefined') {
      return this.inMemoryActivities.filter(a => a.resourceId === resourceId);
    }
    const existingStr = localStorage.getItem('trackr_activities') || '[]';
    try {
      const existing: ResourceActivity[] = JSON.parse(existingStr);
      const combined = [...this.inMemoryActivities, ...existing];
      const seen = new Set<string>();
      return combined.filter(a => {
        if (a.resourceId !== resourceId) return false;
        if (!a.id) return true;
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
    } catch {
      return this.inMemoryActivities.filter(a => a.resourceId === resourceId);
    }
  }

  private getAllMockActivities(): ResourceActivity[] {
    if (typeof localStorage === 'undefined') {
      return this.inMemoryActivities;
    }
    const existingStr = localStorage.getItem('trackr_activities') || '[]';
    try {
      const existing: ResourceActivity[] = JSON.parse(existingStr);
      const combined = [...this.inMemoryActivities, ...existing];
      const seen = new Set<string>();
      return combined.filter(a => {
        if (!a.id) return true;
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
    } catch {
      return this.inMemoryActivities;
    }
  }
}
