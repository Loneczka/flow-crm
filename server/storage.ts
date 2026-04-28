import { 
  type User, type InsertUser, 
  type Lead, type InsertLead,
  type LeadHistory, type InsertLeadHistory,
  type Notification, type InsertNotification,
  type Source, type InsertSource,
  users, leads, leadHistory, notifications, sources
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  unassignLeadsFromUser(userId: string): Promise<void>;
  transferUserDataToAdmin(userId: string, adminId: string): Promise<void>;

  getLeads(): Promise<Lead[]>;
  getLeadsByAssignedTo(userId: string): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<Lead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;

  getLeadHistory(leadId: string): Promise<LeadHistory[]>;
  createLeadHistory(history: InsertLeadHistory): Promise<LeadHistory>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<Notification | undefined>;

  getSources(): Promise<Source[]>;
  createSource(source: InsertSource): Promise<Source>;
  deleteSource(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private leadsMap: Map<string, Lead>;
  private historyMap: Map<string, LeadHistory>;
  private notificationsMap: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.leadsMap = new Map();
    this.historyMap = new Map();
    this.notificationsMap = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, role: insertUser.role || "SALES" };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async unassignLeadsFromUser(userId: string): Promise<void> {
    for (const [id, lead] of this.leadsMap) {
      if (lead.assignedToId === userId) {
        this.leadsMap.set(id, { ...lead, assignedToId: null });
      }
    }
  }

  async transferUserDataToAdmin(userId: string, adminId: string): Promise<void> {
    for (const [id, lead] of this.leadsMap) {
      if (lead.createdById === userId) {
        this.leadsMap.set(id, { ...lead, createdById: adminId });
      }
    }
    for (const [id, history] of this.historyMap) {
      if (history.userId === userId) {
        this.historyMap.set(id, { ...history, userId: adminId });
      }
    }
  }

  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leadsMap.values());
  }

  async getLeadsByAssignedTo(userId: string): Promise<Lead[]> {
    return Array.from(this.leadsMap.values()).filter(l => l.assignedToId === userId);
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leadsMap.get(id);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const newLead: Lead = { 
      ...lead, 
      id, 
      createdAt: new Date(),
      phone: lead.phone || "",
      status: lead.status || "Nowy",
      source: lead.source || "",
      notes: lead.notes || "",
      contactDate: lead.contactDate || null,
      assignedToId: lead.assignedToId || null
    };
    this.leadsMap.set(id, newLead);
    return newLead;
  }

  async updateLead(id: string, update: Partial<Lead>): Promise<Lead | undefined> {
    const lead = this.leadsMap.get(id);
    if (!lead) return undefined;
    const updated = { ...lead, ...update };
    this.leadsMap.set(id, updated);
    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    return this.leadsMap.delete(id);
  }

  async getLeadHistory(leadId: string): Promise<LeadHistory[]> {
    return Array.from(this.historyMap.values())
      .filter(h => h.leadId === leadId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createLeadHistory(history: InsertLeadHistory): Promise<LeadHistory> {
    const id = randomUUID();
    const entry: LeadHistory = { ...history, id, timestamp: new Date() };
    this.historyMap.set(id, entry);
    return entry;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notificationsMap.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const entry: Notification = { ...notification, id, isRead: false, createdAt: new Date() };
    this.notificationsMap.set(id, entry);
    return entry;
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const notification = this.notificationsMap.get(id);
    if (!notification) return undefined;
    const updated = { ...notification, isRead: true };
    this.notificationsMap.set(id, updated);
    return updated;
  }

  private sourcesMap: Map<string, Source> = new Map();

  async getSources(): Promise<Source[]> {
    return Array.from(this.sourcesMap.values());
  }

  async createSource(source: InsertSource): Promise<Source> {
    const id = randomUUID();
    const entry: Source = { ...source, id, createdAt: new Date() };
    this.sourcesMap.set(id, entry);
    return entry;
  }

  async deleteSource(id: string): Promise<void> {
    this.sourcesMap.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async unassignLeadsFromUser(userId: string): Promise<void> {
    await db.update(leads).set({ assignedToId: null }).where(eq(leads.assignedToId, userId));
  }

  async transferUserDataToAdmin(userId: string, adminId: string): Promise<void> {
    await db.update(leads).set({ createdById: adminId }).where(eq(leads.createdById, userId));
    await db.update(leadHistory).set({ userId: adminId }).where(eq(leadHistory.userId, userId));
  }

  async getLeads(): Promise<Lead[]> {
    return db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLeadsByAssignedTo(userId: string): Promise<Lead[]> {
    return db.select().from(leads)
      .where(eq(leads.assignedToId, userId))
      .orderBy(desc(leads.createdAt));
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [created] = await db.insert(leads).values(lead).returning();
    return created;
  }

  async updateLead(id: string, update: Partial<Lead>): Promise<Lead | undefined> {
    const [updated] = await db.update(leads).set(update).where(eq(leads.id, id)).returning();
    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return true;
  }

  async getLeadHistory(leadId: string): Promise<LeadHistory[]> {
    return db.select().from(leadHistory)
      .where(eq(leadHistory.leadId, leadId))
      .orderBy(desc(leadHistory.timestamp));
  }

  async createLeadHistory(history: InsertLeadHistory): Promise<LeadHistory> {
    const [created] = await db.insert(leadHistory).values(history).returning();
    return created;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async getSources(): Promise<Source[]> {
    return db.select().from(sources).orderBy(desc(sources.createdAt));
  }

  async createSource(source: InsertSource): Promise<Source> {
    const [created] = await db.insert(sources).values(source).returning();
    return created;
  }

  async deleteSource(id: string): Promise<void> {
    await db.delete(sources).where(eq(sources.id, id));
  }
}

export const storage = new DatabaseStorage();

export async function initializeDatabase() {
  const piotr = await storage.getUserByEmail('piotr.kazibudzki@szybkieauto.pl');
  if (piotr && !piotr.canSwitchToAdmin) {
    await storage.updateUser(piotr.id, { canSwitchToAdmin: true });
    console.log('Updated canSwitchToAdmin for Piotr Kazibudzki');
  }
}
