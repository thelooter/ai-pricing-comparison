# AI Pricing Overview

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-green)](https://supabase.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

A comprehensive web application that helps developers and businesses compare and understand pricing across different AI model providers. Built with Next.js 14, Supabase, and TypeScript.

## 📊 Demo

[Live Deployment](https://ai-price-comparison.vercel.app)

## 🎯 Features

- **Pricing Comparison**: Interactive comparison of AI model pricing across providers
  - Input/output costs breakdown
  - Model capabilities comparison
  - Alternative model suggestions
  - Cost calculator for estimated usage

- **Community-Driven Updates**
  - Report missing AI models
  - Flag outdated pricing information
  - Submit corrections for review
  - Track report status

- **Admin Dashboard**
  - Manage AI model database
  - Process user reports
  - Update pricing information
  - Monitor data accuracy

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- pnpm (recommended) or npm
- Supabase account

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/thelooter/ai-pricing-overview.git
   cd ai-pricing-overview
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. Copy `.env.example` to `.env.local` and update the values:
   ```bash
   cp .env.example .env.local
   ```

4. Apply database migrations:
   - Navigate to your Supabase dashboard
   - Go to SQL Editor
   - Run the migrations from `migrations/` in order:
     ```sql
     -- Run reports.sql first
     migrations/reports.sql
     ```

5. Start the development server:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## 🏗️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## 📁 Project Structure

```
ai-pricing-overview/
├── app/                    # Next.js app router pages
├── components/            # Reusable UI components
├── lib/                   # Utility functions and helpers
├── migrations/            # Supabase SQL migrations
├── public/               # Static assets
├── supabase/             # Supabase configuration
├── types/                # TypeScript type definitions
└── middleware.ts         # Auth middleware
```

## 🔒 Authentication

This project uses Supabase Authentication with SSR support. Key authentication features:

- Social provider login (GitHub)
- Protected admin routes
- Middleware-based auth checks
- Token refresh handling

## 📈 Development Status

Current status: **Beta**

This project is in active development. While core features are implemented, you may encounter bugs or incomplete features. Please report any issues you find!

## 🗺️ Roadmap

- [ ] Add support for more AI providers
- [ ] Implement real-time pricing updates
- [ ] Add user dashboard for tracking costs
- [ ] Improve mobile responsiveness
- [ ] Add API endpoints for programmatic access
- [ ] Implement automated testing

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- Theo ([@t3dotgg](https://github.com/t3dotgg)) for their [AI Pricing Gist](https://gist.github.com/t3dotgg/a4bb252e590320e223e71c595e60e6be)
- All contributors who help maintain the pricing data
