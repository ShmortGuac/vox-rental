// Sample gear, used only when Supabase isn't connected (see README).
// Fields match the `gear` table in supabase/schema.sql.
// price_per: 'day' (price × rental days) or 'rental' (flat, once per rental)
// icon: headphones, speaker, speakers, cleaning, crate

export const gear = [
  {
    id: 1, name: 'Over-ear Headphones', icon: 'headphones', price: 3, price_per: 'day', quantity: 3, active: true, image_url: null,
    description: 'Closed-back studio headphones. Plugs straight into the turntable — great for dorms.',
  },
  {
    id: 2, name: 'Bluetooth Speaker', icon: 'speaker', price: 4, price_per: 'day', quantity: 2, active: true, image_url: null,
    description: 'Portable and loud enough for a small room. Pairs with the turntable in seconds.',
  },
  {
    id: 3, name: 'Bookshelf Speakers (Pair)', icon: 'speakers', price: 7, price_per: 'day', quantity: 1, active: true, image_url: null,
    description: 'Powered stereo speakers for the full listening experience.',
  },
  {
    id: 4, name: 'Record Cleaning Kit', icon: 'cleaning', price: 2, price_per: 'rental', quantity: 4, active: true, image_url: null,
    description: 'Brush and cleaning fluid to keep records sounding their best.',
  },
  {
    id: 5, name: 'Record Carry Crate', icon: 'crate', price: 2, price_per: 'rental', quantity: 0, active: true, image_url: null,
    description: "Holds up to 20 records. Handy if you're renting a stack.",
  },
]
