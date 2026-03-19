# 🛡️ Gig guard: Income Protection for Gig Workers
"Because no worker should have to choose between their safety and their livelihood."

---

## 📋 Table of Contents 
1. The Problem  
2. Our Solution  
3. How It Works  
4. Risk Classification System  
5. Fraud Detection & Security  
6. Adversarial Defense & Anti-Spoofing Strategy  
7. Tech Stack  
8. Key Features  
9. Target Users  
10. Market Opportunity  
11. Benefits  

---


## ⚠️ The Problem

### 📊 Scale of the Crisis

- The global gig economy employs over 1.5 billion people worldwide. In India alone, the gig workforce is projected to reach 23.5 million workers by 2030 (NITI Aayog). Yet this massive workforce operates in a financial vacuum — no paid leave, no employee benefits, and crucially, no income protection when they can't work.  
---

### 🌦️ Weather: 

Weather disruptions are one of the most frequent and unpredictable causes of income loss for gig workers. Consider:  

- A Zomato delivery partner cannot ride in heavy flooding — they earn zero for the day  
- A Rapido bike taxi driver stops working during a heatwave warning — no compensation  

These are not rare events. In India, weather disruptions affect gig workers on average 40–60 days per year in high-risk zones.  

---

###  Existing Gaps

| Gap | Reality |
|-----|--------|
| Platform Responsibility | Gig platforms classify workers as "independent contractors" — legally absolving themselves of income guarantees |
| Traditional Insurance | Complex, expensive, requires physical documentation, slow claims (weeks to months) |
| Government Schemes | Generally designed for formal sector employees; gig workers are excluded or underserved |
| Savings Culture | Most gig workers earn at or near subsistence level — savings buffers are minimal to non-existent |

The result: gig workers bear 100% of the financial risk from environmental disruptions, with no institutional support.  

---
### Our Solution
---
## 💡 What is GigGuard?

> **GigGuard** is a web-based micro-insurance platform that provides automated, weather-triggered income compensation to gig workers. Think of it as a **financial airbag** — invisible when not needed, but instantly protective when a crisis hits.

---

GigGuard sits at the intersection of three powerful technologies:
```
Real-Time Weather Data  +  AI Risk Assessment  +  Automated Insurance Engine
                                    =
         Instant, Fair, Transparent Income Protection for Gig Workers
```

---

## 🎯 Core Value Proposition

| For Workers | For Society |
|---|---|
| Income stability during disruptions | Reduced poverty and social vulnerability |
| Peace of mind to prioritize safety | More ethical and sustainable gig economy |
| Affordable weekly premiums | Lower burden on government welfare systems |
| Fast, transparent payouts | Higher trust in digital labor platforms |

---

## ⚙️ How It Works

### Step 1: 📝 Worker Onboarding

Workers register on the GigGuard web platform in under **5 minutes**:

- **Personal Details** — name, contact, location (city/district),aadhar card,bank account
- **Work Profile** — type of gig work (delivery, ride-share, freelance, daily wage, etc.)
- **Income Data** — average daily/weekly earnings, typical working hours
- **Work Zones** — areas where they typically operate

This data forms the foundation of their **personal risk profile**.

---

### Step 2: 🤖 Smart Plan Recommendation

GigGuard's recommendation engine analyzes multiple data points to suggest the most suitable insurance plan:

- Historical weather data for the worker's location *(past 5 years of disruption frequency)*
- Declared income level to calculate appropriate coverage amounts
- Work type risk factor *(e.g., delivery riders are more weather-exposed than freelance designers)*
- Seasonal risk patterns *(monsoon months carry higher premiums)*

The output is a **personalized insurance plan** — not a one-size-fits-all product.

---

### Step 3: 💳 Subscription & Premium Payment

Workers choose from tiered plans and pay a small weekly premium:

