// Mock data for photo details
export const PhotoDetailData = {
    1: {
      id: 1,
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=2070", // Croatian old town
      year: "1955",
      description: "Main square during summer festival",
      detailedDescription: "This photo captures the vibrant atmosphere of the summer festival that took place in the main square. People from surrounding villages gathered to celebrate traditional customs and enjoy local food and music. The festival was an annual tradition that brought the community together.",
      author: "Marko Horvat",
      dateUploaded: "February 15, 2024",
      comments: [
        { id: 101, user: "Ana K.", avatar: "A", text: "I remember my grandmother telling stories about this festival! Thank you for sharing this piece of history.", date: "Mar 1, 2024" },
        { id: 102, user: "Petar M.", avatar: "P", text: "The architecture in the background hasn't changed much. Amazing to see how some things remain through time.", date: "Mar 3, 2024" },
        { id: 103, user: "Ivana L.", avatar: "I", text: "Is that the old fountain in the corner? It was replaced in the 70s if I remember correctly.", date: "Mar 10, 2024" }
      ],
      tags: [
        { id: 201, x: 25, y: 40, name: "Josip Matić", description: "Town mayor (1950-1960)" },
        { id: 202, x: 75, y: 60, name: "Traditional dance group", description: "Local folklore ensemble" }
      ]
    },
    2: {
      id: 2,
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2070", // European church/cathedral
      year: "1972",
      description: "Building of the new church",
      detailedDescription: "This photograph documents the construction of the new church that replaced the old wooden structure which had stood since the 18th century. The entire community contributed to the building effort, with many locals volunteering their time and skills.",
      author: "Ivan Novak",
      dateUploaded: "January 23, 2024",
      comments: [
        { id: 104, user: "Marija B.", avatar: "M", text: "My father was one of the volunteers who helped build this church. He would be so happy to see this photo preserved.", date: "Jan 25, 2024" },
        { id: 105, user: "Tomislav R.", avatar: "T", text: "I was just a child when this was happening, but I remember the excitement in the village.", date: "Feb 2, 2024" }
      ],
      tags: [
        { id: 203, x: 50, y: 30, name: "Father Stjepan", description: "Parish priest (1965-1980)" }
      ]
    },
    3: {
      id: 3,
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1932", // European market scene
      year: "1940",
      description: "Local farmers at the market",
      detailedDescription: "Weekly markets were the heart of social and economic life before modernization. This rare pre-war photograph shows local farmers selling their produce and livestock. Notice the traditional clothing many are wearing, which was still common everyday attire at this time.",
      author: "Ana Kovačić",
      dateUploaded: "March 5, 2024",
      comments: [
        { id: 106, user: "Branko K.", avatar: "B", text: "These markets were the backbone of rural economy. My grandfather often talked about riding his horse cart for hours to get to market day.", date: "Mar 7, 2024" },
        { id: 107, user: "Nada P.", avatar: "N", text: "The woman on the left is wearing traditional dress from our region! So wonderful to see this preserved.", date: "Mar 12, 2024" }
      ],
      tags: [
        { id: 204, x: 30, y: 45, name: "Franjo Babić", description: "Local cheese maker" },
        { id: 205, x: 65, y: 55, name: "Traditional marketplace", description: "Used until 1962" }
      ]
    },
    4: {
      id: 4,
      imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?q=80&w=1974", // Vintage tractor/farm
      year: "1963",
      description: "First tractor in the village",
      detailedDescription: "This photograph marks an important moment of modernization in our village's history - the arrival of the first tractor. Previously, all agricultural work had been done with horses or oxen and manual labor. The tractor belonged to the newly-formed agricultural cooperative.",
      author: "Josip Perić",
      dateUploaded: "December 10, 2023",
      comments: [
        { id: 108, user: "Stjepan V.", avatar: "S", text: "My uncle was the first one to drive this tractor! He received special training in Zagreb.", date: "Dec 15, 2023" },
        { id: 109, user: "Zoran M.", avatar: "Z", text: "This changed everything for our farmers. Within 5 years nearly every family had mechanized their work.", date: "Jan 5, 2024" },
        { id: 110, user: "Karlo J.", avatar: "K", text: "I believe this is a Ferguson model. They were popular in this period across Croatia.", date: "Feb 20, 2024" }
      ],
      tags: [
        { id: 206, x: 45, y: 50, name: "Ante Jurić", description: "First tractor operator" },
        { id: 207, x: 70, y: 40, name: "Ferguson TE-20 tractor", description: "Purchased with village cooperative funds" }
      ]
    }
};