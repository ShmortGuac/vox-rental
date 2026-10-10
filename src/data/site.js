// Business details and pricing shown across the site. Edit these to match your real info.
export const site = {
  name: 'VOX',
  tagline: 'Vinyl, on rotation.',
  campusName: 'Your University',
  email: 'hello@vox-records.com',
  phone: '+00 000 000 0000',
  instagram: '@vox.records',
  hours: 'Mon – Sun, 10am – 10pm',
  currency: '$',
}

// Every rental includes a turntable + one record of the customer's choice.
// `price` is the total for that length of rental.
export const durations = [
  { id: '1d', label: '1 Day', days: 1, price: 12, blurb: 'A listening night in.' },
  { id: '3d', label: '3 Days', days: 3, price: 30, blurb: 'A long weekend of records.', featured: true },
  { id: '7d', label: '1 Week', days: 7, price: 55, blurb: 'Live with an album properly.' },
]

// Each record beyond the first one included in the rental.
export const extraRecord = { price: 3, per: 'day' }

export const delivery = {
  campus: { label: 'On campus', fee: 0, note: 'Free delivery, setup and pickup anywhere on campus.' },
  offCampus: { label: 'Off campus', fee: 8, note: 'Delivery fee depends on distance. We\'ll confirm the exact fee before your rental.' },
}

export const faqs = [
  {
    q: 'What do I get with a rental?',
    a: 'A turntable and one record of your choice, delivered and set up for you. Want more records, headphones or speakers? Add them on for a small extra cost.',
  },
  {
    q: 'Do I need my own turntable?',
    a: 'Nope. Every rental comes with a turntable — that\'s the whole point.',
  },
  {
    q: 'Do you deliver off campus?',
    a: 'Yes. On-campus delivery is free; off campus we charge a delivery fee based on distance, which we\'ll confirm before your rental starts.',
  },
  {
    q: 'What if something gets damaged?',
    a: 'Normal wear is fine — records are made to be played. If something is seriously damaged we\'ll charge a fair repair or replacement fee, never more than it\'s worth.',
  },
  {
    q: 'Can I extend my rental?',
    a: 'Usually, yes. Message us before your rental ends and we\'ll extend it if nobody has the gear booked.',
  },
]
