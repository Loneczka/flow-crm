import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertUserSchema } from "@shared/schema";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "crm-secret-key";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      activeRole?: "ADMIN" | "SALES";
    }
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Nieautoryzowany" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; activeRole?: "ADMIN" | "SALES" };
    req.userId = decoded.userId;
    req.activeRole = decoded.activeRole;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Nieautoryzowany" });
  }
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Nieautoryzowany" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; activeRole?: "ADMIN" | "SALES" };
    req.userId = decoded.userId;
    req.activeRole = decoded.activeRole;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(403).json({ message: "Brak uprawnien" });
    }
    const effectiveRole = decoded.activeRole || user.role;
    if (effectiveRole !== "ADMIN") {
      return res.status(403).json({ message: "Brak uprawnien" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Nieautoryzowany" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Admin user management routes
  app.post("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const schema = insertUserSchema.extend({
        email: z.string().email(),
        password: z.string().min(6),
      });
      const parsed = schema.parse(req.body);
      
      const existing = await storage.getUserByEmail(parsed.email);
      if (existing) {
        return res.status(400).json({ message: "Uzytkownik o tym adresie email juz istnieje" });
      }

      const hashedPassword = await bcrypt.hash(parsed.password, 10);
      const user = await storage.createUser({
        ...parsed,
        password: hashedPassword,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Nieprawidlowe dane", errors: error.errors });
      }
      res.status(500).json({ message: "Blad serwera" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      
      if (userId === req.userId) {
        return res.status(400).json({ message: "Nie mozesz usunac wlasnego konta" });
      }

      await storage.unassignLeadsFromUser(userId);
      await storage.transferUserDataToAdmin(userId, req.userId!);
      await storage.deleteUser(userId);
      res.json({ message: "Uzytkownik zostal usuniety" });
    } catch (error: any) {
      if (error?.code === '23503') {
        return res.status(400).json({ message: "Nie mozna usunac uzytkownika - ma powiazane dane w systemie" });
      }
      res.status(500).json({ message: "Blad serwera" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Nieprawidlowy email lub haslo" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Nieprawidlowy email lub haslo" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Blad serwera" });
    }
  });

  app.post("/api/logout", (req, res) => {
    res.json({ message: "Wylogowano pomyslnie" });
  });

  app.get("/api/user", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.userId!);
    if (!user) {
      return res.status(404).json({ message: "Uzytkownik nie znaleziony" });
    }
    const { password: _, ...userWithoutPassword } = user;
    const activeRole = req.activeRole || user.role;
    res.json({ ...userWithoutPassword, activeRole });
  });

  app.post("/api/user/switch-role", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.userId!);
    if (!user) {
      return res.status(404).json({ message: "Uzytkownik nie znaleziony" });
    }
    
    if (!user.canSwitchToAdmin) {
      return res.status(403).json({ message: "Nie masz uprawnien do przelaczania roli" });
    }
    
    const { targetRole } = req.body;
    if (targetRole !== "ADMIN" && targetRole !== "SALES") {
      return res.status(400).json({ message: "Nieprawidlowa rola" });
    }
    
    const token = jwt.sign({ userId: user.id, activeRole: targetRole }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, activeRole: targetRole });
  });

  app.post("/api/user/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Wymagane jest obecne i nowe haslo" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Nowe haslo musi miec minimum 6 znakow" });
      }
      
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "Uzytkownik nie znaleziony" });
      }
      
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res.status(400).json({ message: "Nieprawidlowe obecne haslo" });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.userId!, { password: hashedPassword });
      res.json({ message: "Haslo zostalo zmienione" });
    } catch (error) {
      res.status(500).json({ message: "Blad serwera" });
    }
  });

  app.patch("/api/user/preferences", requireAuth, async (req, res) => {
    try {
      const { notificationsEnabled } = req.body;
      const updated = await storage.updateUser(req.userId!, { notificationsEnabled });
      if (!updated) {
        return res.status(404).json({ message: "Uzytkownik nie znaleziony" });
      }
      const { password: _, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Blad serwera" });
    }
  });

  // Users routes (all authenticated users can see basic user list)
  app.get("/api/users", requireAuth, async (req, res) => {
    const users = await storage.getAllUsers();
    const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
    res.json(usersWithoutPasswords);
  });

  // Leads routes
  app.get("/api/leads", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.userId!);
    if (!user) {
      return res.status(404).json({ message: "Uzytkownik nie znaleziony" });
    }

    const effectiveRole = req.activeRole || user.role;
    let leads;
    if (effectiveRole === "ADMIN") {
      leads = await storage.getLeads();
    } else {
      leads = await storage.getLeadsByAssignedTo(user.id);
    }
    res.json(leads);
  });

  app.get("/api/leads/:id", requireAuth, async (req, res) => {
    const lead = await storage.getLead(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "Lead nie znaleziony" });
    }
    res.json(lead);
  });

  app.post("/api/leads", requireAuth, async (req, res) => {
    try {
      const parsed = insertLeadSchema.parse({
        ...req.body,
        createdById: req.userId,
        assignedToId: req.body.assignedToId === null ? null : (req.body.assignedToId || req.userId),
      });
      
      const lead = await storage.createLead(parsed);
      
      await storage.createLeadHistory({
        leadId: lead.id,
        userId: req.userId!,
        action: "Utworzono lead",
      });

      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Nieprawidlowe dane", errors: error.errors });
      }
      res.status(500).json({ message: "Blad serwera" });
    }
  });

  app.patch("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead nie znaleziony" });
      }

      // Convert contactDate string to Date object if present
      const updateData = { ...req.body };
      if (updateData.contactDate !== undefined) {
        if (updateData.contactDate) {
          const date = new Date(updateData.contactDate);
          if (isNaN(date.getTime())) {
            return res.status(400).json({ message: "Nieprawidlowy format daty" });
          }
          updateData.contactDate = date;
        } else {
          updateData.contactDate = null;
        }
      }

      const updated = await storage.updateLead(req.params.id, updateData);
      
      if (req.body.status && req.body.status !== lead.status) {
        await storage.createLeadHistory({
          leadId: lead.id,
          userId: req.userId!,
          action: `Zmieniono status z "${lead.status}" na "${req.body.status}"`,
        });
      } else {
        await storage.createLeadHistory({
          leadId: lead.id,
          userId: req.userId!,
          action: "Zaktualizowano dane leada",
        });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Blad serwera" });
    }
  });

  app.delete("/api/leads/:id", requireAdmin, async (req, res) => {
    const lead = await storage.getLead(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "Lead nie znaleziony" });
    }

    await storage.deleteLead(req.params.id);
    res.json({ message: "Lead usuniety" });
  });

  // Lead history
  app.get("/api/leads/:id/history", requireAuth, async (req, res) => {
    const history = await storage.getLeadHistory(req.params.id);
    res.json(history);
  });

  // Notifications
  app.get("/api/notifications", requireAuth, async (req, res) => {
    const notifications = await storage.getNotifications(req.userId!);
    res.json(notifications);
  });

  app.patch("/api/notifications/:id", requireAuth, async (req, res) => {
    const notification = await storage.markNotificationRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Powiadomienie nie znalezione" });
    }
    res.json(notification);
  });

  // Team statistics (admin only)
  app.get("/api/team-stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allLeads = await storage.getLeads();
      
      const salesUsers = allUsers.filter(u => u.role === 'SALES');
      
      const teamStats = salesUsers.map(user => {
        const userLeads = allLeads.filter(l => l.assignedToId === user.id);
        const totalLeads = userLeads.length;
        const successLeads = userLeads.filter(l => l.status === 'Sukces').length;
        const failedLeads = userLeads.filter(l => l.status === 'Porazka').length;
        const inProgressLeads = userLeads.filter(l => !['Sukces', 'Porazka'].includes(l.status)).length;
        const successRate = totalLeads > 0 ? Math.round((successLeads / totalLeads) * 100) : 0;
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          totalLeads,
          successLeads,
          failedLeads,
          inProgressLeads,
          successRate,
        };
      });
      
      res.json(teamStats);
    } catch (error) {
      res.status(500).json({ message: "Blad serwera" });
    }
  });

  // Sources routes
  app.get("/api/sources", requireAuth, async (req, res) => {
    const sources = await storage.getSources();
    res.json(sources);
  });

  app.post("/api/admin/sources", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Nazwa zrodla jest wymagana" });
      }
      const source = await storage.createSource({ name: name.trim() });
      res.status(201).json(source);
    } catch (error: any) {
      if (error?.code === '23505') {
        return res.status(400).json({ message: "Zrodlo o tej nazwie juz istnieje" });
      }
      res.status(500).json({ message: "Blad serwera" });
    }
  });

  app.delete("/api/admin/sources/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteSource(req.params.id);
      res.json({ message: "Zrodlo zostalo usuniete" });
    } catch (error) {
      res.status(500).json({ message: "Blad serwera" });
    }
  });

  app.get("/api/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) return res.status(400).send("No url provided");
      
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to fetch image");
      
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/jpeg";
      
      res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).send("Error proxying image");
    }
  });

  return httpServer;
}
