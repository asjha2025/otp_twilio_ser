// index.js

// 1. استدعاء الحزم
require('dotenv').config(); // لتحميل المتغيرات من ملف .env
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

// 2. إعداد متغيرات Twilio السرية
// لا تكتب الرموز هنا أبداً! سيتم قراءتها من متغيرات البيئة
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = "VA78c9de632dd5f03bc3fe33e696bdf0f4"; // الـ Service SID الخاص بك

const client = twilio(accountSid, authToken);

// 3. إعداد خادم Express
const app = express();
app.use(cors()); // السماح بالطلبات من أي مصدر
app.use(express.json()); // للسماح بقراءة بيانات JSON القادمة في الطلبات

// 4. إنشاء الـ API Endpoints (نقاط الوصول)

// Endpoint لإرسال رمز التحقق
app.post('/start-verification', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).send({ success: false, message: 'Phone number is required.' });
  }

  try {
    const verification = await client.verify.v2.services(verifySid)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });
    
    res.status(200).send({ success: true, message: 'Verification code sent.', status: verification.status });
  } catch (error) {
    console.error("Error sending verification:", error);
    res.status(500).send({ success: false, message: 'Failed to send verification code.', error: error.message });
  }
});

// Endpoint للتحقق من صحة الرمز
app.post('/check-verification', async (req, res) => {
  const { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
    return res.status(400).send({ success: false, message: 'Phone number and code are required.' });
  }

  try {
    const verificationCheck = await client.verify.v2.services(verifySid)
      .verificationChecks
      .create({ to: phoneNumber, code: code });

    if (verificationCheck.status === 'approved') {
      res.status(200).send({ success: true, message: 'Verification successful!', status: verificationCheck.status });
    } else {
      res.status(400).send({ success: false, message: 'Invalid verification code.', status: verificationCheck.status });
    }
  } catch (error) {
    console.error("Error checking verification:", error);
    res.status(500).send({ success: false, message: 'Failed to check verification.', error: error.message });
  }
});

// 5. تشغيل الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
