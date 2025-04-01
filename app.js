const express = require("express")
const TelegramBot = require("node-telegram-bot-api")
const mongoose = require("mongoose")
const axios = require("axios")
const path = require("path")

// Initialize Express app
const app = express()
const port = process.env.PORT || 3000

// MongoDB connection
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://zkwork0:Facai8898@@cluster0.daxno4e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Define Mongoose schemas
const userSchema = new mongoose.Schema({
  userId: Number,
  username: String,
  firstName: String,
  lastName: String,
  joinDate: { type: Date, default: Date.now },
})

const lookupSchema = new mongoose.Schema({
  userId: Number,
  phoneNumber: String,
  lookupTime: { type: Date, default: Date.now },
  result: Object, // Store the lookup result as an object for better querying
  source: { type: String, enum: ["telegram", "web"], default: "web" },
})

// Create Mongoose models
const User = mongoose.model("User", userSchema)
const Lookup = mongoose.model("Lookup", lookupSchema)

// Initialize Telegram bot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "7426502084:AAGasqdpXuIJt3S5h_kiU-L0y21a3C2xLJk"
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })

// Helper function to format country name with emoji
function formatCountry(countryCode) {
  const countries = {
    AF: "Afghanistan 🇦🇫",
    AL: "Albania 🇦🇱",
    DZ: "Algeria 🇩🇿",
    AD: "Andorra 🇦🇩",
    AO: "Angola 🇦🇴",
    AG: "Antigua and Barbuda 🇦🇬",
    AR: "Argentina 🇦🇷",
    AM: "Armenia 🇦🇲",
    AU: "Australia 🇦🇺",
    AT: "Austria 🇦🇹",
    AZ: "Azerbaijan 🇦🇿",
    BS: "Bahamas 🇧🇸",
    BH: "Bahrain 🇧🇭",
    BD: "Bangladesh 🇧🇩",
    BB: "Barbados 🇧🇧",
    BY: "Belarus 🇧🇾",
    BE: "Belgium 🇧🇪",
    BZ: "Belize 🇧🇿",
    BJ: "Benin 🇧🇯",
    BT: "Bhutan 🇧🇹",
    BO: "Bolivia 🇧🇴",
    BA: "Bosnia and Herzegovina 🇧🇦",
    BW: "Botswana 🇧🇼",
    BR: "Brazil 🇧🇷",
    BN: "Brunei 🇧🇳",
    BG: "Bulgaria 🇧🇬",
    BF: "Burkina Faso 🇧🇫",
    BI: "Burundi 🇧🇮",
    KH: "Cambodia 🇰🇭",
    CM: "Cameroon 🇨🇲",
    CA: "Canada 🇨🇦",
    CV: "Cape Verde 🇨🇻",
    CF: "Central African Republic 🇨🇫",
    TD: "Chad 🇹🇩",
    CL: "Chile 🇨🇱",
    CN: "China 🇨🇳",
    CO: "Colombia 🇨🇴",
    KM: "Comoros 🇰🇲",
    CG: "Congo 🇨🇬",
    CR: "Costa Rica 🇨🇷",
    CI: "Ivory Coast 🇨🇮",
    HR: "Croatia 🇭🇷",
    CU: "Cuba 🇨🇺",
    CY: "Cyprus 🇨🇾",
    CZ: "Czech Republic 🇨🇿",
    DK: "Denmark 🇩🇰",
    DJ: "Djibouti 🇩🇯",
    DM: "Dominica 🇩🇲",
    DO: "Dominican Republic 🇩🇴",
    EC: "Ecuador 🇪🇨",
    EG: "Egypt 🇪🇬",
    SV: "El Salvador 🇸🇻",
    GQ: "Equatorial Guinea 🇬🇶",
    ER: "Eritrea 🇪🇷",
    EE: "Estonia 🇪🇪",
    ET: "Ethiopia 🇪🇹",
    FJ: "Fiji 🇫🇯",
    FI: "Finland 🇫🇮",
    FR: "France 🇫🇷",
    GA: "Gabon 🇬🇦",
    GM: "Gambia 🇬🇲",
    GE: "Georgia 🇬🇪",
    DE: "Germany 🇩🇪",
    GH: "Ghana 🇬🇭",
    GR: "Greece 🇬🇷",
    GD: "Grenada 🇬🇩",
    GT: "Guatemala 🇬🇹",
    GN: "Guinea 🇬🇳",
    GW: "Guinea-Bissau 🇬🇼",
    GY: "Guyana 🇬🇾",
    HT: "Haiti 🇭🇹",
    HN: "Honduras 🇭🇳",
    HU: "Hungary 🇭🇺",
    IS: "Iceland 🇮🇸",
    IN: "India 🇮🇳",
    ID: "Indonesia 🇮🇩",
    IR: "Iran 🇮🇷",
    IQ: "Iraq 🇮🇶",
    IE: "Ireland 🇮🇪",
    IL: "Israel 🇮🇱",
    IT: "Italy 🇮🇹",
    JM: "Jamaica 🇯🇲",
    JP: "Japan 🇯🇵",
    JO: "Jordan 🇯🇴",
    KZ: "Kazakhstan 🇰🇿",
    KE: "Kenya 🇰🇪",
    KI: "Kiribati 🇰🇮",
    KW: "Kuwait 🇰🇼",
    KG: "Kyrgyzstan 🇰🇬",
    LA: "Laos 🇱🇦",
    LV: "Latvia 🇱🇻",
    LB: "Lebanon 🇱🇧",
    LS: "Lesotho 🇱🇸",
    LR: "Liberia 🇱🇷",
    LY: "Libya 🇱🇾",
    LI: "Liechtenstein 🇱🇮",
    LT: "Lithuania 🇱🇹",
    LU: "Luxembourg 🇱🇺",
    MG: "Madagascar 🇲🇬",
    MW: "Malawi 🇲🇼",
    MY: "Malaysia 🇲🇾",
    MV: "Maldives 🇲🇻",
    ML: "Mali 🇲🇱",
    MT: "Malta 🇲🇹",
    MX: "Mexico 🇲🇽",
    MC: "Monaco 🇲🇨",
    MN: "Mongolia 🇲🇳",
    ME: "Montenegro 🇲🇪",
    MA: "Morocco 🇲🇦",
    MZ: "Mozambique 🇲🇿",
    MM: "Myanmar 🇲🇲",
    NA: "Namibia 🇳🇦",
    NP: "Nepal 🇳🇵",
    NL: "Netherlands 🇳🇱",
    NZ: "New Zealand 🇳🇿",
    NI: "Nicaragua 🇳🇮",
    NE: "Niger 🇳🇪",
    NG: "Nigeria 🇳🇬",
    NO: "Norway 🇳🇴",
    OM: "Oman 🇴🇲",
    PK: "Pakistan 🇵🇰",
    PA: "Panama 🇵🇦",
    PG: "Papua New Guinea 🇵🇬",
    PY: "Paraguay 🇵🇾",
    PE: "Peru 🇵🇪",
    PH: "Philippines 🇵🇭",
    PL: "Poland 🇵🇱",
    PT: "Portugal 🇵🇹",
    QA: "Qatar 🇶🇦",
    RO: "Romania 🇷🇴",
    RU: "Russia 🇷🇺",
    SA: "Saudi Arabia 🇸🇦",
    SN: "Senegal 🇸🇳",
    RS: "Serbia 🇷🇸",
    SG: "Singapore 🇸🇬",
    ZA: "South Africa 🇿🇦",
    ES: "Spain 🇪🇸",
    LK: "Sri Lanka 🇱🇰",
    SE: "Sweden 🇸🇪",
    CH: "Switzerland 🇨🇭",
    TH: "Thailand 🇹🇭",
    TR: "Turkey 🇹🇷",
    UA: "Ukraine 🇺🇦",
    AE: "United Arab Emirates 🇦🇪",
    GB: "United Kingdom 🇬🇧",
    US: "United States 🇺🇸",
    VN: "Vietnam 🇻🇳",
    ZW: "Zimbabwe 🇿🇼",
  }
  return countries[countryCode] || `${countryCode} 🌍`
}

