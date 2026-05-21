import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Location Name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'addressLine1', title: 'Address Line 1', type: 'string'}),
    defineField({name: 'addressLine2', title: 'Address Line 2', type: 'string'}),
    defineField({name: 'city', title: 'City', type: 'string'}),
    defineField({name: 'postcode', title: 'Postcode', type: 'string'}),
    defineField({name: 'country', title: 'Country', type: 'string', initialValue: 'United Kingdom'}),
    defineField({name: 'phone', title: 'Phone', type: 'string'}),
    defineField({name: 'email', title: 'Email', type: 'string'}),
    defineField({
      name: 'googleMapsUrl',
      title: 'Google Maps URL',
      type: 'url',
      description: 'Optional — link to this location on Google Maps',
    }),
    defineField({
      name: 'openingHours',
      title: 'Opening Hours',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {name: 'day', title: 'Day', type: 'string', options: {
            list: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
          }},
          {name: 'hours', title: 'Hours (e.g. "9am – 5pm" or "Closed")', type: 'string'},
        ],
        preview: {select: {title: 'day', subtitle: 'hours'}},
      }],
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'city'},
  },
})
