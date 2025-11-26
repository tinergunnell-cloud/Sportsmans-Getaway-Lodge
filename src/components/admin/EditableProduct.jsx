
import React, { useState, useEffect, useRef } from 'react';
import { useEditMode } from './EditModeContext';
import { Product, PageContent } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  ShoppingBag,
  Save,
  Upload,
  Loader2,
  Edit,
  X,
  ImageIcon,
  Plus,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Images
} from 'lucide-react';

export default function EditableProduct({ contentPrefix, onProductCreated }) {
    const { isEditMode } = useEditMode();
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [content, setContent] = useState({
        name: 'Your Product Name',
        price: 25,
        category: 'apparel',
        description: 'Add a great description for your product here.',
        images: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
        inventory: 10
    });
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        const loadContent = async () => {
            const pageContents = await PageContent.list();
            const contentMap = pageContents.reduce((acc, item) => {
                acc[item.content_key] = item.value;
                return acc;
            }, {});

            const savedImages = contentMap[`${contentPrefix}_images`]
                ? JSON.parse(contentMap[`${contentPrefix}_images`])
                : ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'];

            setContent({
                name: contentMap[`${contentPrefix}_name`] || 'Your Product Name',
                price: parseInt(contentMap[`${contentPrefix}_price`]?.replace('$', '')) || 25,
                category: contentMap[`${contentPrefix}_category`] || 'apparel',
                description: contentMap[`${contentPrefix}_description`] || 'Add a great description...',
                images: savedImages,
                inventory: parseInt(contentMap[`${contentPrefix}_inventory`]) || 10,
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
            setContent(prev => ({ ...prev, images: [...prev.images, file_url] }));
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
            if (currentImageIndex >= newImages.length) {
                setCurrentImageIndex(newImages.length - 1);
            }
        }
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(content.images);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setContent(prev => ({ ...prev, images: items }));
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

    const openImageViewer = (index) => {
        setCurrentImageIndex(index);
        setImageViewerOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const productData = {
                name: content.name,
                description: content.description,
                images: content.images,
                price: content.price,
                category: content.category,
                inventory: content.inventory,
                active: true,
                featured: false
            };
            const newProduct = await Product.create(productData);
            
            const contentUpdates = [
                { key: `${contentPrefix}_name`, value: content.name },
                { key: `${contentPrefix}_price`, value: `$${content.price}` },
                { key: `${contentPrefix}_category`, value: content.category },
                { key: `${contentPrefix}_description`, value: content.description },
                { key: `${contentPrefix}_images`, value: JSON.stringify(content.images) },
                { key: `${contentPrefix}_inventory`, value: String(content.inventory) },
                { key: `${contentPrefix}_product_id`, value: newProduct.id }
            ];

            for (const update of contentUpdates) {
                const existing = await PageContent.filter({ content_key: update.key });
                if (existing.length > 0) {
                    await PageContent.update(existing[0].id, { value: update.value });
                } else {
                    await PageContent.create({
                        content_key: update.key,
                        content_type: 'text',
                        value: update.value
                    });
                }
            }

            setIsEditing(false);
            onProductCreated?.(newProduct);
        } catch (error) {
            console.error("Error saving product:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const productCategories = ["apparel", "gear", "accessories", "food", "books"];

    if (isEditMode && isEditing) {
        return (
            <Card className="border-green-200 border-2 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-green-700 flex items-center gap-3">
                        <Edit className="w-5 h-5" />
                        Edit Product
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input value={content.name} onChange={(e) => setContent(prev => ({ ...prev, name: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Price</label>
                            <Input type="number" value={content.price} onChange={(e) => setContent(prev => ({ ...prev, price: parseFloat(e.target.value) }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <Select value={content.category} onValueChange={(value) => setContent(prev => ({...prev, category: value}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {productCategories.map(cat => <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea value={content.description} onChange={(e) => setContent(prev => ({ ...prev, description: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Inventory</label>
                        <Input type="number" value={content.inventory} onChange={(e) => setContent(prev => ({ ...prev, inventory: parseInt(e.target.value) }))} />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Product Images ({content.images.length})</label>
                            <div>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*"/>
                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {isUploading ? 'Uploading...' : 'Add Image'}
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
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="flex gap-4 overflow-x-auto pb-2">
                                            {content.images.map((image, index) => (
                                                <Draggable key={`${image}-${index}`} draggableId={`${image}-${index}`} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div ref={provided.innerRef} {...provided.draggableProps} className={`relative group flex-shrink-0 ${snapshot.isDragging ? 'opacity-50' : ''}`}>
                                                            <div {...provided.dragHandleProps} className="absolute top-1 left-1 z-10 bg-white/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                                                <GripVertical className="w-3 h-3 text-stone-600" />
                                                            </div>
                                                            <img src={image} alt={`Product image ${index + 1}`} className="w-24 h-24 object-cover rounded-lg border-2 border-transparent group-hover:border-green-200 transition-all" />
                                                            {content.images.length > 1 && (
                                                                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(index)}>
                                                                    <X className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">{index + 1}</div>
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
                        <Button variant="ghost" onClick={() => setIsEditing(false)}><X className="w-4 h-4 mr-2" />Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-green-700 hover:bg-green-800">
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            {isSaving ? 'Saving...' : 'Save Product'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className={`overflow-hidden group transition-all duration-300 border-stone-200 ${!isEditMode && content.name === 'Your Product Name' ? 'opacity-50 border-dashed' : 'hover:shadow-lg'}`}>
                <div className="relative h-48 overflow-hidden bg-stone-100 flex items-center justify-center">
                    <img 
                        src={content.images[currentImageIndex]} 
                        alt={content.name} 
                        className="w-full h-full object-contain cursor-pointer p-2"
                        onClick={() => content.name === 'Your Product Name' && !isEditMode ? null : openImageViewer(currentImageIndex)}
                    />
                    {!isEditMode && content.name === 'Your Product Name' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-stone-200/80">
                            <div className="text-center text-stone-600 p-4">
                                <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                                <p className="font-medium text-sm">Product Not Yet Added</p>
                            </div>
                        </div>
                    )}
                    {content.images.length > 1 && content.name !== 'Your Product Name' && (
                        <>
                            <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                {currentImageIndex + 1} / {content.images.length}
                            </div>
                            <Button variant="ghost" size="sm" className="absolute bottom-2 left-2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); openImageViewer(currentImageIndex); }}>
                                <Images className="w-4 h-4 mr-1" />
                                {content.images.length} Photos
                            </Button>
                        </>
                    )}
                </div>
                <CardContent className="p-4">
                    <h3 className="font-semibold text-stone-800 mb-2 truncate">{content.name}</h3>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold text-green-700">${content.price}</span>
                        <Badge variant="secondary" className="capitalize">{content.category}</Badge>
                    </div>
                    {isEditMode ? (
                        <Button 
                            className="w-full bg-green-700 hover:bg-green-800"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Product
                        </Button>
                    ) : content.name === 'Your Product Name' ? (
                        <Button 
                            className="w-full"
                            disabled
                            variant="outline"
                        >
                            Not Available
                        </Button>
                    ) : (
                        <Button 
                            className="w-full bg-green-700 hover:bg-green-800"
                            onClick={() => openImageViewer(currentImageIndex)}
                        >
                            View Details
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Full Screen Image Viewer */}
            <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
                <DialogContent className="max-w-[95vw] max-h-screen p-0 bg-black/95 border-none overflow-hidden">
                    <div className="relative w-full h-screen flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
                        <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 z-10" onClick={() => setImageViewerOpen(false)}>
                            <X className="w-6 h-6" />
                        </Button>

                        {content.images.length > 1 && (
                            <>
                                <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10" onClick={prevImage}>
                                    <ChevronLeft className="w-8 h-8" />
                                </Button>
                                <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10" onClick={nextImage}>
                                    <ChevronRight className="w-8 h-8" />
                                </Button>
                            </>
                        )}

                        <div className="flex flex-col items-center gap-6 max-w-5xl w-full">
                            <img 
                                src={content.images[currentImageIndex]} 
                                alt={`${content.name} - Image ${currentImageIndex + 1}`} 
                                className="max-w-full max-h-[60vh] w-auto h-auto object-contain" 
                            />

                            {content.images.length > 1 && (
                                <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                                    {currentImageIndex + 1} / {content.images.length}
                                </div>
                            )}

                            {/* Product Details Below Image */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 w-full max-w-3xl text-white">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-2xl font-bold">{content.name}</h3>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-green-400">${content.price}</div>
                                        <Badge variant="secondary" className="mt-1 capitalize">{content.category}</Badge>
                                    </div>
                                </div>
                                
                                <p className="text-gray-200 leading-relaxed whitespace-pre-line">
                                    {content.description}
                                </p>

                                {content.inventory > 0 && (
                                    <div className="mt-4 text-sm text-gray-300">
                                        <span className="font-medium">In Stock:</span> {content.inventory} available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
