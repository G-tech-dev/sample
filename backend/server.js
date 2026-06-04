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

const SESSION_SECRET = "vrs_session_secret";

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: "mongodb://localhost:27017/vrs",
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
mongoose.connect("mongodb://localhost:27017/vrs")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// ===================== SCHEMAS =====================

// USERS
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: { type: String, default: "admin" }
});
const User = mongoose.model("User", UserSchema);

// CUSTOMER
const CustomerSchema = new mongoose.Schema({
  full_name: String,
  national_id: String,
  phone: String,
  email: String,
  address: String,
});
const Customer = mongoose.model("Customer", CustomerSchema);

// VEHICLE
const VehicleSchema = new mongoose.Schema({
  plate_number: String,
  brand: String,
  model: String,
  year: String,
  vehicle_type: String,
  purchase_price: Number,
  status: { type: String, default: "available" }
});
const Vehicle = mongoose.model("Vehicle", VehicleSchema);

// RESERVATION / RENTAL
const ReservationSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },

  reservation_date: Date,
  start_date: Date,
  end_date: Date,

  reservation_status: { type: String, default: "pending" },

  rental_date: Date,
  return_date: Date,

  rental_fee: Number,
  rental_status: { type: String, default: "not_started" }
});
const Reservation = mongoose.model("Reservation", ReservationSchema);

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
    const { username, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({ username, password: hashed });
    await user.save();

    res.json({ msg: "User created" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.role = user.role;

    res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
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
      username: req.session.username,
      role: req.session.role,
    },
  });
});

// ===================== CUSTOMER CRUD =====================
app.get("/api/customers", verifySession, async (req, res) => {
  res.json(await Customer.find());
});

app.post("/api/customers", verifySession, async (req, res) => {
  const data = new Customer(req.body);
  await data.save();
  res.json(data);
});

app.put("/api/customers/:id", verifySession, async (req, res) => {
  const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete("/api/customers/:id", verifySession, async (req, res) => {
  await Customer.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});

// ===================== VEHICLE CRUD =====================
app.get("/api/vehicles", verifySession, async (req, res) => {
  res.json(await Vehicle.find());
});

app.post("/api/vehicles", verifySession, async (req, res) => {
  const data = new Vehicle(req.body);
  await data.save();
  res.json(data);
});

app.put("/api/vehicles/:id", verifySession, async (req, res) => {
  const updated = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete("/api/vehicles/:id", verifySession, async (req, res) => {
  await Vehicle.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});

// ===================== RESERVATION CRUD =====================
app.get("/api/reservations", verifySession, async (req, res) => {
  const data = await Reservation.find()
    .populate("customer_id")
    .populate("vehicle_id");

  res.json(data);
});

app.post("/api/reservations", verifySession, async (req, res) => {
  const data = new Reservation(req.body);
  await data.save();
  res.json(data);
});

app.put("/api/reservations/:id", verifySession, async (req, res) => {
  const updated = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// RETURN VEHICLE (SPECIAL ACTION)
app.put("/api/reservations/return/:id", verifySession, async (req, res) => {
  const updated = await Reservation.findByIdAndUpdate(
    req.params.id,
    {
      rental_status: "returned",
      return_date: new Date()
    },
    { new: true }
  );

  res.json(updated);
});

app.delete("/api/reservations/:id", verifySession, async (req, res) => {
  await Reservation.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});

// ===================== START SERVER =====================
app.listen(5000, () => {
  console.log("Server running on port 5000");
});