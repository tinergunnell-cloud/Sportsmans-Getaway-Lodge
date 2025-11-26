
import React, { useState } from 'react';
import { useEditMode } from './EditModeContext';
import { Lodge, PageContent } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import AvailabilityCalendar from '../lodges/AvailabilityCalendar';
import { 
  Users, 
  Bed, 
  Bath, 
  MapPin,
  Mountain,
  Save,
  Upload,
  Loader2,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  Images,
  Plus,
  Trash2,
  CalendarDays,
  GripVertical
} from 'lucide-react';

export default function EditableLodge({ contentPrefix, onLodgeCreated }) {
    const { isEditMode } = useEditMode();
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false); // New state for details modal
    const [availabilityOpen, setAvailabilityOpen] = useState(false); // New state for availability modal
    const [hasExistingLodge, setHasExistingLodge] = useState(false);
    const [content, setContent] = useState({
        name: 'Your Lodge Name',
        location: 'Lodge Location', 
        price: 199, // This now represents price_per_person_per_night
        occupancy: 4,
        bedrooms: 2,
        bathrooms: 1,
        amenities: 'Fireplace, WiFi, Kitchen, Deck',
        description: 'Add your lodge description here. Describe the unique features, setting, and what makes this lodge special for your guests.',
        images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
        lodgeId: null
    });
    
    const fileInputRef = React.useRef(null);

    React.useEffect(() => {
        const loadContent = async () => {
            const pageContents = await PageContent.list();
            const contentMap = pageContents.reduce((acc, item) => {
                acc[item.content_key] = item.value;
                return acc;
            }, {});

            const savedImages = contentMap[`${contentPrefix}_images`] 
                ? JSON.parse(contentMap[`${contentPrefix}_images`])
                : ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'];

            const existingLodgeId = contentMap[`${contentPrefix}_lodge_id`];
            setHasExistingLodge(!!existingLodgeId);

            setContent({
                name: contentMap[`${contentPrefix}_name`] || 'Your Lodge Name',
                location: contentMap[`${contentPrefix}_location`] || 'Lodge Location',
                price: parseInt(contentMap[`${contentPrefix}_price`]?.replace('$', '')) || 199,
                occupancy: parseInt(contentMap[`${contentPrefix}_occupancy`]?.split(' ')[0]) || 4,
                bedrooms: parseInt(contentMap[`${contentPrefix}_bedrooms`]?.split(' ')[0]) || 2,
                bathrooms: parseInt(contentMap[`${contentPrefix}_bathrooms`]?.split(' ')[0]) || 1,
                amenities: contentMap[`${contentPrefix}_amenities`] || 'Fireplace, WiFi, Kitchen, Deck',
                description: contentMap[`${contentPrefix}_description`] || 'Add your lodge description here...',
                images: savedImages,
                lodgeId: existingLodgeId || null
            });
        };

        loadContent();
    }, [contentPrefix]);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { file_url } = await UploadFile({ file });
            setContent(prev => ({ 
                ...prev, 
                images: [...prev.images, file_url] 
            }));
        } catch (error) {
            console.error("Image upload failed:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (indexToRemove) => {
        if (content.images.length > 1) {
            const newImages = content.images.filter((_, index) => index !== indexToRemove);
            setContent(prev => ({ ...prev, images: newImages }));
            
            // Adjust current image index if necessary
            if (currentImageIndex >= newImages.length) {
                setCurrentImageIndex(newImages.length - 1);
            } else if (currentImageIndex >= indexToRemove) {
                setCurrentImageIndex(Math.max(0, currentImageIndex - 1));
            }
        }
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(content.images);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setContent(prev => ({ ...prev, images: items }));
        
        // Update current image index if the current image was moved or affected
        if (result.source.index === currentImageIndex) {
            setCurrentImageIndex(result.destination.index);
        } else if (result.source.index < currentImageIndex && result.destination.index >= currentImageIndex) {
            setCurrentImageIndex(currentImageIndex - 1);
        } else if (result.source.index > currentImageIndex && result.destination.index <= currentImageIndex) {
            setCurrentImageIndex(currentImageIndex + 1);
        }
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => 
            prev === content.images.length - 1 ? 0 : prev + 1
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => 
            prev === 0 ? content.images.length - 1 : prev - 1
        );
    };

    // New function to open image viewer
    const openImageViewer = (index) => {
        setCurrentImageIndex(index);
        setImageViewerOpen(true);
    };

    const openLocationInMaps = (location) => {
        const encodedLocation = encodeURIComponent(location);
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
        window.open(googleMapsUrl, '_blank');
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this lodge? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        try {
            // Get the lodge ID
            const pageContents = await PageContent.list();
            const contentMap = pageContents.reduce((acc, item) => {
                acc[item.content_key] = item.value;
                return acc;
            }, {});
            
            const existingLodgeId = contentMap[`${contentPrefix}_lodge_id`];
            
            // Delete the lodge from the database
            if (existingLodgeId) {
                await Lodge.delete(existingLodgeId);
            }
            
            // Clear all PageContent entries for this placeholder
            const keysToDelete = [
                `${contentPrefix}_name`,
                `${contentPrefix}_location`, 
                `${contentPrefix}_price`,
                `${contentPrefix}_occupancy`,
                `${contentPrefix}_bedrooms`,
                `${contentPrefix}_bathrooms`,
                `${contentPrefix}_amenities`,
                `${contentPrefix}_description`,
                `${contentPrefix}_images`,
                `${contentPrefix}_lodge_id`
            ];

            for (const key of keysToDelete) {
                const existing = await PageContent.filter({ content_key: key });
                if (existing.length > 0) {
                    await PageContent.delete(existing[0].id);
                }
            }

            // Reset to default state
            setContent({
                name: 'Your Lodge Name',
                location: 'Lodge Location',
                price: 199,
                occupancy: 4,
                bedrooms: 2,
                bathrooms: 1,
                amenities: 'Fireplace, WiFi, Kitchen, Deck',
                description: 'Add your lodge description here. Describe the unique features, setting, and what makes this lodge special for your guests.',
                images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
                lodgeId: null
            });
            
            setHasExistingLodge(false);
            setCurrentImageIndex(0);
            setIsEditing(false);
            
        } catch (error) {
            console.error("Error deleting lodge:", error);
            alert("Failed to delete lodge. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Check if a lodge has already been created for this placeholder
            const pageContents = await PageContent.list();
            const contentMap = pageContents.reduce((acc, item) => {
                acc[item.content_key] = item.value;
                return acc;
            }, {});
            
            const existingLodgeId = contentMap[`${contentPrefix}_lodge_id`];
            
            // Create the Lodge record
            const amenitiesArray = content.amenities.split(',').map(a => a.trim());
            
            let blockedDates = [];
            let bookedDates = [];
            if (existingLodgeId) {
                const existingLodge = await Lodge.get(existingLodgeId);
                blockedDates = existingLodge ? existingLodge.blocked_dates : [];
                bookedDates = existingLodge ? existingLodge.booked_dates : [];
            }

            const lodgeData = {
                name: content.name,
                description: content.description,
                location: content.location,
                images: content.images,
                amenities: amenitiesArray,
                max_occupancy: content.occupancy,
                bedrooms: content.bedrooms,
                bathrooms: content.bathrooms,
                price_per_person_per_night: content.price, // Changed field name
                is_available: true,
                featured: false,
                blocked_dates: blockedDates,
                booked_dates: bookedDates
            };

            let savedLodge;
            if (existingLodgeId) {
                // Update existing lodge
                await Lodge.update(existingLodgeId, lodgeData);
                savedLodge = { ...lodgeData, id: existingLodgeId };
            } else {
                // Create new lodge
                savedLodge = await Lodge.create(lodgeData);
            }
            
            // Update PageContent to mark as saved
            const contentUpdates = [
                { key: `${contentPrefix}_name`, value: content.name },
                { key: `${contentPrefix}_location`, value: content.location },
                { key: `${contentPrefix}_price`, value: `$${content.price}` },
                { key: `${contentPrefix}_occupancy`, value: `${content.occupancy} guests` },
                { key: `${contentPrefix}_bedrooms`, value: `${content.bedrooms}`}, // This was causing a bug, fixed it.
                { key: `${contentPrefix}_bathrooms`, value: `${content.bathrooms}` }, // This was causing a bug, fixed it.
                { key: `${contentPrefix}_amenities`, value: content.amenities },
                { key: `${contentPrefix}_description`, value: content.description },
                { key: `${contentPrefix}_images`, value: JSON.stringify(content.images) },
                { key: `${contentPrefix}_lodge_id`, value: savedLodge.id }
            ];

            for (const update of contentUpdates) {
                const existing = await PageContent.filter({ content_key: update.key });
                if (existing.length > 0) {
                    await PageContent.update(existing[0].id, { value: update.value });
                } else {
                    await PageContent.create({
                        content_key: update.key,
                        content_type: update.key.includes('description') ? 'textarea' : 'text',
                        value: update.value
                    });
                }
            }

            setIsEditing(false);
            setHasExistingLodge(true); 
            setContent(prev => ({ ...prev, lodgeId: savedLodge.id }));
            // Only call onLodgeCreated if it's a new lodge (not an update)
            if (!existingLodgeId && onLodgeCreated) {
                onLodgeCreated(savedLodge);
            }
        } catch (error) {
            console.error("Error saving lodge:", error);
            alert("Failed to save lodge. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isEditMode && isEditing) {
        return (
            <Card className="border-green-200 border-2 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-green-700">
                        <div className="flex items-center gap-3">
                            <Edit className="w-5 h-5" />
                            Edit Lodge Details
                        </div>
                        {hasExistingLodge && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                                disabled={isDeleting || isSaving}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Lodge
                                    </>
                                )}
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Lodge Name</label>
                            <Input
                                value={content.name}
                                onChange={(e) => setContent(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter lodge name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Location</label>
                            <Input
                                value={content.location}
                                onChange={(e) => setContent(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="Lodge location"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Price per Person/Night</label>
                            <Input
                                type="number"
                                value={content.price}
                                onChange={(e) => setContent(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                                placeholder="199"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Max Guests</label>
                            <Input
                                type="number"
                                value={content.occupancy}
                                onChange={(e) => setContent(prev => ({ ...prev, occupancy: parseInt(e.target.value) }))}
                                placeholder="4"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Bedrooms</label>
                            <Input
                                type="number"
                                value={content.bedrooms}
                                onChange={(e) => setContent(prev => ({ ...prev, bedrooms: parseInt(e.target.value) }))}
                                placeholder="2"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Bathrooms</label>
                            <Input
                                type="number"
                                value={content.bathrooms}
                                onChange={(e) => setContent(prev => ({ ...prev, bathrooms: parseInt(e.target.value) }))}
                                placeholder="1"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-700">Amenities (comma separated)</label>
                        <Input
                            value={content.amenities}
                            onChange={(e) => setContent(prev => ({ ...prev, amenities: e.target.value }))}
                            placeholder="Fireplace, WiFi, Kitchen, Deck"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-700">Description</label>
                        <Textarea
                            value={content.description}
                            onChange={(e) => setContent(prev => ({ ...prev, description: e.target.value }))}
                            rows={4}
                            placeholder="Describe your lodge..."
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-stone-700">Lodge Images ({content.images.length})</label>
                            <div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Image
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                        
                        <div className="bg-stone-50 p-3 rounded-lg">
                            <p className="text-xs text-stone-600 mb-3">
                                <GripVertical className="w-4 h-4 inline mr-1" />
                                Drag and drop images to reorder them. The first image will be the main display image.
                            </p>
                            
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="images" direction="horizontal">
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="flex gap-4 overflow-x-auto pb-2"
                                        >
                                            {content.images.map((image, index) => (
                                                <Draggable key={`${image}-${index}`} draggableId={`${image}-${index}`} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className={`relative group flex-shrink-0 ${
                                                                snapshot.isDragging ? 'opacity-50' : ''
                                                            }`}
                                                        >
                                                            <div
                                                                {...provided.dragHandleProps}
                                                                className="absolute top-1 left-1 z-10 bg-white/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                                            >
                                                                <GripVertical className="w-3 h-3 text-stone-600" />
                                                            </div>
                                                            
                                                            <img
                                                                src={image}
                                                                alt={`Lodge image ${index + 1}`}
                                                                className="w-24 h-24 object-cover rounded-lg border-2 border-transparent group-hover:border-green-200 transition-all"
                                                            />
                                                            
                                                            {content.images.length > 1 && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => removeImage(index)}
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                            
                                                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                                                                {index + 1}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="ghost"
                            onClick={() => setIsEditing(false)}
                            disabled={isSaving || isDeleting}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || isDeleting}
                            className="bg-green-700 hover:bg-green-800"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving Lodge...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Lodge
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className={`overflow-hidden group hover:shadow-xl transition-all duration-300 border-stone-200 ${!isEditMode && !hasExistingLodge ? 'opacity-50 border-dashed' : ''}`}>
                <div className="relative h-64 overflow-hidden bg-stone-100">
                    <img
                        src={content.images[currentImageIndex]}
                        alt="Lodge image"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => hasExistingLodge ? openImageViewer(currentImageIndex) : null}
                    />
                    
                    {/* Image Gallery Controls */}
                    {content.images.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={prevImage}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={nextImage}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            
                            {/* Image Counter */}
                            <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                {currentImageIndex + 1} / {content.images.length}
                            </div>
                        </>
                    )}

                    {/* View All Photos Button */}
                    {content.images.length > 1 && hasExistingLodge && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute bottom-2 left-2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => openImageViewer(currentImageIndex)} // Now opens the full-screen viewer
                        >
                            <Images className="w-4 h-4 mr-1" />
                            {content.images.length} Photos
                        </Button>
                    )}

                    {!isEditMode && !hasExistingLodge && (
                        <div className="absolute inset-0 flex items-center justify-center bg-stone-200/80">
                            <div className="text-center text-stone-600">
                                <Mountain className="w-12 h-12 mx-auto mb-2" />
                                <p className="font-medium">Admin: Enable Edit Mode to add lodge</p>
                            </div>
                        </div>
                    )}
                </div>
                
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-stone-800 group-hover:text-green-700 transition-colors duration-200">
                            {content.name}
                        </h3>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-green-700">
                                ${content.price}
                            </div>
                            <div className="text-sm text-stone-500">per person/night</div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => openLocationInMaps(content.location)}
                        className="flex items-center gap-2 text-stone-600 mb-4 hover:text-green-700 transition-colors duration-200 cursor-pointer group/location"
                        disabled={!hasExistingLodge}
                    >
                        <MapPin className="w-4 h-4 group-hover/location:text-green-700" />
                        <span className={`text-sm transition-all duration-200 ${hasExistingLodge ? 'underline decoration-transparent hover:decoration-green-700' : ''}`}>
                            {content.location}
                        </span>
                    </button>

                    <div className="flex items-center gap-4 text-sm text-stone-600 mb-4">
                        <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{content.occupancy} guests</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Bed className="w-4 h-4" />
                            <span>{content.bedrooms} beds</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Bath className="w-4 h-4" />
                            <span>{content.bathrooms} baths</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                            {content.amenities.split(',').slice(0, 4).map((amenity, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    {amenity.trim()}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">
                            {content.description}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {hasExistingLodge ? (
                            <>
                                <Dialog open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
                                    <DialogTrigger asChild>
                                        <Button 
                                            variant="outline"
                                            className="w-full"
                                        >
                                            <CalendarDays className="w-4 h-4 mr-2" />
                                            Check Availability
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl">
                                        <DialogHeader>
                                            <DialogTitle>Availability for {content.name}</DialogTitle>
                                        </DialogHeader>
                                        <AvailabilityCalendar lodgeId={content.lodgeId} />
                                    </DialogContent>
                                </Dialog>

                                <Button 
                                    className="w-full bg-green-700 hover:bg-green-800 text-white"
                                    onClick={() => isEditMode ? setIsEditing(true) : setDetailsOpen(true)}
                                >
                                    {isEditMode ? 'Edit Lodge' : 'View Details'}
                                </Button>
                            </>
                        ) : (
                            <Button 
                                className="w-full col-span-2 bg-green-700 hover:bg-green-800 text-white"
                                onClick={() => isEditMode ? setIsEditing(true) : null}
                                disabled={!isEditMode}
                            >
                                {isEditMode ? 'Add Lodge' : 'Configure Lodge'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Full Screen Image Viewer */}
            <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
                <DialogContent className="max-w-7xl max-h-screen p-0 bg-black/90 border-none">
                    <div className="relative w-full h-[90vh] flex items-center justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
                            onClick={() => setImageViewerOpen(false)}
                        >
                            <X className="w-6 h-6" />
                        </Button>

                        {content.images.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                                    onClick={prevImage}
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                                    onClick={nextImage}
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </Button>
                            </>
                        )}

                        <img
                            src={content.images[currentImageIndex]}
                            alt={`${content.name} - Image ${currentImageIndex + 1}`}
                            className="max-w-full max-h-full object-contain"
                        />

                        {content.images.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                                {currentImageIndex + 1} / {content.images.length}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Lodge Details Modal */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="space-y-6">
                        {/* Image Gallery */}
                        <div className="relative h-96 rounded-lg overflow-hidden">
                            <img
                                src={content.images[currentImageIndex]}
                                alt={content.name}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => {
                                    setDetailsOpen(false);
                                    setImageViewerOpen(true);
                                }}
                            />
                            {content.images.length > 1 && (
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
                                        {currentImageIndex + 1} / {content.images.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Lodge Info */}
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-3xl font-bold text-stone-800">{content.name}</h2>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-green-700">
                                        ${content.price}
                                    </div>
                                    <div className="text-sm text-stone-500">per person/night</div>
                                </div>
                            </div>

                            <button 
                                onClick={() => openLocationInMaps(content.location)}
                                className="flex items-center gap-2 text-stone-600 mb-6 hover:text-green-700 transition-colors duration-200 cursor-pointer group/location"
                            >
                                <MapPin className="w-5 h-5 text-green-700" />
                                <span className="text-base underline decoration-transparent hover:decoration-green-700 transition-all duration-200">
                                    {content.location}
                                </span>
                            </button>

                            <div className="flex items-center gap-6 text-base text-stone-700 mb-6 p-4 bg-stone-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-green-700" />
                                    <span>{content.occupancy} guests</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Bed className="w-5 h-5 text-green-700" />
                                    <span>{content.bedrooms} bedrooms</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Bath className="w-5 h-5 text-green-700" />
                                    <span>{content.bathrooms} bathrooms</span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-stone-800 mb-3">Description</h3>
                                <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                                    {content.description}
                                </p>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-stone-800 mb-3">Amenities</h3>
                                <div className="flex flex-wrap gap-2">
                                    {content.amenities.split(',').map((amenity, index) => (
                                        <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                                            {amenity.trim()}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {isEditMode && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                                    <p className="text-sm text-amber-800">
                                        <strong>Preview Mode:</strong> This is how guests will see this lodge. Click "Edit Lodge" to make changes.
                                    </p>
                                </div>
                            )}

                            <Button 
                                className="w-full bg-green-700 hover:bg-green-800 text-white py-6 text-lg"
                                onClick={() => {
                                    if (isEditMode) {
                                        setDetailsOpen(false);
                                        setIsEditing(true);
                                    } else {
                                        setDetailsOpen(false); // Close details modal
                                        setAvailabilityOpen(true); // Open availability modal
                                    }
                                }}
                            >
                                {isEditMode ? 'Edit Lodge' : 'Check Availability'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Availability Calendar Modal */}
            <Dialog open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
                <DialogContent className="max-w-4xl h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b flex-shrink-0">
                        <DialogTitle className="text-base md:text-lg">Availability for {content.name}</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto px-4 md:px-6 pb-4 md:pb-6 flex-1">
                        <AvailabilityCalendar lodgeId={content.lodgeId} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
