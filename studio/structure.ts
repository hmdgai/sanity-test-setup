import type {StructureResolver} from 'sanity/structure'

const SINGLETONS = ['seoSettings', 'trackingCodes', 'contactDetails']

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('SEO Settings')
        .child(S.document().schemaType('seoSettings').documentId('seoSettings')),
      S.listItem()
        .title('Tracking Codes')
        .child(S.document().schemaType('trackingCodes').documentId('trackingCodes')),
      S.listItem()
        .title('Contact Details')
        .child(S.document().schemaType('contactDetails').documentId('contactDetails')),

      S.divider(),

      S.documentTypeListItem('teamMember').title('Team Members'),
      S.documentTypeListItem('testimonial').title('Testimonials'),
      S.documentTypeListItem('faq').title('FAQs'),
      S.documentTypeListItem('location').title('Locations'),
      S.documentTypeListItem('pricingItem').title('Pricing'),
    ])

export {SINGLETONS}
