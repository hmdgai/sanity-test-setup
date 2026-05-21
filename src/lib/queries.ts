import {sanityClient} from '../sanity'

export async function getTeamMembers() {
  return sanityClient.fetch(`*[_type == "teamMember"] | order(order asc) {
    _id, name, role, bio, email, linkedin, photo
  }`)
}

export async function getTestimonials() {
  return sanityClient.fetch(`*[_type == "testimonial"] | order(order asc) {
    _id, quote, author, authorRole, rating
  }`)
}

export async function getFaqs() {
  return sanityClient.fetch(`*[_type == "faq"] | order(order asc) {
    _id, question, answer, category
  }`)
}

export async function getLocations() {
  return sanityClient.fetch(`*[_type == "location"] {
    _id, name, addressLine1, addressLine2, city, postcode, country,
    phone, email, googleMapsUrl, openingHours
  }`)
}

export async function getPricing() {
  return sanityClient.fetch(`*[_type == "pricingItem"] | order(order asc) {
    _id, name, description, price, category
  }`)
}

export async function getSeoSettings() {
  return sanityClient.fetch(`*[_type == "seoSettings"][0]`)
}

export async function getTrackingCodes() {
  return sanityClient.fetch(`*[_type == "trackingCodes"][0]`)
}

export async function getContactDetails() {
  return sanityClient.fetch(`*[_type == "contactDetails"][0]`)
}
