
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

const SESSION_SECRET = "srms_session_secret";

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: "mongodb://localhost:27017/SRMS",
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
mongoose.connect("mongodb://localhost:27017/SRMS")
  .then(() => console.log("MongoDB Connected - SRMS Database"))
  .catch((err) => console.log(err));

// ===================== SCHEMAS =====================

// USERS - UserName (PK), Password
const UserSchema = new mongoose.Schema({
  UserName: { type: String, unique: true, required: true },
  Password: { type: String, required: true }
});
const User = mongoose.model("User", UserSchema);

// ITEMS - ItemName, Specification, UnitMeasure, Quantity, UnitPrice, TotalQuantity
const ItemSchema = new mongoose.Schema({
  ItemName: { type: String, required: true },
  Specification: String,
  UnitMeasure: String,
  Quantity: { type: Number, default: 0 },
  UnitPrice: { type: Number, required: true },
  TotalQuantity: { type: Number, default: 0 }
});
const Item = mongoose.model("Item", ItemSchema);

// SALES - SaleDate, CustomerName, TotalPrice
const SaleSchema = new mongoose.Schema({
  SaleDate: { type: Date, default: Date.now },
  CustomerName: { type: String, required: true },
  TotalPrice: { type: Number, default: 0 },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});
const Sale = mongoose.model("Sale", SaleSchema);

// SALE DETAIL - QuantitySold, SubTotalPrice
const SaleDetailSchema = new mongoose.Schema({
  sale_id: { type: mongoose.Schema.Types.ObjectId, ref: "Sale", required: true },
  item_id: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  QuantitySold: { type: Number, required: true },
  SubTotalPrice: { type: Number, required: true },
  UnitPriceAtSale: { type: Number, required: true },
  ItemName: String,
  Specification: String,
  UnitMeasure: String
});
const SaleDetail = mongoose.model("SaleDetail", SaleDetailSchema);

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
    const { UserName, Password } = req.body;
    
    const existingUser = await User.findOne({ UserName });
    if (existingUser) {
      return res.status(400).json({ msg: "Username already exists" });
    }
    
    const hashed = await bcrypt.hash(Password, 10);
    const user = new User({ UserName, Password: hashed });
    await user.save();
    
    res.json({ msg: "User created successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { UserName, Password } = req.body;
    
    const user = await User.findOne({ UserName });
    if (!user) return res.status(400).json({ msg: "User not found" });
    
    const match = await bcrypt.compare(Password, user.Password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });
    
    req.session.userId = user._id;
    req.session.UserName = user.UserName;
    
    res.json({
      user: {
        id: user._id,
        UserName: user.UserName,
      },
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// LOGOUT
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ msg: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ msg: "Logged out" });
  });
});

// CHECK SESSION
app.get("/api/auth/me", (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ msg: "Not authenticated" });
  }
  return res.json({
    user: {
      id: req.session.userId,
      UserName: req.session.UserName,
    },
  });
});

// ===================== ITEMS CRUD =====================

// GET all items
app.get("/api/items", verifySession, async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET single item
app.get("/api/items/:id", verifySession, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json(err);
  }
});

