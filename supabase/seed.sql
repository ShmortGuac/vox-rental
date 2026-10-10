-- Starter data for VOX. Run AFTER schema.sql (SQL Editor → paste → Run).
-- These are sample records — replace them with your real collection.
-- Running it twice will add duplicates.

insert into public.records (cover_url, title, artist, setlist, description, genre, year, format, condition, status) values
  (null, 'Kind of Blue', 'Miles Davis', 'Side A
So What
Freddie Freeloader
Blue in Green
Side B
All Blues
Flamenco Sketches', 'The best-selling jazz record of all time. Modal, cool and endlessly replayable.', 'Jazz', 1959, 'LP', 'Near Mint', 'available'),
  (null, 'Rumours', 'Fleetwood Mac', 'Side A
Second Hand News
Dreams
Never Going Back Again
Don''t Stop
Go Your Own Way
Songbird
Side B
The Chain
You Make Loving Fun
I Don''t Want to Know
Oh Daddy
Gold Dust Woman', 'Heartbreak, harmonies and some of the best-produced rock ever pressed.', 'Rock', 1977, 'LP', 'Very Good+', 'available'),
  (null, 'Blue', 'Joni Mitchell', 'Side A
All I Want
My Old Man
Little Green
Carey
Blue
Side B
California
This Flight Tonight
River
A Case of You
The Last Time I Saw Richard', 'Confessional songwriting at its most direct. Best heard late at night.', 'Folk', 1971, 'LP', 'Very Good+', 'on_loan'),
  (null, 'Discovery', 'Daft Punk', null, 'Glittering French house. Side A alone is worth the rental.', 'Electronic', 2001, '2xLP', 'Mint', 'available'),
  (null, 'What''s Going On', 'Marvin Gaye', 'Side A
What''s Going On
What''s Happening Brother
Flyin'' High (In the Friendly Sky)
Save the Children
God Is Love
Mercy Mercy Me (The Ecology)
Side B
Right On
Wholy Holy
Inner City Blues (Make Me Wanna Holler)', 'A seamless, socially conscious soul suite that still sounds urgent.', 'Soul', 1971, 'LP', 'Near Mint', 'available'),
  (null, 'Random Access Memories', 'Daft Punk', null, 'Recorded with live session players. Made for a good turntable.', 'Electronic', 2013, '2xLP', 'Mint', 'available'),
  (null, 'A Love Supreme', 'John Coltrane', 'Side A
Part I – Acknowledgement
Part II – Resolution
Side B
Part III – Pursuance
Part IV – Psalm', 'A four-part spiritual statement. Play it front to back.', 'Jazz', 1965, 'LP', 'Very Good+', 'on_loan'),
  (null, 'Abbey Road', 'The Beatles', 'Side A
Come Together
Something
Maxwell''s Silver Hammer
Oh! Darling
Octopus''s Garden
I Want You (She''s So Heavy)
Side B
Here Comes the Sun
Because
You Never Give Me Your Money
Sun King
Mean Mr. Mustard
Polythene Pam
She Came In Through the Bathroom Window
Golden Slumbers
Carry That Weight
The End
Her Majesty', 'The side B medley is one of the great listening experiences on wax.', 'Rock', 1969, 'LP', 'Near Mint', 'available'),
  (null, 'Channel Orange', 'Frank Ocean', null, 'Lush, cinematic R&B. Pyramids alone runs nearly ten minutes.', 'R&B', 2012, '2xLP', 'Mint', 'available'),
  (null, 'Songs in the Key of Life', 'Stevie Wonder', null, 'Stevie at the peak of his powers, across four sides.', 'Soul', 1976, '2xLP', 'Very Good+', 'available'),
  (null, 'Buena Vista Social Club', 'Buena Vista Social Club', null, 'Warm, live-sounding Cuban son. Perfect for a Sunday afternoon.', 'World', 1997, '2xLP', 'Near Mint', 'available'),
  (null, 'In Rainbows', 'Radiohead', '15 Step
Bodysnatchers
Nude
Weird Fishes/Arpeggi
All I Need
Faust Arp
Reckoner
House of Cards
Jigsaw Falling into Place
Videotape', 'Their warmest record, and it sounds great on vinyl.', 'Rock', 2007, 'LP', 'Mint', 'available'),
  (null, 'Pink Moon', 'Nick Drake', 'Side A
Pink Moon
Place to Be
Road
Which Will
Horn
Things Behind the Sun
Side B
Know
Parasite
Free Ride
Harvest Breed
From the Morning', 'Just voice, guitar and a bit of piano. Twenty-eight quiet minutes.', 'Folk', 1972, 'LP', 'Very Good', 'available'),
  (null, 'Selected Ambient Works 85–92', 'Aphex Twin', null, 'Foundational ambient techno. Hazy, melodic and strangely comforting.', 'Electronic', 1992, '2xLP', 'Near Mint', 'on_loan'),
  (null, 'Getz/Gilberto', 'Stan Getz & João Gilberto', 'Side A
The Girl from Ipanema
Doralice
Para Machucar Meu Coração
Desafinado
Side B
Corcovado
Só Danço Samba
O Grande Amor
Vivo Sonhando', 'The record that brought bossa nova to the world.', 'Jazz', 1964, 'LP', 'Very Good+', 'available'),
  (null, 'To Pimp a Butterfly', 'Kendrick Lamar', null, 'Jazz, funk and spoken word woven into a dense, rewarding album.', 'Hip-Hop', 2015, '2xLP', 'Mint', 'available'),
  (null, 'Illmatic', 'Nas', 'The Genesis
N.Y. State of Mind
Life''s a Bitch
The World Is Yours
Halftime
Memory Lane (Sittin'' in da Park)
One Love
One Time 4 Your Mind
Represent
It Ain''t Hard to Tell', 'Ten tracks, no filler. A cornerstone of East Coast hip-hop.', 'Hip-Hop', 1994, 'LP', 'Near Mint', 'available'),
  (null, 'Lady Soul', 'Aretha Franklin', null, 'Includes "(You Make Me Feel Like) A Natural Woman". Enough said.', 'Soul', 1968, 'LP', 'Very Good', 'available');

insert into public.gear (name, description, image_url, icon, price, price_per, quantity, active, sort_order) values
  ('Over-ear Headphones', 'Closed-back studio headphones. Plugs straight into the turntable — great for dorms.', null, 'headphones', 3, 'day', 3, true, 1),
  ('Bluetooth Speaker', 'Portable and loud enough for a small room. Pairs with the turntable in seconds.', null, 'speaker', 4, 'day', 2, true, 2),
  ('Bookshelf Speakers (Pair)', 'Powered stereo speakers for the full listening experience.', null, 'speakers', 7, 'day', 1, true, 3),
  ('Record Cleaning Kit', 'Brush and cleaning fluid to keep records sounding their best.', null, 'cleaning', 2, 'rental', 4, true, 4),
  ('Record Carry Crate', 'Holds up to 20 records. Handy if you''re renting a stack.', null, 'crate', 2, 'rental', 0, true, 5);