| Plan | Weekly Premium | Max Daily Coverage | Best For |
|---|---|---|---|
| 🟢 Basic Shield | ₹25–₹50 | ₹300–₹500 | Part-time gig workers |
| 🔵 Standard Shield | ₹75–₹120 | ₹600–₹900 | Full-time delivery/ride-share |
| 🟡 Premium Shield | ₹150–₹250 | ₹1,000–₹1,500 | High-income gig workers |

Premiums are dynamically adjusted based on:
- Current season and regional weather forecasts
- Worker's claims history
- Local weather risk score

---

### Step 4: 🌦️ Real-Time Weather Monitoring

GigGuard runs a **continuous weather intelligence layer** across all registered worker locations, evaluated every **15 minutes**.

**Monitored Parameters:**
- Rainfall intensity (mm/hour)
- Temperature extremes (heatwave thresholds)
- Wind speed and storm alerts
- Flood and waterlogging warnings
- Cyclone and severe weather advisories
- Air Quality Index *(where relevant to safety)*

**Data Sources:**
- 🇮🇳 India Meteorological Department (IMD) API
- 🌐 OpenWeatherMap / WeatherAPI
- 🚨 NDMA (National Disaster Management Authority) alerts
- 🏙️ Local municipal flood monitoring systems

---

### Step 5: 🔔 Disruption Alert & Worker Notification

When a weather threshold is breached in a worker's registered zone:

1. GigGuard sends a **push notification / SMS alert** to the worker
2. Worker receives **safety guidance** *(e.g., "Heavy rainfall detected in your area — avoid travel on 2-wheelers")*
3. Worker is prompted to **confirm non-working status** via a simple app check-in or GPS inactivity detection
4. **Compensation eligibility window opens**

---

### Step 6: ✅ Verification & Automated Payout

Before releasing compensation, GigGuard runs a **multi-layer verification**:

| Verification Layer | Description |
|---|---|
| 🌧️ Weather Verification | Cross-checks weather event data with 3 independent sources |
| 📍 Location Verification | Confirms worker was in the affected zone at the time |
| 📵 Activity Verification | Checks for absence of platform activity (delivery app, ride app) during disruption |
| 🔍 Fraud Check | Runs the claim through the fraud detection module |

Once verified, compensation is **automatically transferred** to the worker's registered UPI/bank account — typically within **2–4 hours** of the disruption event.



---

## 🧠 Adversarial Defense & Anti-Spoofing Strategy

Gig Guard's compensation model is location-dependent — a worker must be in a weather-affected zone to be eligible for a payout. This makes GPS spoofing (feeding false location coordinates to a device) a major attack vector that requires a strong multi-layered defense system.

GPS spoofing works by broadcasting counterfeit GPS signals at higher power than legitimate satellite signals, forcing the receiver to lock onto fake coordinates.

---

## 📡 1. Signal Power Monitoring

Real GPS signals come from satellites approximately 20,200 km above Earth, arriving at very low signal power (around **−130 dBm**). A nearby spoofing device must transmit stronger signals to override them.

### Carrier-to-Noise Ratio (C/No) Monitoring
- Measures signal quality in real time  
- Normal values remain stable  
- Sudden deviations beyond **±3 dB** indicate suspicious activity  

### Absolute Received Power Thresholding
- Legitimate GPS signals stay within a known power range  
- Stronger-than-expected signals are flagged as spoofing attempts  

### L1/L2 Frequency Cross-Validation
- GPS uses:
  - **L1: 1575.42 MHz**
  - **L2: 1227.60 MHz**
- Most spoofers only imitate **L1**
- Weak or missing **L2** when **L1** is strong suggests spoofing  

---

## 📐 2. Spatial & Phase Consistency Analysis

Authentic GPS signals arrive from multiple satellite directions. Spoofed signals usually come from one source.

### Multi-Antenna Phase Difference Checking
- Uses multiple GNSS antennas  
- Compares carrier phase differences  
- Same phase pattern across all satellites indicates spoofing  