// CREATE item
app.post("/api/items", verifySession, async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPDATE item
app.put("/api/items/:id", verifySession, async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    if (!updated) return res.status(404).json({ msg: "Item not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE item
app.delete("/api/items/:id", verifySession, async (req, res) => {
  try {
    const relatedSaleDetails = await SaleDetail.findOne({ item_id: req.params.id });
    if (relatedSaleDetails) {
      return res.status(400).json({ msg: "Cannot delete item with existing sale records" });
    }
    await Item.findByIdAndDelete(req.params.id);
    res.json({ msg: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// SEARCH items
app.get("/api/items/search/:keyword", verifySession, async (req, res) => {
  try {
    const keyword = req.params.keyword;
    const items = await Item.find({
      $or: [
        { ItemName: { $regex: keyword, $options: 'i' } },
        { Specification: { $regex: keyword, $options: 'i' } }
      ]
    });
    res.json(items);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ===================== SALES CRUD =====================

// GET all sales
app.get("/api/sales", verifySession, async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("user_id", "UserName")
      .sort({ SaleDate: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET single sale with details
app.get("/api/sales/:id", verifySession, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate("user_id", "UserName");
    if (!sale) return res.status(404).json({ msg: "Sale not found" });
    
    const details = await SaleDetail.find({ sale_id: sale._id }).populate("item_id", "ItemName Specification UnitMeasure UnitPrice");
    
    res.json({ sale, details });
  } catch (err) {
    res.status(500).json(err);
  }
});

// CREATE sale (with multiple details)
app.post("/api/sales", verifySession, async (req, res) => {
  try {
    const { CustomerName, items } = req.body;
    
    let totalPrice = 0;
    const saleDetails = [];
    
    // Process each item in the sale
    for (const saleItem of items) {
      const item = await Item.findById(saleItem.item_id);
      if (!item) {
        return res.status(404).json({ msg: `Item not found: ${saleItem.item_id}` });
      }
      
      // Check if enough quantity is available
      if (item.Quantity < saleItem.QuantitySold) {
        return res.status(400).json({ 
          msg: `Insufficient stock for ${item.ItemName}. Available: ${item.Quantity}, Requested: ${saleItem.QuantitySold}` 
        });
      }
      
      const subTotal = saleItem.QuantitySold * item.UnitPrice;
      totalPrice += subTotal;
      
      saleDetails.push({
        item_id: item._id,
        QuantitySold: saleItem.QuantitySold,
        SubTotalPrice: subTotal,
        UnitPriceAtSale: item.UnitPrice,
        ItemName: item.ItemName,
        Specification: item.Specification,
        UnitMeasure: item.UnitMeasure
      });
      
      // Update item quantity
      item.Quantity -= saleItem.QuantitySold;
      await item.save();
    }
    
    // Create sale record
    const sale = new Sale({
      CustomerName,
      TotalPrice: totalPrice,
      user_id: req.session.userId,
      SaleDate: new Date()
    });
    await sale.save();
    
    // Create sale details
    for (const detail of saleDetails) {
      const saleDetail = new SaleDetail({
        ...detail,
        sale_id: sale._id
      });
      await saleDetail.save();
    }
    
    const populatedSale = await Sale.findById(sale._id).populate("user_id", "UserName");
    const savedDetails = await SaleDetail.find({ sale_id: sale._id }).populate("item_id");
    
    res.json({ sale: populatedSale, details: savedDetails });
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPDATE sale
app.put("/api/sales/:id", verifySession, async (req, res) => {
  try {
    const updated = await Sale.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).populate("user_id", "UserName");
    
    if (!updated) return res.status(404).json({ msg: "Sale not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE sale
app.delete("/api/sales/:id", verifySession, async (req, res) => {
  try {
    // Get all sale details to restore quantities
    const saleDetails = await SaleDetail.find({ sale_id: req.params.id });
    
    // Restore item quantities
    for (const detail of saleDetails) {
      const item = await Item.findById(detail.item_id);
      if (item) {
        item.Quantity += detail.QuantitySold;
        await item.save();
      }
    }
    
    // Delete sale details and sale
    await SaleDetail.deleteMany({ sale_id: req.params.id });
    await Sale.findByIdAndDelete(req.params.id);
    
    res.json({ msg: "Sale deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// ===================== SALE DETAILS ROUTES =====================

// GET sale details by sale ID
app.get("/api/saledetails/:sale_id", verifySession, async (req, res) => {
  try {
    const details = await SaleDetail.find({ sale_id: req.params.sale_id })
      .populate("item_id", "ItemName Specification UnitMeasure UnitPrice");
    res.json(details);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ===================== REPORTING ROUTES =====================

// Generate daily sales report
app.get("/api/reports/daily/:date", verifySession, async (req, res) => {
  try {
    const reportDate = new Date(req.params.date);
    const startOfDay = new Date(reportDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(reportDate.setHours(23, 59, 59, 999));
    
    // Find all sales for the specified date
    const sales = await Sale.find({
      SaleDate: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const saleIds = sales.map(sale => sale._id);
    
    // Get all sale details for those sales
    const saleDetails = await SaleDetail.find({ sale_id: { $in: saleIds } })
      .populate("item_id");
    
    // Calculate total amount for all sales
    const totalAmount = sales.reduce((sum, sale) => sum + sale.TotalPrice, 0);
    
    // Prepare report data with sold items
    const soldItems = saleDetails.map(detail => ({
      ItemName: detail.ItemName,
      Specification: detail.Specification,
      UnitMeasure: detail.UnitMeasure,
      UnitPrice: detail.UnitPriceAtSale,
      QuantitySold: detail.QuantitySold,
      SubTotalPrice: detail.SubTotalPrice,
      SaleDate: sales.find(s => s._id.equals(detail.sale_id))?.SaleDate
    }));
    
    res.json({
      reportDate: startOfDay,
      totalAmount: totalAmount,
      totalSales: sales.length,
      soldItems: soldItems,
      sales: sales.map(sale => ({
        saleId: sale._id,
        customerName: sale.CustomerName,
        totalPrice: sale.TotalPrice,
        saleDate: sale.SaleDate
      }))
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get sales report for date range
app.get("/api/reports/range/:startDate/:endDate", verifySession, async (req, res) => {
  try {
    const startDate = new Date(req.params.startDate);
    const endDate = new Date(req.params.endDate);
    endDate.setHours(23, 59, 59, 999);
    
    const sales = await Sale.find({
      SaleDate: { $gte: startDate, $lte: endDate }
    }).sort({ SaleDate: -1 });
    
    const totalAmount = sales.reduce((sum, sale) => sum + sale.TotalPrice, 0);
    
    res.json({
      startDate: startDate,
      endDate: endDate,
      totalAmount: totalAmount,
      totalSales: sales.length,
      sales: sales
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get current stock levels
app.get("/api/stock/summary", verifySession, async (req, res) => {
  try {
    const items = await Item.find();
    const stockSummary = items.map(item => ({
      ItemName: item.ItemName,
      Specification: item.Specification,
      UnitMeasure: item.UnitMeasure,
      UnitPrice: item.UnitPrice,
      CurrentQuantity: item.Quantity,
      TotalQuantityReceived: item.TotalQuantity || item.Quantity,
      ValueInStock: item.Quantity * item.UnitPrice
    }));
    
    res.json(stockSummary);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Search sales by customer name
app.get("/api/sales/search/:customerName", verifySession, async (req, res) => {
  try {
    const sales = await Sale.find({
      CustomerName: { $regex: req.params.customerName, $options: 'i' }
    }).populate("user_id", "UserName").sort({ SaleDate: -1 });
    
    res.json(sales);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ===================== START SERVER =====================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`SRMS Server running on port ${PORT}`);
  console.log("Database: SRMS");
  console.log("Collections: users, items, sales, saledetails");
  console.log("\n=== SRMS API Endpoints ===");
  console.log("Auth: /api/auth/register, /api/auth/login, /api/auth/logout");
  console.log("Items: GET/POST/PUT/DELETE /api/items");
  console.log("Sales: GET/POST/PUT/DELETE /api/sales");
  console.log("Reports: /api/reports/daily/:date");
  console.log("Stock Summary: /api/stock/summary");
});