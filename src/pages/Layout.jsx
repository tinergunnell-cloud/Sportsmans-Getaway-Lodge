

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PageContent } from "@/api/entities";
import {
  Home,
  MapPin,
  ShoppingBag,
  Settings,
  Menu,
  X,
  Mountain,
  Phone,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { EditModeProvider, useEditMode } from "src/components/admin/EditModeContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const navigationItems = [
  { title: "Home", url: createPageUrl("Home"), icon: Home },
  { title: "Lodges", url: createPageUrl("Lodges"), icon: MapPin },
  { title: "Shop", url: createPageUrl("Shop"), icon: ShoppingBag },
  { title: "About", url: createPageUrl("About"), icon: Mountain },
  { title: "Contact", url: createPageUrl("Contact"), icon: Phone },
];

function AdminToolbar() {
    const { isEditMode, toggleEditMode, isAdmin } = useEditMode();

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-stone-800 text-white p-4 rounded-lg shadow-2xl flex items-center gap-4">
            <Settings className="w-5 h-5 text-amber-400" />
            <div className="flex items-center space-x-2">
                <Label htmlFor="edit-mode-switch" className="font-medium">Edit Mode</Label>
                <Switch
                    id="edit-mode-switch"
                    checked={isEditMode}
                    onCheckedChange={toggleEditMode}
                />
            </div>
        </div>
    );
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [contactInfo, setContactInfo] = React.useState({
    phone: "(555) 123-4567",
    email: "info@sportsmansgetaway.com"
  });

  React.useEffect(() => {
    const loadContactInfo = async () => {
      try {
        const pageContents = await PageContent.list();
        const contentMap = pageContents.reduce((acc, item) => {
          acc[item.content_key] = item.value;
          return acc;
        }, {});

        setContactInfo({
          phone: contentMap.contact_phone_details || "(555) 123-4567",
          email: contentMap.contact_email_details || "info@sportsmansgetaway.com"
        });
      } catch (error) {
        console.error("Failed to load contact info:", error);
      }
    };

    loadContactInfo();
  }, []);

  const isActivePage = (url) => location.pathname === url;

  return (
    <EditModeProvider>
      <div className="min-h-screen bg-stone-50">
        <style>{`
          :root {
            --primary-forest: #2d4a2b;
            --primary-forest-light: #3d5a3b;
            --accent-amber: #d97706;
            --accent-warm: #ea580c;
            --neutral-warm: #a3a3a3;
            --stone-warm: #f5f5f4;
            --text-primary: #292524;
            --text-secondary: #57534e;
          }
        `}</style>

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 md:h-16">
              {/* Logo */}
              <Link to={createPageUrl("Home")} className="flex items-center gap-2 md:gap-3 group">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-700 to-green-800 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                  <Mountain className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-base md:text-xl font-bold text-stone-800">Sportsman's Getaway</h1>
                  <p className="text-[10px] md:text-xs text-stone-600 -mt-1">Lodge</p>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                {navigationItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActivePage(item.url)
                        ? "bg-green-100 text-green-800"
                        : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                ))}
              </nav>

              {/* Right side actions - Mobile menu only */}
              <div className="flex items-center gap-2 md:gap-4">
                {/* Removed desktop Account link */}
                
                {/* Mobile menu trigger */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[280px] sm:w-80">
                    <div className="flex flex-col gap-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-700 to-green-800 rounded-lg flex items-center justify-center">
                          <Mountain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="font-bold text-stone-800">Sportsman's Getaway</h2>
                          <p className="text-xs text-stone-600 -mt-1">Lodge</p>
                        </div>
                      </div>
                      
                      <nav className="flex flex-col gap-2">
                        {navigationItems.map((item) => (
                          <Link
                            key={item.title}
                            to={item.url}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isActivePage(item.url)
                                ? "bg-green-100 text-green-800"
                                : "text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <item.icon className="w-5 h-5" />
                            {item.title}
                          </Link>
                        ))}
                      </nav>

                      {/* Removed mobile Account link */}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)]">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-stone-800 text-stone-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                    <Mountain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Sportsman's Getaway Lodge</h3>
                  </div>
                </div>
                <p className="text-sm">
                  Experience the perfect outdoor retreat with comfortable lodges, 
                  premium amenities, and unforgettable adventures in nature.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-4">Contact Info</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4" />
                    <a 
                      href={`tel:${contactInfo.phone.replace(/\D/g, '')}`}
                      className="hover:text-white transition-colors duration-200"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4" />
                    <span>{contactInfo.email}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                <div className="space-y-2 text-sm">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.title}
                      to={item.url}
                      className="block hover:text-white transition-colors duration-200"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="border-t border-stone-700 mt-6 md:mt-8 pt-6 md:pt-8 text-center text-xs md:text-sm">
              <p>&copy; 2024 Sportsman's Getaway Lodge. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
      <AdminToolbar />
    </EditModeProvider>
  );
}

