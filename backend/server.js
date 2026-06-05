const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const app = express();

// ===================== MIDDLEWARE =====================
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

const SESSION_SECRET = "sms_session_secret";

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: "mongodb://localhost:27017/sms",
    collectionName: "sessions",
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

// ===================== MONGODB CONNECTION =====================
mongoose.connect("mongodb://localhost:27017/sms")
  .then(() => console.log("MongoDB Connected - SMS Database"))
  .catch((err) => console.log(err));

// ===================== SCHEMAS =====================

// USERS
const UserSchema = new mongoose.Schema({
  user_name: String,
  password: String,
});
const User = mongoose.model("User", UserSchema);

// STOCK IN
const StockInSchema = new mongoose.Schema({
  itemname: String,
  description: String,
  quantityIn: Number,
  TotalQuantityIn: Number,
  supplierName: String,
  stockIndate: Date,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});
const StockIn = mongoose.model("StockIn", StockInSchema);

// STOCK OUT
const StockOutSchema = new mongoose.Schema({
  quantityout: Number,
  totalquantityout: Number,
  stockoutDate: Date,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  stockin_id: { type: mongoose.Schema.Types.ObjectId, ref: "StockIn" },
});
const StockOut = mongoose.model("StockOut", StockOutSchema);

// ===================== AUTH MIDDLEWARE =====================
const verifySession = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ msg: "Not authenticated" });
  }
  next();
};

// ===================== AUTH ROUTES =====================

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { user_name, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({ user_name, password: hashed });
    await user.save();

    res.json({ msg: "User created successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { user_name, password } = req.body;

    const user = await User.findOne({ user_name });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    req.session.userId = user._id;
    req.session.user_name = user.user_name;

    res.json({
      user: {
        id: user._id,
        user_name: user.user_name,
      },
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ msg: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ msg: "Logged out" });
  });
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ msg: "Not authenticated" });
  }
  return res.json({
    user: {
      id: req.session.userId,
      user_name: req.session.user_name,
    },
  });
});

// ===================== STOCK IN CRUD =====================