### Receiver Movement Pattern Analysis
- Tracks worker movement while walking  
- Checks Doppler and phase consistency  
- Nearby spoofers create abnormal movement-related signal behavior  

---

## ⏱️ 3. Time-of-Arrival (TOA) Delay Detection

Spoofers must receive, process, and retransmit GPS signals, creating measurable delay.

### Detection Method
- GPS bit transitions occur every **20 ms**
- Microsecond-level delay is suspicious  
- Simultaneous delay across multiple satellites indicates spoofing  

### L1/L2 Delay Cross-Check
- Real signals follow known propagation delay models  
- Incorrect inter-frequency timing reveals fake signals  

---

## 🔬 4. Signal Quality Monitoring (SQM)

GPS receivers detect signals using correlation peaks.

### Spoofing Effects on Correlation Peak
- Peak flattening  
- Peak asymmetry  
- Skewed signal shape  

### Gig Guard SQM Monitoring
- Checks Early-Minus-Late (EML) symmetry  
- Measures peak width  
- Abnormal shapes trigger integrity alerts  

---

##  Additional Improvements

### Add Device Integrity Checks
- Detect rooted devices  
- Block fake GPS apps  
- Verify sensor authenticity  

### Add Server-Side Verification
- Compare user location with weather APIs  
- Cross-check multiple reports in same zone  

### Add AI-Based Anomaly Detection
- Learn normal worker movement patterns  
- Detect impossible jumps or repeated suspicious behavior  


---
## 🔴 Risk Classification System

Gig Guard uses a **3-tier risk classification model** to determine compensation amounts:

| Risk Level | Trigger Conditions | Compensation Rate | Example Scenario |
|-----------|------------------|-------------------|------------------|
| 🟡 Low Risk | Light rain (10–30mm/hr), mild temperature advisory | 30–50% of daily avg. income | Drizzle making 2-wheeler conditions slippery |
| 🟠 Medium Risk | Heavy rain (30–64.5mm/hr), heatwave warning (>45°C), moderate storm | 50–75% of daily avg. income | Heavy monsoon downpour grounding delivery workers |
| 🔴 High Risk | Extremely heavy rain (>64.5mm/hr), cyclone, flood, red alert issued | 80–100% of daily avg. income | Cyclone Michaung-level disruption; zero work possible |

### Additional Classification Factors:
- Duration of the disruption event (hourly vs. full-day)
- Breadth of area affected (ward-level vs. city-wide)
- Government advisory status (advisory vs. warning vs. emergency)
- Platform suspension status (if gig apps suspend operations in the area)
## 🛡️ Fraud Detection & Security

Insurance systems are inherently vulnerable to fraud. Gig Guard employs a **multi-layer fraud prevention architecture** to protect the integrity of the platform and ensure legitimate workers receive fair compensation.

### 🔍 GPS Spoofing Detection
- Detects impossible location jumps (teleportation patterns)
- Cross-validates GPS coordinates with cell tower triangulation
- Flags suspicious location manipulation attempts
- Compares claimed location with historical work patterns of the user

### 👤 Fake Account Detection
- Duplicate PAN/Aadhaar/mobile number detection at registration
- Behavioral pattern analysis to detect bot-like registration patterns
- Network graph analysis to identify coordinated fraud rings
- Identity verification via DigiLocker integration (planned)

### 📊 Activity Verification Engine
- Platform API cross-checks (Swiggy, Zomato, Ola, Uber, etc.) to verify actual inactivity
- GPS movement history analysis during claimed disruption window
- Machine learning model trained on historical claim patterns to flag anomalies
- Peer verification signals from nearby registered workers in the same zone

### 🔐 Data Security
- All personal and financial data encrypted at rest (AES-256) and in transit (TLS 1.3)
- GDPR and DPDP Act (India) compliant data handling
- No raw location data stored beyond 30 days
- Role-based access control for all internal systems

