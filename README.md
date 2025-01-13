# 📚 RumahKosimBooks

A full-stack web application for managing books, built with **SvelteKit**, featuring user authentication and a robust book management system.


## 🚀 Technologies Used

### **Frontend**

- **SvelteKit** - Full-stack web application framework
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Axios** - HTTP client for API requests

### **Backend**

- **SvelteKit API Routes**
- **JWT** - JSON Web Tokens for secure authentication
- **bcrypt** - Password hashing
- **MySQL2** - Database connector and query builder


## ✨ Features

- ✅ User authentication (Login & Register)
- 🔒 JWT-based secure authentication
- 📚 Book management system (CRUD operations)
- 🔧 Admin Management (CRUD operations for administrative users)


## ⚙️ Prerequisites

Before running the project, make sure you have:

- **Node.js** (v14 or higher)
- **MySQL** installed
- **npm**, **pnpm**, or **yarn**


## 🛠️ Installation

1. Clone the repository:

```bash
git clone https://github.com/Samaele13/rumah-kosim-sveltekit.git
cd rumah-kosim-sveltekit
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
# or
yarn
```

3. Set up your environment variables:  
   Create a `.env` file in the root directory and add the following:

```env
DATABASE_URL="mysql://user:password@localhost:3306/database_name"
JWT_SECRET="your_jwt_secret"
```

4. Configure the database:

   - Create a **MySQL database**
   - Update the `.env` file with your database credentials

5. Initialize the database:
   - Import the provided SQL scripts for database setup


## 🚧 Development

To start the development server:

```bash
npm run dev
# or
npm run dev -- --open
```


## 🏗️ Building for Production

1. Create a production build:

```bash
npm run build
```

2. Preview the production build:

```bash
npm run preview
```


## 📂 Project Structure

```plaintext
RumahKosimBooks/
├── src/
│   ├── lib/
│   │   ├── components/    
│   │   ├── utils/         
│   │   └── db/           
│   ├── routes/
│   │   ├── api/          
│   │   └── [...]          
│   └── app.html 
│       app.css
│       app.d.ts
├── static/                
├── tailwind.config.js    
├── svelte.config.js       
└── package.json           
```


## ❗ Important

This project is **not under any license** and is created solely for academic purposes as part of coursework. Further development or usage of this project is strictly for learning and academic assignments only.


## 📞 Contact

- **Instagram** : [@rhankbrguw\_](https://www.instagram.com/rhankbrguw_)
- **Facebook**  : [Samael](https://www.facebook.com/Rhakbr/)
- **LinkedIn**  : [Raihan Akbar](https://www.linkedin.com/in/raihan-akbar-2b5820334/)
- **GitHub**    : [@Samaele13](https://github.com/Samaele13)


## 🌟 Project Link

Find the repository here: [https://github.com/Samaele13/rumah-kosim-sveltekit]


## 🙏 Acknowledgments

- **SvelteKit** team for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- All other open-source contributors and libraries