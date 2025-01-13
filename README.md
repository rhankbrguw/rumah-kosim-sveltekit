# RumahKosimBooks

A full-stack web application for managing books built with SvelteKit, featuring user authentication and a book management system.

## Technologies Used

- **Frontend:**

  - SvelteKit - Full-stack web application framework
  - TailwindCSS - Utility-first CSS framework for styling
  - Axios - HTTP client for API requests

- **Backend:**
  - SvelteKit API Routes
  - JWT - JSON Web Tokens for authentication
  - bcrypt - Password hashing
  - MySQL2 - Database connector and query builder

## Features

- User authentication (login/register)
- JWT-based authentication
- Book management system (CRUD operations)
- Management Admin (CRUD)

## Prerequisites

Before you begin, ensure you have installed:

- Node.js (v14 or higher)
- MySQL database
- npm/pnpm/yarn

## Installation

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
   Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="mysql://user:password@localhost:3306/database_name"
JWT_SECRET="your_jwt_secret"
```

4. Set up the database:

- Create a MySQL database
- Update the connection details in your `.env` file

## Development

To start the development server:

```bash
npm run dev
# or
npm run dev -- --open
```

## Building for Production

To create a production version:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
RumahKosimBooks/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   ├── utils/
│   │   └── db/
│   ├── routes/
│   │   ├── api/
│   │   └── [...]/
│   └── app.html
├── static/
├── tailwind.config.js
├── svelte.config.js
└── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Contact

Linkedin - Raihan Akbar (https://www.linkedin.com/in/raihan-akbar-2b5820334/)

Samaele13 - [@Samaele13](https://github.com/Samaele13)

Project Link: [https://github.com/Samaele13/rumah-kosim-sveltekit](https://github.com/Samaele13/rumah-kosim-sveltekit)

## Acknowledgments

- Thanks to the SvelteKit team for the amazing framework
- TailwindCSS for the utility-first CSS framework
- All other open-source libraries used in this project
