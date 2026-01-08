<div align="center">

# 🚀 Aether Vault Frontend

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-vault/blob/main/LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-19.2.1-blue?style=for-the-badge&logo=react)](https://react.dev/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**🔥 Modern Secure Vault Frontend - Next.js 16 with React 19.2.1 and Complete Authentication System**

A sophisticated frontend application for the Aether Vault secure storage system. Built with **Next.js 16**, **React 19.2.1**, **TypeScript 5**, and featuring a **complete JWT authentication system** with **shadcn/ui components** and **Tailwind CSS v4** styling.

[🚀 Quick Start](#-quick-start) • [📋 Features](#-features) • [🛠️ Tech Stack](#️-tech-stack) • [📁 Architecture](#-architecture) • [🔐 Authentication](#-authentication) • [🤝 Contributing](#-contributing)

</div>

---

## 🌟 What is Aether Vault Frontend?

**Aether Vault Frontend** is the modern web interface for the Aether Vault secure storage system. It provides a complete user experience with authentication, file management, and secure vault operations through a beautifully designed interface.

### 🎯 Key Features

- **🔐 Complete Authentication System** - JWT-based auth with login/register forms and React context
- **🎨 Modern UI/UX Design** - **shadcn/ui** component library with **Tailwind CSS v4**
- **📱 Responsive Design** - Mobile-first approach with adaptive layouts
- **🌙 Dark Mode Support** - Complete theming system with CSS variables
- **⚡ High Performance** - Next.js 16 with React 19.2.1 and TypeScript strict mode
- **🛡️ Security First** - Input validation, CSRF protection, and secure token handling
- **🔧 Developer Friendly** - Hot reload, ESLint, Prettier, and comprehensive tooling

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **pnpm** 9.0.0 or higher (recommended package manager)
- **Aether Vault Backend** running on port 8080

### 🔧 Installation & Setup

1. **Navigate to the app directory**

   ```bash
   cd app
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**

   ```bash
   pnpm dev
   ```

### 🌐 Access Points

Once running, you can access:

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **API Documentation**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

### 🎯 **Available Commands**

```bash
# 🚀 Development
pnpm dev                 # Start development server with hot reload
pnpm build              # Build for production
pnpm start              # Start production server
pnpm lint               # Run ESLint
pnpm lint:fix           # Auto-fix linting issues
pnpm type-check        # Run TypeScript type checking

# 🎨 Styling & Components
pnpm storybook          # Start Storybook for component development
pnpm format             # Format code with Prettier

# 🧪 Testing (when configured)
pnpm test               # Run tests
pnpm test:watch         # Run tests in watch mode
pnpm test:coverage      # Run tests with coverage
```

---

## 🛠️ Tech Stack

### 🎨 **Frontend Framework**

```
Next.js 16 + React 19.2.1 + TypeScript 5
├── 🎨 Tailwind CSS v4 + shadcn/ui (Styling & Components)
├── 🔐 JWT Authentication (Complete Implementation)
├── 🛣️ Next.js App Router (Routing)
├── 📝 TypeScript Strict Mode (Type Safety)
├── 🔄 React Context (State Management)
├── 🎯 React Hook Form (Form Handling)
├── 🔍 Zod (Schema Validation)
└── 🔧 ESLint + Prettier (Code Quality)
```

### 🎨 **UI Component System**

```
shadcn/ui + Tailwind CSS v4
├── 🎨 Component Library (Buttons, Cards, Forms, etc.)
├── 🌙 Dark Mode Support (CSS Variables)
├── 📱 Responsive Design (Mobile-First)
├── 🎯 Accessibility (Semantic HTML, ARIA)
├── 🔄 Custom Hooks (useAuth, useApi, etc.)
└── 🎨 Theme System (Consistent Design Tokens)
```

### 🔐 **Authentication System**

```
JWT-Based Authentication
├── 🔑 Token Management (Access + Refresh)
├── 📝 Login/Register Forms
├── 🔄 React Context (Global Auth State)
├── 🛡️ Protected Routes (Route Guards)
├── 📱 Session Persistence (LocalStorage)
├── 🔒 Security Headers (CSRF, XSS Protection)
└── 🔄 Auto Token Refresh
```

---

## 📁 Architecture

### 🏗️ **Project Structure**

```
app/
├── components/              # React Components
│   ├── ui/                 # shadcn/ui component library
│   │   ├── button.tsx     # Button component
│   │   ├── card.tsx       # Card component
│   │   ├── input.tsx      # Input component
│   │   └── ...            # Other UI components
│   ├── auth/              # Authentication components
│   │   ├── login-form.tsx # Login form
│   │   ├── register-form.tsx # Registration form
│   │   └── auth-guard.tsx # Route protection
│   ├── layout/            # Layout components
│   │   ├── header.tsx     # Navigation header
│   │   ├── sidebar.tsx    # Navigation sidebar
│   │   └── footer.tsx     # Page footer
│   └── features/          # Feature-specific components
│       ├── vault/         # Vault management
│       ├── files/         # File operations
│       └── settings/      # User settings
├── context/               # React Contexts
│   ├── JwtAuthContext.tsx # Authentication context
│   └── ThemeContext.tsx   # Theme management
├── app/                   # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── dashboard/         # Dashboard pages
│   └── vault/             # Vault pages
├── lib/                   # Utility Libraries
│   ├── api.ts            # API client
│   ├── auth.ts           # Auth utilities
│   ├── utils.ts          # General utilities
│   └── validations.ts    # Form validations
├── hooks/                 # Custom React Hooks
│   ├── useAuth.ts        # Authentication hook
│   ├── useApi.ts         # API hook
│   └── useTheme.ts       # Theme hook
├── styles/               # Global Styles
│   └── globals.css       # Tailwind + custom styles
├── public/               # Static Assets
│   ├── favicon.ico       # Site favicon
│   └── manifest.json     # PWA manifest
├── .env.example          # Environment template
├── components.json       # shadcn/ui configuration
├── next.config.ts        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

### 🔄 **Data Flow Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Aether Vault   │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   Backend API    │◄──►│   (Database)    │
│  Port 3000      │    │  Port 8080       │    │  Port 5432      │
│  TypeScript     │    │  Go              │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
            │                       │                       │
            ▼                       ▼                       ▼
      JWT Tokens            REST API Endpoints     User/Vault Data
      React Context        Authentication          Secure Storage
      shadcn/ui Components  Business Logic        Encrypted Data
            │                       │
            ▼                       ▼
     ┌─────────────────┐    ┌──────────────────┐
     │  User Interface │   │  Secure Backend   │
     │  (Modern UI)    │   │  (Go API)         │
     │  Responsive     │   │  JWT Auth         │
     │  Dark Mode      │   │  File Operations  │
     └─────────────────┘    └──────────────────┘
```

---

## 🔐 Authentication System

### 🎯 **Complete Implementation**

The authentication system provides a secure and seamless user experience:

- **JWT Token Management** - Access and refresh tokens with automatic renewal
- **Login/Register Forms** - Complete user authentication flow with validation
- **React Context** - Global authentication state management
- **Protected Routes** - Route-based authentication guards
- **Session Persistence** - LocalStorage-based session management
- **Security Features** - CSRF protection, XSS prevention, secure headers

### 🔄 **Authentication Flow**

```typescript
// Login Process
1. User submits credentials → Form validation
2. API call to backend → JWT token generation
3. Tokens stored in LocalStorage → Auth context updated
4. User redirected to dashboard → Protected route access

// Registration Process
1. User fills registration form → Client-side validation
2. API call to backend → User creation + token generation
3. Tokens stored → User automatically logged in
4. Redirect to dashboard → Onboarding flow

// Token Refresh
1. Background token refresh → Automatic renewal
2. Invalid tokens → Redirect to login
3. Session expiration → Clean logout
```

### 🛡️ **Security Features**

- **Input Validation** - Zod schemas for form validation
- **XSS Protection** - React's built-in XSS protection
- **CSRF Protection** - SameSite cookies and security headers
- **Secure Storage** - HttpOnly cookies for sensitive data
- **Rate Limiting** - API request rate limiting
- **Security Headers** - Content Security Policy and other headers

---

## 📋 Features

### ✅ **Currently Implemented**

#### 🏗️ **Core Foundation**

- ✅ **Next.js 16 Framework** - Modern React framework with App Router
- ✅ **React 19.2.1** - Latest React with concurrent features
- ✅ **TypeScript 5** - Strict type checking and modern syntax
- ✅ **Tailwind CSS v4** - Utility-first CSS framework
- ✅ **shadcn/ui Components** - Beautiful, accessible component library

#### 🔐 **Authentication System**

- ✅ **JWT Authentication** - Complete token-based auth system
- ✅ **Login/Register Forms** - User authentication interface
- ✅ **React Context** - Global auth state management
- ✅ **Protected Routes** - Route-based authentication guards
- ✅ **Session Management** - Persistent user sessions

#### 🎨 **User Interface**

- ✅ **Responsive Design** - Mobile-first adaptive layouts
- ✅ **Dark Mode Support** - Complete theming system
- ✅ **Component Library** - Reusable UI components
- ✅ **Form Handling** - React Hook Form integration
- ✅ **Loading States** - Skeleton screens and spinners

#### 🛠️ **Development Infrastructure**

- ✅ **Hot Reload** - Fast development with HMR
- ✅ **Code Quality** - ESLint + Prettier configuration
- ✅ **Type Safety** - TypeScript strict mode
- ✅ **Build Optimization** - Production-ready builds

### 🔄 **In Development**

- **Vault Management Interface** - Complete vault CRUD operations
- **File Upload System** - Secure file upload with progress tracking
- **User Dashboard** - Personalized user dashboard
- **Search Functionality** - Advanced search and filtering
- **Settings Panel** - User preferences and account settings

### 📋 **Planned Features**

- **Real-time Updates** - WebSocket integration for live updates
- **File Preview** - In-app file preview for common formats
- **Sharing System** - Secure file sharing with permissions
- **Mobile App** - React Native companion application
- **PWA Support** - Progressive Web App features

---

## 💻 Development

### 🎯 **Development Workflow**

```bash
# Daily development
pnpm dev                 # Start development server
pnpm lint:fix           # Fix code issues
pnpm type-check        # Verify types
pnpm format            # Format code

# Component development
pnpm storybook         # Start Storybook
# Develop components in isolation

# Before committing
pnpm lint              # Check code quality
pnpm type-check        # Verify types
pnpm format            # Format code
pnpm test              # Run tests (when configured)
```

### 📋 **Development Guidelines**

- **Component-First Development** - Build reusable components
- **TypeScript Strict Mode** - All code must pass type checking
- **Responsive Design** - Mobile-first approach
- **Accessibility First** - Semantic HTML and ARIA attributes
- **Performance Optimization** - Lazy loading and code splitting
- **Security Best Practices** - Input validation and secure coding

### 🎨 **Component Development**

```typescript
// Example component structure
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"

export function VaultCard({ vault }: { vault: Vault }) {
  const { user } = useAuth()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{vault.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  )
}
```

---

## 🤝 Contributing

We welcome contributions to the Aether Vault frontend! Whether you're experienced with React, TypeScript, UI/UX design, or web development, there's a place for you.

### 🎯 **How to Get Started**

1. **Fork the repository** and create a feature branch
2. **Navigate to the app directory** - `cd app`
3. **Install dependencies** - `pnpm install`
4. **Start development** - `pnpm dev`
5. **Make your changes** following our guidelines
6. **Test thoroughly** in different browsers and screen sizes
7. **Submit a pull request** with clear description

### 🏗️ **Areas Needing Help**

- **React Component Development** - Build reusable UI components
- **UI/UX Design** - Improve user experience and interface design
- **TypeScript Development** - Enhance type safety and code quality
- **Responsive Design** - Ensure mobile compatibility
- **Accessibility** - Improve ARIA support and keyboard navigation
- **Performance Optimization** - Optimize bundle size and runtime performance
- **Testing** - Write unit and integration tests
- **Documentation** - Improve component documentation and guides

### 📝 **Contribution Process**

1. **Choose an area** - Components, pages, hooks, or utilities
2. **Read our guidelines** - Follow established patterns
3. **Create a branch** with a descriptive name
4. **Implement your changes** with proper TypeScript types
5. **Test thoroughly** across different devices and browsers
6. **Format your code** with `pnpm format`
7. **Submit a pull request** with clear description

---

## 📞 Support & Community

### 💬 **Get Help**

- 📖 **[Documentation](../docs/)** - Comprehensive guides
- 🐛 **[GitHub Issues](https://github.com/skygenesisenterprise/aether-vault/issues)** - Bug reports and feature requests
- 💡 **[GitHub Discussions](https://github.com/skygenesisenterprise/aether-vault/discussions)** - General questions and ideas
- 📧 **Email** - support@skygenesisenterprise.com

### 🐛 **Reporting Issues**

When reporting bugs, please include:

- Clear description of the problem
- Steps to reproduce
- Browser and device information
- Error logs or screenshots
- Expected vs actual behavior

---

## 📊 Project Status

| Component                 | Status         | Technology                | Notes                                   |
| ------------------------- | -------------- | ------------------------- | --------------------------------------- |
| **Next.js Framework**     | ✅ Working     | Next.js 16 + React 19.2.1 | App Router with TypeScript              |
| **Authentication System** | ✅ Working     | JWT + React Context       | Complete implementation                 |
| **UI Component Library**  | ✅ Working     | shadcn/ui + Tailwind CSS  | Beautiful, accessible components        |
| **Styling System**        | ✅ Working     | Tailwind CSS v4           | Utility-first with dark mode            |
| **Type Safety**           | ✅ Working     | TypeScript 5 (Strict)     | Complete type coverage                  |
| **Development Tools**     | ✅ Working     | ESLint + Prettier         | Code quality and formatting             |
| **Responsive Design**     | ✅ Working     | Mobile-First CSS          | Adaptive layouts                        |
| **Accessibility**         | 🔄 In Progress | ARIA + Semantic HTML      | Keyboard navigation and screen readers  |
| **Performance**           | 🔄 In Progress | Next.js Optimizations     | Code splitting and lazy loading         |
| **Testing Suite**         | 📋 Planned     | Jest + Testing Library    | Unit and integration tests              |
| **PWA Features**          | 📋 Planned     | Service Worker + Manifest | Offline support and app-like experience |

---

## 🏆 Sponsors & Partners

**Development led by [Sky Genesis Enterprise](https://skygenesisenterprise.com)**

We're looking for sponsors and partners to help accelerate development of this open-source secure vault system.

[🤝 Become a Sponsor](https://github.com/sponsors/skygenesisenterprise)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Sky Genesis Enterprise** - Project leadership and vision
- **Next.js Team** - Excellent React framework
- **React Team** - Modern UI library
- **shadcn/ui** - Beautiful component library
- **Tailwind CSS Team** - Utility-first CSS framework
- **TypeScript Team** - Type-safe JavaScript
- **Vercel** - Hosting and deployment platform
- **Open Source Community** - Tools, libraries, and inspiration

---

<div align="center">

### 🚀 **Join Us in Building the Future of Secure Storage!**

[⭐ Star This Repo](https://github.com/skygenesisenterprise/aether-vault) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-vault/issues) • [💡 Start a Discussion](https://github.com/skygenesisenterprise/aether-vault/discussions)

---

**🔧 Modern Frontend - Complete Authentication with Beautiful UI!**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

_Building a secure vault system with modern web technologies and exceptional user experience_

</div>
