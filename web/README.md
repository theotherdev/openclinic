# OpenClinic - Clinic Management System

OpenClinic is a comprehensive clinic management system designed to streamline healthcare operations. Built with modern web technologies, it provides healthcare providers with tools to efficiently manage patients, prescriptions, inventory, and clinic operations.

## 🚀 Features

- **Patient Management**: Add, update, and manage patient records with medical history
- **Prescription Management**: Create, track, and manage patient prescriptions
- **Inventory Control**: Track medicine stock levels with low-stock alerts
- **Dashboard Analytics**: Real-time statistics and visualizations of clinic operations
- **User Authentication**: Role-based access control for doctors, staff, and administrators
- **PDF Generation**: Export prescriptions to PDF format
- **Real-time Data**: Live updates across all system components
- **Responsive Design**: Works seamlessly across devices

## 🛠️ Technology Stack

- **Frontend**: [Next.js](https://nextjs.org) (v16.0.5) with React 19
- **Styling**: Tailwind CSS with Radix UI components
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **File Storage**: Firebase Storage
- **UI Components**: Radix UI primitives and shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **PDF Generation**: jsPDF for prescription export
- **State Management**: React Context API
- **Type Safety**: TypeScript

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun
- Firebase account for authentication and database services

## 🔧 Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd openclinic/web
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore, Authentication, and Storage
   - Create a `.env.local` file in the root directory with your Firebase configuration:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🏗️ Project Structure

```
web/
├── app/                    # Next.js app directory (v13+)
│   ├── (auth)/            # Authentication routes (login)
│   ├── (dashboard)/       # Dashboard routes (patients, prescriptions, inventory)
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── layout/            # Layout components
│   └── providers/         # Context providers (theme, auth)
├── lib/                  # Business logic and utilities
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API service classes
│   ├── types/            # TypeScript type definitions
│   └── firebase/         # Firebase configuration
├── public/               # Static assets
└── scripts/              # Utility scripts
```

## 🧩 Key Components

### Authentication System
- Role-based access (admin, doctor, staff)
- Protected routes with automatic redirect
- Session management with Firebase

### Patient Management
- Patient registration and profile management
- Medical history tracking
- Search and filter capabilities

### Prescription Management
- Prescription creation with medications
- Stock validation during prescription
- PDF export functionality

### Inventory Management
- Medicine tracking with stock levels
- Low-stock alerts and notifications
- Restocking capabilities
- Expiry date monitoring

### Dashboard
- Real-time clinic statistics
- Visual charts for data analysis
- Low-stock alerts display
- Appointment scheduling view

## 📊 Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality checks

## 🚀 Deployment

### Vercel
1. Push your code to a Git repository
2. Go to [Vercel](https://vercel.com) and create a new project
3. Import your repository
4. Set the root directory to `web/`
5. Add the environment variables in the Vercel dashboard
6. Deploy!

### Other Platforms
For other deployment platforms (Netlify, AWS, etc.), ensure you:
1. Build the application: `npm run build`
2. Set up environment variables
3. Serve the build output with proper Next.js configuration

## 🔐 User Roles

OpenClinic supports different user roles with specific permissions:

- **Admin**: Full access to all features and system settings
- **Doctor**: Access to patient records, prescription creation, and personal dashboard
- **Staff**: Patient management, appointment scheduling, and inventory viewing

## 📄 License

This project is open source and available under the [MIT License](./LICENSE).

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 🐛 Issues

If you find any issues or have feature requests, please [create an issue](https://github.com/your-username/openclinic/issues) in the repository.

## 🙏 Acknowledgements

- Built with [Next.js](https://nextjs.org)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Charts from [Recharts](https://recharts.org)
- Data management with [Firebase](https://firebase.google.com)
