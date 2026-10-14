/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import Database from "better-sqlite3";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), "yarn_stash.db");
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Schema Upgrade: If table exists with old columns like "weight" or "yardage", we drop it to cleanly migrate to hookSizes and meters.
  try {
    const info = db.prepare("PRAGMA table_info(yarn_skeins)").all() as { name: string }[];
    const hasWeight = info.some(col => col.name === 'weight');
    const hasYardage = info.some(col => col.name === 'yardage');
    if (hasWeight || hasYardage) {
      console.log("Migration needed for yarn_skeins. Rebuilding schema with 'meters' and 'hookSizes'...");
      db.prepare("DROP TABLE IF EXISTS yarn_skeins").run();
    }
  } catch (e) {
    console.error("Migration check failed:", e);
  }

  // Create primary skeins table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS yarn_skeins (
      id TEXT PRIMARY KEY,
      brand TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      colorHex TEXT,
      hookSizes TEXT NOT NULL, -- Comma-separated sizes list e.g. "4.0,4.5,5.0"
      meters INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL
    )
  `).run();

  // Create brand_lines list table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS brand_lines (
      id TEXT PRIMARY KEY,
      brand TEXT NOT NULL,
      line TEXT NOT NULL,
      UNIQUE(brand, line) ON CONFLICT IGNORE
    )
  `).run();

  // Seed default brand & line combinations to start user off
  const brandLinesCount = db.prepare("SELECT COUNT(*) as cnt FROM brand_lines").get() as { cnt: number };
  if (brandLinesCount.cnt === 0) {
    const defaultBrandLines = [
      { id: 'bl-1', brand: 'Malabrigo', line: 'Rios' },
      { id: 'bl-2', brand: 'Malabrigo', line: 'Washted' },
      { id: 'bl-3', brand: 'Malabrigo', line: 'Sock Merino' },
      { id: 'bl-4', brand: 'Cascade Yarns', line: '220 Heathers' },
      { id: 'bl-5', brand: 'Cascade Yarns', line: 'Heritage Sock' },
      { id: 'bl-6', brand: 'Cascade Yarns', line: 'Pacific Worsted' },
      { id: 'bl-7', brand: 'Noro', line: 'Silk Garden' },
      { id: 'bl-8', brand: 'Shibui Knits', line: 'Silk Cloud' },
      { id: 'bl-9', brand: 'Sandnes Garn', line: 'Double Sunday' },
      { id: 'bl-10', brand: 'Lana Grossa', line: 'Cool Wool' }
    ];

    const insertBL = db.prepare("INSERT INTO brand_lines (id, brand, line) VALUES (?, ?, ?)");
    for (const item of defaultBrandLines) {
      insertBL.run(item.id, item.brand, item.line);
    }
    console.log("Seeded default brand and lines helper table.");
  }

  // Seed initial yarns if empty
  const countRow = db.prepare("SELECT COUNT(*) as cnt FROM yarn_skeins").get() as { cnt: number };
  if (countRow.cnt === 0) {
    const initialYarns = [
      {
        id: 'skein-1',
        brand: 'Malabrigo',
        name: 'Rios',
        color: 'Sunset Glow',
        colorHex: '#D38E75',
        hookSizes: '4.5,5.0,5.5',
        meters: 192,
        quantity: 4,
        notes: '100% Superwash Merino Wool. Incredibly soft, plyed yarn. Scheduled for a cozy winter cables hat and scarf combo.',
        createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      },
      {
        id: 'skein-2',
        brand: 'Cascade Yarns',
        name: '220 Heathers',
        color: 'Sage Moss',
        colorHex: '#A3B899',
        hookSizes: '4.5,5.0',
        meters: 201,
        quantity: 6,
        notes: '100% Peruvian Highland Wool. Perfect classic heather gray-green. Great structural definition for cable-knitting or cardigans.',
        createdAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
      },
      {
        id: 'skein-3',
        brand: 'Noro',
        name: 'Silk Garden',
        color: 'Vintage Lilac Blend',
        colorHex: '#A19CB3',
        hookSizes: '4.5,5.0,5.5',
        meters: 100,
        quantity: 2,
        notes: '45% Silk, 45% Mohair, 10% Wool. Self-striping premium luxury fiber. Rich transitions. Need 1 more skein for a full cowl.',
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      },
      {
        id: 'skein-4',
        brand: 'Shibui Knits',
        name: 'Silk Cloud',
        color: 'Mist Gray',
        colorHex: '#E6DFD3',
        hookSizes: '2.25,2.75,3.0,3.25',
        meters: 297,
        quantity: 0,
        notes: '60% Kid Mohair, 40% Silk. Used for blending or featherweight knits. Out of stock - fully knitted into holding-yarn shawl.',
        createdAt: new Date(Date.now() - 3600000 * 24 * 25).toISOString(),
      }
    ];

    const insert = db.prepare(`
      INSERT INTO yarn_skeins (id, brand, name, color, colorHex, hookSizes, meters, quantity, notes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of initialYarns) {
      insert.run(item.id, item.brand, item.name, item.color, item.colorHex, item.hookSizes, item.meters, item.quantity, item.notes, item.createdAt);
    }
  }

  app.use(express.json());

  // API Skeins Routes
  app.get("/api/skeins", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM yarn_skeins ORDER BY createdAt DESC").all();
      res.json(rows);
    } catch (error) {
      console.error("GET /api/skeins error:", error);
      res.status(500).json({ error: "Failed to fetch yarn stash from database" });
    }
  });

  app.post("/api/skeins", (req, res) => {
    try {
      const { brand, name, color, colorHex, hookSizes, meters, quantity, notes } = req.body;
      const id = `skein-${Date.now()}`;
      const createdAt = new Date().toISOString();

      db.prepare(`
        INSERT INTO yarn_skeins (id, brand, name, color, colorHex, hookSizes, meters, quantity, notes, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, 
        brand, 
        name, 
        color, 
        colorHex, 
        hookSizes || "", 
        Number(meters) || 0, 
        Number(quantity) || 0, 
        notes || "", 
        createdAt
      );

      const newItem = db.prepare("SELECT * FROM yarn_skeins WHERE id = ?").get(id);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("POST /api/skeins error:", error);
      res.status(500).json({ error: "Failed to store yarn to database" });
    }
  });

  app.put("/api/skeins/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { brand, name, color, colorHex, hookSizes, meters, quantity, notes } = req.body;

      db.prepare(`
        UPDATE yarn_skeins
        SET brand = ?, name = ?, color = ?, colorHex = ?, hookSizes = ?, meters = ?, quantity = ?, notes = ?
        WHERE id = ?
      `).run(
        brand, 
        name, 
        color, 
        colorHex, 
        hookSizes || "", 
        Number(meters) || 0, 
        Number(quantity) || 0, 
        notes || "", 
        id
      );

      const updatedItem = db.prepare("SELECT * FROM yarn_skeins WHERE id = ?").get(id);
      if (!updatedItem) {
        res.status(404).json({ error: "Skein not found" });
        return;
      }
      res.json(updatedItem);
    } catch (error) {
      console.error("PUT /api/skeins error:", error);
      res.status(500).json({ error: "Failed to update yarn in database" });
    }
  });

  app.delete("/api/skeins/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.prepare("DELETE FROM yarn_skeins WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      console.error("DELETE /api/skeins error:", error);
      res.status(500).json({ error: "Failed to delete yarn from database" });
    }
  });

  // Reset API reset-samples route
  app.post("/api/skeins/reset-samples", (req, res) => {
    try {
      db.prepare("DELETE FROM yarn_skeins").run();
      const initialYarns = [
        {
          id: 'skein-1',
          brand: 'Malabrigo',
          name: 'Rios',
          color: 'Sunset Glow',
          colorHex: '#D38E75',
          hookSizes: '4.5,5.0,5.5',
          meters: 192,
          quantity: 4,
          notes: '100% Superwash Merino Wool. Incredibly soft, plyed yarn. Scheduled for a cozy winter cables hat and scarf combo.',
          createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
        },
        {
          id: 'skein-2',
          brand: 'Cascade Yarns',
          name: '220 Heathers',
          color: 'Sage Moss',
          colorHex: '#A3B899',
          hookSizes: '4.5,5.0',
          meters: 201,
          quantity: 6,
          notes: '100% Peruvian Highland Wool. Perfect classic heather gray-green. Great structural definition for cable-knitting or cardigans.',
          createdAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
        }
      ];

      const insert = db.prepare(`
        INSERT INTO yarn_skeins (id, brand, name, color, colorHex, hookSizes, meters, quantity, notes, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of initialYarns) {
        insert.run(item.id, item.brand, item.name, item.color, item.colorHex, item.hookSizes, item.meters, item.quantity, item.notes, item.createdAt);
      }

      const rows = db.prepare("SELECT * FROM yarn_skeins ORDER BY createdAt DESC").all();
      res.json(rows);
    } catch (error) {
      console.error("POST /api/skeins/reset-samples error:", error);
      res.status(557).json({ error: "Failed to reload sample catalog database" });
    }
  });

  // Bulk Import API endpoint
  app.post("/api/skeins/bulk", (req, res) => {
    try {
      const arr = req.body;
      if (!Array.isArray(arr)) {
        res.status(400).json({ error: "Expected array of elements" });
        return;
      }

      const insert = db.prepare(`
        INSERT INTO yarn_skeins (id, brand, name, color, colorHex, hookSizes, meters, quantity, notes, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertBL = db.prepare(`
        INSERT OR IGNORE INTO brand_lines (id, brand, line)
        VALUES (?, ?, ?)
      `);

      const transaction = db.transaction((items) => {
        for (const item of items) {
          const randSuffix = Math.random().toString(36).substring(2, 7);
          const id = `skein-${Date.now()}-${randSuffix}`;
          const brand = (item.brand || "Unknown").trim();
          const name = (item.name || item.line || "Unknown").trim();
          const color = (item.color || "Undyed/Oatmeal").trim();
          const colorHex = item.colorHex || '#E6DFD3';
          const hookSizes = item.hookSizes || "";
          const meters = Number(item.meters) || 0;
          const quantity = Number(item.quantity) || 0;
          const notes = item.notes || "";
          const createdAt = item.createdAt || new Date().toISOString();

          insert.run(id, brand, name, color, colorHex, hookSizes, meters, quantity, notes, createdAt);
          
          const bl_id = `bl-${Date.now()}-${randSuffix}`;
          insertBL.run(bl_id, brand, name);
        }
      });

      transaction(arr);
      
      const rows = db.prepare("SELECT * FROM yarn_skeins ORDER BY createdAt DESC").all();
      res.json(rows);
    } catch (error) {
      console.error("POST /api/skeins/bulk error:", error);
      res.status(500).json({ error: "Failed to bulk upload yarn items" });
    }
  });

  // Purge / Clear all inventory database
  app.post("/api/skeins/purge", (req, res) => {
    try {
      db.prepare("DELETE FROM yarn_skeins").run();
      res.json({ success: true });
    } catch (error) {
      console.error("POST /api/skeins/purge error:", error);
      res.status(500).json({ error: "Failed to purge database inventory" });
    }
  });


  // ============================================
  // BRAND & LINES API ENDPOINTS
  // ============================================
  app.get("/api/brand-lines", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM brand_lines ORDER BY brand ASC, line ASC").all();
      res.json(rows);
    } catch (e) {
      console.error("GET /api/brand-lines error:", e);
      res.status(500).json({ error: "Failed to read brand catalog reference list" });
    }
  });

  app.post("/api/brand-lines", (req, res) => {
    try {
      const { brand, line } = req.body;
      if (!brand || !brand.trim() || !line || !line.trim()) {
        res.status(400).json({ error: "Brand and yarn line string values are required." });
        return;
      }
      
      const cleanBrand = brand.trim();
      const cleanLine = line.trim();
      const id = `bl-${Date.now()}`;

      // Insert or ignore
      db.prepare(`
        INSERT INTO brand_lines (id, brand, line)
        VALUES (?, ?, ?)
      `).run(id, cleanBrand, cleanLine);

      // Fetch the actual record (if matched unique constraint, fetched)
      let record = db.prepare("SELECT * FROM brand_lines WHERE brand = ? AND line = ?").get(cleanBrand, cleanLine);
      if (!record) {
        record = { id, brand: cleanBrand, line: cleanLine };
      }
      res.status(201).json(record);
    } catch (e) {
      console.error("POST /api/brand-lines error:", e);
      res.status(500).json({ error: "Failed to supplement brand and line registry database" });
    }
  });

  app.delete("/api/brand-lines/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.prepare("DELETE FROM brand_lines WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (e) {
      console.error("DELETE /api/brand-lines error:", e);
      res.status(500).json({ error: "Failed to remove brand/line registry option" });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