// Helper function to add or update user in the database
async function addUser(userId, username, firstName, lastName) {
  try {
    await User.findOneAndUpdate({ userId }, { userId, username, firstName, lastName }, { upsert: true, new: true })
  } catch (error) {
    console.error("Error adding/updating user:", error)
  }
}

// Helper function to log a lookup in the database
async function logLookup(userId, phoneNumber, result, source = "telegram") {
  try {
    await Lookup.create({ userId, phoneNumber, result, source })
  } catch (error) {
    console.error("Error logging lookup:", error)
  }
}

// Helper function to fetch stats
async function getStats() {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const userCount = await User.countDocuments()
    const checkCount = await Lookup.countDocuments()
    const activeToday = await Lookup.countDocuments({ lookupTime: { $gte: todayStart } })
    const webLookups = await Lookup.countDocuments({ source: "web" })
    const telegramLookups = await Lookup.countDocuments({ source: "telegram" })

    return { userCount, checkCount, activeToday, webLookups, telegramLookups }
  } catch (error) {
    console.error("Error fetching stats:", error)
    return { userCount: 0, checkCount: 0, activeToday: 0, webLookups: 0, telegramLookups: 0 }
  }
}

// Helper function to fetch all lookups with pagination
async function getAllLookups(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit
    const lookups = await Lookup.find().sort({ lookupTime: -1 }).skip(skip).limit(limit)

    const total = await Lookup.countDocuments()

    return { lookups, total, page, limit }
  } catch (error) {
    console.error("Error fetching lookups:", error)
    return { lookups: [], total: 0, page, limit }
  }
}

