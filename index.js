// 1. استدعاء الحزم
require('dotenv').config(); // لتحميل المتغيرات من ملف .env
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

// 2. إعداد متغيرات Twilio السرية
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = "VA78c9de632dd5f03bc3fe33e696bdf0f4"; // الـ Service SID الخاص بك

const client = twilio(accountSid, authToken);

// ==================== إعدادات مراجعة آبل ====================
const APPLE_REVIEW_PHONE_NUMBER = '+966555555555'; // الرقم الذي ستقدمه لآبل
const APPLE_REVIEW_OTP_CODE = '123456'; // الرمز الثابت الذي ستقدمه لآبل
// ==========================================================

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

  // --- [تعديل مراجعة آبل] ---
  // إذا كان الرقم هو رقم المراجعة، لا ترسل SMS حقيقية
  if (phoneNumber === APPLE_REVIEW_PHONE_NUMBER) {
    console.log(`Apple Review login attempt for ${phoneNumber}. Skipping Twilio.`);
    // أرجع استجابة نجاح وكأن الرمز قد أُرسل
    return res.status(200).send({ success: true, message: 'Review user detected. OTP sent (simulated).' });
  }
  // --- [نهاية التعديل] ---

  try {
    // هذا الكود سيعمل فقط للأرقام العادية
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

  // --- [تعديل مراجعة آبل] ---
  // إذا كان الرقم هو رقم المراجعة والرمز هو الرمز الثابت، اعتبره صحيحًا
  if (phoneNumber === APPLE_REVIEW_PHONE_NUMBER && code === APPLE_REVIEW_OTP_CODE) {
    console.log(`Apple Review OTP check for ${phoneNumber} successful.`);
    // أرجع استجابة نجاح مباشرة دون التحقق من Twilio
    return res.status(200).send({ success: true, message: 'Verification successful!', status: 'approved' });
  }
  // --- [نهاية التعديل] ---

  try {
    // هذا الكود سيعمل فقط للأرقام والرموز العادية
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
    // لا ترسل رسالة "Invalid code" إذا كان الخطأ من Twilio (مثل انتهاء صلاحية الرمز)
    // هذا يعطي رسالة أوضح للمستخدم
    if (error.code === 60202) { // رمز خطأ Twilio لـ "Verification check not found"
        return res.status(400).send({ success: false, message: 'Verification code has expired or is incorrect.' });
    }
    res.status(500).send({ success: false, message: 'Failed to check verification.', error: error.message });
  }
});

// 5. تشغيل الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
