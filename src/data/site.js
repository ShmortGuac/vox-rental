// Business details and pricing shown across the site. Edit these to match your real info.
export const site = {
  name: 'VOX',
  tagline: 'Vinyl, on rotation.',
  campusName: 'Your University',
  email: 'hello@vox-records.com',
  phone: '+00 000 000 0000',
  instagram: '@vox.records',
  hours: 'Mon – Sun, 10am – 10pm',
  currency: 'RM',
  // Google Form where visitors can suggest records to stock
  suggestUrl: 'https://forms.gle/GhyToP6gWuQRUSSp9',
}

// Turn sections of the site on/off.
// gear: headphones, speakers etc. as paid add-ons (data lives in the `gear` table).
export const features = {
  gear: false,
}

// Everything is priced per day. Customers can rent à la carte (a turntable, or
// records on their own if they have a turntable) or take the package, which is
// a turntable + 1 record for less than the two separately.
export const pricing = {
  turntable: 35, // turntable on its own, per day
  record: 10, // each record, per day (also the price of each record beyond the package's one)
  package: 40, // turntable + 1 record, per day
}

// Longest rental that can be requested from the site (customers can ask to extend).
export const maxDays = 14

export const delivery = {
  campus: { label: 'On campus', fee: 0, note: 'Free delivery, setup and pickup anywhere on campus.' },
  // No fixed fee off campus: it depends on where the customer is, so it's quoted when confirming the rental.
  offCampus: { label: 'Off campus', note: 'The delivery fee depends on where you are. We\'ll quote it when we confirm your rental.' },
}

const price = (n) => `${site.currency}${n}`

export const faqs = [
  {
    q: 'How does pricing work?',
    a: `Everything is per day. The package — a turntable and one record of your choice — is ${price(pricing.package)}/day. Each extra record is ${price(pricing.record)}/day. You can also rent just a turntable (${price(pricing.turntable)}/day) or just records (${price(pricing.record)}/day each).`,
  },
  {
    q: 'Do I need my own turntable?',
    a: `Nope — rent one with the package. Already have a turntable? Rent records on their own for ${price(pricing.record)}/day each.`,
  },
  {
    q: 'Do you deliver off campus?',
    a: 'Yes. On-campus delivery is free; off campus the delivery fee depends on where you are, and we\'ll quote it before your rental starts.',
  },
  {
    q: 'What if something gets damaged?',
    a: 'Normal wear is fine — records are made to be played. If something is seriously damaged we\'ll charge a fair repair or replacement fee, never more than it\'s worth.',
  },
  {
    q: 'Can I extend my rental?',
    a: 'Usually, yes. Message us before your rental ends and we\'ll extend it if nobody has it booked.',
  },
]
