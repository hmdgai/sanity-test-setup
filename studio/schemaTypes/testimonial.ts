import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({name: 'quote', title: 'Quote', type: 'text', rows: 4, validation: (r) => r.required()}),
    defineField({name: 'author', title: 'Author Name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'authorRole', title: 'Author Role / Company', type: 'string'}),
    defineField({name: 'rating', title: 'Star Rating (1-5)', type: 'number', validation: (r) => r.min(1).max(5)}),
    defineField({name: 'order', title: 'Display Order', type: 'number'}),
  ],
  orderings: [
    {title: 'Display Order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'author', subtitle: 'quote'},
  },
})
