
import React, { useState, useEffect } from "react";
import { Lodge, PageContent } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import EditableImage from '../components/admin/EditableImage';
import EditableLodge from '../components/admin/EditableLodge';
import AvailabilityCalendar from '../components/lodges/AvailabilityCalendar';
import { useEditMode } from '../components/admin/EditModeContext';
import { 
  Users, 
  Bed, 
  Bath, 
  MapPin,
  Star,
  Mountain,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil, // Added Pencil icon
  Save // Added Save icon
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
                        {/* Use a div with `dangerouslySetInnerHTML` for multi-line content, or `Component` for single line */}
                        {isTextarea ? (
                            <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: currentContent ? currentContent.replace(/\n/g, '<br>') : '&nbsp;' }} />
                        ) : (
                            <Component>{currentContent || '\u00A0'}</Component>
                        )}
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

    // Normal view: Render as the specified component
    return isTextarea ? (
        <div className={className} dangerouslySetInnerHTML={{ __html: currentContent ? currentContent.replace(/\n/g, '<br>') : '&nbsp;' }} />
    ) : (
        <Component className={className}>{currentContent || '\u00A0'}</Component>
    );
};

const ExistingLodgeCard = ({ lodge }) => {
  const [imageViewerOpen, setImageViewerOpen] = useState(false); 
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false); // New state for availability modal
  const [currentImageIndex, setCurrentImageIndex] = useState(0); 

  const openLocationInMaps = (location) => {
    const encodedLocation = encodeURIComponent(location);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    window.open(googleMapsUrl, '_blank');
  };

  const nextImage = () => {
    if (!lodge.images || lodge.images.length === 0) return;
    setCurrentImageIndex((prev) => 
      prev === lodge.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!lodge.images || lodge.images.length === 0) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? lodge.images.length - 1 : prev - 1
    );
  };

  const openImageViewer = (index) => {
    setCurrentImageIndex(index);
    setImageViewerOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-stone-200">
        <div className="relative h-64 overflow-hidden">
          <img
            src={lodge.images?.[0] || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3"}
            alt={lodge.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
            onClick={() => openImageViewer(0)}
          />
          {lodge.featured && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-amber-600 hover:bg-amber-700 text-white">
                Featured
              </Badge>
            </div>
          )}
          {lodge.images && lodge.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              +{lodge.images.length - 1} more
            </div>
          )}
        </div>
        
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold text-stone-800 group-hover:text-green-700 transition-colors duration-200">
              {lodge.name}
            </h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-700">
                ${lodge.price_per_person_per_night}
              </div>
              <div className="text-sm text-stone-500">per person/night</div>
            </div>
          </div>
          
          <button 
            onClick={() => openLocationInMaps(lodge.location)}
            className="flex items-center gap-2 text-stone-600 mb-4 hover:text-green-700 transition-colors duration-200 cursor-pointer group/location"
          >
            <MapPin className="w-4 h-4 group-hover/location:text-green-700" />
            <span className="text-sm underline decoration-transparent hover:decoration-green-700 transition-all duration-200">
              {lodge.location}
            </span>
          </button>

          <div className="flex items-center gap-4 text-sm text-stone-600 mb-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{lodge.max_occupancy} guests</span>
            </div>
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{lodge.bedrooms} beds</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{lodge.bathrooms} baths</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {lodge.amenities?.slice(0, 4).map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">
              {lodge.description}
            </p>
          </div>

          <Button 
            className="w-full bg-green-700 hover:bg-green-800 text-white"
            onClick={() => setDetailsOpen(true)} // Still opens details initially
          >
            Check Availability
          </Button>
        </CardContent>
      </Card>

      {/* Full Screen Image Viewer */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-7xl h-screen md:max-h-screen p-0 bg-black/90 border-none">
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={() => setImageViewerOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {lodge.images && lodge.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            <img
              src={lodge.images?.[currentImageIndex] || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3"}
              alt={`${lodge.name} - Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {lodge.images && lodge.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm z-10">
                {currentImageIndex + 1} / {lodge.images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lodge Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col p-0">
          <div className="overflow-y-auto px-4 md:px-6 py-4 md:py-6 flex-1">
            <div className="space-y-4 md:space-y-6">
              {/* Image Gallery */}
              <div className="relative h-96 rounded-lg overflow-hidden">
                <img
                  src={lodge.images?.[currentImageIndex] || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3"}
                  alt={lodge.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => {
                    setDetailsOpen(false);
                    setImageViewerOpen(true);
                  }}
                />
                {lodge.images && lodge.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {lodge.images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Lodge Info */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-3xl font-bold text-stone-800">{lodge.name}</h2>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-700">
                      ${lodge.price_per_person_per_night}
                    </div>
                    <div className="text-sm text-stone-500">per person/night</div>
                  </div>
                </div>

                <button 
                  onClick={() => openLocationInMaps(lodge.location)}
                  className="flex items-center gap-2 text-stone-600 mb-6 hover:text-green-700 transition-colors duration-200 cursor-pointer group/location"
                >
                  <MapPin className="w-5 h-5 group-hover/location:text-green-700" />
                  <span className="text-base underline decoration-transparent hover:decoration-green-700 transition-all duration-200">
                    {lodge.location}
                  </span>
                </button>

                <div className="flex items-center gap-6 text-base text-stone-700 mb-6 p-4 bg-stone-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-700" />
                    <span>{lodge.max_occupancy} guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-green-700" />
                    <span>{lodge.bedrooms} bedrooms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-green-700" />
                    <span>{lodge.bathrooms} bathrooms</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-stone-800 mb-3">Description</h3>
                  <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                    {lodge.description}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-stone-800 mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {lodge.amenities?.map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full bg-green-700 hover:bg-green-800 text-white py-6 text-lg"
                  onClick={() => {
                    setDetailsOpen(false); // Close details modal
                    setAvailabilityOpen(true); // Open availability modal
                  }}
                >
                  Check Availability
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Availability Calendar Modal */}
      <Dialog open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
        <DialogContent className="max-w-4xl h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-base md:text-lg">Availability for {lodge.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-4 md:px-6 pb-4 md:pb-6 flex-1">
            <AvailabilityCalendar lodgeId={lodge.id} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function Lodges() {
  const [lodges, setLodges] = useState([]);
  const [content, setContent] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { isEditMode } = useEditMode();

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    const [lodgeData, pageContents] = await Promise.all([
      Lodge.list('-created_date'),
      PageContent.list()
    ]);

    const contentMap = pageContents.reduce((acc, item) => {
        acc[item.content_key] = item.value;
        return acc;
    }, {});

    // Filter out the specific lodges we don't want to show
    const excludedLodgeNames = ['Pine Ridge Retreat', 'Wilderness Lodge', 'Creekside Cabin', 'Sportsman\'s Getaway Lodge'];
    const filteredLodges = lodgeData.filter(lodge => !excludedLodgeNames.includes(lodge.name));

    setLodges(filteredLodges);
    setContent(contentMap);
    setIsLoading(false);
  };

  const handleLodgeCreated = (newLodge) => {
    // This is handled by the EditableLodge component now, page refresh will show it
  };

  const handleImageUpdate = async () => {
    // Reload all page data after an image update to ensure all content is fresh
    await loadPageData();
  };
  
  const handleSave = async (key, value) => {
    // Determine content_type based on whether it's a textarea or not for initial creation
    const contentType = key.includes('subtitle') ? 'textarea' : 'text'; // Assuming subtitles are textareas

    // Check if the content key already exists
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

    // Update the local state directly to reflect changes immediately
    setContent(prev => ({
      ...prev,
      [key]: value
    }));
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading lodges...</p>
        </div>
      </div>
    );
  }

  const placeholderLodges = [
    { prefix: 'placeholder_lodge_1', name: 'Lodge 1' },
    { prefix: 'placeholder_lodge_2', name: 'Lodge 2' },
    { prefix: 'placeholder_lodge_3', name: 'Lodge 3' }
  ];

  // Check if placeholders have been converted to real lodges
  const savedLodgeIds = new Set([
    content['placeholder_lodge_1_lodge_id'],
    content['placeholder_lodge_2_lodge_id'], 
    content['placeholder_lodge_3_lodge_id']
  ].filter(Boolean));

  const realLodges = lodges.filter(lodge => !savedLodgeIds.has(lodge.id));
  const totalLodges = realLodges.length + placeholderLodges.length;

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
                            contentKey="lodges_hero_image"
                            initialContent={content.lodges_hero_image || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}
                            alt="Lodges hero background"
                            className="w-full h-full object-cover"
                            onImageUpdate={handleImageUpdate}
                        />
                    </div>
                    {/* Right Side: Text */}
                    <div className="flex flex-col justify-center">
                        <EditableText
                            key={`lodges_hero_title-${content.lodges_hero_title}`}
                            contentKey="lodges_hero_title"
                            initialContent={content.lodges_hero_title || "Our Premium Lodges"}
                            as="h1"
                            className="text-4xl sm:text-5xl font-bold text-stone-800 mb-4"
                            onSave={handleSave} // Updated prop
                        />
                        <EditableText
                            key={`lodges_hero_subtitle-${content.lodges_hero_subtitle}`}
                            contentKey="lodges_hero_subtitle"
                            initialContent={content.lodges_hero_subtitle || "Choose from our collection of comfortable and well-appointed lodges"}
                            className="text-lg sm:text-xl text-stone-600"
                            isTextarea={true}
                            onSave={handleSave} // Updated prop
                        />
                    </div>
                </div>
            </div>
        </section>
      ) : (
        // NORMAL VIEW LAYOUT
        <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center">
            <div className="absolute inset-0 z-0">
                <EditableImage
                    contentKey="lodges_hero_image"
                    initialContent={content.lodges_hero_image || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}
                    alt="Lodges hero background"
                    className="w-full h-full object-cover"
                    onImageUpdate={handleImageUpdate}
                />
            </div>
            
            <div className="relative z-20 text-center px-4 sm:px-6 lg:px-8 pointer-events-auto">
              <div>
                <EditableText
                  key={`lodges_hero_title-${content.lodges_hero_title}`}
                  contentKey="lodges_hero_title"
                  initialContent={content.lodges_hero_title || "Our Premium Lodges"}
                  as="h1"
                  className="text-4xl sm:text-5xl font-bold text-white mb-4 [text-shadow:_2px_2px_8px_rgba(0,0,0,0.7)]"
                  onSave={handleSave} // Updated prop
                />
                <EditableText
                  key={`lodges_hero_subtitle-${content.lodges_hero_subtitle}`}
                  contentKey="lodges_hero_subtitle"
                  initialContent={content.lodges_hero_subtitle || "Choose from our collection of comfortable and well-appointed lodges"}
                  className="text-lg sm:text-xl text-gray-200 [text-shadow:_1px_1px_4px_rgba(0,0,0,0.8)]" 
                  onSave={handleSave} // Updated prop
                />
              </div>
            </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Results Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">
            Available Lodges ({totalLodges})
          </h2>
          <p className="text-stone-600">
            Find the perfect lodge for your getaway
          </p>
        </div>

        {/* Lodge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Real lodges (excluding ones created from placeholders) */}
          {realLodges.map((lodge) => (
            <ExistingLodgeCard key={lodge.id} lodge={lodge} />
          ))}

          {/* Editable placeholder lodges */}
          {placeholderLodges.map((placeholder) => (
            <EditableLodge
              key={placeholder.prefix}
              contentPrefix={placeholder.prefix}
              onLodgeCreated={handleLodgeCreated}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
