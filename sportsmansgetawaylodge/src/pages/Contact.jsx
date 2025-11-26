
import React, { useState, useEffect } from "react";
import { PageContent } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import EditableImage from '../components/admin/EditableImage';
import { useEditMode } from '../components/admin/EditModeContext';
import { 
  Phone, 
  ShoppingBag, 
  MapPin, 
  Clock,
  Mountain,
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
        onSave(contentKey, currentContent);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCurrentContent(initialContent);
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

export default function Contact() {
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
        contact_hero_title: "Get In Touch",
        contact_hero_subtitle: "We're here to help. Contact us with any questions or to start planning your trip.",
        contact_section_title: "We'd Love to Hear From You",
        contact_section_subtitle: "Whether you have a question about our lodges, booking availability, or local attractions, our team is ready to answer all your questions.",
        contact_map_title: "Find Us Here",
        contact_map_address: "123 Wilderness Trail, Mountain View, CO 80424"
    };

    setContent({ ...defaultContent, ...contentMap });
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadPageData();
  }, []);

  const handleSave = async (key, value) => {
    const isTextarea = key.includes('subtitle') || key.includes('description');
    const contentType = isTextarea ? 'textarea' : 'text';
    
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

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-stone-600">Loading...</div>;
  }

  const contactInfo = [
    {
      icon: Phone,
      titleKey: "contact_phone_title",
      detailsKey: "contact_phone_details", 
      descriptionKey: "contact_phone_description",
      defaultTitle: "Phone",
      defaultDetails: "(555) 123-4567",
      defaultDescription: "Call us for immediate assistance"
    },
    {
      icon: ShoppingBag, 
      titleKey: "contact_email_title",
      detailsKey: "contact_email_details",
      descriptionKey: "contact_email_description",
      defaultTitle: "Email",
      defaultDetails: "info@sportsmansgetaway.com",
      defaultDescription: "Send us an email anytime"
    },
    {
      icon: MapPin,
      titleKey: "contact_location_title",
      detailsKey: "contact_location_details",
      descriptionKey: "contact_location_description",
      defaultTitle: "Location", 
      defaultDetails: "123 Wilderness Trail, Mountain View, CO 80424",
      defaultDescription: "Visit our lodge location"
    },
    {
      icon: Clock,
      titleKey: "contact_hours_title",
      detailsKey: "contact_hours_details",
      descriptionKey: "contact_hours_description",
      defaultTitle: "Office Hours",
      defaultDetails: "Mon-Sun: 8:00 AM - 8:00 PM",
      defaultDescription: "We're here when you need us"
    }
  ];

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
                          contentKey="contact_hero_image"
                          initialContent={content.contact_hero_image || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80"}
                          alt="Contact hero background"
                          className="w-full h-full object-cover"
                          onImageUpdate={handleImageUpdate}
                        />
                    </div>
                    {/* Right Side: Text */}
                    <div className="flex flex-col justify-center">
                        <EditableText
                          key={`contact_hero_title-${content.contact_hero_title}`}
                          contentKey="contact_hero_title"
                          initialContent={content.contact_hero_title}
                          as="h1"
                          className="text-4xl sm:text-5xl font-bold text-stone-800 mb-4"
                          onSave={handleSave}
                        />
                        <EditableText
                          key={`contact_hero_subtitle-${content.contact_hero_subtitle}`}
                          contentKey="contact_hero_subtitle"
                          initialContent={content.contact_hero_subtitle}
                          className="text-lg sm:text-xl text-stone-600"
                          onSave={handleSave}
                        />
                    </div>
                </div>
            </div>
        </section>
      ) : (
        // NORMAL VIEW LAYOUT
        <section className="relative py-20 md:py-32 bg-stone-100 overflow-hidden">
          <div className="absolute inset-0">
            <EditableImage
              contentKey="contact_hero_image"
              initialContent={content.contact_hero_image || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80"}
              alt="Lodge exterior"
              className="w-full h-full object-cover"
              onImageUpdate={handleImageUpdate}
            />
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
          <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <EditableText
              key={`contact_hero_title-${content.contact_hero_title}`}
              contentKey="contact_hero_title"
              initialContent={content.contact_hero_title}
              as="h1"
              className="text-4xl sm:text-5xl font-bold text-white mb-4 [text-shadow:_2px_2px_8px_rgba(0,0,0,0.7)]"
              onSave={handleSave}
            />
            <EditableText
              key={`contact_hero_subtitle-${content.contact_hero_subtitle}`}
              contentKey="contact_hero_subtitle"
              initialContent={content.contact_hero_subtitle}
              className="text-lg sm:text-xl text-green-100 [text-shadow:_1px_1px_4px_rgba(0,0,0,0.8)]"
              onSave={handleSave}
            />
          </div>
        </section>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Information */}
        <div className="mb-12">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mountain className="w-10 h-10 text-white" />
            </div>
            <EditableText
              key={`contact_section_title-${content.contact_section_title}`}
              contentKey="contact_section_title"
              initialContent={content.contact_section_title}
              as="h2"
              className="text-3xl font-bold text-stone-800 mb-4"
              onSave={handleSave}
            />
            <EditableText
              key={`contact_section_subtitle-${content.contact_section_subtitle}`}
              contentKey="contact_section_subtitle"
              initialContent={content.contact_section_subtitle}
              className="text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto"
              isTextarea={true}
              onSave={handleSave}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {contactInfo.map((info, index) => (
              <Card key={index} className="border-stone-200 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <info.icon className="w-8 h-8 text-white" />
                  </div>
                  <EditableText
                    key={`${info.titleKey}-${content[info.titleKey]}`}
                    contentKey={info.titleKey}
                    initialContent={content[info.titleKey] || info.defaultTitle}
                    as="h3"
                    className="text-xl font-semibold text-stone-800 mb-2"
                    onSave={handleSave}
                  />
                  {info.titleKey === "contact_phone_title" ? (
                    <a 
                      href={`tel:${(content[info.detailsKey] || info.defaultDetails).replace(/\D/g, '')}`}
                      className="text-lg text-stone-900 font-medium mb-2 block hover:text-green-700 transition-colors duration-200"
                    >
                      <EditableText
                        key={`${info.detailsKey}-${content[info.detailsKey]}`}
                        contentKey={info.detailsKey}
                        initialContent={content[info.detailsKey] || info.defaultDetails}
                        onSave={handleSave}
                      />
                    </a>
                  ) : (
                    <EditableText
                      key={`${info.detailsKey}-${content[info.detailsKey]}`}
                      contentKey={info.detailsKey}
                      initialContent={content[info.detailsKey] || info.defaultDetails}
                      className="text-lg text-stone-900 font-medium mb-2 block"
                      onSave={handleSave}
                    />
                  )}
                  <EditableText
                    key={`${info.descriptionKey}-${content[info.descriptionKey]}`}
                    contentKey={info.descriptionKey}
                    initialContent={content[info.descriptionKey] || info.defaultDescription}
                    className="text-sm text-stone-600"
                    onSave={handleSave}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Map Section */}
        <section>
          <Card className="border-stone-200 overflow-hidden">
            <CardContent className="p-0">
              <div className="h-64 bg-gradient-to-r from-green-100 to-amber-100 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <EditableText
                    key={`contact_map_title-${content.contact_map_title}`}
                    contentKey="contact_map_title"
                    initialContent={content.contact_map_title}
                    as="h3"
                    className="text-xl font-semibold text-stone-800 mb-2"
                    onSave={handleSave}
                  />
                  <EditableText
                    key={`contact_map_address-${content.contact_map_address}`}
                    contentKey="contact_map_address"
                    initialContent={content.contact_map_address}
                    className="text-stone-600"
                    onSave={handleSave}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
