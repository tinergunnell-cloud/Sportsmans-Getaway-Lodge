
import React, { useState, useEffect } from "react";
import { PageContent } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import EditableImage from '../components/admin/EditableImage';
import { useEditMode } from '../components/admin/EditModeContext';
import {
  ArrowRight,
  Calendar,
  UtensilsCrossed,
  ShoppingBag,
  ExternalLink,
  Pencil,
  Save,
  X
} from "lucide-react";

// This is the self-contained EditableText logic, living directly on the page.
const EditableText = ({ contentKey, initialContent, as: Component = 'p', className, isTextarea = false, onSave }) => {
    const { isEditMode } = useEditMode();
    const [isEditing, setIsEditing] = useState(false);
    const [currentContent, setCurrentContent] = useState(initialContent);

    // This useEffect was the source of the bug and has been removed.
    // The component now only sets its state once on initialization.
    // The parent component will manage re-renders via the `key` prop.

    const handleSave = () => {
        onSave(contentKey, currentContent); // Call parent to handle state and DB
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCurrentContent(initialContent); // Revert to original on cancel
    };

    if (isEditMode) {
        return (
            <div className={`relative group editable-container ${className}`}>
                {!isEditing ? (
                    <>
                        <Component className="w-full">{currentContent || '\u00A0'}</Component>
                        <Button
                            variant="outline"
                            size="icon"
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
                            onClick={() => setIsEditing(true)}
                        >
                            <Pencil className="w-4 h-4 text-stone-800" />
                        </Button>
                    </>
                ) : (
                    <div className="flex flex-col gap-2 bg-white p-2 rounded-lg border border-stone-300 shadow-lg ring-2 ring-blue-500 ring-offset-2">
                        {isTextarea ? (
                            <Textarea
                                value={currentContent || ''}
                                onChange={(e) => setCurrentContent(e.target.value)}
                                className="w-full text-base bg-white"
                                rows={4}
                            />
                        ) : (
                            <Input
                                value={currentContent || ''}
                                onChange={(e) => setCurrentContent(e.target.value)}
                                className="w-full text-base bg-white"
                            />
                        )}
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon" onClick={handleCancel}><X className="w-4 h-4" /></Button>
                            <Button size="icon" onClick={handleSave}><Save className="w-4 h-4" /></Button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return <Component className={className}>{currentContent || '\u00A0'}</Component>;
};


const FeatureCard = ({ icon, titleKey, descKey, title, description, onClick, isClickable = false, onSave }) => {
    const Icon = icon;
    return (
        <Card
            className={`text-center group transition-all duration-300 border-stone-200 ${
                isClickable ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : 'hover:shadow-lg'
            }`}
            onClick={onClick}
        >
            <CardContent className="p-8">
                <div className={`w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform duration-300 ${
                    isClickable ? 'group-hover:scale-110' : 'group-hover:scale-110'
                }`}>
                    <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-3">
                    <EditableText
                        key={`${titleKey}-${title}`}
                        contentKey={titleKey}
                        initialContent={title}
                        as="h3"
                        className="text-xl font-semibold text-stone-800"
                        onSave={onSave}
                    />
                    {isClickable && (
                        <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-green-600 transition-colors" />
                    )}
                </div>
                <EditableText
                    key={`${descKey}-${description}`}
                    contentKey={descKey}
                    initialContent={description}
                    className="text-stone-600 leading-relaxed"
                    isTextarea={true}
                    onSave={onSave}
                />
                {isClickable && (
                    <p className="text-xs text-stone-500 mt-3 group-hover:text-green-600 transition-colors">
                        Click to view on Google Maps
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export default function Home() {
    const [content, setContent] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const { isEditMode } = useEditMode();
    
    const loadPageData = async () => {
        setIsLoading(true);
        const pageContents = await PageContent.list();
        const contentMap = pageContents.reduce((acc, item) => {
            acc[item.content_key] = item.value;
            return acc;
        }, {});
        
        const defaultContent = {
            home_hero_title: "Welcome to Sportsman's Getaway Lodge",
            home_hero_subtitle: "Experience the perfect blend of outdoor adventure and comfortable accommodations in the Arkansas Delta",
            home_features_title: "Local Amenities",
            home_features_subtitle: "Discover the best dining and shopping experiences near our lodges in Arkansas County",
            home_restaurants_title: "Restaurants",
            home_restaurants_desc: "Click to explore local restaurants and dining options near the lodge. Discover great food and local flavors in Arkansas County.",
            home_shopping_title: "Shopping",
            home_shopping_desc: "Click to find hunting stores, outdoor outfitters, and sporting goods stores like Mack's Prairie Wings and Webb's Sporting Goods in Arkansas County."
        };

        setContent({ ...defaultContent, ...contentMap });
        setIsLoading(false);
    };

    useEffect(() => {
        loadPageData();
    }, []);

    const handleSave = async (key, value) => {
        const contentType = key.includes('subtitle') || key.includes('desc') ? 'textarea' : 'text';
        
        // Find if the content key already exists
        const existing = await PageContent.filter({ content_key: key });

        if (existing.length > 0) {
            // If it exists, update it
            await PageContent.update(existing[0].id, { value: value || '' });
        } else {
            // If it doesn't exist, create a new one
            await PageContent.create({
                content_key: key,
                content_type: contentType,
                value: value || ''
            });
        }
        
        // THEN, update the local state. This matches the Lodges page.
        setContent(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleImageUpdate = async () => {
        // Reload all page data after an image update to ensure all content is fresh
        await loadPageData();
    };

    const openRestaurantsMap = () => {
        const searchQuery = "restaurants near Arkansas County, Arkansas";
        const encodedQuery = encodeURIComponent(searchQuery);
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
        window.open(googleMapsUrl, '_blank');
    };

    const openShoppingMap = () => {
        const searchQuery = "hunting stores outdoor outfitters sporting goods near Arkansas County, Arkansas";
        const encodedQuery = encodeURIComponent(searchQuery);
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
        window.open(googleMapsUrl, '_blank');
    };

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center text-xl font-semibold">Loading...</div>;
    }

    return (
        <div className="relative">
            {/* Hero Section */}
            {isEditMode ? (
                <section className="py-12 bg-stone-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mb-6 p-4 border-l-4 border-amber-500 bg-amber-50">
                            <h2 className="text-xl font-bold text-amber-800">Editing Hero Section</h2>
                            <p className="text-amber-700">The layout has changed to make editing easier. This is not visible to regular users.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8 items-center bg-white border border-stone-200 p-8 rounded-2xl shadow-sm">
                            <div className="relative h-96 rounded-lg overflow-hidden">
                                <EditableImage
                                    contentKey="home_hero_image"
                                    initialContent={content.home_hero_image || "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80"}
                                    alt="Lodge background"
                                    className="w-full h-full object-cover"
                                    onImageUpdate={handleImageUpdate}
                                />
                            </div>
                            <div className="flex flex-col justify-center">
                                <EditableText
                                    key={`home_hero_title-${content.home_hero_title}`}
                                    contentKey="home_hero_title"
                                    initialContent={content.home_hero_title}
                                    as="h1"
                                    className="text-4xl sm:text-5xl font-bold text-stone-800 mb-4"
                                    onSave={handleSave}
                                />
                                <EditableText
                                    key={`home_hero_subtitle-${content.home_hero_subtitle}`}
                                    contentKey="home_hero_subtitle"
                                    initialContent={content.home_hero_subtitle}
                                    isTextarea={true}
                                    className="text-lg sm:text-xl text-stone-600"
                                    onSave={handleSave}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
                    <EditableImage
                        contentKey="home_hero_image"
                        initialContent={content.home_hero_image || "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80"}
                        alt="Lodge background"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                        onImageUpdate={handleImageUpdate}
                    />
                    <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                        <EditableText
                            key={`home_hero_title-${content.home_hero_title}`}
                            contentKey="home_hero_title"
                            initialContent={content.home_hero_title}
                            as="h1"
                            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight [text-shadow:_2px_2px_8px_rgba(0,0,0,0.7)]"
                            onSave={handleSave}
                        />
                        <EditableText
                            key={`home_hero_subtitle-${content.home_hero_subtitle}`}
                            contentKey="home_hero_subtitle"
                            initialContent={content.home_hero_subtitle}
                            isTextarea={true}
                            className="text-lg sm:text-xl text-green-100 mb-8 max-w-2xl mx-auto leading-relaxed [text-shadow:_1px_1px_4px_rgba(0,0,0,0.8)]"
                            onSave={handleSave}
                        />
                    </div>
                </section>
            )}

            {/* Quick Action Section */}
            <section className="py-8 bg-white border-b border-stone-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center">
                        <Link to={createPageUrl("Lodges")}>
                            <Button size="lg" className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                                <Calendar className="w-6 h-6 mr-3" />
                                Check Availability
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <EditableText
                            key={`home_features_title-${content.home_features_title}`}
                            contentKey="home_features_title"
                            initialContent={content.home_features_title}
                            as="h2"
                            className="text-3xl font-bold text-stone-800 mb-4"
                            onSave={handleSave}
                        />
                        <EditableText
                            key={`home_features_subtitle-${content.home_features_subtitle}`}
                            contentKey="home_features_subtitle"
                            initialContent={content.home_features_subtitle}
                            className="text-lg text-stone-600 max-w-3xl mx-auto"
                            isTextarea={true}
                            onSave={handleSave}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <FeatureCard
                            icon={UtensilsCrossed}
                            titleKey="home_restaurants_title"
                            descKey="home_restaurants_desc"
                            title={content.home_restaurants_title}
                            description={content.home_restaurants_desc}
                            onClick={openRestaurantsMap}
                            isClickable={true}
                            onSave={handleSave}
                        />
                        <FeatureCard
                            icon={ShoppingBag}
                            titleKey="home_shopping_title"
                            descKey="home_shopping_desc"
                            title={content.home_shopping_title}
                            description={content.home_shopping_desc}
                            onClick={openShoppingMap}
                            isClickable={true}
                            onSave={handleSave}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
