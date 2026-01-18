# Inventory Management System (IMS) - UI

A modern, full-featured Inventory Management System built with React, TypeScript, and Material-UI following atomic design principles.

## 🚀 Features

- **Dashboard**: Overview of key metrics and statistics
- **Product Management**: Create, read, update, and delete products
- **Order Management**: Handle purchase and sale orders
- **Customer Management**: Manage customer information
- **Supplier Management**: Track supplier details
- **Category Management**: Organize products by categories
- **Stock Movement**: Track all inventory movements
- **Reports**: Generate various inventory reports

## 🏗️ Architecture

This project follows the **Atomic Design Pattern**:

```
src/
├── components/
│   ├── atoms/          # Basic building blocks (Button, Input, etc.)
│   ├── molecules/      # Simple combinations (SearchBar, Modal, etc.)
│   ├── organisms/      # Complex components (DataTable, Navbar, etc.)
│   └── templates/      # Page layouts (MainLayout)
├── pages/              # Page components
├── services/           # API service layer
├── types/              # TypeScript type definitions
├── config/             # Configuration files
└── utils/              # Utility functions
```

## 🛠️ Tech Stack

- **React 19** - UI Library
- **TypeScript** - Type Safety
- **Material-UI (MUI)** - Component Library
- **React Router** - Routing
- **Axios** - HTTP Client
- **Vite** - Build Tool
- **Vitest** - Testing Framework

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running on the configured endpoint

## ⚙️ Environment Configuration

The project supports multiple environments:

- **Development**: `.env.development`
- **Test**: `.env.test`
- **Production**: `.env.production`

### Environment Variables

```env
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=IMS - Inventory Management System
VITE_APP_VERSION=1.0.0
```

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Run in development mode
npm run dev

# Run in test environment
npm run dev:test

# Run in production mode
npm run dev:prod
```

The application will be available at `http://localhost:5173`

### Build

```bash
# Build for production
npm run build

# Build for test environment
npm run build:test

# Build for production environment
npm run build:prod
```

### Testing

```bash
# Run tests
npm test

# Run tests with UI
npm test:ui

# Run tests with coverage
npm test:coverage
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## 📁 Project Structure

```
ims-ui/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, fonts, etc.
│   ├── components/
│   │   ├── atoms/         # Basic components
│   │   ├── molecules/     # Composite components
│   │   ├── organisms/     # Complex components
│   │   └── templates/     # Page templates
│   ├── config/            # App configuration
│   ├── contexts/          # React contexts
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── types/             # TypeScript types
│   ├── utils/             # Helper functions
│   ├── App.tsx            # Main App component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── .env.development       # Development environment
├── .env.test              # Test environment
├── .env.production        # Production environment
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔌 API Integration

The application connects to a backend API. Ensure the backend is running and the `VITE_API_BASE_URL` in your environment file points to the correct endpoint.

### API Services

- `productService` - Product operations
- `orderService` - Order management
- `customerService` - Customer operations
- `supplierService` - Supplier management
- `stockService` - Stock movement tracking
- `categoryService` - Category management

## 🎨 Atomic Design Components

### Atoms
- Button, Input, Typography, Card, Chip, Loader

### Molecules
- SearchBar, DataCard, Modal, Alert, FormGroup

### Organisms
- DataTable, Navbar, Sidebar, StatsGrid

### Templates
- MainLayout

## 📱 Pages

- **Dashboard** - Main overview with statistics
- **Products** - Product listing and management
- **Orders** - Order management (purchase/sale)
- **Customers** - Customer information management
- **Suppliers** - Supplier management
- **Categories** - Product category management
- **Stock Movement** - Inventory movement history

## 🔐 Authentication

The application uses JWT token-based authentication. Tokens are stored in localStorage and automatically included in API requests.

## 🤝 Contributing

1. Follow the atomic design pattern
2. Write TypeScript types for all components
3. Use Material-UI components
4. Write tests for new features
5. Follow the existing code style

## 📄 License

This project is private and confidential.

## 👥 Support

For support and questions, please contact the development team.
