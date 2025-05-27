// src/components/SampleGallery.tsx
import { Clock, MapPin } from "lucide-react";

const photoData = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', // Dubrovnik old town
    location: 'Zagreb',
    year: '1950',
    description: 'Main Square during winter'
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=600&auto=format', // Split waterfront
    location: 'Split',
    year: '1935',
    description: 'Harbor with traditional boats'
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', // Croatian coastal city
    location: 'Dubrovnik',
    year: '1920',
    description: 'Old city walls panorama'
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', // Historic European town
    location: 'Rijeka',
    year: '1960',
    description: 'Carnival celebration'
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format', // River with bridge
    location: 'Osijek',
    year: '1940',
    description: 'River Drava bridge'
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1595846519845-68e298c2edd8?w=600&auto=format', // Lavender fields
    location: 'Hvar',
    year: '1955',
    description: 'Traditional lavender harvest'
  }
];


const SampleGallery = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {photoData.map((photo) => (
        <div key={photo.id} className="group relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="aspect-[4/3] overflow-hidden">
            <img 
              src={photo.url} 
              alt={`${photo.location}, ${photo.year}`} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80"></div>
          <div className="absolute bottom-0 left-0 p-4 w-full">
            <h3 className="text-white text-lg font-semibold">{photo.description}</h3>
            <div className="flex items-center mt-2 text-gray-200 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="mr-3">{photo.location}</span>
              <Clock className="h-4 w-4 mr-1" />
              <span>{photo.year}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SampleGallery;
