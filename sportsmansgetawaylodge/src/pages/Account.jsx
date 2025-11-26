import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  User, 
  Calendar, 
  Package, 
  Settings,
  MapPin,
  Clock,
  CreditCard,
  History
} from "lucide-react";

export default function Account() {
  // This is a placeholder page - in a real app, you'd load user data and bookings
  const placeholderUser = {
    name: "John Smith",
    email: "john@example.com",
    memberSince: "January 2023"
  };

  const accountSections = [
    {
      icon: Calendar,
      title: "My Bookings",
      description: "View and manage your lodge reservations",
      action: "View Bookings",
      href: createPageUrl("MyBookings")
    },
    {
      icon: Package,
      title: "Order History",
      description: "Track your merchandise orders and purchases",
      action: "View Orders",
      href: createPageUrl("MyOrders")
    },
    {
      icon: Settings,
      title: "Account Settings",
      description: "Update your profile and preferences",
      action: "Edit Profile",
      href: createPageUrl("Settings")
    }
  ];

  const quickStats = [
    { label: "Total Bookings", value: "3", icon: Calendar },
    { label: "Total Orders", value: "7", icon: Package },
    { label: "Loyalty Points", value: "250", icon: CreditCard },
    { label: "Member Since", value: "2023", icon: History }
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-stone-800">Welcome back, {placeholderUser.name}!</h1>
              <p className="text-stone-600">Member since {placeholderUser.memberSince}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="border-stone-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-stone-800 mb-1">{stat.value}</div>
                <div className="text-sm text-stone-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Account Sections */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {accountSections.map((section, index) => (
            <Card key={index} className="border-stone-200 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-stone-800">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-stone-600 mb-4 leading-relaxed">{section.description}</p>
                <Link to={section.href}>
                  <Button className="w-full bg-green-700 hover:bg-green-800">
                    {section.action}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Placeholder */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-stone-800">
              <Clock className="w-6 h-6" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-stone-800">Booking confirmed</p>
                  <p className="text-sm text-stone-600">Pine Ridge Lodge - March 15-17, 2024</p>
                </div>
                <div className="text-sm text-stone-500">2 days ago</div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-stone-800">Order shipped</p>
                  <p className="text-sm text-stone-600">Outdoor Gear Bundle - Order #1234</p>
                </div>
                <div className="text-sm text-stone-500">1 week ago</div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-stone-800">Loyalty points earned</p>
                  <p className="text-sm text-stone-600">+50 points from recent stay</p>
                </div>
                <div className="text-sm text-stone-500">2 weeks ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}