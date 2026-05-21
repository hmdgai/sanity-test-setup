import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'trackingCodes',
  title: 'Tracking Codes',
  type: 'document',
  fields: [
    defineField({
      name: 'ga4Id',
      title: 'GA4 Measurement ID',
      type: 'string',
      description: 'e.g. G-XXXXXXXXXX',
    }),
    defineField({
      name: 'gtmId',
      title: 'Google Tag Manager ID',
      type: 'string',
      description: 'e.g. GTM-XXXXXXX',
    }),
    defineField({
      name: 'metaPixelId',
      title: 'Meta Pixel ID',
      type: 'string',
      description: 'e.g. 1234567890123456',
    }),
    defineField({
      name: 'gscVerification',
      title: 'Google Search Console verification',
      type: 'string',
      description: 'The content value from the verification meta tag',
    }),
  ],
})
