document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const sidebar = document.getElementById("sidebar")
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle")
  const themeToggle = document.getElementById("theme-toggle")
  const themeIcon = document.getElementById("theme-icon")
  const navLinks = document.querySelectorAll(".nav-link")
  const sections = document.querySelectorAll(".section")
  const lookupForm = document.getElementById("lookup-form")
  const phoneNumberInput = document.getElementById("phone-number")
  const lookupButton = document.getElementById("lookup-button")
  const lookupResult = document.getElementById("lookup-result")
  const prevBtn = document.getElementById("prev-btn")
  const nextBtn = document.getElementById("next-btn")
  const upgradeButton = document.getElementById("upgrade-button")
  const notification = document.getElementById("notification")

  // State variables
  let currentPage = 1
  const entriesPerPage = 10
  let totalEntries = 0
  let historyData = [] // Store history data globally
  let isDarkMode = false

  // Theme toggle functionality
  themeToggle.addEventListener("click", toggleTheme)

  function toggleTheme() {
    const html = document.documentElement

    if (html.classList.contains("light-mode")) {
      html.classList.remove("light-mode")
      html.classList.add("dark-mode")
      themeIcon.innerHTML =
        '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>'
      isDarkMode = true
      localStorage.setItem("darkMode", "true")
    } else {
      html.classList.remove("dark-mode")
      html.classList.add("light-mode")
      themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'
      isDarkMode = false
      localStorage.setItem("darkMode", "false")
    }
  }

  // Check for saved theme preference
  function loadThemePreference() {
    const savedTheme = localStorage.getItem("darkMode")
    if (savedTheme === "true") {
      document.documentElement.classList.remove("light-mode")
      document.documentElement.classList.add("dark-mode")
      themeIcon.innerHTML =
        '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>'
      isDarkMode = true
    }
  }
  loadThemePreference()

  // Mobile menu toggle
  mobileMenuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active")
    mobileMenuToggle.classList.toggle("active")
  })

  // Navigation functionality
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const sectionId = link.getAttribute("data-section")

      // Update active nav link
      navLinks.forEach((navLink) => navLink.classList.remove("active"))
      link.classList.add("active")

      // Show selected section, hide others
      sections.forEach((section) => {
        if (section.id === `${sectionId}-section`) {
          section.style.display = "block"
          // Add animation class
          section.classList.add("fade-in")
          setTimeout(() => section.classList.remove("fade-in"), 500)

          // Load data for statistics section if needed
          if (sectionId === "statistics") {
            loadStats()
            loadHistoryData()
          }
        } else {
          section.style.display = "none"
        }
      })

      // Close mobile menu after navigation on small screens
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("active")
      }
    })
  })

  // Fetch stats
  function loadStats() {
    const statCards = document.querySelectorAll(".stat-card")
    statCards.forEach((card) => card.classList.add("loading"))

    fetch("/api/stats")
      .then((response) => response.json())
      .then((data) => {
        document.getElementById("total-users").textContent = data.userCount
        document.getElementById("total-lookups").textContent = data.checkCount
        document.getElementById("active-today").textContent = data.activeToday
        document.getElementById("web-lookups").textContent = data.webLookups
        document.getElementById("telegram-lookups").textContent = data.telegramLookups

        statCards.forEach((card) => card.classList.remove("loading"))
      })
      .catch((error) => {
        console.error("Error fetching stats:", error)
        document.getElementById("total-users").textContent = "Error"
        document.getElementById("total-lookups").textContent = "Error"
        document.getElementById("active-today").textContent = "Error"
        document.getElementById("web-lookups").textContent = "Error"
        document.getElementById("telegram-lookups").textContent = "Error"

        statCards.forEach((card) => card.classList.remove("loading"))
        showNotification("Error", "Failed to load statistics. Please try again later.", "error")
      })
  }

  // Function to update pagination display
  function updatePagination(total) {
    totalEntries = total
    const start = totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1
    const end = Math.min(start + entriesPerPage - 1, totalEntries)

    document.getElementById("showing-start").textContent = start
    document.getElementById("showing-end").textContent = end
    document.getElementById("total-entries").textContent = totalEntries

    prevBtn.disabled = currentPage === 1
    nextBtn.disabled = end >= totalEntries
  }

  // Load history data with pagination
  function loadHistoryData() {
    const tbody = document.getElementById("lookup-history")
    tbody.innerHTML = '<tr class="loading-row"><td colspan="5">Loading...</td></tr>'

    fetch(`/api/lookups?page=${currentPage}&limit=${entriesPerPage}`)
      .then((response) => response.json())
      .then((data) => {
        historyData = data.lookups

        if (historyData.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5">No records found.</td></tr>'
          updatePagination(0)
          return
        }

        tbody.innerHTML = historyData
          .map((lookup) => {
            const date = new Date(lookup.lookupTime).toLocaleString()
            const carrier = lookup.result?.carrier || "Unknown"
            const country = lookup.result?.country || "Unknown"
            const source = lookup.source === "telegram" ? "Telegram" : "Web"
            const sourceIcon =
              lookup.source === "telegram"
                ? '<svg style="width: 14px; height: 14px; margin-right: 4px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2l-19 19"></path><path d="M21.5 2l-9 9"></path><path d="M3.27 6.96L12 12l-8.73 5.04"></path><path d="M12 22l4-4"></path><path d="M20 16l-4 4"></path></svg>'
                : '<svg style="width: 14px; height: 14px; margin-right: 4px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>'

            return `
                        <tr>
                            <td>${lookup.phoneNumber}</td>
                            <td>${carrier}</td>
                            <td>${country}</td>
                            <td>${date}</td>
                            <td style="display: flex; align-items: center;">${sourceIcon}${source}</td>
                        </tr>
                    `
          })
          .join("")

        updatePagination(data.total)
      })
      .catch((error) => {
        console.error("Error fetching lookups:", error)
        tbody.innerHTML = '<tr><td colspan="5">Error loading history.</td></tr>'
        updatePagination(0)
        showNotification("Error", "Failed to load lookup history. Please try again later.", "error")
      })
  }

  // Pagination controls
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--
      loadHistoryData()
    }
  })

  nextBtn.addEventListener("click", () => {
    if (currentPage * entriesPerPage < totalEntries) {
      currentPage++
      loadHistoryData()
    }
  })

  // Format lookup result for display
  function formatLookupResult(result) {
    const icons = {
      phoneNumber:
        '<svg class="result-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
      countryCode:
        '<svg class="result-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
      carrier:
        '<svg class="result-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>',
      normalizedCarrier:
        '<svg class="result-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
      state:
        '<svg class="result-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
      country:
        '<svg class="result-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
    }

    const labels = {
      phoneNumber: "Phone Number",
      countryCode: "Country Code",
      carrier: "Carrier",
      normalizedCarrier: "Normalized Carrier",
      state: "State",
      country: "Country",
    }

    let html = ""

    for (const key in result) {
      if (result.hasOwnProperty(key)) {
        const icon = icons[key] || ""
        const label = labels[key] || key
        const value = result[key]

        html += `
                    <div class="result-item">
                        ${icon}
                        <span class="result-label">${label}:</span>
                        <span class="result-value">${value}</span>
                    </div>
                `
      }
    }

    return html
  }

  // Handle form submission
  lookupForm.addEventListener("submit", async (event) => {
    event.preventDefault()
    const phoneNumber = phoneNumberInput.value.trim()

    if (!phoneNumber) {
      showNotification("Error", "Please enter a phone number", "error")
      return
    }

    // Show loading state
    lookupButton.classList.add("loading")
    lookupButton.innerHTML = '<span class="loading-spinner"></span> Looking up...'
    lookupResult.innerHTML = `
            <div class="result-item">
                <svg class="result-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span class="result-label">Status:</span>
                <span class="result-value">Looking up carrier information...</span>
            </div>
        `

    try {
      const response = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await response.json()

      if (data.success) {
        lookupResult.innerHTML = formatLookupResult(data.result)
        showNotification("Success", "Carrier lookup completed successfully!", "success")
      } else {
        lookupResult.innerHTML = `
                    <div class="result-item">
                        <svg class="result-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span class="result-label">Error:</span>
                        <span class="result-value">${data.error || "Failed to lookup carrier information"}</span>
                    </div>
                `
        showNotification("Error", "Failed to lookup carrier information", "error")
      }
    } catch (error) {
      console.error("Error performing lookup:", error)
      lookupResult.innerHTML = `
                <div class="result-item">
                    <svg class="result-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span class="result-label">Error:</span>
                    <span class="result-value">Server error. Please try again later.</span>
                </div>
            `
      showNotification("Error", "Server error. Please try again later.", "error")
    } finally {
      // Reset button state
      lookupButton.classList.remove("loading")
      lookupButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                Lookup
            `
    }
  })

  // Show notification
  function showNotification(title, message, type = "success") {
    const notificationEl = document.getElementById("notification")
    const titleEl = notificationEl.querySelector(".notification-title")
    const messageEl = notificationEl.querySelector(".notification-message")

    titleEl.textContent = title
    messageEl.textContent = message

    // Set notification color based on type
    if (type === "error") {
      notificationEl.style.borderLeftColor = "#ef4444"
    } else {
      notificationEl.style.borderLeftColor = "#10b981"
    }

    // Show notification
    notificationEl.classList.add("show")

    // Hide notification after 3 seconds
    setTimeout(() => {
      notificationEl.classList.remove("show")
    }, 3000)
  }

  // Upgrade button click handler
  upgradeButton.addEventListener("click", () => {
    showNotification("Premium Features", "Upgrade feature coming soon!", "success")
  })

  // Initialize the app
  function init() {
    // Set up event listeners for bot buttons
    const botButtons = document.querySelectorAll(".bot-button")
    botButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const botName = button.textContent.trim()
        showNotification("Telegram Bot", `Opening ${botName} in Telegram...`, "success")

        // Simulate opening Telegram
        setTimeout(() => {
          window.open("https://t.me/carrierlookup_bot", "_blank")
        }, 500)
      })
    })
  }

  init()
})

