// Sample records, used only when Supabase isn't connected (see README).
// Once Supabase is set up, edit records in the Supabase dashboard instead.
// Fields match the `records` table in supabase/schema.sql.

export const vinyls = [
  {
    id: 1, title: 'Kind of Blue', artist: 'Miles Davis', year: 1959, genre: 'Jazz',
    format: 'LP', condition: 'Near Mint', status: 'available', cover_url: null,
    setlist: 'Side A\nSo What\nFreddie Freeloader\nBlue in Green\nSide B\nAll Blues\nFlamenco Sketches',
    description: 'The best-selling jazz record of all time. Modal, cool and endlessly replayable.',
  },
  {
    id: 2, title: 'Rumours', artist: 'Fleetwood Mac', year: 1977, genre: 'Rock',
    format: 'LP', condition: 'Very Good+', status: 'available', cover_url: null,
    setlist: "Side A\nSecond Hand News\nDreams\nNever Going Back Again\nDon't Stop\nGo Your Own Way\nSongbird\nSide B\nThe Chain\nYou Make Loving Fun\nI Don't Want to Know\nOh Daddy\nGold Dust Woman",
    description: 'Heartbreak, harmonies and some of the best-produced rock ever pressed.',
  },
  {
    id: 3, title: 'Blue', artist: 'Joni Mitchell', year: 1971, genre: 'Folk',
    format: 'LP', condition: 'Very Good+', status: 'on_loan', cover_url: null,
    setlist: 'Side A\nAll I Want\nMy Old Man\nLittle Green\nCarey\nBlue\nSide B\nCalifornia\nThis Flight Tonight\nRiver\nA Case of You\nThe Last Time I Saw Richard',
    description: 'Confessional songwriting at its most direct. Best heard late at night.',
  },
  {
    id: 4, title: 'Discovery', artist: 'Daft Punk', year: 2001, genre: 'Electronic',
    format: '2xLP', condition: 'Mint', status: 'available', cover_url: null, setlist: null,
    description: 'Glittering French house. Side A alone is worth the rental.',
  },
  {
    id: 5, title: "What's Going On", artist: 'Marvin Gaye', year: 1971, genre: 'Soul',
    format: 'LP', condition: 'Near Mint', status: 'available', cover_url: null,
    setlist: "Side A\nWhat's Going On\nWhat's Happening Brother\nFlyin' High (In the Friendly Sky)\nSave the Children\nGod Is Love\nMercy Mercy Me (The Ecology)\nSide B\nRight On\nWholy Holy\nInner City Blues (Make Me Wanna Holler)",
    description: 'A seamless, socially conscious soul suite that still sounds urgent.',
  },
  {
    id: 6, title: 'Random Access Memories', artist: 'Daft Punk', year: 2013, genre: 'Electronic',
    format: '2xLP', condition: 'Mint', status: 'available', cover_url: null, setlist: null,
    description: 'Recorded with live session players. Made for a good turntable.',
  },
  {
    id: 7, title: 'A Love Supreme', artist: 'John Coltrane', year: 1965, genre: 'Jazz',
    format: 'LP', condition: 'Very Good+', status: 'on_loan', cover_url: null,
    setlist: 'Side A\nPart I – Acknowledgement\nPart II – Resolution\nSide B\nPart III – Pursuance\nPart IV – Psalm',
    description: 'A four-part spiritual statement. Play it front to back.',
  },
  {
    id: 8, title: 'Abbey Road', artist: 'The Beatles', year: 1969, genre: 'Rock',
    format: 'LP', condition: 'Near Mint', status: 'available', cover_url: null,
    setlist: "Side A\nCome Together\nSomething\nMaxwell's Silver Hammer\nOh! Darling\nOctopus's Garden\nI Want You (She's So Heavy)\nSide B\nHere Comes the Sun\nBecause\nYou Never Give Me Your Money\nSun King\nMean Mr. Mustard\nPolythene Pam\nShe Came In Through the Bathroom Window\nGolden Slumbers\nCarry That Weight\nThe End\nHer Majesty",
    description: 'The side B medley is one of the great listening experiences on wax.',
  },
  {
    id: 9, title: 'Channel Orange', artist: 'Frank Ocean', year: 2012, genre: 'R&B',
    format: '2xLP', condition: 'Mint', status: 'available', cover_url: null, setlist: null,
    description: 'Lush, cinematic R&B. Pyramids alone runs nearly ten minutes.',
  },
  {
    id: 10, title: 'Songs in the Key of Life', artist: 'Stevie Wonder', year: 1976, genre: 'Soul',
    format: '2xLP', condition: 'Very Good+', status: 'available', cover_url: null, setlist: null,
    description: 'Stevie at the peak of his powers, across four sides.',
  },
  {
    id: 11, title: 'Buena Vista Social Club', artist: 'Buena Vista Social Club', year: 1997, genre: 'World',
    format: '2xLP', condition: 'Near Mint', status: 'available', cover_url: null, setlist: null,
    description: 'Warm, live-sounding Cuban son. Perfect for a Sunday afternoon.',
  },
  {
    id: 12, title: 'In Rainbows', artist: 'Radiohead', year: 2007, genre: 'Rock',
    format: 'LP', condition: 'Mint', status: 'available', cover_url: null,
    setlist: '15 Step\nBodysnatchers\nNude\nWeird Fishes/Arpeggi\nAll I Need\nFaust Arp\nReckoner\nHouse of Cards\nJigsaw Falling into Place\nVideotape',
    description: 'Their warmest record, and it sounds great on vinyl.',
  },
  {
    id: 13, title: 'Pink Moon', artist: 'Nick Drake', year: 1972, genre: 'Folk',
    format: 'LP', condition: 'Very Good', status: 'available', cover_url: null,
    setlist: 'Side A\nPink Moon\nPlace to Be\nRoad\nWhich Will\nHorn\nThings Behind the Sun\nSide B\nKnow\nParasite\nFree Ride\nHarvest Breed\nFrom the Morning',
    description: 'Just voice, guitar and a bit of piano. Twenty-eight quiet minutes.',
  },
  {
    id: 14, title: 'Selected Ambient Works 85–92', artist: 'Aphex Twin', year: 1992, genre: 'Electronic',
    format: '2xLP', condition: 'Near Mint', status: 'on_loan', cover_url: null, setlist: null,
    description: 'Foundational ambient techno. Hazy, melodic and strangely comforting.',
  },
  {
    id: 15, title: 'Getz/Gilberto', artist: 'Stan Getz & João Gilberto', year: 1964, genre: 'Jazz',
    format: 'LP', condition: 'Very Good+', status: 'available', cover_url: null,
    setlist: 'Side A\nThe Girl from Ipanema\nDoralice\nPara Machucar Meu Coração\nDesafinado\nSide B\nCorcovado\nSó Danço Samba\nO Grande Amor\nVivo Sonhando',
    description: 'The record that brought bossa nova to the world.',
  },
  {
    id: 16, title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar', year: 2015, genre: 'Hip-Hop',
    format: '2xLP', condition: 'Mint', status: 'available', cover_url: null, setlist: null,
    description: 'Jazz, funk and spoken word woven into a dense, rewarding album.',
  },
  {
    id: 17, title: 'Illmatic', artist: 'Nas', year: 1994, genre: 'Hip-Hop',
    format: 'LP', condition: 'Near Mint', status: 'available', cover_url: null,
    setlist: "The Genesis\nN.Y. State of Mind\nLife's a Bitch\nThe World Is Yours\nHalftime\nMemory Lane (Sittin' in da Park)\nOne Love\nOne Time 4 Your Mind\nRepresent\nIt Ain't Hard to Tell",
    description: 'Ten tracks, no filler. A cornerstone of East Coast hip-hop.',
  },
  {
    id: 18, title: 'Lady Soul', artist: 'Aretha Franklin', year: 1968, genre: 'Soul',
    format: 'LP', condition: 'Very Good', status: 'available', cover_url: null, setlist: null,
    description: 'Includes "(You Make Me Feel Like) A Natural Woman". Enough said.',
  },
]
