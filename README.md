<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/MedGemma_27B-FF9E0F?style=for-the-badge&logo=google&logoColor=white" alt="MedGemma" />
</div>

<br />

<div align="center">
  <h1 align="center">Sanjivani</h1>
  <p align="center">
    <strong>Clinical-grade multilingual health triage system powered by MedGemma 27B</strong>
  </p>
</div>

## ✨ Overview

**Sanjivani** is a cutting-edge, comprehensive health triage platform designed to streamline patient intake, diagnosis, and emergency response. Leveraging the advanced reasoning capabilities of the **MedGemma 27B** AI model, Sanjivani provides clinical-grade triage recommendations, visualizes symptoms in 3D, and seamlessly connects patients with nearby healthcare facilities and emergency transport services.

## 🚀 Key Features

*   **🧠 AI-Powered Intake Console**: Intelligently parses patient symptoms and medical history using MedGemma to provide real-time clinical insights.
*   **🧍‍♂️ Interactive 3D Body Mapping**: Features a dynamic 3D human body model (built with Three.js) allowing patients to visually pinpoint and describe symptoms accurately.
*   **📊 Clinical Acuity & Triage Results**: Automatically calculates an acuity score and generates a structured triage result, suggesting appropriate care pathways.
*   **🏥 Healthcare Facility Locator**: Integrates location services to display nearby hospitals and clinics based on the user's location.
*   **🚑 Emergency Ride Booking**: Comprehensive emergency ride management system, including patient booking modals, ambulance dispatch, and a dedicated dashboard for drivers.
*   **👨‍⚕️ Intelligent Doctor Referrals**: Recommends specialized doctors based on the AI's triage assessment.
*   **🔐 Role-Based Authentication**: Secure access control ensuring patients, doctors, and ambulance drivers have appropriate dashboard views and permissions.
*   **🌍 Multilingual Support**: Accessible to a diverse user base with multilingual capabilities.

## 🛠️ Tech Stack

*   **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [React 18](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
*   **3D Rendering**: [Three.js](https://threejs.org/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Backend & Database**: Next.js API Routes, [MongoDB](https://www.mongodb.com/)
*   **AI Integration**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai), [@huggingface/inference](https://www.npmjs.com/package/@huggingface/inference)

## ⚙️ Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm, yarn, or pnpm
*   MongoDB URI
*   API keys for Google Generative AI and Hugging Face

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/nandishagarwal0660/SANJEEVANI.git
    cd SANJEEVANI
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up environment variables**
    Create a `.env.local` file in the root directory based on `.env.sample` and add your API keys and database credentials:
    ```env
    # Example .env.local
    MONGODB_URI=your_mongodb_connection_string
    GOOGLE_API_KEY=your_google_generative_ai_key
    HUGGINGFACE_API_KEY=your_huggingface_api_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Open the application**
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

*   `/app`: Next.js 14 app router pages and API endpoints.
*   `/components`: Reusable React components including UI elements, 3D models, and specialized panels.
*   `/lib`: Utility functions, database connection helpers, and configuration files.
*   `/scripts`: Additional scripts for database seeding or build steps.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/nandishagarwal0660/SANJEEVANI/issues).

## 📄 License

This project is private and intended for specific use cases. All rights reserved.
