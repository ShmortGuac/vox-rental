// Sample records, used only when Supabase isn't connected (see README).
// Once Supabase is set up, edit records in the Supabase dashboard instead.
// Fields match the `records` table in supabase/schema.sql.
//
// setlist: a list of sides — [{ side: 'A', tracks: [...] }, ...] — any number of sides,
// or just a plain list of tracks when there are no sides.

export const vinyls = [
  {
    id: 1, title: 'Kind of Blue', artist: 'Miles Davis', year: 1959, genres: ['Jazz'],
    format: 'LP', status: 'Available', cover_url: null,
    setlist: [
      { side: 'A', tracks: [
        'So What',
        'Freddie Freeloader',
        'Blue in Green',
      ] },
      { side: 'B', tracks: [
        'All Blues',
        'Flamenco Sketches',
      ] },
    ],
    description: 'The best-selling jazz record of all time. Modal, cool and endlessly replayable.',
  },
  {
    id: 2, title: 'Rumours', artist: 'Fleetwood Mac', year: 1977, genres: ['Rock'],
    format: 'LP', status: 'Available', cover_url: null,
    setlist: [
      { side: 'A', tracks: [
        'Second Hand News',
        'Dreams',
        'Never Going Back Again',
        "Don't Stop",
        'Go Your Own Way',
        'Songbird',
      ] },
      { side: 'B', tracks: [
        'The Chain',
        'You Make Loving Fun',
        "I Don't Want to Know",
        'Oh Daddy',
        'Gold Dust Woman',
      ] },
    ],
    description: 'Heartbreak, harmonies and some of the best-produced rock ever pressed.',
  },
  {
    id: 3, title: 'Blue', artist: 'Joni Mitchell', year: 1971, genres: ['Folk'],
    format: 'LP', status: 'In Rent', cover_url: null,
    setlist: [
      { side: 'A', tracks: [
        'All I Want',
        'My Old Man',
        'Little Green',
        'Carey',
        'Blue',
      ] },
      { side: 'B', tracks: [
        'California',
        'This Flight Tonight',
        'River',
        'A Case of You',
        'The Last Time I Saw Richard',
      ] },
    ],
    description: 'Confessional songwriting at its most direct. Best heard late at night.',
  },
  {
    id: 4, title: 'Discovery', artist: 'Daft Punk', year: 2001, genres: ['Electronic', 'House'],
    format: '2xLP', status: 'Available', cover_url: null,
    setlist: null,
    description: 'Glittering French house. Side A alone is worth the rental.',
  },
  {
    id: 5, title: "What's Going On", artist: 'Marvin Gaye', year: 1971, genres: ['Soul'],
    format: 'LP', status: 'Available', cover_url: null,
    setlist: [
      { side: 'A', tracks: [
        "What's Going On",
        "What's Happening Brother",
        "Flyin' High (In the Friendly Sky)",
        'Save the Children',
        'God Is Love',
        'Mercy Mercy Me (The Ecology)',
      ] },
      { side: 'B', tracks: [
        'Right On',
        'Wholy Holy',
        'Inner City Blues (Make Me Wanna Holler)',
      ] },
    ],
    description: 'A seamless, socially conscious soul suite that still sounds urgent.',
  },
  {
    id: 6, title: 'Random Access Memories', artist: 'Daft Punk', year: 2013, genres: ['Electronic'],
    format: '2xLP', status: 'Available', cover_url: null,
    setlist: null,
    description: 'Recorded with live session players. Made for a good turntable.',
  },
  {
    id: 7, title: 'A Love Supreme', artist: 'John Coltrane', year: 1965, genres: ['Jazz'],
    format: 'LP', status: 'In Rent', cover_url: null,
    setlist: [
      { side: 'A', tracks: [
        'Part I – Acknowledgement',
        'Part II – Resolution',
      ] },
      { side: 'B', tracks: [
        'Part III – Pursuance',
        'Part IV – Psalm',
      ] },
    ],
    description: 'A four-part spiritual statement. Play it front to back.',
  },
  {
    id: 8, title: 'Abbey Road', artist: 'The Beatles', year: 1969, genres: ['Rock'],
    format: 'LP', status: 'Available', cover_url: null,
    setlist: [
      { side: 'A', tracks: [
        'Come Together',
        'Something',
        "Maxwell's Silver Hammer",
        'Oh! Darling',
        "Octopus's Garden",
        "I Want You (She's So Heavy)",
      ] },
      { side: 'B', tracks: [
        'Here Comes the Sun',
        'Because',
        'You Never Give Me Your Money',
        'Sun King',
        'Mean Mr. Mustard',
        'Polythene Pam',
        'She Came In Through the Bathroom Window',
        'Golden Slumbers',
        'Carry That Weight',
        'The End',
        'Her Majesty',
      ] },
    ],
    description: 'The side B medley is one of the great listening experiences on wax.',
  },
  {
    id: 9, title: 'Channel Orange', artist: 'Frank Ocean', year: 2012, genres: ['R&B'],
    format: '2xLP', status: 'Available', cover_url: null,
    setlist: null,
    description: 'Lush, cinematic R&B. Pyramids alone runs nearly ten minutes.',
  },
  {
    id: 10, title: 'Songs in the Key of Life', artist: 'Stevie Wonder', year: 1976, genres: ['Soul'],
    format: '2xLP', status: 'Available', cover_url: null,
    setlist: [
      { side: '1', tracks: [
        "Love's in Need of Love Today",
        'Have a Talk with God',
        'Village Ghetto Land',
        'Contusion',
        'Sir Duke',
      ] },
      { side: '2', tracks: [
        'I Wish',
        'Knocks Me Off My Feet',
        'Pastime Paradise',
        'Summer Soft',
        'Ordinary Pain',
      ] },
      { side: '3', tracks: [
        "Isn't She Lovely",
        'Joy Inside My Tears',
        'Black Man',
      ] },
      { side: '4', tracks: [
        'Ngiculela – Es Una Historia – I Am Singing',
        "If It's Magic",
        'As',
        'Another Star',
      ] },
    ],
    description: 'Stevie at the peak of his powers, across four sides.',
  },
  {
    id: 11, title: 'Buena Vista Social Club', artist: 'Buena Vista Social Club', year: 1997, genres: ['World'],
    format: '2xLP', status: 'Available', cover_url: null,
    setlist: null,
    description: 'Warm, live-sounding Cuban son. Perfect for a Sunday afternoon.',
  },
  {
    id: 12, title: 'In Rainbows', artist: 'Radiohead', year: 2007, genres: ['Rock'],
    format: 'LP', status: 'Available', cover_url: null,
    setlist: [
      '15 Step',
      'Bodysnatchers',
      'Nude',
      'Weird Fishes/Arpeggi',
      'All I Need',
      'Faust Arp',
      'Reckoner',
      'House of Cards',
      'Jigsaw Falling into Place',
      'Videotape',
    ],
    description: 'Their warmest record, and it sounds great on vinyl.',
  },
  {
    id: 13, title: 'Pink Moon', artist: 'Nick Drake', year: 1972, genres: ['Folk'],
    format: 'LP', status: 'Available', cover_url: null,
    setlist: [
      { side: 'A', tracks: [
        'Pink Moon',
        'Place to Be',
        'Road',
        'Which Will',
        'Horn',
        'Things Behind the Sun',
      ] },
      { side: 'B', tracks: [
        'Know',
        'Parasite',
        'Free Ride',
        'Harvest Breed',
        'From the Morning',
      ] },
    ],
    description: 'Just voice, guitar and a bit of piano. Twenty-eight quiet minutes.',
  },
  {
    id: 14, title: 'Selected Ambient Works 85–92', artist: 'Aphex Twin', year: 1992, genres: ['Electronic'],
    format: '2xLP', status: 'In Rent', cover_url: null,
    setlist: null,
    description: 'Foundational ambient techno. Hazy, melodic and strangely comforting.',
  },
  {
    id: 15, title: 'Getz/Gilberto', artist: 'Stan Getz & João Gilberto', year: 1964, genres: ['Jazz'],
    format: 'LP', status: 'Available', cover_url: null,
    setlist: [
      { side: 'A', tracks: [
        'The Girl from Ipanema',
        'Doralice',
        'Para Machucar Meu Coração',
        'Desafinado',
      ] },
      { side: 'B', tracks: [
        'Corcovado',
        'Só Danço Samba',
        'O Grande Amor',
        'Vivo Sonhando',
      ] },
    ],
    description: 'The record that brought bossa nova to the world.',
  },
  {
    id: 16, title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar', year: 2015, genres: ['Hip-Hop', 'Jazz'],
    format: '2xLP', status: 'Available', cover_url: null,
    setlist: null,
    description: 'Jazz, funk and spoken word woven into a dense, rewarding album.',
  },
  {
    id: 17, title: 'Illmatic', artist: 'Nas', year: 1994, genres: ['Hip-Hop'],
    format: 'LP', status: 'Available', cover_url: null,
    setlist: [
      'The Genesis',
      'N.Y. State of Mind',
      "Life's a Bitch",
      'The World Is Yours',
      'Halftime',
      "Memory Lane (Sittin' in da Park)",
      'One Love',
      'One Time 4 Your Mind',
      'Represent',
      "It Ain't Hard to Tell",
    ],
    description: 'Ten tracks, no filler. A cornerstone of East Coast hip-hop.',
  },
  {
    id: 18, title: 'Lady Soul', artist: 'Aretha Franklin', year: 1968, genres: ['Soul'],
    format: 'LP', status: 'Coming Soon', cover_url: null,
    setlist: null,
    description: 'Includes "(You Make Me Feel Like) A Natural Woman". Enough said.',
  },
]
