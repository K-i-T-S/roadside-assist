# RoadsideAssist - Lebanon

A lean, production-ready roadside assistance web platform optimized for speed to revenue and cash-based markets in Lebanon.

## 🚀 Features

### Customer-Facing
- Mobile-first responsive design
- Simple service request form (Tow, Battery Jump, Flat Tire, Fuel Delivery, Minor Repair)
- Google Maps location sharing
- WhatsApp and phone integration
- No login required

### Admin Dashboard
- Secure authentication via Supabase Auth
- Real-time request management
- Manual provider assignment
- Request status tracking (pending → assigned → completed)
- Basic analytics dashboard

### Provider Management
- Add/edit/deactivate providers
- Service type specialization
- Coverage area management
- Active/inactive status control

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Supabase (Postgres, Auth, RLS)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel
- **State**: Server Components + minimal client state
- **Maps**: Google Maps links (no SDKs)
- **Notifications**: WhatsApp deep links + tel links

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd roadside-assist
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migration in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor
3. Enable Row Level Security (RLS) on both tables
4. Create an admin user in Authentication

### 3. Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄 Database Schema

### Requests Table
- `id` (uuid, primary key)
- `service_type` (enum: tow, battery_jump, flat_tire, fuel_delivery, minor_repair)
- `user_phone` (text)
- `location_link` (text)
- `status` (enum: pending, assigned, completed)
- `provider_id` (uuid, nullable, foreign key)
- `notes` (text, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Providers Table
- `id` (uuid, primary key)
- `name` (text)
- `phone` (text)
- `service_types` (text array)
- `coverage_area` (text)
- `active` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## 🔐 Security

- **Customers**: Public insert only for requests
- **Admin**: Full access via Supabase Auth
- **Providers**: No direct DB access (Phase 1)
- **RLS Policies**: Applied correctly to prevent unauthorized access

## 📱 Usage

### For Customers
1. Visit the landing page
2. Select service type
3. Enter phone number
4. Share Google Maps location
5. Submit request
6. Receive confirmation with WhatsApp/phone contact

### For Admins
1. Go to `/admin/login`
2. Sign in with Supabase Auth credentials
3. View dashboard with incoming requests
4. Assign providers manually
5. Update request status
6. Manage providers in `/admin/providers`

## 🚀 Deployment to Vercel

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

The application is production-ready and will work immediately on Vercel.

## 📞 Contact Information (Customizable)

Update the contact details in:
- `src/app/page.tsx` (footer section)
- Confirmation screen WhatsApp/phone links

Default: +961 76 123 456

## 🔧 Customization

### Adding New Service Types
1. Update `ServiceType` in `src/types/index.ts`
2. Add to `serviceOptions` in `src/app/page.tsx`
3. Update database enum in Supabase

### Changing Contact Info
Edit the phone numbers in:
- Footer of main page
- Confirmation screen
- WhatsApp deep links

### Styling
All styles use Tailwind CSS classes. Modify colors and spacing in component files.

## 🌐 Multi-language Support

The structure is ready for Arabic/English localization. Add translation keys and implement language switching as needed.

## 📈 Analytics (Basic)

The admin dashboard includes:
- Today's requests count
- Completed jobs today
- Active providers count
- Pending requests

For advanced analytics, integrate with tools like Google Analytics or build custom reports.

## 🔄 Future Enhancements

### Phase 2 Features
- Provider dashboard with login
- Automated provider assignment
- Customer notifications
- Payment integration
- Advanced analytics
- Mobile app (PWA)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

---

**Built with ❤️ for Lebanon's roadside assistance needs**
