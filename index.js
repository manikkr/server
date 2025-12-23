import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
app.use(cors());
app.use(express.json());

/*
========================================
 Firebase Admin Initialization
========================================
 Service account is loaded from ENV
 (Render → Environment Variables)
*/

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("❌ FIREBASE_SERVICE_ACCOUNT env missing");
}

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/*
========================================
 API : Send Command to Child App
========================================
*/

app.post("/send-command", async (req, res) => {
  try {
    const { fcmToken, action, camera } = req.body;

    if (!fcmToken || !action) {
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

    res.json({
      success: true,
      message: "✅ FCM command sent",
      response
    });

  } catch (error) {
    console.error("FCM ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/*
========================================
 Health Check API
========================================
*/

app.get("/", (req, res) => {
  res.send("✅ FCM Backend is running");
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
