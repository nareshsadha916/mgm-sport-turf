# MGM SPORT — Turf Booking Platform 🏟️

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/nareshsadha916/mgm-sport-turf)

An online slot booking platform for football, box cricket, and multi-sport turfs designed per the **Solution Architecture & Project Plan (v1.0)**.

---

## 🚀 One-Click Deploy to Render

Click the button below to deploy this platform directly to [Render.com](https://render.com/):

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/nareshsadha916/mgm-sport-turf)

Or create a **New Web Service** on Render:
1. Connect your GitHub repository: `nareshsadha916/mgm-sport-turf`
2. **Environment**: `Node`
3. **Build Command**: *(leave empty)*
4. **Start Command**: `node server.js`
5. **Plan**: `Free`

---

## ⚡ Features

- **Player Discovery & Slot Booking**: Instant court availability, time bands, and multi-slot booking.
- **3-Layer Anti-Double-Booking Protection**:
  1. Redis 10-minute hold lock simulation (`SET key NX TTL 600s`)
  2. PostgreSQL ACID unique index protection
  3. Razorpay webhook signature verification
- **Pricing & Advance Token**: 100% full prepayment or 30% advance token option with balance at venue.
- **Razorpay Checkout Simulation**: UPI (GPay, PhonePe, Paytm, QR) & Cards.
- **Digital Check-in Pass**: Unique booking ID (`#MGM-2026-XXXX`), dynamic QR code, and **WhatsApp Split-the-Bill** sharing link.
- **Turf Owner Portal**: Live day schedule matrix, fast walk-in counter booking, maintenance court blocking, and dynamic pricing rules.
- **Admin Console**: Platform GMV, KYC venue approvals, Razorpay Route split settlement, and immutable audit logs.
- **Dual Themes**: Stadium Night (Dark) & Day Match (Light Turf) with persistence.
- **Bilingual UI**: Instant toggle between English and Tamil (தமிழ்).

---

## 💻 Local Development

```bash
git clone https://github.com/nareshsadha916/mgm-sport-turf.git
cd mgm-sport-turf
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
