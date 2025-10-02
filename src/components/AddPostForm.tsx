import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ImageUpload from "./ImageUpload";
import DatePicker from "./DatePicker";
import FormFields from "./FormFields";
import { useLanguage, translateWithParams } from "../contexts/LanguageContext";

interface AddPostFormProps {
  locationName: string;
  onClose: () => void;
  onSubmit: (postData: any) => void;
}

const AddPostForm = ({ locationName, onClose, onSubmit }: AddPostFormProps) => {
    const { t } = useLanguage();
  const [formData, setFormData] = useState({
    description: '',
    date: undefined as Date | undefined,
    author: '',
    imageFile: null as File | null,
    imagePreview: ''
  });
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.date || !formData.author || !formData.imageFile) {
      toast.error(t('errors.fillAllFields'));
      return;
    }

    // Create mock data for now (in real app, this would upload to backend)
    const newPost = {
      id: Date.now(),
      description: formData.description,
      year: format(formData.date, "yyyy"),
      author: formData.author,
      location: locationName,
      imageUrl: formData.imagePreview,
      comments: [],
      taggedPersons: []
    };

    onSubmit(newPost);
    toast.success("Post added successfully!");
    onClose();
  };

  const removeImage = () => {
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: ''
    }));
  };
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Add New Memory to {locationName}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
         <ImageUpload
            imagePreview={formData.imagePreview}
            onImageChange={handleImageChange}
            onRemoveImage={removeImage}
          />

          <FormFields
            description={formData.description}
            author={formData.author}
            locationName={locationName}
            onDescriptionChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            onAuthorChange={(value) => setFormData(prev => ({ ...prev, author: value }))}
          />

          <DatePicker
            selectedDate={formData.date}
            onDateSelect={(date) => setFormData(prev => ({ ...prev, date }))}
          />

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Share Memory
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddPostForm;

