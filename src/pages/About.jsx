
import React, { useState, useEffect } from "react";
import { PageContent } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import EditableImage from '../components/admin/EditableImage';
import { useEditMode } from '../components/admin/EditModeContext';
import {
  Mountain,
  Users,
  Award,
  Heart,
  Trees,
  Compass,
  Shield,
  Star,
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

export default function About() {
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
            about_hero_title: "Our Story",
            about_hero_subtitle: "Founded on a passion for the great outdoors, Sportsman's Getaway Lodge offers a premier destination for hunters and nature lovers.",
            about_story_title: "A Legacy of Adventure",
            about_story_paragraph_1: "Nestled in the heart of the Arkansas Delta, our lodge provides unparalleled access to some of the best hunting grounds in the country. But we're more than just a place to stay.",
            about_story_paragraph_2: "We're a community of enthusiasts who share a deep respect for nature and a love for outdoor traditions. Our mission is to provide a comfortable, memorable, and authentic experience for every guest, whether you're here for a weekend hunt or a family getaway.",
            about_story_paragraph_3: "From our family to yours, we invite you to make lasting memories with us.",
            about_values_title: "Our Core Values",
            about_values_subtitle: "These principles guide everything we do, from conservation to guest services.",
            about_gallery_title: "Guest Adventures",
            about_gallery_subtitle: "A glimpse into the unforgettable moments shared by our guests.",
            about_mission_title: "Our Mission",
            about_mission_description: "To provide an exceptional outdoor experience that fosters a deeper connection with nature, creates lasting memories, and upholds the traditions of sportsmanship and conservation."
        };

        setContent({ ...defaultContent, ...contentMap });
        setIsLoading(false);
    };

    useEffect(() => {
        loadPageData();
    }, []);

    const handleSave = async (key, value) => {
        const isTextarea = key.includes('paragraph') || key.includes('desc') || key.includes('subtitle') || key.includes('mission');
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

    const values = [
        {
            icon: Heart,
            titleKey: "about_value_1_title",
            descKey: "about_value_1_desc",
            defaultTitle: "Passion for Nature",
            defaultDesc: "We believe in the transformative power of nature and strive to share that magic with every guest."
        },
        {
            icon: Shield,
            titleKey: "about_value_2_title",
            descKey: "about_value_2_desc",
            defaultTitle: "Safety First",
            defaultDesc: "Your safety and comfort are our top priorities, with professionally maintained facilities and equipment."
        },
        {
            icon: Star,
            titleKey: "about_value_3_title",
            descKey: "about_value_3_desc",
            defaultTitle: "Exceptional Service",
            defaultDesc: "Our dedicated team ensures every detail of your stay exceeds expectations."
        },
        {
            icon: Trees,
            titleKey: "about_value_4_title",
            descKey: "about_value_4_desc",
            defaultTitle: "Conservation",
            defaultDesc: "We're committed to preserving the natural beauty that makes our location so special."
        }
    ];

    const stats = [
        { numberKey: "about_stat_1_number", labelKey: "about_stat_1_label", defaultNumber: "15+", defaultLabel: "Years Experience" },
        { numberKey: "about_stat_2_number", labelKey: "about_stat_2_label", defaultNumber: "500+", defaultLabel: "Happy Guests" },
        { numberKey: "about_stat_3_number", labelKey: "about_stat_3_label", defaultNumber: "12", defaultLabel: "Premium Lodges" },
        { numberKey: "about_stat_4_number", labelKey: "about_stat_4_label", defaultNumber: "5.0", defaultLabel: "Average Rating" }
    ];

    return (
        <div className="bg-white text-stone-800">
            {/* Hero Section */}
            <section className="relative py-20 md:py-32 bg-stone-100 overflow-hidden">
                <div className="absolute inset-0">
                    <EditableImage
                        contentKey="about_hero_image"
                        initialContent={content.about_hero_image || "https://images.unsplash.com/photo-1488330890404-6114b383424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80"}
                        alt="Arkansas landscape"
                        className="w-full h-full object-cover"
                        onImageUpdate={handleImageUpdate}
                    />
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>
                <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                    <EditableText
                        key={`about_hero_title-${content.about_hero_title}`}
                        contentKey="about_hero_title"
                        initialContent={content.about_hero_title}
                        as="h1"
                        className="text-4xl sm:text-5xl font-bold text-white mb-4 [text-shadow:_2px_2px_8px_rgba(0,0,0,0.7)]"
                        onSave={handleSave}
                    />
                    <EditableText
                        key={`about_hero_subtitle-${content.about_hero_subtitle}`}
                        contentKey="about_hero_subtitle"
                        initialContent={content.about_hero_subtitle}
                        className="text-lg sm:text-xl text-white max-w-3xl mx-auto leading-relaxed [text-shadow:_1px_1px_4px_rgba(0,0,0,0.8)]"
                        onSave={handleSave}
                    />
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Our Story Section */}
                <section className="mb-16">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <EditableText
                                key={`about_story_title-${content.about_story_title}`}
                                contentKey="about_story_title"
                                initialContent={content.about_story_title}
                                as="h2"
                                className="text-3xl font-bold text-stone-800 mb-6"
                                onSave={handleSave}
                            />
                            <div className="space-y-4 text-stone-700 leading-relaxed">
                                <EditableText
                                    key={`about_story_paragraph_1-${content.about_story_paragraph_1}`}
                                    contentKey="about_story_paragraph_1"
                                    initialContent={content.about_story_paragraph_1}
                                    isTextarea={true}
                                    className="block mb-4"
                                    onSave={handleSave}
                                />
                                <EditableText
                                    key={`about_story_paragraph_2-${content.about_story_paragraph_2}`}
                                    contentKey="about_story_paragraph_2"
                                    initialContent={content.about_story_paragraph_2}
                                    isTextarea={true}
                                    className="block mb-4"
                                    onSave={handleSave}
                                />
                                <EditableText
                                    key={`about_story_paragraph_3-${content.about_story_paragraph_3}`}
                                    contentKey="about_story_paragraph_3"
                                    initialContent={content.about_story_paragraph_3}
                                    isTextarea={true}
                                    className="block"
                                    onSave={handleSave}
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <EditableImage
                                contentKey="about_story_image"
                                initialContent={content.about_story_image || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80"}
                                alt="Lodge in nature"
                                className="rounded-2xl shadow-xl w-full h-[400px] object-cover"
                                onImageUpdate={handleImageUpdate}
                            />
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="mb-16">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <EditableText
                                    key={`${stat.numberKey}-${content[stat.numberKey]}`}
                                    contentKey={stat.numberKey}
                                    initialContent={content[stat.numberKey] || stat.defaultNumber}
                                    className="text-4xl font-bold text-green-700 mb-2 block"
                                    onSave={handleSave}
                                />
                                <EditableText
                                    key={`${stat.labelKey}-${content[stat.labelKey]}`}
                                    contentKey={stat.labelKey}
                                    initialContent={content[stat.labelKey] || stat.defaultLabel}
                                    className="text-stone-700 font-medium"
                                    onSave={handleSave}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Values Section */}
                <section className="mb-16">
                    <div className="text-center mb-12">
                        <EditableText
                            key={`about_values_title-${content.about_values_title}`}
                            contentKey="about_values_title"
                            initialContent={content.about_values_title}
                            as="h2"
                            className="text-3xl font-bold text-stone-800 mb-4"
                            onSave={handleSave}
                        />
                        <EditableText
                            key={`about_values_subtitle-${content.about_values_subtitle}`}
                            contentKey="about_values_subtitle"
                            initialContent={content.about_values_subtitle}
                            className="text-lg text-stone-700 max-w-3xl mx-auto leading-relaxed"
                            onSave={handleSave}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {values.map((value, index) => (
                            <Card key={index} className="border-stone-200 hover:shadow-lg transition-shadow duration-300">
                                <CardContent className="p-8">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <value.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <EditableText
                                                key={`${value.titleKey}-${content[value.titleKey]}`}
                                                contentKey={value.titleKey}
                                                initialContent={content[value.titleKey] || value.defaultTitle}
                                                as="h3"
                                                className="text-xl font-semibold text-stone-800 mb-3"
                                                onSave={handleSave}
                                            />
                                            <EditableText
                                                key={`${value.descKey}-${content[value.descKey]}`}
                                                contentKey={value.descKey}
                                                initialContent={content[value.descKey] || value.defaultDesc}
                                                className="text-stone-700 leading-relaxed"
                                                onSave={handleSave}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Guest Adventures Gallery Section */}
                <section className="mb-16">
                    <div className="text-center mb-12">
                        <EditableText
                            key={`about_gallery_title-${content.about_gallery_title}`}
                            contentKey="about_gallery_title"
                            initialContent={content.about_gallery_title}
                            as="h2"
                            className="text-3xl font-bold text-stone-800 mb-4"
                            onSave={handleSave}
                        />
                        <EditableText
                            key={`about_gallery_subtitle-${content.about_gallery_subtitle}`}
                            contentKey="about_gallery_subtitle"
                            initialContent={content.about_gallery_subtitle}
                            className="text-lg text-stone-700 max-w-3xl mx-auto leading-relaxed"
                            onSave={handleSave}
                        />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { key: "about_gallery_image_1", textKey: "about_gallery_text_1", alt: "Guest enjoying a hunt", defaultSrc: "https://images.unsplash.com/photo-1599551108298-535824c83454?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80", defaultText: "A Successful Hunt" },
                            { key: "about_gallery_image_2", textKey: "about_gallery_text_2", alt: "Guest with a fish", defaultSrc: "https://images.unsplash.com/photo-1623996397321-3a2205563934?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80", defaultText: "Memories on the Water" },
                            { key: "about_gallery_image_3", textKey: "about_gallery_text_3", alt: "View from the lodge deck", defaultSrc: "https://images.unsplash.com/photo-1606076210091-7243c7960a4c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80", defaultText: "Peaceful Mornings" },
                            { key: "about_gallery_image_4", textKey: "about_gallery_text_4", alt: "Family by the fire pit", defaultSrc: "https://images.unsplash.com/photo-1571890333458-00a49c9a9245?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80", defaultText: "Family Campfire Stories" },
                            { key: "about_gallery_image_5", textKey: "about_gallery_text_5", alt: "Morning sunrise over the lake", defaultSrc: "https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80", defaultText: "Golden Hour" },
                            { key: "about_gallery_image_6", textKey: "about_gallery_text_6", alt: "Ducks flying over the water", defaultSrc: "https://images.unsplash.com/photo-1564344426463-b88d30d1c834?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80", defaultText: "Nature's Majesty" }
                        ].map(image => (
                            <div key={image.key} className="relative aspect-square group overflow-hidden rounded-xl">
                                <EditableImage
                                    contentKey={image.key}
                                    initialContent={content[image.key] || image.defaultSrc}
                                    alt={image.alt}
                                    className="w-full h-full object-cover shadow-md group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300"
                                    onImageUpdate={handleImageUpdate}
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                                    <EditableText
                                        key={`${image.textKey}-${content[image.textKey]}`}
                                        contentKey={image.textKey}
                                        initialContent={content[image.textKey] || image.defaultText}
                                        className="text-white font-semibold text-base md:text-lg leading-tight [text-shadow:_1px_1px_3px_rgba(0,0,0,0.8)]"
                                        onSave={handleSave}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Mission Section */}
                <section>
                    <Card className="bg-gradient-to-r from-green-50 to-amber-50 border-green-200">
                        <CardContent className="p-12 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Compass className="w-10 h-10 text-white" />
                            </div>
                            <EditableText
                                key={`about_mission_title-${content.about_mission_title}`}
                                contentKey="about_mission_title"
                                initialContent={content.about_mission_title}
                                as="h2"
                                className="text-3xl font-bold text-stone-800 mb-6"
                                onSave={handleSave}
                            />
                            <EditableText
                                key={`about_mission_description-${content.about_mission_description}`}
                                contentKey="about_mission_description"
                                initialContent={content.about_mission_description}
                                className="text-lg text-stone-700 max-w-4xl mx-auto leading-relaxed"
                                isTextarea={true}
                                onSave={handleSave}
                            />
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
}
