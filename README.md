


# uPAL — UPI + Crypto + Global Payments in One App

**One app. Any currency. UPI, crypto & PYUSD — all from a single QR.**

---

## 🚀 Short Description  
A Gen-Z friendly payments app that blends **UPI ease** with **crypto power** — self-custodial wallets, ENS IDs, Flow for fast transactions, and PYUSD for compliant cross-border transfers.

---

## ✨ Features

- **One QR, Multi-Mode Payments** — scan one QR, app auto-detects UPI, crypto, or PYUSD and switches seamlessly  
- **Auto Wallet Creation** — self-custodial smart wallet gets created at signup  
- **ENS Offchain Subnames** — each user gets `<userid>.upal.eth` linked to their UPI ID, phone, and wallet  
- **Flow for Consumer Crypto** — fast, low-cost crypto transfers for everyday use  
- **PYUSD on Ethereum (Sepolia)** — stablecoin rails for cross-border & regulatory flows  
- **On/Off Ramp via Transak** — convert INR ↔ PYUSD ↔ local currency smoothly  
- **Address Book + Requests** — save contacts (UPI, phone, wallet, ENS) and request payments  
- **Backend on Fluence** — robust, decentralized infrastructure  

---

## 🧠 Architecture & How It Works

1. On signup, I auto-generate a **smart wallet + ENS offchain subname** for the user.  
2. The ENS subname links **wallet, UPI ID & phone number**, so payments can be done by name or QR.  
3. Scanning the QR triggers **auto-detection**: it routes UPI flows (simulated in prototype), crypto via Flow, or stablecoin via PYUSD.  
4. **Transak** handles fiat ↔ PYUSD conversions and cross-currency on/off ramps.  
5. **Crypto (non-stablecoin)** uses Flow EVM for scale; **stablecoin flows** remain on Ethereum Sepolia.

---

## 🛠️ Tech Stack

| Part            | Technology                     |
|------------------|--------------------------------|
| Frontend         | React + Vite                    |
| Backend          | Node.js + Express               |
| Wallets          | Self-custodial smart wallets    |
| Identity         | ENS Offchain Subnames           |
| Crypto Rail      | Flow EVM                        |
| Stablecoin Rail  | PYUSD (Ethereum Sepolia)        |
| On/Off Ramp       | Transak                         |
| Infrastructure   | Fluence (backend deployment)    |

---

## 🤝 Partner Technologies & Benefits

- **ENS** — gives readable, human-friendly user IDs instead of long hex addresses  
- **Flow** — built for consumer-scale transactions, ideal for UPI-level volumes  
- **PYUSD** — institutional compliance and stable cross-border rails  
- **Ethereum Sepolia** — safe test environment and robust tooling for stablecoin flows  
- **Transak** — handles fiat ↔ crypto conversions seamlessly for users  

---

## 🧪 Notable / Hacky Highlights

- **Single QR, multiple payment modes**: I engineered a unified QR payload + detection logic so one QR supports UPI, crypto, or stablecoin  
- **Auto mode-switching**: the app figures out which mode to use without user friction  
- The crypto rails are functional; UPI flows are simulated currently — ready to go live when allowed  

---

## 📂 Repo Structure & Quickstart

Your repo is organized into `client` and `server`:

```

upal/
├── client/     ← frontend (React + Vite)
└── server/     ← backend (Node + Express, wallet & payment logic)

````

To run locally (prototype):

```bash
# Clone the repo
git clone https://github.com/rizwanmoulvi/upal.git
cd upal

# Start frontend
cd client
npm install
npm run dev

# Start backend
cd ../server
npm install
npm run dev
````

> Additional setup (ENS config, Fluence deployment, Transak API keys) is in `/docs` or environment variables.

---

## 🗺 Roadmap

* ✅ Prototype complete
* 🔄 Integrate real UPI
* 🔐 Social recovery / keyless login
* 📲 Launch native apps (iOS/Android)
* 🧩 Merchant integration plugins


---

**uPAL — Your wallet, your way.**