// GET all stock in entries
app.get("/api/stockin", verifySession, async (req, res) => {
  try {
    const stockInEntries = await StockIn.find().populate("user_id", "user_name");
    res.json(stockInEntries);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET single stock in entry
app.get("/api/stockin/:id", verifySession, async (req, res) => {
  try {
    const stockInEntry = await StockIn.findById(req.params.id).populate("user_id", "user_name");
    if (!stockInEntry) return res.status(404).json({ msg: "Stock in entry not found" });
    res.json(stockInEntry);
  } catch (err) {
    res.status(500).json(err);
  }
});

// CREATE stock in entry
app.post("/api/stockin", verifySession, async (req, res) => {
  try {
    const stockInData = {
      ...req.body,
      user_id: req.session.userId,
      stockIndate: req.body.stockIndate || new Date()
    };
    const stockIn = new StockIn(stockInData);
    await stockIn.save();
    
    const populatedStockIn = await StockIn.findById(stockIn._id).populate("user_id", "user_name");
    res.json(populatedStockIn);
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPDATE stock in entry
app.put("/api/stockin/:id", verifySession, async (req, res) => {
  try {
    const updated = await StockIn.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).populate("user_id", "user_name");
    
    if (!updated) return res.status(404).json({ msg: "Stock in entry not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE stock in entry (only if no related stock out entries)
app.delete("/api/stockin/:id", verifySession, async (req, res) => {
  try {
    const relatedStockOut = await StockOut.findOne({ stockin_id: req.params.id });
    if (relatedStockOut) {
      return res.status(400).json({ msg: "Cannot delete stock in entry with existing stock out records" });
    }
    
    await StockIn.findByIdAndDelete(req.params.id);
    res.json({ msg: "Stock in entry deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// ===================== STOCK OUT CRUD =====================

// GET all stock out entries
app.get("/api/stockout", verifySession, async (req, res) => {
  try {
    const stockOutEntries = await StockOut.find()
      .populate("user_id", "user_name")
      .populate("stockin_id", "itemname description quantityIn supplierName");
    res.json(stockOutEntries);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET single stock out entry
app.get("/api/stockout/:id", verifySession, async (req, res) => {
  try {
    const stockOutEntry = await StockOut.findById(req.params.id)
      .populate("user_id", "user_name")
      .populate("stockin_id", "itemname description quantityIn supplierName");
    
    if (!stockOutEntry) return res.status(404).json({ msg: "Stock out entry not found" });
    res.json(stockOutEntry);
  } catch (err) {
    res.status(500).json(err);
  }
});

// CREATE stock out entry
app.post("/api/stockout", verifySession, async (req, res) => {
  try {
    // Check if stock in entry exists and has enough quantity
    const stockInEntry = await StockIn.findById(req.body.stockin_id);
    if (!stockInEntry) {
      return res.status(404).json({ msg: "Stock in entry not found" });
    }
    
    // Calculate total quantity out for this stock in entry
    const existingStockOut = await StockOut.find({ stockin_id: req.body.stockin_id });
    const totalOutSoFar = existingStockOut.reduce((sum, item) => sum + item.quantityout, 0);
    
    const newQuantityOut = req.body.quantityout;
    const remainingQuantity = stockInEntry.quantityIn - totalOutSoFar;
    
    if (newQuantityOut > remainingQuantity) {
      return res.status(400).json({ 
        msg: `Insufficient stock. Available quantity: ${remainingQuantity}` 
      });
    }
    
    const stockOutData = {
      ...req.body,
      user_id: req.session.userId,
      stockoutDate: req.body.stockoutDate || new Date(),
      totalquantityout: newQuantityOut // You can set this as needed
    };
    
    const stockOut = new StockOut(stockOutData);
    await stockOut.save();
    
    const populatedStockOut = await StockOut.findById(stockOut._id)
      .populate("user_id", "user_name")
      .populate("stockin_id", "itemname description quantityIn supplierName");
    
    res.json(populatedStockOut);
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPDATE stock out entry
app.put("/api/stockout/:id", verifySession, async (req, res) => {
  try {
    const updated = await StockOut.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).populate("user_id", "user_name")
     .populate("stockin_id", "itemname description quantityIn supplierName");
    
    if (!updated) return res.status(404).json({ msg: "Stock out entry not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE stock out entry
app.delete("/api/stockout/:id", verifySession, async (req, res) => {
  try {
    await StockOut.findByIdAndDelete(req.params.id);
    res.json({ msg: "Stock out entry deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// ===================== ADDITIONAL SMS SPECIFIC ROUTES =====================

// Get current stock levels (summary)
app.get("/api/stock/summary", verifySession, async (req, res) => {
  try {
    const stockInEntries = await StockIn.find();
    const stockSummary = [];
    
    for (const stockIn of stockInEntries) {
      const stockOuts = await StockOut.find({ stockin_id: stockIn._id });
      const totalOut = stockOuts.reduce((sum, out) => sum + out.quantityout, 0);
      const currentStock = stockIn.quantityIn - totalOut;
      
      stockSummary.push({
        itemname: stockIn.itemname,
        description: stockIn.description,
        totalReceived: stockIn.quantityIn,
        totalIssued: totalOut,
        currentStock: currentStock,
        supplierName: stockIn.supplierName,
        lastStockInDate: stockIn.stockIndate
      });
    }
    
    res.json(stockSummary);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get stock history for specific item
app.get("/api/stock/history/:stockin_id", verifySession, async (req, res) => {
  try {
    const stockIn = await StockIn.findById(req.params.stockin_id).populate("user_id", "user_name");
    if (!stockIn) {
      return res.status(404).json({ msg: "Stock in entry not found" });
    }
    
    const stockOuts = await StockOut.find({ stockin_id: req.params.stockin_id })
      .populate("user_id", "user_name");
    
    res.json({
      stockIn: stockIn,
      stockOuts: stockOuts,
      totalOut: stockOuts.reduce((sum, out) => sum + out.quantityout, 0),
      remainingStock: stockIn.quantityIn - stockOuts.reduce((sum, out) => sum + out.quantityout, 0)
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// ===================== START SERVER =====================
app.listen(5000, () => {
  console.log("SMS Server running on port 5000");
  console.log("Database: sms");
  console.log("Collections: users, stockins, stockouts");
});