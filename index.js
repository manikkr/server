import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const app = express();

/*
========================================
 Middleware
========================================
*/
app.use(cors());
app.use(express.json({ limit: "1mb" }));

/*
========================================
 Firebase Admin Initialization
========================================
*/
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT env missing");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("✅ Firebase Admin initialized");

/*
========================================
 API : SEND COMMAND (DEBUG ENABLED)
========================================
*/
app.post("/send-command", async (req, res) => {

  // 🔥 FINAL PROOF LOGS
  console.log("=================================");
  console.log("🔥 REQUEST RECEIVED");
  console.log("🔥 HEADERS:", req.headers);
  console.log("🔥 BODY:", req.body);
  console.log("=================================");

  try {
    const { fcmToken, action, camera } = req.body;

    if (!fcmToken || !action) {
      console.log("❌ Missing fcmToken or action");
      return res.status(400).json({
        success: false,
        message: "fcmToken and action are required"
      });
    }

    const message = {
      token: fcmToken,
      data: {
        action: action,
        ...(camera && { camera: camera })
      },
      android: {
        priority: "high"
      }
    };

    const response = await admin.messaging().send(message);

    console.log("✅ FCM SENT SUCCESSFULLY:", response);

    return res.json({
      success: true,
      message: "FCM command sent",
      response
    });

  } catch (error) {
    console.error("❌ FCM SEND ERROR:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/*
========================================
 Health Check
========================================
*/
app.get("/", (req, res) => {
  res.send("✅ FCM Backend is running (DEBUG MODE)");
});

/*
========================================
 Start Server
========================================
*/
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
