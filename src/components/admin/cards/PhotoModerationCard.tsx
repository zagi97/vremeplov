import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Calendar, User, Eye, Heart, Loader2 } from "lucide-react";
import { Photo, photoService } from "../../services/firebaseService";
import { toast } from "sonner";

interface PhotoModerationCardProps {
  photo: Photo;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onEdit: (updates: Partial<Photo>) => void;
}

const REJECT_OPTIONS = [
  "Niska kvaliteta",
  "Neadekvatan sadržaj",
  "Nije povijesno relevantno",
];

export default function PhotoModerationCard({
  photo,
  onApprove,
  onReject,
  onEdit,
}: PhotoModerationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: photo.title || "",
    description: photo.description || "",
    imageUrl: photo.imageUrl || "",
  });

  const [uploading, setUploading] = useState(false);

  const [rejectReasons, setRejectReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState("");

  const toggleReason = (reason: string) => {
    setRejectReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const cleanupText = (str: string) => str.trim().replace(/\s+/g, " ");

  const hasChanges =
    cleanupText(editData.title) !== cleanupText(photo.title || "") ||
    cleanupText(editData.description) !== cleanupText(photo.description || "") ||
    editData.imageUrl !== (photo.imageUrl || "");

  const canSave =
    editData.title.trim().length > 0 &&
    editData.title.length <= 100 &&
    editData.description.length <= 500 &&
    hasChanges &&
    !uploading;

  const handleSave = () => {
    if (!canSave) return;

    onEdit({
      title: cleanupText(editData.title),
      description: cleanupText(editData.description),
      imageUrl: editData.imageUrl,
    });

    toast.success("Promjene spremljene.");
    setIsEditing(false);
  };

  const hasRejectReason = rejectReasons.length > 0 || customReason.trim().length > 0;
  const finalRejectReason = [...rejectReasons, customReason.trim()]
    .filter(r => r.length > 0)
    .join(", ");

  const handleReject = () => {
    if (!hasRejectReason) {
      toast.error("Molim odaberi ili upiši barem jedan razlog odbijanja.");
      return;
    }
    onReject(finalRejectReason);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await photoService.uploadPhotoFile(file);
      setEditData(prev => ({ ...prev, imageUrl: url }));
      toast.success("Slika uspješno uploadana!");
    } catch {
      toast.error("Greška tijekom uploadanja slike.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full rounded-2xl shadow-md border border-gray-200 bg-white">
      <CardContent className="p-4 space-y-4">
        
        {/* IMAGE */}
        <img
          src={editData.imageUrl}
          alt={photo.title}
          className="w-full h-64 object-cover rounded-md"
        />

        {/* EDIT MODE IMAGE UPLOAD */}
        {isEditing && (
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="text-sm"
            />

            {uploading && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <Loader2 className="animate-spin" size={16} />
                Uploadanje slike...
              </div>
            )}
          </div>
        )}

        {/* INFO */}
        {!isEditing ? (
          <>
            <h2 className="text-xl font-bold">{photo.title}</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{photo.description}</p>
          </>
        ) : (
          <>
            <input
              className="w-full border p-2 rounded-md"
              value={editData.title}
              maxLength={100}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              placeholder="Naslov"
            />

            <textarea
              className="w-full border p-2 rounded-md"
              value={editData.description}
              maxLength={500}
              rows={4}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Opis"
            />
          </>
        )}

        {/* META */}
        <div className="flex items-center justify-between text-gray-600 text-sm">
          <span className="flex items-center gap-1">
            <User size={16} /> {photo.createdBy}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={16} /> {new Date(photo.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Reject block */}
        {!isEditing && (
          <div className="space-y-2 border-t pt-3">
            <p className="font-medium">Razlog odbijanja:</p>

            {REJECT_OPTIONS.map((reason) => (
              <label key={reason} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={rejectReasons.includes(reason)}
                  onChange={() => toggleReason(reason)}
                />
                {reason}
              </label>
            ))}

            <textarea
              className="w-full border rounded-md p-2 text-sm"
              placeholder="Dodatni razlog (opcionalno)"
              maxLength={250}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          </div>
        )}

        {/* BUTTONS */}
        <div className="flex justify-between pt-4">
          {!isEditing ? (
            <>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white font-medium"
                onClick={onApprove}
              >
                Odobri
              </button>

              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-medium disabled:bg-red-300"
                disabled={!hasRejectReason}
                onClick={handleReject}
              >
                Odbij
              </button>

              <button
                className="px-4 py-2 rounded bg-blue-600 text-white font-medium"
                onClick={() => setIsEditing(true)}
              >
                Uredi
              </button>
            </>
          ) : (
            <>
              <button
                className="px-4 py-2 rounded bg-gray-400 text-white"
                onClick={() => setIsEditing(false)}
              >
                Odustani
              </button>

              <button
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:bg-blue-300"
                onClick={handleSave}
                disabled={!canSave}
              >
                Spremi
              </button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
