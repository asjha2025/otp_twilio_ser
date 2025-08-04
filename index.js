
// 1. استدعاء الحزم required
require("dotenv").config(); // لتحميل المتغيرات من ملف .env
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

// 2. إعداد متغيرات Twilio
// لا تكتب الرموز هنا أبدًا! سيتم قراءتها من متغيرات البيئة
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = "VA78c9de6320d5f03bc3fe33e696bdf0f4"; // الـ Service SID الخاص بك

const client = twilio(accountSid, authToken);

// 3. إعداد خادم Express
const app = express();
app.use(cors()); // السماح بالطلبات من أي مصدر
app.use(express.json()); // للسماح بقراءة بيانات JSON في الطلبات القادمة

// 4. بناء الـ API Endpoints (نقاط الوصول)

// Endpoint لإرسال رمز التحقق
app.post("/start-verification", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).send("Phone number is required.");
  }

  try {
    const verification = await client.verify.v2.services(verifySid)
      .verifications
      .create({ to: phoneNumber, channel: "sms" });
    res.status(200).send(verification);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Endpoint للتحقق من الرمز
app.post("/check-verification", async (req, res) => {
  const { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
    return res.status(400).send("Phone number and code are required.");
  }

  try {
    const verificationCheck = await client.verify.v2.services(verifySid)
      .verificationChecks
      .create({ to: phoneNumber, code: code });
    res.status(200).send(verificationCheck);
  } catch (error) {
    res.status(500).send(error);
  }
});

// 5. تشغيل الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Hello from OTP Twilio Service!");
});
