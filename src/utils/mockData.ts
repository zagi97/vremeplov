// src/utils/mockData.ts
// Mock data for photos (in a real app, this would come from an API)
export const MOCK_PHOTOS = [
  {
    id: 1,
    imageUrl: "https://images.unsplash.com/photo-1555636222-cae831e670b3",
    year: "1955",
    description: "Main square during summer festival",
    author: "Marko Horvat",
    location: "Zagreb",
    comments: [
      {
        id: 1,
        author: "Marija Horvat",
        text: "My grandfather is in this photo! He's the one standing near the church.",
        date: "2 days ago"
      },
      {
        id: 2,
        author: "Ivan Petrović",
        text: "I remember when this place looked exactly like this. Amazing to see how things have changed.",
        date: "1 week ago"
      }
    ],
    taggedPersons: [
      { id: 1, name: "Ana Perić", x: 35, y: 45 },
      { id: 2, name: "Tomislav Kovač", x: 65, y: 40 }
    ]
  },
  {
    id: 2,
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    year: "1972",
    description: "Building of the new church",
    author: "Ivan Novak",
    location: "Split",
    comments: [
      {
        id: 1,
        author: "Ana Kovač",
        text: "This brings back so many memories of visiting my grandparents during summer breaks.",
        date: "2 weeks ago"
      }
    ],
    taggedPersons: []
  },
  {
    id: 3,
    imageUrl: "https://images.unsplash.com/photo-1595846519845-68e298c2edd8",
    year: "1940",
    description: "Local farmers at the market",
    author: "Ana Kovačić",
    location: "Osijek",
    comments: [],
    taggedPersons: []
  },
  {
    id: 4,
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    year: "1963",
    description: "First tractor in the village",
    author: "Josip Perić",
    location: "Rijeka",
    comments: [],
    taggedPersons: []
  }
];