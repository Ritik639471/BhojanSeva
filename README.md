<div align="center">
  <img src="public/favicon.svg" alt="BhojanSeva Logo" width="120" />
  <h1>BhojanSeva</h1>
  <p><strong>A community-driven platform to locate and share free food distribution services (Bhandaras, Langars, Prasad stalls) in real-time.</strong></p>
  
  [![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://bhojan-seva-one.vercel.app/)
  
  <h3><a href="https://bhojan-seva-one.vercel.app/">🌐 Visit BhojanSeva Live</a></h3>
</div>

<br />

## 🍲 About BhojanSeva

For centuries, Langars and Bhandaras have fed millions across India. **BhojanSeva** digitizes this sacred tradition, ensuring that no one goes hungry by providing a real-time, crowd-verified map of active free food camps. 

Whether you're a daily wage worker looking for a meal, a community member looking to volunteer, or a donor wanting to sponsor a Seva, BhojanSeva connects the community through a frictionless, high-utility platform.

## ✨ Features

- 🗺️ **Live Interactive Map:** Find active food camps near you using the Map or Feed view.
- 🎯 **Dietary & Religious Filters:** Easily filter for "Jain", "No Onion/Garlic", or specific allergens.
- 🎙️ **Vernacular Voice Search:** Search for "Bhandara near me" in Hindi or English using built-in voice search.
- 👥 **Crowd-Verified Accuracy:** The community can vote if a camp is "Serving", running "Low", or "Finished". Three "Finished" reports auto-gray the pin!
- 🚨 **Seva SOS Alerts:** Organizers with surplus food can trigger an SOS to alert nearby NGOs and volunteers to avoid food waste.
- 💰 **Sponsor a Seva (CSR):** Direct UPI integrations for users and corporations to fund community kitchens.
- 📱 **Progressive Web App (PWA):** Installable directly on your phone with offline caching and push notifications.
- 🎪 **Festival Route Mode:** Optimizes multi-stop routes during major festivals.

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **Styling:** Vanilla CSS + Lucide Icons
- **Mapping:** React Leaflet (OpenStreetMap)
- **Database / Auth:** Supabase
- **Spatial Queries:** PostGIS (Supabase)
- **Deployment:** Vercel

## 🚀 Running Locally

To run this project on your local machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ritik639471/BhojanSeva.git
   cd BhojanSeva
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Database Setup:**
   Run the `supabase_schema.sql` file in your Supabase SQL Editor to set up the tables, Row Level Security (RLS) policies, and PostGIS spatial functions.

## 🤝 Contributing

We welcome contributions! Whether you want to fix a bug, add a new feature, or improve the documentation, feel free to open a Pull Request.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
