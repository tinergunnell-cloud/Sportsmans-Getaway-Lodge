
import React, { useState, useRef } from 'react';
import { useEditMode } from './EditModeContext';
import { PageContent } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Check } from 'lucide-react';

export default function EditableImage({ contentKey, initialContent, alt, className, onImageUpdate }) {
    const { isEditMode } = useEditMode();
    const [currentImage, setCurrentImage] = useState(initialContent);
    const [isUploading, setIsUploading] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const fileInputRef = useRef(null);

    // Always update when initialContent changes (from database)
    React.useEffect(() => {
        setCurrentImage(initialContent);
    }, [initialContent]);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setJustSaved(false);
        try {
            const { file_url } = await UploadFile({ file });
            
            // Update PageContent in database
            const existing = await PageContent.filter({ content_key: contentKey });
            if (existing.length > 0) {
                await PageContent.update(existing[0].id, { value: file_url });
            } else {
                await PageContent.create({
                    content_key: contentKey,
                    content_type: 'image_url',
                    value: file_url
                });
            }
            
            // Update the local state with the new image URL immediately
            setCurrentImage(file_url);

            // Notify parent component to update its state if needed
            if (onImageUpdate) {
                await onImageUpdate();
            }

            // Show success message
            setJustSaved(true);
            
            // Reset the success message after 3 seconds
            setTimeout(() => {
                setJustSaved(false);
            }, 3000);
        } catch (error) {
            console.error("Image upload failed:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    if (isEditMode) {
        return (
            <div className={`relative group editable-container ${className}`}>
                <img src={currentImage} alt={alt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <Button
                        variant="secondary"
                        onClick={() => fileInputRef.current.click()}
                        disabled={isUploading}
                        className={justSaved ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : justSaved ? (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Change Image
                            </>
                        )}
                    </Button>
                </div>
                {justSaved && (
                    <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Image saved successfully!</span>
                    </div>
                )}
            </div>
        );
    }

    return <img src={currentImage} alt={alt} className={className} />;
}
