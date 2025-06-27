# Employee Portal - Odoo Integration

A modern employee portal built with Next.js that integrates with Odoo ERP system, providing comprehensive employee self-service capabilities.

## 🚀 Features

### Core Functionality
- **Authentication & Profile Management**
  - Secure login with Odoo credentials
  - User profile viewing and editing
  - Profile picture upload
  - Personal information management

- **Attendance Management**
  - Clock in/out functionality
  - Attendance history and reports
  - Shift management
  - Attendance rate calculations

- **Leave Management**
  - Leave balance viewing
  - Leave request submission
  - Leave history tracking
  - Leave type management

- **Expense Management**
  - Expense request creation
  - Expense history tracking
  - File attachment support

- **Communication**
  - Real-time messaging via Odoo Discuss
  - Channel-based communication
  - Message history

### Technical Features
- **Progressive Web App (PWA)** - Installable web application  //not yet done
- **Responsive Design** - Mobile-first approach
- **Dark/Light Theme** - User preference support
- **Real-time Updates** - WebSocket integration  //not yet done
- **File Upload** - Secure attachment handling

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React** - UI library
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Radix UI** - Headless UI primitives

### Backend
- **Next.js API Routes** - Backend endpoints (TypeScript)
- **XML-RPC** - Odoo communication protocol
- **Odoo 17.0** - ERP system integration

### Development Tools
- **TypeScript** - Primary development language
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **date-fns** - Date utilities
- **next-themes** - Theme management

## 📁 Project Structure

```
egemp-portal/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── odoo/         # Odoo integration APIs
│   │   │   ├── auth/     # Authentication endpoints
│   │   │   ├── employee/ # Employee data endpoints
│   │   │   ├── leave/    # Leave management APIs
│   │   │   └── expense/  # Expense management APIs
│   │   └── discuss/      # Messaging APIs
│   ├── attendance/       # Attendance pages
│   ├── dashboard/        # Main dashboard
│   ├── discuss/          # Messaging interface
│   ├── expenses/         # Expense management
│   ├── leave/           # Leave management
│   ├── login/           # Authentication
│   └── profile/         # User profile
├── components/           # Reusable components
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Authentication components
│   └── discuss/         # Messaging components
├── lib/                 # Utility libraries
│   ├── utils/           # Helper functions
│   └── odooXml.ts       # Odoo integration
└── public/              # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Odoo 17.0 instance
- Access to Odoo database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd egemp-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Create a `.env.local` file with your Odoo configuration:
   ```env
   ODOO_BASE_URL=https://your-odoo-instance.com
   ODOO_DB_NAME=your_database_name
   ODOO_ADMIN_USER=admin_username
   ODOO_ADMIN_PASSWORD=admin_password
   ```

4. **Update Odoo configuration**
   Edit `lib/config.ts` with your Odoo server details:
   ```typescript
   export const ODOO_CONFIG = {
     BASE_URL: 'https://your-odoo-instance.com',
     DB_NAME: 'your_database_name',
     ADMIN_USER: 'admin_username',
     ADMIN_PWD: 'admin_password'
   }
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Odoo Integration
The application integrates with Odoo through XML-RPC calls. Key configuration points:

- **Authentication**: Uses Odoo's built-in user authentication
- **Employee Data**: Fetches from `hr.employee` model
- **Attendance**: Integrates with `hr.attendance` model
- **Leave Management**: Uses `hr.leave` and related models
- **Expenses**: Connects to `hr.expenses` management modules

### Theme Configuration
The app supports light/dark themes with automatic system preference detection. Users can manually switch themes through the settings.

## 📱 PWA Features // pending

The application is configured as a Progressive Web App with:
- Service worker for offline functionality
- App manifest for installation
- Responsive design for mobile devices
- Push notification support (configurable)

## 🔒 Security

- **Authentication**: Secure Odoo-based authentication
- **Session Management**: Client-side session storage
- **API Security**: Server-side validation
- **File Upload**: Secure file handling with validation

## 🧪 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Style
- **TypeScript** - Primary development language for type safety
- ESLint for code quality
- Prettier for code formatting
- Component-based architecture

## 📊 API Endpoints

### Authentication
- `POST /api/odoo/auth/login` - User login
- `POST /api/odoo/auth/profile` - Get user profile
- `POST /api/odoo/auth/profile/update` - Update profile

### Attendance
- `POST /api/odoo/auth/attendance/clock-in` - Clock in
- `POST /api/odoo/auth/attendance/clock-out` - Clock out
- `GET /api/odoo/auth/attendance/today` - Today's attendance

### Leave Management
- `GET /api/odoo/leave/types` - Get leave types
- `GET /api/odoo/leave/requests` - Get leave requests
- `POST /api/odoo/leave/request` - Submit leave request

### Expenses
- `GET /api/odoo/expense/route` - Get expenses
- `POST /api/odoo/expense/route` - Create expense

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. //not yet

## 🆘 Support

For support and questions:
- Check the [Issues](../../issues) page   // need to create 
- Review the Odoo integration documentation
- Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with core employee portal features
- **v1.1.0** - Added PWA support and improved UI
- **v1.2.0** - Enhanced Odoo integration and error handling

---

