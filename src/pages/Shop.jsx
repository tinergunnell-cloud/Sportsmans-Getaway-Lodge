
import React, { useState, useEffect } from "react";
import { Product, PageContent } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import EditableImage from '../components/admin/EditableImage';
import EditableProduct from '../components/admin/EditableProduct';
import { useEditMode } from '../components/admin/EditModeContext';
import { 
  ShoppingBag,
  ArrowRight,
  Pencil,
  Save,
  X
} from "lucide-react";

// This is the new, self-contained EditableText component logic, living directly on the page.
const EditableText = ({ contentKey, initialContent, as: Component = 'p', className, isTextarea = false, onSave }) => {
    const { isEditMode } = useEditMode();
    const [isEditing, setIsEditing] = useState(false);
    const [currentContent, setCurrentContent] = useState(initialContent);

    // This useEffect was the source of the bug and has been removed.
    // The component now only sets its state once on initialization.
    // The parent component will manage re-renders via the `key` prop.

    const handleSave = async () => {
        await onSave(contentKey, currentContent);
        setIsEditing(false);
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
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}><X className="w-4 h-4" /></Button>
                            <Button size="icon" onClick={handleSave}><Save className="w-4 h-4" /></Button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return <Component className={className}>{currentContent || '\u00A0'}</Component>;
};

export default function Shop() {
  const [content, setContent] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { isEditMode } = useEditMode();

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    const pageContents = await PageContent.list();
    const contentMap = pageContents.reduce((acc, item) => ({ ...acc, [item.content_key]: item.value }), {});
    setContent(contentMap);
    setIsLoading(false);
  };

  const handleProductCreated = (newProduct) => {
    // Product created successfully
    console.log('New product created:', newProduct);
  };

  const handleImageUpdate = async () => {
    await loadPageData();
  };

  const handleSave = async (key, value) => {
    const isTextarea = key.includes('subtitle');
    const contentType = isTextarea ? 'textarea' : 'text';

    // Update the database
    const existing = await PageContent.filter({ content_key: key });
    if (existing.length > 0) {
        await PageContent.update(existing[0].id, { value: value || '' });
    } else {
        await PageContent.create({
            content_key: key,
            content_type: contentType,
            value: value || ''
        });
    }

    // Update the local state directly
    setContent(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-stone-600">Loading Shop...</div>;
  }

  const placeholderPrefixes = Array.from({ length: 6 }, (_, i) => `shop_placeholder_${i + 1}`);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section - Conditional Rendering based on Edit Mode */}
      {isEditMode ? (
        <section className="py-12 bg-stone-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6 p-4 border-l-4 border-amber-500 bg-amber-50">
                    <h2 className="text-xl font-bold text-amber-800">Editing Hero Section</h2>
                    <p className="text-amber-700">The layout has changed to make editing easier. This is not visible to regular users.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8 items-center bg-white border border-stone-200 p-8 rounded-2xl shadow-sm">
                    {/* Left Side: Image */}
                    <div className="relative h-96 rounded-lg overflow-hidden">
                        <EditableImage
                          contentKey="shop_hero_image"
                          initialContent={content.shop_hero_image || "https://images.unsplash.com/photo-1523381294911-8d3cead13475?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}
                          alt="Shop background"
                          className="w-full h-full object-cover"
                          onImageUpdate={handleImageUpdate}
                        />
                    </div>
                    {/* Right Side: Text */}
                    <div className="flex flex-col justify-center">
                        <EditableText
                          key={`shop_hero_title-${content.shop_hero_title}`}
                          contentKey="shop_hero_title"
                          initialContent={content.shop_hero_title || "Lodge Merchandise & Gear"}
                          as="h1"
                          className="text-4xl sm:text-5xl font-bold text-stone-800 mb-4"
                          onSave={handleSave}
                        />
                        <EditableText
                          key={`shop_hero_subtitle-${content.shop_hero_subtitle}`}
                          contentKey="shop_hero_subtitle"
                          initialContent={content.shop_hero_subtitle || "Take a piece of your adventure home with you."}
                          className="text-lg sm:text-xl text-stone-600"
                          onSave={handleSave}
                        />
                    </div>
                </div>
            </div>
        </section>
      ) : (
        // NORMAL VIEW LAYOUT
        <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center">
          <EditableImage
            contentKey="shop_hero_image"
            initialContent={content.shop_hero_image || "https://images.unsplash.com/photo-1523381294911-8d3cead13475?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}
            alt="Shop background"
            className="absolute inset-0 w-full h-full object-cover"
            onImageUpdate={handleImageUpdate}
          />
          {/* Removed: <div className="absolute inset-0 bg-stone-900/70" /> */}
          <div className="relative z-10 text-center px-4">
            <EditableText
              key={`shop_hero_title-${content.shop_hero_title}`}
              contentKey="shop_hero_title"
              initialContent={content.shop_hero_title || "Lodge Merchandise & Gear"}
              as="h1"
              className="text-4xl sm:text-5xl font-bold text-white mb-4 [text-shadow:_2px_2px_8px_rgba(0,0,0,0.7)]"
              onSave={handleSave}
            />
            <EditableText
              key={`shop_hero_subtitle-${content.shop_hero_subtitle}`}
              contentKey="shop_hero_subtitle"
              initialContent={content.shop_hero_subtitle || "Take a piece of your adventure home with you."}
              className="text-lg sm:text-xl text-stone-200 [text-shadow:_1px_1px_4px_rgba(0,0,0,0.8)]"
              onSave={handleSave}
            />
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">
            Our Collection ({placeholderPrefixes.length})
          </h2>
          <p className="text-stone-600">
            Browse our selection of quality outdoor gear and lodge merchandise
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {placeholderPrefixes.map((prefix) => (
            <EditableProduct key={prefix} contentPrefix={prefix} onProductCreated={handleProductCreated} />
          ))}
        </div>
      </div>
    </div>
  );
}