// Helper function to perform carrier lookup
async function performLookup(phoneNumber) {
  try {
    const response = await axios.get(`https://www.sent.dm/api/phone-lookup?phone=${phoneNumber}`, {
      timeout: 10000, // 10 second timeout
    })

    if (response.data && response.data.data) {
      const data = response.data.data

      // Create a structured result object
      const result = {
        phoneNumber: data.phone_number || "Unknown",
        countryCode: data.country_code || "Unknown",
        carrier: data.carrier?.name || "Unknown",
        normalizedCarrier: data.carrier?.normalized_carrier || "Unknown",
        state: data.portability?.state || "Unknown",
        country: data.country_code ? formatCountry(data.country_code) : "Unknown",
      }

      return { success: true, result }
    } else {
      return { success: false, error: "Invalid response format" }
    }
  } catch (error) {
    console.error("Error performing lookup:", error.message)
    return { success: false, error: error.message }
  }
}

// Format lookup result for display
function formatLookupResult(result) {
  if (!result) return "Unknown"

  return `
Phone Number : ${result.phoneNumber}
Country Code : ${result.countryCode}
Carrier : ${result.carrier}
Normalized Carrier : ${result.normalizedCarrier}
State : ${result.state}
Country : ${result.country}
    `.trim()
}

// Handle Telegram bot commands
bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id
  const username = msg.from.username || ""
  const firstName = msg.from.first_name || ""
  const lastName = msg.from.last_name || ""

  await addUser(userId, username, firstName, lastName)

  const welcomeMessage = `
Welcome to Carrier Lookup Bot! 📱

I can help you find carrier information for any phone number.

Simply send me a phone number (with country code) to get started.

You can also try these commands:
/help - Show help information
/stats - Show usage statistics
    `.trim()

  bot.sendMessage(userId, welcomeMessage)
})

bot.onText(/\/help/, (msg) => {
  const userId = msg.from.id
  const helpMessage = `
Carrier Lookup Bot Help 📱

To use this bot, simply send a phone number with country code.
Example: +1234567890

Available commands:
/start - Start the bot
/help - Show this help message
/stats - Show usage statistics

For more advanced features, visit our web interface.
    `.trim()

  bot.sendMessage(userId, helpMessage)
})

bot.onText(/\/stats/, async (msg) => {
  const userId = msg.from.id
  try {
    const stats = await getStats()
    const statsMessage = `
📊 Carrier Lookup Statistics 📊

👥 Total Users: ${stats.userCount}
🔍 Total Lookups: ${stats.checkCount}
📱 Active Today: ${stats.activeToday}
🌐 Web Lookups: ${stats.webLookups}
🤖 Telegram Lookups: ${stats.telegramLookups}
        `.trim()

    bot.sendMessage(userId, statsMessage)
  } catch (error) {
    console.error("Error sending stats:", error)
    bot.sendMessage(userId, "Error fetching statistics. Please try again later.")
  }
})

// Handle phone number lookups via Telegram
bot.on("message", async (msg) => {
  if (msg.text.startsWith("/")) return // Skip commands

  const userId = msg.from.id
  const phoneNumber = msg.text.trim()

  // Check if the message looks like a phone number
  if (!/^\+?\d{7,15}$/.test(phoneNumber)) {
    return // Not a phone number, ignore
  }

  // Send "typing" action
  bot.sendChatAction(userId, "typing")

  try {
    const { success, result, error } = await performLookup(phoneNumber)

    if (success) {
      const formattedResult = formatLookupResult(result)
      await logLookup(userId, phoneNumber, result, "telegram")
      bot.sendMessage(userId, formattedResult)
    } else {
      await logLookup(userId, phoneNumber, { error }, "telegram")
      bot.sendMessage(
        userId,
        "Sorry, I couldn't find information for this number. Please check the format and try again.",
      )
    }
  } catch (error) {
    console.error("Error in Telegram lookup:", error)
    bot.sendMessage(userId, "An error occurred. Please try again later.")
  }
})

// Web interface setup
app.use(express.static(path.join(__dirname, "public")))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Web route to show stats
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await getStats()
    res.json(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    res.status(500).json({ error: "Error fetching stats" })
  }
})

// Web route to fetch lookups with pagination
app.get("/api/lookups", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10

    const result = await getAllLookups(page, limit)
    res.json(result)
  } catch (error) {
    console.error("Error fetching lookups:", error)
    res.status(500).json({ error: "Error fetching lookups" })
  }
})

// Web route to handle carrier lookups
app.post("/api/lookup", async (req, res) => {
  const { phoneNumber } = req.body

  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required" })
  }

  try {
    const { success, result, error } = await performLookup(phoneNumber)

    if (success) {
      await logLookup(null, phoneNumber, result, "web")
      res.json({ success: true, result })
    } else {
      await logLookup(null, phoneNumber, { error }, "web")
      res.status(404).json({ success: false, error })
    }
  } catch (error) {
    console.error("Error in web lookup:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
})

// Fallback route for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

