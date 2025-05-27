import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { MapPin, User } from "lucide-react";

interface FormFieldsProps {
  description: string;
  author: string;
  locationName: string;
  onDescriptionChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
}

const FormFields = ({
  description,
  author,
  locationName,
  onDescriptionChange,
  onAuthorChange
}: FormFieldsProps) => {
  return (
    <>
      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description *</label>
        <Textarea
          placeholder="Describe this photo and its historical significance..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="min-h-[100px]"
          required
        />
      </div>

      {/* Author */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1">
          <User className="h-4 w-4" />
          Your Name *
        </label>
        <Input
          type="text"
          placeholder="Your name"
          value={author}
          onChange={(e) => onAuthorChange(e.target.value)}
          required
        />
      </div>

      {/* Location (read-only) */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          Location
        </label>
        <Input
          type="text"
          value={locationName}
          readOnly
          className="bg-gray-50"
        />
      </div>
    </>
  );
};

export default FormFields;